import { Camera2D } from '../camera/Camera2D.ts';
import { TERRAINS, TILE_SIZE } from '../../data/terrain.ts';
import { TerrainType } from '../../data/types.ts';
import { GridGraph } from '../pathfinding/GridGraph.ts';
import { SVGAProceduralBank } from './SVGAProceduralBank.ts';

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
      ctx.imageSmoothingEnabled = false;

      // Base Dune II terrain color
      ctx.fillStyle = def.color;
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

      if (id === 'plain') {
        // Dune II mustard sand with 1px dithered ripple lines
        ctx.fillStyle = '#e8b76e';
        ctx.fillRect(4, 6, 6, 1);
        ctx.fillRect(14, 16, 7, 1);
        ctx.fillStyle = '#b88339';
        ctx.fillRect(5, 7, 5, 1);
        ctx.fillRect(15, 17, 6, 1);
      } else if (id === 'sand') {
        // Soft rolling dunes
        ctx.fillStyle = '#d49b4d';
        ctx.fillRect(2, 4, 10, 1);
        ctx.fillRect(10, 14, 12, 1);
        ctx.fillStyle = '#a6732e';
        ctx.fillRect(3, 5, 9, 1);
      } else if (id === 'cliff') {
        // Dune II dark rock plateau with 1px bevel border
        ctx.fillStyle = '#4a3d31';
        ctx.fillRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
        ctx.fillStyle = '#615041';
        ctx.fillRect(1, 1, TILE_SIZE - 2, 1);
        ctx.fillRect(1, 1, 1, TILE_SIZE - 2);
        ctx.fillStyle = '#261f18';
        ctx.fillRect(1, TILE_SIZE - 2, TILE_SIZE - 2, 1);
        ctx.fillRect(TILE_SIZE - 2, 1, 1, TILE_SIZE - 2);
      } else if (id === 'water') {
        // Deep blue ocean with wave crests
        ctx.fillStyle = '#29639c';
        ctx.fillRect(3, 5, 8, 1);
        ctx.fillRect(13, 15, 9, 1);
        ctx.fillStyle = '#8ec5f5';
        ctx.fillRect(5, 6, 4, 1);
      } else if (id === 'vein_copper') {
        // Sparkling green malachite spice field (Dune II spice aesthetic)
        ctx.fillStyle = '#1e7a4d';
        ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#2de0a5';
        ctx.fillRect(5, 5, 4, 4);
        ctx.fillRect(14, 12, 5, 4);
        ctx.fillStyle = '#80ffdb';
        ctx.fillRect(6, 6, 2, 2);
        ctx.fillRect(15, 13, 2, 2);
      } else if (id === 'vein_tin') {
        // Sparkling silver cassiterite spice field
        ctx.fillStyle = '#64748b';
        ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(4, 6, 5, 4);
        ctx.fillRect(13, 14, 6, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(5, 7, 2, 2);
        ctx.fillRect(14, 15, 2, 2);
      } else if (id === 'vein_iron') {
        // Deep dark iron ore bed
        ctx.fillStyle = '#171413';
        ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#544d49';
        ctx.fillRect(6, 5, 5, 5);
        ctx.fillRect(13, 13, 6, 5);
      }

      this.tileCache.set(id, c);
    }
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
        const tileImg = this.tileCache.get(tileType);
        const screenPos = camera.worldToScreen(tx * TILE_SIZE, ty * TILE_SIZE);
        const drawX = Math.round(screenPos.x);
        const drawY = Math.round(screenPos.y);

        if (tileImg) {
          ctx.drawImage(tileImg, drawX, drawY, TILE_SIZE, TILE_SIZE);
        }

        // Dune II Concrete Slabs Layer
        if (graph.hasFoundation(tx, ty)) {
          const slabSprite = SVGAProceduralBank.getBuildingSprite('cyclopean_slab', 'player');
          if (slabSprite) {
            // Draw a single 24x24 tile quadrant of slab
            ctx.drawImage(slabSprite, 0, 0, 24, 24, drawX, drawY, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }
}
