import { BuildingDef } from './types.ts';

export const BUILDINGS: Record<string, BuildingDef> = {
  cyclopean_slab: {
    id: 'cyclopean_slab',
    name: 'Terrapieno Ciclopico (Fondamenta)',
    category: 'foundation',
    width: 2,
    height: 2,
    maxHp: 350,
    cost: { copper: 15, stone: 30 },
    buildTime: 3.5,
    description: 'Blocchi megalitici a secco. Fondamenta indispensabili per non subire dimezzamento dei PF degli edifici.',
    requiresFoundation: false
  },

  acropolis: {
    id: 'acropolis',
    name: 'Megaron / Acropoli del Sovrano',
    category: 'economy',
    width: 4,
    height: 4,
    maxHp: 2400,
    cost: { copper: 350, stone: 200, timber: 150 },
    buildTime: 25,
    description: 'Cuore pulsante della città-stato. Stocca risorse, coordina l\'amministrazione e produce carovane base.',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    supplyProvided: 15,
    dropsOffResources: ['copper', 'tin', 'iron', 'grain', 'stone', 'timber'],
    producesUnits: ['donkey_caravan']
  },

  granary: {
    id: 'granary',
    name: 'Granaio & Riserva Idrica',
    category: 'economy',
    width: 2,
    height: 2,
    maxHp: 650,
    cost: { copper: 80, timber: 60 },
    buildTime: 8,
    description: 'Conserva il grano e alimenta la popolazione, aumentando il tetto massimo delle unità richiamabili (+10 Supply).',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    supplyProvided: 10
  },

  bronze_foundry: {
    id: 'bronze_foundry',
    name: 'Fonderia del Bronzo & Stoccaggio',
    category: 'economy',
    width: 3,
    height: 3,
    maxHp: 1100,
    cost: { copper: 200, stone: 80, timber: 50 },
    buildTime: 14,
    description: 'Punto di scarico primario per le carovane minerarie. Fonde rame e stagno in lingotti a pelle di bue.',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    dropsOffResources: ['copper', 'tin', 'iron'],
    producesUnits: ['donkey_caravan']
  },

  iron_smelter: {
    id: 'iron_smelter',
    name: 'Forni di Riduzione del Ferro',
    category: 'technology',
    width: 3,
    height: 3,
    maxHp: 1300,
    cost: { copper: 250, stone: 150, timber: 100 },
    buildTime: 20,
    description: 'Tecnologia rivoluzionaria con mantici doppi. Trasforma il minerale grezzo di ferro in armi d\'acciaio senza richiedere stagno.',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    unlockEra: 'early_iron',
    dropsOffResources: ['iron']
  },

  barracks: {
    id: 'barracks',
    name: 'Caserma delle Milizie & Forgia Armi',
    category: 'military',
    width: 3,
    height: 3,
    maxHp: 1000,
    cost: { copper: 150, timber: 100 },
    buildTime: 12,
    description: 'Addestra fanti con scudo a torre, frombolieri levantini e la fanteria d\'assalto.',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    producesUnits: ['spear_militia', 'skirmisher', 'bronze_swordsman', 'iron_infantry']
  },

  watchtower: {
    id: 'watchtower',
    name: 'Torre di Vedetta Ciclopica',
    category: 'defense',
    width: 2,
    height: 2,
    maxHp: 800,
    cost: { copper: 120, stone: 90, timber: 40 },
    buildTime: 9,
    description: 'Sblocca il radar della minimappa nella regione circostante e bersaglia i predoni in avvicinamento.',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    radarRange: 18,
    attackRange: 5.5,
    damage: 22,
    attackRate: 1.2
  },

  chariot_stable: {
    id: 'chariot_stable',
    name: 'Scuderia dei Carri da Guerra',
    category: 'military',
    width: 3,
    height: 3,
    maxHp: 1200,
    cost: { copper: 280, tin: 50, timber: 160 },
    buildTime: 18,
    description: 'Forgia e allena i temuti equipaggi dei carri a due cavalli. Richiede stagno per le armature bronzee.',
    requiresFoundation: true,
    foundationPenaltyHpRatio: 0.5,
    producesUnits: ['war_chariot']
  }
};
