import { UnitEntity } from '../entities/UnitEntity.ts';
import { BuildingEntity } from '../entities/BuildingEntity.ts';
import { GridGraph } from '../engine/pathfinding/GridGraph.ts';
import { AStar } from '../engine/pathfinding/AStar.ts';
import { CombatSystem } from '../systems/CombatSystem.ts';
import { EconomySystem } from '../systems/EconomySystem.ts';
import { TILE_SIZE } from '../data/terrain.ts';
import { EventBus } from '../core/EventBus.ts';

export class UnitFSM {
  public static updateUnit(
    u: UnitEntity,
    dt: number,
    graph: GridGraph,
    units: UnitEntity[],
    buildings: BuildingEntity[],
    combat: CombatSystem,
    economy: EconomySystem
  ): void {
    if (u.attackCooldown > 0) {
      u.attackCooldown -= dt;
    }

    switch (u.state) {
      case 'IDLE':
        this.handleIdle(u, units, buildings);
        break;

      case 'MOVE_TO':
        this.handleMove(u, dt, graph);
        break;

      case 'ATTACK_TARGET':
        this.handleAttack(u, dt, units, buildings, combat, graph);
        break;

      case 'HARVEST_SEEK':
      case 'HARVESTING':
      case 'RETURN_CARGO':
      case 'UNLOADING':
        this.handleHarvestCycle(u, dt, graph, buildings, economy);
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

  private static handleMove(u: UnitEntity, dt: number, _graph: GridGraph): void {
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

        if (u.def.category === 'skirmisher' || u.def.category === 'chariot') {
          combat.fireProjectile(u.x, u.y, u.targetEntityId, isBuilding, u.def.damage || 15, 'arrow');
          EventBus.get().emit('audio:arrow');
        } else {
          // Attacco corpo a corpo immediato
          EventBus.get().emit('audio:combat_hit');
          if (isBuilding) {
            const b = buildings.find(b => b.id === u.targetEntityId);
            if (b && b.takeDamage(u.def.damage || 15)) {
              EventBus.get().emit('combat:building_destroyed', b);
              u.targetEntityId = null;
              u.state = 'IDLE';
            }
          } else {
            const victim = units.find(unit => unit.id === u.targetEntityId);
            if (victim && victim.takeDamage(u.def.damage || 15)) {
              EventBus.get().emit('combat:unit_killed', victim);
              u.targetEntityId = null;
              u.state = 'IDLE';
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

  private static handleHarvestCycle(
    u: UnitEntity,
    dt: number,
    graph: GridGraph,
    buildings: BuildingEntity[],
    economy: EconomySystem
  ): void {
    if (u.def.category !== 'worker') {
      u.state = 'IDLE';
      return;
    }

    const maxCargo = u.def.cargoCapacity || 120;

    // 1. HARVEST_SEEK: Navigates to the assigned ore vein
    if (u.state === 'HARVEST_SEEK') {
      if (!u.targetMineCoord) {
        u.state = 'IDLE';
        return;
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
          // Unreachable
          u.state = 'IDLE';
          return;
        }
      }

      this.handleMove(u, dt, graph);
      return;
    }

    // 2. HARVESTING: Chipping ore into pack baskets
    if (u.state === 'HARVESTING') {
      u.harvestAnimationTimer = (u.harvestAnimationTimer || 0) + dt;
      u.harvestCooldown += dt * (u.def.harvestSpeed || 18);

      if (u.harvestCooldown >= 10) {
        u.harvestCooldown = 0;
        u.currentCargoAmount = Math.min(maxCargo, u.currentCargoAmount + 10);
        EventBus.get().emit('audio:harvest');

        if (u.currentCargoAmount >= maxCargo) {
          // Cargo full: locate nearest active dropoff depot (Foundry or Acropolis)
          const dropoffs = buildings.filter(
            b => b.owner === u.owner && b.buildProgress >= 1.0 && (b.defId === 'bronze_foundry' || b.defId === 'acropolis')
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
        }
      }
      return;
    }

    // 3. RETURN_CARGO: Hauling ore to the smelter / acropolis
    if (u.state === 'RETURN_CARGO') {
      const dropoffs = buildings.filter(
        b => b.owner === u.owner && b.buildProgress >= 1.0 && (b.defId === 'bronze_foundry' || b.defId === 'acropolis')
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
        // Depot reached: Unload ore cargo
        if (u.currentCargoType && u.currentCargoAmount > 0) {
          const type = u.currentCargoType;
          const amount = u.currentCargoAmount;
          economy.addResource(type as any, amount);
          EventBus.get().emit('audio:build');

          const colorMap: Record<string, string> = {
            tin: '#93c5fd',
            copper: '#fbbf24',
            iron: '#cbd5e1',
            grain: '#fde047',
            stone: '#d6d3d1',
            timber: '#a16207'
          };

          EventBus.get().emit('fx:floating_text', {
            text: `+${amount} ${type.toUpperCase()}`,
            color: colorMap[type] || '#fef08a',
            x: u.x,
            y: u.y - 24
          });
        }
        u.currentCargoAmount = 0;

        // AUTOMATIC LOOP: Return to target mine if assigned
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
    }
  }
}
