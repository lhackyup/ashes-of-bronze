export interface StrategicFocalPoint {
  name: string;
  region: string;
  status: 'secure' | 'fallen' | 'threatened' | 'target' | 'sealed';
  statusLabel: string;
  description: string;
}

export interface NarrativeInterlude {
  id: string;
  fromScenarioId: string;
  toScenarioId: string;
  fromScenarioTitle: string;
  toScenarioTitle: string;
  act: number;
  yearTransition: string;
  title: string;
  subtitle: string;
  
  // Phase 1: Aftermath & Field Victories
  aftermath: {
    heading: string;
    summary: string;
    bulletPoints: string[];
  };

  // Phase 2: Historical Context & Geopolitical Theater of the Ancient World
  historicalContext: {
    heading: string;
    narrativeText: string[];
    ancientQuote?: {
      text: string;
      source: string;
    };
    focalPoints?: StrategicFocalPoint[];
  };

  // Phase 3: Royal Mandate & Strategic Imperative
  nextBriefing: {
    heading: string;
    strategicImperative: string;
    tacticalIntelligence: string[];
    newUnlocksOrHazards: string;
  };
}

export const NARRATIVE_INTERLUDES: Record<string, NarrativeInterlude> = {
  // Transition 1 -> 2: From the Horned Sails to the Last Cargo of Alashiya
  'interlude_1_to_2': {
    id: 'interlude_1_to_2',
    fromScenarioId: 'scenario_01_horned_sails',
    toScenarioId: 'scenario_02_last_cargo_alashiya',
    fromScenarioTitle: 'The Horned Sails',
    toScenarioTitle: 'The Last Cargo of Alashiya',
    act: 1,
    yearTransition: '1182 → 1180 BC',
    title: 'Shadows Over the Copper Routes',
    subtitle: 'From the First Shore Landing to the Shallows of Ugarit',
    aftermath: {
      heading: 'The Coastal Beachhead of Kadesh Holds',
      summary: 'The beach below our promontory lies littered with bronze bossed shields and burning timbers. The initial amphibious landing of the Shardana has been repelled with manageable losses thanks to the discipline of our spearmen and the unyielding strength of our dry-laid cyclopean slabs.',
      bulletPoints: [
        'Cyclopean foundations securely anchored into the coastal bedrock',
        'Shallow veins of local cassiterite secured to forge our first heavy armor sets',
        'Survivors from burning coastal fishing villages have found refuge behind our Megaron'
      ]
    },
    historicalContext: {
      heading: '1180 BC: The Eastern Mediterranean Catastrophe Ignites',
      narrativeText: [
        'Two full years have elapsed since the first horned helmets crested our waves. Any illusion that this was a random band of isolated pirates has drowned in blood.',
        'From across the Levantine coastline, ominous reports arrive: swarms of war galleys bearing bird-headed prows and horned helms are systematically intercepting all maritime commerce.',
        'The great island of Alashiya (Cyprus), producer of the pure copper ingots that have fueled civilizational trade for a millennium, is encircled. Her merchant kings attempt desperate sorties to evacuate refined oxhide ingots before coastal foundries are put to the torch.'
      ],
      ancientQuote: {
        text: 'My father, behold, the ships of the enemy came; they have been burning our cities and have done evil things in the land. Our country is left unto itself.',
        source: 'Cuneiform Tablet RS 20.18, Royal Archives of Ugarit'
      },
      focalPoints: [
        {
          name: 'Alashiya (Cyprus)',
          region: 'Cypriot Gulf',
          status: 'threatened',
          statusLabel: 'UNDER BLOCKADE',
          description: 'Historic copper smelters and smelting towns are encircled by Sea Peoples war galleys.'
        },
        {
          name: 'Kadesh-on-Sea',
          region: 'Levantine Coast',
          status: 'secure',
          statusLabel: 'VIGILANT REDOUBT',
          description: 'Our citadel expands its foundries and readies supply lines for the coming siege.'
        },
        {
          name: 'Shallows of Ugarit',
          region: 'Northern Sandbars',
          status: 'target',
          statusLabel: 'GROUNDED CONVOY',
          description: 'A merchant fleet from Alashiya laden with raw copper and tin runs aground on tidal reefs.'
        }
      ]
    },
    nextBriefing: {
      heading: 'Mandate of the Wanax: Salvaging the Royal Ingots',
      strategicImperative: 'A stranded Cypriot merchant fleet laden with unrefined copper and scarce tin bars lies trapped on tidal reefs to our north. Shardana raiders are converging with pitch torches and landing skiffs: we must establish a forward redoubt on the dunes, hold off enemy raiding sorties, and haul the oxhide ingots back to our citadel using donkey caravans before the hulls burn.',
      tacticalIntelligence: [
        'Tidal sandbars and shallow water severely reduce infantry and caravan movement speed.',
        'Cypriot bowyers rescued from the wrecks teach our ranks the craft of the horn-laminated Composite Bow.',
        'Position Composite Bowmen along the elevated dunes to decimate raiding parties before they reach your pack animals.'
      ],
      newUnlocksOrHazards: 'New Unit Unlocked: Cypriot Composite Bowman (extended range, deadly against unarmored raiders).'
    }
  },

  // Transition 2 -> 3: From the Reef Shallows to the Gate of Cedars
  'interlude_2_to_3': {
    id: 'interlude_2_to_3',
    fromScenarioId: 'scenario_02_last_cargo_alashiya',
    toScenarioId: 'scenario_03_gate_of_cedars',
    fromScenarioTitle: 'The Last Cargo of Alashiya',
    toScenarioTitle: 'The Gate of Cedars',
    act: 1,
    yearTransition: '1180 → 1179 BC',
    title: 'Fire in the Mountain Passes',
    subtitle: 'From the Shallows of Ugarit to the Lebanon Cedar Forests',
    aftermath: {
      heading: 'The Copper Bullion of Alashiya is Secured',
      summary: 'Our race against the tides and torches ended in decisive victory. Over a hundred oxhide ingots of pure copper and scarce overseas tin have been hauled from the mud and safely locked within the vaults of our Acropolis.',
      bulletPoints: [
        'Recovered bronze bullion guarantees heavy arms production for our citizen militia',
        'Cypriot master archers have integrated permanently into our royal guard',
        'Shardana landing skiffs were driven off with heavy casualties among the reed beds'
      ]
    },
    historicalContext: {
      heading: '1179 BC: The Scorch-and-Starve Strategy',
      narrativeText: [
        'Recognizing that Kadesh cannot be broken by direct coastal raids alone, the Sea Peoples warlords alter their strategy: target our energy supply and starve our furnaces.',
        'Smelting copper with tin requires charcoal of immense calorific heat, obtainable only from the dense, resinous heartwood of ancient cedar forests in the Lebanon mountain range.',
        'Strong raiding parties have bypassed our coastal ramparts, infiltrating highland passes and establishing a concealed war camp to ignite the groves and cut our supply caravans.'
      ],
      ancientQuote: {
        text: 'If the sacred cedars of the mountains turn to ash, our foundries will freeze before winter. And when our bronze fails, our children will fight with broken river stones.',
        source: 'Tarkhunta, Grand Master of the Smelters'
      },
      focalPoints: [
        {
          name: 'Lebanon Mountain Range',
          region: 'Cedar Pass',
          status: 'threatened',
          statusLabel: 'ARSON PARTIES ACTIVE',
          description: 'Torchbearer squads ignite timber stands along the primary lumber trails.'
        },
        {
          name: 'Kadesh-on-Sea',
          region: 'Central Coast',
          status: 'secure',
          statusLabel: 'FOUNDRIES READY',
          description: 'Smelters stand idle, waiting for heavy timber caravans to fuel the bronze crucibles.'
        },
        {
          name: 'Orontes Basin',
          region: 'Alluvial Flatlands',
          status: 'target',
          statusLabel: 'CHARIOT GROUND',
          description: 'Broad open plains perfectly suited for our two-horse royal war chariot charges.'
        }
      ]
    },
    nextBriefing: {
      heading: 'Mandate of the Wanax: Securing the Gate of Cedars',
      strategicImperative: 'March our core army into the highland defiles to protect logging operations, harvest the sacred cedar timber for our smelters, and track down and raze the raider ambush camp concealed in the northeastern woods before the forest is consumed.',
      tacticalIntelligence: [
        'Across open highland plains, light enemy skirmishers are helpless against charging chariot wheels.',
        'Construct Royal Chariot Stables to train our two-horse War Chariots.',
        'Avoid charging chariots directly into dense cedar woods: screen your advance with composite bowmen and foot spearmen.'
      ],
      newUnlocksOrHazards: 'New Building & Unit: War Chariot Stables and Royal War Chariot (supreme mobility and mounted bow archery).'
    }
  },

  // Transition 3 -> 4: From the Highland Pass to the Grand Nocturnal Siege
  'interlude_3_to_4': {
    id: 'interlude_3_to_4',
    fromScenarioId: 'scenario_03_gate_of_cedars',
    toScenarioId: 'scenario_04_siege_kadesh_sea',
    fromScenarioTitle: 'The Gate of Cedars',
    toScenarioTitle: 'Siege of Kadesh-on-Sea',
    act: 1,
    yearTransition: '1179 → 1178 BC',
    title: 'Night of the Black Sails',
    subtitle: 'From the Highland Defiles to the Midnight Siege of Kadesh',
    aftermath: {
      heading: 'The Mountain Passes are Cleared',
      summary: 'The hammer-and-anvil charge of our war chariots and shield militia crushed the Shardana arsonists in the alpine meadows. The concealed raider encampment was burned to cinders, and laden donkey caravans have hauled thousands of pounds of cedar charcoal straight to our foundry yards.',
      bulletPoints: [
        'Foundry storehouses overflow with high-caloric timber and charcoal',
        'Our Royal War Chariots proved the supreme lethality of aristocratic bronze shock warfare',
        'Highland trade routes connecting to the interior are cleared of enemy ambushes'
      ]
    },
    historicalContext: {
      heading: '1178 BC: The Vengeance of the Shardana Grand Armada',
      narrativeText: [
        'Their defeat in the mountains provoked unbridled fury across the Sea Peoples confederation. Scattered tribal flotillas have unified under the supreme command of their most feared overseas Warlord.',
        'Zalpa’s scouts report a naval concentration unlike anything seen in living memory: over a hundred dark-hulled galleys assembling offshore just beyond missile range.',
        'The invaders will not wait for dawn. Knowing our archers and chariots dominate daylight fields, they intend to strike under cover of absolute darkness, hurling pitch fire to decapitate the Wanax’s Megaron in one stroke.'
      ],
      ancientQuote: {
        text: 'My Wanax, the skies rain embers and the sea roars with war horns. If the Megaron falls tonight, the cuneiform wisdom of three thousand years turns to ash before sunrise.',
        source: 'Burna-Khabir, High Scribe of the Cuneiform Archives'
      },
      focalPoints: [
        {
          name: 'Royal Megaron of Kadesh',
          region: 'Central Acropolis',
          status: 'target',
          statusLabel: 'HEART OF THE REALM',
          description: 'The supreme command palace: if this falls, civilization is extinguished.'
        },
        {
          name: 'Northern Defile',
          region: 'Northern Ravine',
          status: 'threatened',
          statusLabel: 'FORWARD SIEGE CAMP',
          description: 'The Shardana vanguard has erected a palisade and watchtower base to spawn assault waves.'
        },
        {
          name: 'Western Beach',
          region: 'Landing Shallows',
          status: 'threatened',
          statusLabel: 'INVASION LANDING',
          description: 'Primary landing beach for the horned galleys of the Shardana Fleet Warlord.'
        }
      ]
    },
    nextBriefing: {
      heading: 'Mandate of the Wanax: Holding Against the Midnight Siege',
      strategicImperative: 'Entrench our acropolis behind massive Cyclopean Ramparts. Garrison the three watchtowers with disciplined archers, endure and shatter five waves of nocturnal assaults, lead chariot sorties to burn their northern siege camp, and slay the Shardana Fleet Warlord when he steps ashore!',
      tacticalIntelligence: [
        'Darkness cloaks the battlefield: position defenders around glowing braziers and illuminated watchtowers.',
        'Erect Cyclopean Rampart walls across natural choke points to funnel raiders into lethal archer kill zones.',
        'The Shardana Warlord is armored in impenetrable bronze bell-cuirass: focus arrow volleys and chariot charges to break him.'
      ],
      newUnlocksOrHazards: 'New Mechanic & Building: Reduced Night Vision Combat; Megalithic Cyclopean Rampart Walls.'
    }
  },

  // Transition 4 -> 5: From the Nocturnal Siege to the Silence of the Great Kings (ACT I CLIMAX)
  'interlude_4_to_5': {
    id: 'interlude_4_to_5',
    fromScenarioId: 'scenario_04_siege_kadesh_sea',
    toScenarioId: 'scenario_05_silence_great_kings',
    fromScenarioTitle: 'Siege of Kadesh-on-Sea',
    toScenarioTitle: 'Silence of the Great Kings',
    act: 1,
    yearTransition: '1178 → 1177 BC',
    title: 'Silence of the Great Kings',
    subtitle: 'From the Ash of the Siege to the Global Collapse of the Bronze Age',
    aftermath: {
      heading: 'Megalithic Stone Preserves Kadesh',
      summary: 'At sunrise, coastal mists rise to reveal an apocalyptic scene: hundreds of horned helmets float lifelessly in the foam, and the enemy forward siege base in the gorge is a smoldering heap of black ash. The cleaved cuirass of the Shardana Warlord rests before our Lion Gate.',
      bulletPoints: [
        'The Royal Megaron stands intact after enduring all five nocturnal assault waves',
        'The grand invasion armada scattered back into the sea in broken disorder',
        'However, our city tin reserves are almost entirely depleted: broken weapons cannot be recast endlessly'
      ]
    },
    historicalContext: {
      heading: '1177 BC: The Year Civilization Collapsed',
      narrativeText: [
        'As Kadesh binds her wounds, the wider ancient world collapses into total silence. Bloodstained couriers arrive bearing shattered clay tablets from across the shattered superpowers.',
        'Hattusa, capital of the mighty Hittite Empire, has been put to the torch and erased from the earth. The golden citadels of Mycenae and Tiryns lie gutted and silent. Pharaoh Ramesses III fights for survival in the Nile Delta and has sealed Egypt’s borders to the outside world.',
        'The globalized trade network that carried copper and tin across thousands of leagues is permanently dead. A few leagues north, the wealthy merchant metropolis of Ugarit is burning: Peleset and Shardana raiders are storming the Royal Archives to wipe away every inscribed record of human law.'
      ],
      ancientQuote: {
        text: 'My father, behold, the ships of the enemy came; they have been burning our cities and have done evil things in the land... Our country is left unto itself.',
        source: 'Last Tablet of Ugarit (Tablet RS 20.238, 1177 BC)'
      },
      focalPoints: [
        {
          name: 'Hattusa (Hittite Empire)',
          region: 'Central Anatolia',
          status: 'fallen',
          statusLabel: 'RAZED BY FIRE',
          description: 'The Hittite Empire has fallen. The imperial archives are reduced to baked dust.'
        },
        {
          name: 'Mycenae & Tiryns',
          region: 'Aegean Greece',
          status: 'fallen',
          statusLabel: 'PALACES SACKED',
          description: 'The legendary palaces of the Achaean warlords lie sacked and abandoned.'
        },
        {
          name: 'Nile Delta (Egypt)',
          region: 'Lower Egypt',
          status: 'sealed',
          statusLabel: 'BORDERS SEALED',
          description: 'The Pharaoh repelled the Sea Peoples at high cost, barring all foreign shipping.'
        },
        {
          name: 'Archives of Ugarit',
          region: 'Northern Levant',
          status: 'threatened',
          statusLabel: 'BURNING IN ASH',
          description: 'The greatest cuneiform library of the Levant is burning under enemy onslaught.'
        },
        {
          name: 'Kadesh-on-Sea',
          region: 'Central Levant',
          status: 'secure',
          statusLabel: 'THE LAST BEACON',
          description: 'The sole surviving organized citadel of civilization left standing in the Levant.'
        }
      ]
    },
    nextBriefing: {
      heading: 'Mandate of the Wanax: Expedition to the Ruins of Ugarit',
      strategicImperative: 'Lead our veteran army north into the burning ruins of Ugarit. Save the Cuneiform Royal Archives before raiders smash them to dust, escort the scribes and fleeing craftsmen back to Kar-Sur, and break the Sea Peoples naval blockade on the promontory!',
      tacticalIntelligence: [
        'Zero virgin tin deposits remain on this map: overseas tin shipments will never return! Every bronze unit lost cannot easily be remade.',
        'New Peleset raiders charge with feathered headdresses and dual battleaxes: maintain disciplined spear walls.',
        'Scour ruined merchant quarters and basement storehouses to recover remaining caches of oxhide ingots.'
      ],
      newUnlocksOrHazards: 'Grand Act I Climax; Permanent Tin Depletion; Incursion of Feathered Peleset Shock Raiders.'
    }
  },

  // Transition 5 -> 6: End of Act I -> Dawn of Act II (The Bronze Eclipse)
  'interlude_5_to_6': {
    id: 'interlude_5_to_6',
    fromScenarioId: 'scenario_05_silence_great_kings',
    toScenarioId: 'scenario_06_war_of_rags',
    fromScenarioTitle: 'Silence of the Great Kings',
    toScenarioTitle: 'The War of Rags and Bronze',
    act: 2,
    yearTransition: '1177 → 1175 BC',
    title: 'The Bronze Eclipse',
    subtitle: 'End of Act I — The Dawn of Fratricidal Wars Among Survivors',
    aftermath: {
      heading: 'The Written Memory of Humanity is Saved',
      summary: 'From the white-hot ruins of Ugarit, the Wanax and his royal vanguard achieved the impossible: the cuneiform tablets of the royal library and her master scribes were escorted safely to Kar-Sur. The Supreme Sea Peoples Fleet Chieftain fell upon the burning bluffs.',
      bulletPoints: [
        'The written cuneiform knowledge, laws, and treaties of the Bronze Age will not be lost',
        'Act I "Fire from the Sea" is officially completed in blood and heroic glory',
        'The coast stands desolate: no foreign merchant will ever anchor from the West again'
      ]
    },
    historicalContext: {
      heading: '1175 BC: The War of Rags and Bronze',
      narrativeText: [
        'With global commerce obliterated and overseas tin forever vanished, inland city-states succumb to famine and desperate madness.',
        'Neighboring warlords along the Orontes, driven mad as rust and exhaustion consume their ancient gear, march on our foundries to steal our remaining bronze ingots: this is the so-called "War of Rags".',
        'In the silence of his mountain forges, Tarkhunta examines dark, heavy rocks brought down by hunters from the Taurus defiles... whispering that if bronze is dead, perhaps a harder, darker metal awaits birth in the flames.'
      ],
      ancientQuote: {
        text: 'Bronze was the metal of golden kings whose empires could not adapt; iron will be the metal of those peoples who refuse to die.',
        source: 'Tarkhunta, Address to the Council of Kar-Sur'
      },
      focalPoints: [
        {
          name: 'Orontes River Valley',
          region: 'Inland Borderlands',
          status: 'threatened',
          statusLabel: 'CIVIL WARFARE',
          description: 'Desperate warlords clash with ragged retinues over dwindling bronze weapons.'
        },
        {
          name: 'Taurus Mountain Gorges',
          region: 'Northern Highlands',
          status: 'target',
          statusLabel: 'DARK STONES OF THE SKY',
          description: 'Mysterious legends speak of mountain hermits smelting dark heavy rocks.'
        },
        {
          name: 'Fortress of Kar-Sur',
          region: 'Capital Citadel',
          status: 'secure',
          statusLabel: 'ACT II BASTION',
          description: 'Our fortified acropolis prepares for the transition into the new metallurgical age.'
        }
      ]
    },
    nextBriefing: {
      heading: 'Act II: The Bronze Eclipse (1175 - 1160 BC)',
      strategicImperative: 'Defend our foundry storage depots against raids from starving neighboring warlords, and organize the first deep reconnaissance expedition into the stone gorges of the Taurus Range to uncover the secret of iron.',
      tacticalIntelligence: [
        'Bronze cannot be wasted: pivot toward disciplined massed spear infantry formations.',
        'Chariots cannot maneuver in the rocky defiles of Act II: prepare to retrain your military for tight gorge infantry warfare.',
        'Protect your charcoal and ore stockpiles against desperate raider assaults.'
      ],
      newUnlocksOrHazards: 'Act II Strategic Map Unlocked; New Gorge Environmental Hazards.'
    }
  },

  // Transition 6 -> 7: The March into the Taurus Gorges
  'interlude_6_to_7': {
    id: 'interlude_6_to_7',
    fromScenarioId: 'scenario_06_war_of_rags',
    toScenarioId: 'scenario_07_into_stone_gorges',
    fromScenarioTitle: 'The War of Rags and Bronze',
    toScenarioTitle: 'Into the Stone Gorges',
    act: 2,
    yearTransition: '1175 → 1172 BC',
    title: 'The Road to the Taurus Gorges',
    subtitle: 'The Exhaustion of Tin & The March into the Mountain Jaws',
    aftermath: {
      heading: 'The Orontes Borderlands Secured',
      summary: 'The desperate coalition of starving warlords was routed at the river fords, and King Benteshina fell in his bronze armor. Yet our victory is shadowed by an unavoidable truth: only 35 ingots of tin remain in our vaults. Bronze chariot warfare is dead.',
      bulletPoints: [
        'The border citadel and its cuneiform archives stand secure',
        'Remaining tin reserves are critically depleted; bronze weapons cannot be replaced',
        'Tarkhunta organizes the vanguard expedition northward into the Taurus defiles'
      ]
    },
    historicalContext: {
      heading: '1172 BC: The Mountain Jaws',
      narrativeText: [
        'Where the chariot wheel splinters upon jagged limestone boulders, only agile mountain infantry can advance.',
        'We have recruited the Highland Skirmishers: hardy mountaineers equipped with crescent pelta shields and heavy armor-piercing javelins, capable of scaling crags without penalty.',
        'Whispers among mountain prospectors speak of colossal veins of heavy dark stones—hematite iron—tucked away in the sacred defiles of the Lukka tribes.'
      ],
      ancientQuote: {
        text: 'Where the chariot wheel splinters upon stone, only the mountain runner with his javelin and pelta shall command the pass.',
        source: 'Zalpa, Scout Commander of Kar-Sur'
      },
      focalPoints: [
        {
          name: 'Taurus Mountain Passes',
          region: 'Northern Anatolia',
          status: 'target',
          statusLabel: 'LIMESTONE JAWS',
          description: 'A labyrinth of razor-sharp ravines held by fierce Lukka mountain ambushers.'
        },
        {
          name: 'The Sacred Iron Ledge',
          region: 'Deep High Defile',
          status: 'threatened',
          statusLabel: 'DARK HEAVY STONES',
          description: 'The legendary vein of hematite iron ore that will ignite the Iron Age.'
        }
      ]
    },
    nextBriefing: {
      heading: 'Into the Stone Gorges (1172 BC)',
      strategicImperative: 'Guide Tarkhunta through the narrow limestone defiles, train Highland Skirmishers to counter Lukka cliff ambushers, and secure the legendary hematite iron vein at the northern sanctuary!',
      tacticalIntelligence: [
        'War Chariots are useless in the rocky defiles: rely on Highland Skirmishers for rapid flanking maneuvers across the crags.',
        'Highland Skirmishers throw armor-piercing javelins that bypass shields and deal heavy damage to hostile raiders.',
        'Harvest 250 Iron Ore to initiate the metallurgical transition.'
      ],
      newUnlocksOrHazards: 'New Unit: Highland Skirmisher & Javelinier; Deep Gorge Chokepoint Map; First Major Iron Ore Extraction.'
    }
  }
};
