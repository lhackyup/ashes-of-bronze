import { ScenarioData, WaveDefinition } from '../data/types.ts';
import { UnitEntity } from '../entities/UnitEntity.ts';
import { BuildingEntity } from '../entities/BuildingEntity.ts';
import { GridGraph } from '../engine/pathfinding/GridGraph.ts';
import { FlowField } from '../engine/pathfinding/FlowField.ts';
import { EventBus } from '../core/EventBus.ts';
import { TILE_SIZE } from '../data/terrain.ts';

export class TacticalDirector {
  private waves: WaveDefinition[] = [];
  private elapsedTime: number = 0;
  private flowField: FlowField;
  private nextEntityId: number = 10000;
  public landingShips: Array<{ tx: number; ty: number; waveNum: number; count: number }> = [];

  constructor(scenario: ScenarioData, width: number, height: number) {
    this.flowField = new FlowField(width, height);
    for (const opp of scenario.opponents) {
      if (opp.waves) {
        this.waves.push(...opp.waves);
      }
    }
    // Ordina per tempo di innesco
    this.waves.sort((a, b) => a.triggerTimeSeconds - b.triggerTimeSeconds);
  }

  public update(
    dt: number,
    graph: GridGraph,
    units: UnitEntity[],
    playerTargetTx: number,
    playerTargetTy: number,
    buildings?: BuildingEntity[]
  ): void {
    this.elapsedTime += dt;

    // Tactical Target Selection:
    // Raiders first look to sack isolated caravans or peripheral foundries/watchtowers
    let targetTx = playerTargetTx;
    let targetTy = playerTargetTy;

    if (buildings && buildings.length > 0) {
      // Prioritize peripheral economic targets like the bronze foundry or granaries
      const peripheralTarget = buildings.find(
        b => b.owner === 'player' && b.buildProgress >= 1.0 && (b.defId === 'bronze_foundry' || b.defId === 'granary')
      );
      if (peripheralTarget && Math.random() < 0.4) {
        targetTx = peripheralTarget.tx + Math.floor(peripheralTarget.def.width / 2);
        targetTy = peripheralTarget.ty + Math.floor(peripheralTarget.def.height / 2);
      }
    }

    // Ricalcola il Flow Field periodicamente verso il bersaglio tattico
    if (Math.floor(this.elapsedTime) % 4 === 0 && (!this.flowField.target || this.flowField.target.tx !== targetTx || this.flowField.target.ty !== targetTy)) {
      this.flowField.compute(graph, { tx: targetTx, ty: targetTy });
    }

    // Controlla attivazione delle ondate
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      if (this.elapsedTime >= wave.triggerTimeSeconds) {
        this.spawnWave(wave, graph, units);
        this.waves.splice(i, 1);
      }
    }

    // Applica spinta vettoriale del Flow Field alle unità nemiche senza ordine manuale
    for (const u of units) {
      if (u.owner === 'sea_peoples' && u.state === 'IDLE') {
        const tx = Math.floor(u.x / TILE_SIZE);
        const ty = Math.floor(u.y / TILE_SIZE);
        const dir = this.flowField.getVectorAt(tx, ty);

        if (dir.x !== 0 || dir.y !== 0) {
          const stepX = Math.round(dir.x);
          const stepTy = Math.round(dir.y);
          const nextTx = tx + stepX;
          const nextTy = ty + stepTy;

          if (graph.isInBounds(nextTx, nextTy) && graph.isWalkable(nextTx, nextTy) && nextTx >= 6) {
            u.path = [{
              x: nextTx * TILE_SIZE + 24,
              y: nextTy * TILE_SIZE + 24
            }];
            u.state = 'MOVE_TO';
          }
        }
      }
    }
  }

  private spawnWave(wave: WaveDefinition, graph: GridGraph, units: UnitEntity[]): void {
    EventBus.get().emit('audio:horn_alert');
    if (wave.advisorWarning) {
      EventBus.get().emit('advisor:message', {
        speaker: 'zalpa',
        text: wave.advisorWarning,
        isAlert: true
      });
    }

    const midTy = Math.floor(graph.height / 2);

    // Register landing skiff anchored at the surf line (x = 5.5, y = midTy)
    const shipRecord = { tx: 5.5, ty: midTy, waveNum: this.landingShips.length + 1, count: wave.units[0]?.count || 3 };
    this.landingShips.push(shipRecord);
    EventBus.get().emit('combat:ship_landed', shipRecord);

    EventBus.get().emit('fx:floating_text', {
      text: 'SHARDANA LANDING FLEET!',
      color: '#ef4444',
      x: 7 * TILE_SIZE + 24,
      y: midTy * TILE_SIZE - 20
    });

    for (const unitReq of wave.units) {
      for (let c = 0; c < unitReq.count; c++) {
        // Disembark directly onto the beach dunes (tx = 7) at exact tile centers
        let spawnTx = 7;
        let spawnTy = Math.floor(midTy + (c - unitReq.count / 2) * 2);

        if (wave.spawnEdge === 'east') spawnTx = graph.width - 3;
        if (wave.spawnEdge === 'north') {
          spawnTx = Math.floor(graph.width / 2) + c * 2;
          spawnTy = 2;
        }
        if (wave.spawnEdge === 'south') {
          spawnTx = Math.floor(graph.width / 2) + c * 2;
          spawnTy = graph.height - 3;
        }

        const spawned = new UnitEntity(
          this.nextEntityId++,
          unitReq.type,
          'sea_peoples',
          spawnTx * TILE_SIZE + 24,
          spawnTy * TILE_SIZE + 24
        );
        units.push(spawned);
      }
    }
  }

  public getRemainingWavesCount(): number {
    return this.waves.length;
  }

  public getElapsedTime(): number {
    return this.elapsedTime;
  }

  public getNextWaveCountdown(): number | null {
    return this.waves.length > 0
      ? Math.max(0, Math.ceil(this.waves[0].triggerTimeSeconds - this.elapsedTime))
      : null;
  }
}
