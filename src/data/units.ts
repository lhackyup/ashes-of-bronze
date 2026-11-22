import { UnitDef } from './types.ts';

export const UNITS: Record<string, UnitDef> = {
  donkey_caravan: {
    id: 'donkey_caravan',
    name: 'Carovana d\'Asini & Ceste',
    category: 'worker',
    maxHp: 280,
    speed: 2.2,
    cost: { copper: 100, timber: 20 },
    trainTime: 8,
    description: 'Mezzo logistico con asinelli e ceste di giunco. Raccoglie rame, stagno o ferro e fa la spola autonoma o manuale.',
    supplyCost: 1,
    cargoCapacity: 120,
    harvestSpeed: 18,
    armor: 1
  },

  spear_militia: {
    id: 'spear_militia',
    name: 'Milizia con Scudo a Torre & Lancia',
    category: 'infantry',
    maxHp: 160,
    speed: 1.8,
    cost: { copper: 45, grain: 20 },
    trainTime: 4.5,
    description: 'Fanteria difensiva arcaica. Eccellente nel bloccare varchi e resistere agli assalti dei predoni marittimi.',
    supplyCost: 1,
    attackRange: 1.2,
    damage: 16,
    attackCooldown: 1.1,
    armor: 2,
    damageType: 'pierce'
  },

  skirmisher: {
    id: 'skirmisher',
    name: 'Fromboliere & Giavellottista Levantino',
    category: 'skirmisher',
    maxHp: 110,
    speed: 2.4,
    cost: { copper: 35, timber: 25 },
    trainTime: 4.0,
    description: 'Unità leggera e rapida da distanza. Scaglia pietre di fiume levigate e giavellotti per infastidire il nemico.',
    supplyCost: 1,
    attackRange: 4.2,
    damage: 12,
    attackCooldown: 0.9,
    armor: 0,
    damageType: 'pierce'
  },

  bronze_swordsman: {
    id: 'bronze_swordsman',
    name: 'Guerriero con Spada Khopesh & Bronzo',
    category: 'infantry',
    maxHp: 260,
    speed: 2.0,
    cost: { copper: 85, tin: 25, grain: 30 },
    trainTime: 7.5,
    description: 'Truppa nobiliare con elmo crestato, schinieri e sciabola ricurva khopesh. Devastante, ma vincolata alla disponibilità di stagno.',
    supplyCost: 2,
    attackRange: 1.2,
    damage: 32,
    attackCooldown: 1.0,
    armor: 4,
    damageType: 'slash'
  },

  war_chariot: {
    id: 'war_chariot',
    name: 'Carro da Guerra Reale (2 Cavalli)',
    category: 'chariot',
    maxHp: 420,
    speed: 3.6,
    cost: { copper: 160, tin: 40, timber: 80 },
    trainTime: 12,
    description: 'L\'arma suprema dell\'Età del Bronzo. Velocissimo in pianura aperta, saetta frecce composte anche in corsa.',
    supplyCost: 3,
    attackRange: 5.0,
    damage: 28,
    attackCooldown: 1.3,
    armor: 3,
    damageType: 'pierce'
  },

  iron_infantry: {
    id: 'iron_infantry',
    name: 'Fanteria Pesante d\'Assalto in Ferro',
    category: 'infantry',
    maxHp: 340,
    speed: 1.9,
    cost: { iron: 70, grain: 25 },
    trainTime: 6.0,
    description: 'Nata dalla rivoluzione metallurgica. Non richiede stagno, costa meno del bronzo ed è dotata di scudi con borchie in ferro e lunghe picche.',
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
    name: 'Incursore dei Popoli del Mare (Shardana)',
    category: 'infantry',
    maxHp: 210,
    speed: 2.3,
    cost: { copper: 60 },
    trainTime: 5,
    description: 'Guerriero sbarcato con scudo rotondo ed elmo con corna d\'ariete. Temibile nella carica a piedi.',
    supplyCost: 1,
    attackRange: 1.1,
    damage: 26,
    attackCooldown: 0.95,
    armor: 2,
    damageType: 'slash'
  }
};
