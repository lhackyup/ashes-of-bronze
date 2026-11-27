import { EventBus } from '../core/EventBus.ts';
import { SVGAProceduralBank } from '../engine/rendering/SVGAProceduralBank.ts';

export class PrologueModal {
  private overlayEl: HTMLElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private animId: number | null = null;
  private currentChapter: number = 0;

  public onBegin?: () => void;
  public onOpenMap?: () => void;
  public onClose?: () => void;

  private chapters = [
    {
      roman: 'I',
      subtitle: '1250 BC · The Fragile Web of Empires',
      title: 'The Splendor of the Bronze Age',
      quote: '"The Great Kings of Hatti, Egypt, and Babylon called each other brother. Ships with sails of purple carried copper and gold, and bronze held the sky above our heads."',
      paragraphs: [
        'For half a millennium, the eastern Mediterranean flourished beneath a golden web of commerce and diplomacy. From the cyclopean citadel of Mycenae to the fertile Nile Delta and the storied merchant quays of Ugarit, magnificent palace economies ruled the ancient world.',
        'Yet this entire globalized civilization balanced upon a single, delicate metallurgical paradox: bronze requires nine parts copper and one part tin. While copper was mined in abundance from the red hills of Alashiya (Cyprus), tin was impossibly scarce—hauled across thousands of miles over perilous mountain caravan trails from the distant ranges of Afghanistan.',
        'For centuries, the royal fleets kept the tin flowing and the chariot armories filled. It seemed an empire built to endure for eternity. But if the sea lanes broke and the trade routes severed, bronze would cease to exist—and with it, the very foundation of civilization.'
      ]
    },
    {
      roman: 'II',
      subtitle: '1200 BC · The Apocalypse of Drought & Fire',
      title: 'The Great Cataclysm',
      quote: '"The ships of the enemy came; they burned our cities and did evil things in our land... Our foot troops and chariots are in Hatti, our ships in Lycia. The land is left to itself." — King Ammurapi of Ugarit (Final Baked Clay Tablet, RS 20.238)',
      paragraphs: [
        'Within a single generation, the sky turned to ash. A sequence of catastrophic centennial megadroughts withered crops across the Mediterranean, drying rivers into dust and sparking mass starvation among the populations.',
        'Then, out of the churning horizon of the Great Green, came terror. Known only as the Sea Peoples—unforgiving warrior confederations of Shardana, Lukka, Peleset, and Shekelesh—they arrived with horned helmets, heavy round shields, and relentless galleys. Unlike past raiders, they brought women, children, and ox-carts: they came not merely to loot, but to settle upon the charred bones of the old world.',
        'Hattusa, the imperial capital of the Hittites, was leveled and burned to bedrock. The Mycenaean palaces collapsed in fire. Ugarit, the crown jewel of Mediterranean literature and commerce, was extinguished in a single afternoon—its final desperate tablet baked into terracotta by the flames that consumed the royal archives.'
      ]
    },
    {
      roman: 'III',
      subtitle: '1182 BC · The Sovereign Redoubt',
      title: 'The Mandate of Kadesh-on-Sea',
      quote: '"We are not kings, nor gods. We are smiths, farmers, and soldiers who refuse to lie down in the dust. Stand with us, and we will build a fortress that outlasts the storm."',
      paragraphs: [
        'Amidst the smoke of fallen realms, a solitary enclave stands upon the rocky bluffs of the Levant: Kadesh-on-Sea. Fleeing the destruction of Ugarit and the northern borderlands, thousands of refugees, artisans, and surviving palace guards have gathered behind your banners.',
        'You take command of this sanctuary alongside three veterans of the collapse:',
        '• Burna the Khabir: an exiled Babylonian master metallurgist who knows that when tin vanishes, survival demands unlocking the forbidden secrets of red-hot hematite and forced-draft blast smelting.',
        '• Tarkhunta: a battle-hardened Luwian chariot commander whose fierce discipline transforms terrified civilian refugees into an unyielding shield-wall of spear militia.',
        '• Zalpa: a fearless Syro-Cilician scout and ranger whose outrunners scour the mountains, light warning beacons, and guide lost survivors to safety.',
        'Your mandate is absolute: safeguard the surviving population, secure the final oxhide ingots of copper and tin, master iron metallurgy, and build cyclopean ramparts strong enough to break the sea invasion.'
      ]
    },
    {
      roman: 'IV',
      subtitle: 'The Mortal Stake · Oblivion or Rebirth',
      title: 'The Threat of Eternal Night',
      quote: '"No land could stand before their arms... All at once the lands were removed and scattered. If we fail here, the light of human thought will be buried beneath ashes for a thousand years."',
      paragraphs: [
        'The stakes of your struggle are larger than any single battlefield:',
        'If Kadesh-on-Sea falls, the last organized redoubt of agriculture, architecture, mathematics, metallurgy, and cuneiform writing in the Levant will be utterly wiped out. Humanity will plunge into a thousand years of illiterate darkness, savagery, and famine.',
        'No great king is coming to your rescue. The kings are dead, their palaces are ash, and Egypt has sealed its Delta behind desperate walls.',
        'You stand alone between humanity and the abyss. Take command of Kadesh, light the forge hearths, and lead your people through the ashes of bronze into the dawn of a New Age!'
      ]
    }
  ];

  constructor() {
    this.createDOM();
  }

  private createDOM(): void {
    const existing = document.getElementById('prologue-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'prologue-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, #1a110a 0%, #0c0805 60%, #030202 100%);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      user-select: none;
      overflow: hidden;
      backdrop-filter: blur(8px);
    `;

    overlay.innerHTML = `
      <!-- CANVAS FOR EMBER & ASH PARTICLES -->
      <canvas id="prologue-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;"></canvas>

      <!-- MAIN CONTAINER -->
      <div style="
        position: relative;
        z-index: 2;
        width: 92%;
        max-width: 920px;
        max-height: 90vh;
        background: linear-gradient(180deg, rgba(34, 24, 16, 0.96) 0%, rgba(18, 13, 9, 0.98) 100%);
        border: 2px solid #b37e22;
        box-shadow: 0 0 50px rgba(0, 0, 0, 0.95), 0 0 30px rgba(179, 126, 34, 0.25);
        display: flex;
        flex-direction: column;
        border-radius: 4px;
        overflow: hidden;
      ">
        <!-- HEADER -->
        <div style="
          padding: 16px 24px 12px 24px;
          border-bottom: 2px solid #5a3f19;
          background: linear-gradient(180deg, #2b1d12 0%, #1c130b 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <div style="font-family: 'Cinzel', serif; font-size: 11px; color: #ffd166; letter-spacing: 2px; font-weight: bold; text-transform: uppercase;">
              Historical Prologue · 1200 BC
            </div>
            <div style="font-family: 'Cinzel', serif; font-size: 24px; font-weight: 900; color: #fff3d6; letter-spacing: 1.5px; margin-top: 2px; text-shadow: 0 2px 8px rgba(0,0,0,0.8);">
              THE ASHES OF BRONZE: THE GREAT CATACLYSM
            </div>
          </div>
          <button id="prologue-btn-close" class="svga-btn" style="padding: 4px 10px; font-size: 12px; color: #a89f91;">
            ✕ CLOSE
          </button>
        </div>

        <!-- CHAPTER NAVIGATION TABS -->
        <div id="prologue-tabs" style="
          display: flex;
          background: #120d09;
          border-bottom: 1px solid #3d2b14;
          overflow-x: auto;
        ">
          <!-- Populated in render -->
        </div>

        <!-- BODY CONTENT AREA (SCROLLABLE) -->
        <div id="prologue-body" style="
          padding: 22px 28px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        ">
          <!-- Populated in render -->
        </div>

        <!-- FOOTER ACTIONS -->
        <div style="
          padding: 14px 24px;
          border-top: 2px solid #5a3f19;
          background: #140e0a;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        ">
          <div style="display: flex; gap: 8px;">
            <button id="prologue-btn-prev" class="svga-btn" style="padding: 9px 18px; font-size: 12px;">
              ◀ PREVIOUS
            </button>
            <button id="prologue-btn-next" class="svga-btn" style="padding: 9px 18px; font-size: 12px;">
              NEXT CHAPTER ▶
            </button>
          </div>

          <div style="display: flex; gap: 10px; align-items: center;">
            <button id="prologue-btn-map" class="svga-btn" style="padding: 9px 16px; font-size: 12px;">
              🗺 STRATEGIC MAP
            </button>
            <button id="prologue-btn-begin" class="svga-btn" style="
              padding: 10px 24px;
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 1px;
              background: linear-gradient(180deg, #8c5e21 0%, #523410 100%);
              border-color: #ffd166;
              color: #fff8e8;
              box-shadow: 0 0 14px rgba(255, 209, 102, 0.35);
            ">
              ⚔ TAKE COMMAND · BEGIN MISSION I
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;
    this.canvasEl = overlay.querySelector('#prologue-canvas') as HTMLCanvasElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.overlayEl) return;

    this.overlayEl.querySelector('#prologue-btn-close')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onClose) this.onClose();
    });

    this.overlayEl.querySelector('#prologue-btn-prev')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (this.currentChapter > 0) {
        this.currentChapter--;
        this.render();
      }
    });

    this.overlayEl.querySelector('#prologue-btn-next')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (this.currentChapter < this.chapters.length - 1) {
        this.currentChapter++;
        this.render();
      }
    });

    this.overlayEl.querySelector('#prologue-btn-map')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onOpenMap) this.onOpenMap();
    });

    this.overlayEl.querySelector('#prologue-btn-begin')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onBegin) this.onBegin();
    });
  }

  public show(initialChapter: number = 0): void {
    this.currentChapter = Math.max(0, Math.min(this.chapters.length - 1, initialChapter));
    this.render();
    if (this.overlayEl) {
      this.overlayEl.style.display = 'flex';
      EventBus.get().emit('audio:horn_alert');
      this.startEmberParticles();
    }
  }

  public hide(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
      this.stopEmberParticles();
    }
  }

  private render(): void {
    if (!this.overlayEl) return;

    // Render Tabs
    const tabsContainer = this.overlayEl.querySelector('#prologue-tabs');
    if (tabsContainer) {
      tabsContainer.innerHTML = '';
      this.chapters.forEach((ch, idx) => {
        const btn = document.createElement('button');
        const isActive = idx === this.currentChapter;
        btn.className = 'svga-btn';
        btn.style.cssText = `
          padding: 10px 18px;
          border-radius: 0;
          border: none;
          border-bottom: 3px solid ${isActive ? '#ffd166' : 'transparent'};
          background: ${isActive ? 'linear-gradient(180deg, #382515 0%, #20150b 100%)' : 'transparent'};
          color: ${isActive ? '#fff3d6' : '#a89f91'};
          font-family: 'Cinzel', serif;
          font-size: 11px;
          font-weight: ${isActive ? 'bold' : 'normal'};
          letter-spacing: 1px;
          white-space: nowrap;
          cursor: pointer;
        `;
        btn.innerHTML = `<span style="color: #ffd166; font-weight: bold;">${ch.roman}.</span> ${ch.title.toUpperCase()}`;
        btn.onclick = () => {
          EventBus.get().emit('audio:click');
          this.currentChapter = idx;
          this.render();
        };
        tabsContainer.appendChild(btn);
      });
    }

    // Render Current Chapter Content
    const bodyContainer = this.overlayEl.querySelector('#prologue-body');
    const ch = this.chapters[this.currentChapter];
    if (bodyContainer && ch) {
      const bkPortrait = SVGAProceduralBank.advisorPortraits.get('burna_khabir')?.toDataURL() || '';
      const tkPortrait = SVGAProceduralBank.advisorPortraits.get('tarkhunta')?.toDataURL() || '';
      const zlPortrait = SVGAProceduralBank.advisorPortraits.get('zalpa')?.toDataURL() || '';

      bodyContainer.innerHTML = `
        <!-- CHAPTER HEADER -->
        <div style="border-bottom: 1px solid #3d2b14; padding-bottom: 12px;">
          <div style="font-family: 'Cinzel', serif; font-size: 12px; color: #ffd166; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
            Chapter ${ch.roman} · ${ch.subtitle}
          </div>
          <div style="font-family: 'Cinzel', serif; font-size: 26px; font-weight: 900; color: #fff8e8; margin-top: 4px; letter-spacing: 0.5px;">
            ${ch.title}
          </div>
        </div>

        <!-- HISTORICAL QUOTE -->
        <div style="
          background: rgba(16, 11, 7, 0.7);
          border-left: 3px solid #c9933b;
          padding: 10px 16px;
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 15px;
          font-style: italic;
          color: #d1b48c;
          line-height: 1.45;
        ">
          ${ch.quote}
        </div>

        <!-- NARRATIVE PARAGRAPHS -->
        <div style="display: flex; flex-direction: column; gap: 12px; font-family: 'Crimson Pro', Georgia, serif; font-size: 16px; line-height: 1.6; color: #f2e9dc;">
          ${ch.paragraphs.map(p => `<div>${p}</div>`).join('')}
        </div>

        <!-- SPECIAL ADVISOR CARDS IN CHAPTER III -->
        ${this.currentChapter === 2 ? `
          <div style="margin-top: 8px; border-top: 1px solid #3d2b14; padding-top: 14px;">
            <div style="font-family: 'Cinzel', serif; font-size: 12px; color: #ffd166; letter-spacing: 1px; font-weight: bold; margin-bottom: 10px;">
              KEY COMMANDERS OF THE SURVIVAL COUNCIL:
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
              <!-- BURNA-KHABIR -->
              <div style="background: rgba(24, 16, 10, 0.85); border: 1px solid #5a3f19; padding: 10px; display: flex; gap: 12px; align-items: center; border-radius: 3px;">
                <img src="${bkPortrait}" style="width: 54px; height: 54px; border: 1px solid #b37e22; flex-shrink: 0;" />
                <div>
                  <div style="font-family: 'Cinzel', serif; font-size: 13px; font-weight: bold; color: #ffd166;">Burna the Khabir</div>
                  <div style="font-size: 11px; color: #a89f91; font-style: italic;">Exiled Babylonian Master Metallurgist</div>
                  <div style="font-size: 12px; color: #dcd1c2; margin-top: 3px;">Replaces scarce tin with forced-draft iron bloomeries and forged black blades.</div>
                </div>
              </div>

              <!-- TARKHUNTA -->
              <div style="background: rgba(24, 16, 10, 0.85); border: 1px solid #5a3f19; padding: 10px; display: flex; gap: 12px; align-items: center; border-radius: 3px;">
                <img src="${tkPortrait}" style="width: 54px; height: 54px; border: 1px solid #b37e22; flex-shrink: 0;" />
                <div>
                  <div style="font-family: 'Cinzel', serif; font-size: 13px; font-weight: bold; color: #ffd166;">Tarkhunta</div>
                  <div style="font-size: 11px; color: #a89f91; font-style: italic;">Luwian Chariot Vanguard Captain</div>
                  <div style="font-size: 12px; color: #dcd1c2; margin-top: 3px;">Master of chariot counter-charges, fortified cyclopean walls, and tactical redoubts.</div>
                </div>
              </div>

              <!-- ZALPA -->
              <div style="background: rgba(24, 16, 10, 0.85); border: 1px solid #5a3f19; padding: 10px; display: flex; gap: 12px; align-items: center; border-radius: 3px;">
                <img src="${zlPortrait}" style="width: 54px; height: 54px; border: 1px solid #b37e22; flex-shrink: 0;" />
                <div>
                  <div style="font-family: 'Cinzel', serif; font-size: 13px; font-weight: bold; color: #ffd166;">Zalpa</div>
                  <div style="font-size: 11px; color: #a89f91; font-style: italic;">Syro-Cilician Scout & Outrunner</div>
                  <div style="font-size: 12px; color: #dcd1c2; margin-top: 3px;">Alerts the colony to landing galleys, scouts mountain passes, and directs donkey supply trains.</div>
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- FINAL WARNING BANNER IN CHAPTER IV -->
        ${this.currentChapter === 3 ? `
          <div style="
            background: linear-gradient(180deg, rgba(82, 18, 18, 0.7) 0%, rgba(45, 9, 9, 0.85) 100%);
            border: 2px solid #ef4444;
            padding: 14px 18px;
            border-radius: 3px;
            margin-top: 8px;
          ">
            <div style="font-family: 'Cinzel', serif; font-size: 13px; font-weight: 900; color: #fca5a5; letter-spacing: 1.5px; text-transform: uppercase;">
              ⚠ CATASTROPHIC STAKES OF DEFEAT:
            </div>
            <div style="font-size: 14px; color: #fee2e2; margin-top: 4px; line-height: 1.5;">
              If your settlement falls, the torch of civilization in the Levant is extinguished forever. There will be no renaissance, no iron age, and no written history—only ashes, starvation, and the silence of forgotten ruins. Stand firm!
            </div>
          </div>
        ` : ''}
      `;
    }

    // Update button states
    const prevBtn = this.overlayEl.querySelector('#prologue-btn-prev') as HTMLButtonElement;
    const nextBtn = this.overlayEl.querySelector('#prologue-btn-next') as HTMLButtonElement;
    if (prevBtn) prevBtn.disabled = this.currentChapter === 0;
    if (nextBtn) {
      nextBtn.disabled = this.currentChapter === this.chapters.length - 1;
      nextBtn.style.display = this.currentChapter === this.chapters.length - 1 ? 'none' : 'inline-block';
    }
  }

  // --- Ember Particles Canvas Animation ---
  private startEmberParticles(): void {
    if (!this.canvasEl) return;
    const canvas = this.canvasEl;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      color: string;
      wavePhase: number;
    }> = [];

    const colors = ['#f59e0b', '#ea580c', '#ef4444', '#fbbf24', '#78350f'];
    for (let i = 0; i < 75; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.8 + 1,
        speedY: Math.random() * 0.9 + 0.35,
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.7 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        wavePhase: Math.random() * Math.PI * 2
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.y -= p.speedY;
        p.wavePhase += 0.02;
        p.x += Math.sin(p.wavePhase) * 0.6 + p.speedX;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      this.animId = requestAnimationFrame(render);
    };

    render();
  }

  private stopEmberParticles(): void {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}
