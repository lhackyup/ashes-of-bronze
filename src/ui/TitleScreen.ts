import { EventBus } from '../core/EventBus.ts';
import { SaveManager } from '../services/SaveManager.ts';
import { CAMPAIGN_SCENARIOS } from '../data/campaignActs.ts';

export class TitleScreen {
  private overlayEl: HTMLElement | null = null;
  public onContinue?: () => void;
  public onOpenPrologue?: () => void;
  public onOpenEpilogue?: () => void;
  public onOpenMap?: () => void;
  public onOpenChronicle?: () => void;
  public onOpenSettings?: () => void;
  public onNewCampaign?: () => void;

  constructor() {
    this.createDOM();
  }

  private createDOM(): void {
    const existing = document.getElementById('title-screen-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'title-screen-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, #241a13 0%, #110d0a 65%, #050403 100%);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 900;
      user-select: none;
    `;

    overlay.innerHTML = `
      <!-- BACKGROUND AMBIENT VIGNETTE -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: radial-gradient(rgba(201, 147, 59, 0.08) 1px, transparent 1px);
        background-size: 24px 24px;
        pointer-events: none;
      "></div>

      <!-- MAIN CONTAINER -->
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 28px;
        max-width: 680px;
        width: 90%;
        z-index: 2;
      ">
        <!-- LOGO & TITLE -->
        <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <div style="
            font-family: 'Cinzel', serif;
            font-size: 52px;
            font-weight: 900;
            letter-spacing: 5px;
            background: linear-gradient(180deg, #fff3d6 0%, #ffd166 45%, #b37e22 80%, #63430c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 4px 20px rgba(0,0,0,0.9);
            filter: drop-shadow(0 2px 8px rgba(255, 209, 102, 0.3));
            line-height: 1.1;
          ">
            ASHES OF BRONZE
          </div>

          <div style="
            font-family: 'Cinzel', serif;
            font-size: 16px;
            letter-spacing: 3px;
            color: #d1b48c;
            font-weight: 700;
            text-transform: uppercase;
            border-top: 1px solid #735327;
            border-bottom: 1px solid #735327;
            padding: 4px 24px;
            margin-top: 4px;
          ">
            The Iron Dawn · 1200 BC
          </div>

          <div style="
            font-family: 'Crimson Pro', Georgia, serif;
            font-size: 15px;
            color: #a89f91;
            font-style: italic;
            margin-top: 4px;
            max-width: 520px;
          ">
            "The Great Green churns with fire. Great kings fall into dust. From the ruins of bronze, forge an unbreakable destiny."
          </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div style="display: flex; flex-direction: column; gap: 12px; width: 340px;">
          <button id="title-btn-continue" class="svga-btn" style="
            padding: 12px 20px;
            font-size: 15px;
            font-weight: 900;
            letter-spacing: 1.5px;
            background: linear-gradient(180deg, #785a2f 0%, #473215 100%);
            border-color: #ffd166;
            color: #fff8e8;
          ">
            ▶ CONTINUE CAMPAIGN
          </button>

          <button id="title-btn-prologue" class="svga-btn" style="
            padding: 11px 20px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 1px;
            background: linear-gradient(180deg, #523a1e 0%, #2e1f10 100%);
            border-color: #b37e22;
            color: #ffd166;
          ">
            📜 HISTORICAL PROLOGUE (1200 BC)
          </button>

          <button id="title-btn-epilogue" class="svga-btn" style="
            display: none;
            padding: 11px 20px;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 1px;
            background: linear-gradient(180deg, #8c5e21 0%, #4a2e0a 100%);
            border-color: #ffd166;
            color: #fff8e8;
            box-shadow: 0 0 14px rgba(255, 209, 102, 0.35);
          ">
            ☀ THE IRON DAWN: EPILOGUE (1110 BC)
          </button>

          <button id="title-btn-map" class="svga-btn" style="padding: 11px 20px; font-size: 14px; font-weight: 700; letter-spacing: 1px;">
            🗺 STRATEGIC CAMPAIGN MAP
          </button>

          <button id="title-btn-chronicle" class="svga-btn" style="padding: 11px 20px; font-size: 14px; font-weight: 700; letter-spacing: 1px;">
            📜 CHRONICLE OF BURNA-KHABIR
          </button>

          <button id="title-btn-settings" class="svga-btn" style="padding: 11px 20px; font-size: 14px; font-weight: 700; letter-spacing: 1px;">
            ⚙ SETTINGS & OPTIONS
          </button>

          <button id="title-btn-new" class="svga-btn" style="
            padding: 9px 20px;
            font-size: 12px;
            color: #b5a898;
            margin-top: 8px;
            background: linear-gradient(180deg, #33261c 0%, #1c1510 100%);
          ">
            ↺ NEW CAMPAIGN (RESET)
          </button>
        </div>

        <!-- FOOTER CREDITS -->
        <div style="font-family: 'Cinzel', serif; font-size: 11px; color: #5a4c3f; letter-spacing: 1px; margin-top: 10px;">
          Ashes of Bronze v0.2.0 · Late Bronze Age RTS Engine
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;

    this.bindEvents();
    this.refreshState();
  }

  private bindEvents(): void {
    document.getElementById('title-btn-continue')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (this.onContinue) this.onContinue();
    });

    document.getElementById('title-btn-prologue')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (this.onOpenPrologue) this.onOpenPrologue();
    });

    document.getElementById('title-btn-epilogue')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (this.onOpenEpilogue) this.onOpenEpilogue();
    });

    document.getElementById('title-btn-map')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (this.onOpenMap) this.onOpenMap();
    });

    document.getElementById('title-btn-chronicle')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (this.onOpenChronicle) this.onOpenChronicle();
    });

    document.getElementById('title-btn-settings')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (this.onOpenSettings) this.onOpenSettings();
    });

    document.getElementById('title-btn-new')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (confirm('Start a new campaign? All current mission progress and chronicles will be reset.')) {
        SaveManager.get().resetAllProgress();
        this.refreshState();
        if (this.onNewCampaign) this.onNewCampaign();
      }
    });
  }

  public refreshState(): void {
    const save = SaveManager.get().getData();
    const continueBtn = document.getElementById('title-btn-continue');
    if (continueBtn) {
      if (save.completedScenarios.length > 0) {
        continueBtn.style.display = 'flex';
        continueBtn.textContent = `▶ CONTINUE (${save.completedScenarios.length}/${CAMPAIGN_SCENARIOS.length} CLEARED)`;
      } else {
        continueBtn.textContent = '▶ START CAMPAIGN';
      }
    }

    const epilogueBtn = document.getElementById('title-btn-epilogue');
    if (epilogueBtn) {
      const isWon = save.completedScenarios.includes('scenario_10_the_iron_dawn');
      epilogueBtn.style.display = isWon ? 'flex' : 'none';
    }
  }

  public show(): void {
    this.refreshState();
    if (this.overlayEl) {
      this.overlayEl.style.display = 'flex';
    }
  }

  public hide(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
    }
  }
}
