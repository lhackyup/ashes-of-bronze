import { UnitEntity } from '../../entities/UnitEntity.ts';

function makeCanvas(w: number, h: number, drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
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

  // --- Core Roof Tile Generator from Original Prototype ---
  private static drawRoofTiles(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    baseColor: string,
    hiColor: string
  ): void {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, hiColor);
    g.addColorStop(1, baseColor);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 1;
    for (let tx = x + 4; tx < x + w; tx += 5) {
      ctx.beginPath();
      ctx.moveTo(tx, y);
      ctx.lineTo(tx, y + h);
      ctx.stroke();
    }
    for (let ty = y + 6; ty < y + h; ty += 6) {
      ctx.beginPath();
      ctx.moveTo(x, ty);
      ctx.lineTo(x + w, ty);
      ctx.stroke();
    }
  }

  private static makeBuildingSprite(size: number, drawFn: (ctx: CanvasRenderingContext2D, size: number) => void): HTMLCanvasElement {
    return makeCanvas(size, size, (ctx) => {
      // Soft drop shadow as in original prototype
      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.fillRect(10, 12, size - 12, size - 12);
      drawFn(ctx, size);
    });
  }

  // --- High Scribe / Advisor Portraits from Original Prototype ---
  private static initAdvisorPortraits(): void {
    // 1. Burna-Khabir (Scribe)
    this.advisorPortraits.set('burna_khabir', makeCanvas(64, 64, (ctx) => {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 64);
      bgGrad.addColorStop(0, '#1e293b');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 64, 64);

      // Classical marble column on left
      const colGrad = ctx.createLinearGradient(4, 0, 18, 0);
      colGrad.addColorStop(0, '#94a3b8');
      colGrad.addColorStop(0.5, '#f1f5f9');
      colGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = colGrad;
      ctx.fillRect(4, 4, 14, 56);

      // Toga & drape
      const togaGrad = ctx.createLinearGradient(12, 38, 52, 64);
      togaGrad.addColorStop(0, '#f8fafc');
      togaGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = togaGrad;
      ctx.beginPath();
      ctx.ellipse(32, 58, 22, 18, 0, Math.PI, 0);
      ctx.fill();

      // Royal crimson sash
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(20, 42); ctx.lineTo(30, 42); ctx.lineTo(40, 64); ctx.lineTo(28, 64);
      ctx.fill();

      // Face with radial gradient
      ctx.fillStyle = '#d99b66';
      ctx.fillRect(27, 34, 10, 10);
      const faceGrad = ctx.createRadialGradient(30, 22, 3, 32, 24, 14);
      faceGrad.addColorStop(0, '#f3c193');
      faceGrad.addColorStop(1, '#c6834e');
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.ellipse(32, 24, 10, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      // Noble archaic beard
      ctx.fillStyle = '#33271e';
      ctx.fillRect(24, 30, 16, 12);
      ctx.fillRect(27, 42, 10, 6);

      ctx.strokeStyle = '#c9933b';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 62);
    }));

    // 2. Tarkhunta (Master Smelter)
    this.advisorPortraits.set('tarkhunta', makeCanvas(64, 64, (ctx) => {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 64);
      bgGrad.addColorStop(0, '#381c15');
      bgGrad.addColorStop(1, '#140805');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 64, 64);

      // Face
      ctx.fillStyle = '#c78255';
      ctx.fillRect(24, 21, 16, 18);
      ctx.fillStyle = 'rgba(20, 15, 10, 0.55)';
      ctx.fillRect(26, 27, 7, 5); // Soot

      ctx.fillStyle = '#1f1610';
      ctx.fillRect(22, 35, 20, 18); // Dark beard

      ctx.fillStyle = '#5c351c';
      ctx.beginPath();
      ctx.ellipse(32, 68, 26, 18, 0, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 62);
    }));

    // 3. Zalpa (Scout Captain)
    this.advisorPortraits.set('zalpa', makeCanvas(64, 64, (ctx) => {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 64);
      bgGrad.addColorStop(0, '#1c2826');
      bgGrad.addColorStop(1, '#0c1412');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 64, 64);

      ctx.fillStyle = '#dca275';
      ctx.fillRect(24, 21, 16, 18);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(18, 18, 28, 5); // Tiara

      ctx.fillStyle = '#225e52';
      ctx.beginPath();
      ctx.ellipse(32, 68, 26, 18, 0, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#2de0a5';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 62);
    }));
  }

  // --- Buildings from Original Prototype (Adapted for 48px Tile Grid) ---
  private static initBuildingSprites(): void {
    const owners: ('player' | 'sea_peoples')[] = ['player', 'sea_peoples'];

    for (const owner of owners) {
      const isPlayer = owner === 'player';
      const cMain = isPlayer ? '#9e1b1b' : '#1d4e89';
      const cHi = isPlayer ? '#d62828' : '#2b6cb0';
      const cTrim = isPlayer ? '#fbbf24' : '#bae6fd';

      // 0. Slabs (48x48)
      this.buildingSprites.set(`cyclopean_slab_${owner}`, makeCanvas(48, 48, (ctx) => {
        ctx.fillStyle = '#857d75';
        ctx.fillRect(0, 0, 48, 48);

        const blocks = [
          [1, 1, 22, 22], [25, 1, 22, 22],
          [1, 25, 22, 22], [25, 25, 22, 22]
        ];
        blocks.forEach(([x, y, w, h]) => {
          const g = ctx.createLinearGradient(x, y, x + w, y + h);
          g.addColorStop(0, '#a89f96');
          g.addColorStop(1, '#6e665f');
          ctx.fillStyle = g;
          ctx.fillRect(x, y, w, h);

          ctx.strokeStyle = '#c4bbb1';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y + h); ctx.lineTo(x, y); ctx.lineTo(x + w, y);
          ctx.stroke();

          ctx.strokeStyle = '#3d3833';
          ctx.beginPath();
          ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h);
          ctx.stroke();
        });
      }));

      // 1. Acropolis / Praetorium (4x4 tiles = 192x192, scalable or 96x96 scaled)
      this.buildingSprites.set(`acropolis_${owner}`, this.makeBuildingSprite(192, (ctx) => {
        ctx.fillStyle = '#d6cfc5';
        ctx.fillRect(12, 24, 168, 152);
        ctx.strokeStyle = '#5c5349';
        ctx.lineWidth = 2;
        ctx.strokeRect(12, 24, 168, 152);

        this.drawRoofTiles(ctx, 16, 20, 160, 60, cMain, cHi);

        // Triangular Pediment
        ctx.fillStyle = '#e6dfd3';
        ctx.beginPath();
        ctx.moveTo(28, 80); ctx.lineTo(96, 44); ctx.lineTo(164, 80);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#786e63';
        ctx.stroke();

        // Gold center medallion
        ctx.fillStyle = cTrim;
        ctx.beginPath(); ctx.arc(96, 66, 12, 0, Math.PI * 2); ctx.fill();

        // Classical fluted colonnade
        for (let cx = 24; cx <= 156; cx += 26) {
          const colG = ctx.createLinearGradient(cx, 0, cx + 12, 0);
          colG.addColorStop(0, '#948b80');
          colG.addColorStop(0.4, '#f5f0e6');
          colG.addColorStop(1, '#6b635a');
          ctx.fillStyle = colG;
          ctx.fillRect(cx, 82, 12, 88);
        }

        // Entrance portal
        ctx.fillStyle = '#1c1815';
        ctx.fillRect(72, 108, 48, 64);
        ctx.strokeStyle = cTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(72, 108, 48, 64);
      }));

      // 2. Bronze Foundry / Refinery (3x3 tiles = 144x144)
      this.buildingSprites.set(`bronze_foundry_${owner}`, this.makeBuildingSprite(144, (ctx) => {
        ctx.fillStyle = '#b8afa4';
        ctx.fillRect(9, 21, 126, 114);

        this.drawRoofTiles(ctx, 12, 18, 64, 54, cMain, cHi);
        ctx.fillStyle = '#7a7066';
        ctx.fillRect(15, 72, 58, 58);

        // Ore hopper & golden ore ramp
        ctx.fillStyle = '#26211c';
        ctx.fillRect(78, 45, 50, 82);
        const oreG = ctx.createLinearGradient(81, 51, 123, 75);
        oreG.addColorStop(0, '#fde047');
        oreG.addColorStop(1, '#b45309');
        ctx.fillStyle = oreG;
        ctx.fillRect(82, 52, 40, 22);

        // Crane hoist with pulley wheel
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(68, 12, 9, 82);
        ctx.fillRect(68, 12, 50, 9);
        ctx.strokeStyle = '#d4a373';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(72, 42, 15, 0, Math.PI * 2); ctx.stroke();
      }));

      // 3. Granary (2x2 tiles = 96x96)
      this.buildingSprites.set(`granary_${owner}`, this.makeBuildingSprite(96, (ctx) => {
        ctx.fillStyle = '#b8afa4';
        ctx.fillRect(6, 14, 82, 74);

        this.drawRoofTiles(ctx, 8, 12, 80, 36, cMain, cHi);
        ctx.fillStyle = '#7a7066';
        ctx.fillRect(10, 48, 76, 38);

        // Sacks of grain
        for (let sx = 20; sx <= 66; sx += 14) {
          ctx.fillStyle = '#ffd166';
          ctx.beginPath(); ctx.arc(sx, 74, 6, 0, Math.PI * 2); ctx.fill();
        }
      }));

      // 4. Barracks (3x3 tiles = 144x144)
      this.buildingSprites.set(`barracks_${owner}`, this.makeBuildingSprite(144, (ctx) => {
        ctx.fillStyle = '#c4bbb0';
        ctx.fillRect(9, 18, 126, 116);

        this.drawRoofTiles(ctx, 9, 15, 126, 34, cMain, cHi);
        ctx.fillStyle = cTrim;
        ctx.fillRect(18, 42, 108, 5);

        ctx.fillStyle = '#8c7355';
        ctx.fillRect(21, 54, 102, 70);
        ctx.strokeStyle = '#4a3d2f';
        ctx.strokeRect(21, 54, 102, 70);

        for (let sx = 30; sx <= 104; sx += 32) {
          ctx.fillStyle = cMain;
          ctx.fillRect(sx, 68, 16, 24);
          ctx.strokeStyle = cTrim;
          ctx.strokeRect(sx, 68, 16, 24);
        }
      }));

      // 5. Watchtower (2x2 tiles = 96x96, footprint 48x48)
      this.buildingSprites.set(`watchtower_${owner}`, this.makeBuildingSprite(96, (ctx) => {
        const towerG = ctx.createLinearGradient(22, 0, 74, 0);
        towerG.addColorStop(0, '#948b80');
        towerG.addColorStop(0.4, '#e6dfd3');
        towerG.addColorStop(1, '#5c5349');
        ctx.fillStyle = towerG;
        ctx.fillRect(22, 20, 52, 68);

        this.drawRoofTiles(ctx, 14, 8, 68, 20, cMain, cHi);
        ctx.fillStyle = cTrim;
        ctx.fillRect(38, 12, 16, 10);

        ctx.fillStyle = '#1c1815';
        ctx.fillRect(40, 40, 12, 32);
      }));

      // 6. Chariot Stable / Factory (3x3 tiles = 144x144)
      this.buildingSprites.set(`chariot_stable_${owner}`, this.makeBuildingSprite(144, (ctx) => {
        ctx.fillStyle = '#968c82';
        ctx.fillRect(9, 21, 126, 114);

        this.drawRoofTiles(ctx, 9, 15, 126, 36, cMain, cHi);

        ctx.fillStyle = '#1f1b18';
        ctx.fillRect(21, 57, 102, 74);

        // Radiant glowing forge fire
        const fireG = ctx.createRadialGradient(42, 84, 3, 42, 84, 21);
        fireG.addColorStop(0, '#fef08a');
        fireG.addColorStop(0.5, '#f97316');
        fireG.addColorStop(1, 'rgba(185, 28, 28, 0)');
        ctx.fillStyle = fireG;
        ctx.fillRect(24, 66, 36, 36);

        // Industrial smokestack
        ctx.fillStyle = '#575049';
        ctx.fillRect(102, 6, 21, 42);
        ctx.fillStyle = '#292524';
        ctx.fillRect(105, 6, 15, 6);
      }));

      // 7. Iron Smelter
      this.buildingSprites.set(`iron_smelter_${owner}`, this.makeBuildingSprite(144, (ctx) => {
        ctx.fillStyle = '#4a4238';
        ctx.fillRect(9, 21, 126, 114);
        this.drawRoofTiles(ctx, 9, 15, 126, 36, '#292524', '#575049');

        ctx.fillStyle = '#1c1714';
        ctx.fillRect(21, 57, 102, 74);

        const fireG = ctx.createRadialGradient(72, 84, 3, 72, 84, 24);
        fireG.addColorStop(0, '#ffffff');
        fireG.addColorStop(0.3, '#ffaa00');
        fireG.addColorStop(0.7, '#ff3300');
        fireG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fireG;
        ctx.fillRect(48, 60, 48, 48);
      }));
    }
  }

  public static getBuildingSprite(defId: string, owner: string): HTMLCanvasElement | null {
    const key = `${defId}_${owner}`;
    return this.buildingSprites.get(key) || this.buildingSprites.get(`${defId}_player`) || null;
  }

  // --- Dynamic Animated Units from Original Prototype ---
  public static drawAnimatedUnit(
    ctx: CanvasRenderingContext2D,
    u: UnitEntity,
    cx: number,
    cy: number
  ): void {
    const isPlayer = u.owner === 'player';
    const cMain = isPlayer ? '#b91c1c' : '#1d4ed8';
    const cTrim = isPlayer ? '#fbbf24' : '#93c5fd';

    const isMoving = u.state === 'MOVE_TO' || u.state === 'RETURN_CARGO' || u.state === 'HARVESTING';
    const animPhase = (Date.now() / 150) * (isMoving ? 1.0 : 0.2);
    const bob = isMoving ? Math.sin(animPhase) * 2.5 : 0;

    // Ground cast shadow ellipse
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 12, u.def.category === 'chariot' ? 18 : 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);

    if (u.def.category === 'worker') {
      // Harvester / Donkey Caravan Wagon
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(-16, -8 + bob * 0.4, 32, 16);
      ctx.fillStyle = cMain;
      ctx.fillRect(-14, -6 + bob * 0.4, 28, 4);

      // LIVE ORE FILL LEVEL BAR
      if (u.currentCargoAmount > 0) {
        const maxCargo = u.def.cargoCapacity || 100;
        const fillH = Math.ceil((u.currentCargoAmount / maxCargo) * 8);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-11, 2 - fillH + bob * 0.4, 22, fillH);
      }

      // Spoked wheels
      ctx.fillStyle = '#1c1917';
      ctx.beginPath(); ctx.arc(-9, 10, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(9, 10, 5, 0, Math.PI * 2); ctx.fill();
    } else if (u.def.category === 'chariot') {
      // 2-Horse Chariot
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(-14, -6 + bob * 0.5, 28, 12);
      ctx.fillStyle = cMain;
      ctx.fillRect(-12, -4 + bob * 0.5, 24, 4);
      // Wheels
      ctx.fillStyle = '#1c1917';
      ctx.beginPath(); ctx.arc(-8, 8, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(8, 8, 6, 0, Math.PI * 2); ctx.fill();
    } else {
      // Infantry / Spearman / Raider
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-5, 4, 3.5, 8 + bob);
      ctx.fillRect(2, 4, 3.5, 8 - bob);

      // Torso & Tunic
      ctx.fillStyle = cMain;
      ctx.fillRect(-6, -8 + bob * 0.5, 12, 13);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-5, -6 + bob * 0.5, 10, 7); // Breastplate

      // Helmet & Crest
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(0, -10 + bob * 0.5, 5.5, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = cTrim;
      ctx.fillRect(-2, -18 + bob * 0.5, 4, 6);

      // Tower Shield
      ctx.fillStyle = cMain;
      ctx.fillRect(-9, -7 + bob * 0.5, 5, 15);
      ctx.strokeStyle = cTrim;
      ctx.lineWidth = 1;
      ctx.strokeRect(-9, -7 + bob * 0.5, 5, 15);

      // Spear
      ctx.strokeStyle = '#473d31';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 8); ctx.lineTo(6, -20);
      ctx.stroke();
      ctx.fillStyle = cTrim;
      ctx.beginPath();
      ctx.moveTo(6, -24); ctx.lineTo(3, -19); ctx.lineTo(9, -19);
      ctx.fill();
    }

    ctx.restore();
  }
}
