export interface CampaignScenarioMeta {
  id: string;
  act: number;
  scenarioIndex: number; // 1 to 10
  title: string;
  subtitle: string;
  region: string;
  yearBC: number;
  summary: string;
  // Normalized coordinates (0 to 100%) on the Eastern Mediterranean Map
  mapX: number;
  mapY: number;
}

export interface CampaignActMeta {
  act: number;
  title: string;
  subtitle: string;
  era: 'late_bronze' | 'collapse' | 'early_iron' | 'iron_dawn';
  description: string;
  scenarios: CampaignScenarioMeta[];
}

export const CAMPAIGN_SCENARIOS: CampaignScenarioMeta[] = [
  // --- ACT I: THE BRONZE COLLAPSE (1182 - 1177 BC) ---
  {
    id: 'scenario_01_horned_sails',
    act: 1,
    scenarioIndex: 1,
    title: 'The Horned Sails',
    subtitle: 'Coastal Outpost & The Scarcity of Tin',
    region: 'Levantine Coast (Kadesh-on-Sea)',
    yearBC: 1182,
    summary: 'Establish the coastal redoubt, lay cyclopean slabs, secure the scarce cassiterite tin veins, and repel initial Sea Peoples landing skiffs.',
    mapX: 72,
    mapY: 49
  },
  {
    id: 'scenario_02_last_cargo_alashiya',
    act: 1,
    scenarioIndex: 2,
    title: 'The Last Cargo of Alashiya',
    subtitle: 'Reef Salvage & Rearguard Skirmish',
    region: 'Shallows of Ugarit',
    yearBC: 1180,
    summary: 'A merchant fleet from Cyprus laden with raw copper and tin runs aground. Salvage the ingots before Shardana raiders torch the hulks.',
    mapX: 70,
    mapY: 45
  },
  {
    id: 'scenario_03_gate_of_cedars',
    act: 1,
    scenarioIndex: 3,
    title: 'The Gate of Cedars',
    subtitle: 'Protecting the Mountain Timber Pass',
    region: 'Lebanon Mountain Passes',
    yearBC: 1179,
    summary: 'Sea Peoples torch the inland cedar forests to starve the foundries of charcoal. Deploy chariot patrols to secure the highland caravans.',
    mapX: 75,
    mapY: 57
  },
  {
    id: 'scenario_04_siege_kadesh_sea',
    act: 1,
    scenarioIndex: 4,
    title: 'Siege of Kadesh-on-Sea',
    subtitle: 'Night Assault on the Megaron',
    region: 'Central Redoubt',
    yearBC: 1178,
    summary: 'The main armada of the horned sails attacks under darkness. Hold the cyclopean gates and towers against wave after wave of marauders.',
    mapX: 78,
    mapY: 52
  },
  {
    id: 'scenario_05_silence_great_kings',
    act: 1,
    scenarioIndex: 5,
    title: 'Silence of the Great Kings',
    subtitle: 'The Collapse of Global Trade',
    region: 'Ruins of Northern Ugarit',
    yearBC: 1177,
    summary: 'Shattered clay tablets confirm Hattusa and Mycenae have burned. Egypt closes its delta. The world bronze network is forever severed.',
    mapX: 68,
    mapY: 41
  },

  // --- ACT II: THE ECLIPSE & THE DARK STONES (1175 - 1165 BC) ---
  {
    id: 'scenario_06_war_of_rags',
    act: 2,
    scenarioIndex: 6,
    title: 'The War of Rags and Bronze',
    subtitle: 'Fratricidal City-State Feuds',
    region: 'Orontes Borderlands',
    yearBC: 1175,
    summary: 'Starving neighboring warlords attempt to raid our foundry stores to seize remaining tin ingots. Defend the supply depots.',
    mapX: 76,
    mapY: 48
  },
  {
    id: 'scenario_07_into_stone_gorges',
    act: 2,
    scenarioIndex: 7,
    title: 'Into the Stone Gorges',
    subtitle: 'Expedition to the Dark Rocks',
    region: 'Foothills of the Taurus Range',
    yearBC: 1172,
    summary: 'With tin gone, Tarkhunta leads an expedition into rugged mountain defiles seeking legends of dark heavy stones fallen from the sky.',
    mapX: 65,
    mapY: 33
  },
  {
    id: 'scenario_08_secret_black_blade',
    act: 2,
    scenarioIndex: 8,
    title: 'The Secret of the Black Blade',
    subtitle: 'The Heretic Smiths & The First Iron',
    region: 'Cilician Mountain Enclave',
    yearBC: 1165,
    summary: 'Locate an isolated enclave of heretic metallurgists smelting black hematite. Shield their furnaces from raiders and forge the first crude iron blade.',
    mapX: 58,
    mapY: 28
  },

  // --- ACT III: THE IRON DAWN (1150 - 1110 BC) ---
  {
    id: 'scenario_09_the_peoples_phalanx',
    act: 3,
    scenarioIndex: 9,
    title: 'The People’s Phalanx',
    subtitle: 'Liberation of the Orontes Granaries',
    region: 'Orontes Agricultural Basin',
    yearBC: 1150,
    summary: 'Equip mass peasant levies with cheap forged iron spearheads. March into the fertile floodplains to liberate the granaries and crush aristocratic bronze chariots.',
    mapX: 74,
    mapY: 46
  },
  {
    id: 'scenario_10_the_iron_dawn',
    act: 3,
    scenarioIndex: 10,
    title: 'The Iron Dawn',
    subtitle: 'Final Victory of the New Age',
    region: 'The Citadel of the New Age',
    yearBC: 1110,
    summary: 'The grand climactic clash: repel the supreme combined land-and-sea invasion of the Sea Peoples coalition. The unbreakable iron legions secure the dawn of a new civilization.',
    mapX: 70,
    mapY: 48
  }
];

export const CAMPAIGN_ACTS: CampaignActMeta[] = [
  {
    act: 1,
    title: 'ACT I: THE BRONZE COLLAPSE',
    subtitle: '1182 – 1177 BC · Survival, Coastal Defense & The Broken Sea Trade',
    era: 'late_bronze',
    description: 'Great empires burn as mysterious fleets emerge from the western horizon. Cut off from world trade, our colony must salvage scarce tin and fortify the coastline.',
    scenarios: CAMPAIGN_SCENARIOS.filter(s => s.act === 1)
  },
  {
    act: 2,
    title: 'ACT II: THE ECLIPSE & THE DARK STONES',
    subtitle: '1175 – 1165 BC · Resource Depletion & The Mountain Enclaves',
    era: 'collapse',
    description: 'With overseas tin exhausted, the old kingdoms turn upon one another. Tarkhunta leads an expedition into the rugged Taurus Mountains to discover the secrets of black hematite.',
    scenarios: CAMPAIGN_SCENARIOS.filter(s => s.act === 2)
  },
  {
    act: 3,
    title: 'ACT III: THE IRON DAWN',
    subtitle: '1150 – 1110 BC · The People’s Phalanx & The Triumph of Steel',
    era: 'early_iron',
    description: 'The secret of iron forging breaks the aristocratic monopoly of bronze warfare. Armed with mass-produced iron, our legions shatter the invading Sea Peoples armadas forever.',
    scenarios: CAMPAIGN_SCENARIOS.filter(s => s.act === 3)
  }
];
