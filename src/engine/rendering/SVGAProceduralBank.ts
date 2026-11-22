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

  // --- Helper per Tetti a Falde Inclinate e Coppi dell'Età del Bronzo ---
  private static drawBronzeAgeRoof(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    baseColor = '#a8422b', // Terracotta levantina aranciata
    hiColor = '#d96548'
  ): void {
    // Sfumatura tetto spiovente a falda frontale
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, hiColor);
    g.addColorStop(0.3, baseColor);
    g.addColorStop(1, '#662416');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);

    // Scanalature e giunture dei coppi d'argilla
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1.2;
    for (let tx = x + 5; tx < x + w - 2; tx += 6) {
      ctx.beginPath();
      ctx.moveTo(tx, y);
      ctx.lineTo(tx, y + h);
      ctx.stroke();
    }
    for (let ty = y + 5; ty < y + h; ty += 6) {
      ctx.beginPath();
      ctx.moveTo(x, ty);
      ctx.lineTo(x + w, ty);
      ctx.stroke();
    }

    // Cornicione di grondaia in rilievo
    ctx.fillStyle = '#42160d';
    ctx.fillRect(x - 2, y + h - 2, w + 4, 3);
    ctx.fillStyle = '#fce788';
    ctx.fillRect(x - 2, y + h - 1, w + 4, 1);
  }

  // --- Helper per Mura in Pietra Calcarea Levantina ad Alto Contrasto ---
  private static drawAshlarWall(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    wallColor = '#d4cbbd', // Pietra calcarea chiara molto leggibile
    shadeColor = '#948a7b',
    shadowColor = '#4a4237'
  ): void {
    // Corpo muro
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, wallColor);
    g.addColorStop(0.7, shadeColor);
    g.addColorStop(1, shadowColor);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);

    // Bordo squadrato
    ctx.strokeStyle = '#383127';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    // Conci di pietra a file sfalsate con chiaroscuro SVGA
    const rowH = 10;
    let rIdx = 0;
    for (let cy = y; cy < y + h - 1; cy += rowH) {
      const curH = Math.min(rowH, (y + h) - cy);
      const shift = (rIdx % 2) * 10;

      for (let cx = x - shift; cx < x + w; cx += 20) {
        const bx = Math.max(x, cx);
        const bw = Math.min(19, (x + w) - bx);
        if (bw <= 2) continue;

        // Linea di malta orizzontale e verticale
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.strokeRect(bx, cy, bw, curH);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.strokeRect(bx + 1, cy + 1, bw - 1, curH - 1);
      }
      rIdx++;
    }
  }

  // --- Colonne Frontali Scanalate con Riflesso Cilindrico ---
  private static drawColumn(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color = '#9e2a2b',
    capColor = '#f5c542'
  ): void {
    // Fusto colonna con sfumatura cilindrica
    const colG = ctx.createLinearGradient(x, y, x + w, y);
    colG.addColorStop(0, '#591617');
    colG.addColorStop(0.35, '#e64548');
    colG.addColorStop(0.7, color);
    colG.addColorStop(1, '#3b0d0e');
    ctx.fillStyle = colG;
    ctx.fillRect(x, y, w, h);

    // Capitello dorato in rilievo
    ctx.fillStyle = capColor;
    ctx.fillRect(x - 2, y - 3, w + 4, 4);
    ctx.strokeStyle = '#422803';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 2, y - 3, w + 4, 4);

    // Base in pietra
    ctx.fillStyle = '#7a7063';
    ctx.fillRect(x - 2, y + h - 2, w + 4, 4);
  }

  // --- Ritratti Consiglieri Storici ---
  private static initAdvisorPortraits(): void {
    // 1. Burna-Khabir (Scriba anziano con barba nobile e copricapo levantino)
    this.advisorPortraits.set('burna_khabir', makeCanvas(64, 64, (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, '#2e261f');
      grad.addColorStop(1, '#14100c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      // Copricapo cilindrico levantino color porpora e oro
      ctx.fillStyle = '#6b1d2e';
      ctx.fillRect(20, 8, 24, 15);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(18, 20, 28, 4);

      // Viso anziano
      ctx.fillStyle = '#dca275';
      ctx.fillRect(24, 23, 16, 17);

      // Occhi espressivi
      ctx.fillStyle = '#1c130d';
      ctx.fillRect(27, 28, 3, 2);
      ctx.fillRect(34, 28, 3, 2);

      // Barba folta a onde
      ctx.fillStyle = '#382b20';
      ctx.fillRect(20, 36, 24, 18);
      ctx.fillRect(24, 54, 16, 6);

      // Toga bianca di lino con fascia rossa
      ctx.fillStyle = '#f5efe6';
      ctx.beginPath();
      ctx.ellipse(32, 68, 26, 18, 0, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#8c1919';
      ctx.fillRect(26, 52, 12, 12);

      ctx.strokeStyle = '#c9933b';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 62);
    }));

    // 2. Tarkhunta (Mastro Fabbro)
    this.advisorPortraits.set('tarkhunta', makeCanvas(64, 64, (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, '#381c15');
      grad.addColorStop(1, '#140805');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      // Fascia di cuoio e capelli scuri
      ctx.fillStyle = '#17110d';
      ctx.fillRect(20, 12, 24, 10);
      ctx.fillStyle = '#b85d18';
      ctx.fillRect(18, 19, 28, 4);

      ctx.fillStyle = '#c78255';
      ctx.fillRect(24, 21, 16, 18);

      // Fuliggine e barba
      ctx.fillStyle = 'rgba(20, 15, 10, 0.55)';
      ctx.fillRect(26, 27, 7, 5);

      ctx.fillStyle = '#1f1610';
      ctx.fillRect(22, 35, 20, 18);

      // Grembiule di cuoio spesso
      ctx.fillStyle = '#5c351c';
      ctx.beginPath();
      ctx.ellipse(32, 68, 26, 18, 0, Math.PI, 0);
      ctx.fill();

      // Martello stilizzato sulla spalla
      ctx.fillStyle = '#8f8881';
      ctx.fillRect(12, 42, 8, 14);

      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 62);
    }));

    // 3. Zalpa (Capitana degli Esploratori)
    this.advisorPortraits.set('zalpa', makeCanvas(64, 64, (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, '#1c2826');
      grad.addColorStop(1, '#0c1412');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      // Diadema in bronzo
      ctx.fillStyle = '#1a130e';
      ctx.fillRect(20, 12, 24, 10);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(18, 18, 28, 5);

      ctx.fillStyle = '#dca275';
      ctx.fillRect(24, 21, 16, 18);

      // Occhi attenti da vedetta
      ctx.fillStyle = '#17120e';
      ctx.fillRect(27, 26, 3, 2);
      ctx.fillRect(34, 26, 3, 2);

      // Mantello verde e sciarpa levantina
      ctx.fillStyle = '#225e52';
      ctx.beginPath();
      ctx.ellipse(32, 68, 26, 18, 0, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#2de0a5';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 62);
    }));
  }

  // --- Sprite Edifici ad Alto Livello di Dettaglio SVGA Anni '90 ---
  private static initBuildingSprites(): void {
    const owners: ('player' | 'sea_peoples')[] = ['player', 'sea_peoples'];

    for (const owner of owners) {
      const isPlayer = owner === 'player';
      const cRoof = isPlayer ? '#9e2a2b' : '#3b1212';
      const cRoofHi = isPlayer ? '#d94144' : '#692020';
      const cTrim = isPlayer ? '#ffd166' : '#ff4d4d';

      // 0. Cyclopean Slab / Fondamenta Ciclopiche (2x2 = 96x96 px)
      this.buildingSprites.set(`cyclopean_slab_${owner}`, makeCanvas(96, 96, (ctx) => {
        // Terrapieno in massi megalitici poligonali ben visibile dal terreno
        ctx.fillStyle = '#2e261f';
        ctx.fillRect(0, 0, 96, 96);

        const slabs = [
          [2, 2, 44, 44], [48, 2, 46, 44],
          [2, 48, 44, 46], [48, 48, 46, 46]
        ];

        slabs.forEach(([x, y, w, h]) => {
          const g = ctx.createLinearGradient(x, y, x + w, y + h);
          g.addColorStop(0, '#c7baa9');
          g.addColorStop(0.4, '#8f8373');
          g.addColorStop(1, '#544b3f');
          ctx.fillStyle = g;
          ctx.fillRect(x, y, w, h);

          // Bevel 3D anni '90 (bordo chiaro in alto-sinistra, scuro in basso-destra)
          ctx.strokeStyle = '#ded5c7';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x, y, w, h);

          // Crepe decorative
          ctx.strokeStyle = '#382f25';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 10, y + 6); ctx.lineTo(x + 18, y + 20); ctx.lineTo(x + 32, y + 24);
          ctx.stroke();
        });

        // Borchia centrale di legamento in bronzo
        ctx.fillStyle = cTrim;
        ctx.fillRect(42, 42, 12, 12);
        ctx.strokeStyle = '#2b1c04';
        ctx.strokeRect(42, 42, 12, 12);
      }));

      // 1. Acropolis / Megaron del Wanax (4x4 = 192x192 px)
      this.buildingSprites.set(`acropolis_${owner}`, makeCanvas(192, 192, (ctx) => {
        // Ombra diagonale proiettata a terra verso destra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(16, 20, 168, 164);

        // 1. Basamento a gradoni monumentale (Podio in pietra calcarea chiara)
        this.drawAshlarWall(ctx, 12, 18, 168, 166, '#ded6c8', '#b0a594', '#665d50');

        // Scalinata frontale d'ingresso
        for (let st = 0; st < 4; st++) {
          const stepY = 158 + st * 6;
          ctx.fillStyle = '#ebdcc7';
          ctx.fillRect(66 - st * 3, stepY, 60 + st * 6, 5);
          ctx.strokeStyle = '#473d31';
          ctx.strokeRect(66 - st * 3, stepY, 60 + st * 6, 5);
        }

        // 2. Corpo principale del Megaron
        this.drawAshlarWall(ctx, 28, 48, 136, 110, '#f0e8dc', '#c2b6a3', '#7a6f5e');

        // 3. Tetto frontale spiovente a due falde con tegole in terracotta
        this.drawBronzeAgeRoof(ctx, 24, 26, 144, 38, cRoof, cRoofHi);

        // 4. Frontone triangolare monumentale sopra le colonne
        ctx.fillStyle = '#ebdcc7';
        ctx.beginPath();
        ctx.moveTo(28, 64);
        ctx.lineTo(96, 28);
        ctx.lineTo(164, 64);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#594d3d';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rilievo centrale dorato sul frontone (Disco solare / Toro sacro)
        ctx.fillStyle = cTrim;
        ctx.beginPath();
        ctx.arc(96, 48, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#422a03';
        ctx.stroke();

        // 5. Porticato frontale a 6 colonne di cedro slanciate
        const colPositions = [36, 58, 80, 112, 134, 156];
        for (const cx of colPositions) {
          this.drawColumn(ctx, cx - 4, 64, 8, 88, '#9e2a2b', cTrim);
        }

        // 6. Portale monumentale in legno scuro e bronzo
        ctx.fillStyle = '#1c140d';
        ctx.fillRect(84, 88, 24, 68);
        ctx.strokeStyle = cTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(84, 88, 24, 68);

        // Borchie di bronzo sulle ante
        ctx.fillStyle = cTrim;
        ctx.fillRect(88, 106, 4, 4);
        ctx.fillRect(100, 106, 4, 4);
        ctx.fillRect(88, 128, 4, 4);
        ctx.fillRect(100, 128, 4, 4);

        // 7. Stendardi verticali ai lati
        ctx.fillStyle = '#614830';
        ctx.fillRect(20, 48, 4, 52);
        ctx.fillRect(168, 48, 4, 52);

        ctx.fillStyle = isPlayer ? '#2de0a5' : '#e63946';
        ctx.fillRect(24, 52, 14, 28);
        ctx.fillRect(154, 52, 14, 28);
        ctx.strokeStyle = cTrim;
        ctx.strokeRect(24, 52, 14, 28);
        ctx.strokeRect(154, 52, 14, 28);
      }));

      // 2. Bronze Foundry / Fonderia del Bronzo (3x3 = 144x144 px)
      this.buildingSprites.set(`bronze_foundry_${owner}`, makeCanvas(144, 144, (ctx) => {
        // Ombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.fillRect(12, 14, 124, 124);

        // Muro di cinta e corpo officina in pietra
        this.drawAshlarWall(ctx, 10, 18, 124, 118, '#c9bfb1', '#9e9485', '#574e41');

        // Tettoia spiovente a sinistra
        this.drawBronzeAgeRoof(ctx, 12, 16, 68, 36, cRoof, cRoofHi);

        // Due alte ciminiere verticali in mattoni refrattari
        const chimneys = [88, 114];
        for (const chx of chimneys) {
          const chG = ctx.createLinearGradient(chx, 10, chx + 14, 10);
          chG.addColorStop(0, '#594435');
          chG.addColorStop(0.5, '#876953');
          chG.addColorStop(1, '#3b2c21');
          ctx.fillStyle = chG;
          ctx.fillRect(chx, 14, 16, 56);
          ctx.strokeStyle = '#241b14';
          ctx.strokeRect(chx, 14, 16, 56);

          // Bocca del camino con fumo
          ctx.fillStyle = '#140f0c';
          ctx.fillRect(chx - 2, 10, 20, 6);
        }

        // Grande fornace a cupola aperta al centro
        ctx.fillStyle = '#2b1b11';
        ctx.beginPath();
        ctx.ellipse(50, 84, 26, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bagliore del metallo fuso incandescente (oro e rame)
        const fireG = ctx.createRadialGradient(50, 84, 2, 50, 84, 18);
        fireG.addColorStop(0, '#ffffff');
        fireG.addColorStop(0.35, '#ffdd33');
        fireG.addColorStop(0.7, '#ff5500');
        fireG.addColorStop(1, 'rgba(150, 20, 0, 0)');
        ctx.fillStyle = fireG;
        ctx.beginPath();
        ctx.ellipse(50, 84, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gru / Argano di sollevamento in legno per scaricare le carovane
        ctx.fillStyle = '#5c3d21';
        ctx.fillRect(92, 68, 6, 54);
        ctx.fillRect(72, 68, 32, 6);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(76, 74); ctx.lineTo(76, 96);
        ctx.stroke();
        ctx.fillStyle = cTrim;
        ctx.fillRect(73, 96, 6, 6); // Gancio

        // Pila di lingotti di bronzo lucenti (Oxhide Ingots) all'esterno
        for (let i = 0; i < 3; i++) {
          const ingG = ctx.createLinearGradient(92 + i * 10, 110, 108 + i * 10, 122);
          ingG.addColorStop(0, '#ffd166');
          ingG.addColorStop(0.6, '#c9933b');
          ingG.addColorStop(1, '#694711');
          ctx.fillStyle = ingG;
          ctx.fillRect(86 + i * 12, 116 - i * 4, 16, 8);
          ctx.strokeStyle = '#382204';
          ctx.strokeRect(86 + i * 12, 116 - i * 4, 16, 8);
        }
      }));

      // 3. Granary / Granaio (2x2 = 96x96 px)
      this.buildingSprites.set(`granary_${owner}`, makeCanvas(96, 96, (ctx) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(10, 12, 80, 80);

        // Basamento circolare in pietra calcarea
        this.drawAshlarWall(ctx, 12, 28, 72, 62, '#ded6c8', '#b3a896', '#665d50');

        // Tetto conico a falde in argilla e paglia
        const coneG = ctx.createLinearGradient(12, 6, 84, 40);
        coneG.addColorStop(0, '#e8aa58');
        coneG.addColorStop(0.6, '#9e6d31');
        coneG.addColorStop(1, '#543612');
        ctx.fillStyle = coneG;
        ctx.beginPath();
        ctx.moveTo(48, 6);
        ctx.lineTo(88, 36);
        ctx.lineTo(8, 36);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3b240a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Finestrella superiore di carico
        ctx.fillStyle = '#261b11';
        ctx.fillRect(43, 20, 10, 8);
        ctx.strokeStyle = cTrim;
        ctx.strokeRect(43, 20, 10, 8);

        // Grande porta d'accesso con sacchi di grano appoggiati
        ctx.fillStyle = '#362213';
        ctx.fillRect(38, 54, 20, 36);
        ctx.strokeStyle = cTrim;
        ctx.strokeRect(38, 54, 20, 36);

        // Sacchi di grano di lino
        const sacks = [
          { x: 24, y: 76, r: 6 }, { x: 30, y: 80, r: 7 },
          { x: 66, y: 78, r: 7 }, { x: 73, y: 82, r: 6 }
        ];
        for (const s of sacks) {
          ctx.fillStyle = '#e8d8be';
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#574833';
          ctx.stroke();
        }
      }));

      // 4. Barracks / Caserma delle Milizie (3x3 = 144x144 px)
      this.buildingSprites.set(`barracks_${owner}`, makeCanvas(144, 144, (ctx) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.fillRect(10, 14, 126, 122);

        // Mura forti in pietra
        this.drawAshlarWall(ctx, 8, 16, 128, 120, '#d6cec0', '#a39989', '#574e41');

        // Tetto frontale spiovente con tegole rosse
        this.drawBronzeAgeRoof(ctx, 8, 14, 128, 32, cRoof, cRoofHi);

        // Cortile d'armi interno
        ctx.fillStyle = '#b89f74';
        ctx.fillRect(20, 48, 104, 76);
        ctx.strokeStyle = '#473a26';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(20, 48, 104, 76);

        // Portone d'accesso fortificato con arco in pietra
        ctx.fillStyle = '#261b11';
        ctx.fillRect(58, 88, 28, 36);
        ctx.strokeStyle = cTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(58, 88, 28, 36);

        // Rastrelliere con scudi e lance da guerra
        const shieldPositions = [28, 44, 92, 108];
        for (const sx of shieldPositions) {
          // Scudo a torre
          ctx.fillStyle = cTrim;
          ctx.fillRect(sx, 58, 10, 18);
          ctx.strokeStyle = '#291b05';
          ctx.strokeRect(sx, 58, 10, 18);

          // Lancia
          ctx.strokeStyle = '#594433';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx + 5, 50); ctx.lineTo(sx + 5, 82);
          ctx.stroke();
        }

        // Stendardo di battaglia appeso sulla porta
        ctx.fillStyle = isPlayer ? '#2de0a5' : '#e63946';
        ctx.fillRect(62, 56, 20, 26);
        ctx.strokeStyle = cTrim;
        ctx.strokeRect(62, 56, 20, 26);
      }));

      // 5. Watchtower / Torre di Vedetta Ciclopica (2x2 = 96x96 px)
      this.buildingSprites.set(`watchtower_${owner}`, makeCanvas(96, 96, (ctx) => {
        // Ombra verticale slanciata
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(16, 12, 70, 78);

        // Fusto della torre alto a 3 livelli con sfumatura di luce
        const twG = ctx.createLinearGradient(24, 0, 72, 0);
        twG.addColorStop(0, '#a69c8e');
        twG.addColorStop(0.4, '#f0e8dc');
        twG.addColorStop(1, '#544a3e');
        ctx.fillStyle = twG;
        ctx.fillRect(24, 16, 48, 74);
        ctx.strokeStyle = '#383025';
        ctx.lineWidth = 2;
        ctx.strokeRect(24, 16, 48, 74);

        // Tetto a spiovente superiore protetto
        this.drawBronzeAgeRoof(ctx, 16, 6, 64, 18, cRoof, cRoofHi);

        // Piattaforma di guardia con feritoie verticali
        ctx.fillStyle = '#1c150f';
        ctx.fillRect(34, 34, 6, 18);
        ctx.fillRect(56, 34, 6, 18);

        // Portone alla base
        ctx.fillStyle = '#291c12';
        ctx.fillRect(38, 64, 20, 26);
        ctx.strokeStyle = cTrim;
        ctx.strokeRect(38, 64, 20, 26);

        // Braciere di segnalazione sul balcone
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(48, 28, 5, 0, Math.PI * 2);
        ctx.fill();
      }));

      // 6. Chariot Stable / Scuderia dei Carri da Guerra (3x3 = 144x144 px)
      this.buildingSprites.set(`chariot_stable_${owner}`, makeCanvas(144, 144, (ctx) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(10, 14, 126, 122);

        this.drawAshlarWall(ctx, 8, 16, 128, 120, '#d6cec0', '#a39989', '#574e41');
        this.drawBronzeAgeRoof(ctx, 8, 14, 128, 30, cRoof, cRoofHi);

        // Area paddock e scuderia
        ctx.fillStyle = '#9c8158';
        ctx.fillRect(18, 46, 108, 80);

        // Colonne di legno per le stalle
        this.drawColumn(ctx, 28, 48, 6, 76, '#734624', '#fce788');
        this.drawColumn(ctx, 68, 48, 6, 76, '#734624', '#fce788');
        this.drawColumn(ctx, 108, 48, 6, 76, '#734624', '#fce788');

        // Due grandi ruote raggiate di carro in bronzo appoggiate alla parete
        const wheelXs = [46, 88];
        for (const wx of wheelXs) {
          ctx.strokeStyle = cTrim;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(wx, 88, 14, 0, Math.PI * 2);
          ctx.stroke();

          ctx.lineWidth = 1.2;
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
            ctx.beginPath();
            ctx.moveTo(wx, 88);
            ctx.lineTo(wx + Math.cos(a) * 14, 88 + Math.sin(a) * 14);
            ctx.stroke();
          }
        }
      }));

      // 7. Iron Smelter / Forni di Riduzione del Ferro (3x3 = 144x144 px)
      this.buildingSprites.set(`iron_smelter_${owner}`, makeCanvas(144, 144, (ctx) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(10, 14, 126, 122);

        // Mura pesanti in blocchi di basalto scuro
        this.drawAshlarWall(ctx, 8, 16, 128, 120, '#59534f', '#3b3633', '#1f1c1a');

        // Torre conica da fusione del ferro (bloomery)
        const bloomG = ctx.createLinearGradient(48, 10, 96, 90);
        bloomG.addColorStop(0, '#69605b');
        bloomG.addColorStop(0.5, '#3d3733');
        bloomG.addColorStop(1, '#1c1917');
        ctx.fillStyle = bloomG;
        ctx.beginPath();
        ctx.moveTo(56, 16);
        ctx.lineTo(88, 16);
        ctx.lineTo(104, 100);
        ctx.lineTo(40, 100);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#120f0e';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bocca del forno con massello di ferro incandescente ardente
        ctx.fillStyle = '#ff2b00';
        ctx.fillRect(58, 80, 28, 18);
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(62, 84, 20, 10);

        // Cumuli di minerale grezzo di ferro scuro (ematite) all'esterno
        ctx.fillStyle = '#38322e';
        ctx.beginPath(); ctx.ellipse(28, 98, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#473f3b';
        ctx.beginPath(); ctx.ellipse(116, 98, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
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
    const cSkin = '#dca275';
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

      ctx.fillStyle = '#f5efe6';
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
