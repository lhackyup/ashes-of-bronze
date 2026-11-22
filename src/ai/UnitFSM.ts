import { UnitEntity } from '../entities/UnitEntity.ts';
import { BuildingEntity } from '../entities/BuildingEntity.ts';
import { GridGraph } from '../engine/pathfinding/GridGraph.ts';
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
        this.handleHarvestCycle(u, dt, buildings, economy);
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
    buildings: BuildingEntity[],
    economy: EconomySystem
  ): void {
    if (u.def.category !== 'worker') {
      u.state = 'IDLE';
      return;
    }

    const maxCargo = u.def.cargoCapacity || 100;

    if (u.state === 'HARVESTING') {
      u.harvestCooldown += dt * (u.def.harvestSpeed || 15);
      if (u.harvestCooldown >= 10) {
        u.harvestCooldown = 0;
        u.currentCargoAmount = Math.min(maxCargo, u.currentCargoAmount + 10);
        EventBus.get().emit('audio:harvest');

        if (u.currentCargoAmount >= maxCargo) {
          // Carico pieno: trova il punto di scarico più vicino (Fonderia o Acropoli)
          const dropoffs = buildings.filter(
            b => b.owner === u.owner && (b.defId === 'bronze_foundry' || b.defId === 'acropolis')
          );
          if (dropoffs.length > 0) {
            dropoffs.sort((a, b) => Math.hypot(a.centerX - u.x, a.centerY - u.y) - Math.hypot(b.centerX - u.x, b.centerY - u.y));
            const nearest = dropoffs[0];
            u.path = [{ x: nearest.centerX, y: nearest.centerY }];
            u.state = 'RETURN_CARGO';
          } else {
            u.state = 'IDLE';
          }
        }
      }
    } else if (u.state === 'RETURN_CARGO') {
      if (u.path.length === 0) {
        // Giunto al dropoff: scarica
        if (u.currentCargoType && u.currentCargoAmount > 0) {
          economy.addResource(u.currentCargoType as any, u.currentCargoAmount);
          EventBus.get().emit('audio:build');
        }
        u.currentCargoAmount = 0;
        u.state = 'IDLE'; // Pronta per nuovo ciclo o comando
      } else {
        this.handleMove(u, dt, null as any);
      }
    }
  }
}
