import { ScenarioData, WaveDefinition, GridCoord } from '../data/types.ts';
import { UnitEntity } from '../entities/UnitEntity.ts';
import { BuildingEntity } from '../entities/BuildingEntity.ts';
import { GridGraph } from '../engine/pathfinding/GridGraph.ts';
import { FlowField } from '../engine/pathfinding/FlowField.ts';
import { AStar } from '../engine/pathfinding/AStar.ts';
import { EventBus } from '../core/EventBus.ts';
import { TILE_SIZE } from '../data/terrain.ts';

export interface LandingShip {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  targetDockX: number;
  speed: number;
  waveNum: number;
  state: 'ARRIVING' | 'UNLOADING' | 'DEPARTING' | 'COMPLETED';
  pendingUnits: Array<{ type: string; count: number }>;
  totalUnitsCount: number;
  unitsSpawned: number;
  disembarkTimer: number;
  departWaitTimer: number;
  facing: number;
  gangplankDown: boolean;
}

export class TacticalDirector {
  private waves: WaveDefinition[] = [];
  private elapsedTime: number = 0;
  private flowField: FlowField;
  private nextEntityId: number = 10000;
  public landingShips: LandingShip[] = [];
  public totalShipsLanded: number = 0;

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

    // Aggiorna lo stato e il movimento delle navi da sbarco (arrivo dal mare, sbarco, ritirata)
    for (let i = this.landingShips.length - 1; i >= 0; i--) {
      const ship = this.landingShips[i];
      if (ship.state === 'ARRIVING') {
        ship.x += ship.speed * dt;
        ship.tx = ship.x / TILE_SIZE;
        if (ship.x >= ship.targetDockX) {
          ship.x = ship.targetDockX;
          ship.tx = ship.x / TILE_SIZE;
          ship.state = 'UNLOADING';
          ship.gangplankDown = true;
          ship.disembarkTimer = 0.6;
          this.totalShipsLanded++;
          EventBus.get().emit('combat:ship_landed', ship);
          EventBus.get().emit('fx:floating_text', {
            text: 'SHARDANA GALLEY ANCHORED!',
            color: '#ef4444',
            x: ship.x + 40,
            y: ship.y - 30
          });
        }
      } else if (ship.state === 'UNLOADING') {
        ship.disembarkTimer -= dt;
        if (ship.disembarkTimer <= 0) {
          const req = ship.pendingUnits.find(u => u.count > 0);
          if (req) {
            req.count--;
            ship.unitsSpawned++;

            const spawnTx = 7;
            const yOffset = (ship.unitsSpawned - (ship.totalUnitsCount + 1) / 2) * 1.6;
            const spawnTy = Math.max(2, Math.min(graph.height - 3, Math.round(ship.ty + yOffset)));

            const spawned = new UnitEntity(
              this.nextEntityId++,
              req.type,
              'sea_peoples',
              spawnTx * TILE_SIZE + 24,
              spawnTy * TILE_SIZE + 24
            );
            units.push(spawned);

            EventBus.get().emit('fx:floating_text', {
              text: 'RAIDER DISEMBARKS!',
              color: '#f97316',
              x: spawnTx * TILE_SIZE + 24,
              y: spawnTy * TILE_SIZE - 12
            });

            ship.disembarkTimer = 0.75;
          } else {
            // Tutte le unità sono sbarcate: attesa e poi ritirata verso il mare aperto
            ship.departWaitTimer -= dt;
            if (ship.departWaitTimer <= 0) {
              ship.state = 'DEPARTING';
              ship.gangplankDown = false;
              ship.facing = -1; // prua girata a ovest verso il mare aperto
              EventBus.get().emit('fx:floating_text', {
                text: 'GALLEY RETREATS TO SEA!',
                color: '#38bdf8',
                x: ship.x,
                y: ship.y - 30
              });
            }
          }
        }
      } else if (ship.state === 'DEPARTING') {
        ship.x -= ship.speed * dt;
        ship.tx = ship.x / TILE_SIZE;
        if (ship.x <= -200) {
          ship.state = 'COMPLETED';
          this.landingShips.splice(i, 1);
        }
      }
    }

    // Applica spinta vettoriale del Flow Field alle unità nemiche senza ordine manuale
    for (const u of units) {
      if (u.owner === 'sea_peoples' && u.state === 'IDLE') {
        const tx = Math.floor(u.x / TILE_SIZE);
        const ty = Math.floor(u.y / TILE_SIZE);
        // Trace flow field forward up to 8 tiles to create a smooth, continuous march
        const path: Array<{ x: number; y: number }> = [];
        let currTx = tx;
        let currTy = ty;

        for (let step = 0; step < 8; step++) {
          const dir = this.flowField.getVectorAt(currTx, currTy);
          if (dir.x === 0 && dir.y === 0) break;
          const stepX = Math.round(dir.x);
          const stepTy = Math.round(dir.y);
          const nextTx = currTx + stepX;
          const nextTy = currTy + stepTy;

          if (nextTx < 6 || !graph.isInBounds(nextTx, nextTy) || !graph.isWalkable(nextTx, nextTy)) break;
          if (nextTx === currTx && nextTy === currTy) break;

          path.push({
            x: nextTx * TILE_SIZE + 24,
            y: nextTy * TILE_SIZE + 24
          });
          currTx = nextTx;
          currTy = nextTy;
        }

        if (path.length > 0) {
          u.path = path;
          u.state = 'MOVE_TO';
        } else {
          // Flow field neutral or stalled: plan direct march towards player target
          const pathCoords = AStar.findPath(graph, { tx, ty }, { tx: targetTx, ty: targetTy }, 2000);
          if (pathCoords.length > 1) {
            u.path = pathCoords.slice(1, 10).map((c: GridCoord) => ({
              x: Math.max(6 * TILE_SIZE + 24, c.tx * TILE_SIZE + 24),
              y: c.ty * TILE_SIZE + 24
            }));
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

    if (wave.spawnEdge === 'west' || !wave.spawnEdge) {
      // Approccio navale: la galea da guerra Shardana arriva gradualmente via mare da ovest
      const startX = -150;
      const targetDockX = 5.3 * TILE_SIZE + 24;
      const totalUnits = wave.units.reduce((sum, u) => sum + u.count, 0);

      const ship: LandingShip = {
        id: this.nextEntityId++,
        x: startX,
        y: midTy * TILE_SIZE + 24,
        tx: startX / TILE_SIZE,
        ty: midTy,
        targetDockX,
        speed: 75,
        waveNum: this.totalShipsLanded + 1,
        state: 'ARRIVING',
        pendingUnits: wave.units.map(u => ({ type: u.type, count: u.count })),
        totalUnitsCount: totalUnits,
        unitsSpawned: 0,
        disembarkTimer: 0.6,
        departWaitTimer: 1.2,
        facing: 1, // prua a est verso la terraferma
        gangplankDown: false
      };
      this.landingShips.push(ship);

      EventBus.get().emit('fx:floating_text', {
        text: 'SHARDANA SHIP SPOTTED!',
        color: '#f59e0b',
        x: 2 * TILE_SIZE,
        y: midTy * TILE_SIZE - 20
      });
    } else {
      // Incursione terrestre da altro bordo mappa
      for (const unitReq of wave.units) {
        for (let c = 0; c < unitReq.count; c++) {
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
