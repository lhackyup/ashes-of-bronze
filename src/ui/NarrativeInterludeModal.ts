import { EventBus } from '../core/EventBus.ts';
import { SVGAProceduralBank } from '../engine/rendering/SVGAProceduralBank.ts';
import { NarrativeInterlude, NARRATIVE_INTERLUDES } from '../data/narrativeInterludes.ts';

export class NarrativeInterludeModal {
  private overlayEl: HTMLElement | null = null;
  public onProceedToNext?: (nextScenarioId: string) => void;
  public onOpenMap?: () => void;
  public onOpenChronicle?: () => void;

  private currentInterlude: NarrativeInterlude | null = null;
  private currentTab: 'aftermath' | 'world' | 'briefing' = 'aftermath';
  private visitedTabs: Set<'aftermath' | 'world' | 'briefing'> = new Set(['aftermath']);

  constructor() {
    this.createDOM();
  }

  private createDOM(): void {
    const existing = document.getElementById('narrative-interlude-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'narrative-interlude-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(6, 4, 3, 0.94);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      backdrop-filter: blur(6px);
      user-select: none;
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;
  }

  public show(fromScenarioId: string, toScenarioId: string): void {
    const key = Object.keys(NARRATIVE_INTERLUDES).find(
      k => NARRATIVE_INTERLUDES[k].fromScenarioId === fromScenarioId && NARRATIVE_INTERLUDES[k].toScenarioId === toScenarioId
    );

    if (key && NARRATIVE_INTERLUDES[key]) {
      this.currentInterlude = NARRATIVE_INTERLUDES[key];
    } else {
      this.currentInterlude = NARRATIVE_INTERLUDES['interlude_4_to_5'];
    }

    this.currentTab = 'aftermath';
    this.visitedTabs = new Set(['aftermath']);
    this.render();
    if (this.overlayEl) {
      this.overlayEl.style.display = 'flex';
    }
  }

  public hide(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
    }
  }

  private render(): void {
    if (!this.overlayEl || !this.currentInterlude) return;

    const data = this.currentInterlude;
    const bkPortrait = SVGAProceduralBank.advisorPortraits.get('burna_khabir')?.toDataURL() || '';
    const tkPortrait = SVGAProceduralBank.advisorPortraits.get('tarkhunta')?.toDataURL() || '';
    const zlPortrait = SVGAProceduralBank.advisorPortraits.get('zalpa')?.toDataURL() || '';

    const accentGold = '#c9933b';
    const textBright = '#ffd166';

    this.overlayEl.innerHTML = `
      <div class="stone-panel" style="
        width: 860px;
        max-width: 95vw;
        max-height: 90vh;
        border: 2px solid ${accentGold};
        box-shadow: 0 0 45px rgba(0,0,0,0.98);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      ">
        <!-- HEADER -->
        <div style="
          padding: 16px 24px;
          background: linear-gradient(180deg, #34281d 0%, #17110c 100%);
          border-bottom: 2px solid ${accentGold};
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <div style="font-family: 'Cinzel', serif; font-size: 11px; font-weight: bold; color: #a89f91; letter-spacing: 2px; text-transform: uppercase;">
              STRATEGIC CHRONICLE · ACT ${data.act} · ${data.yearTransition}
            </div>
            <div style="font-family: 'Cinzel', serif; font-size: 22px; font-weight: 900; color: ${textBright}; letter-spacing: 1.5px; margin-top: 2px;">
              ${data.title.toUpperCase()}
            </div>
            <div style="font-family: 'Crimson Pro', Georgia, serif; font-size: 14px; color: #d1b48c; font-style: italic;">
              ${data.subtitle}
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <img src="${bkPortrait}" style="width: 44px; height: 44px; border: 1px solid #c9933b; border-radius: 3px; object-fit: cover;" title="Burna-Khabir" alt="Burna" />
            <img src="${tkPortrait}" style="width: 44px; height: 44px; border: 1px solid #c9933b; border-radius: 3px; object-fit: cover;" title="Tarkhunta" alt="Tarkhunta" />
            <img src="${zlPortrait}" style="width: 44px; height: 44px; border: 1px solid #c9933b; border-radius: 3px; object-fit: cover;" title="Zalpa" alt="Zalpa" />
          </div>
        </div>

        <!-- NAVIGATION TABS -->
        <div style="
          display: flex;
          background: #15100c;
          border-bottom: 1px solid #3d3227;
        ">
          <button id="tab-aftermath-btn" style="
            flex: 1;
            padding: 10px 14px;
            background: ${this.currentTab === 'aftermath' ? '#291f16' : '#140f0b'};
            border: none;
            border-bottom: 3px solid ${this.currentTab === 'aftermath' ? '#2de0a5' : (this.visitedTabs.has('aftermath') ? '#1e6b50' : 'transparent')};
            color: ${this.currentTab === 'aftermath' ? '#2de0a5' : (this.visitedTabs.has('aftermath') ? '#8cd6b8' : '#a89f91')};
            font-family: 'Cinzel', serif;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.15s;
          ">
            ${this.visitedTabs.has('aftermath') ? '✓ ' : ''}1. AFTERMATH & VICTORIES
          </button>

          <button id="tab-world-btn" style="
            flex: 1;
            padding: 10px 14px;
            background: ${this.currentTab === 'world' ? '#291f16' : '#140f0b'};
            border: none;
            border-bottom: 3px solid ${this.currentTab === 'world' ? '#ffd166' : (this.visitedTabs.has('world') ? '#8a6e30' : 'transparent')};
            color: ${this.currentTab === 'world' ? '#ffd166' : (this.visitedTabs.has('world') ? '#ffd166' : '#a89f91')};
            font-family: 'Cinzel', serif;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.15s;
          ">
            ${this.visitedTabs.has('world') ? '✓ ' : ''}2. HISTORICAL CONTEXT
          </button>

          <button id="tab-briefing-btn" style="
            flex: 1;
            padding: 10px 14px;
            background: ${this.currentTab === 'briefing' ? '#291f16' : '#140f0b'};
            border: none;
            border-bottom: 3px solid ${this.currentTab === 'briefing' ? '#ef4444' : (this.visitedTabs.has('briefing') ? '#8c2e2e' : 'transparent')};
            color: ${this.currentTab === 'briefing' ? '#ff9999' : (this.visitedTabs.has('briefing') ? '#ffaaaa' : '#a89f91')};
            font-family: 'Cinzel', serif;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.15s;
          ">
            ${this.visitedTabs.has('briefing') ? '✓ ' : ''}3. ROYAL MANDATE
          </button>
        </div>

        <!-- TAB CONTENT CONTAINER -->
        <div id="interlude-tab-content" style="
          padding: 22px 28px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: rgba(18, 14, 10, 0.92);
        ">
          ${this.renderTabContent(data)}
        </div>

        <!-- FOOTER ACTIONS -->
        <div style="
          padding: 12px 24px;
          background: linear-gradient(180deg, #1f1812 0%, #110d09 100%);
          border-top: 1px solid #3d3227;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="display: flex; gap: 10px; align-items: center;">
            <button id="interlude-chronicle-btn" class="svga-btn" style="padding: 6px 14px; font-size: 12px;">
              📜 Chronicle of the Wanax
            </button>
            <button id="interlude-map-btn" class="svga-btn" style="padding: 6px 14px; font-size: 12px;">
              🗺 Strategic Map
            </button>
            <span style="font-family: 'Cinzel', serif; font-size: 11px; color: #a89f91; margin-left: 8px;">
              ${this.currentTab === 'aftermath' ? 'SLIDE 1 OF 3' : (this.currentTab === 'world' ? 'SLIDE 2 OF 3' : 'SLIDE 3 OF 3')}
            </span>
          </div>

          <div style="display: flex; gap: 10px; align-items: center;">
            ${this.currentTab !== 'aftermath' ? `
              <button id="interlude-prev-btn" class="svga-btn" style="padding: 8px 16px; font-size: 12px;">
                ◂ PREVIOUS
              </button>
            ` : ''}

            ${this.currentTab === 'briefing' ? `
              <button id="interlude-proceed-btn" class="svga-btn" style="
                padding: 9px 24px;
                background: linear-gradient(180deg, #8a571c 0%, #57350f 100%);
                border-color: #ffd166;
                color: #fff4dc;
                font-weight: 900;
                font-size: 13px;
                letter-spacing: 0.8px;
                box-shadow: 0 0 15px rgba(255, 209, 102, 0.35);
              ">
                PROCEED TO WAR COUNCIL ➔
              </button>
            ` : `
              <button id="interlude-next-btn" class="svga-btn" style="
                padding: 9px 22px;
                background: linear-gradient(180deg, #2b7a58 0%, #194a35 100%);
                border-color: #2de0a5;
                color: #f7efe1;
                font-weight: bold;
                font-size: 13px;
                box-shadow: 0 0 12px rgba(45, 224, 165, 0.25);
              ">
                ${this.currentTab === 'aftermath' ? 'NEXT: HISTORICAL CONTEXT ➔' : 'NEXT: ROYAL MANDATE ➔'}
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners(data);
  }

  private renderTabContent(data: NarrativeInterlude): string {
    if (this.currentTab === 'aftermath') {
      return `
        <!-- AFTERMATH -->
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #4a3e33; padding-bottom: 8px;">
            <span style="font-size: 20px;">🛡</span>
            <div>
              <div style="font-family: 'Cinzel', serif; font-size: 16px; font-weight: bold; color: #2de0a5;">
                ${data.aftermath.heading}
              </div>
              <div style="font-size: 12px; color: #a89f91;">
                Tactical Resolution of Scenario: ${data.fromScenarioTitle}
              </div>
            </div>
          </div>

          <div style="font-size: 15px; line-height: 1.6; color: #f7efe1; font-family: 'Crimson Pro', Georgia, serif;">
            ${data.aftermath.summary}
          </div>

          <div style="background: rgba(28, 22, 16, 0.8); border: 1px solid #3d3227; border-radius: 4px; padding: 14px;">
            <div style="font-family: 'Cinzel', serif; font-size: 12px; font-weight: bold; color: #ffd166; margin-bottom: 8px;">
              CONSOLIDATED OBJECTIVES & FIELD VICTORIES:
            </div>
            <ul style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 13.5px; color: #e6ded3;">
              ${data.aftermath.bulletPoints.map(b => `<li style="line-height: 1.4;"><strong style="color: #2de0a5;">✓</strong> ${b}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }

    if (this.currentTab === 'world') {
      const focalPointsHtml = data.historicalContext.focalPoints?.map(fp => {
        let statusBadgeColor = '#ffd166';
        let statusBg = 'rgba(255, 209, 102, 0.15)';
        if (fp.status === 'fallen') {
          statusBadgeColor = '#ef4444';
          statusBg = 'rgba(239, 68, 68, 0.2)';
        } else if (fp.status === 'secure') {
          statusBadgeColor = '#2de0a5';
          statusBg = 'rgba(45, 224, 165, 0.2)';
        } else if (fp.status === 'threatened') {
          statusBadgeColor = '#f59e0b';
          statusBg = 'rgba(245, 158, 11, 0.2)';
        } else if (fp.status === 'sealed') {
          statusBadgeColor = '#94a3b8';
          statusBg = 'rgba(148, 163, 184, 0.2)';
        }

        return `
          <div style="background: rgba(24, 18, 13, 0.85); border: 1px solid #3d3227; border-radius: 4px; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-family: 'Cinzel', serif; font-weight: bold; font-size: 13px; color: #ffd166;">${fp.name}</span>
              <span style="font-size: 10px; font-weight: bold; color: ${statusBadgeColor}; background: ${statusBg}; border: 1px solid ${statusBadgeColor}; padding: 2px 6px; border-radius: 2px;">
                ${fp.statusLabel}
              </span>
            </div>
            <div style="font-size: 12px; color: #c2b7a7;">${fp.description}</div>
          </div>
        `;
      }).join('') || '';

      return `
        <!-- HISTORICAL CONTEXT -->
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #4a3e33; padding-bottom: 8px;">
            <span style="font-size: 20px;">🏛</span>
            <div>
              <div style="font-family: 'Cinzel', serif; font-size: 16px; font-weight: bold; color: #ffd166;">
                ${data.historicalContext.heading}
              </div>
              <div style="font-size: 12px; color: #a89f91;">
                Geopolitical State of the Collapsing Bronze Age
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14.5px; line-height: 1.6; color: #f7efe1; font-family: 'Crimson Pro', Georgia, serif;">
            ${data.historicalContext.narrativeText.map(p => `<p style="margin: 0;">${p}</p>`).join('')}
          </div>

          ${data.historicalContext.ancientQuote ? `
            <div style="background: rgba(36, 26, 18, 0.85); border-left: 3px solid #ffd166; padding: 12px 16px; border-radius: 0 4px 4px 0; font-style: italic;">
              <div style="font-size: 14px; color: #fff1d6; line-height: 1.4;">
                "${data.historicalContext.ancientQuote.text}"
              </div>
              <div style="font-size: 11px; color: #c9933b; margin-top: 6px; font-family: 'Cinzel', serif; font-weight: bold;">
                — ${data.historicalContext.ancientQuote.source}
              </div>
            </div>
          ` : ''}

          ${data.historicalContext.focalPoints && data.historicalContext.focalPoints.length > 0 ? `
            <div style="margin-top: 4px;">
              <div style="font-family: 'Cinzel', serif; font-size: 12px; font-weight: bold; color: #a89f91; margin-bottom: 8px;">
                STATUS OF KINGDOMS & TRADE ROUTES:
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 8px;">
                ${focalPointsHtml}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    // BRIEFING
    return `
      <!-- NEXT BRIEFING -->
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #4a3e33; padding-bottom: 8px;">
          <span style="font-size: 20px;">⚔</span>
          <div>
            <div style="font-family: 'Cinzel', serif; font-size: 16px; font-weight: bold; color: #ff9999;">
              ${data.nextBriefing.heading}
            </div>
            <div style="font-size: 12px; color: #a89f91;">
              Operational Theater: ${data.toScenarioTitle}
            </div>
          </div>
        </div>

        <div style="font-size: 15px; line-height: 1.6; color: #fff0f0; font-family: 'Crimson Pro', Georgia, serif; background: rgba(38, 20, 20, 0.5); padding: 12px 16px; border: 1px solid #5a2727; border-radius: 4px;">
          <strong style="color: #ffb3b3; font-family: 'Cinzel', serif;">STRATEGIC IMPERATIVE:</strong><br/>
          ${data.nextBriefing.strategicImperative}
        </div>

        <div style="background: rgba(26, 20, 16, 0.85); border: 1px solid #3d3227; border-radius: 4px; padding: 14px;">
          <div style="font-family: 'Cinzel', serif; font-size: 12px; font-weight: bold; color: #ffd166; margin-bottom: 8px;">
            INTELLIGENCE NOTES & TACTICAL ADVICE (ZALPA & TARKHUNTA):
          </div>
          <ul style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 13.5px; color: #e6ded3;">
            ${data.nextBriefing.tacticalIntelligence.map(t => `<li style="line-height: 1.4;"><strong style="color: #ffd166;">▸</strong> ${t}</li>`).join('')}
          </ul>
        </div>

        <div style="background: rgba(22, 28, 22, 0.85); border: 1px solid #2d4f3b; border-radius: 4px; padding: 12px 14px; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 18px; color: #2de0a5;">⚡</span>
          <div>
            <div style="font-family: 'Cinzel', serif; font-size: 11px; font-weight: bold; color: #2de0a5;">NEW CONDITIONS & KEY ASSETS:</div>
            <div style="font-size: 13px; color: #d6faed;">${data.nextBriefing.newUnlocksOrHazards}</div>
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(data: NarrativeInterlude): void {
    document.getElementById('tab-aftermath-btn')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.currentTab = 'aftermath';
      this.visitedTabs.add('aftermath');
      this.render();
    });

    document.getElementById('tab-world-btn')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.currentTab = 'world';
      this.visitedTabs.add('world');
      this.render();
    });

    document.getElementById('tab-briefing-btn')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.currentTab = 'briefing';
      this.visitedTabs.add('briefing');
      this.render();
    });

    document.getElementById('interlude-prev-btn')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (this.currentTab === 'briefing') {
        this.currentTab = 'world';
      } else if (this.currentTab === 'world') {
        this.currentTab = 'aftermath';
      }
      this.render();
    });

    document.getElementById('interlude-next-btn')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (this.currentTab === 'aftermath') {
        this.currentTab = 'world';
        this.visitedTabs.add('world');
      } else if (this.currentTab === 'world') {
        this.currentTab = 'briefing';
        this.visitedTabs.add('briefing');
      }
      this.render();
    });

    document.getElementById('interlude-chronicle-btn')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onOpenChronicle) this.onOpenChronicle();
    });

    document.getElementById('interlude-map-btn')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onOpenMap) this.onOpenMap();
    });

    document.getElementById('interlude-proceed-btn')?.addEventListener('click', () => {
      EventBus.get().emit('audio:command');
      this.hide();
      if (this.onProceedToNext) {
        this.onProceedToNext(data.toScenarioId);
      }
    });
  }
}
