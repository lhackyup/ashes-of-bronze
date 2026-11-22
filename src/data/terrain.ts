import { TerrainDef, TerrainType } from './types.ts';

// Restored to the classic 48px tile grid of the original prototype
export const TILE_SIZE = 48;

export const TERRAINS: Record<TerrainType, TerrainDef> = {
  plain: {
    id: 'plain',
    name: 'Arid Levantine Plains',
    walkable: true,
    speedMultiplier: 1.0,
    isResource: false,
    color: '#8c7853'
  },
  sand: {
    id: 'sand',
    name: 'Coastal Dunes / Sand',
    walkable: true,
    speedMultiplier: 0.75,
    isResource: false,
    color: '#c9a263'
  },
  water: {
    id: 'water',
    name: 'Deep Sea / River',
    walkable: false,
    speedMultiplier: 0.0,
    isResource: false,
    color: '#1d4e78'
  },
  cliff: {
    id: 'cliff',
    name: 'Cyclopean Rocky Outcrop',
    walkable: false,
    speedMultiplier: 0.0,
    isResource: false,
    color: '#4a4238'
  },
  marsh: {
    id: 'marsh',
    name: 'Alluvial Marsh',
    walkable: true,
    speedMultiplier: 0.55,
    isResource: false,
    color: '#4f5938'
  },
  fertile_soil: {
    id: 'fertile_soil',
    name: 'Irrigated Alluvial Soil',
    walkable: true,
    speedMultiplier: 0.95,
    isResource: false,
    color: '#634d36'
  },
  vein_copper: {
    id: 'vein_copper',
    name: 'Malachite / Copper Vein',
    walkable: false,
    speedMultiplier: 0.0,
    isResource: true,
    resourceYield: {
      type: 'copper',
      amountPerHarvest: 15,
      totalAmount: 1800
    },
    color: '#498a72'
  },
  vein_tin: {
    id: 'vein_tin',
    name: 'Cassiterite / Tin Vein',
    walkable: false,
    speedMultiplier: 0.0,
    isResource: true,
    resourceYield: {
      type: 'tin',
      amountPerHarvest: 5,
      totalAmount: 450
    },
    color: '#94a3b8'
  },
  vein_iron: {
    id: 'vein_iron',
    name: 'Hematite / Dark Iron Vein',
    walkable: false,
    speedMultiplier: 0.0,
    isResource: true,
    resourceYield: {
      type: 'iron',
      amountPerHarvest: 12,
      totalAmount: 2400
    },
    color: '#362f2d'
  }
};
