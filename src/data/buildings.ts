import { BuildingDef } from './types.ts';

export const BUILDINGS: Record<string, BuildingDef> = {
  cyclopean_slab: {
    id: 'cyclopean_slab',
    name: 'Cyclopean Foundation',
    category: 'foundation',
    width: 2,
    height: 2,
    maxHp: 350,
    cost: { copper: 15, stone: 30 },
    buildTime: 3.5,
    description: 'Dry-laid megalithic stone slabs. Mandatory foundation to prevent structural HP penalties on buildings.',
    requiresFoundation: false
  },

  acropolis: {
    id: 'acropolis',
    name: 'Megaron / Royal Acropolis',
    category: 'economy',
    width: 4,
    height: 4,
    maxHp: 2400,
    cost: { copper: 350, stone: 200, timber: 150 },
    buildTime: 25,
    description: 'Beating heart of the city-state. Stores 500 of all resources, coordinates administration, and trains donkey caravans.',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    supplyProvided: 15,
    storageProvided: 500,
    dropsOffResources: ['copper', 'tin', 'iron', 'grain', 'stone', 'timber'],
    producesUnits: ['donkey_caravan']
  },

  granary: {
    id: 'granary',
    name: 'Granary & Water Well',
    category: 'economy',
    width: 2,
    height: 2,
    maxHp: 650,
    cost: { copper: 80, timber: 60 },
    buildTime: 8,
    description: 'Stores grain and supplies. Increases resource storage (+500 Grain/Timber/Stone, +200 Ores) and unit capacity (+10 Supply).',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    supplyProvided: 10,
    storageProvided: 500
  },

  bronze_foundry: {
    id: 'bronze_foundry',
    name: 'Bronze Foundry & Storage',
    category: 'economy',
    width: 3,
    height: 3,
    maxHp: 1100,
    cost: { copper: 200, stone: 80, timber: 50 },
    buildTime: 14,
    description: 'Primary drop-off facility for ore caravans. Smelts ingots and expands mineral storage capacity (+500 Copper/Tin/Iron, +300 Stone).',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    storageProvided: 500,
    dropsOffResources: ['copper', 'tin', 'iron'],
    producesUnits: ['donkey_caravan']
  },

  iron_smelter: {
    id: 'iron_smelter',
    name: 'Iron Bloomery Furnaces',
    category: 'technology',
    width: 3,
    height: 3,
    maxHp: 1300,
    cost: { copper: 250, stone: 150, timber: 100 },
    buildTime: 20,
    description: 'Revolutionary double-bellows technology. Reduces raw iron ore into forged steel without needing scarce tin.',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    unlockEra: 'early_iron',
    dropsOffResources: ['iron']
  },

  barracks: {
    id: 'barracks',
    name: 'Militia Barracks & Forge',
    category: 'military',
    width: 3,
    height: 3,
    maxHp: 1000,
    cost: { copper: 150, timber: 100 },
    buildTime: 12,
    description: 'Trains tower-shield spearmen, Levantine slingers, and assault infantry.',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    producesUnits: ['spear_militia', 'skirmisher', 'bronze_swordsman', 'iron_infantry']
  },

  watchtower: {
    id: 'watchtower',
    name: 'Cyclopean Watchtower',
    category: 'defense',
    width: 2,
    height: 2,
    maxHp: 800,
    cost: { copper: 120, stone: 90, timber: 40 },
    buildTime: 9,
    description: 'Unlocks minimap radar coverage across the surrounding area and fires arrows at encroaching raiders.',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    radarRange: 18,
    attackRange: 5.5,
    damage: 22,
    attackRate: 1.2
  },

  chariot_stable: {
    id: 'chariot_stable',
    name: 'War Chariot Stables',
    category: 'military',
    width: 3,
    height: 3,
    maxHp: 1200,
    cost: { copper: 280, tin: 50, timber: 160 },
    buildTime: 18,
    description: 'Breeds horses and builds 2-horse war chariots. Requires tin for bronze horse armor.',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    producesUnits: ['war_chariot']
  }
};
