import { Vector2 } from '../../data/types.ts';

export class Camera2D {
  public x: number = 0;
  public y: number = 0;
  public viewportWidth: number = 800;
  public viewportHeight: number = 600;
  public worldWidth: number = 2304; // 48 * 48
  public worldHeight: number = 2304;
  public zoom: number = 0.85; // Slightly less zoom for wider tactical battlefield view
  public panSpeed: number = 650; // pixels per second

  constructor(vw: number, vh: number, ww: number, wh: number) {
    this.viewportWidth = vw;
    this.viewportHeight = vh;
    this.worldWidth = ww;
    this.worldHeight = wh;
  }

  public updateDimensions(vw: number, vh: number): void {
    this.viewportWidth = vw;
    this.viewportHeight = vh;
    this.clamp();
  }

  public setZoom(newZoom: number, focusScreenX?: number, focusScreenY?: number): void {
    const clampedZoom = Math.max(0.55, Math.min(1.25, Math.round(newZoom * 100) / 100));
    if (focusScreenX !== undefined && focusScreenY !== undefined) {
      const worldBefore = this.screenToWorld(focusScreenX, focusScreenY);
      this.zoom = clampedZoom;
      this.x = worldBefore.x - focusScreenX / this.zoom;
      this.y = worldBefore.y - focusScreenY / this.zoom;
    } else {
      const centerWx = this.x + (this.viewportWidth / 2) / this.zoom;
      const centerWy = this.y + (this.viewportHeight / 2) / this.zoom;
      this.zoom = clampedZoom;
      this.x = centerWx - (this.viewportWidth / 2) / this.zoom;
      this.y = centerWy - (this.viewportHeight / 2) / this.zoom;
    }
    this.clamp();
  }

  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-Math.floor(this.x), -Math.floor(this.y));
  }

  public centerOn(wx: number, wy: number): void {
    this.x = wx - (this.viewportWidth / 2) / this.zoom;
    this.y = wy - (this.viewportHeight / 2) / this.zoom;
    this.clamp();
  }

  public moveBy(dx: number, dy: number): void {
    this.x += dx / this.zoom;
    this.y += dy / this.zoom;
    this.clamp();
  }

  public clamp(): void {
    const maxVisibleW = this.viewportWidth / this.zoom;
    const maxVisibleH = this.viewportHeight / this.zoom;

    const maxX = Math.max(0, this.worldWidth - maxVisibleW);
    const maxY = Math.max(0, this.worldHeight - maxVisibleH);

    this.x = Math.max(0, Math.min(maxX, this.x));
    this.y = Math.max(0, Math.min(maxY, this.y));
  }

  public screenToWorld(sx: number, sy: number): Vector2 {
    return {
      x: this.x + sx / this.zoom,
      y: this.y + sy / this.zoom
    };
  }

  public worldToScreen(wx: number, wy: number): Vector2 {
    return {
      x: (wx - this.x) * this.zoom,
      y: (wy - this.y) * this.zoom
    };
  }

  public isVisible(wx: number, wy: number, width: number, height: number, margin = 48): boolean {
    const rx = wx + width;
    const ry = wy + height;
    const camRight = this.x + this.viewportWidth / this.zoom;
    const camBottom = this.y + this.viewportHeight / this.zoom;

    return (
      rx >= this.x - margin &&
      wx <= camRight + margin &&
      ry >= this.y - margin &&
      wy <= camBottom + margin
    );
  }
}
