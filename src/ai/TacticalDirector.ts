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
  public totalWavesSpawned: number = 0;
  private campSpawnTimers: Map<number, number> = new Map();

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
    // Raiders first look to sack isolated caravans, peripheral foundries/watchtowers, or the Acropolis
    let targetTx = playerTargetTx;
    let targetTy = playerTargetTy;

    if (buildings && buildings.length > 0) {
      const targetBuilding = buildings.find(
        b => b.owner === 'player' && b.buildProgress >= 1.0 && (b.defId === 'bronze_foundry' || b.defId === 'granary')
      ) || buildings.find(
        b => b.owner === 'player' && b.defId === 'acropolis' && b.hp > 0
      ) || buildings.find(
        b => b.owner === 'player' && b.hp > 0 && b.defId !== 'cyclopean_slab'
      );
      if (targetBuilding) {
        targetTx = targetBuilding.tx + Math.floor(targetBuilding.def.width / 2);
        targetTy = targetBuilding.ty + Math.floor(targetBuilding.def.height / 2);
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
        this.spawnWave(wave, graph, units, buildings);
        this.waves.splice(i, 1);
      }
    }

    // Gestione Spawner periodico degli accampamenti nemici fortificati (War Camps)
    if (buildings && buildings.length > 0) {
      const hostileCamps = buildings.filter(b => b.owner === 'sea_peoples' && b.defId === 'sea_camp' && b.hp > 0);
      for (const camp of hostileCamps) {
        let timer = this.campSpawnTimers.get(camp.id);
        if (timer === undefined) {
          // Timer iniziale: prima incursione dopo 80-100 secondi
          timer = 80 + Math.random() * 20;
          this.campSpawnTimers.set(camp.id, timer);
        } else {
          timer -= dt;
          if (timer <= 0) {
            // Nuova sortita di predoni ogni 65-85 secondi
            this.campSpawnTimers.set(camp.id, 65 + Math.random() * 20);
            this.spawnCampRaidingParty(camp, graph, units, targetTx, targetTy);
          } else {
            this.campSpawnTimers.set(camp.id, timer);
          }
        }
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

            // Find a walkable shoreline/sandbar tile near docking point
            const startScanX = Math.max(1, Math.floor(ship.targetDockX / TILE_SIZE));
            let spawnTx = -1;
            let spawnTy = ship.ty;

            // Search for an unoccupied walkable tile first, then any walkable tile
            const yOffsets = [0, 1, -1, 2, -2, 3, -3];
            for (let x = startScanX; x < Math.min(graph.width - 3, startScanX + 8); x++) {
              for (const yo of yOffsets) {
                const testY = Math.max(1, Math.min(graph.height - 2, ship.ty + yo));
                if (graph.isWalkable(x, testY)) {
                  const isTileOccupied = units.some(u =>
                    u.hp > 0 && Math.hypot(u.x - (x * TILE_SIZE + 24), u.y - (testY * TILE_SIZE + 24)) < 24
                  );
                  if (!isTileOccupied) {
                    spawnTx = x;
                    spawnTy = testY;
                    break;
                  } else if (spawnTx === -1) {
                    spawnTx = x;
                    spawnTy = testY;
                  }
                }
              }
              if (spawnTx !== -1 && !units.some(u => u.hp > 0 && Math.hypot(u.x - (spawnTx * TILE_SIZE + 24), u.y - (spawnTy * TILE_SIZE + 24)) < 24)) {
                break;
              }
            }

            if (spawnTx === -1) {
              spawnTx = Math.min(graph.width - 3, startScanX + 2);
              spawnTy = ship.ty;
            }

            const spawned = new UnitEntity(
              this.nextEntityId++,
              req.type,
              'sea_peoples',
              spawnTx * TILE_SIZE + 24,
              spawnTy * TILE_SIZE + 24
            );
            units.push(spawned);

            // Give newly spawned raider immediate marching orders towards player target
            const marchPath = AStar.findPath(graph, { tx: spawnTx, ty: spawnTy }, { tx: Math.floor(targetTx), ty: Math.floor(targetTy) }, 2000);
            if (marchPath.length > 1) {
              spawned.path = marchPath.slice(1, 10).map(c => ({
                x: c.tx * TILE_SIZE + 24,
                y: c.ty * TILE_SIZE + 24
              }));
              spawned.state = 'MOVE_TO';
            }

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

    // Applica aggressione attiva e spinta del Flow Field alle unità nemiche
    for (const u of units) {
      if (u.owner === 'sea_peoples' && (u.state === 'IDLE' || u.state === 'MOVE_TO')) {
        // 1. Controlla prima se c'è un'unità del giocatore a distanza di aggro (raggio di 260px ~ 5.5 caselle)
        let nearestPlayerTarget: UnitEntity | BuildingEntity | null = null;
        let nearestDist = 260;

        for (const target of units) {
          if (target.owner === 'player' && target.hp > 0) {
            const d = Math.hypot(target.x - u.x, target.y - u.y);
            if (d < nearestDist) {
              nearestDist = d;
              nearestPlayerTarget = target;
            }
          }
        }

        if (!nearestPlayerTarget && buildings) {
          for (const b of buildings) {
            if (b.owner === 'player' && b.hp > 0 && b.defId !== 'cyclopean_slab') {
              const d = Math.hypot(b.centerX - u.x, b.centerY - u.y);
              if (d < nearestDist) {
                nearestDist = d;
                nearestPlayerTarget = b;
              }
            }
          }
        }

        if (nearestPlayerTarget) {
          u.targetEntityId = nearestPlayerTarget.id;
          u.state = 'ATTACK_TARGET';
          u.path = [];
          continue;
        }

        // 2. Se non ha nemici immediati e si trova in IDLE, prosegue la marcia verso gli obiettivi
        if (u.state === 'IDLE') {
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

            if (nextTx < 0 || !graph.isInBounds(nextTx, nextTy) || !graph.isWalkable(nextTx, nextTy)) break;
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
                x: c.tx * TILE_SIZE + 24,
                y: c.ty * TILE_SIZE + 24
              }));
              u.state = 'MOVE_TO';
            }
          }
        }
      }
    }
  }

  private spawnWave(
    wave: WaveDefinition,
    graph: GridGraph,
    units: UnitEntity[],
    buildings?: BuildingEntity[]
  ): void {
    this.totalWavesSpawned++;
    EventBus.get().emit('audio:horn_alert');
    if (wave.advisorWarning) {
      EventBus.get().emit('advisor:message', {
        speaker: 'zalpa',
        text: wave.advisorWarning,
        isAlert: true
      });
    }

    // Calcola il punto bersaglio e il punto di sbarco Y lungo la costa ovest:
    // Varia l'approdo mantenendosi nella zona delle costruzioni del giocatore
    let targetTx = Math.floor(graph.width * 0.6);
    let targetTy = Math.floor(graph.height / 2);

    if (buildings && buildings.length > 0) {
      let playerBuildings = buildings.filter(b => b.owner === 'player' && b.defId !== 'cyclopean_slab');
      if (playerBuildings.length === 0) {
        playerBuildings = buildings.filter(b => b.owner === 'player');
      }

      if (playerBuildings.length > 0) {
        const xCoords = playerBuildings.map(b => b.tx + Math.floor(b.def.width / 2));
        const yCoords = playerBuildings.map(b => b.ty + Math.floor(b.def.height / 2));
        targetTx = Math.round(xCoords.reduce((a, b) => a + b, 0) / xCoords.length);

        const minY = Math.min(...yCoords);
        const maxY = Math.max(...yCoords);
        const span = maxY - minY;

        // Alterna l'incursione tra settore nord, settore sud e centro della base
        const waveIndex = this.totalShipsLanded;
        let chosenY: number;
        if (waveIndex % 3 === 0) {
          chosenY = minY + (span > 0 ? Math.random() * 0.3 * span : 0) - Math.floor(Math.random() * 3);
        } else if (waveIndex % 3 === 1) {
          chosenY = maxY - (span > 0 ? Math.random() * 0.3 * span : 0) + Math.floor(Math.random() * 3);
        } else {
          chosenY = minY + Math.random() * Math.max(1, span) + (Math.random() - 0.5) * 4;
        }

        targetTy = Math.round(chosenY);
      }
    }

    // Assicura che la nave resti entro i limiti di mappa navigabili
    targetTy = Math.max(4, Math.min(graph.height - 5, targetTy));

    // Se un'altra nave da sbarco è già ancorata in quella specifica casella, applica offset
    for (const existingShip of this.landingShips) {
      if (Math.abs(existingShip.ty - targetTy) < 4) {
        if (targetTy + 5 <= graph.height - 5) {
          targetTy += 5;
        } else if (targetTy - 5 >= 4) {
          targetTy -= 5;
        }
      }
    }

    if (wave.spawnEdge === 'west' || !wave.spawnEdge) {
      // Find the first walkable shore tile along or adjacent to targetTy that connects to player settlement
      let shoreTx = -1;
      let shoreTy = targetTy;
      const candidateRows = [
        targetTy,
        targetTy - 1, targetTy + 1,
        targetTy - 2, targetTy + 2,
        targetTy - 3, targetTy + 3,
        targetTy - 4, targetTy + 4,
        27, 14, 42 // Guaranteed tidal causeways in shallows maps
      ];

      for (const row of candidateRows) {
        if (row < 2 || row >= graph.height - 2) continue;
        for (let x = 3; x < Math.min(graph.width - 5, 28); x++) {
          if (graph.isWalkable(x, row)) {
            // Verify path to player settlement actually exists (avoid landing on isolated water-locked reefs)
            const testPath = AStar.findPath(graph, { tx: x, ty: row }, { tx: Math.floor(targetTx), ty: Math.floor(targetTy) }, 2000);
            if (testPath.length > 0) {
              shoreTx = x;
              shoreTy = row;
              break;
            }
          }
        }
        if (shoreTx !== -1) break;
      }

      if (shoreTx === -1) {
        // Fallback: search for any walkable tile along the row
        for (let x = 6; x < 28; x++) {
          if (graph.isWalkable(x, targetTy)) {
            shoreTx = x;
            shoreTy = targetTy;
            break;
          }
        }
        if (shoreTx === -1) {
          shoreTx = 7;
          shoreTy = targetTy;
        }
      }

      // Docking X position for the ship: stop immediately at the water-shore margin
      const startX = -150;
      const targetDockX = Math.max(2 * TILE_SIZE, (shoreTx - 1.2) * TILE_SIZE + 24);
      const totalUnits = wave.units.reduce((sum, u) => sum + u.count, 0);

      const ship: LandingShip = {
        id: this.nextEntityId++,
        x: startX,
        y: shoreTy * TILE_SIZE + 24,
        tx: startX / TILE_SIZE,
        ty: shoreTy,
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
        y: targetTy * TILE_SIZE - 20
      });
    } else {
      // Incursione terrestre da altro bordo mappa
      for (const unitReq of wave.units) {
        for (let c = 0; c < unitReq.count; c++) {
          let spawnTx = 7;
          let spawnTy = Math.floor(targetTy + (c - unitReq.count / 2) * 2);

          if (wave.spawnEdge === 'east') spawnTx = graph.width - 3;
          if (wave.spawnEdge === 'north') {
            spawnTx = Math.floor(graph.width / 2) + c * 2;
            spawnTy = 2;
          }
          if (wave.spawnEdge === 'south') {
            spawnTx = Math.floor(graph.width / 2) + c * 2;
            spawnTy = graph.height - 3;
          }

          // Ensure spawn tile is walkable
          if (!graph.isWalkable(spawnTx, spawnTy)) {
            let foundWalkable = false;
            for (let step = 1; step <= 8; step++) {
              const offsets = [
                { dx: 0, dy: step }, { dx: 0, dy: -step },
                { dx: step, dy: 0 }, { dx: -step, dy: 0 }
              ];
              for (const off of offsets) {
                const nx = spawnTx + off.dx;
                const ny = spawnTy + off.dy;
                if (graph.isInBounds(nx, ny) && graph.isWalkable(nx, ny)) {
                  spawnTx = nx;
                  spawnTy = ny;
                  foundWalkable = true;
                  break;
                }
              }
              if (foundWalkable) break;
            }
          }

          const spawned = new UnitEntity(
            this.nextEntityId++,
            unitReq.type,
            'sea_peoples',
            spawnTx * TILE_SIZE + 24,
            spawnTy * TILE_SIZE + 24
          );
          units.push(spawned);

          // Give overland raider immediate marching orders towards target
          const marchPath = AStar.findPath(graph, { tx: spawnTx, ty: spawnTy }, { tx: Math.floor(targetTx), ty: Math.floor(targetTy) }, 2000);
          if (marchPath.length > 1) {
            spawned.path = marchPath.slice(1, 10).map(c => ({
              x: c.tx * TILE_SIZE + 24,
              y: c.ty * TILE_SIZE + 24
            }));
            spawned.state = 'MOVE_TO';
          }
        }
      }

      EventBus.get().emit('fx:floating_text', {
        text: 'OVERLAND RAIDERS ASSAULT!',
        color: '#f97316',
        x: Math.floor(graph.width / 2) * TILE_SIZE,
        y: 3 * TILE_SIZE
      });
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

  private spawnCampRaidingParty(
    camp: BuildingEntity,
    graph: GridGraph,
    units: UnitEntity[],
    targetTx: number,
    targetTy: number
  ): void {
    // Drappello rapido d'incursione dal villaggio/campo nemico
    const party = [
      'sea_raider',
      'shardana_torchbearer'
    ];

    for (let i = 0; i < party.length; i++) {
      const type = party[i];
      let spawnTx = camp.tx + (i === 0 ? -1 : (i === 1 ? camp.def.width : 1));
      let spawnTy = camp.ty + (i === 2 ? camp.def.height : 1);

      if (!graph.isWalkable(spawnTx, spawnTy)) {
        for (let r = 1; r <= 3; r++) {
          let found = false;
          for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
              const nx = camp.tx + dx;
              const ny = camp.ty + dy;
              if (graph.isInBounds(nx, ny) && graph.isWalkable(nx, ny)) {
                spawnTx = nx;
                spawnTy = ny;
                found = true;
                break;
              }
            }
            if (found) break;
          }
          if (found) break;
        }
      }

      const spawned = new UnitEntity(
        this.nextEntityId++,
        type,
        'sea_peoples',
        spawnTx * TILE_SIZE + 24,
        spawnTy * TILE_SIZE + 24
      );
      units.push(spawned);

      const marchPath = AStar.findPath(graph, { tx: spawnTx, ty: spawnTy }, { tx: Math.floor(targetTx), ty: Math.floor(targetTy) }, 2000);
      if (marchPath.length > 1) {
        spawned.path = marchPath.slice(1, 10).map(c => ({
          x: c.tx * TILE_SIZE + 24,
          y: c.ty * TILE_SIZE + 24
        }));
        spawned.state = 'MOVE_TO';
      }
    }

    EventBus.get().emit('fx:floating_text', {
      text: 'WAR CAMP RAIDERS DEPLOYED!',
      color: '#ef4444',
      x: camp.centerX,
      y: camp.centerY - 25
    });
  }
}
