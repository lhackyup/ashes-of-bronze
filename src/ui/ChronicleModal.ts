import { EventBus } from '../core/EventBus.ts';
import { SaveManager } from '../services/SaveManager.ts';
import { SVGAProceduralBank } from '../engine/rendering/SVGAProceduralBank.ts';

export class ChronicleModal {
  private overlayEl: HTMLElement | null = null;
  public onClose?: () => void;

  constructor() {
    this.createDOM();
  }

  private createDOM(): void {
    const existing = document.getElementById('chronicle-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'chronicle-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(6, 4, 3, 0.93);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 960;
      backdrop-filter: blur(4px);
      user-select: none;
    `;

    const bkPortrait = SVGAProceduralBank.advisorPortraits.get('burna_khabir')?.toDataURL() || '';

    overlay.innerHTML = `
      <div class="stone-panel" style="
        width: 780px;
        max-width: 95vw;
        max-height: 88vh;
        border: 2px solid #c9933b;
        box-shadow: 0 0 35px rgba(0,0,0,0.95);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      ">
        <!-- HEADER -->
        <div style="
          padding: 14px 20px;
          background: linear-gradient(180deg, #382c20 0%, #1c1510 100%);
          border-bottom: 2px solid #c9933b;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${bkPortrait}" style="width: 44px; height: 44px; border: 1px solid #ffd166; border-radius: 3px; object-fit: cover;" alt="Burna-Khabir" />
            <div>
              <div style="font-family: 'Cinzel', serif; font-size: 18px; font-weight: 900; color: #ffd166; letter-spacing: 1px;">
                THE CHRONICLE OF BURNA-KHABIR
              </div>
              <div style="font-family: 'Crimson Pro', Georgia, serif; font-size: 13px; color: #a89f91; font-style: italic;">
                Annals of the Wanax & The Fall of the Bronze Age
              </div>
            </div>
          </div>

          <button id="chronicle-close-btn" class="svga-btn" style="padding: 4px 12px; font-size: 13px;">✕ CLOSE</button>
        </div>

        <!-- JOURNAL ENTRIES LIST -->
        <div id="chronicle-entries-container" style="
          padding: 18px 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: rgba(14, 11, 8, 0.9);
        "></div>

        <!-- FOOTER -->
        <div style="
          padding: 10px 20px;
          background: linear-gradient(180deg, #1c1510 0%, #0d0a07 100%);
          border-top: 1px solid #3d3227;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #a89f91;
          font-family: 'Cinzel', serif;
        ">
          <span id="chronicle-count-label">0 Records Inscribed</span>
          <span style="font-style: italic; color: #786957;">"Words etched into fired clay outlive empires of brass."</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;

    document.getElementById('chronicle-close-btn')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onClose) this.onClose();
    });
  }

  public show(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'flex';
      this.populateEntries();
      EventBus.get().emit('audio:select');
    }
  }

  public hide(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
    }
  }

  private populateEntries(): void {
    const container = document.getElementById('chronicle-entries-container');
    const countLabel = document.getElementById('chronicle-count-label');
    if (!container) return;

    container.innerHTML = '';
    const save = SaveManager.get().getData();
    const chronicles = save.chronicles;

    if (countLabel) {
      countLabel.textContent = `${chronicles.length} Chronicles Inscribed`;
    }

    if (chronicles.length === 0) {
      container.innerHTML = `
        <div style="
          text-align: center;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #b5a898;
        ">
          <div style="font-size: 32px; color: #ffd166;">📜</div>
          <div style="font-family: 'Cinzel', serif; font-size: 16px; font-weight: bold; color: #ffd166;">
            The Tablets Await the First Victory
          </div>
          <div style="max-width: 500px; font-size: 14px; line-height: 1.45; font-style: italic;">
            "My Wanax, the clay tablets are yet unbaked. As our colony withstands the raids of the Sea Peoples and secures the veins of tin, each triumphant defense shall be forever recorded here in these annals."
          </div>
        </div>
      `;
      return;
    }

    for (const entry of chronicles) {
      const minutes = Math.floor(entry.bestTimeSeconds / 60);
      const seconds = Math.floor(entry.bestTimeSeconds % 60);
      const timeStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      const card = document.createElement('div');
      card.className = 'stone-panel';
      card.style.cssText = `
        padding: 14px 18px;
        border-radius: 3px;
        border: 1px solid #785a2b;
        background: rgba(26, 20, 15, 0.85);
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #3d3227; padding-bottom: 4px;">
          <div>
            <span style="font-family: 'Cinzel', serif; font-size: 14px; font-weight: bold; color: #ffd166;">
              ${entry.title}
            </span>
            <span style="font-size: 11px; color: #a89f91; margin-left: 8px;">Act ${entry.act}</span>
          </div>
          <div style="font-size: 11px; color: #c9933b; font-family: 'Cinzel', serif;">
            Cleared on ${entry.dateCompleted} · Time: ${timeStr}
          </div>
        </div>

        <div style="font-size: 14px; line-height: 1.45; color: #f7efe1; font-style: italic;">
          "${entry.entry}"
        </div>
      `;

      container.appendChild(card);
    }
  }
}
