import { UnitEntity } from '../entities/UnitEntity.ts';
import { BuildingEntity } from '../entities/BuildingEntity.ts';
import { EventBus } from '../core/EventBus.ts';
import { TILE_SIZE } from '../data/terrain.ts';

export interface Projectile {
  x: number;
  y: number;
  targetId: number;
  targetIsBuilding: boolean;
  damage: number;
  speed: number;
  kind: 'arrow' | 'sling_stone' | 'javelin';
}

export class CombatSystem {
  public projectiles: Projectile[] = [];

  public update(
    dt: number,
    units: UnitEntity[],
    buildings: BuildingEntity[]
  ): void {
    // 1. Aggiorna torri difensive
    for (const b of buildings) {
      if (b.attackCooldown > 0) {
        b.attackCooldown -= dt;
      }
      if (b.def.attackRange && b.def.damage && b.attackCooldown <= 0) {
        // Cerca nemico più vicino
        const rangePx = b.def.attackRange * TILE_SIZE;
        let nearest: UnitEntity | null = null;
        let nearestDist = rangePx;

        for (const u of units) {
          if (u.owner !== b.owner) {
            const dist = Math.hypot(u.x - b.centerX, u.y - b.centerY);
            if (dist <= nearestDist) {
              nearestDist = dist;
              nearest = u;
            }
          }
        }

        if (nearest) {
          this.fireProjectile(b.centerX, b.centerY, nearest.id, false, b.def.damage, 'arrow');
          b.attackCooldown = 1 / (b.def.attackRate || 1);
          EventBus.get().emit('audio:arrow');
        }
      }
    }

    // 2. Aggiorna proiettili in volo
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      let targetX = 0;
      let targetY = 0;
      let found = false;

      if (p.targetIsBuilding) {
        const tb = buildings.find(b => b.id === p.targetId);
        if (tb) {
          targetX = tb.centerX;
          targetY = tb.centerY;
          found = true;
        }
      } else {
        const tu = units.find(u => u.id === p.targetId);
        if (tu) {
          targetX = tu.x;
          targetY = tu.y;
          found = true;
        }
      }

      if (!found) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const dx = targetX - p.x;
      const dy = targetY - p.y;
      const dist = Math.hypot(dx, dy);
      const step = p.speed * dt;

      if (dist <= step || dist < 12) {
        // Colpito!
        this.projectiles.splice(i, 1);
        EventBus.get().emit('audio:combat_hit');

        if (p.targetIsBuilding) {
          const tb = buildings.find(b => b.id === p.targetId);
          if (tb) {
            const destroyed = tb.takeDamage(p.damage);
            if (destroyed) {
              EventBus.get().emit('audio:explosion');
              EventBus.get().emit('combat:building_destroyed', tb);
            }
          }
        } else {
          const tu = units.find(u => u.id === p.targetId);
          if (tu) {
            const dead = tu.takeDamage(p.damage);
            if (dead) {
              EventBus.get().emit('combat:unit_killed', tu);
            }
          }
        }
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
      }
    }
  }

  public fireProjectile(
    sx: number,
    sy: number,
    targetId: number,
    targetIsBuilding: boolean,
    damage: number,
    kind: 'arrow' | 'sling_stone' | 'javelin'
  ): void {
    const speed = kind === 'arrow' ? 420 : 360;
    this.projectiles.push({
      x: sx,
      y: sy,
      targetId,
      targetIsBuilding,
      damage,
      speed,
      kind
    });
  }
}
