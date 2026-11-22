import { ScenarioData, WaveDefinition } from '../data/types.ts';
import { UnitEntity } from '../entities/UnitEntity.ts';
import { GridGraph } from '../engine/pathfinding/GridGraph.ts';
import { FlowField } from '../engine/pathfinding/FlowField.ts';
import { EventBus } from '../core/EventBus.ts';
import { TILE_SIZE } from '../data/terrain.ts';

export class TacticalDirector {
  private waves: WaveDefinition[] = [];
  private elapsedTime: number = 0;
  private flowField: FlowField;
  private nextEntityId: number = 10000;

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
    playerTargetTy: number
  ): void {
    this.elapsedTime += dt;

    // Ricalcola il Flow Field ogni 5 secondi verso il centro della città del giocatore
    if (Math.floor(this.elapsedTime) % 5 === 0 && (!this.flowField.target || this.flowField.target.tx !== playerTargetTx)) {
      this.flowField.compute(graph, { tx: playerTargetTx, ty: playerTargetTy });
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
          const nextTarget = {
            x: u.x + dir.x * TILE_SIZE * 2,
            y: u.y + dir.y * TILE_SIZE * 2
          };
          u.path = [nextTarget];
          u.state = 'MOVE_TO';
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

    for (const unitReq of wave.units) {
      for (let c = 0; c < unitReq.count; c++) {
        let spawnTx = 2;
        let spawnTy = Math.floor(graph.height / 2) + (c - unitReq.count / 2) * 2;

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
}
