import { GridCoord } from '../../data/types.ts';
import { GridGraph } from './GridGraph.ts';

interface PathNode {
  tx: number;
  ty: number;
  g: number;
  h: number;
  f: number;
  parent?: PathNode;
}

export class AStar {
  private static octileHeuristic(ax: number, ay: number, bx: number, by: number): number {
    const dx = Math.abs(ax - bx);
    const dy = Math.abs(ay - by);
    const D = 10;
    const D2 = 14; // Approssimazione di 10 * sqrt(2)
    return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
  }

  public static findPath(
    graph: GridGraph,
    start: GridCoord,
    goal: GridCoord,
    maxSearchSteps = 3000,
    blockedTileKeys?: Set<number>
  ): GridCoord[] {
    if (!graph.isInBounds(start.tx, start.ty) || !graph.isInBounds(goal.tx, goal.ty)) {
      return [];
    }

    if (start.tx === goal.tx && start.ty === goal.ty) {
      return [{ tx: start.tx, ty: start.ty }];
    }

    const toKey = (tx: number, ty: number) => ty * graph.width + tx;

    // Se l'obiettivo non è calpestabile o è bloccato da un'altra unità / edificio,
    // cerca la tessera calpestabile libera più vicina al punto di partenza (fino a raggio 6 per edifici grandi)
    let targetGoal = goal;
    const isGoalBlocked = !graph.isWalkable(goal.tx, goal.ty) || (blockedTileKeys && blockedTileKeys.has(toKey(goal.tx, goal.ty)));
    if (isGoalBlocked) {
      let candidate: GridCoord | null = null;
      let bestDist = Infinity;

      for (let r = 1; r <= 6; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const nx = goal.tx + dx;
            const ny = goal.ty + dy;
            if (graph.isInBounds(nx, ny) && graph.isWalkable(nx, ny) && (!blockedTileKeys || !blockedTileKeys.has(toKey(nx, ny)))) {
              const d = Math.hypot(nx - start.tx, ny - start.ty);
              if (d < bestDist) {
                bestDist = d;
                candidate = { tx: nx, ty: ny };
              }
            }
          }
        }
        if (candidate) break; // Trovato il perimetro calpestabile più vicino
      }

      if (!candidate) return [];
      targetGoal = candidate;
    }

    const openList: PathNode[] = [];
    const openSet: Map<number, PathNode> = new Map();
    const closedSet: Set<number> = new Set();

    const startNode: PathNode = {
      tx: start.tx,
      ty: start.ty,
      g: 0,
      h: this.octileHeuristic(start.tx, start.ty, targetGoal.tx, targetGoal.ty),
      f: 0
    };
    startNode.f = startNode.g + startNode.h;

    openList.push(startNode);
    openSet.set(toKey(start.tx, start.ty), startNode);

    let steps = 0;

    while (openList.length > 0 && steps < maxSearchSteps) {
      steps++;

      // Trova nodo con f minore (priority pick)
      let lowestIdx = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[lowestIdx].f) {
          lowestIdx = i;
        }
      }

      const current = openList.splice(lowestIdx, 1)[0];
      const curKey = toKey(current.tx, current.ty);
      openSet.delete(curKey);
      closedSet.add(curKey);

      // Obiettivo raggiunto!
      if (current.tx === targetGoal.tx && current.ty === targetGoal.ty) {
        return this.reconstructPath(current);
      }

      const neighbors = graph.getNeighbors(current.tx, current.ty, true);
      for (const n of neighbors) {
        const nKey = toKey(n.tx, n.ty);
        if (closedSet.has(nKey)) continue;

        // Skip tiles dynamically blocked by stationary units
        if (blockedTileKeys && blockedTileKeys.has(nKey) && (n.tx !== targetGoal.tx || n.ty !== targetGoal.ty)) {
          continue;
        }

        const tileCost = graph.getTileCost(n.tx, n.ty);
        const isDiag = n.tx !== current.tx && n.ty !== current.ty;
        const stepCost = isDiag ? Math.floor(tileCost * 1.414) : tileCost;
        const tentativeG = current.g + stepCost;

        let neighborNode = openSet.get(nKey);
        if (!neighborNode) {
          neighborNode = {
            tx: n.tx,
            ty: n.ty,
            g: tentativeG,
            h: this.octileHeuristic(n.tx, n.ty, targetGoal.tx, targetGoal.ty),
            f: 0,
            parent: current
          };
          neighborNode.f = neighborNode.g + neighborNode.h;
          openList.push(neighborNode);
          openSet.set(nKey, neighborNode);
        } else if (tentativeG < neighborNode.g) {
          neighborNode.g = tentativeG;
          neighborNode.f = neighborNode.g + neighborNode.h;
          neighborNode.parent = current;
        }
      }
    }

    return []; // Nessun percorso valido trovato
  }

  private static reconstructPath(endNode: PathNode): GridCoord[] {
    const path: GridCoord[] = [];
    let cur: PathNode | undefined = endNode;
    while (cur) {
      path.unshift({ tx: cur.tx, ty: cur.ty });
      cur = cur.parent;
    }
    return path;
  }
}
