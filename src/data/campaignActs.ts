export interface CampaignScenarioMeta {
  id: string;
  act: number;
  scenarioIndex: number; // 1 to 18
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
  // --- ACT I: FIRE FROM THE SEA (1182 - 1177 BC) ---
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

  // --- ACT II: THE BRONZE ECLIPSE (1175 - 1160 BC) ---
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
    id: 'scenario_08_ambush_river_gorges',
    act: 2,
    scenarioIndex: 8,
    title: 'Ambush in the River Gorges',
    subtitle: 'Infantry Shield-Wall Tactics',
    region: 'Taurus Defiles',
    yearBC: 1170,
    summary: 'Chariots are useless in the narrow ravines. Coordinate infantry phalanxes and mountain skirmishers against Lukka ambushes.',
    mapX: 61,
    mapY: 30
  },
  {
    id: 'scenario_09_heretic_smiths',
    act: 2,
    scenarioIndex: 9,
    title: 'The Heretic Smiths',
    subtitle: 'The Secret of Hematite',
    region: 'Cilician Mountain Enclave',
    yearBC: 1165,
    summary: 'Locate an isolated tribe smelting black hematite rock with double-chamber leather bellows. Shield their furnaces from raiders.',
    mapX: 58,
    mapY: 28
  },
  {
    id: 'scenario_10_first_black_blade',
    act: 2,
    scenarioIndex: 10,
    title: 'The First Black Blade',
    subtitle: 'Birth of Early Iron Metallurgy',
    region: 'Tarkhunta’s Highlands Foundry',
    yearBC: 1160,
    summary: 'Escort the first raw iron ore back to the citadel. Tarkhunta casts the first forged iron sword: crude, but independent of overseas tin.',
    mapX: 62,
    mapY: 35
  },

  // --- ACT III: THE IRON FORGE (1155 - 1130 BC) ---
  {
    id: 'scenario_11_flames_sacred_grove',
    act: 3,
    scenarioIndex: 11,
    title: 'Flames in the Sacred Grove',
    subtitle: 'The First Iron Bloomery District',
    region: 'Highland Iron Works',
    yearBC: 1155,
    summary: 'Construct industrial bloomery furnaces. Mass produce forged iron spearheads to break the monopoly of aristocratic bronze chariots.',
    mapX: 57,
    mapY: 31
  },
  {
    id: 'scenario_12_the_peoples_army',
    act: 3,
    scenarioIndex: 12,
    title: 'The People’s Army',
    subtitle: 'Levies Armed in Steel',
    region: 'Plain of Issus',
    yearBC: 1150,
    summary: 'Equip hundreds of peasants with iron spearheads. In open field combat, the disciplined iron phalanx shatters high-born chariot aristocrats.',
    mapX: 63,
    mapY: 38
  },
  {
    id: 'scenario_13_liberation_orontes',
    act: 3,
    scenarioIndex: 13,
    title: 'Liberation of the Orontes',
    subtitle: 'Reclaiming the Granaries',
    region: 'Orontes Agricultural Basin',
    yearBC: 1140,
    summary: 'March south with iron legionaries to liberate fertile agricultural floodplains and granaries occupied by Sea Peoples reavers.',
    mapX: 74,
    mapY: 46
  },
  {
    id: 'scenario_14_levantine_founders',
    act: 3,
    scenarioIndex: 14,
    title: 'The Levantine Founders',
    subtitle: 'Defense of the Bloomery Heart',
    region: 'Central Foundry Citadel',
    yearBC: 1130,
    summary: 'A desperate coalition of decaying bronze warlords attacks our bloomeries to seize the secret of iron. Crush them with heavy infantry.',
    mapX: 70,
    mapY: 49
  },

  // --- ACT IV: DAWN OF THE NEW AGE (1125 - 1100 BC) ---
  {
    id: 'scenario_15_burning_docks',
    act: 4,
    scenarioIndex: 15,
    title: 'Night of the Burning Docks',
    subtitle: 'Three-Pronged Amphibious Raid',
    region: 'Port of Kadesh',
    yearBC: 1125,
    summary: 'The supreme Sea Peoples coalition realizes our iron kingdom blocks their conquest. Repel a massive midnight multi-beach landing.',
    mapX: 72,
    mapY: 54
  },
  {
    id: 'scenario_16_battle_stone_jaws',
    act: 4,
    scenarioIndex: 16,
    title: 'Battle of Stone Jaws',
    subtitle: 'Cyclopean Bastion Ambush',
    region: 'Pass of Tyre',
    yearBC: 1115,
    summary: 'Channel the invading barbarian war horde into a towering stone canyon lined with ballistas and pitch trenches.',
    mapX: 75,
    mapY: 63
  },
  {
    id: 'scenario_17_judgment_alashiya',
    act: 4,
    scenarioIndex: 17,
    title: 'The Judgment of Alashiya',
    subtitle: 'Naval Counter-Offensive to Cyprus',
    region: 'Gulf of Cyprus',
    yearBC: 1105,
    summary: 'Launch an iron-clad fleet across the Great Green to strike the primary forward staging anchorage of the Shardana armada.',
    mapX: 52,
    mapY: 51
  },
  {
    id: 'scenario_18_the_iron_dawn',
    act: 4,
    scenarioIndex: 18,
    title: 'The Iron Dawn',
    subtitle: 'Final Victory of the New Age',
    region: 'The Capital of the New Age',
    yearBC: 1100,
    summary: 'The grand climactic clash: the combined iron army and cyclopean fortresses break the back of the Bronze Age collapse forever.',
    mapX: 69,
    mapY: 48
  }
];

export const CAMPAIGN_ACTS: CampaignActMeta[] = [
  {
    act: 1,
    title: 'ACT I: FIRE FROM THE SEA',
    subtitle: '1182 – 1177 BC · Survival, Coastal Defense & The Race for Tin',
    era: 'late_bronze',
    description: 'Great empires burn as mysterious fleets emerge from the western horizon. Cut off from world trade, our colony must salvage scarce tin and fortify the coastline.',
    scenarios: CAMPAIGN_SCENARIOS.filter(s => s.act === 1)
  },
  {
    act: 2,
    title: 'ACT II: THE BRONZE ECLIPSE',
    subtitle: '1175 – 1160 BC · Resource Depletion & The Mountain Enclaves',
    era: 'collapse',
    description: 'With overseas tin exhausted, the old kingdoms turn upon one another. Tarkhunta leads an expedition into the Taurus Mountains in search of raw iron hematite.',
    scenarios: CAMPAIGN_SCENARIOS.filter(s => s.act === 2)
  },
  {
    act: 3,
    title: 'ACT III: THE IRON FORGE',
    subtitle: '1155 – 1130 BC · Democratization of War & Industrial Bloomeries',
    era: 'early_iron',
    description: 'The secret of iron forging breaks the aristocratic monopoly of chariot warfare. Levies armed with cheap iron weapons shatter the remnants of bronze dynasties.',
    scenarios: CAMPAIGN_SCENARIOS.filter(s => s.act === 3)
  },
  {
    act: 4,
    title: 'ACT IV: DAWN OF THE NEW AGE',
    subtitle: '1125 – 1100 BC · The Climax & Birth of Iron Age Civilization',
    era: 'iron_dawn',
    description: 'The final confrontation against the combined warlords of the Sea Peoples. Out of the ashes of the Bronze Age, an unbreakable civilization is born.',
    scenarios: CAMPAIGN_SCENARIOS.filter(s => s.act === 4)
  }
];
