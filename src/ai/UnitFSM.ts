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
        this.handleHarvestCycle(u, dt, graph, buildings, economy, tileRenderer, decorations);
        break;
    }
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
        if (other.owner !== u.owner) {
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
        if (b.owner !== u.owner) {
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

  private static handleMove(u: UnitEntity, dt: number, _graph: GridGraph, units?: UnitEntity[]): void {
    // If military unit moving, continuously scan for encroaching enemies within aggro sight (4 tiles)
    if (units && (u.def.category === 'infantry' || u.def.category === 'skirmisher' || u.def.category === 'chariot')) {
      const aggroRange = (u.def.attackRange || 1.5) * TILE_SIZE + 80;
      for (const other of units) {
        if (other.owner !== u.owner) {
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

    const nextWp = u.path[0];
    const dx = nextWp.x - u.x;
    const dy = nextWp.y - u.y;
    const dist = Math.hypot(dx, dy);
    const speedPx = u.def.speed * TILE_SIZE * dt;

    if (dist <= speedPx) {
      u.x = nextWp.x;
      u.y = nextWp.y;
      u.path.shift();
      if (u.path.length === 0) {
        u.state = 'IDLE';
      }
    } else {
      u.x += (dx / dist) * speedPx;
      u.y += (dy / dist) * speedPx;
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

    const targetUnit = units.find(unit => unit.id === u.targetEntityId);
    if (targetUnit) {
      targetX = targetUnit.x;
      targetY = targetUnit.y;
    } else {
      const targetB = buildings.find(b => b.id === u.targetEntityId);
      if (targetB) {
        targetX = targetB.centerX;
        targetY = targetB.centerY;
        isBuilding = true;
      } else {
        // Bersaglio morto o non trovato
        u.targetEntityId = null;
        u.state = 'IDLE';
        return;
      }
    }

    const dx = targetX - u.x;
    const dy = targetY - u.y;
    const dist = Math.hypot(dx, dy);
    const attackRangePx = (u.def.attackRange || 1.2) * TILE_SIZE;

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
      // Avvicinati al bersaglio
      const step = u.def.speed * TILE_SIZE * dt;
      u.x += (dx / dist) * step;
      u.y += (dy / dist) * step;
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
    decorations?: Array<{ x: number; y: number; type: string; current?: number; max?: number }>
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

      this.handleMove(u, dt, graph);
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
            // Locate nearest valid dropoff depot: Acropolis for all goods; Foundry also accepts metal ores
            const dropoffs = buildings.filter(
              b => b.owner === u.owner && b.buildProgress >= 1.0 && (
                b.defId === 'acropolis' ||
                (b.defId === 'bronze_foundry' && (u.currentCargoType === 'copper' || u.currentCargoType === 'tin' || u.currentCargoType === 'iron'))
              )
            );
            if (dropoffs.length > 0) {
              dropoffs.sort((a, b) => Math.hypot(a.centerX - u.x, a.centerY - u.y) - Math.hypot(b.centerX - u.x, b.centerY - u.y));
              const nearest = dropoffs[0];
              const curTx = Math.floor(u.x / TILE_SIZE);
              const curTy = Math.floor(u.y / TILE_SIZE);
              const dropTx = nearest.tx + Math.floor(nearest.def.width / 2);
              const dropTy = nearest.ty + Math.floor(nearest.def.height / 2);

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
      const dropoffs = buildings.filter(
        b => b.owner === u.owner && b.buildProgress >= 1.0 && (
          b.defId === 'acropolis' ||
          (b.defId === 'bronze_foundry' && (u.currentCargoType === 'copper' || u.currentCargoType === 'tin' || u.currentCargoType === 'iron'))
        )
      );
      if (dropoffs.length === 0) {
        u.state = 'IDLE';
        return;
      }
      dropoffs.sort((a, b) => Math.hypot(a.centerX - u.x, a.centerY - u.y) - Math.hypot(b.centerX - u.x, b.centerY - u.y));
      const nearest = dropoffs[0];
      const distToDropoff = Math.hypot(nearest.centerX - u.x, nearest.centerY - u.y);
      const reachDist = (Math.max(nearest.def.width, nearest.def.height) + 1) * TILE_SIZE * 0.7;

      if (distToDropoff <= reachDist || u.path.length === 0) {
        // Depot reached: Unload cargo
        if (u.currentCargoType && u.currentCargoAmount > 0) {
          const type = u.currentCargoType as ResourceType;
          const remainingSpace = economy.getRemainingStorage(type);

          if (remainingSpace <= 0) {
            // Storage is 100% full! Donkey CANNOT unload!
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
            color: colorMap[type] || '#fef08a',
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

        // AUTOMATIC LOOP: Return to target mine or cedar grove if assigned
        if (u.targetMineCoord) {
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
              u.targetMineCoord = UnitFSM.findNearestVein(tileRenderer, u.targetMineCoord.tx, u.targetMineCoord.ty, u.currentCargoType || 'copper');
            }
          }
        }

        if (u.targetMineCoord) {
          const curTx = Math.floor(u.x / TILE_SIZE);
          const curTy = Math.floor(u.y / TILE_SIZE);
          const pathCoords = AStar.findPath(graph, { tx: curTx, ty: curTy }, { tx: u.targetMineCoord.tx, ty: u.targetMineCoord.ty });
          if (pathCoords.length > 0) {
            u.path = pathCoords.map(c => ({ x: c.tx * TILE_SIZE + 24, y: c.ty * TILE_SIZE + 24 }));
            u.state = 'HARVEST_SEEK';
          } else {
            u.path = [{ x: u.targetMineCoord.tx * TILE_SIZE + 24, y: u.targetMineCoord.ty * TILE_SIZE + 24 }];
            u.state = 'HARVEST_SEEK';
          }
        } else {
          u.state = 'IDLE';
        }
      } else {
        this.handleMove(u, dt, graph);
      }
      return;
    }

    // 4. WAITING_STORAGE: Donkey holds cargo at the depot waiting for storage capacity to free up
    if (u.state === 'WAITING_STORAGE') {
      if (!u.currentCargoType || u.currentCargoAmount <= 0) {
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
          if (u.targetMineCoord) {
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
