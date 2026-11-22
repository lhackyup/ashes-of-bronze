import { FactionId, GridCoord, UnitDef, UnitState, Vector2 } from '../data/types.ts';
import { UNITS } from '../data/units.ts';

export class UnitEntity {
  public id: number;
  public defId: string;
  public def: UnitDef;
  public owner: FactionId;
  public x: number;
  public y: number;
  public hp: number;
  public maxHp: number;
  public state: UnitState = 'IDLE';

  // Navigazione & Waypoint
  public path: Vector2[] = [];
  public targetEntityId: number | null = null;
  public targetPosition: Vector2 | null = null;
  public targetMineCoord: GridCoord | null = null;

  // Economia / Cargo per carovane
  public currentCargoType: string | null = null;
  public currentCargoAmount: number = 0;
  public harvestCooldown: number = 0;
  public harvestAnimationTimer: number = 0;

  // Combattimento
  public attackCooldown: number = 0;
  public isSelected: boolean = false;

  constructor(id: number, defId: string, owner: FactionId, x: number, y: number) {
    this.id = id;
    this.defId = defId;
    this.def = UNITS[defId] || UNITS['spear_militia'];
    this.owner = owner;
    this.x = x;
    this.y = y;
    this.maxHp = this.def.maxHp;
    this.hp = this.maxHp;
  }

  public takeDamage(amount: number): boolean {
    const effectiveDamage = Math.max(1, amount - (this.def.armor || 0));
    this.hp -= effectiveDamage;
    return this.hp <= 0;
  }
}
