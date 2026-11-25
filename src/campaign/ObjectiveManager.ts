import { EventBus } from '../core/EventBus.ts';
import { BuildingEntity } from '../entities/BuildingEntity.ts';
import { UnitEntity } from '../entities/UnitEntity.ts';
import { EconomySystem } from '../systems/EconomySystem.ts';
import { TacticalDirector } from '../ai/TacticalDirector.ts';
import { ScenarioData } from '../data/types.ts';

export interface ObjectiveProgress {
  id: string;
  type: string;
  description: string;
  isPrimary: boolean;
  targetId?: string;
  targetAmount?: number;
  currentAmount?: number;
  isCompleted: boolean;
  isFailed: boolean;
}

export interface MissionStats {
  elapsedSeconds: number;
  tinHarvested: number;
  enemiesSlain: number;
  friendlyCasualties: number;
  buildingsErected: number;
}

export class ObjectiveManager {
  public objectives: ObjectiveProgress[] = [];
  public stats: MissionStats = {
    elapsedSeconds: 0,
    tinHarvested: 0,
    enemiesSlain: 0,
    friendlyCasualties: 0,
    buildingsErected: 0
  };

  private isGameOver: boolean = false;
  private hadFoundryAtStart: boolean = false;
  private hadBarracksAtStart: boolean = false;
  private hadStablesAtStart: boolean = false;
  private hadAmbushCampAtStart: boolean = false;
  public totalWaves: number = 3;

  constructor(scenario: ScenarioData) {
    this.initFromScenario(scenario);
  }

  private initFromScenario(scenario: ScenarioData): void {
    const rawObjs = scenario.objectives;

    if (rawObjs?.primary) {
      for (const obj of rawObjs.primary) {
        this.objectives.push({
          id: obj.id,
          type: obj.type,
          description: obj.description,
          isPrimary: true,
          targetId: obj.targetId,
          targetAmount: obj.targetAmount || obj.targetSeconds || 1,
          currentAmount: 0,
          isCompleted: false,
          isFailed: false
        });
      }
    }

    if (rawObjs?.secondary) {
      for (const obj of rawObjs.secondary) {
        if (obj.id === 'destroy_forest_ambush') {
          this.hadAmbushCampAtStart = true;
        }
        if (obj.id === 'keep_barracks_alive') {
          this.hadBarracksAtStart = true;
        }
        if (obj.id === 'keep_foundry_alive') {
          this.hadFoundryAtStart = true;
        }
        this.objectives.push({
          id: obj.id,
          type: obj.type,
          description: obj.description,
          isPrimary: false,
          targetId: obj.targetId,
          targetAmount: obj.targetAmount || 1,
          currentAmount: 0,
          isCompleted: false,
          isFailed: false
        });
      }
    }

    if (scenario.opponents?.[0]?.waves) {
      this.totalWaves = scenario.opponents[0].waves.length;
    }
  }

  public recordBuildingErected(defId: string): void {
    this.stats.buildingsErected++;
    if (defId === 'bronze_foundry') {
      this.hadFoundryAtStart = true;
    }
    if (defId === 'barracks') {
      this.hadBarracksAtStart = true;
    }
    if (defId === 'chariot_stable') {
      this.hadStablesAtStart = true;
    }
  }

  public recordEnemyKilled(): void {
    this.stats.enemiesSlain++;
  }

  public recordFriendlyLost(): void {
    this.stats.friendlyCasualties++;
  }

  public update(
    dt: number,
    buildings: BuildingEntity[],
    units: UnitEntity[],
    economy: EconomySystem,
    tactical: TacticalDirector
  ): void {
    if (this.isGameOver) return;

    this.stats.elapsedSeconds += dt;
    const resources = economy.resources;
    this.stats.tinHarvested = Math.max(this.stats.tinHarvested, Math.floor(resources.tin));

    // 1. Check Defeat: Loss of Acropolis
    const playerAcropolis = buildings.find(b => b.owner === 'player' && b.defId === 'acropolis');
    if (!playerAcropolis || playerAcropolis.hp <= 0) {
      this.triggerDefeat('The Acropolis of Kadesh-on-Sea has fallen to the Sea Peoples!');
      return;
    }

    // 2. Check Secondary Objectives (protect_entity)
    const foundryObj = this.objectives.find(o => o.id === 'keep_foundry_alive');
    if (foundryObj && !foundryObj.isFailed) {
      const playerFoundry = buildings.find(b => b.owner === 'player' && b.defId === 'bronze_foundry');
      if (this.hadFoundryAtStart && (!playerFoundry || playerFoundry.hp <= 0)) {
        foundryObj.isFailed = true;
        EventBus.get().emit('advisor:message', {
          speaker: 'tarkhunta',
          text: 'Disaster! The Bronze Foundry has been reduced to ashes! Our casting molds are lost!',
          isAlert: true
        });
      } else if (playerFoundry && playerFoundry.hp > 0) {
        foundryObj.currentAmount = 1;
      }
    }

    const barracksObj = this.objectives.find(o => o.id === 'keep_barracks_alive');
    if (barracksObj && !barracksObj.isFailed) {
      const playerBarracks = buildings.find(b => b.owner === 'player' && b.defId === 'barracks');
      if (this.hadBarracksAtStart && (!playerBarracks || playerBarracks.hp <= 0)) {
        barracksObj.isFailed = true;
        EventBus.get().emit('advisor:message', {
          speaker: 'tarkhunta',
          text: 'The Militia Barracks has been razed! Our arms training is broken!',
          isAlert: true
        });
      } else if (playerBarracks && playerBarracks.hp > 0) {
        barracksObj.currentAmount = 1;
      }
    }

    const stablesObj = this.objectives.find(o => o.id === 'keep_stables_alive');
    if (stablesObj && !stablesObj.isFailed) {
      const playerStables = buildings.find(b => b.owner === 'player' && b.defId === 'chariot_stable');
      if (this.hadStablesAtStart && (!playerStables || playerStables.hp <= 0)) {
        stablesObj.isFailed = true;
        EventBus.get().emit('advisor:message', {
          speaker: 'zalpa',
          text: 'Disaster! The War Chariot Stables have been razed by the raiders! Our chariot breeding is broken!',
          isAlert: true
        });
      } else if (playerStables && playerStables.hp > 0) {
        stablesObj.currentAmount = 1;
      }
    }

    // Secondary Objective: L'Imboscata nei Boschi (Destroy forward raider outpost)
    const ambushObj = this.objectives.find(o => o.id === 'destroy_forest_ambush');
    if (ambushObj && !ambushObj.isCompleted && !ambushObj.isFailed) {
      const hostileOutposts = buildings.filter(b => b.owner === 'sea_peoples' && b.hp > 0);
      if (this.hadAmbushCampAtStart && hostileOutposts.length === 0) {
        ambushObj.isCompleted = true;
        ambushObj.currentAmount = 1;
        EventBus.get().emit('audio:objective_complete');
        EventBus.get().emit('advisor:message', {
          speaker: 'zalpa',
          text: 'The cedar ambush is crushed! The Shardana forward tower is smashed and we have seized their plundered timber and grain!',
          isAlert: false
        });
        EventBus.get().emit('fx:floating_text', {
          text: '+200 TIMBER, +150 GRAIN (AMBUSH CAMP SACKED)!',
          color: '#f59e0b',
          x: 44 * 48,
          y: 10 * 48 - 20
        });
        economy.resources.timber = (economy.resources.timber || 0) + 200;
        economy.resources.grain = (economy.resources.grain || 0) + 150;
        EventBus.get().emit('economy:changed', economy.resources);
      } else if (this.stats.elapsedSeconds >= (ambushObj.targetAmount || 480)) {
        ambushObj.isFailed = true;
        EventBus.get().emit('advisor:message', {
          speaker: 'burna_khabir',
          text: 'The raiders in the cedar woods have slipped past our scouts and torched the high passes! The ambush camp was not eliminated in time.',
          isAlert: true
        });
      }
    }

    // 3. Evaluate each objective
    let allPrimariesDone = true;

    for (const obj of this.objectives) {
      if (obj.isCompleted) continue;

      if (obj.id === 'build_watchtower') {
        const towers = buildings.filter(b => b.owner === 'player' && b.defId === 'watchtower' && b.buildProgress >= 1.0);
        obj.currentAmount = towers.length;
        if (towers.length >= (obj.targetAmount || 1)) {
          this.completeObjective(obj);
        } else {
          allPrimariesDone = false;
        }
      } else if (obj.id === 'train_bowmen' || (obj.type === 'train_units' && obj.targetId === 'composite_bowman')) {
        const bowmen = units.filter(u => u.owner === 'player' && u.defId === 'composite_bowman');
        obj.currentAmount = bowmen.length;
        if (bowmen.length >= (obj.targetAmount || 3)) {
          this.completeObjective(obj);
        } else {
          allPrimariesDone = false;
        }
      } else if (obj.id === 'train_chariots' || (obj.type === 'train_units' && obj.targetId === 'war_chariot')) {
        const chariots = units.filter(u => u.owner === 'player' && u.defId === 'war_chariot');
        obj.currentAmount = chariots.length;
        if (chariots.length >= (obj.targetAmount || 2)) {
          this.completeObjective(obj);
        } else {
          allPrimariesDone = false;
        }
      } else if (obj.id === 'gather_timber' || (obj.type === 'gather_resource' && obj.targetId === 'timber')) {
        obj.currentAmount = Math.floor(resources.timber);
        if (resources.timber >= (obj.targetAmount || 350)) {
          this.completeObjective(obj);
        } else {
          allPrimariesDone = false;
        }
      } else if (obj.id === 'gather_tin' || obj.id === 'gather_cargo' || obj.type === 'gather_resource') {
        obj.currentAmount = Math.floor(resources.tin);
        if (resources.tin >= (obj.targetAmount || 200)) {
          this.completeObjective(obj);
        } else {
          allPrimariesDone = false;
        }
      } else if (obj.id === 'survive_sea_peoples') {
        const remainingWaves = tactical.getRemainingWavesCount();
        const activeRaiders = units.filter(u => u.owner === 'sea_peoples' && u.hp > 0);
        const allHoldsEmpty = tactical.landingShips.every(s => s.pendingUnits.every(p => p.count === 0));

        // Total waves configured for this scenario
        const targetWaves = obj.targetAmount || this.totalWaves || 1;
        const wavesSpawned = Math.max(0, targetWaves - remainingWaves);

        // A wave is counted as repelled when all its raiders are defeated and holds emptied
        let wavesRepelled = wavesSpawned;
        if (activeRaiders.length > 0 || !allHoldsEmpty) {
          wavesRepelled = Math.max(0, wavesSpawned - 1);
        }

        obj.currentAmount = wavesRepelled;

        // Objective completes when all waves have spawned, holds are emptied, and all hostile raiders defeated
        if (remainingWaves === 0 && activeRaiders.length === 0 && allHoldsEmpty) {
          obj.currentAmount = targetWaves;
          this.completeObjective(obj);
        } else {
          allPrimariesDone = false;
        }
      }
    }

    // Emit live HUD tracking state
    EventBus.get().emit('objectives:updated', this.objectives);

    // 4. Check Victory Condition
    if (allPrimariesDone && this.objectives.some(o => o.isPrimary)) {
      if (foundryObj && !foundryObj.isFailed) {
        foundryObj.isCompleted = true;
      }
      if (barracksObj && !barracksObj.isFailed) {
        barracksObj.isCompleted = true;
      }
      if (stablesObj && !stablesObj.isFailed && this.hadStablesAtStart) {
        stablesObj.isCompleted = true;
      }
      this.triggerVictory();
    }
  }

  private completeObjective(obj: ObjectiveProgress): void {
    obj.isCompleted = true;
    EventBus.get().emit('audio:objective_complete');
    EventBus.get().emit('advisor:message', {
      speaker: 'burna_khabir',
      text: `Objective Accomplished: ${obj.description}`,
      isAlert: false
    });
  }

  private triggerVictory(): void {
    this.isGameOver = true;
    EventBus.get().emit('audio:victory');
    EventBus.get().emit('scenario:victory', {
      stats: this.stats,
      objectives: this.objectives
    });
  }

  private triggerDefeat(reason: string): void {
    this.isGameOver = true;
    EventBus.get().emit('audio:defeat');
    EventBus.get().emit('scenario:defeat', {
      reason,
      stats: this.stats,
      objectives: this.objectives
    });
  }
}
