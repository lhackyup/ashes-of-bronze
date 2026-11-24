import { UnitEntity } from '../entities/UnitEntity.ts';
import { BuildingEntity } from '../entities/BuildingEntity.ts';
import { GridGraph } from '../engine/pathfinding/GridGraph.ts';
import { AStar } from '../engine/pathfinding/AStar.ts';
import { EventBus } from '../core/EventBus.ts';
import { TILE_SIZE } from '../data/terrain.ts';

export class WildlifeDirector {
  public denBuilding: BuildingEntity | null = null;
  public activeLion: UnitEntity | null = null;
  public isLionSlain: boolean = false;
  public sortiesCompleted: number = 0;
  public readonly maxSorties: number = 3;

  private nextSortieTimer: number = 130; // First sortie at ~2m10s
  private sortieDurationTimer: number = 0;
  public isSortieActive: boolean = false;

  public denTx: number;
  public denTy: number;
  public minimapAlertPing: { x: number; y: number; timer: number } | null = null;

  constructor(denTx: number = 38, denTy: number = 8) {
    this.denTx = denTx;
    this.denTy = denTy;
  }

  public initDen(spawnBuildingFn: (defId: string, owner: any, tx: number, ty: number) => BuildingEntity | null): void {
    const den = spawnBuildingFn('lion_den', 'neutral', this.denTx, this.denTy);
    if (den) {
      this.denBuilding = den;
      den.buildProgress = 1.0;
    }
  }

  public update(
    dt: number,
    units: UnitEntity[],
    _buildings: BuildingEntity[],
    graph: GridGraph,
    spawnUnitFn: (defId: string, owner: any, x: number, y: number) => UnitEntity | null
  ): void {
    // 1. Update minimap alert ping timer
    if (this.minimapAlertPing) {
      this.minimapAlertPing.timer -= dt;
      if (this.minimapAlertPing.timer <= 0) {
        this.minimapAlertPing = null;
      }
    }

    if (this.isLionSlain) return;

    // 2. Check if the active lion was slain
    if (this.activeLion) {
      if (this.activeLion.hp <= 0) {
        this.isLionSlain = true;
        this.isSortieActive = false;
        this.activeLion = null;

        // Reward and announce
        EventBus.get().emit('wildlife:lion_slain', { grainReward: 80 });
        EventBus.get().emit('audio:objective_complete');
        EventBus.get().emit('advisor:message', {
          speaker: 'zalpa',
          text: 'The great beast of the crags has fallen! Our hunters have secured fresh meat and pelts for the garrison.',
          isAlert: false
        });
        return;
      }
    }

    // 3. Countdown towards next sortie if no lion is currently active
    if (!this.isSortieActive) {
      this.nextSortieTimer -= dt;
      if (this.nextSortieTimer <= 0 && this.sortiesCompleted < this.maxSorties) {
        this.triggerSortie(spawnUnitFn);
      }
      return;
    }

    // 4. Active Sortie AI Loop
    if (this.activeLion && this.isSortieActive) {
      this.sortieDurationTimer -= dt;

      const denWorldX = (this.denTx + 1) * TILE_SIZE;
      const denWorldY = (this.denTy + 1) * TILE_SIZE;

      // Check current target validity
      if (this.activeLion.targetEntityId) {
        const curTarget = units.find(u => u.id === this.activeLion!.targetEntityId);
        if (!curTarget || curTarget.hp <= 0) {
          this.activeLion.targetEntityId = null;
          this.activeLion.state = 'IDLE';
        }
      }

      // If sortie time expired, head back to den
      if (this.sortieDurationTimer <= 0) {
        const distToDen = Math.hypot(this.activeLion.x - denWorldX, this.activeLion.y - denWorldY);
        if (distToDen < 28) {
          // Lion safely re-entered the lair
          this.activeLion.hp = 0; // Silently remove from map
          const idx = units.indexOf(this.activeLion);
          if (idx >= 0) units.splice(idx, 1);
          this.activeLion = null;
          this.isSortieActive = false;
          this.nextSortieTimer = 190 + Math.random() * 60; // Next sortie in ~3.5 to 4.5 minutes
          return;
        } else {
          // March back to den
          if (this.activeLion.path.length === 0) {
            const startT = { tx: Math.floor(this.activeLion.x / TILE_SIZE), ty: Math.floor(this.activeLion.y / TILE_SIZE) };
            const endT = { tx: this.denTx + 1, ty: this.denTy + 1 };
            const pathCoords = AStar.findPath(graph, startT, endT, 2000);
            if (pathCoords.length > 0) {
              this.activeLion.path = pathCoords.map(c => ({ x: c.tx * TILE_SIZE + TILE_SIZE / 2, y: c.ty * TILE_SIZE + TILE_SIZE / 2 }));
              this.activeLion.state = 'MOVE_TO';
            }
          }
          return;
        }
      }

      // If hungry and no target, seek nearest non-neutral living prey (player or raider)
      if (!this.activeLion.targetEntityId || this.activeLion.state === 'IDLE') {
        const huntRadiusPx = 14 * TILE_SIZE;
        let nearestPrey: UnitEntity | null = null;
        let nearestDist = huntRadiusPx;

        for (const u of units) {
          if (u.id === this.activeLion.id) continue;
          if (u.owner === 'neutral') continue;
          if (u.hp <= 0) continue;

          const dist = Math.hypot(u.x - this.activeLion.x, u.y - this.activeLion.y);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestPrey = u;
          }
        }

        if (nearestPrey) {
          this.activeLion.targetEntityId = nearestPrey.id;
          this.activeLion.state = 'ATTACK_TARGET';
          this.activeLion.path = [];
        } else if (this.activeLion.path.length === 0) {
          // Wander near the den perimeter while sniffing the wind
          const wanderAngle = Math.random() * Math.PI * 2;
          const wanderDist = 40 + Math.random() * 80;
          const destX = Math.max(32, Math.min((graph.width - 2) * TILE_SIZE, denWorldX + Math.cos(wanderAngle) * wanderDist));
          const destY = Math.max(32, Math.min((graph.height - 2) * TILE_SIZE, denWorldY + Math.sin(wanderAngle) * wanderDist));
          const startT = { tx: Math.floor(this.activeLion.x / TILE_SIZE), ty: Math.floor(this.activeLion.y / TILE_SIZE) };
          const endT = { tx: Math.floor(destX / TILE_SIZE), ty: Math.floor(destY / TILE_SIZE) };
          const pathCoords = AStar.findPath(graph, startT, endT, 1500);
          if (pathCoords.length > 0) {
            this.activeLion.path = pathCoords.map(c => ({ x: c.tx * TILE_SIZE + TILE_SIZE / 2, y: c.ty * TILE_SIZE + TILE_SIZE / 2 }));
            this.activeLion.state = 'MOVE_TO';
          }
        }
      }
    }
  }

  private triggerSortie(
    spawnUnitFn: (defId: string, owner: any, x: number, y: number) => UnitEntity | null
  ): void {
    const denSpawnX = (this.denTx + 1) * TILE_SIZE;
    const denSpawnY = (this.denTy + 2) * TILE_SIZE;

    const lion = spawnUnitFn('levantine_lion', 'neutral', denSpawnX, denSpawnY);
    if (!lion) return;

    this.activeLion = lion;
    this.sortiesCompleted++;
    this.isSortieActive = true;
    this.sortieDurationTimer = 44; // 44 seconds of prowling

    // Sound, notification and ping
    EventBus.get().emit('audio:lion_roar');
    EventBus.get().emit('advisor:message', {
      speaker: 'zalpa',
      text: 'A ferocious lion has emerged from the rocky crags to hunt!',
      isAlert: true
    });

    this.minimapAlertPing = {
      x: denSpawnX,
      y: denSpawnY,
      timer: 8.0 // Visible on minimap for 8 seconds
    };
  }
}
