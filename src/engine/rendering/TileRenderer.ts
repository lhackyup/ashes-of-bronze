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
  public boulderCanvas!: HTMLCanvasElement;

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

    // 4. Photorealistic Geological Mountain Cliffs (Authentic Mediterranean Limestone & Sandstone)
    // 11 Adjacency-Aware Structural Formations x 4 Variations = 44 Autotiled Geological Sprites
    const cliffTypes = [
      'cliff_interior',
      'cliff_wall_s',
      'cliff_wall_n',
      'cliff_wall_w',
      'cliff_wall_e',
      'cliff_corner_sw',
      'cliff_corner_se',
      'cliff_corner_nw',
      'cliff_corner_ne',
      'cliff_prow_s',
      'cliff_spire'
    ];

    cliffTypes.forEach((ctype) => {
      for (let v = 0; v < 4; v++) {
        this.tileCache.set(`${ctype}_${v}`, this.createCliffTile(ctype, v));
      }
    });
    this.tileCache.set('cliff', this.tileCache.get('cliff_interior_0')!);

    // 5. Shimmering Ore Veins: Copper (Malachite), Tin (Cassiterite), Stone (Limestone Quarry), Iron (Hematite)
    const oreTypes = [
      { id: 'vein_copper', cCenter: '#a7f3d0', cMid: '#10b981', cDark: '#064e3b' },
      { id: 'vein_tin',    cCenter: '#ffffff', cMid: '#94a3b8', cDark: '#334155' },
      { id: 'vein_stone',  cCenter: '#f5f5f4', cMid: '#d6d3d1', cDark: '#57534e' },
      { id: 'vein_iron',   cCenter: '#9ca3af', cMid: '#4b5563', cDark: '#111827' }
    ];

    oreTypes.forEach((ore) => {
      // 4 progressive depletion stages:
      // stage 4 (75-100%): 4 nodules / quarried megaliths (rich vein)
      // stage 3 (50-75%): 3 nodules / megaliths + pickaxe fissures
      // stage 2 (25-50%): 2 nodules / megaliths + quarry rubble
      // stage 1 (1-25%): 1 nodule / megalith + deep excavation pit
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

          if (ore.id === 'vein_stone') {
            // Authentic Bronze Age Cyclopean Limestone Quarry & Bedrock Outcrop
            // Stepped megalithic stone blocks, pickaxe wedge clefts, and chisel rubble
            const blocks = [
              { x: 5, y: 6, w: 18, h: 16 },
              { x: 25, y: 7, w: 18, h: 14 },
              { x: 8, y: 24, w: 19, h: 17 },
              { x: 28, y: 23, w: 16, h: 19 }
            ];
            const activeBlocks = blocks.slice(0, stage);
            for (const bl of activeBlocks) {
              // Block cast shadow
              ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
              ctx.fillRect(bl.x + 2, bl.y + 2, bl.w, bl.h);

              // Angular block body with warm limestone gradient
              const bg = ctx.createLinearGradient(bl.x, bl.y, bl.x + bl.w, bl.y + bl.h);
              bg.addColorStop(0, '#f5f5f4');
              bg.addColorStop(0.35, '#d6d3d1');
              bg.addColorStop(0.8, '#a8a29e');
              bg.addColorStop(1, '#57534e');
              ctx.fillStyle = bg;
              ctx.fillRect(bl.x, bl.y, bl.w, bl.h);

              // Beveled sunlit top/left edges
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(bl.x, bl.y + bl.h); ctx.lineTo(bl.x, bl.y); ctx.lineTo(bl.x + bl.w, bl.y);
              ctx.stroke();

              // Shadowed bottom/right edges
              ctx.strokeStyle = '#292524';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(bl.x + bl.w, bl.y); ctx.lineTo(bl.x + bl.w, bl.y + bl.h); ctx.lineTo(bl.x, bl.y + bl.h);
              ctx.stroke();

              // Pickaxe quarry cleft fracture
              ctx.strokeStyle = '#1c1917';
              ctx.lineWidth = 0.9;
              ctx.beginPath();
              ctx.moveTo(bl.x + 4, bl.y + Math.floor(bl.h * 0.45));
              ctx.lineTo(bl.x + bl.w - 4, bl.y + Math.floor(bl.h * 0.55));
              ctx.stroke();
            }

            // Chiseled limestone scree flakes and rubble scattered on the quarry floor
            const rubble = [
              { x: 12, y: 22, w: 3, h: 2 },
              { x: 23, y: 21, w: 4, h: 3 },
              { x: 38, y: 20, w: 3, h: 2.5 },
              { x: 24, y: 39, w: 4, h: 3 }
            ];
            for (const r of rubble) {
              ctx.fillStyle = '#e7e5e4';
              ctx.fillRect(r.x, r.y, r.w, r.h);
            }
          } else {
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
          }
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

    // 8. Natural Mountain Limestone Boulder (54x42 px)
    this.boulderCanvas = makeCanvas(54, 42, (ctx) => {
      // Ground cast shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.beginPath();
      ctx.ellipse(27, 29, 22, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main angular multifaceted limestone boulder
      // Back/shaded facet
      ctx.fillStyle = '#45382b';
      ctx.beginPath();
      ctx.moveTo(9, 25);
      ctx.lineTo(16, 12);
      ctx.lineTo(34, 10);
      ctx.lineTo(46, 20);
      ctx.lineTo(44, 30);
      ctx.lineTo(26, 33);
      ctx.closePath();
      ctx.fill();

      // Main front facet with warm limestone gradient
      const bGrad = ctx.createLinearGradient(16, 10, 40, 32);
      bGrad.addColorStop(0, '#c7b79f');
      bGrad.addColorStop(0.4, '#998771');
      bGrad.addColorStop(1, '#5c4d3b');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.moveTo(11, 26);
      ctx.lineTo(18, 12);
      ctx.lineTo(35, 11);
      ctx.lineTo(39, 23);
      ctx.lineTo(25, 32);
      ctx.closePath();
      ctx.fill();

      // Top sunlit facet catching grazing sunlight
      ctx.fillStyle = '#dfd5c3';
      ctx.beginPath();
      ctx.moveTo(18, 12);
      ctx.lineTo(28, 9);
      ctx.lineTo(36, 11);
      ctx.lineTo(27, 16);
      ctx.closePath();
      ctx.fill();

      // Sharp chiseled facet ridges
      ctx.strokeStyle = '#ede4d4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(18, 12); ctx.lineTo(25, 32);
      ctx.moveTo(18, 12); ctx.lineTo(27, 16); ctx.lineTo(39, 23);
      ctx.stroke();

      // Deep fracture cleft running across rock
      ctx.strokeStyle = '#261e15';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(22, 14); ctx.lineTo(28, 22); ctx.lineTo(26, 31);
      ctx.stroke();

      // Alpine green lichen spot
      ctx.fillStyle = '#55633b';
      ctx.beginPath(); ctx.ellipse(32, 18, 3.5, 2.5, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6f8050';
      ctx.beginPath(); ctx.ellipse(32, 18, 1.8, 1.2, 0.3, 0, Math.PI * 2); ctx.fill();

      // Loose scree pebbles around base
      const pebbles = [
        { x: 10, y: 29, r: 2.2, c: '#7a6954' },
        { x: 15, y: 32, r: 1.8, c: '#524333' },
        { x: 42, y: 29, r: 2.5, c: '#8c7a64' },
        { x: 46, y: 32, r: 1.5, c: '#45382b' }
      ];
      for (const pb of pebbles) {
        ctx.fillStyle = pb.c;
        ctx.beginPath(); ctx.arc(pb.x, pb.y, pb.r, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  private createCliffTile(type: string, v: number): HTMLCanvasElement {
    return makeCanvas(TILE_SIZE, TILE_SIZE, (ctx) => {
      // 1. Deep earthen rock base with natural grain
      const baseCol = v % 2 === 0 ? '#635341' : '#5c4d3b';
      ctx.fillStyle = baseCol;
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

      // Micro-texture of weathered limestone grain & mineral speckles
      for (let i = 0; i < 20; i++) {
        const rx = hash2D(v * 41 + i, i * 19) * TILE_SIZE;
        const ry = hash2D(i * 29, v * 37 + i) * TILE_SIZE;
        const rad = 1.5 + hash2D(i, v) * 3;
        ctx.fillStyle = i % 3 === 0 ? '#7d6c57' : (i % 2 === 0 ? '#42372c' : '#2b231b');
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(rx, ry, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 2. Horizontal Sedimentary Bedding Planes (Taurus limestone strata)
      const strataY = [11 + (v % 3), 23 - (v % 2), 35 + (v % 3)];
      for (const sy of strataY) {
        ctx.strokeStyle = '#231b13';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.bezierCurveTo(14, sy - 1.5, 30, sy + 1.5, TILE_SIZE, sy);
        ctx.stroke();

        // Sunlit top edge highlight of the bedding layer
        ctx.strokeStyle = 'rgba(214, 200, 176, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, sy - 1);
        ctx.bezierCurveTo(14, sy - 2.5, 30, sy + 0.5, TILE_SIZE, sy - 1);
        ctx.stroke();
      }

      // Vertical cross-joints (tectonic relief fissures)
      const jointX1 = 12 + ((v * 7) % 16);
      const jointX2 = 28 + ((v * 11) % 14);
      ctx.strokeStyle = 'rgba(28, 20, 13, 0.7)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(jointX1, 0); ctx.lineTo(jointX1 - 2, 18);
      ctx.moveTo(jointX2, 16); ctx.lineTo(jointX2 + 3, 36);
      ctx.stroke();

      // 3. Formation-Specific 3D Geological Sculpting
      if (type === 'cliff_interior') {
        // High mountain plateau bedrock - massive stratified slabs with weathered fractures
        const slabs = [
          { x: 3, y: 4, w: 22, h: 16, c: '#a3927b' },
          { x: 23, y: 7, w: 22, h: 18, c: '#968670' },
          { x: 5, y: 22, w: 24, h: 20, c: '#8c7d68' },
          { x: 26, y: 24, w: 19, h: 20, c: '#7f715d' }
        ];
        for (const sl of slabs) {
          ctx.fillStyle = sl.c;
          ctx.fillRect(sl.x, sl.y, sl.w, sl.h);

          // Sunlit upper-left beveled facet edges
          ctx.strokeStyle = '#ded3c1';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sl.x, sl.y + sl.h); ctx.lineTo(sl.x, sl.y); ctx.lineTo(sl.x + sl.w, sl.y);
          ctx.stroke();

          // Recessed shadow on lower-right facet
          ctx.strokeStyle = '#21180f';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(sl.x + sl.w, sl.y); ctx.lineTo(sl.x + sl.w, sl.y + sl.h); ctx.lineTo(sl.x, sl.y + sl.h);
          ctx.stroke();
        }

        // Alpine hardy lichen colonies tucked in joints
        ctx.fillStyle = '#4d5937';
        ctx.beginPath(); ctx.ellipse(18, 14, 3, 2, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#65734b';
        ctx.beginPath(); ctx.ellipse(32, 28, 3.5, 2.2, -0.3, 0, Math.PI * 2); ctx.fill();

      } else if (type === 'cliff_wall_s') {
        // Grand vertical sheer south-facing escarpment overlooking canyon floor
        // Plateau top lip (y: 0..12)
        const topLipG = ctx.createLinearGradient(0, 0, 0, 12);
        topLipG.addColorStop(0, '#e5d9c7');
        topLipG.addColorStop(1, '#a6957e');
        ctx.fillStyle = topLipG;
        ctx.fillRect(0, 0, TILE_SIZE, 12);

        // Sheer escarpment face with 3D vertical buttress columns (y: 12..36)
        const faceG = ctx.createLinearGradient(0, 12, 0, 36);
        faceG.addColorStop(0, '#9e8c76');
        faceG.addColorStop(0.5, '#695a47');
        faceG.addColorStop(1, '#362a1e');
        ctx.fillStyle = faceG;
        ctx.fillRect(0, 12, TILE_SIZE, 24);

        // 3 Vertical Rock Buttress Ribs
        for (const bx of [6 + (v % 3) * 2, 22 + (v % 2) * 3, 36]) {
          const bw = 10;
          ctx.fillStyle = 'rgba(235, 225, 210, 0.28)'; // Sunlit western facet of rib
          ctx.fillRect(bx, 12, bw * 0.45, 24);
          ctx.fillStyle = 'rgba(25, 18, 12, 0.55)';    // Shadowed eastern facet of rib
          ctx.fillRect(bx + bw * 0.45, 12, bw * 0.55, 24);

          ctx.strokeStyle = '#ded2be';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bx + bw * 0.45, 12); ctx.lineTo(bx + bw * 0.45, 36);
          ctx.stroke();
        }

        // Terracotta mineral leaching streaks
        ctx.fillStyle = 'rgba(128, 65, 46, 0.4)';
        ctx.fillRect(14 + ((v * 5) % 18), 12, 2.5, 18);
        ctx.fillRect(32, 14, 2, 15);

        // Talus scree apron and ground shadow (y: 36..48)
        const talusG = ctx.createLinearGradient(0, 36, 0, 48);
        talusG.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
        talusG.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
        talusG.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = talusG;
        ctx.fillRect(0, 36, TILE_SIZE, 12);

        // Crumbled fallen scree stones & pebbles scattering into the canyon floor
        const scree = [
          { x: 5, y: 39, r: 3, c: '#7d6c58' },
          { x: 12, y: 44, r: 2.2, c: '#544636' },
          { x: 18, y: 40, r: 3.5, c: '#8c7b66' },
          { x: 26, y: 45, r: 2, c: '#45382b' },
          { x: 33, y: 41, r: 3.8, c: '#806f5b' },
          { x: 41, y: 43, r: 2.5, c: '#5c4e3e' }
        ];
        for (const sc of scree) {
          ctx.fillStyle = sc.c;
          ctx.beginPath();
          ctx.arc(sc.x, sc.y, sc.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#c7baa5';
          ctx.fillRect(sc.x - 1, sc.y - 1, 1.2, 1.2);
        }

      } else if (type === 'cliff_wall_n') {
        // North-facing cliff edge (plateau dropping off into northern abyss)
        ctx.fillStyle = '#1c150e';
        ctx.fillRect(0, 0, TILE_SIZE, 12);
        const nGrad = ctx.createLinearGradient(0, 12, 0, 48);
        nGrad.addColorStop(0, '#5a4b3b');
        nGrad.addColorStop(1, '#8f7e69');
        ctx.fillStyle = nGrad;
        ctx.fillRect(0, 12, TILE_SIZE, 36);

        // Northern rim crest
        ctx.strokeStyle = '#ded3bf';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 12); ctx.lineTo(TILE_SIZE, 12);
        ctx.stroke();

      } else if (type === 'cliff_wall_w') {
        // West-facing escarpment shoulder (catching bright afternoon grazing sun)
        const wGrad = ctx.createLinearGradient(0, 0, 18, 0);
        wGrad.addColorStop(0, '#e5d9c7');
        wGrad.addColorStop(0.4, '#baa891');
        wGrad.addColorStop(1, '#786854');
        ctx.fillStyle = wGrad;
        ctx.fillRect(0, 0, 18, TILE_SIZE);

        ctx.fillStyle = '#7a6a56';
        ctx.fillRect(18, 0, 30, TILE_SIZE);

        // Western shoulder ridge line
        ctx.strokeStyle = '#fff8eb';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(18, 0); ctx.lineTo(18, TILE_SIZE);
        ctx.stroke();

        // Talus gravel along western slope
        for (let y = 6; y < TILE_SIZE; y += 10) {
          ctx.fillStyle = '#4a3d30';
          ctx.beginPath(); ctx.arc(4, y, 2, 0, Math.PI * 2); ctx.fill();
        }

      } else if (type === 'cliff_wall_e') {
        // East-facing escarpment shoulder (deep contrast shadow)
        ctx.fillStyle = '#786955';
        ctx.fillRect(0, 0, 32, TILE_SIZE);

        const eGrad = ctx.createLinearGradient(32, 0, 48, 0);
        eGrad.addColorStop(0, '#544636');
        eGrad.addColorStop(0.5, '#33271c');
        eGrad.addColorStop(1, '#18110b');
        ctx.fillStyle = eGrad;
        ctx.fillRect(32, 0, 16, TILE_SIZE);

        ctx.strokeStyle = '#291f16';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(32, 0); ctx.lineTo(32, TILE_SIZE);
        ctx.stroke();

      } else if (type === 'cliff_corner_sw') {
        // Southwestern Promontory Bastion - sharp sunlit limestone prow!
        const swG = ctx.createLinearGradient(0, 0, 36, 36);
        swG.addColorStop(0, '#ded3bf');
        swG.addColorStop(0.4, '#a89780');
        swG.addColorStop(0.8, '#574837');
        swG.addColorStop(1, '#261c12');
        ctx.fillStyle = swG;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(TILE_SIZE, 0);
        ctx.lineTo(TILE_SIZE, 32);
        ctx.lineTo(24, 38);
        ctx.lineTo(0, 22);
        ctx.closePath();
        ctx.fill();

        // Prow ridge highlight
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(24, 38);
        ctx.stroke();

        // Scree apron curving around SW base
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(14, 40, 16, 7, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7a6a56';
        ctx.fillRect(6, 38, 4, 3);
        ctx.fillRect(16, 42, 3, 2);

      } else if (type === 'cliff_corner_se') {
        // Southeastern Promontory Bastion - south wall meeting east shadow
        ctx.fillStyle = '#96856f';
        ctx.fillRect(0, 0, 30, 28);
        ctx.fillStyle = '#261c12'; // East shadow
        ctx.fillRect(30, 0, 18, 40);
        // South face
        const seG = ctx.createLinearGradient(0, 28, 0, 42);
        seG.addColorStop(0, '#756450');
        seG.addColorStop(1, '#33271c');
        ctx.fillStyle = seG;
        ctx.fillRect(0, 28, 30, 14);

        ctx.strokeStyle = '#e5d9c7';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 28); ctx.lineTo(30, 28); ctx.lineTo(30, 0);
        ctx.stroke();

      } else if (type === 'cliff_corner_nw') {
        // Northwest corner drop-off
        ctx.fillStyle = '#1c150e';
        ctx.fillRect(0, 0, 18, 16);
        ctx.fillStyle = '#8f7f6a';
        ctx.fillRect(18, 16, 30, 32);
        ctx.strokeStyle = '#ded3c1';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(18, 0); ctx.lineTo(18, 16); ctx.lineTo(TILE_SIZE, 16);
        ctx.stroke();

      } else if (type === 'cliff_corner_ne') {
        // Northeast corner drop-off
        ctx.fillStyle = '#1c150e';
        ctx.fillRect(28, 0, 20, 16);
        ctx.fillStyle = '#7a6a57';
        ctx.fillRect(0, 16, 28, 32);
        ctx.strokeStyle = '#c4b49e';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 16); ctx.lineTo(28, 16); ctx.lineTo(28, 0);
        ctx.stroke();

      } else if (type === 'cliff_prow_s') {
        // Narrow limestone spur protruding south (open on W, S, E)
        const pG = ctx.createLinearGradient(8, 0, 40, 40);
        pG.addColorStop(0, '#e5dac7');
        pG.addColorStop(0.4, '#a18f77');
        pG.addColorStop(1, '#2b2116');
        ctx.fillStyle = pG;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(36, 0);
        ctx.lineTo(34, 34);
        ctx.lineTo(24, 40);
        ctx.lineTo(14, 34);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(24, 0); ctx.lineTo(24, 40);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.ellipse(24, 42, 14, 5, 0, 0, Math.PI * 2); ctx.fill();

      } else if (type === 'cliff_spire') {
        // Solitary needle crag rising from canyon bed
        ctx.fillStyle = 'rgba(0,0,0,0.48)';
        ctx.beginPath(); ctx.ellipse(24, 38, 18, 8, 0, 0, Math.PI * 2); ctx.fill();

        const sG = ctx.createLinearGradient(12, 8, 36, 36);
        sG.addColorStop(0, '#e5dac7');
        sG.addColorStop(0.3, '#ab9b83');
        sG.addColorStop(0.7, '#635340');
        sG.addColorStop(1, '#241a11');
        ctx.fillStyle = sG;
        ctx.beginPath();
        ctx.moveTo(24, 6);
        ctx.lineTo(38, 36);
        ctx.lineTo(10, 36);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(24, 6); ctx.lineTo(19, 36);
        ctx.stroke();
      }
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

        if (tileType === 'cliff') {
          // Autotile cliff formations based on 4-neighbor adjacency & hash2D variation
          const nCliff = this.getTile(tx, ty - 1) === 'cliff';
          const sCliff = this.getTile(tx, ty + 1) === 'cliff';
          const wCliff = this.getTile(tx - 1, ty) === 'cliff';
          const eCliff = this.getTile(tx + 1, ty) === 'cliff';
          const v = Math.floor(hash2D(tx, ty) * 4);

          let cliffKey = 'cliff_interior';
          if (!nCliff && !sCliff && !wCliff && !eCliff) {
            cliffKey = 'cliff_spire';
          } else if (!sCliff && !wCliff && !eCliff) {
            cliffKey = 'cliff_prow_s';
          } else if (!sCliff && !wCliff) {
            cliffKey = 'cliff_corner_sw';
          } else if (!sCliff && !eCliff) {
            cliffKey = 'cliff_corner_se';
          } else if (!sCliff) {
            cliffKey = 'cliff_wall_s';
          } else if (!nCliff && !wCliff) {
            cliffKey = 'cliff_corner_nw';
          } else if (!nCliff && !eCliff) {
            cliffKey = 'cliff_corner_ne';
          } else if (!nCliff) {
            cliffKey = 'cliff_wall_n';
          } else if (!wCliff) {
            cliffKey = 'cliff_wall_w';
          } else if (!eCliff) {
            cliffKey = 'cliff_wall_e';
          } else {
            cliffKey = 'cliff_interior';
          }

          tileImg = this.tileCache.get(`${cliffKey}_${v}`) || this.tileCache.get('cliff');
        } else if (tileType.startsWith('vein_')) {
          veinRes = this.getVeinReserve(tx, ty);
          if (veinRes) {
            const ratio = Math.max(0, Math.min(1, veinRes.current / veinRes.max));
            const stage = Math.max(1, Math.min(4, Math.ceil(ratio * 4)));
            tileImg = this.tileCache.get(`${tileType}_${stage}`) || tileImg;
          }
        } else if (!tileImg) {
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
