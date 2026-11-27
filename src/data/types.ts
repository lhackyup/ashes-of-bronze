export type ResourceType = 'copper' | 'tin' | 'iron' | 'grain' | 'stone' | 'timber';

export interface ResourcePool {
  copper: number;
  tin: number;
  iron: number;
  grain: number;
  stone: number;
  timber: number;
}

export type FactionId = 'player' | 'sea_peoples' | 'rival_city' | 'neutral';

export type Era = 'early_bronze' | 'high_bronze' | 'collapse' | 'early_iron';

export type TerrainType =
  | 'plain'
  | 'sand'
  | 'water'
  | 'cliff'
  | 'marsh'
  | 'vein_copper'
  | 'vein_tin'
  | 'vein_stone'
  | 'vein_iron'
  | 'fertile_soil';

export interface TerrainDef {
  id: TerrainType;
  name: string;
  walkable: boolean;
  speedMultiplier: number;
  isResource: boolean;
  resourceYield?: {
    type: ResourceType;
    amountPerHarvest: number;
    totalAmount: number;
  };
  color: string;
}

export interface Cost {
  copper?: number;
  tin?: number;
  iron?: number;
  grain?: number;
  stone?: number;
  timber?: number;
}

export type BuildingCategory = 'foundation' | 'economy' | 'military' | 'defense' | 'technology';

export interface BuildingDef {
  id: string;
  name: string;
  category: BuildingCategory;
  width: number;  // in tiles
  height: number; // in tiles
  maxHp: number;
  cost: Cost;
  buildTime: number; // in seconds
  description: string;
  requiresFoundation: boolean;
  foundationPenaltyHpRatio?: number; // es. 0.50 se non posizionato su terrapieno
  supplyProvided?: number;
  storageProvided?: number | Partial<Record<ResourceType, number>>;
  unlockEra?: Era;
  producesUnits?: string[];
  dropsOffResources?: ResourceType[];
  radarRange?: number;
  revealsEntireMap?: boolean;
  attackRange?: number;
  damage?: number;
  attackRate?: number; // hits per sec
  indestructible?: boolean;
}

export type UnitCategory = 'worker' | 'infantry' | 'skirmisher' | 'chariot' | 'siege' | 'wildlife';

export interface UnitDef {
  id: string;
  name: string;
  category: UnitCategory;
  maxHp: number;
  speed: number; // tiles per second
  cost: Cost;
  trainTime: number; // seconds
  description: string;
  supplyCost: number;
  unlockEra?: Era;
  cargoCapacity?: number;
  harvestSpeed?: number; // resource per second
  attackRange?: number;
  damage?: number;
  attackCooldown?: number; // seconds
  armor?: number;
  damageType?: 'pierce' | 'slash' | 'crush' | 'fire';
}

export type UnitState =
  | 'IDLE'
  | 'MOVE_TO'
  | 'ATTACK_TARGET'
  | 'HARVEST_SEEK'
  | 'HARVESTING'
  | 'RETURN_CARGO'
  | 'UNLOADING'
  | 'WAITING_STORAGE'
  | 'FLEE';

export interface Vector2 {
  x: number;
  y: number;
}

export interface GridCoord {
  tx: number;
  ty: number;
}

export interface MissionObjective {
  id: string;
  type: 'destroy_all' | 'protect_entity' | 'gather_resource' | 'survive_time' | 'build_structure';
  description: string;
  isPrimary: boolean;
  targetId?: string;
  targetAmount?: number;
  targetSeconds?: number;
  currentProgress?: number;
  completed?: boolean;
  failed?: boolean;
}

export interface WaveDefinition {
  triggerTimeSeconds: number;
  spawnEdge: 'north' | 'south' | 'east' | 'west' | 'sea_coast';
  units: { type: string; count: number }[];
  targetLocation?: Vector2;
  advisorWarning?: string;
}

export interface ScenarioData {
  id: string;
  title: string;
  act: number;
  era: Era;
  map: {
    width: number;
    height: number;
    biome: 'levantine_coast' | 'shallows_of_ugarit' | 'river_valley' | 'taurus_mountains' | 'cyclopean_ruins' | 'lebanon_cedar_pass' | 'kadesh_night_siege' | 'orontes_borderlands';
    seed?: number;
    tiles?: number[];
  };
  player: {
    faction: FactionId;
    startPosition: GridCoord;
    initialResources: ResourcePool;
    unlockedBuildings: string[];
    unlockedUnits: string[];
  };
  opponents: {
    id: string;
    faction: FactionId;
    aiProfile: 'aggressive_raider' | 'turtle_defense' | 'expanding_warlord';
    startPosition?: GridCoord;
    initialBuildings?: { type: string; tx: number; ty: number }[];
    waves?: WaveDefinition[];
  }[];
  objectives: {
    primary: MissionObjective[];
    secondary: MissionObjective[];
  };
  narrative: {
    briefing: string;
    advisorPortrait: string;
    dialogues: {
      condition: string;
      speaker: 'burna_khabir' | 'tarkhunta' | 'zalpa' | 'enemy_warlord';
      message: string;
    }[];
  };
}
