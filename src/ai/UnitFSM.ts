import { UnitEntity } from '../entities/UnitEntity.ts';
import { BuildingEntity } from '../entities/BuildingEntity.ts';
import { GridGraph } from '../engine/pathfinding/GridGraph.ts';
import { AStar } from '../engine/pathfinding/AStar.ts';
import { CombatSystem } from '../systems/CombatSystem.ts';
import { EconomySystem } from '../systems/EconomySystem.ts';
import { TileRenderer } from '../engine/rendering/TileRenderer.ts';
import { TILE_SIZE } from '../data/terrain.ts';
import { EventBus } from '../core/EventBus.ts';
import { ResourceType } from '../data/types.ts';

export class UnitFSM {
  public static updateUnit(
    u: UnitEntity,
    dt: number,
    graph: GridGraph,
    units: UnitEntity[],
    buildings: BuildingEntity[],
    combat: CombatSystem,
    economy: EconomySystem,
    tileRenderer?: TileRenderer,
    decorations?: Array<{ x: number; y: number; type: string; current?: number; max?: number }>
  ): void {
    if (u.attackCooldown > 0) {
      u.attackCooldown -= dt;
    }

    switch (u.state) {
      case 'IDLE':
        this.handleIdle(u, units, buildings);
        break;

      case 'MOVE_TO':
        this.handleMove(u, dt, graph, units);
        break;

      case 'ATTACK_TARGET':
        this.handleAttack(u, dt, units, buildings, combat, graph);
        break;

      case 'HARVEST_SEEK':
      case 'HARVESTING':
      case 'RETURN_CARGO':
      case 'UNLOADING':
      case 'WAITING_STORAGE':
        this.handleHarvestCycle(u, dt, graph, buildings, economy, tileRenderer, decorations, units);
        break;
    }

    // Physical collision enforcement: no unit may penetrate solid building interiors
    UnitFSM.resolveBuildingCollisions(u, buildings);
  }

  private static handleIdle(
    u: UnitEntity,
    units: UnitEntity[],
    buildings: BuildingEntity[]
  ): void {
    // Se è un'unità da combattimento, cerca nemici vicini entro raggio di guardia (4 tile)
    if (u.def.category === 'infantry' || u.def.category === 'skirmisher' || u.def.category === 'chariot') {
      const aggroRange = (u.def.attackRange || 2) * TILE_SIZE + 96;
      for (const other of units) {
        if (other.owner !== u.owner && other.hp > 0) {
          const dist = Math.hypot(other.x - u.x, other.y - u.y);
          if (dist <= aggroRange) {
            u.targetEntityId = other.id;
            u.state = 'ATTACK_TARGET';
            return;
          }
        }
      }

      // Se non ci sono unità nemiche vicine, cerca edifici nemici
      for (const b of buildings) {
        if (b.owner !== u.owner && b.hp > 0) {
          const dist = Math.hypot(b.centerX - u.x, b.centerY - u.y);
          if (dist <= aggroRange) {
            u.targetEntityId = b.id;
            u.state = 'ATTACK_TARGET';
            return;
          }
        }
      }
    }
  }

  private static handleMove(u: UnitEntity, dt: number, graph: GridGraph, units?: UnitEntity[]): void {
    // If military unit moving, continuously scan for encroaching enemies within aggro sight (4 tiles)
    if (units && (u.def.category === 'infantry' || u.def.category === 'skirmisher' || u.def.category === 'chariot')) {
      const aggroRange = (u.def.attackRange || 1.5) * TILE_SIZE + 80;
      for (const other of units) {
        if (other.owner !== u.owner && other.hp > 0) {
          const dist = Math.hypot(other.x - u.x, other.y - u.y);
          if (dist <= aggroRange) {
            u.targetEntityId = other.id;
            u.state = 'ATTACK_TARGET';
            u.path = [];
            return;
          }
        }
      }
    }

    if (u.path.length === 0) {
      u.state = 'IDLE';
      return;
    }

    // Water shoreline boundary enforcement:
    // Western sea occupies x < 6 tiles (288px). Land units cannot cross into the water without boats.
    const waterEdgePx = 6 * TILE_SIZE + 10;
    if (u.x < waterEdgePx) {
      u.x = waterEdgePx;
      u.path = u.path.filter(wp => wp.x >= waterEdgePx);
      if (u.path.length === 0) {
        u.state = 'IDLE';
        return;
      }
    }

    // DYNAMIC TARGET OCCUPANCY RESOLUTION:
    // When destination tile is occupied by another unit, redirect to the adjacent free tile!
    if (units && u.path.length > 0) {
      const finalWp = u.path[u.path.length - 1];
      const destTx = Math.floor(finalWp.x / TILE_SIZE);
      const destTy = Math.floor(finalWp.y / TILE_SIZE);
      const curTx = Math.floor(u.x / TILE_SIZE);
      const curTy = Math.floor(u.y / TILE_SIZE);

      // Check if another unit is stationed at destination
      const occupier = units.find(
        other => other.id !== u.id && other.hp > 0 &&
        (Math.floor(other.x / TILE_SIZE) === destTx && Math.floor(other.y / TILE_SIZE) === destTy ||
         Math.hypot(other.x - finalWp.x, other.y - finalWp.y) < 26)
      );

      if (occupier) {
        // Destination tile is already occupied!
        const isAdjacent = Math.abs(curTx - destTx) <= 1 && Math.abs(curTy - destTy) <= 1 && (curTx !== destTx || curTy !== destTy);
        const distToDest = Math.hypot(finalWp.x - u.x, finalWp.y - u.y);

        if (isAdjacent && distToDest <= TILE_SIZE * 0.95) {
          // Already in adjacent free tile next to the target: stop cleanly without pushing in!
          u.path = [];
          u.state = 'IDLE';
          return;
        }

        // Search for the closest free adjacent tile next to destTx, destTy
        const neighborOffsets = [
          { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
          { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
        ];

        let bestAdjTile: { tx: number; ty: number } | null = null;
        let bestDist = Infinity;

        for (const off of neighborOffsets) {
          const atx = destTx + off.dx;
          const aty = destTy + off.dy;
          if (atx >= 6 && graph.isInBounds(atx, aty) && graph.isWalkable(atx, aty)) {
            const isTaken = units.some(
              un => un.id !== u.id && un.hp > 0 &&
              (Math.floor(un.x / TILE_SIZE) === atx && Math.floor(un.y / TILE_SIZE) === aty ||
               Math.hypot(un.x - (atx * TILE_SIZE + 24), un.y - (aty * TILE_SIZE + 24)) < 26)
            );
            if (!isTaken) {
              const d = Math.hypot(atx * TILE_SIZE + 24 - u.x, aty * TILE_SIZE + 24 - u.y);
              if (d < bestDist) {
                bestDist = d;
                bestAdjTile = { tx: atx, ty: aty };
              }
            }
          }
        }

        if (bestAdjTile) {
          if (curTx === bestAdjTile.tx && curTy === bestAdjTile.ty) {
            u.path = [];
            u.state = 'IDLE';
            return;
          }
          u.path[u.path.length - 1] = {
            x: bestAdjTile.tx * TILE_SIZE + 24,
            y: bestAdjTile.ty * TILE_SIZE + 24
          };
        }
      }
    }

    const nextWp = u.path[0];
    const targetWpX = Math.max(waterEdgePx, nextWp.x);
    const dx = targetWpX - u.x;
    const dy = nextWp.y - u.y;
    const dist = Math.hypot(dx, dy);
    const speedPx = u.def.speed * TILE_SIZE * dt;

    // Check if next waypoint is blocked by a stationary unit within collision reach
    if (units && u.path.length <= 1 && dist <= 44) {
      const blocker = units.find(
        other => other.id !== u.id && other.hp > 0 &&
        Math.hypot(other.x - u.x, other.y - u.y) < 42
      );
      if (blocker) {
        // Unit has reached the perimeter of the occupied space: stop gracefully
        u.path = [];
        u.state = 'IDLE';
        return;
      }
    }

    if (dist <= speedPx) {
      u.x = targetWpX;
      u.y = nextWp.y;
      u.path.shift();
      if (u.path.length === 0) {
        u.state = 'IDLE';
      }
    } else {
      u.x += (dx / dist) * speedPx;
      u.y += (dy / dist) * speedPx;
      if (u.x < waterEdgePx) u.x = waterEdgePx;
    }
  }

  private static handleAttack(
    u: UnitEntity,
    dt: number,
    units: UnitEntity[],
    buildings: BuildingEntity[],
    combat: CombatSystem,
    _graph: GridGraph
  ): void {
    if (u.targetEntityId === null) {
      u.state = 'IDLE';
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let isBuilding = false;
    let dist = 0;
    let attackDx = 0;
    let attackDy = 0;
    const attackRangePx = (u.def.attackRange || 1.2) * TILE_SIZE;

    const targetUnit = units.find(unit => unit.id === u.targetEntityId);
    if (targetUnit) {
      targetX = targetUnit.x;
      targetY = targetUnit.y;
      attackDx = targetX - u.x;
      attackDy = targetY - u.y;
      dist = Math.hypot(attackDx, attackDy);
    } else {
      const targetB = buildings.find(b => b.id === u.targetEntityId);
      if (targetB) {
        targetX = targetB.centerX;
        targetY = targetB.centerY;
        isBuilding = true;

        // Calculate closest point on the exterior wall of the building
        const bMinX = targetB.tx * TILE_SIZE;
        const bMaxX = (targetB.tx + targetB.def.width) * TILE_SIZE;
        const bMinY = targetB.ty * TILE_SIZE;
        const bMaxY = (targetB.ty + targetB.def.height) * TILE_SIZE;

        const clampX = Math.max(bMinX, Math.min(bMaxX, u.x));
        const clampY = Math.max(bMinY, Math.min(bMaxY, u.y));
        attackDx = clampX - u.x;
        attackDy = clampY - u.y;
        dist = Math.hypot(attackDx, attackDy);
      } else {
        // Bersaglio morto o non trovato
        u.targetEntityId = null;
        u.state = 'IDLE';
        return;
      }
    }

    if (dist <= attackRangePx) {
      // In gittata: ferma il movimento e attacca
      u.path = [];
      if (u.attackCooldown <= 0) {
        u.attackCooldown = u.def.attackCooldown || 1.0;

        if (u.def.category === 'skirmisher') {
          combat.fireProjectile(u.x, u.y, u.targetEntityId, isBuilding, u.def.damage || 12, 'sling_stone', dist);
          EventBus.get().emit('audio:arrow');
        } else if (u.def.category === 'chariot') {
          combat.fireProjectile(u.x, u.y, u.targetEntityId, isBuilding, u.def.damage || 28, 'arrow', dist);
          EventBus.get().emit('audio:arrow');
        } else {
          // Attacco corpo a corpo immediato
          EventBus.get().emit('audio:combat_hit');
          if (isBuilding) {
            const b = buildings.find(b => b.id === u.targetEntityId);
            if (b) {
              const dmg = u.def.damage || 15;
              EventBus.get().emit('fx:floating_text', {
                text: `-${dmg}`,
                color: '#f59e0b',
                x: b.centerX + (Math.random() - 0.5) * 16,
                y: b.centerY - 20
              });
              EventBus.get().emit('fx:combat_hit', {
                x: b.centerX + (Math.random() - 0.5) * 16,
                y: b.centerY + (Math.random() - 0.5) * 16,
                color: '#d97706'
              });

              if (b.takeDamage(dmg)) {
                EventBus.get().emit('audio:explosion');
                EventBus.get().emit('combat:building_destroyed', b);
                u.targetEntityId = null;
                u.state = 'IDLE';
              }
            }
          } else {
            const victim = units.find(unit => unit.id === u.targetEntityId);
            if (victim) {
              let dmg = u.def.damage || 16;
              let isCrit = false;
              // Khopesh bronze warriors deliver devastating critical sickle-cleaves
              if (u.defId === 'bronze_swordsman' && Math.random() < 0.28) {
                dmg = Math.floor(dmg * 1.5);
                isCrit = true;
              }

              EventBus.get().emit('fx:floating_text', {
                text: isCrit ? `CRIT! -${dmg}` : `-${dmg}`,
                color: isCrit ? '#fde047' : '#ef4444',
                x: victim.x + (Math.random() - 0.5) * 8,
                y: victim.y - 20
              });
              EventBus.get().emit('fx:combat_hit', {
                x: victim.x,
                y: victim.y,
                color: isCrit ? '#fde047' : '#fbbf24'
              });

              const dead = victim.takeDamage(dmg);
              if (dead) {
                EventBus.get().emit('combat:unit_killed', victim);
                u.targetEntityId = null;
                u.state = 'IDLE';
              } else if (victim.state === 'IDLE' || victim.state === 'MOVE_TO') {
                // Immediate tactical retaliation against the attacker
                victim.targetEntityId = u.id;
                victim.state = 'ATTACK_TARGET';
              }
            }
          }
        }
      }
    } else {
      // Avvicinati al perimetro esterno del bersaglio (fermandosi all'esterno delle mura)
      const step = u.def.speed * TILE_SIZE * dt;
      const moveDist = isBuilding ? Math.min(step, Math.max(0, dist - attackRangePx * 0.4)) : step;
      if (dist > 0) {
        u.x += (attackDx / dist) * moveDist;
        u.y += (attackDy / dist) * moveDist;
      }
    }
  }

  // --- Strict Building Collision Barrier (Prevents entering building interiors) ---
  public static resolveBuildingCollisions(u: UnitEntity, buildings: BuildingEntity[]): void {
    const r = 13; // Unit collision radius
    for (const b of buildings) {
      // Foundations are flat ground slabs that units can walk over freely
      if (b.defId === 'cyclopean_slab') continue;

      const bMinX = b.tx * TILE_SIZE;
      const bMaxX = (b.tx + b.def.width) * TILE_SIZE;
      const bMinY = b.ty * TILE_SIZE;
      const bMaxY = (b.ty + b.def.height) * TILE_SIZE;

      // Check AABB overlap with unit circle
      if (u.x + r > bMinX && u.x - r < bMaxX && u.y + r > bMinY && u.y - r < bMaxY) {
        // Eject unit to the closest exterior face of the building
        const distLeft = (u.x + r) - bMinX;
        const distRight = bMaxX - (u.x - r);
        const distTop = (u.y + r) - bMinY;
        const distBottom = bMaxY - (u.y - r);

        const minDist = Math.min(distLeft, distRight, distTop, distBottom);
        if (minDist === distLeft) {
          u.x = bMinX - r;
        } else if (minDist === distRight) {
          u.x = bMaxX + r;
        } else if (minDist === distTop) {
          u.y = bMinY - r;
        } else {
          u.y = bMaxY + r;
        }
      }
    }
  }

  // --- Strict Unit-to-Unit Collision & Tile Occupancy Separation ---
  // Guarantees no two units (troops, donkeys, Sea Peoples raiders) occupy the same tile or overlap.
  public static resolveUnitCollisions(units: UnitEntity[], buildings: BuildingEntity[]): void {
    const waterEdgePx = 6 * TILE_SIZE + 10;
    const len = units.length;

    // 2 iterative relaxation passes for smooth and firm separation
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < len; i++) {
        const u1 = units[i];
        const r1 = u1.def.category === 'chariot' ? 24 : 17;

        for (let j = i + 1; j < len; j++) {
          const u2 = units[j];
          const r2 = u2.def.category === 'chariot' ? 24 : 17;
          // Minimum separation distance: 36px for infantry/donkeys; ensures they cannot fit inside the same 48px tile!
          const minDist = r1 + r2 + 4;

          const dx = u2.x - u1.x;
          const dy = u2.y - u1.y;
          const dist = Math.hypot(dx, dy);

          if (dist < minDist) {
            const overlap = minDist - dist;
            let nx = 0;
            let ny = 0;

            if (dist > 0.001) {
              nx = dx / dist;
              ny = dy / dist;
            } else {
              // Deterministic angle if units perfectly stacked on identical pixel
              const angle = ((u1.id * 53 + u2.id * 31) % 360) * (Math.PI / 180);
              nx = Math.cos(angle);
              ny = Math.sin(angle);
            }

            // Clamped soft separation nudge: maximum 1.0 px per frame.
            // Eliminates any spring-bounce, jitter, or teleportation!
            const softPush = Math.min(overlap * 0.15, 1.0);

            const u1Moving = u1.state === 'MOVE_TO' || u1.state === 'HARVEST_SEEK' || u1.state === 'RETURN_CARGO';
            const u2Moving = u2.state === 'MOVE_TO' || u2.state === 'HARVEST_SEEK' || u2.state === 'RETURN_CARGO';

            if (u1Moving && !u2Moving) {
              if (u1.state === 'MOVE_TO' && u1.path.length <= 1) {
                // Arrived at the occupant's perimeter: stop smoothly on this adjacent spot
                u1.path = [];
                u1.state = 'IDLE';
              }
              u1.x -= nx * softPush;
              u1.y -= ny * softPush;
            } else if (!u1Moving && u2Moving) {
              if (u2.state === 'MOVE_TO' && u2.path.length <= 1) {
                u2.path = [];
                u2.state = 'IDLE';
              }
              u2.x += nx * softPush;
              u2.y += ny * softPush;
            } else {
              u1.x -= nx * softPush * 0.5;
              u1.y -= ny * softPush * 0.5;
              u2.x += nx * softPush * 0.5;
              u2.y += ny * softPush * 0.5;
            }
          }
        }

        // Clamp to water edge & eject from building interiors
        if (u1.x < waterEdgePx) u1.x = waterEdgePx;
        UnitFSM.resolveBuildingCollisions(u1, buildings);
      }
    }
  }

  public static findNearestVein(
    tileRenderer: TileRenderer,
    fromTx: number,
    fromTy: number,
    oreType: string,
    maxRadius: number = 25
  ): { tx: number; ty: number } | null {
    const targetTileType = `vein_${oreType}`;
    let bestCoord: { tx: number; ty: number } | null = null;
    let bestDist = Infinity;

    for (let dy = -maxRadius; dy <= maxRadius; dy++) {
      for (let dx = -maxRadius; dx <= maxRadius; dx++) {
        const tx = fromTx + dx;
        const ty = fromTy + dy;
        if (tileRenderer.getTile(tx, ty) === targetTileType) {
          const dist = Math.hypot(dx, dy);
          if (dist < bestDist) {
            bestDist = dist;
            bestCoord = { tx, ty };
          }
        }
      }
    }
    return bestCoord;
  }

  public static findNearestTree(
    decorations: Array<{ x: number; y: number; type: string; current?: number; max?: number }>,
    fromTx: number,
    fromTy: number,
    maxRadius: number = 25
  ): { x: number; y: number; type: string; current?: number; max?: number } | null {
    let bestTree: { x: number; y: number; type: string; current?: number; max?: number } | null = null;
    let bestDist = Infinity;
    for (const d of decorations) {
      if (d.type === 'cedar' && (d.current === undefined || d.current > 0)) {
        const dist = Math.hypot(d.x - fromTx, d.y - fromTy);
        if (dist <= maxRadius && dist < bestDist) {
          bestDist = dist;
          bestTree = d;
        }
      }
    }
    return bestTree;
  }

  private static handleHarvestCycle(
    u: UnitEntity,
    dt: number,
    graph: GridGraph,
    buildings: BuildingEntity[],
    economy: EconomySystem,
    tileRenderer?: TileRenderer,
    decorations?: Array<{ x: number; y: number; type: string; current?: number; max?: number }>,
    units?: UnitEntity[]
  ): void {
    if (u.def.category !== 'worker') {
      u.state = 'IDLE';
      return;
    }

    const maxCargo = u.def.cargoCapacity || 120;
    const isTimber = u.currentCargoType === 'timber';

    // 1. HARVEST_SEEK: Navigates to the assigned ore vein or cedar tree
    if (u.state === 'HARVEST_SEEK') {
      if (!u.targetMineCoord) {
        u.state = 'IDLE';
        return;
      }

      // Check if target was depleted or felled before arrival
      if (isTimber && decorations) {
        const tree = decorations.find(
          d => d.type === 'cedar' && (d.current === undefined || d.current > 0) &&
          Math.hypot(d.x - (u.targetMineCoord!.tx + 0.5), d.y - (u.targetMineCoord!.ty + 0.5)) < 1.2
        );
        if (!tree) {
          const nextTree = UnitFSM.findNearestTree(decorations, u.targetMineCoord.tx, u.targetMineCoord.ty);
          if (nextTree) {
            u.targetMineCoord = { tx: Math.floor(nextTree.x), ty: Math.floor(nextTree.y) };
            u.path = [];
          } else {
            u.targetMineCoord = null;
            if (u.currentCargoAmount > 0) u.state = 'RETURN_CARGO';
            else u.state = 'IDLE';
            return;
          }
        }
      } else if (!isTimber && tileRenderer) {
        const curTile = tileRenderer.getTile(u.targetMineCoord.tx, u.targetMineCoord.ty);
        if (!curTile.startsWith('vein_')) {
          const nextVein = UnitFSM.findNearestVein(tileRenderer, u.targetMineCoord.tx, u.targetMineCoord.ty, u.currentCargoType || 'copper');
          if (nextVein) {
            u.targetMineCoord = nextVein;
            u.path = [];
          } else {
            u.targetMineCoord = null;
            if (u.currentCargoAmount > 0) u.state = 'RETURN_CARGO';
            else u.state = 'IDLE';
            return;
          }
        }
      }

      const mineTargetX = u.targetMineCoord.tx * TILE_SIZE + 24;
      const mineTargetY = u.targetMineCoord.ty * TILE_SIZE + 24;
      const distToMine = Math.hypot(mineTargetX - u.x, mineTargetY - u.y);

      // Within harvesting reach (1.5 tiles)
      if (distToMine <= TILE_SIZE * 1.5) {
        u.path = [];
        u.state = 'HARVESTING';
        u.harvestCooldown = 0;
        return;
      }

      // If path exhausted before arriving, recompute A* path
      if (u.path.length === 0) {
        const curTx = Math.floor(u.x / TILE_SIZE);
        const curTy = Math.floor(u.y / TILE_SIZE);
        const pathCoords = AStar.findPath(graph, { tx: curTx, ty: curTy }, { tx: u.targetMineCoord.tx, ty: u.targetMineCoord.ty });
        if (pathCoords.length > 0) {
          u.path = pathCoords.map(c => ({ x: c.tx * TILE_SIZE + 24, y: c.ty * TILE_SIZE + 24 }));
        } else {
          u.state = 'IDLE';
          return;
        }
      }

      this.handleMove(u, dt, graph, units);
      return;
    }

    // 2. HARVESTING: Chipping ore into pack baskets or felling cedar timber
    if (u.state === 'HARVESTING') {
      u.harvestAnimationTimer = (u.harvestAnimationTimer || 0) + dt;
      u.harvestCooldown += dt * (u.def.harvestSpeed || 18);

      if (u.harvestCooldown >= 10) {
        u.harvestCooldown = 0;
        const needed = maxCargo - u.currentCargoAmount;
        const want = Math.min(10, needed);

        let extracted = want;
        let isDepleted = false;

        if (isTimber && decorations && u.targetMineCoord) {
          const tree = decorations.find(
            d => d.type === 'cedar' && Math.hypot(d.x - (u.targetMineCoord!.tx + 0.5), d.y - (u.targetMineCoord!.ty + 0.5)) < 1.2
          );
          if (tree) {
            if (tree.current === undefined) { tree.current = 240; tree.max = 240; }
            extracted = Math.min(want, tree.current);
            tree.current -= extracted;
            if (tree.current <= 0) {
              tree.current = 0;
              tree.type = 'stump';
              isDepleted = true;
              EventBus.get().emit('fx:floating_text', {
                text: `CEDAR TREE FELLED!`,
                color: '#f59e0b',
                x: tree.x * TILE_SIZE,
                y: tree.y * TILE_SIZE - 20
              });
              EventBus.get().emit('audio:build');
              const nextTree = UnitFSM.findNearestTree(decorations, Math.floor(tree.x), Math.floor(tree.y));
              u.targetMineCoord = nextTree ? { tx: Math.floor(nextTree.x), ty: Math.floor(nextTree.y) } : null;
            }
          } else {
            isDepleted = true;
          }
        } else if (!isTimber && tileRenderer && u.targetMineCoord) {
          const harvestResult = tileRenderer.harvestVein(u.targetMineCoord.tx, u.targetMineCoord.ty, want);
          extracted = harvestResult.harvested;
          isDepleted = harvestResult.depleted;
          if (isDepleted) {
            graph.setTileCost(u.targetMineCoord.tx, u.targetMineCoord.ty, 10);
            const oreLabel = (u.currentCargoType || 'ore').toUpperCase();
            EventBus.get().emit('fx:floating_text', {
              text: `${oreLabel} VEIN DEPLETED!`,
              color: '#ef4444',
              x: u.targetMineCoord.tx * TILE_SIZE + 24,
              y: u.targetMineCoord.ty * TILE_SIZE + 12
            });
            EventBus.get().emit('audio:combat_hit');
            EventBus.get().emit('advisor:message', {
              speaker: 'burna_khabir',
              text: `Wanax, an ore vein has been exhausted! The earth gives no more.`,
              isAlert: false
            });
          }
        }

        u.currentCargoAmount = Math.min(maxCargo, u.currentCargoAmount + extracted);
        EventBus.get().emit('audio:harvest');

        // Check if cargo full OR deposit depleted
        if (u.currentCargoAmount >= maxCargo || isDepleted) {
          if (isDepleted && !isTimber && tileRenderer && u.targetMineCoord) {
            const nextVein = UnitFSM.findNearestVein(tileRenderer, u.targetMineCoord.tx, u.targetMineCoord.ty, u.currentCargoType || 'copper');
            u.targetMineCoord = nextVein;
          }

          if (u.currentCargoAmount >= maxCargo || (isDepleted && (!u.targetMineCoord || u.currentCargoAmount > 0))) {
            // Locate nearest valid dropoff depot: Acropolis and Granary accept all cargo; Foundry accepts ores/stone
            const dropoffs = buildings.filter(
              b => b.owner === u.owner && b.buildProgress >= 1.0 && (
                b.defId === 'acropolis' ||
                b.defId === 'granary' ||
                (b.defId === 'bronze_foundry' && (u.currentCargoType === 'copper' || u.currentCargoType === 'tin' || u.currentCargoType === 'iron' || u.currentCargoType === 'stone')) ||
                (b.defId === 'iron_smelter' && u.currentCargoType === 'iron')
              )
            );
            if (dropoffs.length > 0) {
              dropoffs.sort((a, b) => Math.hypot(a.centerX - u.x, a.centerY - u.y) - Math.hypot(b.centerX - u.x, b.centerY - u.y));
              const nearest = dropoffs[0];
              const curTx = Math.floor(u.x / TILE_SIZE);
              const curTy = Math.floor(u.y / TILE_SIZE);
              const dropTx = nearest.tx + Math.floor(nearest.def.width / 2);
              const dropTy = nearest.ty + nearest.def.height; // Front entrance

              const pathCoords = AStar.findPath(graph, { tx: curTx, ty: curTy }, { tx: dropTx, ty: dropTy });
              if (pathCoords.length > 0) {
                u.path = pathCoords.map(c => ({ x: c.tx * TILE_SIZE + 24, y: c.ty * TILE_SIZE + 24 }));
              } else {
                u.path = [{ x: nearest.centerX, y: nearest.centerY }];
              }
              u.state = 'RETURN_CARGO';
            } else {
              u.state = 'IDLE';
            }
          } else if (isDepleted && u.targetMineCoord) {
            u.path = [];
            u.state = 'HARVEST_SEEK';
          }
        }
      }
      return;
    }

    // 3. RETURN_CARGO: Hauling ore, timber, or stone to the depot
    if (u.state === 'RETURN_CARGO') {
      let nearest: BuildingEntity | null = null;
      if (u.targetDropoffBuildingId) {
        nearest = buildings.find(b => b.id === u.targetDropoffBuildingId && b.owner === u.owner) || null;
      }
      if (!nearest) {
        const dropoffs = buildings.filter(
          b => b.owner === u.owner && b.buildProgress >= 1.0 && (
            b.defId === 'acropolis' ||
            b.defId === 'granary' ||
            (b.defId === 'bronze_foundry' && (u.currentCargoType === 'copper' || u.currentCargoType === 'tin' || u.currentCargoType === 'iron' || u.currentCargoType === 'stone')) ||
            (b.defId === 'iron_smelter' && u.currentCargoType === 'iron')
          )
        );
        if (dropoffs.length === 0) {
          u.state = 'IDLE';
          return;
        }
        dropoffs.sort((a, b) => Math.hypot(a.centerX - u.x, a.centerY - u.y) - Math.hypot(b.centerX - u.x, b.centerY - u.y));
        nearest = dropoffs[0];
      }

      const distToDropoff = Math.hypot(nearest.centerX - u.x, nearest.centerY - u.y);
      const reachDist = (Math.max(nearest.def.width, nearest.def.height) + 1.2) * TILE_SIZE * 0.7;

      if (distToDropoff <= reachDist || u.path.length === 0) {
        // Depot reached: Unload cargo
        if (u.currentCargoType && u.currentCargoAmount > 0) {
          const type = u.currentCargoType as ResourceType;
          let remainingSpace = economy.getRemainingStorage(type);

          // If storage full and NOT a direct manual player order to this depot:
          if (remainingSpace <= 0 && !u.isManualDropoffOrder) {
            u.state = 'WAITING_STORAGE';
            u.path = [];
            EventBus.get().emit('fx:floating_text', {
              text: `STORAGE FULL! [${type.toUpperCase()}]`,
              color: '#ef4444',
              x: u.x,
              y: u.y - 24
            });
            EventBus.get().emit('advisor:message', {
              speaker: 'burna_khabir',
              text: `Wanax, our storerooms are packed to the brim with ${type}! Build Granaries or Foundries to expand storage capacity.`,
              isAlert: true
            });
            return;
          }

          let added = 0;
          if (u.isManualDropoffOrder && remainingSpace < u.currentCargoAmount) {
            // Player explicitly directed donkey to deposit cargo into this Megaron / Granary:
            // Store cargo directly into royal reserve
            economy.resources[type] += u.currentCargoAmount;
            added = u.currentCargoAmount;
            economy.checkStorageAlerts();
            EventBus.get().emit('economy:changed', economy.resources);
          } else {
            added = economy.addResource(type, u.currentCargoAmount);
          }
          u.currentCargoAmount -= added;
          EventBus.get().emit('audio:build');

          const colorMap: Record<string, string> = {
            tin: '#93c5fd',
            copper: '#fbbf24',
            iron: '#cbd5e1',
            grain: '#fde047',
            stone: '#e2e8f0',
            timber: '#f59e0b'
          };

          EventBus.get().emit('fx:floating_text', {
            text: `+${added} ${type.toUpperCase()}`,
            color: colorMap[type] || '#4ade80',
            x: u.x,
            y: u.y - 24
          });

          if (u.currentCargoAmount > 0) {
            // Partial unload because storage filled up!
            u.state = 'WAITING_STORAGE';
            u.path = [];
            EventBus.get().emit('fx:floating_text', {
              text: `STORAGE FULL! [${u.currentCargoAmount} LEFT]`,
              color: '#f59e0b',
              x: u.x,
              y: u.y - 38
            });
            return;
          }
        }

        u.currentCargoAmount = 0;
        u.isManualDropoffOrder = false;
        u.targetDropoffBuildingId = null;

        // "FALLO RIPARTIRE" - Restore harvest target and immediately resume journey back to the vein/trees
        const harvestTarget = u.targetMineCoord || u.lastHarvestCoord;
        if (harvestTarget) {
          u.targetMineCoord = { ...harvestTarget };
          u.lastHarvestCoord = { ...harvestTarget };

          if (isTimber && decorations) {
            const tree = decorations.find(
              d => d.type === 'cedar' && (d.current === undefined || d.current > 0) &&
              Math.hypot(d.x - (u.targetMineCoord!.tx + 0.5), d.y - (u.targetMineCoord!.ty + 0.5)) < 1.2
            );
            if (!tree) {
              const nextTree = UnitFSM.findNearestTree(decorations, u.targetMineCoord.tx, u.targetMineCoord.ty);
              u.targetMineCoord = nextTree ? { tx: Math.floor(nextTree.x), ty: Math.floor(nextTree.y) } : null;
            }
          } else if (!isTimber && tileRenderer) {
            const curTile = tileRenderer.getTile(u.targetMineCoord.tx, u.targetMineCoord.ty);
            if (!curTile.startsWith('vein_')) {
              u.targetMineCoord = UnitFSM.findNearestVein(tileRenderer, u.targetMineCoord.tx, u.targetMineCoord.ty, u.currentCargoType || u.lastCargoType || 'copper');
            }
          }
        } else {
          // If no previous target recorded, locate nearest available resource node
          if (isTimber && decorations) {
            const nextTree = UnitFSM.findNearestTree(decorations, Math.floor(u.x / TILE_SIZE), Math.floor(u.y / TILE_SIZE));
            if (nextTree) u.targetMineCoord = { tx: Math.floor(nextTree.x), ty: Math.floor(nextTree.y) };
          } else if (tileRenderer) {
            const nextVein = UnitFSM.findNearestVein(tileRenderer, Math.floor(u.x / TILE_SIZE), Math.floor(u.y / TILE_SIZE), u.currentCargoType || u.lastCargoType || 'copper');
            if (nextVein) u.targetMineCoord = nextVein;
          }
        }

        if (u.targetMineCoord) {
          const curTx = Math.floor(u.x / TILE_SIZE);
          const curTy = Math.floor(u.y / TILE_SIZE);
          const pathCoords = AStar.findPath(graph, { tx: curTx, ty: curTy }, { tx: u.targetMineCoord.tx, ty: u.targetMineCoord.ty });
          if (pathCoords.length > 0) {
            u.path = pathCoords.map(c => ({ x: c.tx * TILE_SIZE + 24, y: c.ty * TILE_SIZE + 24 }));
          } else {
            u.path = [{ x: u.targetMineCoord.tx * TILE_SIZE + 24, y: u.targetMineCoord.ty * TILE_SIZE + 24 }];
          }
          u.state = 'HARVEST_SEEK';
          EventBus.get().emit('advisor:message', {
            speaker: 'burna_khabir',
            text: `Caravan unloaded at ${nearest.def.name}! Returning to extraction grounds.`,
            isAlert: false
          });
        } else {
          u.state = 'IDLE';
        }
      } else {
        this.handleMove(u, dt, graph, units);
      }
      return;
    }

    // 4. WAITING_STORAGE: Donkey holds cargo at the depot waiting for storage capacity to free up
    if (u.state === 'WAITING_STORAGE') {
      if (!u.currentCargoType || u.currentCargoAmount <= 0) {
        const harvestTarget = u.targetMineCoord || u.lastHarvestCoord;
        u.targetMineCoord = harvestTarget ? { ...harvestTarget } : null;
        u.state = u.targetMineCoord ? 'HARVEST_SEEK' : 'IDLE';
        return;
      }

      const type = u.currentCargoType as ResourceType;
      const space = economy.getRemainingStorage(type);
      if (space > 0) {
        const added = economy.addResource(type, u.currentCargoAmount);
        u.currentCargoAmount -= added;
        EventBus.get().emit('audio:build');

        const colorMap: Record<string, string> = {
          tin: '#93c5fd',
          copper: '#fbbf24',
          iron: '#cbd5e1',
          grain: '#fde047',
          stone: '#e2e8f0',
          timber: '#f59e0b'
        };

        EventBus.get().emit('fx:floating_text', {
          text: `+${added} ${type.toUpperCase()}`,
          color: colorMap[type] || '#4ade80',
          x: u.x,
          y: u.y - 24
        });

        if (u.currentCargoAmount <= 0) {
          u.currentCargoAmount = 0;
          const harvestTarget = u.targetMineCoord || u.lastHarvestCoord;
          if (harvestTarget) {
            u.targetMineCoord = { ...harvestTarget };
            u.lastHarvestCoord = { ...harvestTarget };
            u.state = 'HARVEST_SEEK';
            u.path = [];
          } else {
            u.state = 'IDLE';
          }
        }
      }
      return;
    }
  }
}
