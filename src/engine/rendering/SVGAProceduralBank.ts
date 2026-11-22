import { UnitEntity } from '../../entities/UnitEntity.ts';

function makePixelCanvas(w: number, h: number, drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  drawFn(ctx);
  return c;
}

export class SVGAProceduralBank {
  private static buildingSprites: Map<string, HTMLCanvasElement> = new Map();
  public static advisorPortraits: Map<string, HTMLCanvasElement> = new Map();

  public static init(): void {
    this.initAdvisorPortraits();
    this.initBuildingSprites();
  }

  // --- Dune II Pixel Art Helpers ---

  // Draws a beveled pixel box with classic 1992 RTS lighting (top-left highlight, bottom-right shadow, black border)
  private static drawPixelBevelBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    fillColor: string,
    hiColor: string,
    shadowColor: string,
    hasBlackOutline = true
  ): void {
    // Fill
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w, h);

    // Bevel highlights
    ctx.fillStyle = hiColor;
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y, 1, h);

    // Bevel shadows
    ctx.fillStyle = shadowColor;
    ctx.fillRect(x + 1, y + h - 1, w - 1, 1);
    ctx.fillRect(x + w - 1, y + 1, 1, h - 1);

    // Black outline
    if (hasBlackOutline) {
      ctx.strokeStyle = '#0e0b08';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
    }
  }

  // --- Dune II Mentat Style Advisor Portraits (48x48 Pixel Art) ---
  private static initAdvisorPortraits(): void {
    // 1. Burna-Khabir (Cuneiform High Scribe)
    this.advisorPortraits.set('burna_khabir', makePixelCanvas(48, 48, (ctx) => {
      ctx.fillStyle = '#18120d';
      ctx.fillRect(0, 0, 48, 48);

      // Scribe headdress (purple-red with gold trim)
      this.drawPixelBevelBox(ctx, 14, 4, 20, 12, '#661a2b', '#992a43', '#330811');
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(12, 14, 24, 3);

      // Face
      this.drawPixelBevelBox(ctx, 16, 17, 16, 13, '#d49b6a', '#f5c596', '#946138', false);

      // Eyes
      ctx.fillStyle = '#0f0a07';
      ctx.fillRect(19, 21, 3, 2);
      ctx.fillRect(26, 21, 3, 2);

      // Long archaic wavy beard
      this.drawPixelBevelBox(ctx, 14, 28, 20, 16, '#2e2015', '#473221', '#140d08');
      ctx.fillRect(17, 43, 14, 4);

      // Robe shoulders
      ctx.fillStyle = '#f0e6d6';
      ctx.fillRect(4, 42, 40, 6);
      ctx.fillStyle = '#992a43';
      ctx.fillRect(18, 42, 12, 6);

      // Beveled frame
      ctx.strokeStyle = '#ffd166';
      ctx.strokeRect(0.5, 0.5, 47, 47);
    }));

    // 2. Tarkhunta (Master Smelter)
    this.advisorPortraits.set('tarkhunta', makePixelCanvas(48, 48, (ctx) => {
      ctx.fillStyle = '#1f100a';
      ctx.fillRect(0, 0, 48, 48);

      // Leather headband
      this.drawPixelBevelBox(ctx, 13, 6, 22, 9, '#1a120c', '#38281b', '#0a0704');
      ctx.fillStyle = '#b85d18';
      ctx.fillRect(12, 13, 24, 3);

      // Face with soot smudges
      this.drawPixelBevelBox(ctx, 16, 16, 16, 14, '#c78255', '#f0a775', '#7a421b', false);
      ctx.fillStyle = '#1c130d';
      ctx.fillRect(18, 21, 5, 4); // Soot on cheek

      // Eyes
      ctx.fillStyle = '#0f0a07';
      ctx.fillRect(19, 19, 3, 2);
      ctx.fillRect(26, 19, 3, 2);

      // Black beard
      this.drawPixelBevelBox(ctx, 14, 28, 20, 16, '#1a130e', '#33241a', '#080503');

      // Leather apron & hammer
      ctx.fillStyle = '#5c351c';
      ctx.fillRect(6, 42, 36, 6);
      ctx.fillStyle = '#8f8881';
      ctx.fillRect(8, 34, 6, 10);

      ctx.strokeStyle = '#ffd166';
      ctx.strokeRect(0.5, 0.5, 47, 47);
    }));

    // 3. Zalpa (Scout Captain)
    this.advisorPortraits.set('zalpa', makePixelCanvas(48, 48, (ctx) => {
      ctx.fillStyle = '#0e1c18';
      ctx.fillRect(0, 0, 48, 48);

      // Bronze tiara
      this.drawPixelBevelBox(ctx, 14, 6, 20, 8, '#14100c', '#292018', '#0a0806');
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(12, 12, 24, 4);

      // Face
      this.drawPixelBevelBox(ctx, 16, 16, 16, 14, '#dca275', '#f7c299', '#8f5c35', false);
      ctx.fillStyle = '#0f0a07';
      ctx.fillRect(19, 20, 3, 2);
      ctx.fillRect(26, 20, 3, 2);

      // Green cape and linen wrap
      ctx.fillStyle = '#1c5e50';
      ctx.fillRect(6, 38, 36, 10);
      ctx.fillStyle = '#2de0a5';
      ctx.fillRect(18, 38, 12, 10);

      ctx.strokeStyle = '#2de0a5';
      ctx.strokeRect(0.5, 0.5, 47, 47);
    }));
  }

  // --- Dune II Pixel Art Buildings ---
  private static initBuildingSprites(): void {
    const owners: ('player' | 'sea_peoples')[] = ['player', 'sea_peoples'];

    for (const owner of owners) {
      const isPlayer = owner === 'player';
      const cPrimary = isPlayer ? '#d4cbbd' : '#8c2626'; // Bright limestone vs Dark invader red
      const cLight = isPlayer ? '#f2ede4' : '#bd3e3e';
      const cDark = isPlayer ? '#8a7d6d' : '#4a1212';
      const cTrim = isPlayer ? '#2de0a5' : '#ff4d4d'; // Faction banner accent
      const cGold = '#ffd166';

      // 0. The Iconic "Concrete Slabs" -> Cyclopean Foundation Slabs (2x2 tiles = 48x48 px)
      this.buildingSprites.set(`cyclopean_slab_${owner}`, makePixelCanvas(48, 48, (ctx) => {
        // Base dark mortar
        ctx.fillStyle = '#1c1611';
        ctx.fillRect(0, 0, 48, 48);

        // 4 Quad Slabs with deep beveled borders and corner studs (Westwood Concrete Slabs style)
        const quads = [
          [1, 1, 22, 22], [25, 1, 22, 22],
          [1, 25, 22, 22], [25, 25, 22, 22]
        ];

        for (const [qx, qy, qw, qh] of quads) {
          this.drawPixelBevelBox(ctx, qx, qy, qw, qh, '#8a7e70', '#b8ac9c', '#4a4237', false);

          // Diagonal chisel grooves
          ctx.fillStyle = '#383025';
          ctx.fillRect(qx + 5, qy + 5, 2, 2);
          ctx.fillRect(qx + 14, qy + 13, 3, 2);

          // Corner metal bolts
          ctx.fillStyle = '#ffd166';
          ctx.fillRect(qx + 2, qy + 2, 2, 2);
          ctx.fillRect(qx + qw - 4, qy + 2, 2, 2);
          ctx.fillRect(qx + 2, qy + qh - 4, 2, 2);
          ctx.fillRect(qx + qw - 4, qy + qh - 4, 2, 2);
        }

        // Center bronze anchoring junction
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(22, 22, 4, 4);
        ctx.fillStyle = '#1c1611';
        ctx.strokeRect(21.5, 21.5, 5, 5);
      }));

      // 1. Acropolis / Construction Yard (4x4 tiles = 96x96 px)
      this.buildingSprites.set(`acropolis_${owner}`, makePixelCanvas(96, 96, (ctx) => {
        // Black drop shadow
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(6, 8, 86, 84);

        // Heavy fortified fortress base
        this.drawPixelBevelBox(ctx, 4, 6, 88, 86, cDark, cPrimary, '#261f18');

        // Central Megaron tier
        this.drawPixelBevelBox(ctx, 14, 16, 68, 64, cPrimary, cLight, cDark);

        // Terracotta tile roof eaves
        this.drawPixelBevelBox(ctx, 16, 12, 64, 14, '#a83e28', '#d95a3f', '#541c10');

        // Command dome with scan lights
        this.drawPixelBevelBox(ctx, 36, 32, 24, 22, '#382b1e', '#5c4632', '#1a130b');
        ctx.fillStyle = cTrim;
        ctx.fillRect(40, 36, 16, 4); // Glowing visor
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(44, 44, 8, 6);

        // Heavy blast door with hazard teeth
        this.drawPixelBevelBox(ctx, 34, 58, 28, 22, '#211811', '#403022', '#0f0a07');
        ctx.fillStyle = cGold;
        for (let bx = 38; bx <= 58; bx += 6) {
          ctx.fillRect(bx, 62, 3, 3);
          ctx.fillRect(bx, 72, 3, 3);
        }

        // Left and right defense pillboxes
        this.drawPixelBevelBox(ctx, 16, 48, 14, 26, cPrimary, cLight, cDark);
        this.drawPixelBevelBox(ctx, 66, 48, 14, 26, cPrimary, cLight, cDark);
        ctx.fillStyle = '#0f0a07';
        ctx.fillRect(20, 54, 6, 4); // Arrow slit
        ctx.fillRect(70, 54, 6, 4);

        // Radar mast / Faction flag pole
        ctx.fillStyle = '#0f0a07';
        ctx.fillRect(80, 8, 2, 24);
        ctx.fillStyle = cTrim;
        ctx.fillRect(82, 10, 10, 7);
      }));

      // 2. Bronze Foundry / Spice Refinery (3x3 tiles = 72x72 px)
      this.buildingSprites.set(`bronze_foundry_${owner}`, makePixelCanvas(72, 72, (ctx) => {
        // Drop shadow
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(4, 6, 66, 64);

        // Main refinery hull
        this.drawPixelBevelBox(ctx, 2, 4, 68, 64, cDark, cPrimary, '#1c150e');

        // THE ICONIC DUNE II VEHICLE UNLOAD RAMP
        // Angled ramp on the left where the harvester/donkey pulls up
        this.drawPixelBevelBox(ctx, 6, 12, 26, 48, '#4a3f35', '#6b5c4f', '#261f18');
        // Yellow hazard caution stripes on ramp
        for (let ry = 16; ry < 56; ry += 8) {
          ctx.fillStyle = '#ffd166';
          ctx.fillRect(8, ry, 22, 3);
          ctx.fillStyle = '#1c150e';
          ctx.fillRect(8, ry + 3, 22, 3);
        }

        // Ore hopper & glowing molten metal vat on the right
        this.drawPixelBevelBox(ctx, 36, 16, 30, 44, '#2e251c', '#473a2c', '#140f09');
        // Glowing orange/yellow molten bronze
        ctx.fillStyle = '#ff6200';
        ctx.fillRect(40, 22, 22, 18);
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(44, 25, 14, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(48, 28, 6, 4);

        // Twin industrial smoke vents
        this.drawPixelBevelBox(ctx, 38, 4, 8, 12, '#382f26', '#594a3d', '#14100c');
        this.drawPixelBevelBox(ctx, 52, 4, 8, 12, '#382f26', '#594a3d', '#14100c');

        // Stack of finished oxhide bronze ingots at the loading bay
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = '#ffd166';
          ctx.fillRect(40 + i * 6, 48 + i * 3, 10, 5);
          ctx.strokeStyle = '#0e0b08';
          ctx.strokeRect(39.5 + i * 6, 47.5 + i * 3, 11, 6);
        }
      }));

      // 3. Granary / Windtrap & Silo (2x2 tiles = 48x48 px)
      this.buildingSprites.set(`granary_${owner}`, makePixelCanvas(48, 48, (ctx) => {
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(3, 4, 44, 42);

        // Armored circular silo base
        this.drawPixelBevelBox(ctx, 2, 4, 44, 42, cDark, cPrimary, '#1c150e');

        // Domed top (Windtrap louvers / Clay dome)
        this.drawPixelBevelBox(ctx, 8, 8, 32, 20, '#a87332', '#d49b55', '#573711');
        ctx.fillStyle = '#1c150e';
        for (let lx = 12; lx <= 32; lx += 4) {
          ctx.fillRect(lx, 12, 2, 12); // Intake vents
        }

        // Heavy door & grain sacks
        this.drawPixelBevelBox(ctx, 18, 30, 12, 14, '#241a12', '#453223', '#0d0906');
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(8, 36, 6, 6); // Grain sack
        ctx.fillRect(34, 36, 6, 6);
      }));

      // 4. Barracks / Infantry Depot (3x3 tiles = 72x72 px)
      this.buildingSprites.set(`barracks_${owner}`, makePixelCanvas(72, 72, (ctx) => {
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(4, 6, 66, 64);

        // Fortified compound
        this.drawPixelBevelBox(ctx, 2, 4, 68, 64, cDark, cPrimary, '#1c150e');

        // Slanted red tile roof
        this.drawPixelBevelBox(ctx, 6, 8, 60, 16, '#a83e28', '#d95a3f', '#541c10');

        // Training courtyard (packed dirt)
        this.drawPixelBevelBox(ctx, 10, 28, 52, 34, '#8a6e45', '#b08f5d', '#45351e', false);

        // Sliding hangar deployment gate
        this.drawPixelBevelBox(ctx, 24, 42, 24, 22, '#211a14', '#3d3025', '#0f0b08');
        ctx.fillStyle = cTrim;
        ctx.fillRect(28, 46, 16, 3); // Faction stripe

        // Weapon racks & tower shields
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(14, 34, 6, 12);
        ctx.fillRect(52, 34, 6, 12);
      }));

      // 5. Watchtower / Turret (2x2 tiles = 48x48 px)
      this.buildingSprites.set(`watchtower_${owner}`, makePixelCanvas(48, 48, (ctx) => {
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(3, 4, 44, 42);

        // Tall square fortified turret
        this.drawPixelBevelBox(ctx, 8, 6, 32, 40, cPrimary, cLight, cDark);

        // Parapet top with battlements
        this.drawPixelBevelBox(ctx, 6, 4, 36, 10, cDark, cLight, '#1c150e');
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(16, 4, 4, 4);
        ctx.fillRect(28, 4, 4, 4);

        // Arrow slits
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(18, 20, 3, 10);
        ctx.fillRect(27, 20, 3, 10);

        // Warning beacon / fire pot
        ctx.fillStyle = '#ff6200';
        ctx.fillRect(22, 8, 4, 4);
      }));

      // 6. Chariot Stable / Heavy Vehicle Factory (3x3 tiles = 72x72 px)
      this.buildingSprites.set(`chariot_stable_${owner}`, makePixelCanvas(72, 72, (ctx) => {
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(4, 6, 66, 64);

        this.drawPixelBevelBox(ctx, 2, 4, 68, 64, cDark, cPrimary, '#1c150e');
        this.drawPixelBevelBox(ctx, 6, 8, 60, 14, '#382b1e', '#594430', '#17110a');

        // Dual vehicle maintenance bays
        this.drawPixelBevelBox(ctx, 10, 26, 24, 36, '#211811', '#3b2b1e', '#0d0906');
        this.drawPixelBevelBox(ctx, 38, 26, 24, 36, '#211811', '#3b2b1e', '#0d0906');

        // Bronze spoked wheels on display
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(16, 34, 12, 12);
        ctx.fillRect(44, 34, 12, 12);
        ctx.fillStyle = '#211811';
        ctx.fillRect(19, 37, 6, 6);
        ctx.fillRect(47, 37, 6, 6);
      }));

      // 7. Iron Smelter / Heavy Blast Bloomery (3x3 tiles = 72x72 px)
      this.buildingSprites.set(`iron_smelter_${owner}`, makePixelCanvas(72, 72, (ctx) => {
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(4, 6, 66, 64);

        // Dark basalt masonry
        this.drawPixelBevelBox(ctx, 2, 4, 68, 64, '#302b28', '#4f4844', '#141211');

        // Conical blast bloomery
        this.drawPixelBevelBox(ctx, 20, 12, 32, 48, '#24201e', '#3d3733', '#0d0c0b');

        // Glowing red furnace throat
        ctx.fillStyle = '#ff2b00';
        ctx.fillRect(28, 42, 16, 12);
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(32, 45, 8, 6);

        // Black raw iron ore heaps
        ctx.fillStyle = '#141110';
        ctx.fillRect(8, 46, 10, 10);
        ctx.fillRect(54, 46, 10, 10);
      }));
    }
  }

  public static getBuildingSprite(defId: string, owner: string): HTMLCanvasElement | null {
    const key = `${defId}_${owner}`;
    return this.buildingSprites.get(key) || this.buildingSprites.get(`${defId}_player`) || null;
  }

  // --- Dune II Pixel Art Units (16x16 to 24x24 Pixel Sprites) ---
  public static drawAnimatedUnit(
    ctx: CanvasRenderingContext2D,
    u: UnitEntity,
    cx: number,
    cy: number
  ): void {
    const isPlayer = u.owner === 'player';
    const cTeam = isPlayer ? '#2de0a5' : '#e63946'; // Atreides green vs Harkonnen red
    const cSkin = '#d49b6a';
    const cGold = '#ffd166';

    const isMoving = u.state === 'MOVE_TO' || u.state === 'RETURN_CARGO' || u.state === 'HARVESTING';
    const animPhase = (Date.now() / 150) * (isMoving ? 1.0 : 0.2);
    const step = isMoving ? Math.floor(Math.sin(animPhase) * 2) : 0;

    ctx.save();
    // Snap unit coordinates to exact integer pixels for crisp retro render!
    ctx.translate(Math.round(cx), Math.round(cy + step));

    // Ground shadow (chunky pixel ellipse)
    ctx.fillStyle = '#0e0b08';
    ctx.fillRect(-8, 7, 16, 3);

    if (u.defId === 'donkey_caravan') {
      // 1. CARAVAN / HARVESTER
      // Donkey body (brown chassis with black outline)
      ctx.fillStyle = '#0e0b08';
      ctx.fillRect(-9, -7, 18, 14); // Black outline
      ctx.fillStyle = '#5c4632';
      ctx.fillRect(-8, -6, 16, 12); // Brown hide

      // Ears & head
      ctx.fillStyle = '#382a1d';
      ctx.fillRect(6, -11, 4, 7);
      ctx.fillStyle = '#d49b6a';
      ctx.fillRect(8, -8, 2, 2); // Muzzle

      // Ore pannier baskets
      ctx.fillStyle = '#8f6838';
      ctx.fillRect(-6, -4, 12, 8);

      // Glowing ore cargo indicator (Green Malachite / Silver Tin / Dark Iron)
      if (u.currentCargoAmount > 0) {
        let cargoColor = '#2de0a5';
        if (u.currentCargoType === 'tin') cargoColor = '#f0f4f8';
        if (u.currentCargoType === 'iron') cargoColor = '#1a1412';
        ctx.fillStyle = cargoColor;
        ctx.fillRect(-4, -6, 8, 3);
      }
    } else if (u.defId === 'spear_militia') {
      // 2. TOWER-SHIELD SPEARMAN
      // Black outline
      ctx.fillStyle = '#0e0b08';
      ctx.fillRect(-6, -11, 12, 19);

      // Linen tunic & skin
      ctx.fillStyle = '#f0e8dc';
      ctx.fillRect(-4, -5, 8, 8);
      ctx.fillStyle = cSkin;
      ctx.fillRect(-3, -10, 6, 5);

      // Massive Mycenaean Tower-Shield (covering left flank)
      ctx.fillStyle = cTeam;
      ctx.fillRect(-7, -8, 6, 14);
      ctx.fillStyle = cGold;
      ctx.fillRect(-5, -4, 2, 6); // Boss

      // Bronze spear with shining point
      ctx.fillStyle = '#382b1d';
      ctx.fillRect(3, -6, 2, 16);
      ctx.fillStyle = cGold;
      ctx.fillRect(2, -14, 4, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, -15, 2, 2);
    } else if (u.defId === 'skirmisher') {
      // 3. LEVANTINE SLINGER
      ctx.fillStyle = '#0e0b08';
      ctx.fillRect(-5, -10, 10, 17);

      ctx.fillStyle = '#bfa77a';
      ctx.fillRect(-3, -4, 6, 7);
      ctx.fillStyle = cSkin;
      ctx.fillRect(-3, -9, 6, 5);

      // Slinger sling cord
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(4, -6, 4, 2);
      ctx.fillRect(6, -10, 2, 4);
    } else if (u.defId === 'bronze_swordsman') {
      // 4. KHOPESH BRONZE WARRIOR
      ctx.fillStyle = '#0e0b08';
      ctx.fillRect(-6, -11, 12, 19);

      // Bronze plate armor
      ctx.fillStyle = cGold;
      ctx.fillRect(-4, -6, 8, 9);
      ctx.fillStyle = cTeam;
      ctx.fillRect(-2, -4, 4, 5);

      // Crested helmet
      ctx.fillStyle = '#b81414';
      ctx.fillRect(-2, -14, 4, 4);

      // Curved sickle khopesh sword
      ctx.fillStyle = cGold;
      ctx.fillRect(4, -5, 2, 7);
      ctx.fillRect(6, -9, 4, 4); // Curve
    } else if (u.defId === 'war_chariot') {
      // 5. WAR CHARIOT (Treaded combat unit style)
      ctx.fillStyle = '#0e0b08';
      ctx.fillRect(-12, -8, 24, 16);

      // Horses & chassis
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(-10, -6, 20, 12);

      // Spoked wheels
      ctx.fillStyle = cGold;
      ctx.fillRect(-6, -8, 12, 2);
      ctx.fillRect(-6, 6, 12, 2);

      // Archer with drawn composite bow
      ctx.fillStyle = cTeam;
      ctx.fillRect(-8, -3, 6, 6);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-2, -2, 4, 4);
    } else if (u.defId === 'iron_infantry') {
      // 6. HEAVY IRON INFANTRY
      ctx.fillStyle = '#0e0b08';
      ctx.fillRect(-6, -11, 12, 19);

      // Black iron studded armor
      ctx.fillStyle = '#2b2624';
      ctx.fillRect(-4, -6, 8, 9);
      ctx.fillStyle = '#8f8883';
      ctx.fillRect(-2, -4, 4, 5);

      // Iron round shield
      ctx.fillStyle = '#171413';
      ctx.fillRect(-7, -4, 6, 8);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-5, -2, 2, 4);

      // Steel pike
      ctx.fillStyle = '#4a3d31';
      ctx.fillRect(3, -8, 2, 18);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(2, -16, 4, 8);
    } else {
      // 7. SEA PEOPLES RAIDER (Horned Shardana)
      ctx.fillStyle = '#0e0b08';
      ctx.fillRect(-6, -11, 12, 19);

      // Red war kilt
      ctx.fillStyle = '#8c1919';
      ctx.fillRect(-4, -5, 8, 8);
      ctx.fillStyle = cSkin;
      ctx.fillRect(-3, -10, 6, 5);

      // Horned helmet (Iconic Shardana horns)
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-6, -13, 2, 4);
      ctx.fillRect(4, -13, 2, 4);

      // Round shield & bronze broadsword
      ctx.fillStyle = '#381616';
      ctx.fillRect(-6, -3, 5, 7);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(3, -5, 3, 8);
    }

    ctx.restore();
  }
}
