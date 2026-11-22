import { EventBus } from '../core/EventBus.ts';
import { SVGAProceduralBank } from '../engine/rendering/SVGAProceduralBank.ts';

export class CouncilModal {
  private overlayEl: HTMLElement | null = null;
  private onDeployCallback?: () => void;

  constructor(onDeploy?: () => void) {
    this.onDeployCallback = onDeploy;
    this.createDOM();
  }

  private createDOM(): void {
    // Remove if existing
    const existing = document.getElementById('council-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'council-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(8, 6, 5, 0.88);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    `;

    const getPortraitURL = (key: string): string => {
      const canvas = SVGAProceduralBank.advisorPortraits.get(key);
      return canvas ? canvas.toDataURL() : '';
    };

    overlay.innerHTML = `
      <div class="stone-panel" style="
        width: 860px;
        max-width: 95vw;
        max-height: 92vh;
        border: 2px solid #c9933b;
        box-shadow: 0 0 25px rgba(0,0,0,0.9), inset 0 0 15px rgba(0,0,0,0.7);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      ">
        <!-- HEADER -->
        <div style="
          padding: 14px 20px;
          background: linear-gradient(180deg, #3d3126 0%, #201a14 100%);
          border-bottom: 2px solid #c9933b;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <div style="font-family: 'Cinzel', serif; font-size: 20px; font-weight: 900; color: #ffd166; letter-spacing: 1px;">
              THE WAR COUNCIL OF KADESH-ON-SEA
            </div>
            <div style="font-family: 'Crimson Pro', Georgia, serif; font-size: 14px; color: #a89f91; font-style: italic;">
              Scenario I: The Horned Sails — 1182 BC, Levantine Coastline
            </div>
          </div>
          <button id="council-close-btn" class="svga-btn" style="padding: 4px 10px; font-size: 13px;">✕</button>
        </div>

        <!-- BODY CONTENT -->
        <div style="padding: 16px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;">
          <!-- GENERAL NARRATIVE BRIEFING -->
          <div style="
            background: rgba(22, 17, 13, 0.85);
            border-left: 3px solid #ffd166;
            padding: 10px 14px;
            font-size: 15px;
            line-height: 1.45;
            color: #f7efe1;
          ">
            <strong>The Great Collapse:</strong> Clay tablets from Hattusa and Ugarit have ceased to arrive. From the Great Green, marauding fleets crowned with horned helmets strike coastal outposts without warning. You have been granted command of this rocky promontory: lay cyclopean foundation slabs, extract the scarce Cassiterite Tin veins, and shield our artisans from the sea raiders.
          </div>

          <!-- ADVISORS CARDS -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <!-- BURNA-KHABIR -->
            <div class="stone-panel advisor-briefing-card" style="padding: 10px; border-radius: 3px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${getPortraitURL('burna_khabir')}" style="width: 48px; height: 48px; border: 1px solid #c9933b; border-radius: 2px;" alt="Burna-Khabir" />
                <div>
                  <div style="font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700; color: #ffd166;">Burna-Khabir</div>
                  <div style="font-size: 11px; color: #b0a390;">Royal Scribe & Chronicler</div>
                </div>
              </div>
              <div style="font-size: 13px; color: #e8dccb; line-height: 1.35; font-style: italic;">
                "The kings of the Earth are weeping into the dust. If our Acropolis falls, our memory is extinguished forever. Guard our central Megaron with stone and blood."
              </div>
            </div>

            <!-- TARKHUNTA -->
            <div class="stone-panel advisor-briefing-card" style="padding: 10px; border-radius: 3px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${getPortraitURL('tarkhunta')}" style="width: 48px; height: 48px; border: 1px solid #ffd166; border-radius: 2px;" alt="Tarkhunta" />
                <div>
                  <div style="font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700; color: #ffd166;">Tarkhunta</div>
                  <div style="font-size: 11px; color: #b0a390;">Luwian Master Smelter</div>
                </div>
              </div>
              <div style="font-size: 13px; color: #e8dccb; line-height: 1.35; font-style: italic;">
                "Copper is as soft as river mud without Cassiterite! Send Donkey Caravans to the northeast sand dunes immediately. We need 200 bars of pure Tin for the armory."
              </div>
            </div>

            <!-- ZALPA -->
            <div class="stone-panel advisor-briefing-card" style="padding: 10px; border-radius: 3px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${getPortraitURL('zalpa')}" style="width: 48px; height: 48px; border: 1px solid #2de0a5; border-radius: 2px;" alt="Zalpa" />
                <div>
                  <div style="font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700; color: #ffd166;">Zalpa</div>
                  <div style="font-size: 11px; color: #b0a390;">Kaska Scout Captain</div>
                </div>
              </div>
              <div style="font-size: 13px; color: #e8dccb; line-height: 1.35; font-style: italic;">
                "Bird prows have been spotted off the western dunes. Erect a Cyclopean Watchtower on the coastal approach to detect landing craft before they overrun our workshops!"
              </div>
            </div>
          </div>

          <!-- MISSION OBJECTIVES LIST -->
          <div style="
            background: rgba(15, 12, 10, 0.9);
            border: 1px solid #5a4c3f;
            border-radius: 3px;
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          ">
            <div style="font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: #ffd166; border-bottom: 1px solid #3d3227; padding-bottom: 4px;">
              TABLET OF MANDATES & OBJECTIVES
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
                <span style="color: #ffd166; font-weight: bold;">[PRIMARY]</span>
                <span>Erect a Cyclopean Watchtower to secure the coastal approaches (0 / 1)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
                <span style="color: #ffd166; font-weight: bold;">[PRIMARY]</span>
                <span>Stockpile at least 200 bars of Cassiterite Tin to forge weapons of war</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
                <span style="color: #ffd166; font-weight: bold;">[PRIMARY]</span>
                <span>Withstand and repel 3 Sea Peoples landing waves without losing your Acropolis</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #b0a390;">
                <span style="color: #a0a8b0; font-weight: bold;">[SECONDARY]</span>
                <span>Protect the Bronze Foundry from coastal raiding parties</span>
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER ACTION BAR -->
        <div style="
          padding: 12px 20px;
          background: linear-gradient(180deg, #201a14 0%, #15110d 100%);
          border-top: 1px solid #3d3227;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        ">
          <button id="council-deploy-btn" class="svga-btn" style="
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 1px;
            background: linear-gradient(180deg, #8a6234 0%, #573c1c 100%);
            border-color: #ffd166;
            color: #fff9e6;
          ">
            ⚔ MARCH TO BATTLE
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;

    const closeBtn = document.getElementById('council-close-btn');
    const deployBtn = document.getElementById('council-deploy-btn');

    closeBtn?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
    });

    deployBtn?.addEventListener('click', () => {
      EventBus.get().emit('audio:command');
      this.hide();
      if (this.onDeployCallback) this.onDeployCallback();
    });
  }

  public show(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'flex';
      EventBus.get().emit('audio:select');
    }
  }

  public hide(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
    }
  }
}
