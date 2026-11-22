import { Camera2D } from '../camera/Camera2D.ts';
import { TILE_SIZE, TERRAINS } from '../../data/terrain.ts';
import { TerrainType } from '../../data/types.ts';
import { GridGraph } from '../pathfinding/GridGraph.ts';

export interface VeinReserve {
  current: number;
  max: number;
  type: 'copper' | 'tin' | 'stone' | 'iron';
}

function hash2D(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function makeCanvas(w: number, h: number, drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  drawFn(ctx);
  return c;
}

export class TileRenderer {
  public readonly width: number;
  public readonly height: number;
  private mapTiles: TerrainType[];
  private tileCache: Map<string, HTMLCanvasElement> = new Map();
  private veinReserves: Map<string, VeinReserve> = new Map();
  public cedarTreeCanvas!: HTMLCanvasElement;
  public cedarStumpCanvas!: HTMLCanvasElement;

  constructor(width: number, height: number, initialTerrain: TerrainType = 'plain') {
    this.width = width;
    this.height = height;
    this.mapTiles = new Array(width * height).fill(initialTerrain);
    this.initPatterns();
  }

  public setTile(tx: number, ty: number, type: TerrainType, reserveAmount?: number): void {
    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
      this.mapTiles[ty * this.width + tx] = type;
      const key = `${tx},${ty}`;
      if (type.startsWith('vein_')) {
        const oreType = type.replace('vein_', '') as 'copper' | 'tin' | 'stone' | 'iron';
        const defaultTotal = oreType === 'copper' ? 600 : (oreType === 'tin' ? 300 : (oreType === 'stone' ? 800 : 800));
        const max = reserveAmount ?? (TERRAINS[type]?.resourceYield?.totalAmount ?? defaultTotal);
        this.veinReserves.set(key, { current: max, max, type: oreType });
      } else {
        this.veinReserves.delete(key);
      }
    }
  }

  public getVeinReserve(tx: number, ty: number): VeinReserve | null {
    return this.veinReserves.get(`${tx},${ty}`) || null;
  }

  public harvestVein(tx: number, ty: number, amount: number): { harvested: number; remaining: number; depleted: boolean } {
    const key = `${tx},${ty}`;
    const res = this.veinReserves.get(key);
    if (!res || res.current <= 0) {
      return { harvested: 0, remaining: 0, depleted: true };
    }
    const harvested = Math.min(amount, res.current);
    res.current -= harvested;
    if (res.current <= 0) {
      res.current = 0;
      this.veinReserves.delete(key);
      this.mapTiles[ty * this.width + tx] = 'plain';
      return { harvested, remaining: 0, depleted: true };
    }
    return { harvested, remaining: res.current, depleted: false };
  }

  public getTile(tx: number, ty: number): TerrainType {
    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
      return this.mapTiles[ty * this.width + tx];
    }
    return 'cliff';
  }

  private initPatterns(): void {
    // 1. Organic Multi-Variant Biome Ground Tiles (4 variations per biome using hash2D)
    const biomePalettes = [
      { base: '#7d6e53', hi: '#948465', lo: '#635641', soil: '#544733' }, // Arid Levantine Plain
      { base: '#b59765', hi: '#c7ab7b', lo: '#9e8152', soil: '#856a40' }, // Coastal Dunes / Sand
      { base: '#5c6e43', hi: '#738756', lo: '#455430', soil: '#3b4528' }  // Alluvial Oasis / Riverbank
    ];

    biomePalettes.forEach((pal, bIdx) => {
      for (let v = 0; v < 4; v++) {
        const c = makeCanvas(TILE_SIZE, TILE_SIZE, (ctx) => {
          ctx.fillStyle = pal.base;
          ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

          // Natural organic soil speckles
          for (let i = 0; i < 28; i++) {
            const rx = hash2D(v * 31 + i, bIdx * 17) * TILE_SIZE;
            const ry = hash2D(bIdx * 23, v * 47 + i) * TILE_SIZE;
            const rad = 2 + hash2D(i, v) * 5;
            ctx.fillStyle = i % 3 === 0 ? pal.hi : (i % 3 === 1 ? pal.lo : pal.soil);
            ctx.globalAlpha = 0.35;
            ctx.beginPath();
            ctx.arc(rx, ry, rad, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1.0;

          // Organic scrub & grass blades
          ctx.strokeStyle = pal.hi;
          ctx.lineWidth = 1;
          for (let i = 0; i < 8; i++) {
            const gx = 4 + hash2D(i * 3, v + bIdx) * (TILE_SIZE - 8);
            const gy = 6 + hash2D(v + bIdx, i * 7) * (TILE_SIZE - 10);
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx - 1.5, gy - 4);
            ctx.moveTo(gx + 2, gy);
            ctx.lineTo(gx + 3.5, gy - 3.5);
            ctx.stroke();
          }
        });
        this.tileCache.set(`plain_${bIdx}_${v}`, c);
      }
    });

    // 2. Coastal Deep Water with shimmering wave bezier curves
    this.tileCache.set('water', makeCanvas(TILE_SIZE, TILE_SIZE, (ctx) => {
      const wGrad = ctx.createLinearGradient(0, 0, TILE_SIZE, TILE_SIZE);
      wGrad.addColorStop(0, '#1d4e78');
      wGrad.addColorStop(0.5, '#276599');
      wGrad.addColorStop(1, '#184266');
      ctx.fillStyle = wGrad;
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

      ctx.strokeStyle = 'rgba(165, 225, 255, 0.28)';
      ctx.lineWidth = 1.5;
      for (let y = 8; y < TILE_SIZE; y += 12) {
        ctx.beginPath();
        ctx.moveTo(4, y);
        ctx.bezierCurveTo(16, y - 3, 30, y + 3, 44, y);
        ctx.stroke();
      }
    }));

    // 3. Cyclopean Foundation Slabs (4 beveled stone blocks with highlights and shadows)
    this.tileCache.set('slab', makeCanvas(TILE_SIZE, TILE_SIZE, (ctx) => {
      ctx.fillStyle = '#695f55';
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

      const blocks = [
        [1, 1, 22, 22], [25, 1, 22, 22],
        [1, 25, 22, 22], [25, 25, 22, 22]
      ];
      blocks.forEach(([x, y, w, h]) => {
        const g = ctx.createLinearGradient(x, y, x + w, y + h);
        g.addColorStop(0, '#a89f96');
        g.addColorStop(1, '#6e665f');
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = '#c4bbb1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + h); ctx.lineTo(x, y); ctx.lineTo(x + w, y);
        ctx.stroke();

        ctx.strokeStyle = '#3d3833';
        ctx.beginPath();
        ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h);
        ctx.stroke();
      });
    }));

    // 4. Rocky Cliff Outcrop
    this.tileCache.set('cliff', makeCanvas(TILE_SIZE, TILE_SIZE, (ctx) => {
      ctx.fillStyle = '#4a4238';
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(26, 28, 21, 17, 0, 0, Math.PI * 2); ctx.fill();

      const rGrad = ctx.createLinearGradient(6, 4, 42, 42);
      rGrad.addColorStop(0, '#9c8e7e');
      rGrad.addColorStop(0.5, '#6e6254');
      rGrad.addColorStop(1, '#3b332b');
      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.moveTo(8, 36); ctx.lineTo(6, 16); ctx.lineTo(20, 6);
      ctx.lineTo(38, 10); ctx.lineTo(43, 30); ctx.lineTo(28, 42);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255,245,230,0.22)';
      ctx.beginPath();
      ctx.moveTo(10, 18); ctx.lineTo(20, 8); ctx.lineTo(32, 14); ctx.lineTo(20, 24);
      ctx.closePath();
      ctx.fill();
    }));

    // 5. Shimmering Ore Veins: Copper (Malachite), Tin (Cassiterite), Stone (Limestone), Iron (Hematite)
    const oreTypes = [
      { id: 'vein_copper', cCenter: '#a7f3d0', cMid: '#10b981', cDark: '#064e3b' },
      { id: 'vein_tin',    cCenter: '#ffffff', cMid: '#94a3b8', cDark: '#334155' },
      { id: 'vein_stone',  cCenter: '#f5f5f4', cMid: '#d6d3d1', cDark: '#57534e' },
      { id: 'vein_iron',   cCenter: '#9ca3af', cMid: '#4b5563', cDark: '#111827' }
    ];

    oreTypes.forEach((ore) => {
      // 4 progressive depletion stages:
      // stage 4 (75-100%): 4 nodules (rich vein)
      // stage 3 (50-75%): 3 nodules + slight pickaxe fissures
      // stage 2 (25-50%): 2 nodules + quarry rubble
      // stage 1 (1-25%): 1 nodule + deep excavation pit
      for (let stage = 1; stage <= 4; stage++) {
        this.tileCache.set(`${ore.id}_${stage}`, makeCanvas(TILE_SIZE, TILE_SIZE, (ctx) => {
          ctx.fillStyle = '#5c4d3c';
          ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

          ctx.fillStyle = '#786652';
          ctx.beginPath();
          ctx.ellipse(24, 24, 21, 18, 0.2, 0, Math.PI * 2);
          ctx.fill();

          // Pickaxe excavation / rubble cracks if partially mined
          if (stage < 4) {
            ctx.strokeStyle = '#2d2218';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(14, 20); ctx.lineTo(24, 26); ctx.lineTo(34, 18);
            if (stage <= 2) {
              ctx.moveTo(20, 14); ctx.lineTo(28, 34);
            }
            ctx.stroke();

            // Rubble dust around excavation
            ctx.fillStyle = 'rgba(40, 30, 20, 0.45)';
            ctx.fillRect(12, 12, 10, 8);
          }

          const allNodes = [
            { x: 15, y: 16, r: 7 },
            { x: 31, y: 19, r: 8 },
            { x: 21, y: 31, r: 7 },
            { x: 34, y: 32, r: 5 }
          ];
          const activeNodes = allNodes.slice(0, stage);
          activeNodes.forEach(n => {
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.beginPath(); ctx.arc(n.x + 2, n.y + 2, n.r, 0, Math.PI * 2); ctx.fill();

            const g = ctx.createRadialGradient(n.x - 2, n.y - 2, 1, n.x, n.y, n.r);
            g.addColorStop(0, ore.cCenter);
            g.addColorStop(0.45, ore.cMid);
            g.addColorStop(1, ore.cDark);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
          });
        }));
      }
      this.tileCache.set(ore.id, this.tileCache.get(`${ore.id}_4`)!);
    });

    // Depleted quarry rubble pit
    this.tileCache.set('vein_depleted', makeCanvas(TILE_SIZE, TILE_SIZE, (ctx) => {
      ctx.fillStyle = '#635543';
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#453a2d';
      ctx.beginPath();
      ctx.ellipse(24, 24, 18, 14, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a6b57';
      ctx.fillRect(16, 20, 4, 3);
      ctx.fillRect(26, 24, 5, 4);
      ctx.fillRect(20, 28, 3, 3);
      ctx.fillRect(30, 18, 4, 3);
    }));

    // 6. Majestic Ancient Mediterranean / Lebanese Cedar Sprite (80x84 px)
    // Characteristic tiered horizontal umbrella-like boughs and flat tabular crown of Cedrus libani
    this.cedarTreeCanvas = makeCanvas(80, 84, (ctx) => {
      // Sprawling Ground Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.beginPath();
      ctx.ellipse(42, 74, 30, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ancient Gnarled Cedar Trunk & Buttress Roots
      ctx.fillStyle = '#26170d'; // Deep bark crevices
      ctx.beginPath();
      ctx.moveTo(33, 75);
      ctx.lineTo(36, 50);
      ctx.lineTo(38, 28);
      ctx.lineTo(43, 28);
      ctx.lineTo(45, 50);
      ctx.lineTo(49, 75);
      ctx.closePath();
      ctx.fill();

      // Bark highlight & texture
      ctx.fillStyle = '#4a2f1b';
      ctx.fillRect(36, 42, 7, 28);
      ctx.fillStyle = '#63422a';
      ctx.fillRect(38, 48, 3, 20);

      // Horizontal Branch Arm Structure (supporting flat needle shelves)
      ctx.strokeStyle = '#2d1a0d';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      // Lower major limbs
      ctx.moveTo(37, 56); ctx.lineTo(14, 55);
      ctx.moveTo(43, 56); ctx.lineTo(66, 55);
      // Mid limbs
      ctx.moveTo(38, 43); ctx.lineTo(18, 41);
      ctx.moveTo(43, 43); ctx.lineTo(62, 41);
      // Upper limbs
      ctx.moveTo(39, 31); ctx.lineTo(24, 28);
      ctx.moveTo(42, 31); ctx.lineTo(56, 28);
      ctx.stroke();

      // HELPER: Draws authentic flat tiered horizontal needle shelf (Lebanese cedar bough)
      const drawCedarShelf = (
        bx: number,
        by: number,
        w: number,
        h: number,
        cShade: string,
        cMid: string,
        cLight: string
      ) => {
        // Deep shadow base of the shelf
        ctx.fillStyle = cShade;
        ctx.beginPath();
        ctx.ellipse(bx + w / 2, by + h * 0.7, w / 2, h * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main dense evergreen needle body
        ctx.fillStyle = cMid;
        ctx.beginPath();
        ctx.ellipse(bx + w / 2, by + h * 0.45, w * 0.48, h * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sunlit flat upper plate of needles
        ctx.fillStyle = cLight;
        ctx.beginPath();
        ctx.ellipse(bx + w / 2, by + h * 0.25, w * 0.42, h * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Micro-fringes along the flat shelf edge
        ctx.fillStyle = cLight;
        const step = Math.max(3, Math.floor(w / 8));
        for (let ox = 4; ox < w - 4; ox += step) {
          ctx.fillRect(bx + ox, by + h * 0.15, step - 1, 2.5);
        }
      };

      // TIER 1 (Lowest, spreading widest across the mountain slope)
      drawCedarShelf(6, 49, 36, 12, '#0f1f14', '#1b3823', '#2d5a39');
      drawCedarShelf(38, 48, 36, 13, '#0f1f14', '#1b3823', '#346641');

      // TIER 2 (Middle-lower stepped horizontal shelves)
      drawCedarShelf(11, 36, 32, 11, '#112217', '#1f4028', '#386f46');
      drawCedarShelf(36, 34, 34, 12, '#112217', '#1f4028', '#407a4f');

      // TIER 3 (Middle-upper boughs)
      drawCedarShelf(16, 23, 28, 10, '#13261a', '#244b2f', '#468656');
      drawCedarShelf(36, 22, 28, 10, '#13261a', '#244b2f', '#4d925e');

      // TIER 4 (Distinctive Flat Tabular Crown of mature Cedrus libani)
      drawCedarShelf(22, 12, 36, 9, '#152b1d', '#285434', '#59a36d');
      // Crown flat crest
      ctx.fillStyle = '#6ab87f';
      ctx.beginPath();
      ctx.ellipse(40, 14, 14, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Upright Cedar Cones on upper branches
      ctx.fillStyle = '#603813';
      ctx.fillRect(29, 19, 3, 5);
      ctx.fillRect(49, 18, 3, 5);
      ctx.fillRect(35, 9, 3, 4.5);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(29.5, 18, 2, 2);
      ctx.fillRect(49.5, 17, 2, 2);
    });

    // 7. Felled Cedar Tree Stump Sprite (64x48 px)
    this.cedarStumpCanvas = makeCanvas(64, 48, (ctx) => {
      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(32, 34, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Cut stump base with roots
      ctx.fillStyle = '#2d1a0d';
      ctx.beginPath();
      ctx.moveTo(20, 36);
      ctx.lineTo(24, 22);
      ctx.lineTo(40, 22);
      ctx.lineTo(44, 36);
      ctx.closePath();
      ctx.fill();
      // Bark texture
      ctx.fillStyle = '#4a2f1b';
      ctx.fillRect(25, 23, 14, 11);
      // Annual growth rings on top face
      ctx.fillStyle = '#c79d6e';
      ctx.beginPath();
      ctx.ellipse(32, 22, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#855228';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(32, 22, 6, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#593214';
      ctx.beginPath(); ctx.arc(32, 22, 1.5, 0, Math.PI * 2); ctx.fill();
      // Woodchips scattered around
      ctx.fillStyle = '#eab308';
      ctx.fillRect(16, 32, 3, 2);
      ctx.fillRect(43, 31, 3, 2);
      ctx.fillRect(26, 37, 4, 2);
      ctx.fillRect(36, 36, 3, 1.5);
    });
  }

  public render(
    ctx: CanvasRenderingContext2D,
    camera: Camera2D,
    graph: GridGraph
  ): void {
    const startTileX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const startTileY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endTileX = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth / camera.zoom) / TILE_SIZE));
    const endTileY = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight / camera.zoom) / TILE_SIZE));

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tileType = this.getTile(tx, ty);
        const wx = tx * TILE_SIZE;
        const wy = ty * TILE_SIZE;

        let tileImg = this.tileCache.get(tileType);
        let veinRes: VeinReserve | null = null;

        if (tileType.startsWith('vein_')) {
          veinRes = this.getVeinReserve(tx, ty);
          if (veinRes) {
            const ratio = Math.max(0, Math.min(1, veinRes.current / veinRes.max));
            const stage = Math.max(1, Math.min(4, Math.ceil(ratio * 4)));
            tileImg = this.tileCache.get(`${tileType}_${stage}`) || tileImg;
          }
        }

        if (!tileImg) {
          // Plain / Sand terrain uses organic hash2D multi-variant tiles
          const bIdx = tileType === 'sand' ? 1 : 0;
          const v = Math.floor(hash2D(tx, ty) * 4);
          tileImg = this.tileCache.get(`plain_${bIdx}_${v}`);
        }

        if (tileImg) {
          ctx.drawImage(tileImg, wx, wy, TILE_SIZE, TILE_SIZE);
        }

        // Render discrete remaining reserve bar on harvested veins
        if (veinRes && veinRes.current < veinRes.max && veinRes.current > 0) {
          const barW = 30;
          const barH = 3;
          const bx = wx + Math.floor((TILE_SIZE - barW) / 2);
          const by = wy + TILE_SIZE - 5;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
          const fillW = Math.max(1, Math.floor((veinRes.current / veinRes.max) * barW));
          ctx.fillStyle = veinRes.type === 'copper' ? '#2de0a5' : (veinRes.type === 'tin' ? '#c0c6cc' : (veinRes.type === 'stone' ? '#e2e8f0' : '#e07a5f'));
          ctx.fillRect(bx, by, fillW, barH);
        }

        // Draw Foundation Slab if present
        if (graph.hasFoundation(tx, ty)) {
          const slabImg = this.tileCache.get('slab');
          if (slabImg) {
            ctx.drawImage(slabImg, wx, wy, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }
}
