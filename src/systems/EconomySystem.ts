import { Cost, ResourcePool, ResourceType } from '../data/types.ts';
import { EventBus } from '../core/EventBus.ts';

export class EconomySystem {
  public resources: ResourcePool;
  public supplyMax: number = 20;
  public supplyUsed: number = 0;

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
    return true;
  }

  public addResource(type: ResourceType, amount: number): void {
    if (this.resources[type] !== undefined) {
      this.resources[type] += amount;
      EventBus.get().emit('economy:changed', this.resources);
    }
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
