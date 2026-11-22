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

  // --- Ritratti Consiglieri Storici ---
  private static initAdvisorPortraits(): void {
    // 1. Burna-Khabir (Scriba dell'Archivio con barba e tavoletta cuneiforme)
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

      // Bordo e cornice
      ctx.strokeStyle = '#c9933b';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 62);
    }));

    // 2. Tarkhunta (Gran Maestro dei Forni - viso segnato dal carbone, mantello da fabbro)
    this.advisorPortraits.set('tarkhunta', makeCanvas(64, 64, (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, '#361b14');
      grad.addColorStop(1, '#170c09');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      // Viso e fuliggine
      ctx.fillStyle = '#c48558';
      ctx.fillRect(24, 20, 16, 18);
      ctx.fillStyle = 'rgba(20, 15, 10, 0.4)';
      ctx.fillRect(26, 26, 8, 5); // Macchia di fuliggine sulla guancia

      // Capelli scuri e fascia di cuoio
      ctx.fillStyle = '#1c1511';
      ctx.fillRect(21, 14, 22, 8);
      ctx.fillStyle = '#7a3e23';
      ctx.fillRect(20, 20, 24, 4);

      // Barba folta scura
      ctx.fillStyle = '#17120e';
      ctx.fillRect(22, 34, 20, 18);

      // Grembiule di cuoio da forgia
      ctx.fillStyle = '#59321f';
      ctx.beginPath();
      ctx.ellipse(32, 66, 24, 18, 0, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#c9933b';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 62);
    }));

    // 3. Zalpa (Capitana degli Esploratori e dei Carri)
    this.advisorPortraits.set('zalpa', makeCanvas(64, 64, (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, '#1c2826');
      grad.addColorStop(1, '#0c1412');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      // Fascia frontale in bronzo
      ctx.fillStyle = '#1a130e';
      ctx.fillRect(20, 14, 24, 10);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(20, 20, 24, 4);

      // Viso
      ctx.fillStyle = '#dca275';
      ctx.fillRect(24, 22, 16, 18);

      // Mantello verde e sciarpa di lino
      ctx.fillStyle = '#26594d';
      ctx.beginPath();
      ctx.ellipse(32, 66, 24, 18, 0, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#2de0a5';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 62, 62);
    }));
  }

  // --- Sprite Edifici dell'Età del Bronzo ---
  private static initBuildingSprites(): void {
    const owners: ('player' | 'sea_peoples')[] = ['player', 'sea_peoples'];

    for (const owner of owners) {
      const isPlayer = owner === 'player';
      const cPrimary = isPlayer ? '#7a5a3a' : '#542626';
      const cTrim = isPlayer ? '#c9933b' : '#a83232';

      // 1. Acropolis / Megaron (4x4 tile = 192x192 px)
      this.buildingSprites.set(`acropolis_${owner}`, makeCanvas(192, 192, (ctx) => {
        // Terrazza megalitica
        ctx.fillStyle = '#3d3429';
        ctx.fillRect(10, 10, 172, 172);

        // Mura in mattoni d'argilla cotta e pietra
        ctx.fillStyle = cPrimary;
        ctx.fillRect(24, 24, 144, 144);

        // Tetto a terrazza
        ctx.fillStyle = '#8f6b47';
        ctx.fillRect(36, 36, 120, 120);

        // Colonne rastremate di cedro (rosse in stile miceneo/minoico)
        ctx.fillStyle = '#a62424';
        for (let x = 48; x <= 144; x += 32) {
          ctx.fillRect(x, 140, 14, 30);
          ctx.fillStyle = '#f5efe6';
          ctx.fillRect(x - 2, 137, 18, 4); // Capitello
          ctx.fillStyle = '#a62424';
        }

        // Focolare sacro centrale (apertura nel tetto del Megaron)
        ctx.fillStyle = '#1c1511';
        ctx.fillRect(76, 76, 40, 40);
        ctx.fillStyle = '#e65c00';
        ctx.beginPath();
        ctx.arc(96, 96, 12, 0, Math.PI * 2);
        ctx.fill();

        // Bordo in rilievo dorato/bronzo
        ctx.strokeStyle = cTrim;
        ctx.lineWidth = 3;
        ctx.strokeRect(24, 24, 144, 144);
      }));

      // 2. Bronze Foundry / Fonderia del Bronzo (3x3 tile = 144x144 px)
      this.buildingSprites.set(`bronze_foundry_${owner}`, makeCanvas(144, 144, (ctx) => {
        ctx.fillStyle = '#382f27';
        ctx.fillRect(8, 8, 128, 128);

        // Fonderia in mattoni refrattari
        ctx.fillStyle = '#5c483a';
        ctx.fillRect(18, 18, 108, 108);

        // Forno a cupola con metallo fuso incandescente
        ctx.fillStyle = '#291d16';
        ctx.beginPath();
        ctx.arc(72, 60, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff7b00';
        ctx.beginPath();
        ctx.arc(72, 60, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.arc(72, 60, 10, 0, Math.PI * 2);
        ctx.fill();

        // Lingotti di bronzo a pelle di bue (oxhide ingots) impilati all'esterno
        ctx.fillStyle = '#c9933b';
        ctx.fillRect(28, 104, 22, 14);
        ctx.fillRect(56, 104, 22, 14);
        ctx.fillRect(84, 104, 22, 14);

        ctx.strokeStyle = cTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 18, 108, 108);
      }));

      // 3. Granary / Granaio (2x2 tile = 96x96 px)
      this.buildingSprites.set(`granary_${owner}`, makeCanvas(96, 96, (ctx) => {
        ctx.fillStyle = '#332a21';
        ctx.fillRect(6, 6, 84, 84);

        // Silos circolare in argilla e fango
        ctx.fillStyle = '#a6825a';
        ctx.beginPath();
        ctx.arc(48, 48, 36, 0, Math.PI * 2);
        ctx.fill();

        // Cupola conica con canna di giunco
        ctx.fillStyle = '#7a5a3a';
        ctx.beginPath();
        ctx.arc(48, 48, 22, 0, Math.PI * 2);
        ctx.fill();

        // Spighe e sacchi di grano all'ingresso
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(48, 48, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = cTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(6, 6, 84, 84);
      }));

      // 4. Barracks / Caserma delle Milizie (3x3 tile = 144x144 px)
      this.buildingSprites.set(`barracks_${owner}`, makeCanvas(144, 144, (ctx) => {
        ctx.fillStyle = '#382f27';
        ctx.fillRect(8, 8, 128, 128);

        ctx.fillStyle = cPrimary;
        ctx.fillRect(18, 18, 108, 108);

        // Cortile interno d'addestramento (sabbia)
        ctx.fillStyle = '#c4a773';
        ctx.fillRect(36, 36, 72, 72);

        // Rastrelliere con scudi e lance
        ctx.strokeStyle = '#2b1c11';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(42, 45); ctx.lineTo(65, 45);
        ctx.moveTo(42, 55); ctx.lineTo(65, 55);
        ctx.stroke();

        ctx.fillStyle = '#b8944d';
        ctx.beginPath();
        ctx.arc(85, 52, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = cTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 18, 108, 108);
      }));

      // 5. Watchtower / Torre Ciclopica (2x2 tile = 96x96 px)
      this.buildingSprites.set(`watchtower_${owner}`, makeCanvas(96, 96, (ctx) => {
        ctx.fillStyle = '#261f18';
        ctx.fillRect(8, 8, 80, 80);

        // Struttura piramidale a gradoni in blocchi megalitici
        ctx.fillStyle = '#544638';
        ctx.fillRect(16, 16, 64, 64);

        ctx.fillStyle = '#7a6754';
        ctx.fillRect(26, 26, 44, 44);

        // Braciere di segnalazione sul tetto
        ctx.fillStyle = '#1c1511';
        ctx.fillRect(40, 40, 16, 16);
        ctx.fillStyle = '#ff6a00';
        ctx.beginPath();
        ctx.arc(48, 48, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = cTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(16, 16, 64, 64);
      }));
    }
  }

  public static getBuildingSprite(defId: string, owner: string): HTMLCanvasElement | null {
    const key = `${defId}_${owner}`;
    return this.buildingSprites.get(key) || null;
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

    // Bobbing / rimbalzo dei passi durante la marcia
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
      // Zampe che camminano
      ctx.fillStyle = '#423326';
      ctx.fillRect(-10, 4, 3, 8 + (isMoving ? Math.sin(animPhase) * 3 : 0));
      ctx.fillRect(-4, 4, 3, 8 - (isMoving ? Math.sin(animPhase) * 3 : 0));
      ctx.fillRect(4, 4, 3, 8 + (isMoving ? Math.cos(animPhase) * 3 : 0));
      ctx.fillRect(10, 4, 3, 8 - (isMoving ? Math.cos(animPhase) * 3 : 0));

      // Corpo asino
      ctx.fillStyle = '#6e5642';
      ctx.fillRect(-12, -4, 24, 12);

      // Collo e testa con lunghe orecchie
      ctx.fillRect(8, -12, 8, 12);
      ctx.fillStyle = '#543f2f';
      ctx.fillRect(12, -18, 3, 8); // Orecchio

      // Ceste di giunco laterali con minerale colorato
      ctx.fillStyle = '#9e7947';
      ctx.fillRect(-8, -2, 16, 8);

      if (u.currentCargoAmount > 0) {
        // Colore minerale: verde rame, argento stagno, scuro ferro
        let mineralColor = '#2de0a5';
        if (u.currentCargoType === 'tin') mineralColor = '#e0e6ed';
        if (u.currentCargoType === 'iron') mineralColor = '#241b18';
        ctx.fillStyle = mineralColor;
        ctx.fillRect(-6, -5, 12, 4);
      }
    } else if (u.defId === 'spear_militia') {
      // 2. MILIZIA CON SCUDO A TORRE E LANCIA
      // Gambe
      ctx.fillStyle = '#8a6234';
      ctx.fillRect(-4, 4, 3, 8);
      ctx.fillRect(2, 4, 3, 8);

      // Busto e tunica
      ctx.fillStyle = '#e8dfcf';
      ctx.fillRect(-6, -6, 12, 11);

      // Testa
      ctx.fillStyle = cSkin;
      ctx.fillRect(-4, -14, 8, 8);

      // Grande scudo a torre rettangolare miceneo (frontale)
      ctx.fillStyle = cBronze;
      ctx.fillRect(-9, -10, 8, 18);
      ctx.fillStyle = cBronzeBright;
      ctx.fillRect(-7, -4, 4, 6); // Borchia centrale

      // Lunga lancia in bronzo
      ctx.strokeStyle = '#543d2b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 10); ctx.lineTo(6, -20);
      ctx.stroke();

      // Punta lancia
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

      // Fionda di cuoio roteante
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

      // Corazza scintillante in bronzo
      ctx.fillStyle = cBronze;
      ctx.fillRect(-6, -7, 12, 12);
      ctx.fillStyle = cBronzeBright;
      ctx.fillRect(-4, -5, 8, 8);

      // Elmo con cresta
      ctx.fillStyle = cSkin;
      ctx.fillRect(-4, -14, 8, 7);
      ctx.fillStyle = '#a62424';
      ctx.fillRect(-2, -18, 4, 5);

      // Spada ricurva Khopesh
      ctx.strokeStyle = cBronzeBright;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, -2);
      ctx.lineTo(12, -8);
      ctx.lineTo(16, -5); // Curva a falce
      ctx.stroke();
    } else if (u.defId === 'war_chariot') {
      // 5. CARRO DA GUERRA REALE (2 Cavalli + Carro)
      // Cavalli gemelli
      ctx.fillStyle = '#8c5828';
      ctx.fillRect(0, -12, 18, 10);
      ctx.fillRect(0, 2, 18, 10);

      // Gambe cavalli
      ctx.fillStyle = '#593412';
      ctx.fillRect(2, 10, 3, 6);
      ctx.fillRect(12, 10, 3, 6);

      // Timone di traino e carro
      ctx.fillStyle = '#422a16';
      ctx.fillRect(-16, -8, 16, 16);

      // Ruote raggiate
      ctx.strokeStyle = cBronze;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-8, -10, 6, 0, Math.PI * 2);
      ctx.arc(-8, 10, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Equipaggio (auriga + arciere con arco teso)
      ctx.fillStyle = cSkin;
      ctx.fillRect(-12, -4, 6, 6);
      ctx.fillStyle = cBronzeBright;
      ctx.fillRect(-12, -2, 6, 4);
    } else if (u.defId === 'iron_infantry') {
      // 6. FANTERIA PESANTE IN FERRO
      ctx.fillStyle = '#2b231d';
      ctx.fillRect(-4, 4, 3, 8);
      ctx.fillRect(2, 4, 3, 8);

      // Corazza scura in ferro battuto con borchie
      ctx.fillStyle = '#2e2b2a';
      ctx.fillRect(-6, -7, 12, 12);
      ctx.fillStyle = '#7a7674';
      ctx.fillRect(-3, -4, 6, 6);

      // Scudo tondo rinforzato in ferro
      ctx.fillStyle = '#1f1c1a';
      ctx.beginPath();
      ctx.arc(-7, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#999491';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Picca d'acciaio
      ctx.strokeStyle = '#4a3d31';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(5, 12); ctx.lineTo(7, -22);
      ctx.stroke();
      ctx.fillStyle = '#d4d8db';
      ctx.fillRect(5, -26, 4, 5);
    } else {
      // 7. INVASORE DEI POPOLI DEL MARE (Shardana con elmo cornuto)
      ctx.fillStyle = cSkin;
      ctx.fillRect(-4, 4, 3, 8);
      ctx.fillRect(2, 4, 3, 8);

      // Kilt a strisce e torace
      ctx.fillStyle = '#8c1919';
      ctx.fillRect(-5, -6, 10, 11);

      // Testa ed elmo cornuto
      ctx.fillStyle = cSkin;
      ctx.fillRect(-3, -13, 6, 7);

      // Corna d'ariete o dischi Shardana sull'elmo
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -16); ctx.lineTo(-3, -12);
      ctx.moveTo(6, -16); ctx.lineTo(3, -12);
      ctx.stroke();

      // Scudo tondo borchiato
      ctx.fillStyle = '#3d1212';
      ctx.beginPath();
      ctx.arc(-6, -1, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd166';
      ctx.stroke();

      // Spada dritta corta in bronzo
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(5, -2); ctx.lineTo(11, -8);
      ctx.stroke();
    }

    ctx.restore();
  }
}
