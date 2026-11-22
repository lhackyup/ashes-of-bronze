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

  // --- Master Bronze Age Advisor Portraits (128x128 High-Detail SVGA) ---
  private static initAdvisorPortraits(): void {
    // 1. Burna-Khabir (Elder Royal Scribe & Chronicler)
    this.advisorPortraits.set('burna_khabir', makeCanvas(128, 128, (ctx) => {
      // Background: Ancient stone library with warm torch/candle ambiance
      const bgGrad = ctx.createLinearGradient(0, 0, 128, 128);
      bgGrad.addColorStop(0, '#2d1f14');
      bgGrad.addColorStop(0.5, '#17110c');
      bgGrad.addColorStop(1, '#0a0806');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 128, 128);

      // Cuneiform tablet shelf & arch in background
      ctx.fillStyle = '#1c140d';
      ctx.fillRect(8, 12, 34, 104);
      ctx.fillStyle = '#c9933b';
      ctx.globalAlpha = 0.25;
      for (let y = 18; y < 110; y += 12) {
        ctx.fillRect(12, y, 26, 4);
      }
      ctx.globalAlpha = 1.0;

      // Soft warm candlelight bloom from bottom-left
      const candleG = ctx.createRadialGradient(24, 104, 4, 24, 104, 70);
      candleG.addColorStop(0, 'rgba(255, 180, 70, 0.35)');
      candleG.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = candleG;
      ctx.fillRect(0, 0, 128, 128);

      // Linen Robe with draped folds
      const robeG = ctx.createLinearGradient(30, 80, 100, 128);
      robeG.addColorStop(0, '#f2ece1');
      robeG.addColorStop(0.5, '#c9beb0');
      robeG.addColorStop(1, '#7a7063');
      ctx.fillStyle = robeG;
      ctx.beginPath();
      ctx.moveTo(24, 128);
      ctx.bezierCurveTo(24, 96, 48, 86, 64, 86);
      ctx.bezierCurveTo(80, 86, 104, 96, 104, 128);
      ctx.closePath();
      ctx.fill();

      // Fold creases in linen
      ctx.strokeStyle = '#5a5144';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(42, 98); ctx.bezierCurveTo(50, 110, 52, 124, 52, 128);
      ctx.moveTo(86, 98); ctx.bezierCurveTo(78, 110, 76, 124, 76, 128);
      ctx.moveTo(64, 88); ctx.lineTo(64, 128);
      ctx.stroke();

      // Gold embroidered collar trim
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(64, 88, 22, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();

      // Neck
      ctx.fillStyle = '#b87b4f';
      ctx.fillRect(56, 70, 16, 20);

      // Face base
      const faceG = ctx.createRadialGradient(64, 48, 8, 64, 52, 32);
      faceG.addColorStop(0, '#f3c49a');
      faceG.addColorStop(0.65, '#df9e6c');
      faceG.addColorStop(1, '#a86236');
      ctx.fillStyle = faceG;
      ctx.beginPath();
      ctx.ellipse(64, 50, 20, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.fillStyle = '#cf8959';
      ctx.beginPath(); ctx.ellipse(43, 50, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(85, 50, 4, 7, 0, 0, Math.PI * 2); ctx.fill();

      // Eyebrows (Wisdom, grey-silver)
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(48, 40); ctx.bezierCurveTo(54, 38, 59, 41, 61, 44); ctx.lineTo(59, 45); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(80, 40); ctx.bezierCurveTo(74, 38, 69, 41, 67, 44); ctx.lineTo(69, 45); ctx.closePath(); ctx.fill();

      // Eyes (Almond shaped, intelligent, dark with highlights)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.ellipse(54, 46, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(74, 46, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();

      // Irises & Pupils
      ctx.fillStyle = '#2d1b0d';
      ctx.beginPath(); ctx.arc(54, 46, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(74, 46, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(55, 45, 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(75, 45, 0.8, 0, Math.PI * 2); ctx.fill();

      // Aquiline nose
      ctx.strokeStyle = '#8a4b24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(64, 43); ctx.lineTo(62, 57); ctx.lineTo(67, 58);
      ctx.stroke();

      // Flowing silver beard with textured curl volume
      const beardG = ctx.createLinearGradient(44, 58, 84, 110);
      beardG.addColorStop(0, '#f1f5f9');
      beardG.addColorStop(0.4, '#cbd5e1');
      beardG.addColorStop(1, '#64748b');
      ctx.fillStyle = beardG;
      ctx.beginPath();
      ctx.moveTo(48, 58);
      ctx.bezierCurveTo(40, 75, 46, 102, 64, 112);
      ctx.bezierCurveTo(82, 102, 88, 75, 80, 58);
      ctx.bezierCurveTo(72, 64, 56, 64, 48, 58);
      ctx.closePath();
      ctx.fill();

      // Beard strand details
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let bx = 50; bx <= 78; bx += 4) {
        ctx.beginPath();
        ctx.moveTo(bx, 64);
        ctx.bezierCurveTo(bx + (bx < 64 ? -3 : 3), 82, bx, 98, 64, 110);
        ctx.stroke();
      }

      // Royal bronze circlet on forehead with red gem
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(64, 40, 18, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.arc(64, 25, 2.5, 0, Math.PI * 2); ctx.fill();

      // Ornate Outer Bronze Border
      ctx.strokeStyle = '#c9933b';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, 124, 124);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1;
      ctx.strokeRect(4, 4, 120, 120);
    }));

    // 2. Tarkhunta (Luwian Master Smelter & Metallurgist)
    this.advisorPortraits.set('tarkhunta', makeCanvas(128, 128, (ctx) => {
      // Background: Roaring bronze furnace with intense volcanic ember glow
      const bgGrad = ctx.createLinearGradient(0, 0, 128, 128);
      bgGrad.addColorStop(0, '#421408');
      bgGrad.addColorStop(0.5, '#1e0804');
      bgGrad.addColorStop(1, '#0a0302');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 128, 128);

      // Stone furnace aperture with intense radial molten bloom
      const fireG = ctx.createRadialGradient(28, 70, 4, 28, 70, 75);
      fireG.addColorStop(0, '#fff4cc');
      fireG.addColorStop(0.3, '#ff7a00');
      fireG.addColorStop(0.7, '#cc2900');
      fireG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fireG;
      ctx.fillRect(0, 0, 128, 128);

      // Floating sparks and embers
      const sparks = [[18, 42], [32, 28], [24, 52], [40, 36], [12, 68]];
      ctx.fillStyle = '#ffdf73';
      sparks.forEach(([sx, sy]) => {
        ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill();
      });

      // Heavy stitched leather smithing tunic
      const apronG = ctx.createLinearGradient(20, 84, 108, 128);
      apronG.addColorStop(0, '#452618');
      apronG.addColorStop(0.5, '#29140b');
      apronG.addColorStop(1, '#140804');
      ctx.fillStyle = apronG;
      ctx.beginPath();
      ctx.moveTo(20, 128);
      ctx.bezierCurveTo(20, 92, 46, 82, 64, 82);
      ctx.bezierCurveTo(82, 82, 108, 92, 108, 128);
      ctx.closePath();
      ctx.fill();

      // Thick leather shoulder straps with hammered bronze studs
      ctx.fillStyle = '#1c0d07';
      ctx.fillRect(36, 84, 12, 44);
      ctx.fillRect(80, 84, 12, 44);
      ctx.fillStyle = '#ffd166';
      for (let y = 90; y <= 122; y += 12) {
        ctx.beginPath(); ctx.arc(42, y, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(86, y, 2.5, 0, Math.PI * 2); ctx.fill();
      }

      // Hammered bronze torque / collar around neck
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(64, 82, 16, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();

      // Powerful, muscular neck
      ctx.fillStyle = '#ad5f31';
      ctx.fillRect(54, 66, 20, 22);

      // Rugged, sun-bronzed head
      const faceG = ctx.createRadialGradient(64, 46, 6, 64, 50, 30);
      faceG.addColorStop(0, '#d9824c');
      faceG.addColorStop(0.65, '#b8632e');
      faceG.addColorStop(1, '#783816');
      ctx.fillStyle = faceG;
      ctx.beginPath();
      ctx.ellipse(64, 48, 22, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Orange forge fire rim-light on left side of face
      ctx.strokeStyle = '#ff9933';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(64, 48, 22, Math.PI * 0.65, Math.PI * 1.35);
      ctx.stroke();

      // Soot smudges from furnace
      ctx.fillStyle = 'rgba(20, 10, 5, 0.55)';
      ctx.beginPath(); ctx.ellipse(54, 42, 6, 4, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(72, 38, 7, 3, -0.2, 0, Math.PI * 2); ctx.fill();

      // Deep, determined eyes
      ctx.fillStyle = '#fff4e6';
      ctx.beginPath(); ctx.ellipse(54, 44, 4.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(74, 44, 4.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a0c06';
      ctx.beginPath(); ctx.arc(54, 44, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(74, 44, 2.5, 0, Math.PI * 2); ctx.fill();
      // Fiery orange reflection in pupils
      ctx.fillStyle = '#ff7a00';
      ctx.beginPath(); ctx.arc(54, 44, 1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(74, 44, 1, 0, Math.PI * 2); ctx.fill();

      // Strong heavy nose
      ctx.strokeStyle = '#6e3011';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(64, 40); ctx.lineTo(63, 54); ctx.lineTo(68, 55);
      ctx.stroke();

      // Square Luwian black beard
      const beardG = ctx.createLinearGradient(42, 54, 86, 104);
      beardG.addColorStop(0, '#261710');
      beardG.addColorStop(0.5, '#120a06');
      beardG.addColorStop(1, '#050201');
      ctx.fillStyle = beardG;
      ctx.beginPath();
      ctx.moveTo(44, 52);
      ctx.bezierCurveTo(42, 74, 46, 104, 64, 104);
      ctx.bezierCurveTo(82, 104, 86, 74, 84, 52);
      ctx.bezierCurveTo(76, 58, 52, 58, 44, 52);
      ctx.closePath();
      ctx.fill();

      // Dense dark curls
      ctx.fillStyle = '#170e0a';
      ctx.beginPath(); ctx.arc(64, 28, 20, Math.PI, 0); ctx.fill();

      // Beveled Frame
      ctx.strokeStyle = '#c9933b';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, 124, 124);
      ctx.strokeStyle = '#ff7a00';
      ctx.lineWidth = 1;
      ctx.strokeRect(4, 4, 120, 120);
    }));

    // 3. Zalpa (Kaska Scout Captain & Ranger)
    this.advisorPortraits.set('zalpa', makeCanvas(128, 128, (ctx) => {
      // Background: Stormy Aegean sea & sky gradient with distant coastal gale
      const bgGrad = ctx.createLinearGradient(0, 0, 128, 128);
      bgGrad.addColorStop(0, '#1a2e36');
      bgGrad.addColorStop(0.6, '#0f1d22');
      bgGrad.addColorStop(1, '#060c0e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 128, 128);

      // Coastal sand dunes silhouette in background
      ctx.fillStyle = '#223831';
      ctx.beginPath();
      ctx.moveTo(0, 90); ctx.bezierCurveTo(40, 75, 80, 85, 128, 70); ctx.lineTo(128, 128); ctx.lineTo(0, 128);
      ctx.closePath();
      ctx.fill();

      // Deep teal scout mantle & hooded cloak
      const cloakG = ctx.createLinearGradient(20, 84, 108, 128);
      cloakG.addColorStop(0, '#1d5449');
      cloakG.addColorStop(0.5, '#123830');
      cloakG.addColorStop(1, '#081c18');
      ctx.fillStyle = cloakG;
      ctx.beginPath();
      ctx.moveTo(20, 128);
      ctx.bezierCurveTo(20, 90, 46, 80, 64, 80);
      ctx.bezierCurveTo(82, 80, 108, 90, 108, 128);
      ctx.closePath();
      ctx.fill();

      // Bronze lamellar scale shoulder guard on right shoulder
      ctx.fillStyle = '#b8862d';
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          const sx = 78 + c * 7;
          const sy = 88 + r * 8;
          ctx.beginPath();
          ctx.roundRect(sx, sy, 6, 8, 2);
          ctx.fill();
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Wolf tooth bone clasp at chest
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(60, 82); ctx.lineTo(68, 82); ctx.lineTo(64, 96);
      ctx.closePath();
      ctx.fill();

      // Graceful yet athletic neck
      ctx.fillStyle = '#c78358';
      ctx.fillRect(57, 66, 14, 20);

      // Fierce, sharp-featured feminine warrior face
      const faceG = ctx.createRadialGradient(64, 46, 6, 64, 48, 26);
      faceG.addColorStop(0, '#f5ba8e');
      faceG.addColorStop(0.65, '#df9b6d');
      faceG.addColorStop(1, '#a66037');
      ctx.fillStyle = faceG;
      ctx.beginPath();
      ctx.ellipse(64, 48, 18, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sharp high cheekbones shading
      ctx.fillStyle = 'rgba(120, 50, 20, 0.25)';
      ctx.beginPath(); ctx.ellipse(52, 50, 5, 3, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(76, 50, 5, 3, -0.3, 0, Math.PI * 2); ctx.fill();

      // Piercing vigilant amber eyes with archaic kohl outline
      ctx.strokeStyle = '#1a1008';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(48, 44); ctx.bezierCurveTo(53, 41, 57, 42, 60, 45);
      ctx.moveTo(68, 45); ctx.bezierCurveTo(71, 42, 75, 41, 80, 44);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(54, 44, 4.5, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(74, 44, 4.5, 2.2, 0, 0, Math.PI * 2); ctx.fill();

      // Amber/hazel irises
      ctx.fillStyle = '#d97706';
      ctx.beginPath(); ctx.arc(54, 44, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(74, 44, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f0804';
      ctx.beginPath(); ctx.arc(54, 44, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(74, 44, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(55, 43, 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(75, 43, 0.7, 0, Math.PI * 2); ctx.fill();

      // Slender aquiline nose & lips
      ctx.strokeStyle = '#7c3815';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(64, 41); ctx.lineTo(63, 53); ctx.lineTo(66, 54);
      ctx.stroke();
      ctx.fillStyle = '#b95738';
      ctx.beginPath(); ctx.ellipse(64, 60, 4, 1.8, 0, 0, Math.PI * 2); ctx.fill();

      // Dark war braids with turquoise beads
      ctx.fillStyle = '#1a120c';
      ctx.beginPath(); ctx.arc(64, 30, 19, Math.PI, 0); ctx.fill();
      ctx.fillRect(44, 32, 6, 40);
      ctx.fillRect(78, 32, 6, 40);

      // Turquoise beads in braids
      ctx.fillStyle = '#2de0a5';
      ctx.beginPath(); ctx.arc(47, 48, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(47, 60, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(81, 48, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(81, 60, 2, 0, Math.PI * 2); ctx.fill();

      // Scout archer bronze headband with crescent charm
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(64, 38, 17, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.fillStyle = '#2de0a5';
      ctx.beginPath(); ctx.arc(64, 23, 2.5, 0, Math.PI * 2); ctx.fill();

      // Outer Patinated Bronze Border
      ctx.strokeStyle = '#2de0a5';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(2, 2, 124, 124);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1;
      ctx.strokeRect(4, 4, 120, 120);
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

      // 3. Granary & Freshwater Well (2x2 tiles = 96x96)
      this.buildingSprites.set(`granary_${owner}`, this.makeBuildingSprite(96, (ctx) => {
        // --- A. Cobblestone Yard & Shaded Terrace Base ---
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(4, 16, 88, 74);

        // Stone terrace flagstones
        ctx.fillStyle = '#6e6459';
        ctx.fillRect(4, 18, 88, 70);
        ctx.fillStyle = '#8a7f72';
        for (let fx = 6; fx < 88; fx += 14) {
          for (let fy = 20; fy < 86; fy += 12) {
            ctx.fillRect(fx, fy, 12, 10);
            ctx.strokeStyle = '#473f36';
            ctx.strokeRect(fx, fy, 12, 10);
          }
        }

        // --- B. Granary Building (Left Section: x: 4..58, y: 12..84) ---
        // 1. Megalithic Foundation Stilt Piers (elevates timber floor to repel rodents & dampness)
        const piers = [6, 20, 36, 48];
        for (const px of piers) {
          const pierG = ctx.createLinearGradient(px, 72, px + 8, 84);
          pierG.addColorStop(0, '#a39788');
          pierG.addColorStop(1, '#4a4136');
          ctx.fillStyle = pierG;
          ctx.fillRect(px, 72, 8, 12);
          ctx.strokeStyle = '#29221b';
          ctx.strokeRect(px, 72, 8, 12);
        }
        // Dark ventilated crawlspace under floor
        ctx.fillStyle = '#211a14';
        ctx.fillRect(5, 74, 52, 6);

        // Heavy Cedar floor beams
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(4, 69, 54, 5);
        ctx.fillStyle = '#805230';
        ctx.fillRect(4, 69, 54, 1.5);

        // 2. Main Storehouse Walls (Sunbaked Mudbrick with Cedar Timber Framework)
        const wallG = ctx.createLinearGradient(5, 28, 56, 70);
        wallG.addColorStop(0, '#d9cbba');
        wallG.addColorStop(0.5, '#c7b6a2');
        wallG.addColorStop(1, '#9e8e7a');
        ctx.fillStyle = wallG;
        ctx.fillRect(6, 30, 50, 40);

        // Mudbrick horizontal mortar lines
        ctx.strokeStyle = 'rgba(84, 71, 57, 0.35)';
        ctx.lineWidth = 1;
        for (let my = 36; my < 70; my += 6) {
          ctx.beginPath();
          ctx.moveTo(7, my);
          ctx.lineTo(55, my);
          ctx.stroke();
        }

        // Cedar corner posts and bracing
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(6, 30, 5, 40); // Left post
        ctx.fillRect(51, 30, 5, 40); // Right post
        ctx.fillRect(29, 30, 4, 40); // Center post
        ctx.fillRect(6, 48, 50, 3); // Horizontal timber tie-beam
        ctx.fillStyle = '#8d5b32';
        ctx.fillRect(6, 30, 1.5, 40);
        ctx.fillRect(29, 30, 1.5, 40);

        // Arched Granary Intake Door
        ctx.fillStyle = '#1c130c';
        ctx.fillRect(13, 50, 13, 20);
        ctx.beginPath();
        ctx.arc(19.5, 50, 6.5, Math.PI, 0);
        ctx.fill();
        // Bronze studded wooden door leaves
        ctx.fillStyle = '#422817';
        ctx.fillRect(14, 51, 11, 18);
        ctx.fillStyle = '#fbbf24'; // Bronze rivets & ring handle
        ctx.fillRect(15, 54, 2, 2);
        ctx.fillRect(22, 54, 2, 2);
        ctx.fillRect(21, 60, 2.5, 2.5);

        // Access timber ramp leading into door
        ctx.fillStyle = '#5c3a21';
        ctx.beginPath();
        ctx.moveTo(11, 74); ctx.lineTo(26, 74); ctx.lineTo(28, 82); ctx.lineTo(9, 82);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#382212';
        ctx.stroke();

        // 3. Upper Grain Loft / Attic Louver Window
        ctx.fillStyle = '#261b12';
        ctx.fillRect(14, 34, 11, 10);
        // Cedar louvers
        ctx.fillStyle = '#784725';
        ctx.fillRect(14, 36, 11, 1.5);
        ctx.fillRect(14, 39, 11, 1.5);
        ctx.fillRect(14, 42, 11, 1.5);

        // Hoist crane timber arm jutting from gable
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(19, 16, 3, 16);
        ctx.fillRect(19, 16, 14, 3);
        // Dangling hemp hoist rope with bronze hook
        ctx.strokeStyle = '#d4b996';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(31, 19);
        ctx.lineTo(31, 38);
        ctx.stroke();
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(30, 38, 3, 3);

        // 4. Beehive Silo Dome Annex (Rear-Left)
        const siloG = ctx.createLinearGradient(0, 18, 16, 48);
        siloG.addColorStop(0, '#c79d63');
        siloG.addColorStop(1, '#66451e');
        ctx.fillStyle = siloG;
        ctx.beginPath();
        ctx.ellipse(8, 28, 7, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38230c';
        ctx.stroke();
        // Bronze reinforcing hoops on silo
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(8, 28, 7, 0, Math.PI);
        ctx.stroke();

        // 5. Pitched Cedar Shake / Terracotta Tile Roof
        this.drawRoofTiles(ctx, 4, 10, 54, 22, cMain, cHi);
        // Triangular pediment front
        ctx.fillStyle = '#e6dfd3';
        ctx.beginPath();
        ctx.moveTo(4, 14); ctx.lineTo(31, 3); ctx.lineTo(58, 14);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#786e63';
        ctx.stroke();

        // Faction Pennant on Roof Peak
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(30, -2, 2, 7);
        ctx.fillStyle = cMain;
        ctx.beginPath();
        ctx.moveTo(32, -2); ctx.lineTo(44, 1); ctx.lineTo(32, 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = cTrim;
        ctx.fillRect(32, 0, 2, 3);

        // --- C. Stored Harvest: Burlap Sacks, Amphorae & Wheat Sheaves ---
        // 1. Stacked Burlap Grain Sacks (Golden / Amber with tied cord necks)
        const sacks = [
          { x: 33, y: 70, w: 10, h: 8, rot: -0.1 },
          { x: 43, y: 72, w: 10, h: 8, rot: 0.1 },
          { x: 37, y: 64, w: 10, h: 8, rot: 0.05 }
        ];
        for (const s of sacks) {
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.rot);
          const sackG = ctx.createRadialGradient(4, 3, 1, 5, 4, 7);
          sackG.addColorStop(0, '#fde68a');
          sackG.addColorStop(0.5, '#d97706');
          sackG.addColorStop(1, '#78350f');
          ctx.fillStyle = sackG;
          ctx.beginPath();
          ctx.ellipse(5, 4, s.w / 2, s.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1;
          ctx.stroke();
          // Tied sack neck tuft
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(3, -2, 4, 3);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(3.5, 0, 3, 1);
          ctx.restore();
        }

        // Open sack with spilled golden wheat grains
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(33, 79, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(30, 80, 2, 1.5);
        ctx.fillRect(35, 80, 2, 1.5);
        ctx.fillRect(33, 81.5, 2, 1.5);

        // 2. Terracotta Storage Pithoi / Jars
        const jars = [
          { x: 49, y: 62, w: 7, h: 14 },
          { x: 55, y: 67, w: 6, h: 11 }
        ];
        for (const j of jars) {
          const jarG = ctx.createLinearGradient(j.x, j.y, j.x + j.w, j.y + j.h);
          jarG.addColorStop(0, '#ea580c');
          jarG.addColorStop(0.4, '#c2410c');
          jarG.addColorStop(1, '#431407');
          ctx.fillStyle = jarG;
          ctx.beginPath();
          ctx.ellipse(j.x + j.w / 2, j.y + j.h * 0.6, j.w / 2, j.h * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(j.x + j.w * 0.2, j.y, j.w * 0.6, j.h * 0.3);
          ctx.strokeStyle = '#270c04';
          ctx.lineWidth = 1;
          ctx.stroke();
          // Jar rim
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(j.x + j.w * 0.1, j.y - 1, j.w * 0.8, 2);
        }

        // --- D. The Freshwater Well & Watering Trough (Right Section: x: 62..94, y: 28..88) ---
        // 1. Wet cobblestone splash circle
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.beginPath();
        ctx.ellipse(78, 68, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Circular Stone Well-Curb (Dry-laid masonry)
        const wellG = ctx.createLinearGradient(66, 52, 90, 76);
        wellG.addColorStop(0, '#d1c7bc');
        wellG.addColorStop(0.3, '#9c8e7e');
        wellG.addColorStop(0.8, '#574d42');
        wellG.addColorStop(1, '#2d251e');
        ctx.fillStyle = wellG;
        ctx.fillRect(66, 54, 24, 20);
        ctx.strokeStyle = '#1f1a14';
        ctx.lineWidth = 1;
        ctx.strokeRect(66, 54, 24, 20);

        // Well masonry block lines
        ctx.strokeStyle = 'rgba(30, 24, 18, 0.45)';
        ctx.beginPath();
        ctx.moveTo(66, 60); ctx.lineTo(90, 60);
        ctx.moveTo(66, 67); ctx.lineTo(90, 67);
        ctx.moveTo(74, 54); ctx.lineTo(74, 60);
        ctx.moveTo(82, 60); ctx.lineTo(82, 67);
        ctx.moveTo(76, 67); ctx.lineTo(76, 74);
        ctx.stroke();

        // Upper stone curb rim ellipse
        ctx.fillStyle = '#b8ada0';
        ctx.beginPath();
        ctx.ellipse(78, 54, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#382f25';
        ctx.stroke();

        // 3. Deep Crystal Water Reservoir
        const waterG = ctx.createRadialGradient(77, 53, 1, 78, 54, 10);
        waterG.addColorStop(0, '#e0f2fe'); // Sunlight reflection
        waterG.addColorStop(0.25, '#38bdf8'); // Clear turquoise
        waterG.addColorStop(0.65, '#0284c7'); // Deep spring blue
        waterG.addColorStop(1, '#082f49'); // Abyssal well depths
        ctx.fillStyle = waterG;
        ctx.beginPath();
        ctx.ellipse(78, 54, 9, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glistening surface ripples
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(77, 53, 3, 0, Math.PI * 1.5);
        ctx.stroke();

        // 4. Timber Well Gallows, Windlass Spindle & Canopy
        // Upright cedar timber posts
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(66, 32, 3, 26);
        ctx.fillRect(87, 32, 3, 26);
        ctx.fillStyle = '#85532f';
        ctx.fillRect(66, 32, 1, 26);
        ctx.fillRect(87, 32, 1, 26);

        // Overhead timber crossbeam
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(64, 32, 28, 3.5);

        // Protective wooden canopy hood
        ctx.fillStyle = '#3d2515';
        ctx.beginPath();
        ctx.moveTo(63, 32); ctx.lineTo(78, 24); ctx.lineTo(93, 32);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1f130a';
        ctx.stroke();
        // Canopy peak trim
        ctx.fillStyle = cTrim;
        ctx.fillRect(76.5, 22.5, 3, 3);

        // Winch axle spindle with wound hemp rope
        ctx.fillStyle = '#3d2617';
        ctx.fillRect(69, 38, 18, 3.5);
        ctx.fillStyle = '#e2ceb5'; // Rope coils
        for (let rx = 72; rx <= 82; rx += 2) {
          ctx.fillRect(rx, 37.5, 1.5, 4.5);
        }
        // Crank handle
        ctx.fillStyle = '#78350f';
        ctx.fillRect(89, 39, 4, 1.5);
        ctx.fillRect(92, 37, 1.5, 5);

        // Hanging well rope & bucket brimming with water
        ctx.strokeStyle = '#e2ceb5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(77, 41);
        ctx.lineTo(77, 48);
        ctx.stroke();

        // Bronze / Cedar bucket
        ctx.fillStyle = '#78350f';
        ctx.fillRect(74, 48, 6, 6);
        ctx.fillStyle = '#38bdf8'; // Water inside bucket
        ctx.fillRect(75, 48, 4, 1.5);
        ctx.fillStyle = '#fbbf24'; // Bronze bucket bands
        ctx.fillRect(74, 50, 6, 1);
        ctx.fillRect(74, 53, 6, 1);

        // 5. Hewn Stone Water Trough / Animal Basin (Front of well)
        const troughG = ctx.createLinearGradient(63, 76, 89, 88);
        troughG.addColorStop(0, '#948779');
        troughG.addColorStop(1, '#423930');
        ctx.fillStyle = troughG;
        ctx.fillRect(63, 76, 26, 11);
        ctx.strokeStyle = '#211c17';
        ctx.strokeRect(63, 76, 26, 11);

        // Filled trough water
        const tWaterG = ctx.createLinearGradient(65, 78, 87, 85);
        tWaterG.addColorStop(0, '#38bdf8');
        tWaterG.addColorStop(1, '#0284c7');
        ctx.fillStyle = tWaterG;
        ctx.fillRect(65, 78, 22, 7);
        // Water surface glints & droplets
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(67, 79, 3, 1);
        ctx.fillRect(76, 80, 2, 1);
        // Droplet dripping from bucket into trough
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(76.5, 71, 1.5, 2.5);
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
      // Authentic Bronze Age Pack Donkey & Mining Caravan
      const isHarvesting = u.state === 'HARVESTING';
      const minePhase = (u.harvestAnimationTimer || 0) * 8;

      // Pack Donkey Body (Arid dun/tan coat)
      ctx.fillStyle = '#83654b';
      ctx.fillRect(-12, -7 + bob * 0.4, 24, 13); // Torso

      // Donkey Head & Long Ears
      const headBob = isHarvesting ? Math.sin(minePhase) * 3 : bob * 0.6;
      ctx.fillStyle = '#83654b';
      ctx.fillRect(8, -13 + headBob, 8, 9); // Head
      ctx.fillStyle = '#bfa58d';
      ctx.fillRect(13, -11 + headBob, 5, 6); // Muzzle / snout
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(11, -12 + headBob, 2, 2); // Eye
      // Long donkey ears
      ctx.fillStyle = '#654b35';
      ctx.fillRect(7, -19 + headBob, 3, 7);
      ctx.fillRect(10, -18 + headBob, 3, 6);

      // Tail with tuft
      ctx.strokeStyle = '#654b35';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-12, -4 + bob * 0.4);
      ctx.lineTo(-17, 2 + (isHarvesting ? Math.sin(minePhase * 1.5) * 3 : 0));
      ctx.stroke();

      // Legs & Hooves
      ctx.fillStyle = '#5a3f29';
      const legStep = isMoving ? Math.sin(animPhase) * 4 : 0;
      ctx.fillRect(-9 + legStep * 0.5, 6, 3, 8);
      ctx.fillRect(-3 - legStep * 0.5, 6, 3, 8);
      ctx.fillRect(3 + legStep * 0.5, 6, 3, 8);
      ctx.fillRect(9 - legStep * 0.5, 6, 3, 8);
      // Black hooves
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-9 + legStep * 0.5, 12, 3, 2);
      ctx.fillRect(-3 - legStep * 0.5, 12, 3, 2);
      ctx.fillRect(3 + legStep * 0.5, 12, 3, 2);
      ctx.fillRect(9 - legStep * 0.5, 12, 3, 2);

      // Woven Wicker Panniers / Saddles (Pack baskets on flanks)
      ctx.fillStyle = '#9a6b38';
      ctx.fillRect(-10, -6 + bob * 0.4, 18, 10);
      ctx.strokeStyle = '#583c1d';
      ctx.lineWidth = 1;
      ctx.strokeRect(-10, -6 + bob * 0.4, 18, 10);

      // LIVE ORE HEAP IN BASKET
      if (u.currentCargoAmount > 0) {
        const maxCargo = u.def.cargoCapacity || 120;
        const fillRatio = Math.min(1.0, u.currentCargoAmount / maxCargo);
        const heapH = Math.ceil(fillRatio * 7);

        // Mineral ore color scheme
        const isTin = u.currentCargoType === 'tin';
        const isIron = u.currentCargoType === 'iron';
        const oreMain = isTin ? '#93c5fd' : (isIron ? '#475569' : '#f59e0b');
        const oreLight = isTin ? '#e0f2fe' : (isIron ? '#94a3b8' : '#fde68a');

        ctx.fillStyle = oreMain;
        ctx.fillRect(-9, -6 - heapH + bob * 0.4, 16, heapH);
        // Gleam highlights on raw ore chunks
        ctx.fillStyle = oreLight;
        ctx.fillRect(-7, -5 - heapH + bob * 0.4, 4, 2);
        ctx.fillRect(1, -4 - heapH + bob * 0.4, 4, 2);
      }

      // MINING ANIMATION: Miner with swinging pickaxe & dust/sparks
      if (isHarvesting) {
        const swing = Math.sin(minePhase);
        const pickAngle = -Math.PI / 4 + swing * 0.8;

        ctx.save();
        ctx.translate(-18, 0);
        // Little miner silhouette
        ctx.fillStyle = cMain;
        ctx.fillRect(-3, -4, 6, 8); // Tunic
        ctx.fillStyle = '#bfa58d';
        ctx.fillRect(-2, -9, 4, 4); // Head
        // Swinging wooden haft & bronze pick
        ctx.rotate(pickAngle);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-1, -12, 2, 14); // Shaft
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-5, -13, 10, 3); // Pickaxe head
        ctx.restore();

        // Chipping sparks & dust puffs at impact point
        if (swing > 0.6) {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-22 + Math.random() * 6, 6 + Math.random() * 4, 2, 2);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(-24 + Math.random() * 8, 4 + Math.random() * 5, 2, 2);
        }
      }
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
