import { Cost, ResourcePool, ResourceType } from '../data/types.ts';
import { EventBus } from '../core/EventBus.ts';
import { BuildingEntity } from '../entities/BuildingEntity.ts';

export class EconomySystem {
  public resources: ResourcePool;
  public supplyMax: number = 20;
  public supplyUsed: number = 0;

  // Maximum capacity per resource type provided by storehouses, granaries & foundries
  public storageMax: Record<ResourceType, number> = {
    copper: 500,
    tin: 500,
    iron: 500,
    grain: 500,
    stone: 500,
    timber: 500
  };

  private warnedNearMax: Record<string, boolean> = {};
  private warnedFull: Record<string, boolean> = {};

  constructor(initialResources: Partial<ResourcePool> = {}) {
    this.resources = {
      copper: initialResources.copper ?? 400,
      tin: initialResources.tin ?? 100,
      iron: initialResources.iron ?? 0,
      grain: initialResources.grain ?? 200,
      stone: initialResources.stone ?? 150,
      timber: initialResources.timber ?? 150
    };
  }

  public updateStorageCapacity(buildings: BuildingEntity[]): void {
    // Base capacity from royal Megaron / administrative settlement
    const newMax: Record<ResourceType, number> = {
      copper: 500,
      tin: 500,
      iron: 500,
      grain: 500,
      stone: 500,
      timber: 500
    };

    let acropolisCount = 0;
    for (const b of buildings) {
      if (b.owner === 'player' && b.buildProgress >= 1.0) {
        if (b.defId === 'acropolis') {
          acropolisCount++;
          if (acropolisCount > 1) {
            newMax.copper += 500;
            newMax.tin += 500;
            newMax.iron += 500;
            newMax.grain += 500;
            newMax.stone += 500;
            newMax.timber += 500;
          }
        } else if (b.defId === 'granary') {
          // Granary & Water Well: increases grain, timber and stone storage by +500, ores by +200
          newMax.grain += 500;
          newMax.timber += 500;
          newMax.stone += 400;
          newMax.copper += 200;
          newMax.tin += 200;
          newMax.iron += 200;
        } else if (b.defId === 'bronze_foundry') {
          // Bronze Foundry & Storage: increases copper, tin, iron by +500, stone by +350
          newMax.copper += 500;
          newMax.tin += 500;
          newMax.iron += 500;
          newMax.stone += 350;
        }
      }
    }

    let changed = false;
    for (const k of Object.keys(newMax) as ResourceType[]) {
      if (this.storageMax[k] !== newMax[k]) {
        this.storageMax[k] = newMax[k];
        changed = true;
      }
    }

    if (changed) {
      EventBus.get().emit('economy:storage_changed', this.storageMax);
      EventBus.get().emit('economy:changed', this.resources);
      this.checkStorageAlerts();
    }
  }

  public checkStorageAlerts(): void {
    const types: ResourceType[] = ['copper', 'tin', 'stone', 'timber', 'iron', 'grain'];
    for (const t of types) {
      const cur = this.resources[t] || 0;
      const max = this.storageMax[t] || 500;
      const ratio = cur / max;

      if (ratio >= 1.0) {
        if (!this.warnedFull[t]) {
          this.warnedFull[t] = true;
          this.warnedNearMax[t] = true;
          const isOre = t === 'copper' || t === 'tin' || t === 'iron';
          const speaker = isOre ? 'tarkhunta' : 'burna_khabir';
          const speakerName = isOre ? 'Tarkhunta' : 'Burna-Khabir';
          const resName = t.toUpperCase();
          EventBus.get().emit('advisor:message', {
            speaker,
            text: `${speakerName}: Wanax! Our storerooms for ${resName} are 100% FULL (${Math.floor(cur)}/${max})! Build a ${isOre ? 'Bronze Foundry' : 'Granary'} or spend resources!`,
            isAlert: true
          });
          EventBus.get().emit('audio:combat_hit');
        }
      } else if (ratio >= 0.85) {
        if (!this.warnedNearMax[t]) {
          this.warnedNearMax[t] = true;
          const isOre = t === 'copper' || t === 'tin' || t === 'iron';
          const speaker = isOre ? 'tarkhunta' : 'burna_khabir';
          const speakerName = isOre ? 'Tarkhunta' : 'Burna-Khabir';
          const resName = t.charAt(0).toUpperCase() + t.slice(1);
          const pct = Math.floor(ratio * 100);
          EventBus.get().emit('advisor:message', {
            speaker,
            text: `${speakerName}: Wanax, heed my counsel! Our ${resName} stockpile approaches capacity (${Math.floor(cur)}/${max} — ${pct}%)! Erect a ${isOre ? 'Bronze Foundry' : 'Granary'} before our donkeys are halted.`,
            isAlert: false
          });
        }
      } else if (ratio < 0.75) {
        this.warnedNearMax[t] = false;
        this.warnedFull[t] = false;
      }
    }
  }

  public getRemainingStorage(type: ResourceType): number {
    const cur = this.resources[type] || 0;
    const max = this.storageMax[type] || 500;
    return Math.max(0, max - cur);
  }

  public isStorageFull(type: ResourceType): boolean {
    return this.getRemainingStorage(type) <= 0;
  }

  public canAfford(cost: Cost): boolean {
    if (cost.copper && this.resources.copper < cost.copper) return false;
    if (cost.tin && this.resources.tin < cost.tin) return false;
    if (cost.iron && this.resources.iron < cost.iron) return false;
    if (cost.grain && this.resources.grain < cost.grain) return false;
    if (cost.stone && this.resources.stone < cost.stone) return false;
    if (cost.timber && this.resources.timber < cost.timber) return false;
    return true;
  }

  public spend(cost: Cost): boolean {
    if (!this.canAfford(cost)) return false;

    if (cost.copper) this.resources.copper -= cost.copper;
    if (cost.tin) this.resources.tin -= cost.tin;
    if (cost.iron) this.resources.iron -= cost.iron;
    if (cost.grain) this.resources.grain -= cost.grain;
    if (cost.stone) this.resources.stone -= cost.stone;
    if (cost.timber) this.resources.timber -= cost.timber;

    EventBus.get().emit('economy:changed', this.resources);
    this.checkStorageAlerts();
    return true;
  }

  public addResource(type: ResourceType, amount: number): number {
    if (this.resources[type] !== undefined) {
      const space = this.getRemainingStorage(type);
      const toAdd = Math.min(amount, space);
      if (toAdd > 0) {
        this.resources[type] += toAdd;
        EventBus.get().emit('economy:changed', this.resources);
        this.checkStorageAlerts();
      }
      return toAdd;
    }
    return 0;
  }

  public updateSupply(max: number, used: number): void {
    this.supplyMax = max;
    this.supplyUsed = used;
    EventBus.get().emit('economy:supply_changed', { max: this.supplyMax, used: this.supplyUsed });
  }

  public hasAvailableSupply(amount: number): boolean {
    return this.supplyUsed + amount <= this.supplyMax;
  }
}
