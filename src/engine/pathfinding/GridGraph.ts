import { GridCoord } from '../../data/types.ts';

export class GridGraph {
  public readonly width: number;
  public readonly height: number;
  // Matrice calpestabilità: 0 = bloccato, 1..255 = costo movimento (10 = normale, 7 = terrapieno veloce, 18 = sabbia/palude)
  private costGrid: Uint8Array;
  private occupiedByBuilding: Uint8Array;
  private hasFoundationSlab: Uint8Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    const size = width * height;
    this.costGrid = new Uint8Array(size);
    this.occupiedByBuilding = new Uint8Array(size);
    this.hasFoundationSlab = new Uint8Array(size);
    this.reset();
  }

  public reset(): void {
    this.costGrid.fill(10); // Costo base normale
    this.occupiedByBuilding.fill(0);
    this.hasFoundationSlab.fill(0);
  }

  private index(tx: number, ty: number): number {
    return ty * this.width + tx;
  }

  public isInBounds(tx: number, ty: number): boolean {
    return tx >= 0 && tx < this.width && ty >= 0 && ty < this.height;
  }

  public setTileCost(tx: number, ty: number, cost: number): void {
    if (!this.isInBounds(tx, ty)) return;
    this.costGrid[this.index(tx, ty)] = Math.max(0, Math.min(255, cost));
  }

  public getTileCost(tx: number, ty: number): number {
    if (!this.isInBounds(tx, ty)) return 0;
    const idx = this.index(tx, ty);
    if (this.occupiedByBuilding[idx] > 0) return 0; // Bloccato da edificio

    let base = this.costGrid[idx];
    if (base === 0) return 0;

    // Se c'è un terrapieno ciclopico, camminare è più agevole e veloce (-30% al costo di movimento)
    if (this.hasFoundationSlab[idx] > 0) {
      base = Math.max(5, Math.floor(base * 0.7));
    }
    return base;
  }

  public isWalkable(tx: number, ty: number): boolean {
    return this.getTileCost(tx, ty) > 0;
  }

  public setBuildingOccupied(tx: number, ty: number, w: number, h: number, occupied: boolean): void {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const curX = tx + dx;
        const curY = ty + dy;
        if (this.isInBounds(curX, curY)) {
          this.occupiedByBuilding[this.index(curX, curY)] = occupied ? 1 : 0;
        }
      }
    }
  }

  public setFoundation(tx: number, ty: number, w: number, h: number, present: boolean): void {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const curX = tx + dx;
        const curY = ty + dy;
        if (this.isInBounds(curX, curY)) {
          this.hasFoundationSlab[this.index(curX, curY)] = present ? 1 : 0;
        }
      }
    }
  }

  public hasFoundation(tx: number, ty: number): boolean {
    if (!this.isInBounds(tx, ty)) return false;
    return this.hasFoundationSlab[this.index(tx, ty)] > 0;
  }

  public getNeighbors(tx: number, ty: number, allowDiagonals = true): GridCoord[] {
    const neighbors: GridCoord[] = [];
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }
    ];

    for (const d of dirs) {
      const nx = tx + d.dx;
      const ny = ty + d.dy;
      if (this.isWalkable(nx, ny)) {
        neighbors.push({ tx: nx, ty: ny });
      }
    }

    if (allowDiagonals) {
      const diagDirs = [
        { dx: 1, dy: -1, c1: { x: 1, y: 0 }, c2: { x: 0, y: -1 } },
        { dx: 1, dy: 1,  c1: { x: 1, y: 0 }, c2: { x: 0, y: 1 } },
        { dx: -1, dy: 1, c1: { x: -1, y: 0 }, c2: { x: 0, y: 1 } },
        { dx: -1, dy: -1, c1: { x: -1, y: 0 }, c2: { x: 0, y: -1 } }
      ];

      for (const d of diagDirs) {
        const nx = tx + d.dx;
        const ny = ty + d.dy;
        // Non tagliare spigoli di edifici
        if (
          this.isWalkable(nx, ny) &&
          this.isWalkable(tx + d.c1.x, ty + d.c1.y) &&
          this.isWalkable(tx + d.c2.x, ty + d.c2.y)
        ) {
          neighbors.push({ tx: nx, ty: ny });
        }
      }
    }

    return neighbors;
  }
}
