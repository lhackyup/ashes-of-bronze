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

  // --- Helper Grafici SVGA per Texture dell'Età del Bronzo ---

  // Disegna un muro in blocchi megalitici ciclopici poligonali a secco con ombre 3D su ogni pietra
  private static drawMegalithicWall(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    baseColor = '#695c4d',
    lightColor = '#8f7f6d',
    shadowColor = '#3b332b'
  ): void {
    // Sfondo base
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, w, h);

    const rowH = 14;
    let rowIndex = 0;
    for (let curY = y; curY < y + h - 2; curY += rowH) {
      const actualH = Math.min(rowH, (y + h) - curY);
      const isShifted = (rowIndex % 2) === 1;
      const blockW = 22;
      const startX = isShifted ? x - 10 : x;

      for (let curX = startX; curX < x + w; curX += blockW) {
        const bx = Math.max(x, curX);
        const bw = Math.min(blockW - 2, (x + w) - bx);
        if (bw <= 3) continue;

        // Gradiente di luce diagonale su ogni masso ciclopico
        const grad = ctx.createLinearGradient(bx, curY, bx + bw, curY + actualH);
        grad.addColorStop(0, lightColor);
        grad.addColorStop(0.5, baseColor);
        grad.addColorStop(1, shadowColor);
        ctx.fillStyle = grad;
        ctx.fillRect(bx, curY, bw, actualH - 2);

        // Bordo in rilievo luce / ombra tipico anni '90 (bevel)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.beginPath();
        ctx.moveTo(bx, curY + actualH - 2);
        ctx.lineTo(bx, curY);
        ctx.lineTo(bx + bw, curY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.moveTo(bx + bw, curY);
        ctx.lineTo(bx + bw, curY + actualH - 2);
        ctx.lineTo(bx, curY + actualH - 2);
        ctx.stroke();
      }
      rowIndex++;
    }
  }

  // Merlature ciclopiche squadrate sulla sommità degli edifici
  private static drawBattlements(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    battlementH = 8,
    merlonW = 10,
    gapW = 8
  ): void {
    let curX = x;
    while (curX < x + w) {
      const curMerlonW = Math.min(merlonW, (x + w) - curX);
      if (curMerlonW <= 2) break;

      ctx.fillStyle = '#8f7f6d';
      ctx.fillRect(curX, y - battlementH, curMerlonW, battlementH);

      ctx.strokeStyle = '#2b241e';
      ctx.lineWidth = 1;
      ctx.strokeRect(curX, y - battlementH, curMerlonW, battlementH);

      // Ombra sotto il merlo
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(curX, y, curMerlonW, 2);

      curX += merlonW + gapW;
    }
  }

  // Colonne rastremate di cedro (stile miceneo/minoico, più larghe in cima)
  private static drawBronzeAgeColumn(
    ctx: CanvasRenderingContext2D,
    topX: number,
    topY: number,
    bottomY: number,
    topW = 12,
    bottomW = 8,
    color = '#9e2a2b'
  ): void {
    // Fusto rastremato
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(topX - topW / 2, topY);
    ctx.lineTo(topX + topW / 2, topY);
    ctx.lineTo(topX + bottomW / 2, bottomY);
    ctx.lineTo(topX - bottomW / 2, bottomY);
    ctx.closePath();
    ctx.fill();

    // Sfumatura cilindrica luce/ombra
    const colGrad = ctx.createLinearGradient(topX - topW / 2, 0, topX + topW / 2, 0);
    colGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
    colGrad.addColorStop(0.35, 'rgba(255,255,255,0.3)');
    colGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = colGrad;
    ctx.fill();

    // Capitello a disco dorato
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(topX - topW / 2 - 2, topY - 3, topW + 4, 3);
    ctx.fillStyle = '#b8944d';
    ctx.fillRect(topX - topW / 2 - 4, topY - 6, topW + 8, 3);

    // Base in pietra
    ctx.fillStyle = '#473d33';
    ctx.fillRect(topX - bottomW / 2 - 2, bottomY, bottomW + 4, 3);
  }

  // Portale monumentale con architrave monolitico e triangolo di scarico (stile Porta dei Leoni)
  private static drawMegalithicPortal(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    trimColor = '#c9933b'
  ): void {
    // Apertura interna buia
    ctx.fillStyle = '#17120e';
    ctx.fillRect(x, y, w, h);

    // Porte a doppio battente di legno rinforzate in bronzo
    ctx.fillStyle = '#422a18';
    ctx.fillRect(x + 2, y + 2, w / 2 - 2, h - 2);
    ctx.fillRect(x + w / 2, y + 2, w / 2 - 2, h - 2);

    // Borchie di bronzo sulle porte
    ctx.fillStyle = trimColor;
    for (let by = y + 6; by < y + h - 4; by += 8) {
      ctx.fillRect(x + 5, by, 3, 3);
      ctx.fillRect(x + w - 8, by, 3, 3);
    }

    // Architrave monolitico massiccio
    const lintelH = 8;
    ctx.fillStyle = '#7a6b5a';
    ctx.fillRect(x - 5, y - lintelH, w + 10, lintelH);
    ctx.strokeStyle = '#382f26';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 5, y - lintelH, w + 10, lintelH);

    // Triangolo di scarico superiore miceneo
    ctx.fillStyle = '#473c31';
    ctx.beginPath();
    ctx.moveTo(x - 3, y - lintelH);
    ctx.lineTo(x + w / 2, y - lintelH - 12);
    ctx.lineTo(x + w + 3, y - lintelH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#29221b';
    ctx.stroke();

    // Rilievo simbolico al centro del triangolo (es. emblema delleoni/spirale)
    ctx.fillStyle = trimColor;
    ctx.beginPath();
    ctx.arc(x + w / 2, y - lintelH - 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Ritratti Consiglieri Storici ---
  private static initAdvisorPortraits(): void {
    // 1. Burna-Khabir
    this.advisorPortraits.set('burna_khabir', makeCanvas(64, 64, (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, '#2d2218');
      grad.addColorStop(1, '#120d09');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      // Copricapo cilindrico levantino
      ctx.fillStyle = '#8a6234';
      ctx.fillRect(22, 10, 20, 14);
      ctx.fillStyle = '#b8944d';
      ctx.fillRect(20, 22, 24, 3);

      // Viso
      ctx.fillStyle = '#d49b6a';
      ctx.fillRect(24, 24, 16, 16);

      // Barba arcaica a onde
      ctx.fillStyle = '#2b1c11';
      ctx.fillRect(22, 36, 20, 16);
      ctx.fillRect(25, 52, 14, 6);

      // Toga con bordo dorato
      ctx.fillStyle = '#e8dfcf';
      ctx.beginPath();
      ctx.ellipse(32, 66, 24, 18, 0, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#c9933b';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 62);
    }));

    // 2. Tarkhunta
    this.advisorPortraits.set('tarkhunta', makeCanvas(64, 64, (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, '#361b14');
      grad.addColorStop(1, '#170c09');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      ctx.fillStyle = '#c48558';
      ctx.fillRect(24, 20, 16, 18);
      ctx.fillStyle = 'rgba(20, 15, 10, 0.4)';
      ctx.fillRect(26, 26, 8, 5);

      ctx.fillStyle = '#1c1511';
      ctx.fillRect(21, 14, 22, 8);
      ctx.fillStyle = '#7a3e23';
      ctx.fillRect(20, 20, 24, 4);

      ctx.fillStyle = '#17120e';
      ctx.fillRect(22, 34, 20, 18);

      ctx.fillStyle = '#59321f';
      ctx.beginPath();
      ctx.ellipse(32, 66, 24, 18, 0, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#c9933b';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 62);
    }));

    // 3. Zalpa
    this.advisorPortraits.set('zalpa', makeCanvas(64, 64, (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, '#1c2826');
      grad.addColorStop(1, '#0c1412');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      ctx.fillStyle = '#1a130e';
      ctx.fillRect(20, 14, 24, 10);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(20, 20, 24, 4);

      ctx.fillStyle = '#dca275';
      ctx.fillRect(24, 22, 16, 18);

      ctx.fillStyle = '#26594d';
      ctx.beginPath();
      ctx.ellipse(32, 66, 24, 18, 0, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#2de0a5';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 62);
    }));
  }

  // --- Sprite Edifici dell'Età del Bronzo ad Alto Dettaglio SVGA ---
  private static initBuildingSprites(): void {
    const owners: ('player' | 'sea_peoples')[] = ['player', 'sea_peoples'];

    for (const owner of owners) {
      const isPlayer = owner === 'player';
      const cPrimary = isPlayer ? '#7a5a3a' : '#5c2222';
      const cLight = isPlayer ? '#9e7952' : '#7d3838';
      const cDark = isPlayer ? '#47321e' : '#331212';
      const cTrim = isPlayer ? '#c9933b' : '#ff4d4d';
      const cTrimBright = isPlayer ? '#ffd166' : '#ff8585';

      // 0. Cyclopean Slab / Terrapieno Ciclopico (2x2 tile = 96x96 px)
      this.buildingSprites.set(`cyclopean_slab_${owner}`, makeCanvas(96, 96, (ctx) => {
        // Blocco megalitico con 4 grandi lastroni poligonali ad incastro
        const slabs = [
          { x: 3, y: 3, w: 43, h: 43 },
          { x: 49, y: 3, w: 44, h: 43 },
          { x: 3, y: 49, w: 43, h: 44 },
          { x: 49, y: 49, w: 44, h: 44 }
        ];

        ctx.fillStyle = '#29221b';
        ctx.fillRect(0, 0, 96, 96);

        for (const s of slabs) {
          const g = ctx.createLinearGradient(s.x, s.y, s.x + s.w, s.y + s.h);
          g.addColorStop(0, '#9e8e7c');
          g.addColorStop(0.5, '#736657');
          g.addColorStop(1, '#42392f');
          ctx.fillStyle = g;
          ctx.fillRect(s.x, s.y, s.w, s.h);

          // Crepe e scanalature arcaiche
          ctx.strokeStyle = '#2e261f';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(s.x + 8, s.y + 4);
          ctx.lineTo(s.x + 14, s.y + 16);
          ctx.lineTo(s.x + 28, s.y + 20);
          ctx.stroke();

          // Bevel 3D
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
        }

        // Sigillo centrale di ancoraggio in bronzo
        ctx.fillStyle = cTrim;
        ctx.fillRect(44, 44, 8, 8);
        ctx.strokeStyle = cTrimBright;
        ctx.strokeRect(44, 44, 8, 8);
      }));

      // 1. Acropolis / Megaron del Wanax (4x4 tile = 192x192 px)
      this.buildingSprites.set(`acropolis_${owner}`, makeCanvas(192, 192, (ctx) => {
        // Ombra monumentale
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(12, 16, 172, 172);

        // Terrazza Megalitica Basale (Podio a gradoni ciclopico)
        this.drawMegalithicWall(ctx, 8, 8, 176, 176, '#524536', '#7a6a57', '#30281f');

        // Secondo livello: Corpo centrale del palazzo
        this.drawMegalithicWall(ctx, 24, 20, 144, 150, cPrimary, cLight, cDark);

        // Merli ciclopici lungo il bordo superiore
        this.drawBattlements(ctx, 24, 20, 144, 10, 12, 6);

        // Terrazza superiore pavimentata
        const terraceGrad = ctx.createLinearGradient(34, 30, 34, 110);
        terraceGrad.addColorStop(0, '#c7a36d');
        terraceGrad.addColorStop(1, '#785b34');
        ctx.fillStyle = terraceGrad;
        ctx.fillRect(34, 30, 124, 80);

        // Piastrelle della terrazza
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let tx = 44; tx < 150; tx += 12) {
          ctx.beginPath(); ctx.moveTo(tx, 30); ctx.lineTo(tx, 110); ctx.stroke();
        }
        for (let ty = 40; ty < 110; ty += 12) {
          ctx.beginPath(); ctx.moveTo(34, ty); ctx.lineTo(158, ty); ctx.stroke();
        }

        // Colonne rastremate di cedro che sostengono il portico
        this.drawBronzeAgeColumn(ctx, 48, 120, 168, 14, 10);
        this.drawBronzeAgeColumn(ctx, 80, 120, 168, 14, 10);
        this.drawBronzeAgeColumn(ctx, 112, 120, 168, 14, 10);
        this.drawBronzeAgeColumn(ctx, 144, 120, 168, 14, 10);

        // Portale monumentale miceneo centrale con triangolo di scarico
        this.drawMegalithicPortal(ctx, 82, 126, 28, 42, cTrim);

        // Focolare Sacro Centrale (Megaron) sulla terrazza con braci ardenti e fumo
        ctx.fillStyle = '#261b14';
        ctx.fillRect(80, 52, 32, 32);
        ctx.strokeStyle = cTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(80, 52, 32, 32);

        const flameGrad = ctx.createRadialGradient(96, 68, 2, 96, 68, 14);
        flameGrad.addColorStop(0, '#ffff73');
        flameGrad.addColorStop(0.4, '#ff6a00');
        flameGrad.addColorStop(1, 'rgba(180, 30, 10, 0)');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.arc(96, 68, 14, 0, Math.PI * 2);
        ctx.fill();

        // Stendardi di fazione appesi ai lati del palazzo
        ctx.fillStyle = cTrim;
        ctx.fillRect(36, 124, 6, 32);
        ctx.fillRect(150, 124, 6, 32);
        ctx.fillStyle = isPlayer ? '#2de0a5' : '#8c1919';
        ctx.fillRect(38, 126, 14, 20);
        ctx.fillRect(140, 126, 14, 20);
      }));

      // 2. Bronze Foundry / Fonderia del Bronzo (3x3 tile = 144x144 px)
      this.buildingSprites.set(`bronze_foundry_${owner}`, makeCanvas(144, 144, (ctx) => {
        // Mura megalitiche basse con corte aperta
        this.drawMegalithicWall(ctx, 10, 10, 124, 124, '#4a3f35', '#6b5c4f', '#2b231d');

        // Due forni a cupola gemelli per la fusione del rame e dello stagno
        const furnaces = [{ cx: 44, cy: 50 }, { cx: 98, cy: 50 }];
        for (const f of furnaces) {
          // Cupola in argilla refrattaria scura
          const domeGrad = ctx.createRadialGradient(f.cx - 6, f.cy - 6, 4, f.cx, f.cy, 26);
          domeGrad.addColorStop(0, '#80593b');
          domeGrad.addColorStop(0.7, '#422c1b');
          domeGrad.addColorStop(1, '#1a1008');
          ctx.fillStyle = domeGrad;
          ctx.beginPath();
          ctx.arc(f.cx, f.cy, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#2b1b11';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Bocca del forno con metallo ribollente incandescente
          ctx.fillStyle = '#170e08';
          ctx.beginPath();
          ctx.ellipse(f.cx, f.cy + 12, 12, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          const moltenG = ctx.createRadialGradient(f.cx, f.cy + 12, 1, f.cx, f.cy + 12, 10);
          moltenG.addColorStop(0, '#ffffff');
          moltenG.addColorStop(0.3, '#ffea00');
          moltenG.addColorStop(0.7, '#ff6200');
          moltenG.addColorStop(1, 'rgba(180, 20, 0, 0)');
          ctx.fillStyle = moltenG;
          ctx.beginPath();
          ctx.ellipse(f.cx, f.cy + 12, 10, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Canna fumaria sommitale con cenere e fumo
          ctx.fillStyle = '#1c120c';
          ctx.fillRect(f.cx - 5, f.cy - 24, 10, 8);
        }

        // Mantici doppi in cuoio azionati da travi
        ctx.fillStyle = '#59341b';
        ctx.fillRect(66, 42, 12, 18);
        ctx.fillStyle = '#8a5c36';
        ctx.fillRect(68, 38, 8, 4);

        // Canale di colata verso la vasca di lingotti
        ctx.fillStyle = '#261b14';
        ctx.fillRect(36, 82, 72, 12);
        ctx.fillStyle = '#ff7b00';
        ctx.fillRect(40, 86, 64, 4);

        // Catasta di Lingotti di Bronzo a Pelle di Bue (Oxhide Ingots) con riflessi dorati
        const ingotRows = [
          [{ x: 26, y: 104 }, { x: 50, y: 104 }, { x: 74, y: 104 }, { x: 98, y: 104 }],
          [{ x: 38, y: 96 }, { x: 62, y: 96 }, { x: 86, y: 96 }]
        ];
        for (const row of ingotRows) {
          for (const ing of row) {
            // Forma a pelle di bue con quattro appendici angolari
            const ig = ctx.createLinearGradient(ing.x, ing.y, ing.x + 18, ing.y + 9);
            ig.addColorStop(0, cTrimBright);
            ig.addColorStop(0.5, cTrim);
            ig.addColorStop(1, '#664514');
            ctx.fillStyle = ig;
            ctx.fillRect(ing.x, ing.y, 18, 9);
            ctx.strokeStyle = '#382205';
            ctx.lineWidth = 1;
            ctx.strokeRect(ing.x, ing.y, 18, 9);
          }
        }
      }));

      // 3. Granary / Granaio & Riserva Idrica (2x2 tile = 96x96 px)
      this.buildingSprites.set(`granary_${owner}`, makeCanvas(96, 96, (ctx) => {
        // Piattaforma circolare rialzata antiumidità
        ctx.fillStyle = '#3d342b';
        ctx.beginPath();
        ctx.arc(48, 48, 44, 0, Math.PI * 2);
        ctx.fill();

        // Corpo circolare del silos in argilla levigata color ocra
        const siloGrad = ctx.createRadialGradient(36, 36, 8, 48, 48, 38);
        siloGrad.addColorStop(0, '#c99f6b');
        siloGrad.addColorStop(0.6, '#8c653a');
        siloGrad.addColorStop(1, '#47321a');
        ctx.fillStyle = siloGrad;
        ctx.beginPath();
        ctx.arc(48, 48, 38, 0, Math.PI * 2);
        ctx.fill();

        // Fasce cerchiate di rinforzo in corda di giunco e bronzo
        ctx.strokeStyle = cTrim;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(48, 48, 28, 0, Math.PI * 2);
        ctx.stroke();

        // Tetto a cono in paglia intrecciata con trama radiante
        ctx.fillStyle = '#6e512c';
        ctx.beginPath();
        ctx.arc(48, 48, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.beginPath();
          ctx.moveTo(48, 48);
          ctx.lineTo(48 + Math.cos(a) * 18, 48 + Math.sin(a) * 18);
          ctx.stroke();
        }

        // Abbaino e botola superiore di carico
        ctx.fillStyle = '#261b11';
        ctx.fillRect(44, 44, 8, 8);

        // Sacchi di grano di lino e ceste all'esterno del granaio
        const sacks = [
          { x: 18, y: 72, r: 6 },
          { x: 28, y: 76, r: 7 },
          { x: 70, y: 74, r: 6 }
        ];
        for (const s of sacks) {
          ctx.fillStyle = '#d6c8b2';
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#544733';
          ctx.stroke();
        }
      }));

      // 4. Barracks / Caserma delle Milizie & Forgia Armi (3x3 tile = 144x144 px)
      this.buildingSprites.set(`barracks_${owner}`, makeCanvas(144, 144, (ctx) => {
        // Mura perimetrali megalitiche
        this.drawMegalithicWall(ctx, 10, 10, 124, 124, cPrimary, cLight, cDark);
        this.drawBattlements(ctx, 10, 10, 124, 8, 10, 6);

        // Cortile interno di terra battuta/sabbia per l'addestramento alla falange
        const sandGrad = ctx.createLinearGradient(28, 28, 116, 116);
        sandGrad.addColorStop(0, '#c7ab77');
        sandGrad.addColorStop(1, '#8f7243');
        ctx.fillStyle = sandGrad;
        ctx.fillRect(28, 28, 88, 88);

        // Tettoia d'armeria lungo il lato nord
        ctx.fillStyle = '#4a3321';
        ctx.fillRect(32, 32, 80, 20);
        ctx.strokeStyle = '#291b10';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(32, 32, 80, 20);

        // Rastrelliere con grandi scudi a otto micenei e picche
        const shields = [42, 58, 74, 90];
        for (const sx of shields) {
          // Scudo miceneo a figura di otto
          ctx.fillStyle = cTrim;
          ctx.beginPath();
          ctx.arc(sx, 40, 5, 0, Math.PI * 2);
          ctx.arc(sx, 46, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#362106';
          ctx.stroke();
        }

        // Bersagli d'addestramento e manichini con armature di paglia
        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(44, 76, 14, 14);
        ctx.fillStyle = '#b83b3b';
        ctx.beginPath();
        ctx.arc(51, 83, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(84, 76, 14, 14);
        ctx.fillStyle = '#b83b3b';
        ctx.beginPath();
        ctx.arc(91, 83, 4, 0, Math.PI * 2);
        ctx.fill();

        // Portale massiccio a sud
        this.drawMegalithicPortal(ctx, 60, 100, 24, 28, cTrim);
      }));

      // 5. Watchtower / Torre di Vedetta Ciclopica (2x2 tile = 96x96 px)
      this.buildingSprites.set(`watchtower_${owner}`, makeCanvas(96, 96, (ctx) => {
        // Ombra alta della torre
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(16, 16, 72, 72);

        // Bastione piramidale a gradoni megalitici (base 76x76)
        this.drawMegalithicWall(ctx, 10, 10, 76, 76, '#594d40', '#7d6e5d', '#362e26');

        // Secondo gradone della torre (54x54)
        this.drawMegalithicWall(ctx, 21, 21, 54, 54, cPrimary, cLight, cDark);

        // Piattaforma sommitale con merlatura di vedetta
        this.drawBattlements(ctx, 21, 21, 54, 8, 8, 5);

        // Feritoie verticali strette per gli arcieri
        ctx.fillStyle = '#140f0b';
        ctx.fillRect(36, 42, 4, 16);
        ctx.fillRect(56, 42, 4, 16);

        // Braciere monumentale con fiamma e segnali di fumo
        ctx.fillStyle = '#1c1510';
        ctx.fillRect(42, 42, 12, 12);
        ctx.strokeStyle = cTrim;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(42, 42, 12, 12);

        const beaconGrad = ctx.createRadialGradient(48, 48, 2, 48, 48, 10);
        beaconGrad.addColorStop(0, '#ffffa3');
        beaconGrad.addColorStop(0.4, '#ff6a00');
        beaconGrad.addColorStop(1, 'rgba(180, 20, 0, 0)');
        ctx.fillStyle = beaconGrad;
        ctx.beginPath();
        ctx.arc(48, 48, 10, 0, Math.PI * 2);
        ctx.fill();
      }));

      // 6. Chariot Stable / Scuderia dei Carri da Guerra (3x3 tile = 144x144 px)
      this.buildingSprites.set(`chariot_stable_${owner}`, makeCanvas(144, 144, (ctx) => {
        this.drawMegalithicWall(ctx, 10, 10, 124, 124, '#544638', '#73614f', '#2b231c');

        // Tettoie aperte in legno e pali di cedro
        ctx.fillStyle = '#3d2817';
        ctx.fillRect(20, 20, 104, 30);
        this.drawBronzeAgeColumn(ctx, 28, 20, 50, 8, 6);
        this.drawBronzeAgeColumn(ctx, 72, 20, 50, 8, 6);
        this.drawBronzeAgeColumn(ctx, 116, 20, 50, 8, 6);

        // Mangiatoie e balle di fieno
        ctx.fillStyle = '#b8944d';
        ctx.fillRect(34, 26, 32, 14);
        ctx.fillRect(78, 26, 32, 14);

        // Carro da guerra smontato in manutenzione: ruote raggiate appoggiate alla parete
        ctx.strokeStyle = cTrim;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(40, 84, 14, 0, Math.PI * 2);
        ctx.arc(104, 84, 14, 0, Math.PI * 2);
        ctx.stroke();

        // Raggi ruote
        ctx.lineWidth = 1;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          ctx.beginPath();
          ctx.moveTo(40, 84); ctx.lineTo(40 + Math.cos(a) * 14, 84 + Math.sin(a) * 14);
          ctx.moveTo(104, 84); ctx.lineTo(104 + Math.cos(a) * 14, 84 + Math.sin(a) * 14);
          ctx.stroke();
        }

        // Timone e cassa del carro in legno curvo
        ctx.fillStyle = '#593a1f';
        ctx.fillRect(58, 74, 28, 30);
        ctx.fillStyle = cTrim;
        ctx.fillRect(62, 70, 20, 4);
      }));

      // 7. Iron Smelter / Forni di Riduzione del Ferro (3x3 tile = 144x144 px)
      this.buildingSprites.set(`iron_smelter_${owner}`, makeCanvas(144, 144, (ctx) => {
        // Mura scure e pesanti in blocchi di basalto nero e calcare
        this.drawMegalithicWall(ctx, 10, 10, 124, 124, '#2e2825', '#453d39', '#141210');

        // Grande fornace verticale di riduzione (bloomery) a torre conica
        const bloomGrad = ctx.createLinearGradient(48, 20, 96, 110);
        bloomGrad.addColorStop(0, '#524b47');
        bloomGrad.addColorStop(0.5, '#2e2a28');
        bloomGrad.addColorStop(1, '#171514');
        ctx.fillStyle = bloomGrad;
        ctx.beginPath();
        ctx.moveTo(60, 24);
        ctx.lineTo(84, 24);
        ctx.lineTo(98, 106);
        ctx.lineTo(46, 106);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0d0c0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bocca inferiore della fornace con grumo di ferro spugnoso (massello/bloom) incandescente
        ctx.fillStyle = '#ff3700';
        ctx.fillRect(62, 88, 20, 14);
        ctx.fillStyle = '#ffdd55';
        ctx.fillRect(66, 92, 12, 6);

        // Cumuli di minerale grezzo di ferro scuro (ematite) all'esterno
        ctx.fillStyle = '#3b3230';
        ctx.beginPath();
        ctx.ellipse(32, 96, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a3f3c';
        ctx.beginPath();
        ctx.ellipse(112, 96, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Canna fumaria sommitale con fumo denso
        ctx.fillStyle = '#12100f';
        ctx.fillRect(64, 16, 16, 8);
      }));
    }
  }

  public static getBuildingSprite(defId: string, owner: string): HTMLCanvasElement | null {
    const key = `${defId}_${owner}`;
    return this.buildingSprites.get(key) || this.buildingSprites.get(`${defId}_player`) || null;
  }

  // --- Rendering Animato Procedurale delle Unità dell'Età del Bronzo ---
  public static drawAnimatedUnit(
    ctx: CanvasRenderingContext2D,
    u: UnitEntity,
    cx: number,
    cy: number
  ): void {
    const isPlayer = u.owner === 'player';
    const cSkin = '#d49b6a';
    const cBronze = isPlayer ? '#c9933b' : '#8c1919';
    const cBronzeBright = isPlayer ? '#ffd166' : '#ff5c5c';

    const isMoving = u.state === 'MOVE_TO' || u.state === 'RETURN_CARGO' || u.state === 'HARVESTING';
    const animPhase = (Date.now() / 150) * (isMoving ? 1.0 : 0.2);
    const bob = isMoving ? Math.sin(animPhase) * 2.5 : 0;

    // Ombra a terra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, u.def.category === 'chariot' ? 22 : 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy + bob);

    if (u.defId === 'donkey_caravan') {
      // 1. CAROVANA CON ASINELLO & CESTE
      ctx.fillStyle = '#423326';
      ctx.fillRect(-10, 4, 3, 8 + (isMoving ? Math.sin(animPhase) * 3 : 0));
      ctx.fillRect(-4, 4, 3, 8 - (isMoving ? Math.sin(animPhase) * 3 : 0));
      ctx.fillRect(4, 4, 3, 8 + (isMoving ? Math.cos(animPhase) * 3 : 0));
      ctx.fillRect(10, 4, 3, 8 - (isMoving ? Math.cos(animPhase) * 3 : 0));

      ctx.fillStyle = '#6e5642';
      ctx.fillRect(-12, -4, 24, 12);

      ctx.fillRect(8, -12, 8, 12);
      ctx.fillStyle = '#543f2f';
      ctx.fillRect(12, -18, 3, 8);

      ctx.fillStyle = '#9e7947';
      ctx.fillRect(-8, -2, 16, 8);

      if (u.currentCargoAmount > 0) {
        let mineralColor = '#2de0a5';
        if (u.currentCargoType === 'tin') mineralColor = '#e0e6ed';
        if (u.currentCargoType === 'iron') mineralColor = '#241b18';
        ctx.fillStyle = mineralColor;
        ctx.fillRect(-6, -5, 12, 4);
      }
    } else if (u.defId === 'spear_militia') {
      // 2. MILIZIA CON SCUDO A TORRE E LANCIA
      ctx.fillStyle = '#8a6234';
      ctx.fillRect(-4, 4, 3, 8);
      ctx.fillRect(2, 4, 3, 8);

      ctx.fillStyle = '#e8dfcf';
      ctx.fillRect(-6, -6, 12, 11);

      ctx.fillStyle = cSkin;
      ctx.fillRect(-4, -14, 8, 8);

      // Grande scudo a torre miceneo
      ctx.fillStyle = cBronze;
      ctx.fillRect(-9, -10, 8, 18);
      ctx.fillStyle = cBronzeBright;
      ctx.fillRect(-7, -4, 4, 6);

      ctx.strokeStyle = '#543d2b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 10); ctx.lineTo(6, -20);
      ctx.stroke();

      ctx.fillStyle = cBronzeBright;
      ctx.beginPath();
      ctx.moveTo(6, -24); ctx.lineTo(3, -19); ctx.lineTo(9, -19);
      ctx.fill();
    } else if (u.defId === 'skirmisher') {
      // 3. FROMBOLIERE / GIAVELLOTTISTA
      ctx.fillStyle = '#8a6234';
      ctx.fillRect(-3, 4, 2.5, 8);
      ctx.fillRect(1, 4, 2.5, 8);

      ctx.fillStyle = '#c4a773';
      ctx.fillRect(-5, -6, 10, 11);

      ctx.fillStyle = cSkin;
      ctx.fillRect(-3, -13, 6, 7);

      ctx.strokeStyle = '#5c3818';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const fAngle = Date.now() / 80;
      ctx.arc(8, -6, 7, fAngle, fAngle + 2);
      ctx.stroke();
    } else if (u.defId === 'bronze_swordsman') {
      // 4. GUERRIERO CON SPADA KHOPESH
      ctx.fillStyle = cSkin;
      ctx.fillRect(-4, 4, 3, 8);
      ctx.fillRect(2, 4, 3, 8);

      ctx.fillStyle = cBronze;
      ctx.fillRect(-6, -7, 12, 12);
      ctx.fillStyle = cBronzeBright;
      ctx.fillRect(-4, -5, 8, 8);

      ctx.fillStyle = cSkin;
      ctx.fillRect(-4, -14, 8, 7);
      ctx.fillStyle = '#a62424';
      ctx.fillRect(-2, -18, 4, 5);

      ctx.strokeStyle = cBronzeBright;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, -2);
      ctx.lineTo(12, -8);
      ctx.lineTo(16, -5);
      ctx.stroke();
    } else if (u.defId === 'war_chariot') {
      // 5. CARRO DA GUERRA REALE
      ctx.fillStyle = '#8c5828';
      ctx.fillRect(0, -12, 18, 10);
      ctx.fillRect(0, 2, 18, 10);

      ctx.fillStyle = '#593412';
      ctx.fillRect(2, 10, 3, 6);
      ctx.fillRect(12, 10, 3, 6);

      ctx.fillStyle = '#422a16';
      ctx.fillRect(-16, -8, 16, 16);

      ctx.strokeStyle = cBronze;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-8, -10, 6, 0, Math.PI * 2);
      ctx.arc(-8, 10, 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = cSkin;
      ctx.fillRect(-12, -4, 6, 6);
      ctx.fillStyle = cBronzeBright;
      ctx.fillRect(-12, -2, 6, 4);
    } else if (u.defId === 'iron_infantry') {
      // 6. FANTERIA PESANTE IN FERRO
      ctx.fillStyle = '#2b231d';
      ctx.fillRect(-4, 4, 3, 8);
      ctx.fillRect(2, 4, 3, 8);

      ctx.fillStyle = '#2e2b2a';
      ctx.fillRect(-6, -7, 12, 12);
      ctx.fillStyle = '#7a7674';
      ctx.fillRect(-3, -4, 6, 6);

      ctx.fillStyle = '#1f1c1a';
      ctx.beginPath();
      ctx.arc(-7, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#999491';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.strokeStyle = '#4a3d31';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(5, 12); ctx.lineTo(7, -22);
      ctx.stroke();
      ctx.fillStyle = '#d4d8db';
      ctx.fillRect(5, -26, 4, 5);
    } else {
      // 7. INVASORE DEI POPOLI DEL MARE (Shardana)
      ctx.fillStyle = cSkin;
      ctx.fillRect(-4, 4, 3, 8);
      ctx.fillRect(2, 4, 3, 8);

      ctx.fillStyle = '#8c1919';
      ctx.fillRect(-5, -6, 10, 11);

      ctx.fillStyle = cSkin;
      ctx.fillRect(-3, -13, 6, 7);

      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -16); ctx.lineTo(-3, -12);
      ctx.moveTo(6, -16); ctx.lineTo(3, -12);
      ctx.stroke();

      ctx.fillStyle = '#3d1212';
      ctx.beginPath();
      ctx.arc(-6, -1, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd166';
      ctx.stroke();

      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(5, -2); ctx.lineTo(11, -8);
      ctx.stroke();
    }

    ctx.restore();
  }
}
