import { GridCoord, Vector2 } from '../../data/types.ts';
import { GridGraph } from './GridGraph.ts';

export class FlowField {
  public readonly width: number;
  public readonly height: number;
  private integrationField: Uint32Array;
  // Vettori di direzione (dx, dy) compattati o salvati in Float32Array: x a i*2, y a i*2+1
  private vectorField: Float32Array;
  public target: GridCoord | null = null;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    const size = width * height;
    this.integrationField = new Uint32Array(size);
    this.vectorField = new Float32Array(size * 2);
  }

  private index(tx: number, ty: number): number {
    return ty * this.width + tx;
  }

  public compute(graph: GridGraph, target: GridCoord): void {
    this.target = target;
    const INF = 0xFFFFFFFF;
    this.integrationField.fill(INF);

    if (!graph.isInBounds(target.tx, target.ty)) return;

    // 1. Dijkstra BFS per calcolare i costi integrati
    const queue: GridCoord[] = [];
    const targetIdx = this.index(target.tx, target.ty);
    this.integrationField[targetIdx] = 0;
    queue.push(target);

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const curCost = this.integrationField[this.index(cur.tx, cur.ty)];

      const neighbors = graph.getNeighbors(cur.tx, cur.ty, false); // 4 cardinali per coerenza di flusso
      for (const n of neighbors) {
        const nIdx = this.index(n.tx, n.ty);
        const tileCost = graph.getTileCost(n.tx, n.ty);
        if (tileCost === 0) continue;

        const newCost = curCost + tileCost;
        if (newCost < this.integrationField[nIdx]) {
          this.integrationField[nIdx] = newCost;
          queue.push(n);
        }
      }
    }

    // 2. Generazione del campo vettoriale direzionale
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = this.index(x, y);
        if (x === target.tx && y === target.ty) {
          this.vectorField[idx * 2] = 0;
          this.vectorField[idx * 2 + 1] = 0;
          continue;
        }

        if (this.integrationField[idx] === INF) {
          this.vectorField[idx * 2] = 0;
          this.vectorField[idx * 2 + 1] = 0;
          continue;
        }

        // Trova il vicino con costo di integrazione minimo
        let bestCost = this.integrationField[idx];
        let bestDx = 0;
        let bestDy = 0;

        const dirs = [
          { dx: 0, dy: -1 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: 0 },
          { dx: 1, dy: -1 },
          { dx: 1, dy: 1 },
          { dx: -1, dy: 1 },
          { dx: -1, dy: -1 }
        ];

        for (const d of dirs) {
          const nx = x + d.dx;
          const ny = y + d.dy;
          if (graph.isInBounds(nx, ny) && graph.isWalkable(nx, ny)) {
            const cost = this.integrationField[this.index(nx, ny)];
            if (cost < bestCost) {
              bestCost = cost;
              bestDx = d.dx;
              bestDy = d.dy;
            }
          }
        }

        const len = Math.hypot(bestDx, bestDy);
        if (len > 0.001) {
          this.vectorField[idx * 2] = bestDx / len;
          this.vectorField[idx * 2 + 1] = bestDy / len;
        } else {
          this.vectorField[idx * 2] = 0;
          this.vectorField[idx * 2 + 1] = 0;
        }
      }
    }
  }

  public getVectorAt(tx: number, ty: number): Vector2 {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
      return { x: 0, y: 0 };
    }
    const idx = this.index(Math.floor(tx), Math.floor(ty));
    return {
      x: this.vectorField[idx * 2],
      y: this.vectorField[idx * 2 + 1]
    };
  }
}
