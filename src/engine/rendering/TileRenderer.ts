import { Camera2D } from '../camera/Camera2D.ts';
import { TILE_SIZE } from '../../data/terrain.ts';
import { TerrainType } from '../../data/types.ts';
import { GridGraph } from '../pathfinding/GridGraph.ts';

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
  public cedarTreeCanvas!: HTMLCanvasElement;

  constructor(width: number, height: number, initialTerrain: TerrainType = 'plain') {
    this.width = width;
    this.height = height;
    this.mapTiles = new Array(width * height).fill(initialTerrain);
    this.initPatterns();
  }

  public setTile(tx: number, ty: number, type: TerrainType): void {
    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
      this.mapTiles[ty * this.width + tx] = type;
    }
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

    // 5. Shimmering Ore Veins: Copper (Malachite), Tin (Cassiterite), Iron (Hematite)
    const oreTypes = [
      { id: 'vein_copper', cCenter: '#a7f3d0', cMid: '#10b981', cDark: '#064e3b' },
      { id: 'vein_tin',    cCenter: '#ffffff', cMid: '#94a3b8', cDark: '#334155' },
      { id: 'vein_iron',   cCenter: '#9ca3af', cMid: '#4b5563', cDark: '#111827' }
    ];

    oreTypes.forEach((ore) => {
      this.tileCache.set(ore.id, makeCanvas(TILE_SIZE, TILE_SIZE, (ctx) => {
        ctx.fillStyle = '#5c4d3c';
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

        ctx.fillStyle = '#786652';
        ctx.beginPath();
        ctx.ellipse(24, 24, 21, 18, 0.2, 0, Math.PI * 2);
        ctx.fill();

        const nodes = [
          { x: 15, y: 16, r: 7 }, { x: 31, y: 19, r: 8 },
          { x: 21, y: 31, r: 7 }, { x: 34, y: 32, r: 5 }
        ];
        nodes.forEach(n => {
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
    });

    // 6. Mediterranean Cedar / Cypress Tree Sprite (48x64 px)
    this.cedarTreeCanvas = makeCanvas(48, 64, (ctx) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(30, 56, 14, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Trunk
      ctx.fillStyle = '#4a3219';
      ctx.fillRect(21, 46, 5, 11);

      // Lush foliage with natural gradient
      const grad = ctx.createLinearGradient(14, 8, 32, 50);
      grad.addColorStop(0, '#588157');
      grad.addColorStop(0.5, '#3a5a40');
      grad.addColorStop(1, '#1b2a1a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(23.5, 6);
      ctx.bezierCurveTo(34, 22, 35, 44, 23.5, 48);
      ctx.bezierCurveTo(12, 44, 13, 22, 23.5, 6);
      ctx.fill();
    });
  }

  public render(
    ctx: CanvasRenderingContext2D,
    camera: Camera2D,
    graph: GridGraph
  ): void {
    const startTileX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const startTileY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endTileX = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth) / TILE_SIZE));
    const endTileY = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight) / TILE_SIZE));

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tileType = this.getTile(tx, ty);
        const screenPos = camera.worldToScreen(tx * TILE_SIZE, ty * TILE_SIZE);
        const drawX = Math.floor(screenPos.x);
        const drawY = Math.floor(screenPos.y);

        let tileImg = this.tileCache.get(tileType);
        if (!tileImg) {
          // Plain / Sand terrain uses organic hash2D multi-variant tiles
          const bIdx = tileType === 'sand' ? 1 : 0;
          const v = Math.floor(hash2D(tx, ty) * 4);
          tileImg = this.tileCache.get(`plain_${bIdx}_${v}`);
        }

        if (tileImg) {
          ctx.drawImage(tileImg, drawX, drawY, TILE_SIZE, TILE_SIZE);
        }

        // Draw Foundation Slab if present
        if (graph.hasFoundation(tx, ty)) {
          const slabImg = this.tileCache.get('slab');
          if (slabImg) {
            ctx.drawImage(slabImg, drawX, drawY, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }
}
