import { UnitDef } from './types.ts';

export const UNITS: Record<string, UnitDef> = {
  donkey_caravan: {
    id: 'donkey_caravan',
    name: 'Donkey Caravan & Baskets',
    category: 'worker',
    maxHp: 280,
    speed: 2.2,
    cost: { copper: 100, timber: 20 },
    trainTime: 8,
    description: 'Pack donkey logistics unit. Gathers copper, tin, or iron and hauls cargo automatically or on manual command.',
    supplyCost: 1,
    cargoCapacity: 120,
    harvestSpeed: 18,
    armor: 1
  },

  spear_militia: {
    id: 'spear_militia',
    name: 'Tower-Shield Spearman',
    category: 'infantry',
    maxHp: 160,
    speed: 1.8,
    cost: { copper: 45, grain: 20 },
    trainTime: 4.5,
    description: 'Defensive archaic infantry. Holds chokepoints and stands firm against Sea Peoples charges.',
    supplyCost: 1,
    attackRange: 1.2,
    damage: 16,
    attackCooldown: 1.1,
    armor: 2,
    damageType: 'pierce'
  },

  skirmisher: {
    id: 'skirmisher',
    name: 'Levantine Slinger',
    category: 'skirmisher',
    maxHp: 110,
    speed: 2.4,
    cost: { copper: 35, timber: 25 },
    trainTime: 4.0,
    description: 'Fast, light ranged unit. Slings river stones and throws javelins from a safe distance.',
    supplyCost: 1,
    attackRange: 4.2,
    damage: 12,
    attackCooldown: 0.9,
    armor: 0,
    damageType: 'pierce'
  },

  bronze_swordsman: {
    id: 'bronze_swordsman',
    name: 'Khopesh Bronze Warrior',
    category: 'infantry',
    maxHp: 260,
    speed: 2.0,
    cost: { copper: 85, tin: 25, grain: 30 },
    trainTime: 7.5,
    description: 'Elite champion wielding a curved bronze khopesh sword and crested helmet. Devastating, but constrained by tin supplies.',
    supplyCost: 2,
    attackRange: 1.2,
    damage: 32,
    attackCooldown: 1.0,
    armor: 4,
    damageType: 'slash'
  },

  war_chariot: {
    id: 'war_chariot',
    name: 'Royal War Chariot (2 Horses)',
    category: 'chariot',
    maxHp: 420,
    speed: 3.6,
    cost: { copper: 160, tin: 40, timber: 80 },
    trainTime: 12,
    description: 'Supreme weapon of the Bronze Age. Lightning-fast in open plains, firing composite bows on the move.',
    supplyCost: 3,
    attackRange: 5.0,
    damage: 28,
    attackCooldown: 1.3,
    armor: 3,
    damageType: 'pierce'
  },

  iron_infantry: {
    id: 'iron_infantry',
    name: 'Heavy Iron Assault Infantry',
    category: 'infantry',
    maxHp: 340,
    speed: 1.9,
    cost: { iron: 70, grain: 25 },
    trainTime: 6.0,
    description: 'Born from the iron metallurgy revolution. Cheap, requiring zero tin, armed with long iron pikes and studded shields.',
    supplyCost: 1,
    unlockEra: 'early_iron',
    attackRange: 1.3,
    damage: 38,
    attackCooldown: 1.0,
    armor: 5,
    damageType: 'pierce'
  },

  sea_raider: {
    id: 'sea_raider',
    name: 'Sea Peoples Raider (Shardana)',
    category: 'infantry',
    maxHp: 210,
    speed: 2.3,
    cost: { copper: 60 },
    trainTime: 5,
    description: 'Landing warrior with horned helmet, round studded shield, and bronze broadsword. Deadly on the charge.',
    supplyCost: 1,
    attackRange: 1.1,
    damage: 26,
    attackCooldown: 0.95,
    armor: 2,
    damageType: 'slash'
  }
};
