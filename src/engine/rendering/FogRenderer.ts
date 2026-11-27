import { Camera2D } from '../camera/Camera2D.ts';
import { TILE_SIZE } from '../../data/terrain.ts';

export const FOG_UNEXPLORED = 0;
export const FOG_EXPLORED = 1;
export const FOG_VISIBLE = 2;

export class FogRenderer {
  public readonly width: number;
  public readonly height: number;
  private fogState: Uint8Array; // 0, 1, 2

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.fogState = new Uint8Array(width * height);
    this.fogState.fill(FOG_UNEXPLORED);
  }

  private index(tx: number, ty: number): number {
    return ty * this.width + tx;
  }

  public getFog(tx: number, ty: number): number {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return FOG_UNEXPLORED;
    return this.fogState[this.index(tx, ty)];
  }

  public resetVisibility(): void {
    const len = this.fogState.length;
    for (let i = 0; i < len; i++) {
      if (this.fogState[i] === FOG_VISIBLE) {
        this.fogState[i] = FOG_EXPLORED;
      }
    }
  }

  public revealRadius(centerTx: number, centerTy: number, radiusTiles: number): void {
    const r2 = radiusTiles * radiusTiles;
    const minX = Math.max(0, Math.floor(centerTx - radiusTiles));
    const maxX = Math.min(this.width - 1, Math.ceil(centerTx + radiusTiles));
    const minY = Math.max(0, Math.floor(centerTy - radiusTiles));
    const maxY = Math.min(this.height - 1, Math.ceil(centerTy + radiusTiles));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - centerTx;
        const dy = y - centerTy;
        if (dx * dx + dy * dy <= r2) {
          this.fogState[this.index(x, y)] = FOG_VISIBLE;
        }
      }
    }
  }

  public revealAll(visible: boolean = true): void {
    const val = visible ? FOG_VISIBLE : FOG_EXPLORED;
    this.fogState.fill(val);
  }

  // Dune II Crisp Tile-Based Fog Rendering
  public render(ctx: CanvasRenderingContext2D, camera: Camera2D): void {
    const startTileX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const startTileY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endTileX = Math.min(this.width - 1, Math.ceil((camera.x + camera.viewportWidth / camera.zoom) / TILE_SIZE));
    const endTileY = Math.min(this.height - 1, Math.ceil((camera.y + camera.viewportHeight / camera.zoom) / TILE_SIZE));

    ctx.save();

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const state = this.getFog(tx, ty);
        if (state === FOG_VISIBLE) continue;

        const wx = tx * TILE_SIZE;
        const wy = ty * TILE_SIZE;

        if (state === FOG_UNEXPLORED) {
          // Pitch-black unexplored shroud
          ctx.fillStyle = '#060504';
          ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
        } else if (state === FOG_EXPLORED) {
          // Dune II semi-transparent shadow shroud (50% dither / dark overlay)
          ctx.fillStyle = 'rgba(12, 9, 7, 0.62)';
          ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    ctx.restore();
  }
}
