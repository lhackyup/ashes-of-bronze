import { EventBus } from '../core/EventBus.ts';
import { SVGAProceduralBank } from '../engine/rendering/SVGAProceduralBank.ts';
import { MissionStats, ObjectiveProgress } from '../campaign/ObjectiveManager.ts';
import { SaveManager } from '../services/SaveManager.ts';

export class EpilogueModal {
  private overlayEl: HTMLElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private animId: number | null = null;
  private currentChapter: number = 0;
  private missionStats: MissionStats | null = null;

  public onOpenChronicle?: () => void;
  public onOpenMap?: () => void;
  public onReplay?: () => void;
  public onReturnToTitle?: () => void;

  private chapters = [
    {
      roman: 'I',
      subtitle: '1110 BC · The Coast of the Levant',
      title: 'The Horned Armada Broken',
      quote: '"The sea was red with fire and blood. But as the horned banners sank beneath the surf, the great silence came. We had broken the storm that destroyed the world."',
      paragraphs: [
        'The surf of the Mediterranean rolls quiet once more. Across the shoals and the estuary breaches, the black-sailed war galleys of the Sea Peoples coalition burn down to their charred keels, their smoke ascending into the clear blue sky.',
        'The horned helmets, spiked bucklers, and feathered crowns of the Shardana, Lukka, and Peleset kings drift among the sea reeds. Their Supreme Fleet Warlord lies defeated upon the sands, his bronze broadsword shattered against the cold, unyielding iron plates of the Citadel.',
        'The terrible invasion that annihilated the empires of Mycenae, Hattusa, and Ugarit—the unstoppable force that terrorized the ancient world for ninety years—has broken at last against the courage of your defenders.'
      ]
    },
    {
      roman: 'II',
      subtitle: 'The Metallurgical Transmutation',
      title: 'Out of the Bloomery Hearth',
      quote: '"Bronze was the metal of gilded kings and palace monopolies. Iron is the metal of the people, forged by our own sweat from the stones beneath our feet."',
      paragraphs: [
        'When the Bronze Age collapsed, humanity was meant to perish in darkness. The great kings had built their power on the monopoly of imported tin; when the trade lanes were severed, their bronze armies evaporated.',
        'Yet within the secret mountain defiles of the Taurus and the renegade foundries of the Levant, your people refused to accept extinction. Guided by Burna the Khabir and the courage of your miners, you mastered the difficult secret of forced-draft bellows and unlocked the strength of red hematite ore.',
        'You broke the tyranny of scarce tin. In place of aristocratic chariot elites, you armed the common people: forging the Black Blade broadswords, raising the four-meter iron phalanx, and crowning your cliffs with iron-plated ballista bastions. You transformed the very material fabric of human history.'
      ]
    },
    {
      roman: 'III',
      subtitle: 'Deliverance from the Dark Ages',
      title: 'The Light That Would Not Die',
      quote: '"Look upon the granaries. Look upon the terraces. Look upon the children copying tablets in the morning light. Civilization did not die: it learned to fight."',
      paragraphs: [
        'Feel the immense weight lift from your shoulders: civilization has endured.',
        'The catastrophic abyss of a thousand years of darkness and illiteracy has been averted. The priceless cuneiform tablets of Ugarit, hauled from the flames across ninety years of war, are preserved safe within the Citadel vaults. The fertile floodplains of the Orontes are blooming with wheat and barley. The stone olive presses turn once more.',
        'In the schools and sanctuaries, scholars and scribes preserve the ancient knowledge while teaching the new phonetic alphabet. Trade ships begin to raise white sails across a pacified sea. A new era of prosperity, reason, and human flourishing is born.'
      ]
    },
    {
      roman: 'IV',
      subtitle: 'The Founders\' Farewell',
      title: 'The Eternal Horizon',
      quote: '"From the ashes of bronze, you have forged the Iron Dawn. The world is yours to rebuild."',
      paragraphs: [
        'As the golden rays of the morning sun spill across the snow-capped crests of the Lebanon mountains and illuminate the ramparts of the Iron Citadel, your veteran companions stand beside you upon the battlements.',
        'Burna the Khabir wipes the forge soot from his brow and offers a weary, proud smile. Tarkhunta unbuckles his battered armor and looks peacefully out toward the shining sea. Zalpa and her mountain outrunners ride through the wide-open fortress gates, carrying green olive boughs instead of warning horns.',
        'The nightmare of the collapse is over. The ashes of bronze are behind you. Humanity steps out into the brilliant, unbreakable dawn of the Iron Age.'
      ]
    }
  ];

  constructor() {
    this.createDOM();
  }

  private createDOM(): void {
    const existing = document.getElementById('epilogue-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'epilogue-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, #261a0c 0%, #150d05 60%, #060401 100%);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1200;
      user-select: none;
      overflow: hidden;
      backdrop-filter: blur(8px);
    `;

    overlay.innerHTML = `
      <!-- CANVAS FOR GOLDEN SUNLIGHT & ANVIL SPARK PARTICLES -->
      <canvas id="epilogue-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;"></canvas>

      <!-- MAIN CONTAINER -->
      <div style="
        position: relative;
        z-index: 2;
        width: 92%;
        max-width: 940px;
        max-height: 90vh;
        background: linear-gradient(180deg, rgba(38, 26, 14, 0.96) 0%, rgba(20, 14, 7, 0.98) 100%);
        border: 2px solid #ffd166;
        box-shadow: 0 0 60px rgba(0, 0, 0, 0.95), 0 0 40px rgba(255, 209, 102, 0.35);
        display: flex;
        flex-direction: column;
        border-radius: 4px;
        overflow: hidden;
      ">
        <!-- HEADER -->
        <div style="
          padding: 16px 24px 12px 24px;
          border-bottom: 2px solid #8c5e21;
          background: linear-gradient(180deg, #382410 0%, #211508 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <div style="font-family: 'Cinzel', serif; font-size: 11px; color: #ffd166; letter-spacing: 2px; font-weight: bold; text-transform: uppercase;">
              Grand Campaign Finale · 1110 BC · Civilization Victorious
            </div>
            <div style="font-family: 'Cinzel', serif; font-size: 26px; font-weight: 900; color: #fff8e8; letter-spacing: 2px; margin-top: 2px; text-shadow: 0 2px 10px rgba(255, 209, 102, 0.5);">
              ☀ THE IRON DAWN: A NEW AGE IS FORGED
            </div>
          </div>
          <button id="epilogue-btn-close" class="svga-btn" style="padding: 4px 10px; font-size: 12px; color: #a89f91;">
            ✕ CLOSE
          </button>
        </div>

        <!-- CHAPTER NAVIGATION TABS -->
        <div id="epilogue-tabs" style="
          display: flex;
          background: #150d06;
          border-bottom: 1px solid #4d3311;
          overflow-x: auto;
        ">
          <!-- Populated in render -->
        </div>

        <!-- BODY CONTENT AREA (SCROLLABLE) -->
        <div id="epilogue-body" style="
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
          border-top: 2px solid #8c5e21;
          background: #140d06;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        ">
          <div style="display: flex; gap: 8px;">
            <button id="epilogue-btn-prev" class="svga-btn" style="padding: 9px 18px; font-size: 12px;">
              ◀ PREVIOUS
            </button>
            <button id="epilogue-btn-next" class="svga-btn" style="padding: 9px 18px; font-size: 12px;">
              NEXT CHAPTER ▶
            </button>
          </div>

          <div style="display: flex; gap: 10px; align-items: center;">
            <button id="epilogue-btn-replay" class="svga-btn" style="padding: 9px 16px; font-size: 12px;">
              ↺ REPLAY SCENARIO X
            </button>
            <button id="epilogue-btn-map" class="svga-btn" style="padding: 9px 16px; font-size: 12px;">
              🗺 CAMPAIGN MAP
            </button>
            <button id="epilogue-btn-chronicle" class="svga-btn" style="
              padding: 10px 22px;
              font-size: 13px;
              font-weight: 900;
              letter-spacing: 1px;
              background: linear-gradient(180deg, #996515 0%, #573708 100%);
              border-color: #ffd166;
              color: #fffbf0;
              box-shadow: 0 0 16px rgba(255, 209, 102, 0.4);
            ">
              📜 COMPLETE CHRONICLE
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;
    this.canvasEl = overlay.querySelector('#epilogue-canvas') as HTMLCanvasElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.overlayEl) return;

    this.overlayEl.querySelector('#epilogue-btn-close')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onOpenMap) this.onOpenMap();
    });

    this.overlayEl.querySelector('#epilogue-btn-prev')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (this.currentChapter > 0) {
        this.currentChapter--;
        this.render();
      }
    });

    this.overlayEl.querySelector('#epilogue-btn-next')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (this.currentChapter < this.chapters.length - 1) {
        this.currentChapter++;
        this.render();
      }
    });

    this.overlayEl.querySelector('#epilogue-btn-replay')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onReplay) this.onReplay();
    });

    this.overlayEl.querySelector('#epilogue-btn-map')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onOpenMap) this.onOpenMap();
    });

    this.overlayEl.querySelector('#epilogue-btn-chronicle')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onOpenChronicle) this.onOpenChronicle();
    });
  }

  public show(stats?: MissionStats, _objectives?: ObjectiveProgress[]): void {
    this.missionStats = stats || null;
    this.currentChapter = 0;
    this.render();
    if (this.overlayEl) {
      this.overlayEl.style.display = 'flex';
      EventBus.get().emit('audio:victory');
      this.startSunlightParticles();
    }
  }

  public hide(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
      this.stopSunlightParticles();
    }
  }

  private render(): void {
    if (!this.overlayEl) return;

    // Render Tabs
    const tabsContainer = this.overlayEl.querySelector('#epilogue-tabs');
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
          background: ${isActive ? 'linear-gradient(180deg, #472d13 0%, #291807 100%)' : 'transparent'};
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
    const bodyContainer = this.overlayEl.querySelector('#epilogue-body');
    const ch = this.chapters[this.currentChapter];
    if (bodyContainer && ch) {
      const bkPortrait = SVGAProceduralBank.advisorPortraits.get('burna_khabir')?.toDataURL() || '';
      const tkPortrait = SVGAProceduralBank.advisorPortraits.get('tarkhunta')?.toDataURL() || '';
      const zlPortrait = SVGAProceduralBank.advisorPortraits.get('zalpa')?.toDataURL() || '';

      const save = SaveManager.get().getData();
      const clearedCount = save.completedScenarios.length;

      bodyContainer.innerHTML = `
        <!-- CHAPTER HEADER -->
        <div style="border-bottom: 1px solid #4d3311; padding-bottom: 12px;">
          <div style="font-family: 'Cinzel', serif; font-size: 12px; color: #ffd166; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
            Epilogue · Chapter ${ch.roman} · ${ch.subtitle}
          </div>
          <div style="font-family: 'Cinzel', serif; font-size: 26px; font-weight: 900; color: #fff8e8; margin-top: 4px; letter-spacing: 0.5px;">
            ${ch.title}
          </div>
        </div>

        <!-- TRIUMPHANT QUOTE -->
        <div style="
          background: rgba(26, 17, 7, 0.75);
          border-left: 3px solid #ffd166;
          padding: 10px 16px;
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 16px;
          font-style: italic;
          color: #fce7b2;
          line-height: 1.45;
        ">
          ${ch.quote}
        </div>

        <!-- NARRATIVE PARAGRAPHS -->
        <div style="display: flex; flex-direction: column; gap: 12px; font-family: 'Crimson Pro', Georgia, serif; font-size: 16px; line-height: 1.6; color: #fbf3e6;">
          ${ch.paragraphs.map(p => `<div>${p}</div>`).join('')}
        </div>

        <!-- CHAPTER IV: THE TRIUMPHANT ADVISORS & CAMPAIGN GLORY -->
        ${this.currentChapter === 3 ? `
          <div style="margin-top: 10px; border-top: 1px solid #4d3311; padding-top: 14px;">
            <div style="font-family: 'Cinzel', serif; font-size: 12px; color: #ffd166; letter-spacing: 1px; font-weight: bold; margin-bottom: 10px;">
              THE ARCHITECTS OF THE NEW AGE:
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
              <div style="background: rgba(30, 20, 10, 0.85); border: 1px solid #8c5e21; padding: 10px; display: flex; gap: 12px; align-items: center; border-radius: 3px;">
                <img src="${bkPortrait}" style="width: 54px; height: 54px; border: 1px solid #ffd166; flex-shrink: 0;" />
                <div>
                  <div style="font-family: 'Cinzel', serif; font-size: 13px; font-weight: bold; color: #ffd166;">Burna the Khabir</div>
                  <div style="font-size: 11px; color: #d1b48c; font-style: italic;">Grand Artificer of the Iron Age</div>
                  <div style="font-size: 12px; color: #f4ece1; margin-top: 3px;">His bellows silenced the catastrophe; his iron blades restored humanity's future.</div>
                </div>
              </div>

              <div style="background: rgba(30, 20, 10, 0.85); border: 1px solid #8c5e21; padding: 10px; display: flex; gap: 12px; align-items: center; border-radius: 3px;">
                <img src="${tkPortrait}" style="width: 54px; height: 54px; border: 1px solid #ffd166; flex-shrink: 0;" />
                <div>
                  <div style="font-family: 'Cinzel', serif; font-size: 13px; font-weight: bold; color: #ffd166;">Tarkhunta</div>
                  <div style="font-size: 11px; color: #d1b48c; font-style: italic;">Protector-General of the Citadel</div>
                  <div style="font-size: 12px; color: #f4ece1; margin-top: 3px;">The shield-wall of Kadesh unbroken across ninety years of unyielding warfare.</div>
                </div>
              </div>

              <div style="background: rgba(30, 20, 10, 0.85); border: 1px solid #8c5e21; padding: 10px; display: flex; gap: 12px; align-items: center; border-radius: 3px;">
                <img src="${zlPortrait}" style="width: 54px; height: 54px; border: 1px solid #ffd166; flex-shrink: 0;" />
                <div>
                  <div style="font-family: 'Cinzel', serif; font-size: 13px; font-weight: bold; color: #ffd166;">Zalpa</div>
                  <div style="font-size: 11px; color: #d1b48c; font-style: italic;">Grand Ranger of the Levant</div>
                  <div style="font-size: 12px; color: #f4ece1; margin-top: 3px;">Her outrunners guided thousands of refugees into the light of the new sanctuary.</div>
                </div>
              </div>
            </div>

            <!-- CAMPAIGN VICTORY RECAP BADGE -->
            <div style="
              margin-top: 14px;
              background: linear-gradient(180deg, rgba(74, 48, 16, 0.8) 0%, rgba(38, 24, 7, 0.9) 100%);
              border: 2px solid #ffd166;
              padding: 12px 18px;
              border-radius: 4px;
              display: flex;
              justify-content: space-around;
              align-items: center;
              text-align: center;
            ">
              <div>
                <div style="font-family: 'Cinzel', serif; font-size: 22px; font-weight: 900; color: #ffd166;">${Math.max(clearedCount, 10)} / 10</div>
                <div style="font-size: 11px; color: #d1b48c; text-transform: uppercase; font-family: 'Cinzel', serif;">Scenarios Conquered</div>
              </div>
              <div style="border-left: 1px solid #8c5e21; height: 32px;"></div>
              <div>
                <div style="font-family: 'Cinzel', serif; font-size: 22px; font-weight: 900; color: #2de0a5;">3 / 3</div>
                <div style="font-size: 11px; color: #d1b48c; text-transform: uppercase; font-family: 'Cinzel', serif;">Acts Fulfilled</div>
              </div>
              <div style="border-left: 1px solid #8c5e21; height: 32px;"></div>
              <div>
                <div style="font-family: 'Cinzel', serif; font-size: 22px; font-weight: 900; color: #ffd166;">
                  ${this.missionStats ? `${Math.floor(this.missionStats.elapsedSeconds / 60)}m ${Math.floor(this.missionStats.elapsedSeconds % 60)}s` : '1200 - 1110 BC'}
                </div>
                <div style="font-size: 11px; color: #d1b48c; text-transform: uppercase; font-family: 'Cinzel', serif;">Final Battle Victory</div>
              </div>
            </div>
          </div>
        ` : ''}
      `;
    }

    // Update button states
    const prevBtn = this.overlayEl.querySelector('#epilogue-btn-prev') as HTMLButtonElement;
    const nextBtn = this.overlayEl.querySelector('#epilogue-btn-next') as HTMLButtonElement;
    if (prevBtn) prevBtn.disabled = this.currentChapter === 0;
    if (nextBtn) {
      nextBtn.disabled = this.currentChapter === this.chapters.length - 1;
      nextBtn.style.display = this.currentChapter === this.chapters.length - 1 ? 'none' : 'inline-block';
    }
  }

  // --- Sunlight & Radiant Spark Particles Canvas Animation ---
  private startSunlightParticles(): void {
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

    const colors = ['#fde047', '#ffd166', '#f59e0b', '#fbbf24', '#ffffff', '#cbd5e1'];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3.2 + 1,
        speedY: Math.random() * 0.8 + 0.3,
        speedX: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.8 + 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
        wavePhase: Math.random() * Math.PI * 2
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle radial dawn sunburst in top center
      const sunGrad = ctx.createRadialGradient(
        canvas.width * 0.5, 0, 10,
        canvas.width * 0.5, 0, canvas.height * 0.85
      );
      sunGrad.addColorStop(0, 'rgba(255, 209, 102, 0.22)');
      sunGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.08)');
      sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.y -= p.speedY;
        p.wavePhase += 0.025;
        p.x += Math.sin(p.wavePhase) * 0.7 + p.speedX;

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

  private stopSunlightParticles(): void {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}
