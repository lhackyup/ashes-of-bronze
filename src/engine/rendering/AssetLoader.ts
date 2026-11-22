export class AssetLoader {
  private static tiles: Map<string, HTMLImageElement> = new Map();
  private static buildings: Map<string, HTMLImageElement> = new Map();
  private static units: Map<string, HTMLImageElement> = new Map();

  public static async init(): Promise<void> {
    const tileList = [
      { id: 'plain', file: '/assets/tiles/tile_sand.png' },
      { id: 'sand', file: '/assets/tiles/tile_sand.png' },
      { id: 'cliff', file: '/assets/tiles/tile_rock.png' },
      { id: 'water', file: '/assets/tiles/tile_water.png' },
      { id: 'vein_copper', file: '/assets/tiles/tile_ore_copper.png' },
      { id: 'vein_tin', file: '/assets/tiles/tile_ore_tin.png' },
      { id: 'vein_iron', file: '/assets/tiles/tile_ore_iron.png' }
    ];

    const buildingList = [
      { key: 'cyclopean_slab_player', file: '/assets/buildings/bldg_foundation.png' },
      { key: 'acropolis_player', file: '/assets/buildings/bldg_acropolis_player.png' },
      { key: 'acropolis_sea_peoples', file: '/assets/buildings/bldg_acropolis_sea_peoples.png' },
      { key: 'bronze_foundry_player', file: '/assets/buildings/bldg_foundry_player.png' },
      { key: 'bronze_foundry_sea_peoples', file: '/assets/buildings/bldg_foundry_sea_peoples.png' },
      { key: 'granary_player', file: '/assets/buildings/bldg_granary_player.png' },
      { key: 'granary_sea_peoples', file: '/assets/buildings/bldg_granary_sea_peoples.png' },
      { key: 'barracks_player', file: '/assets/buildings/bldg_barracks_player.png' },
      { key: 'barracks_sea_peoples', file: '/assets/buildings/bldg_barracks_sea_peoples.png' },
      { key: 'watchtower_player', file: '/assets/buildings/bldg_watchtower_player.png' },
      { key: 'watchtower_sea_peoples', file: '/assets/buildings/bldg_watchtower_sea_peoples.png' }
    ];

    const unitList = [
      { id: 'donkey_caravan', file: '/assets/units/unit_harvester.png' },
      { id: 'spear_militia', file: '/assets/units/unit_spearman.png' },
      { id: 'war_chariot', file: '/assets/units/unit_chariot.png' },
      { id: 'sea_raider', file: '/assets/units/unit_raider.png' }
    ];

    const loadImg = (url: string): Promise<HTMLImageElement> =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img); // Non-blocking fallback
      });

    const tilePromises = tileList.map(async (t) => {
      const img = await loadImg(t.file);
      this.tiles.set(t.id, img);
    });

    const bldgPromises = buildingList.map(async (b) => {
      const img = await loadImg(b.file);
      this.buildings.set(b.key, img);
    });

    const unitPromises = unitList.map(async (u) => {
      const img = await loadImg(u.file);
      this.units.set(u.id, img);
    });

    await Promise.all([...tilePromises, ...bldgPromises, ...unitPromises]);
  }

  public static getTile(terrainId: string): HTMLImageElement | null {
    return this.tiles.get(terrainId) || null;
  }

  public static getBuilding(defId: string, owner: string): HTMLImageElement | null {
    return this.buildings.get(`${defId}_${owner}`) || this.buildings.get(`${defId}_player`) || null;
  }

  public static getUnit(defId: string): HTMLImageElement | null {
    return this.units.get(defId) || null;
  }
}
