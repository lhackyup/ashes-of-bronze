import { TerrainDef, TerrainType } from './types.ts';

export const TILE_SIZE = 48;

export const TERRAINS: Record<TerrainType, TerrainDef> = {
  plain: {
    id: 'plain',
    name: 'Pianura Arida Levantina',
    walkable: true,
    speedMultiplier: 1.0,
    isResource: false,
    color: '#7a6b52'
  },
  sand: {
    id: 'sand',
    name: 'Sabbia Costiera / Duna',
    walkable: true,
    speedMultiplier: 0.75, // rallenta carri e fanteria
    isResource: false,
    color: '#c4a773'
  },
  water: {
    id: 'water',
    name: 'Mare / Fiume Profondo',
    walkable: false,
    speedMultiplier: 0.0,
    isResource: false,
    color: '#2b506e'
  },
  cliff: {
    id: 'cliff',
    name: 'Rilievo Roccioso Ciclopico',
    walkable: false,
    speedMultiplier: 0.0,
    isResource: false,
    color: '#423d38'
  },
  marsh: {
    id: 'marsh',
    name: 'Palude Alluvionale',
    walkable: true,
    speedMultiplier: 0.55,
    isResource: false,
    color: '#474d39'
  },
  fertile_soil: {
    id: 'fertile_soil',
    name: 'Terra Alluvionale Irrigata',
    walkable: true,
    speedMultiplier: 0.95,
    isResource: false,
    color: '#5e4831'
  },
  vein_copper: {
    id: 'vein_copper',
    name: 'Filone di Malachite / Rame',
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
    name: 'Filone Raro di Cassiterite / Stagno',
    walkable: false,
    speedMultiplier: 0.0,
    isResource: true,
    resourceYield: {
      type: 'tin',
      amountPerHarvest: 5,
      totalAmount: 450 // Raro come la spezia!
    },
    color: '#9aa0a6'
  },
  vein_iron: {
    id: 'vein_iron',
    name: 'Giacimento di Ematite / Ferro Scuro',
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
