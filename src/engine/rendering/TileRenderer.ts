import { Camera2D } from '../camera/Camera2D.ts';
import { TERRAINS, TILE_SIZE } from '../../data/terrain.ts';
import { TerrainType } from '../../data/types.ts';
import { GridGraph } from '../pathfinding/GridGraph.ts';

export class TileRenderer {
  public readonly width: number;
  public readonly height: number;
  private mapTiles: TerrainType[];
  private tileCache: Map<string, HTMLCanvasElement> = new Map();

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
    for (const [id, def] of Object.entries(TERRAINS)) {
      const c = document.createElement('canvas');
      c.width = TILE_SIZE;
      c.height = TILE_SIZE;
      const ctx = c.getContext('2d')!;

      // Colore base
      ctx.fillStyle = def.color;
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

      // Texture e noise SVGA procedurale
      if (id === 'plain') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let i = 0; i < 16; i++) {
          const rx = (i * 17) % TILE_SIZE;
          const ry = (i * 29) % TILE_SIZE;
          ctx.fillRect(rx, ry, 2, 2);
        }
      } else if (id === 'sand') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        for (let i = 0; i < 20; i++) {
          const rx = (i * 13) % TILE_SIZE;
          const ry = (i * 31) % TILE_SIZE;
          ctx.fillRect(rx, ry, 1, 1);
        }
      } else if (id === 'water') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(4, 12, 16, 2);
        ctx.fillRect(24, 28, 18, 2);
        ctx.fillRect(8, 40, 14, 2);
      } else if (id === 'vein_tin') {
        // Nodi di cassiterite scintillante
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14, 14, 6, 6);
        ctx.fillRect(26, 24, 8, 8);
        ctx.fillStyle = '#616870';
        ctx.strokeRect(13, 13, 8, 8);
        ctx.strokeRect(25, 23, 10, 10);
      } else if (id === 'vein_copper') {
        // Nodi di malachite verde/azzurra
        ctx.fillStyle = '#2de0a5';
        ctx.fillRect(12, 16, 7, 7);
        ctx.fillRect(28, 20, 6, 6);
        ctx.fillStyle = '#1c5e47';
        ctx.strokeRect(11, 15, 9, 9);
      } else if (id === 'vein_iron') {
        // Blocchi squadrati di ematite scura
        ctx.fillStyle = '#5c4843';
        ctx.fillRect(10, 12, 10, 10);
        ctx.fillRect(24, 22, 12, 10);
        ctx.fillStyle = '#171312';
        ctx.strokeRect(9, 11, 12, 12);
      }

      // Bordi di rilievo sottili stile SVGA
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);

      this.tileCache.set(id, c);
    }

    // Pattern speciale per Terrapieno Ciclopico (Fondamenta megalitiche)
    const slabC = document.createElement('canvas');
    slabC.width = TILE_SIZE;
    slabC.height = TILE_SIZE;
    const sctx = slabC.getContext('2d')!;
    sctx.fillStyle = '#8a7d6b';
    sctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // Giunture megalitiche poligonali a secco
    sctx.strokeStyle = '#3d3429';
    sctx.lineWidth = 2;
    sctx.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
    sctx.beginPath();
    sctx.moveTo(0, TILE_SIZE / 2);
    sctx.lineTo(TILE_SIZE, TILE_SIZE / 2);
    sctx.moveTo(TILE_SIZE / 2, 0);
    sctx.lineTo(TILE_SIZE / 2, TILE_SIZE);
    sctx.stroke();
    // Bordo bronzo antico
    sctx.strokeStyle = '#b8944d';
    sctx.lineWidth = 1;
    sctx.strokeRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);

    this.tileCache.set('cyclopean_slab', slabC);
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

    const drawSize = TILE_SIZE * camera.zoom;

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tileType = this.getTile(tx, ty);
        const tileImg = this.tileCache.get(tileType);
        const screenPos = camera.worldToScreen(tx * TILE_SIZE, ty * TILE_SIZE);

        if (tileImg) {
          ctx.drawImage(tileImg, screenPos.x, screenPos.y, drawSize + 0.5, drawSize + 0.5);
        }

        // Se è presente un terrapieno ciclopico, disegnalo sopra il terreno
        if (graph.hasFoundation(tx, ty)) {
          const slabImg = this.tileCache.get('cyclopean_slab');
          if (slabImg) {
            ctx.drawImage(slabImg, screenPos.x, screenPos.y, drawSize, drawSize);
          }
        }
      }
    }
  }
}
