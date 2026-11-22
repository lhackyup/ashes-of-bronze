import { BuildingDef, FactionId } from '../data/types.ts';
import { BUILDINGS } from '../data/buildings.ts';
import { TILE_SIZE } from '../data/terrain.ts';

export class BuildingEntity {
  public id: number;
  public defId: string;
  public def: BuildingDef;
  public owner: FactionId;
  public tx: number;
  public ty: number;
  public hp: number;
  public maxHp: number;
  public hasFoundation: boolean;
  public buildProgress: number = 1.0; // 0..1 (1.0 = completo)
  public attackCooldown: number = 0;
  public isSelected: boolean = false;
  public constructionParticleTimer: number = 0;

  constructor(
    id: number,
    defId: string,
    owner: FactionId,
    tx: number,
    ty: number,
    hasFoundation: boolean,
    isInstant: boolean = false
  ) {
    this.id = id;
    this.defId = defId;
    this.def = BUILDINGS[defId] || BUILDINGS['barracks'];
    this.owner = owner;
    this.tx = tx;
    this.ty = ty;
    this.hasFoundation = hasFoundation;

    let baseHp = this.def.maxHp;
    if (this.def.requiresFoundation && !hasFoundation) {
      baseHp = Math.floor(baseHp * (this.def.foundationPenaltyHpRatio ?? 0.5));
    }
    this.maxHp = baseHp;

    if (defId === 'cyclopean_slab' || isInstant) {
      this.buildProgress = 1.0;
      this.hp = baseHp;
    } else {
      this.buildProgress = 0.0;
      this.hp = Math.max(1, Math.floor(baseHp * 0.15));
    }
  }

  public updateConstruction(dt: number): boolean {
    if (this.buildProgress >= 1.0) return false;
    const duration = this.def.buildTime || 8;
    this.buildProgress = Math.min(1.0, this.buildProgress + dt / duration);
    this.hp = Math.max(this.hp, Math.floor(this.maxHp * Math.max(0.15, this.buildProgress)));
    return this.buildProgress >= 1.0;
  }

  public get centerX(): number {
    return (this.tx + this.def.width / 2) * TILE_SIZE;
  }

  public get centerY(): number {
    return (this.ty + this.def.height / 2) * TILE_SIZE;
  }

  public takeDamage(amount: number): boolean {
    this.hp -= amount;
    return this.hp <= 0;
  }
}
