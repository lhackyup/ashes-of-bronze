import { UnitEntity } from '../entities/UnitEntity.ts';
import { BuildingEntity } from '../entities/BuildingEntity.ts';
import { EventBus } from '../core/EventBus.ts';
import { TILE_SIZE } from '../data/terrain.ts';

export interface Projectile {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetId: number;
  targetIsBuilding: boolean;
  damage: number;
  speed: number;
  kind: 'arrow' | 'sling_stone' | 'javelin';
  totalDist: number;
  traveled: number;
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
      if (b.buildProgress >= 1.0 && b.def.attackRange && b.def.damage && b.attackCooldown <= 0) {
        // Cerca nemico più vicino entro il raggio di guardia della torre
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
          // Salva freccia scoccata dai merli della torre ciclopea (elevata di 28px)
          const targetDist = Math.hypot(nearest.x - b.centerX, nearest.y - (b.centerY - 28));
          this.fireProjectile(b.centerX, b.centerY - 28, nearest.id, false, b.def.damage, 'arrow', targetDist);
          b.attackCooldown = 1 / (b.def.attackRate || 1);
          EventBus.get().emit('audio:arrow');
          EventBus.get().emit('fx:combat_hit', { x: b.centerX, y: b.centerY - 32, color: '#fef08a' });
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
      p.traveled += step;

      if (dist <= step || dist < 12) {
        // Colpito!
        this.projectiles.splice(i, 1);
        EventBus.get().emit('audio:combat_hit');

        if (p.targetIsBuilding) {
          const tb = buildings.find(b => b.id === p.targetId);
          if (tb) {
            EventBus.get().emit('fx:floating_text', {
              text: `-${p.damage}`,
              color: '#f59e0b',
              x: tb.centerX,
              y: tb.centerY - 18
            });
            EventBus.get().emit('fx:combat_hit', {
              x: tb.centerX + (Math.random() - 0.5) * 20,
              y: tb.centerY + (Math.random() - 0.5) * 20,
              color: '#d97706'
            });

            const destroyed = tb.takeDamage(p.damage);
            if (destroyed) {
              EventBus.get().emit('audio:explosion');
              EventBus.get().emit('combat:building_destroyed', tb);
            }
          }
        } else {
          const tu = units.find(u => u.id === p.targetId);
          if (tu) {
            let effectiveDmg = p.damage;
            // Shield-Wall deflection: Tower-Shield Spearmen deflect 50% ranged ballistic damage
            if (tu.defId === 'spear_militia' && (p.kind === 'arrow' || p.kind === 'sling_stone')) {
              effectiveDmg = Math.max(1, Math.floor(p.damage * 0.45));
              EventBus.get().emit('fx:floating_text', {
                text: `SHIELD BLOCKED! -${effectiveDmg}`,
                color: '#93c5fd',
                x: tu.x,
                y: tu.y - 20
              });
            } else {
              EventBus.get().emit('fx:floating_text', {
                text: `-${effectiveDmg}`,
                color: '#ef4444',
                x: tu.x,
                y: tu.y - 18
              });
            }

            EventBus.get().emit('fx:combat_hit', {
              x: tu.x,
              y: tu.y,
              color: '#fbbf24'
            });

            const dead = tu.takeDamage(effectiveDmg);
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
    kind: 'arrow' | 'sling_stone' | 'javelin',
    initialDist: number = 200
  ): void {
    const speed = kind === 'arrow' ? 420 : 360;
    this.projectiles.push({
      x: sx,
      y: sy,
      startX: sx,
      startY: sy,
      targetId,
      targetIsBuilding,
      damage,
      speed,
      kind,
      totalDist: Math.max(50, initialDist),
      traveled: 0
    });
  }
}
