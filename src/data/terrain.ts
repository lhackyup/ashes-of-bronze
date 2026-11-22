import { TerrainDef, TerrainType } from './types.ts';

// Dune II 1992 Authentic Tile Size (24x24 pixels on a 640x360 virtual buffer)
export const TILE_SIZE = 24;

export const TERRAINS: Record<TerrainType, TerrainDef> = {
  plain: {
    id: 'plain',
    name: 'Desert Sand / Dunes',
    walkable: true,
    speedMultiplier: 1.0,
    isResource: false,
    color: '#d4a259' // Warm mustard Dune sand
  },
  sand: {
    id: 'sand',
    name: 'Soft Sand Dunes',
    walkable: true,
    speedMultiplier: 0.7,
    isResource: false,
    color: '#c28f42'
  },
  water: {
    id: 'water',
    name: 'Deep Sea / Coast',
    walkable: false,
    speedMultiplier: 0.0,
    isResource: false,
    color: '#1a446c'
  },
  cliff: {
    id: 'cliff',
    name: 'Dark Rock Plateau',
    walkable: false,
    speedMultiplier: 0.0,
    isResource: false,
    color: '#3b2f25' // Dune II rocky slab bedrock
  },
  marsh: {
    id: 'marsh',
    name: 'Salt Silt / Silt Basin',
    walkable: true,
    speedMultiplier: 0.55,
    isResource: false,
    color: '#524b3a'
  },
  fertile_soil: {
    id: 'fertile_soil',
    name: 'Oasis Silt',
    walkable: true,
    speedMultiplier: 0.95,
    isResource: false,
    color: '#6e5434'
  },
  vein_copper: {
    id: 'vein_copper',
    name: 'Malachite Ore Field',
    walkable: false,
    speedMultiplier: 0.0,
    isResource: true,
    resourceYield: {
      type: 'copper',
      amountPerHarvest: 15,
      totalAmount: 1800
    },
    color: '#2bb673' // Vibrant green spice/ore
  },
  vein_tin: {
    id: 'vein_tin',
    name: 'Cassiterite Tin Ridge',
    walkable: false,
    speedMultiplier: 0.0,
    isResource: true,
    resourceYield: {
      type: 'tin',
      amountPerHarvest: 5,
      totalAmount: 450
    },
    color: '#e2e8f0' // Sparkling silver tin field
  },
  vein_iron: {
    id: 'vein_iron',
    name: 'Hematite Iron Ridge',
    walkable: false,
    speedMultiplier: 0.0,
    isResource: true,
    resourceYield: {
      type: 'iron',
      amountPerHarvest: 12,
      totalAmount: 2400
    },
    color: '#211d1b'
  }
};
