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

      // 1. Megaron / Royal Acropolis Palace of the Wanax (4x4 tiles = 192x192)
      this.buildingSprites.set(`acropolis_${owner}`, this.makeBuildingSprite(192, (ctx) => {
        // --- A. Cyclopean Citadel Terrace & Grand Staircase Base ---
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(8, 20, 176, 164);

        // Polygonal megalithic foundation platform
        const platG = ctx.createLinearGradient(8, 24, 184, 180);
        platG.addColorStop(0, '#d1c7bc');
        platG.addColorStop(0.5, '#9e9182');
        platG.addColorStop(1, '#574d42');
        ctx.fillStyle = platG;
        ctx.fillRect(10, 26, 172, 158);
        ctx.strokeStyle = '#382f25';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 26, 172, 158);

        // Massive ashlar stone courses across the plinth
        ctx.strokeStyle = 'rgba(40, 32, 24, 0.45)';
        ctx.lineWidth = 1;
        for (let sy = 40; sy <= 180; sy += 18) {
          ctx.beginPath(); ctx.moveTo(10, sy); ctx.lineTo(182, sy); ctx.stroke();
        }

        // Monumental central staircase (stepped marble slabs)
        for (let st = 0; st < 6; st++) {
          const sw = 76 + st * 8;
          const sx = 96 - sw / 2;
          const sy = 148 + st * 5;
          const stG = ctx.createLinearGradient(sx, sy, sx + sw, sy + 5);
          stG.addColorStop(0, '#e5ded5');
          stG.addColorStop(0.5, '#f5f0e8');
          stG.addColorStop(1, '#b3a798');
          ctx.fillStyle = stG;
          ctx.fillRect(sx, sy, sw, 5);
          ctx.strokeStyle = '#473c30';
          ctx.strokeRect(sx, sy, sw, 5);
        }

        // Bronze sacrificial brazier urns on stone pedestals flanking the stairs
        for (const bx of [44, 148]) {
          // Stone pedestal
          ctx.fillStyle = '#6b5f52';
          ctx.fillRect(bx - 5, 142, 10, 22);
          ctx.strokeStyle = '#29221b';
          ctx.strokeRect(bx - 5, 142, 10, 22);
          // Bronze cauldron / urn
          ctx.fillStyle = '#b45309';
          ctx.beginPath(); ctx.arc(bx, 140, 7, 0, Math.PI); ctx.fill();
          // Glowing royal embers
          ctx.fillStyle = '#f97316';
          ctx.beginPath(); ctx.arc(bx, 137, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(bx - 2, 135, 4, 3);
        }

        // --- B. Central Megaron Great Hall & Royal Propylon ---
        // Main Palace Walls
        const wallG = ctx.createLinearGradient(20, 40, 172, 140);
        wallG.addColorStop(0, '#e8e0d5');
        wallG.addColorStop(0.6, '#cfc2b2');
        wallG.addColorStop(1, '#948574');
        ctx.fillStyle = wallG;
        ctx.fillRect(20, 42, 152, 106);

        // Aegean Lapis Lazuli & Gold Painted Frieze (Running rosettes and spirals)
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(20, 74, 152, 9);
        ctx.fillStyle = cTrim;
        ctx.fillRect(20, 72, 152, 2);
        ctx.fillRect(20, 83, 152, 2);
        for (let fx = 24; fx < 170; fx += 10) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath(); ctx.arc(fx, 78.5, 2.5, 0, Math.PI * 2); ctx.fill();
        }

        // Megaron Terracotta / Cedar Shake Pitched Roof
        this.drawRoofTiles(ctx, 16, 18, 160, 56, cMain, cHi);

        // Triangular Pediment with Royal Relief Medallion
        ctx.fillStyle = '#f0ebe3';
        ctx.beginPath();
        ctx.moveTo(16, 74); ctx.lineTo(96, 28); ctx.lineTo(176, 74);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#635647';
        ctx.lineWidth = 2;
        ctx.stroke();

        // High relief golden Wanax disc / solar medallion
        ctx.fillStyle = cTrim;
        ctx.beginPath(); ctx.arc(96, 56, 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = cMain;
        ctx.beginPath(); ctx.arc(96, 56, 7, 0, Math.PI * 2); ctx.fill();

        // Rooftop Hearth Lantern & Holy Smoke Flue
        ctx.fillStyle = '#5c4e40';
        ctx.fillRect(86, 12, 20, 18);
        ctx.strokeStyle = '#2b231b';
        ctx.strokeRect(86, 12, 20, 18);
        // Rising incense smoke puffs
        ctx.fillStyle = 'rgba(241, 245, 249, 0.45)';
        ctx.beginPath(); ctx.arc(94, 6, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(98, -1, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(92, -8, 10, 0, Math.PI * 2); ctx.fill();

        // --- C. Minoan / Mycenaean Inverted Cedar Colonnade ---
        // Authentic Bronze Age downward-tapering red pillars with black bases & gilded ring capitals
        const cols = [32, 54, 76, 116, 138, 160];
        for (const cx of cols) {
          // Black stone stylobate base
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(cx - 6, 142, 12, 6);
          // Inverted tapering pillar (wider at top, narrower at bottom)
          ctx.fillStyle = '#991b1b';
          ctx.beginPath();
          ctx.moveTo(cx - 5.5, 84);
          ctx.lineTo(cx + 5.5, 84);
          ctx.lineTo(cx + 4, 142);
          ctx.lineTo(cx - 4, 142);
          ctx.closePath();
          ctx.fill();
          // Highlight specular line down pillar
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(cx - 1.5, 84, 2.5, 58);
          // Cushion echinus capital with gold ring
          ctx.fillStyle = cTrim;
          ctx.fillRect(cx - 7, 82, 14, 4);
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(cx - 8, 78, 16, 4);
        }

        // --- D. Palace Grand Entrance (Lion / Bull Corbel Portal) ---
        ctx.fillStyle = '#140f0b';
        ctx.fillRect(80, 88, 32, 60);
        // Double studded bronze palace doors
        ctx.fillStyle = '#3b2514';
        ctx.fillRect(82, 90, 13, 58);
        ctx.fillRect(97, 90, 13, 58);
        // Heavy bronze boss rivets & royal lion ring handles
        ctx.fillStyle = '#fbbf24';
        for (let ry = 96; ry <= 140; ry += 11) {
          ctx.fillRect(84, ry, 2.5, 2.5);
          ctx.fillRect(92, ry, 2.5, 2.5);
          ctx.fillRect(99, ry, 2.5, 2.5);
          ctx.fillRect(107, ry, 2.5, 2.5);
        }
        ctx.beginPath(); ctx.arc(93, 118, 3.5, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(99, 118, 3.5, 0, Math.PI * 2); ctx.stroke();

        // --- E. Royal Banners & Cuneiform Tablet Archive Windows ---
        // Left Archive Window (showing rows of clay tablets)
        ctx.fillStyle = '#1f1812';
        ctx.fillRect(36, 96, 16, 22);
        ctx.fillStyle = '#d97706'; // Terracotta cuneiform tablets on cedar shelves
        ctx.fillRect(38, 102, 12, 3);
        ctx.fillRect(38, 108, 12, 3);
        ctx.fillRect(38, 114, 12, 3);

        // Right Treasury Window (displaying gilded bronze armor & shields)
        ctx.fillStyle = '#1f1812';
        ctx.fillRect(140, 96, 16, 22);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(148, 107, 6, 0, Math.PI * 2); ctx.fill();

        // Tall Ceremonial Royal Gonfalons (Left & Right Facade)
        for (const [fx, fy] of [[24, 60], [168, 60]]) {
          ctx.fillStyle = '#451a03';
          ctx.fillRect(fx - 1, fy - 22, 2.5, 50); // Tall cedar flagpole
          // Gold spearhead finial
          ctx.fillStyle = cTrim;
          ctx.beginPath();
          ctx.moveTo(fx, fy - 26); ctx.lineTo(fx + 3, fy - 22); ctx.lineTo(fx - 3, fy - 22);
          ctx.closePath();
          ctx.fill();
          // Hanging ceremonial banner
          ctx.fillStyle = cMain;
          ctx.fillRect(fx + 2, fy - 18, 10, 28);
          ctx.fillStyle = cTrim;
          ctx.fillRect(fx + 2, fy + 10, 10, 3); // Fringe
          ctx.beginPath(); ctx.arc(fx + 7, fy - 5, 2.5, 0, Math.PI * 2); ctx.fill();
        }
      }));

      // 2. Bronze Foundry & Refinery (3x3 tiles = 144x144)
      this.buildingSprites.set(`bronze_foundry_${owner}`, this.makeBuildingSprite(144, (ctx) => {
        // --- A. Ash-Covered Industrial Smelting Yard & Cobblestone Apron ---
        ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
        ctx.fillRect(6, 14, 132, 124);

        // Scorched stone floor with ash and soot stains
        const floorG = ctx.createLinearGradient(6, 18, 138, 138);
        floorG.addColorStop(0, '#574e44');
        floorG.addColorStop(0.5, '#3b3229');
        floorG.addColorStop(1, '#1c1611');
        ctx.fillStyle = floorG;
        ctx.fillRect(8, 20, 128, 118);
        ctx.strokeStyle = '#211a13';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(8, 20, 128, 118);

        // --- B. The Great Double Smelting Kiln (Center-Back) ---
        // Conical Cyclopean Stone Blast Furnace
        const kilnG = ctx.createLinearGradient(44, 20, 100, 84);
        kilnG.addColorStop(0, '#8f7e6b');
        kilnG.addColorStop(0.4, '#5c4e3f');
        kilnG.addColorStop(0.8, '#2e251d');
        kilnG.addColorStop(1, '#140f0a');
        ctx.fillStyle = kilnG;
        ctx.beginPath();
        ctx.moveTo(56, 26);
        ctx.lineTo(88, 26);
        ctx.lineTo(102, 84);
        ctx.lineTo(42, 84);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1a130d';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Twin Industrial Clay Blast Chimneys (Billowing smoke & incandescent embers)
        for (const chx of [58, 76]) {
          ctx.fillStyle = '#42372d';
          ctx.fillRect(chx, 10, 10, 18);
          ctx.strokeStyle = '#1c1610';
          ctx.strokeRect(chx, 10, 10, 18);
          // Dark chimney opening
          ctx.fillStyle = '#0a0806';
          ctx.fillRect(chx + 1.5, 9, 7, 3);
          // Golden sparks & heat haze
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(chx + 2, 4, 2, 2);
          ctx.fillRect(chx + 6, 2, 2.5, 2.5);
          ctx.fillRect(chx + 3, -3, 3, 3);
          // Smoke clouds
          ctx.fillStyle = 'rgba(75, 85, 99, 0.4)';
          ctx.beginPath(); ctx.arc(chx + 5, 0, 6, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(chx + 10, -6, 8, 0, Math.PI * 2); ctx.fill();
        }

        // Tuyere Nozzles & Twin Goatskin Bellows on Timber Platform
        for (const [bx, by] of [[28, 62], [104, 62]]) {
          // Bellows wooden platform
          ctx.fillStyle = '#452b17';
          ctx.fillRect(bx - 8, by + 4, 18, 14);
          // Leather bellows bladder
          ctx.fillStyle = '#92400e';
          ctx.beginPath(); ctx.ellipse(bx + 1, by + 10, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
          // Operating lever
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(bx - 5, by + 4); ctx.lineTo(bx + 6, by + 14); ctx.stroke();
          // Clay tuyere pipe entering the furnace
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(bx > 50 ? bx - 10 : bx + 8, by + 8, 10, 3.5);
        }

        // Furnace Arched Hearth Mouth (Blazing White-Hot Liquid Core)
        ctx.fillStyle = '#1a0d05';
        ctx.fillRect(60, 66, 24, 18);
        const hearthG = ctx.createRadialGradient(72, 75, 2, 72, 75, 12);
        hearthG.addColorStop(0, '#ffffff'); // White-hot core
        hearthG.addColorStop(0.3, '#fde047'); // Yellow flame
        hearthG.addColorStop(0.7, '#f97316'); // Fiery orange
        hearthG.addColorStop(1, '#991b1b'); // Deep molten red
        ctx.fillStyle = hearthG;
        ctx.fillRect(62, 68, 20, 16);

        // --- C. Molten Casting Run & Oxhide Ingot Molds (Front-Left) ---
        // Incandescent molten bronze stream running into molds
        const streamG = ctx.createLinearGradient(72, 84, 52, 116);
        streamG.addColorStop(0, '#fef08a');
        streamG.addColorStop(0.5, '#f59e0b');
        streamG.addColorStop(1, '#b45309');
        ctx.fillStyle = streamG;
        ctx.fillRect(68, 84, 8, 14);
        ctx.fillRect(48, 94, 28, 6);

        // Sand casting pit with molten "Oxhide Ingots" (4-handled iconic Bronze Age shape)
        ctx.fillStyle = '#785b3a';
        ctx.fillRect(16, 92, 46, 38);
        ctx.strokeStyle = '#382512';
        ctx.strokeRect(16, 92, 46, 38);

        // Active glowing ingot in mold
        ctx.fillStyle = '#f97316';
        ctx.fillRect(22, 98, 14, 10);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(24, 100, 10, 6);

        // Stacked finished Oxhide Bronze Ingots on cedar pallet
        ctx.fillStyle = '#452a16';
        ctx.fillRect(18, 114, 26, 4); // Pallet
        for (const [ix, iy] of [[20, 110], [30, 110], [25, 105]]) {
          // Authentic oxhide shape with flared ear handles
          ctx.fillStyle = '#d97706';
          ctx.fillRect(ix, iy, 10, 5);
          ctx.fillStyle = '#fbbf24'; // Metallic highlight edge
          ctx.fillRect(ix + 1, iy, 8, 1.5);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(ix - 1, iy - 1, 2, 2);
          ctx.fillRect(ix + 9, iy - 1, 2, 2);
          ctx.fillRect(ix - 1, iy + 4, 2, 2);
          ctx.fillRect(ix + 9, iy + 4, 2, 2);
        }

        // --- D. Raw Ore Hoppers & Timber Derrick Crane (Rear-Right) ---
        // Sloped wooden ore hopper
        ctx.fillStyle = '#3d2514';
        ctx.fillRect(96, 40, 36, 46);
        ctx.strokeStyle = '#1f1107';
        ctx.strokeRect(96, 40, 36, 46);

        // Raw Green Malachite (Copper Ore) and Silver-Black Cassiterite (Tin Ore)
        ctx.fillStyle = '#059669'; // Malachite green
        ctx.fillRect(100, 48, 14, 16);
        ctx.fillStyle = '#34d399';
        ctx.fillRect(102, 50, 4, 4);
        ctx.fillRect(108, 54, 4, 4);

        ctx.fillStyle = '#334155'; // Cassiterite tin ore
        ctx.fillRect(116, 48, 12, 16);
        ctx.fillStyle = '#94a3b8'; // Silver glint on tin
        ctx.fillRect(118, 50, 3, 3);
        ctx.fillRect(122, 55, 3, 3);

        // Sturdy Timber Derrick Crane with Pulley
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(94, 16, 5, 76); // Vertical mast
        ctx.fillRect(80, 16, 46, 5); // Horizontal boom
        ctx.strokeStyle = '#3b2210';
        ctx.strokeRect(94, 16, 5, 76);
        ctx.strokeRect(80, 16, 46, 5);

        // Crane pulley wheel & haul cable
        ctx.fillStyle = '#1c1917';
        ctx.beginPath(); ctx.arc(84, 26, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d4b996';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(84, 26); ctx.lineTo(84, 48); ctx.stroke();
        // Heavy ore basket suspended on cable
        ctx.fillStyle = '#78350f';
        ctx.fillRect(80, 48, 8, 8);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(81, 48, 6, 2);

        // --- E. Blacksmith Anvil & Quenching Water Trough (Front-Right) ---
        // Tree stump anvil base
        ctx.fillStyle = '#4a2f19';
        ctx.fillRect(96, 102, 12, 14);
        // Heavy Bronze Anvil
        ctx.fillStyle = '#92400e';
        ctx.fillRect(94, 96, 16, 7);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(94, 96, 16, 1.5);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(90, 97, 4, 4); // Horn

        // Stone Water Quenching Trough (with rising steam)
        ctx.fillStyle = '#52473d';
        ctx.fillRect(114, 98, 20, 20);
        ctx.strokeStyle = '#29221b';
        ctx.strokeRect(114, 98, 20, 20);
        // Quench water pool
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(116, 101, 16, 14);
        // Rising steam wisps
        ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
        ctx.beginPath(); ctx.arc(122, 95, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(126, 91, 5, 0, Math.PI * 2); ctx.fill();
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

      // 4. Militia Barracks & Weaponsmith Forge (3x3 tiles = 144x144)
      this.buildingSprites.set(`barracks_${owner}`, this.makeBuildingSprite(144, (ctx) => {
        // --- A. Compacted Dirt Drill Ground & Flagstone Base ---
        ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
        ctx.fillRect(6, 16, 132, 122);

        // Compacted earthen drill courtyard
        const yardG = ctx.createLinearGradient(6, 18, 138, 138);
        yardG.addColorStop(0, '#8c6b45');
        yardG.addColorStop(0.5, '#694e30');
        yardG.addColorStop(1, '#47331d');
        ctx.fillStyle = yardG;
        ctx.fillRect(8, 20, 128, 116);
        ctx.strokeStyle = '#2d1f11';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(8, 20, 128, 116);

        // Flagstone perimeter pathways
        ctx.fillStyle = '#948777';
        for (let fx = 12; fx < 132; fx += 14) {
          ctx.fillRect(fx, 124, 12, 10);
          ctx.strokeStyle = '#4a4136';
          ctx.strokeRect(fx, 124, 12, 10);
        }

        // --- B. Garrison Barracks & Bunk Quarters (Rear-Left: x: 8..92, y: 16..78) ---
        const bldgG = ctx.createLinearGradient(8, 26, 92, 78);
        bldgG.addColorStop(0, '#d1c4b4');
        bldgG.addColorStop(0.5, '#aba092');
        bldgG.addColorStop(1, '#706659');
        ctx.fillStyle = bldgG;
        ctx.fillRect(10, 30, 82, 48);
        ctx.strokeStyle = '#383027';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(10, 30, 82, 48);

        // Slanted Terracotta Cedar Roof over Quarters
        this.drawRoofTiles(ctx, 8, 14, 86, 26, cMain, cHi);
        // Cedar fascia board & faction trim
        ctx.fillStyle = cTrim;
        ctx.fillRect(8, 38, 86, 3);

        // Pillared Open Portico / Veranda
        ctx.fillStyle = '#261f18';
        ctx.fillRect(14, 42, 74, 34); // Shaded portico recess
        for (const px of [14, 38, 62, 84]) {
          ctx.fillStyle = '#5c3a21';
          ctx.fillRect(px, 42, 5, 34); // Cedar square posts
          ctx.fillStyle = '#85532f';
          ctx.fillRect(px, 42, 1.5, 34);
        }

        // Double Barracks Doorway
        ctx.fillStyle = '#140d08';
        ctx.fillRect(45, 46, 15, 30);
        ctx.fillStyle = '#3d2515';
        ctx.fillRect(46, 48, 13, 28);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(48, 60, 2.5, 2.5); // Bronze ring handle

        // --- C. Weapon Racks: Tower Shields & Bronze-Tipped Spears ---
        // Armory Rack 1 (Left bay: x: 20..36)
        ctx.fillStyle = '#452a16';
        ctx.fillRect(20, 68, 17, 3); // Horizontal rack rail
        // 2 Massive Figure-Eight & Tower Shields (Oxhide on wicker with bronze boss)
        const shields: Array<{ sx: number; sy: number; isEight: boolean }> = [
          { sx: 21, sy: 52, isEight: true },
          { sx: 29, sy: 50, isEight: false }
        ];
        for (const { sx, sy, isEight } of shields) {
          ctx.fillStyle = '#78350f';
          if (isEight) {
            // Figure-eight shield
            ctx.beginPath();
            ctx.arc(sx + 3.5, sy + 4, 4, 0, Math.PI * 2);
            ctx.arc(sx + 3.5, sy + 13, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath(); ctx.arc(sx + 3.5, sy + 8.5, 2, 0, Math.PI * 2); ctx.fill();
          } else {
            // Arched Tower shield
            ctx.fillRect(sx, sy, 7, 18);
            ctx.strokeStyle = '#fbbf24';
            ctx.strokeRect(sx, sy, 7, 18);
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath(); ctx.arc(sx + 3.5, sy + 9, 2.5, 0, Math.PI * 2); ctx.fill();
          }
        }

        // Armory Rack 2 (Right bay: x: 68..82) - Upright Spear Rack
        ctx.fillStyle = '#452a16';
        ctx.fillRect(68, 68, 15, 3);
        for (let spx = 70; spx <= 80; spx += 3) {
          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(spx, 70); ctx.lineTo(spx, 46); ctx.stroke();
          // Shining Bronze Spearpoint
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(spx, 42); ctx.lineTo(spx + 1.5, 46); ctx.lineTo(spx - 1.5, 46);
          ctx.closePath();
          ctx.fill();
        }

        // --- D. Weaponsmith Forge & Armor Workshop (Right Wing: x: 92..136, y: 22..82) ---
        // Stone Forge Hearth Block
        const forgeG = ctx.createLinearGradient(92, 34, 136, 80);
        forgeG.addColorStop(0, '#756859');
        forgeG.addColorStop(1, '#332a22');
        ctx.fillStyle = forgeG;
        ctx.fillRect(94, 38, 40, 42);
        ctx.strokeStyle = '#1f1914';
        ctx.strokeRect(94, 38, 40, 42);

        // Forge Chimney (billowing smoke)
        ctx.fillStyle = '#4a3f34';
        ctx.fillRect(118, 18, 12, 22);
        ctx.fillStyle = '#0f0c09';
        ctx.fillRect(119.5, 17, 9, 3);
        ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
        ctx.beginPath(); ctx.arc(124, 10, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(128, 4, 8, 0, Math.PI * 2); ctx.fill();

        // Glowing Charcoal Firebox
        ctx.fillStyle = '#170c06';
        ctx.fillRect(100, 52, 22, 16);
        const fireG = ctx.createRadialGradient(111, 60, 2, 111, 60, 10);
        fireG.addColorStop(0, '#ffffff');
        fireG.addColorStop(0.3, '#fde047');
        fireG.addColorStop(0.7, '#f97316');
        fireG.addColorStop(1, '#b91c1c');
        ctx.fillStyle = fireG;
        ctx.fillRect(101, 54, 20, 14);

        // Heavy Bronze Anvil on cedar stump
        ctx.fillStyle = '#452a16';
        ctx.fillRect(106, 92, 14, 14);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(104, 86, 18, 7);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(104, 86, 18, 1.5);
        // Red-hot spearhead on anvil
        ctx.fillStyle = '#f97316';
        ctx.fillRect(110, 84, 8, 2.5);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(112, 84, 4, 2.5);

        // Water Quenching Barrel
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(123, 88, 12, 16);
        ctx.strokeStyle = '#1c1917';
        ctx.strokeRect(123, 88, 12, 16);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(124, 89, 10, 3);
        ctx.fillStyle = '#fbbf24'; // Bronze barrel hoops
        ctx.fillRect(123, 93, 12, 1.5);
        ctx.fillRect(123, 100, 12, 1.5);

        // --- E. Military Drill Ground & Archery / Slinger Targets (Front-Left: x: 14..56, y: 84..122) ---
        // Archery Straw Target on Tripod
        ctx.strokeStyle = '#5c3a21';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(22, 112); ctx.lineTo(26, 92); ctx.lineTo(30, 112); ctx.stroke();
        // Round straw target with bullseye
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath(); ctx.arc(26, 94, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.stroke();
        ctx.fillStyle = '#dc2626'; // Red bullseye
        ctx.beginPath(); ctx.arc(26, 94, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(26, 94, 2, 0, Math.PI * 2); ctx.fill();
        // Embedded practice arrows
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(26, 94); ctx.lineTo(33, 90); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(28, 97); ctx.lineTo(35, 99); ctx.stroke();

        // Slinger Training Post (Wooden practice quintain with hung shield)
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(44, 90, 4, 22);
        ctx.fillStyle = '#b45309';
        ctx.beginPath(); ctx.arc(46, 96, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.beginPath(); ctx.arc(46, 96, 2, 0, Math.PI * 2); ctx.fill();

        // Faction War Banner on Barracks Peak
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(50, 4, 2.5, 12);
        ctx.fillStyle = cMain;
        ctx.beginPath();
        ctx.moveTo(52.5, 4); ctx.lineTo(66, 8); ctx.lineTo(52.5, 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = cTrim;
        ctx.fillRect(52.5, 6, 3, 4);
      }));

      // 5. Cyclopean Watchtower & Lookout Bastion (2x2 tiles = 96x96)
      this.buildingSprites.set(`watchtower_${owner}`, this.makeBuildingSprite(96, (ctx) => {
        // --- A. Drop Shadow & Megalithic Foundation Apron ---
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(16, 22, 64, 70);

        // Circular stone footing apron
        const footG = ctx.createLinearGradient(18, 70, 78, 92);
        footG.addColorStop(0, '#9e9182');
        footG.addColorStop(0.5, '#6e6355');
        footG.addColorStop(1, '#3b3329');
        ctx.fillStyle = footG;
        ctx.beginPath();
        ctx.ellipse(48, 80, 28, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#261f18';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // --- B. Tapering Polygonal Cyclopean Tower Shaft ---
        // Tower masonry gradient (sunlight from top-left, deep shadow on right)
        const shaftG = ctx.createLinearGradient(26, 28, 70, 80);
        shaftG.addColorStop(0, '#e3ded8');
        shaftG.addColorStop(0.25, '#b8aca0');
        shaftG.addColorStop(0.7, '#6b6053');
        shaftG.addColorStop(1, '#362f27');
        ctx.fillStyle = shaftG;

        ctx.beginPath();
        ctx.moveTo(31, 26); // Top left
        ctx.lineTo(65, 26); // Top right
        ctx.lineTo(72, 80); // Bottom right (tapered base)
        ctx.lineTo(24, 80); // Bottom left
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#261f18';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Interlocking Cyclopean Polygonal Stone Courses
        ctx.strokeStyle = 'rgba(35, 28, 22, 0.45)';
        ctx.lineWidth = 1;
        // Horizontal courses
        for (let ly = 36; ly <= 76; ly += 9) {
          const ratio = (ly - 26) / 54;
          const leftX = 31 - ratio * 7;
          const rightX = 65 + ratio * 7;
          ctx.beginPath(); ctx.moveTo(leftX, ly); ctx.lineTo(rightX, ly); ctx.stroke();
        }
        // Vertical polygonal stone joints
        const joints = [
          [38, 26, 36], [54, 26, 36],
          [32, 36, 45], [48, 36, 45], [62, 36, 45],
          [36, 45, 54], [52, 45, 54], [66, 45, 54],
          [30, 54, 63], [46, 54, 63], [60, 54, 63],
          [35, 63, 72], [54, 63, 72], [68, 63, 72]
        ];
        for (const [jx, jy1, jy2] of joints) {
          ctx.beginPath(); ctx.moveTo(jx, jy1); ctx.lineTo(jx, jy2); ctx.stroke();
        }

        // Defensive Arrow Loop Embrasures (Narrow slit windows)
        for (const [ey, ex] of [[38, 48], [52, 48], [66, 48]]) {
          ctx.fillStyle = '#0f0c08';
          ctx.fillRect(ex - 2, ey, 4, 8);
          // Glistening bronze arrow tip peering out
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(ex - 0.5, ey + 2, 1, 3);
        }

        // Heavy Reinforced Ground Door (Bronze-studded cedar with stone arch)
        ctx.fillStyle = '#1c150e';
        ctx.fillRect(42, 67, 12, 14);
        ctx.fillStyle = '#452a16';
        ctx.fillRect(43, 68, 10, 13);
        ctx.fillStyle = '#fbbf24'; // Bronze boss studs
        ctx.fillRect(44, 71, 2, 2);
        ctx.fillRect(50, 71, 2, 2);
        ctx.fillRect(44, 77, 2, 2);
        ctx.fillRect(50, 77, 2, 2);
        // Stone Corbel Header
        ctx.fillStyle = '#7a6f62';
        ctx.fillRect(40, 65, 16, 3);

        // --- C. Overhanging Corbels & Stepped Machicolations ---
        for (let cx = 27; cx <= 67; cx += 8) {
          ctx.fillStyle = '#8f8375';
          ctx.fillRect(cx, 24, 5, 5);
          ctx.fillStyle = '#42382e';
          ctx.fillRect(cx, 26, 5, 3);
        }

        // Battlements Floor Slab
        ctx.fillStyle = '#b3a89a';
        ctx.fillRect(25, 21, 46, 4);
        ctx.strokeStyle = '#29221a';
        ctx.strokeRect(25, 21, 46, 4);

        // Crenellated Parapet (Merlons and Crenels)
        const merlons = [25, 38, 51, 64];
        for (const mx of merlons) {
          ctx.fillStyle = '#d1c7ba';
          ctx.fillRect(mx, 13, 7, 9);
          ctx.strokeStyle = '#382f25';
          ctx.lineWidth = 1;
          ctx.strokeRect(mx, 13, 7, 9);
        }

        // --- D. Lookout Sentry & Signal Beacon Brazier ---
        // Sentry archer standing at battlements
        ctx.fillStyle = cMain; // Tunic
        ctx.fillRect(45, 12, 6, 8);
        ctx.fillStyle = '#cbd5e1'; // Bronze cap
        ctx.beginPath(); ctx.arc(48, 10, 3, 0, Math.PI * 2); ctx.fill();
        // Sentry spear & shield
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(52, 6); ctx.lineTo(52, 20); ctx.stroke();
        ctx.fillStyle = cTrim;
        ctx.beginPath(); ctx.arc(44, 16, 3.5, 0, Math.PI * 2); ctx.fill();

        // Signal Alarm Beacon Brazier (Iron basket on pole)
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(28, 4, 2, 12);
        ctx.fillRect(25, 3, 8, 3);
        // Blazing signal fire & pitch smoke
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.arc(29, 2, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(28, 0, 2, 3);
        // Smoke plume alerting the citadel
        ctx.fillStyle = 'rgba(75, 85, 99, 0.4)';
        ctx.beginPath(); ctx.arc(28, -4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(25, -9, 5, 0, Math.PI * 2); ctx.fill();

        // Cedar Lookout Canopy Hood in Faction Colors
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(36, 6, 2, 14);
        ctx.fillRect(58, 6, 2, 14);
        // Canopy Roof
        this.drawRoofTiles(ctx, 33, 2, 30, 8, cMain, cHi);
        ctx.fillStyle = cTrim;
        ctx.fillRect(47, -1, 2, 3); // Roof peak finial
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

    // Ground cast shadow ellipse (scaled to match enlarged unit size)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 14, u.def.category === 'chariot' ? 24 : 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    // Proportionally enlarge units (~25% larger) for clear SVGA tactical readability
    ctx.scale(1.25, 1.25);

    if (u.def.category === 'worker') {
      // --- AUTHENTIC BRONZE AGE PACK DONKEY & MINING CARAVAN ---
      const isHarvesting = u.state === 'HARVESTING';
      const minePhase = (u.harvestAnimationTimer || 0) * 8;
      const headBob = isHarvesting ? Math.sin(minePhase) * 3 : bob * 0.6;
      const legStep = isMoving ? Math.sin(animPhase) * 4.5 : 0;

      // 1. Pack Donkey Body & Coat (Warm dun/tan coat with dark dorsal eel-stripe)
      ctx.fillStyle = '#83654b'; // Main dun coat
      ctx.beginPath();
      ctx.ellipse(0, -1 + bob * 0.4, 14, 8, 0, 0, Math.PI * 2); // Contoured muscular torso
      ctx.fill();

      // Creamy lighter underbelly
      ctx.fillStyle = '#b39a82';
      ctx.beginPath();
      ctx.ellipse(0, 2 + bob * 0.4, 11, 4, 0, 0, Math.PI);
      ctx.fill();

      // Dark dorsal stripe along spine (characteristic donkey trait)
      ctx.fillStyle = '#4a3525';
      ctx.fillRect(-12, -8 + bob * 0.4, 22, 1.8);

      // 2. Muscular Neck, Head & Long Expressive Ears
      // Neck
      ctx.fillStyle = '#83654b';
      ctx.beginPath();
      ctx.moveTo(7, -3 + bob * 0.4);
      ctx.lineTo(13, -11 + headBob);
      ctx.lineTo(18, -10 + headBob);
      ctx.lineTo(13, 2 + bob * 0.4);
      ctx.closePath();
      ctx.fill();

      // Dark bristly erect mane
      ctx.fillStyle = '#362215';
      for (let m = 0; m < 5; m++) {
        ctx.fillRect(8 + m * 1.5, -9 - m * 0.8 + headBob * 0.8, 1.5, 3.5);
      }

      // Donkey Head
      ctx.fillStyle = '#83654b';
      ctx.beginPath();
      ctx.ellipse(15, -11 + headBob, 6, 5, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Soft Creamy/Tan Muzzle
      ctx.fillStyle = '#d4c2b0';
      ctx.beginPath();
      ctx.ellipse(20, -9 + headBob, 4, 3.2, 0.1, 0, Math.PI * 2);
      ctx.fill();
      // Nostrils & mouth line
      ctx.fillStyle = '#26170d';
      ctx.fillRect(21, -10 + headBob, 1.5, 1.2);
      ctx.fillRect(20, -8 + headBob, 2.5, 0.8);

      // Large Expressive Eye with glint
      ctx.fillStyle = '#1c1917';
      ctx.beginPath(); ctx.arc(14, -12 + headBob, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(14.5, -13 + headBob, 0.8, 0.8); // Specular eye glint

      // Long Characteristic Donkey Ears (with pinkish/cream inner fluff)
      // Left ear
      ctx.fillStyle = '#654b35';
      ctx.beginPath();
      ctx.ellipse(11, -18 + headBob, 2.2, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d8b4a0'; // Inner pink ear
      ctx.beginPath();
      ctx.ellipse(11, -18 + headBob, 1.2, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Right ear (slightly forward)
      ctx.fillStyle = '#73543d';
      ctx.beginPath();
      ctx.ellipse(14, -18 + headBob, 2.2, 6, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e4c4b2';
      ctx.beginPath();
      ctx.ellipse(14, -18 + headBob, 1.2, 4, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // 3. Natural Swishing Tail with Tufted End
      ctx.strokeStyle = '#654b35';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-13, -3 + bob * 0.4);
      const tailWag = isHarvesting ? Math.sin(minePhase * 1.5) * 4 : (isMoving ? Math.sin(animPhase) * 3 : 1);
      ctx.quadraticCurveTo(-18, 0, -17 + tailWag, 7);
      ctx.stroke();
      // Brushy tail hair tuft
      ctx.fillStyle = '#362215';
      ctx.beginPath();
      ctx.arc(-17 + tailWag, 7, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 4. Sturdy Slender Legs, Knee Joints & Shiny Black Hooves
      ctx.fillStyle = '#5a3f29';
      // Rear left & right legs
      ctx.fillRect(-9 + legStep * 0.5, 6, 3, 9);
      ctx.fillRect(-4 - legStep * 0.5, 6, 3, 9);
      // Front left & right legs
      ctx.fillRect(4 + legStep * 0.5, 6, 3, 9);
      ctx.fillRect(9 - legStep * 0.5, 6, 3, 9);
      // Polished black hooves
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-9 + legStep * 0.5, 13, 3.2, 2.5);
      ctx.fillRect(-4 - legStep * 0.5, 13, 3.2, 2.5);
      ctx.fillRect(4 + legStep * 0.5, 13, 3.2, 2.5);
      ctx.fillRect(9 - legStep * 0.5, 13, 3.2, 2.5);

      // 5. Heavy Timber Pack Saddle & Girth Straps
      ctx.fillStyle = '#4a2810'; // Leather girth cinch
      ctx.fillRect(-2, -7 + bob * 0.4, 3, 14);
      ctx.fillRect(6, -6 + bob * 0.4, 2, 12);
      // Halter and bridle across head
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(11, -12 + headBob); ctx.lineTo(19, -8 + headBob);
      ctx.moveTo(13, -16 + headBob); ctx.lineTo(13, -7 + headBob);
      ctx.stroke();

      // Dual Woven Wicker Panniers / Pack Baskets on Flanks
      ctx.fillStyle = '#9a6b38';
      ctx.fillRect(-10, -5 + bob * 0.4, 19, 10);
      ctx.strokeStyle = '#583c1d';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-10, -5 + bob * 0.4, 19, 10);
      // Wicker crosshatch texture
      ctx.strokeStyle = '#b48148';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-6, -5 + bob * 0.4); ctx.lineTo(-6, 5 + bob * 0.4);
      ctx.moveTo(-1, -5 + bob * 0.4); ctx.lineTo(-1, 5 + bob * 0.4);
      ctx.moveTo(4, -5 + bob * 0.4); ctx.lineTo(4, 5 + bob * 0.4);
      ctx.stroke();

      // 6. LIVE ORE & RESOURCE CARGO HEAP IN PACK BASKETS
      if (u.currentCargoAmount > 0) {
        const maxCargo = u.def.cargoCapacity || 120;
        const fillRatio = Math.min(1.0, u.currentCargoAmount / maxCargo);
        const heapH = Math.ceil(fillRatio * 8);

        const isTin = u.currentCargoType === 'tin';
        const isIron = u.currentCargoType === 'iron';
        const isStone = u.currentCargoType === 'stone';
        const isTimber = u.currentCargoType === 'timber';
        const isGrain = u.currentCargoType === 'grain';

        if (isTimber) {
          // Bundles of cut cedar timber logs tied with rope
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-9, -5 - heapH + bob * 0.4, 17, heapH);
          ctx.fillStyle = '#d97706'; // Annual rings on log ends
          ctx.beginPath(); ctx.arc(-8, -4 - heapH / 2 + bob * 0.4, 2, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(7, -4 - heapH / 2 + bob * 0.4, 2, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#fde047'; // Binding ropes
          ctx.lineWidth = 1;
          ctx.strokeRect(-9, -5 - heapH + bob * 0.4, 17, heapH);
        } else if (isStone) {
          // Hewn limestone ashlar blocks
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(-9, -5 - heapH + bob * 0.4, 17, heapH);
          ctx.fillStyle = '#ffffff'; // Top highlight
          ctx.fillRect(-8, -5 - heapH + bob * 0.4, 15, 2);
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(-9, -5 - heapH + bob * 0.4, 17, heapH);
        } else if (isTin) {
          // Glistening silver-blue cassiterite crystal ingots
          ctx.fillStyle = '#93c5fd';
          ctx.fillRect(-9, -5 - heapH + bob * 0.4, 17, heapH);
          ctx.fillStyle = '#ffffff'; // Brilliant silver specular shine
          ctx.fillRect(-7, -4 - heapH + bob * 0.4, 5, 2.5);
          ctx.fillRect(1, -3 - heapH + bob * 0.4, 4, 2.5);
        } else if (isIron) {
          // Dark metallic iron bloom with steel highlights
          ctx.fillStyle = '#334155';
          ctx.fillRect(-9, -5 - heapH + bob * 0.4, 17, heapH);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-6, -4 - heapH + bob * 0.4, 5, 2);
          ctx.fillRect(2, -3 - heapH + bob * 0.4, 4, 2);
        } else if (isGrain) {
          // Golden grain sacks and wheat sheaves
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(-9, -5 - heapH + bob * 0.4, 17, heapH);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(-7, -4 - heapH + bob * 0.4, 13, 3);
        } else {
          // Raw Malachite Copper Ore: vibrant green with teal facets and copper flecks
          ctx.fillStyle = '#059669'; // Malachite green
          ctx.fillRect(-9, -5 - heapH + bob * 0.4, 17, heapH);
          ctx.fillStyle = '#34d399'; // Emerald crystal highlight
          ctx.fillRect(-7, -4 - heapH + bob * 0.4, 5, 2.5);
          ctx.fillRect(1, -3 - heapH + bob * 0.4, 5, 2.5);
          ctx.fillStyle = '#fbbf24'; // Native raw copper flecks
          ctx.fillRect(-4, -2 - heapH + bob * 0.4, 2, 2);
          ctx.fillRect(4, -2 - heapH + bob * 0.4, 2, 2);
        }
      }

      // 7. CARAVAN MINER & HANDLER (Swinging bronze pickaxe with sparks during harvest)
      if (isHarvesting) {
        const swing = Math.sin(minePhase);
        const pickAngle = -Math.PI / 4 + swing * 0.9;

        ctx.save();
        ctx.translate(-21, 1);
        // Miner silhouette (Tunic in faction color)
        ctx.fillStyle = cMain;
        ctx.fillRect(-4, -5, 7, 9); // Tunic
        ctx.fillStyle = '#bfa58d';
        ctx.fillRect(-3, -11, 5, 5); // Head
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-3, -13, 5, 2.5); // Hair

        // Swinging wooden haft & bronze pickaxe
        ctx.rotate(pickAngle);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-1.2, -14, 2.5, 17); // Long haft
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-6, -15, 12, 3.5); // Double-pointed bronze pick head
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(6, -15); ctx.lineTo(9, -13.5); ctx.lineTo(6, -11.5); ctx.fill();
        ctx.restore();

        // Chipping sparks and dust puffs at impact point
        if (swing > 0.5) {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-27 + Math.random() * 8, 7 + Math.random() * 4, 2.5, 2.5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-29 + Math.random() * 9, 5 + Math.random() * 6, 2, 2);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(-26 + Math.random() * 7, 3 + Math.random() * 7, 2.5, 2.5);
        }
      } else if (isMoving) {
        // Caravan driver walking alongside holding lead reins
        ctx.save();
        ctx.translate(-19, 0);
        ctx.fillStyle = cMain;
        ctx.fillRect(-3, -4 + bob * 0.5, 6, 8); // Tunic
        ctx.fillStyle = '#bfa58d';
        ctx.fillRect(-2.5, -9 + bob * 0.5, 5, 5); // Head
        // Driver legs walking
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-3 + legStep * 0.4, 4, 2.5, 6);
        ctx.fillRect(1 - legStep * 0.4, 4, 2.5, 6);
        // Lead rope to donkey bridle
        ctx.strokeStyle = '#d4c2b0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(3, -2 + bob * 0.5);
        ctx.quadraticCurveTo(10, 4, 20, -8 + headBob);
        ctx.stroke();
        ctx.restore();
      }
    } else if (u.def.category === 'chariot' || u.defId === 'war_chariot') {
      // 2-Horse Royal War Chariot
      const gallop = isMoving ? Math.sin(animPhase * 1.6) * 4 : 0;
      
      // Ground dust when racing
      if (isMoving) {
        ctx.fillStyle = 'rgba(217, 119, 6, 0.3)';
        ctx.beginPath();
        ctx.arc(-16, 10 + Math.random() * 2, 4 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Two Galloping Steeds (chestnut coats)
      for (const horseOffset of [-5, 5]) {
        ctx.save();
        ctx.translate(14, horseOffset);
        // Horse body
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(-10, -5 + gallop * 0.4, 20, 10);
        // Horse neck & head
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(6, -11 + gallop * 0.6, 7, 8);
        ctx.fillStyle = '#451a03'; // Mane
        ctx.fillRect(4, -13 + gallop * 0.6, 4, 4);
        // Muzzle
        ctx.fillStyle = '#9a3412';
        ctx.fillRect(11, -9 + gallop * 0.6, 4, 5);
        // Plumed bridle / crest
        ctx.fillStyle = cTrim;
        ctx.fillRect(7, -15 + gallop * 0.6, 3, 4);
        // Galloping legs
        ctx.fillStyle = '#591c0b';
        ctx.fillRect(-8 + gallop, 5, 3, 8);
        ctx.fillRect(5 - gallop, 5, 3, 8);
        ctx.restore();
      }

      // Wooden Chariot Chassis & Draught Pole
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, -1, 14, 3); // Center draught pole
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-16, -9 + bob * 0.4, 15, 18); // Cab body
      ctx.fillStyle = cMain;
      ctx.fillRect(-15, -7 + bob * 0.4, 13, 14); // Royal painted cab front
      ctx.strokeStyle = cTrim;
      ctx.lineWidth = 1;
      ctx.strokeRect(-15, -7 + bob * 0.4, 13, 14);

      // Charioteer / Royal Archer in cab
      ctx.fillStyle = '#d97706'; // Bronze scale cuirass
      ctx.fillRect(-11, -12 + bob * 0.5, 6, 8);
      ctx.fillStyle = '#cbd5e1'; // Helmet
      ctx.fillRect(-10, -17 + bob * 0.5, 5, 5);
      ctx.fillStyle = cTrim; // Crest
      ctx.fillRect(-9, -20 + bob * 0.5, 3, 3);
      // Composite Bow held ready
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-3, -10 + bob * 0.5, 7, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      // Bronze Spoked Wheels
      const wheelRot = animPhase * 2.5;
      for (const wy of [-10, 10]) {
        ctx.save();
        ctx.translate(-9, wy);
        ctx.rotate(wheelRot);
        ctx.fillStyle = '#451a03';
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#fbbf24'; // Bronze hub
        ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
        // 4 Spokes
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
        ctx.moveTo(0, -6); ctx.lineTo(0, 6);
        ctx.stroke();
        ctx.restore();
      }
    } else if (u.defId === 'skirmisher') {
      // --- LEVANTINE SLINGER (Agile, bleached linen, leather stone pouch, whirling sling) ---
      const isAttacking = u.state === 'ATTACK_TARGET' && u.attackCooldown > 0;
      const slingPhase = (Date.now() / (isAttacking ? 60 : 120));
      const slingRot = isAttacking ? slingPhase * 2 : (isMoving ? Math.sin(animPhase) * 0.8 : 0.4);

      // Agile bare legs with leather sandals
      ctx.fillStyle = '#bfa58d';
      ctx.fillRect(-4, 3, 3, 9 + bob);
      ctx.fillRect(2, 3, 3, 9 - bob);
      // Leather sandals
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-4, 11 + bob, 4, 2);
      ctx.fillRect(2, 11 - bob, 4, 2);

      // Light Bleached Linen Tunic / Kilt
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-5, -6 + bob * 0.5, 10, 10);
      ctx.fillStyle = cMain; // Faction sash border
      ctx.fillRect(-5, 0 + bob * 0.5, 10, 2.5);

      // Leather Stone Satchel / Sling Pouch at hip
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(3, -2 + bob * 0.5, 4, 5);
      ctx.strokeStyle = '#583c1d';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(3, -2 + bob * 0.5, 4, 5);

      // Head & Red/Blue Cloth Headband
      ctx.fillStyle = '#bfa58d';
      ctx.fillRect(-3, -12 + bob * 0.5, 6, 6);
      ctx.fillStyle = '#451a03'; // Curly dark Mediterranean hair
      ctx.fillRect(-3, -14 + bob * 0.5, 6, 3);
      ctx.fillStyle = cMain; // Cloth Headband
      ctx.fillRect(-4, -13 + bob * 0.5, 8, 2);

      // WHIRLING LEATHER SLING & RIVER STONE
      ctx.save();
      ctx.translate(-2, -14 + bob * 0.5);
      ctx.rotate(slingRot);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(9, -7);
      ctx.stroke();
      // Stone in sling cradle
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(9, -7, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Motion blur trail when whirling
      if (isAttacking || isMoving) {
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 11, slingRot - 0.9, slingRot);
        ctx.stroke();
      }
      ctx.restore();

      // Free Left Arm holding ready river stone
      ctx.fillStyle = '#bfa58d';
      ctx.fillRect(-7, -4 + bob * 0.5, 3, 6);
      ctx.fillStyle = '#cbd5e1'; // River stone in hand
      ctx.beginPath(); ctx.arc(-6, 2 + bob * 0.5, 1.8, 0, Math.PI * 2); ctx.fill();

    } else if (u.defId === 'bronze_swordsman') {
      // --- KHOPESH BRONZE WARRIOR (Royal Elite, gleaming bronze cuirass, crested helm, golden sickle-sword) ---
      const isAttacking = u.state === 'ATTACK_TARGET' && u.attackCooldown > 0;
      const slashAngle = isAttacking ? Math.sin((u.attackCooldown / (u.def.attackCooldown || 1.0)) * Math.PI) * 1.4 : 0;

      // Heavy bronze greaves on legs
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-5, 3, 3.5, 9 + bob);
      ctx.fillRect(2, 3, 3.5, 9 - bob);
      ctx.fillStyle = '#fbbf24'; // Greave shine
      ctx.fillRect(-5, 5 + bob, 1, 6);
      ctx.fillRect(2, 5 - bob, 1, 6);

      // Pleated Royal Kilt with gold embroidery
      ctx.fillStyle = cMain;
      ctx.fillRect(-6, -3 + bob * 0.5, 12, 7);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-6, 2 + bob * 0.5, 12, 1.5);

      // Gleaming Cast Bronze Muscle Cuirass / Breastplate
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-5, -9 + bob * 0.5, 10, 8);
      ctx.fillStyle = '#fde047'; // Specular highlight on bronze pectoral
      ctx.fillRect(-4, -8 + bob * 0.5, 3, 3);
      ctx.fillRect(1, -8 + bob * 0.5, 3, 3);

      // Ornate Crested Bronze Royal Helmet
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(0, -12 + bob * 0.5, 5, Math.PI, 0);
      ctx.fill();
      // Tall crimson horsehair crest plume
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-2, -21 + bob * 0.5, 4, 8);
      ctx.fillStyle = '#fbbf24'; // Crest holder socket
      ctx.fillRect(-2, -14 + bob * 0.5, 4, 2);

      // Embossed Circular Bronze Aspis Shield with Sunburst Boss
      ctx.save();
      ctx.translate(-7, -4 + bob * 0.5);
      ctx.fillStyle = '#b45309';
      ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#fde047'; // Sunburst central boss
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // THE FAMOUS BRONZE KHOPESH SICKLE-SWORD
      ctx.save();
      ctx.translate(5, -6 + bob * 0.5);
      ctx.rotate(0.3 + slashAngle);
      // Sword grip & pommel
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-1, 0, 2.5, 6);
      ctx.fillStyle = '#fbbf24'; // Guard
      ctx.fillRect(-3, -1, 6, 2);
      // Curved Khopesh sickle blade
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-1, -10, 2.5, 10); // Straight lower blade
      // Sickle curve hook
      ctx.beginPath();
      ctx.moveTo(-1, -10);
      ctx.quadraticCurveTo(8, -14, 5, -20);
      ctx.lineTo(2, -18);
      ctx.quadraticCurveTo(4, -13, -1, -9);
      ctx.closePath();
      ctx.fill();
      // Polished bronze blade highlight
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(0, -9, 1, 7);
      ctx.restore();

    } else if (u.defId === 'sea_raider') {
      // --- SEA PEOPLES RAIDER / SHARDANA (Horned helmet with disc, round studded buckler, Naue II broadsword) ---
      const isAttacking = u.state === 'ATTACK_TARGET' && u.attackCooldown > 0;
      const chopAngle = isAttacking ? Math.sin((u.attackCooldown / (u.def.attackCooldown || 1.0)) * Math.PI) * 1.5 : 0;

      // Muscular tanned legs
      ctx.fillStyle = '#a16207';
      ctx.fillRect(-4, 3, 3.5, 9 + bob);
      ctx.fillRect(2, 3, 3.5, 9 - bob);

      // Fringed Sea-Raider Kilt with bold diagonal stripes
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-6, -4 + bob * 0.5, 12, 8);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-6, -2 + bob * 0.5, 12, 2);
      ctx.fillRect(-6, 2 + bob * 0.5, 12, 1.5);

      // Tanned chest with crossed leather harness
      ctx.fillStyle = '#a16207';
      ctx.fillRect(-5, -9 + bob * 0.5, 10, 6);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-5, -9 + bob * 0.5); ctx.lineTo(5, -3 + bob * 0.5);
      ctx.moveTo(5, -9 + bob * 0.5); ctx.lineTo(-5, -3 + bob * 0.5);
      ctx.stroke();

      // LEGENDARY SHARDANA HORNED HELMET WITH CENTRAL SOLAR DISC
      ctx.fillStyle = '#94a3b8'; // Bronze/pewter helmet cap
      ctx.beginPath();
      ctx.arc(0, -11 + bob * 0.5, 5, Math.PI, 0);
      ctx.fill();
      // Curved Bull Horns on sides
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      // Left horn curving up
      ctx.moveTo(-4, -12 + bob * 0.5);
      ctx.quadraticCurveTo(-9, -15 + bob * 0.5, -7, -19 + bob * 0.5);
      // Right horn curving up
      ctx.moveTo(4, -12 + bob * 0.5);
      ctx.quadraticCurveTo(9, -15 + bob * 0.5, 7, -19 + bob * 0.5);
      ctx.stroke();
      // Central bronze solar disc
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, -17 + bob * 0.5, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Round Studded Wooden Buckler Shield
      ctx.save();
      ctx.translate(-7, -4 + bob * 0.5);
      ctx.fillStyle = '#78350f'; // Dark wood
      ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Bronze rivets around rim
      ctx.fillStyle = '#fbbf24';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
        ctx.fillRect(Math.cos(a) * 4.5 - 0.7, Math.sin(a) * 4.5 - 0.7, 1.5, 1.5);
      }
      ctx.restore();

      // Straight Double-Edged Naue II Bronze Broadsword
      ctx.save();
      ctx.translate(5, -6 + bob * 0.5);
      ctx.rotate(0.4 + chopAngle);
      ctx.fillStyle = '#451a03'; // Grip
      ctx.fillRect(-1, 0, 2, 5);
      ctx.fillStyle = '#fbbf24'; // Crossguard
      ctx.fillRect(-3, -1, 6, 2);
      // Broadsword blade
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-1.5, -16, 3, 16);
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(-1.5, -16); ctx.lineTo(0, -20); ctx.lineTo(1.5, -16);
      ctx.fill();
      ctx.restore();

    } else if (u.defId === 'iron_infantry') {
      // --- HEAVY IRON ASSAULT INFANTRY (Iron scale coat, conical iron spangenhelm, heavy iron pike) ---
      const isAttacking = u.state === 'ATTACK_TARGET' && u.attackCooldown > 0;
      const thrust = isAttacking ? Math.sin((u.attackCooldown / (u.def.attackCooldown || 1.0)) * Math.PI) * 9 : 0;

      // Dark iron greaves
      ctx.fillStyle = '#334155';
      ctx.fillRect(-5, 4, 3.5, 8 + bob);
      ctx.fillRect(2, 4, 3.5, 8 - bob);

      // Dark Iron Scale Cuirass & Tunic
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-6, -8 + bob * 0.5, 12, 13);
      ctx.fillStyle = '#475569'; // Iron scales
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          ctx.fillRect(-5 + c * 2.5, -6 + r * 2.5 + bob * 0.5, 2, 2);
        }
      }

      // Conical Iron Helmet with Cheek Guards
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(-5, -9 + bob * 0.5);
      ctx.lineTo(0, -18 + bob * 0.5);
      ctx.lineTo(5, -9 + bob * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#94a3b8'; // Iron ridge highlight
      ctx.fillRect(-0.5, -18 + bob * 0.5, 1, 9);

      // Heavy Iron-Rimmed Shield
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-9, -6 + bob * 0.5, 6, 14);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(-9, -6 + bob * 0.5, 6, 14);
      ctx.fillStyle = '#94a3b8'; // Central iron boss
      ctx.beginPath(); ctx.arc(-6, 1 + bob * 0.5, 2, 0, Math.PI * 2); ctx.fill();

      // Long Iron-Headed Heavy Pike
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 9);
      ctx.lineTo(5, -20 - thrust);
      ctx.stroke();
      // Sharp Iron Spearhead
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(5, -25 - thrust);
      ctx.lineTo(2, -20 - thrust);
      ctx.lineTo(8, -20 - thrust);
      ctx.fill();

    } else {
      // --- TOWER-SHIELD SPEARMAN (`spear_militia` and default infantry) ---
      const isAttacking = u.state === 'ATTACK_TARGET' && u.attackCooldown > 0;
      const thrust = isAttacking ? Math.sin((u.attackCooldown / (u.def.attackCooldown || 1.0)) * Math.PI) * 9 : 0;

      // Legs with bronze greaves
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-5, 4, 3.5, 8 + bob);
      ctx.fillRect(2, 4, 3.5, 8 - bob);

      // Torso & Tunic
      ctx.fillStyle = cMain;
      ctx.fillRect(-6, -8 + bob * 0.5, 12, 13);
      ctx.fillStyle = '#d97706'; // Bronze chest protection
      ctx.fillRect(-5, -6 + bob * 0.5, 10, 7);

      // Boar's Tusk Helmet (layered ivory bands)
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -10 + bob * 0.5, 5.5, Math.PI, 0);
      ctx.fill();
      // Helmet ivory horizontal ridges
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-5, -12 + bob * 0.5); ctx.lineTo(5, -12 + bob * 0.5);
      ctx.moveTo(-4, -14 + bob * 0.5); ctx.lineTo(4, -14 + bob * 0.5);
      ctx.stroke();
      // Tall horsehair crest
      ctx.fillStyle = cTrim;
      ctx.fillRect(-2, -19 + bob * 0.5, 4, 6);

      // AUTHENTIC FIGURE-OF-EIGHT MYCENAEAN TOWER SHIELD (Oxhide with spots)
      ctx.save();
      ctx.translate(-8, -1 + bob * 0.5);
      // Outer 8-shape / hourglass body shield
      ctx.fillStyle = '#f1f5f9'; // Cowhide base
      ctx.beginPath();
      ctx.arc(0, -6, 5, 0, Math.PI * 2);
      ctx.arc(0, 4, 5.5, 0, Math.PI * 2);
      ctx.fill();
      // Bronze rim
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // Cowhide dark blotches
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-2, -8, 3, 3);
      ctx.fillRect(0, 2, 4, 3);
      ctx.fillRect(-3, 4, 3, 3);
      // Central bronze boss stud
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(0, -1, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Long Bronze Dory Spear (Thrusting forward on attack)
      ctx.strokeStyle = '#583c1d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 9);
      ctx.lineTo(6, -21 - thrust);
      ctx.stroke();
      // Gleaming Leaf-Shaped Bronze Spearhead
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(6, -26 - thrust);
      ctx.lineTo(2.5, -20 - thrust);
      ctx.lineTo(9.5, -20 - thrust);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- Sea Peoples Bronze Age War Galley / Landing Skiff ---
  public static drawSeaPeoplesShip(
    ctx: CanvasRenderingContext2D,
    wx: number,
    wy: number,
    animPhase: number,
    state: 'ARRIVING' | 'UNLOADING' | 'DEPARTING' | 'COMPLETED' = 'UNLOADING',
    facing: number = 1,
    gangplankDown: boolean = true
  ): void {
    const isSailing = state === 'ARRIVING' || state === 'DEPARTING';
    const bob = Math.sin(animPhase) * 1.5;
    ctx.save();
    ctx.translate(wx, wy);

    // Inverti orizzontalmente se rivolto a ovest (ritirata verso il mare aperto)
    if (facing < 0) {
      ctx.scale(-1, 1);
    }

    // Beccheggio dinamico della nave durante la navigazione
    if (isSailing) {
      ctx.rotate(Math.sin(animPhase * 2) * 0.035);
    }

    // 1. Onde e scia d'acqua
    if (isSailing) {
      // Scia spumeggiante a V che si allarga a poppa (-32)
      ctx.save();
      for (let w = 1; w <= 3; w++) {
        const wakeDist = w * 22 + ((animPhase * 14) % 22);
        const wakeSpread = w * 9;
        const wakeAlpha = Math.max(0, 0.7 - w * 0.2);
        ctx.strokeStyle = `rgba(224, 242, 254, ${wakeAlpha})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-32, 10 + bob * 0.3);
        ctx.lineTo(-32 - wakeDist, 10 + bob * 0.3 - wakeSpread);
        ctx.moveTo(-32, 12 + bob * 0.3);
        ctx.lineTo(-32 - wakeDist, 12 + bob * 0.3 + wakeSpread);
        ctx.stroke();
      }

      // Spruzzo di prua (+32) che fende le onde marine
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(32, 8 + bob * 0.3, 8, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      ctx.restore();
    } else {
      // Cerchi d'acqua e spuma attorno alla chiglia all'ancora sulla battigia
      ctx.fillStyle = 'rgba(224, 242, 254, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 10 + bob * 0.3, 36, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(-2, 11 + bob * 0.3, 39, 13, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Clinker-Built Wooden Hull (Cedar / Pine planks)
    ctx.fillStyle = '#451a03'; // Keel / bottom
    ctx.beginPath();
    ctx.moveTo(-32, -4 + bob);
    ctx.quadraticCurveTo(-36, 6 + bob, -20, 12 + bob);
    ctx.lineTo(24, 12 + bob);
    ctx.quadraticCurveTo(34, 4 + bob, 32, -8 + bob);
    ctx.lineTo(28, -6 + bob);
    ctx.quadraticCurveTo(20, 8 + bob, -16, 8 + bob);
    ctx.lineTo(-28, -4 + bob);
    ctx.closePath();
    ctx.fill();

    // Hull planking & color
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(-30, -2 + bob);
    ctx.quadraticCurveTo(-26, 8 + bob, -16, 9 + bob);
    ctx.lineTo(22, 9 + bob);
    ctx.quadraticCurveTo(30, 2 + bob, 30, -5 + bob);
    ctx.lineTo(26, -4 + bob);
    ctx.quadraticCurveTo(18, 6 + bob, -14, 6 + bob);
    ctx.closePath();
    ctx.fill();

    // Gunwale trim
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-32, -3 + bob);
    ctx.quadraticCurveTo(0, 4 + bob, 30, -6 + bob);
    ctx.stroke();

    // 3. High Curved Bird / Horned Prow Figurehead (Eastern Mediterranean style)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(28, -6 + bob);
    ctx.quadraticCurveTo(36, -16 + bob, 34, -26 + bob);
    ctx.lineTo(31, -25 + bob);
    ctx.quadraticCurveTo(32, -14 + bob, 25, -5 + bob);
    ctx.closePath();
    ctx.fill();
    // Horned crest tip
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(32, -28 + bob, 4, 3);

    // 4. Curved High Sternpost & Steering Oar
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(-30, -3 + bob);
    ctx.quadraticCurveTo(-38, -12 + bob, -36, -22 + bob);
    ctx.lineTo(-33, -21 + bob);
    ctx.quadraticCurveTo(-34, -10 + bob, -27, -2 + bob);
    ctx.closePath();
    ctx.fill();
    // Steering Oar trailing in the surf
    ctx.strokeStyle = '#583c1d';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-30, 2 + bob);
    ctx.lineTo(-40, 16 + bob);
    ctx.stroke();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-42, 14 + bob, 4, 6);

    // 5. Center Mast, Crow's Nest & Furled Square Sail
    ctx.fillStyle = '#583c1d'; // Mast
    ctx.fillRect(-2, -38 + bob, 3, 40);
    // Crow's nest look-out basket
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-5, -42 + bob, 9, 5);
    ctx.strokeStyle = '#451a03';
    ctx.strokeRect(-5, -42 + bob, 9, 5);

    // Yardarm cross-beam
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, -32 + bob);
    ctx.lineTo(16, -32 + bob);
    ctx.stroke();

    // Furled linen square sail bundled along yardarm
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-19, -34 + bob, 34, 5, 2);
    ctx.fill();
    // Red cloth lashing ties
    ctx.fillStyle = '#dc2626';
    for (let lx = -16; lx < 14; lx += 6) {
      ctx.fillRect(lx, -35 + bob, 1.5, 7);
    }

    // Rigging shrouds & stays
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-1, -38 + bob); ctx.lineTo(-28, -2 + bob);
    ctx.moveTo(1, -38 + bob); ctx.lineTo(26, -4 + bob);
    ctx.stroke();

    // 6. Gunwale Round Shields (Alternating red and blue striped Shardana bucklers)
    for (let sx = -20; sx <= 16; sx += 9) {
      const isRed = (sx + 20) % 18 === 0;
      ctx.fillStyle = isRed ? '#dc2626' : '#2563eb';
      ctx.beginPath();
      ctx.arc(sx, 1 + bob, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24'; // Bronze boss rim
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.fillStyle = '#fbbf24'; // Center boss
      ctx.beginPath(); ctx.arc(sx, 1 + bob, 1.2, 0, Math.PI * 2); ctx.fill();
    }

    // 7. Banchi di remi animati durante la navigazione
    if (isSailing) {
      const oarCycle = animPhase * 3.5;
      const oarSwing = Math.sin(oarCycle) * 0.4;
      const oarDip = Math.cos(oarCycle) * 3;
      ctx.strokeStyle = '#583c1d';
      ctx.lineWidth = 1.8;
      for (let ox = -18; ox <= 14; ox += 8) {
        const tipX = ox - 14 + oarSwing * 12;
        const tipY = 18 + oarDip + bob * 0.5;
        ctx.beginPath();
        ctx.moveTo(ox, 5 + bob);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        // Pala del remo
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tipX - 2, tipY - 2, 4, 3);
        // Piccolo schizzo d'acqua
        if (oarDip > 1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(tipX, tipY + 1, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 8. Passerella di sbarco in legno (calata solo durante lo scarico truppe, altrimenti stivata)
    if (gangplankDown) {
      ctx.fillStyle = '#583c1d';
      ctx.beginPath();
      ctx.moveTo(22, 2 + bob);
      ctx.lineTo(48, 14);
      ctx.lineTo(46, 20);
      ctx.lineTo(20, 8 + bob);
      ctx.closePath();
      ctx.fill();
      // Plank cross-slats
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1;
      for (let p = 0; p <= 1; p += 0.2) {
        const px1 = 22 + (48 - 22) * p;
        const py1 = (2 + bob) + (14 - (2 + bob)) * p;
        ctx.beginPath();
        ctx.moveTo(px1, py1);
        ctx.lineTo(px1 - 2, py1 + 6);
        ctx.stroke();
      }
    } else {
      // Passerella sollevata e stivata verticalmente vicino a prua
      ctx.fillStyle = '#583c1d';
      ctx.fillRect(20, -12 + bob, 4, 18);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, -12 + bob, 4, 18);
    }

    ctx.restore();
  }
}
