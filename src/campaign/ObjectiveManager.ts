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
          targetAmount: obj.targetAmount || obj.targetSeconds || 1,
          currentAmount: 0,
          isCompleted: false,
          isFailed: false
        });
      }
    }

    if (rawObjs?.secondary) {
      for (const obj of rawObjs.secondary) {
        this.objectives.push({
          id: obj.id,
          type: obj.type,
          description: obj.description,
          isPrimary: false,
          targetAmount: 1,
          currentAmount: 1,
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

    // 2. Check Secondary Objective: keep_foundry_alive
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
        // Keeps Foundry alive
        foundryObj.currentAmount = 1;
      }
    }

    // 3. Evaluate each objective
    let allPrimariesDone = true;

    for (const obj of this.objectives) {
      if (obj.isCompleted) continue;

      if (obj.id === 'build_watchtower') {
        const towers = buildings.filter(b => b.owner === 'player' && b.defId === 'watchtower');
        obj.currentAmount = towers.length;
        if (towers.length >= (obj.targetAmount || 1)) {
          this.completeObjective(obj);
        } else {
          allPrimariesDone = false;
        }
      } else if (obj.id === 'gather_tin') {
        obj.currentAmount = Math.floor(resources.tin);
        if (resources.tin >= (obj.targetAmount || 200)) {
          this.completeObjective(obj);
        } else {
          allPrimariesDone = false;
        }
      } else if (obj.id === 'survive_sea_peoples') {
        const remainingWaves = tactical.getRemainingWavesCount();
        const activeRaiders = units.filter(u => u.owner === 'sea_peoples');
        obj.currentAmount = Math.floor(this.stats.elapsedSeconds);

        const targetSecs = obj.targetAmount || 360;
        // Waves finished, time elapsed, and raiders routed
        if (this.stats.elapsedSeconds >= targetSecs && remainingWaves === 0 && activeRaiders.length === 0) {
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
