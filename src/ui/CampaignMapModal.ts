import { EventBus } from '../core/EventBus.ts';
import { SaveManager } from '../services/SaveManager.ts';
import { CAMPAIGN_ACTS, CAMPAIGN_SCENARIOS, CampaignScenarioMeta } from '../data/campaignActs.ts';

export class CampaignMapModal {
  private overlayEl: HTMLElement | null = null;
  private selectedScenario: CampaignScenarioMeta = CAMPAIGN_SCENARIOS[0];
  private selectedActIndex: number = 1;
  public onSelectScenario?: (scenarioId: string) => void;
  public onClose?: () => void;

  constructor() {
    this.createDOM();
  }

  private createDOM(): void {
    const existing = document.getElementById('campaign-map-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'campaign-map-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(6, 4, 3, 0.95);
      display: flex;
      flex-direction: column;
      z-index: 950;
      overflow: hidden;
      user-select: none;
    `;

    overlay.innerHTML = `
      <!-- TOP NAV BAR -->
      <div class="stone-panel" style="
        height: 54px;
        padding: 6px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 2px solid #c9933b;
        flex-shrink: 0;
      ">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="font-family: 'Cinzel', serif; font-size: 18px; font-weight: 900; color: #ffd166; letter-spacing: 1.5px;">
            EASTERN MEDITERRANEAN STRATEGIC MAP · 1200 BC
          </div>
          <div id="campaign-progress-badge" style="
            font-size: 12px;
            color: #d1b48c;
            background: rgba(30, 22, 16, 0.85);
            padding: 3px 10px;
            border: 1px solid #735327;
            border-radius: 3px;
            font-family: 'Cinzel', serif;
          ">
            0 / 18 SCENARIOS SECURED
          </div>
        </div>

        <button id="campaign-map-close-btn" class="svga-btn" style="padding: 6px 14px; font-weight: bold; font-size: 12px;">
          ✕ CLOSE MAP
        </button>
      </div>

      <!-- MAIN CONTENT: ACT TABS + MAP CANVAS/VIEWPORT + SCENARIO INTEL CARD -->
      <div style="display: flex; flex: 1; overflow: hidden; position: relative;">
        <!-- LEFT: ACT SELECTOR TABS -->
        <div class="stone-panel" style="
          width: 250px;
          height: 100%;
          border-right: 2px solid #3d3227;
          display: flex;
          flex-direction: column;
          padding: 8px;
          gap: 8px;
          flex-shrink: 0;
          overflow-y: auto;
        ">
          <div style="font-family: 'Cinzel', serif; font-size: 12px; font-weight: bold; color: #ffd166; padding-bottom: 4px; border-bottom: 1px solid #4a3e33;">
            CAMPAIGN ACTS
          </div>

          <div id="act-buttons-container" style="display: flex; flex-direction: column; gap: 6px;"></div>
        </div>

        <!-- CENTER: ANCIENT MEDITERRANEAN PARCHMENT MAP -->
        <div style="
          flex: 1;
          height: 100%;
          position: relative;
          background: #121c21;
          overflow: hidden;
          cursor: grab;
        ">
          <!-- MAP CANVAS (Coastlines, Regions, Trade Routes, Nodes) -->
          <canvas id="strategic-map-canvas" style="display: block; width: 100%; height: 100%;"></canvas>

          <!-- MAP LEGEND OVERLAY -->
          <div style="
            position: absolute;
            bottom: 12px;
            left: 12px;
            background: rgba(18, 14, 11, 0.85);
            border: 1px solid #5a4c3f;
            border-radius: 3px;
            padding: 6px 10px;
            display: flex;
            gap: 14px;
            font-size: 11px;
            color: #d1b48c;
            font-family: 'Cinzel', serif;
            pointer-events: none;
          ">
            <div><span style="color: #2de0a5; font-weight: bold;">●</span> Cleared</div>
            <div><span style="color: #ffd166; font-weight: bold;">●</span> Active Mandate</div>
            <div><span style="color: #5a4c3f; font-weight: bold;">●</span> Locked Territory</div>
          </div>
        </div>

        <!-- RIGHT: SCENARIO INTEL PANEL -->
        <div class="stone-panel" style="
          width: 320px;
          height: 100%;
          border-left: 2px solid #3d3227;
          display: flex;
          flex-direction: column;
          padding: 14px;
          gap: 12px;
          flex-shrink: 0;
          overflow-y: auto;
        ">
          <div style="font-family: 'Cinzel', serif; font-size: 11px; color: #c9933b; text-transform: uppercase; font-weight: bold;">
            Scenario Intelligence
          </div>

          <div id="intel-scenario-title" style="font-family: 'Cinzel', serif; font-size: 17px; font-weight: 900; color: #ffd166; line-height: 1.2;">
            The Horned Sails
          </div>

          <div id="intel-scenario-meta" style="font-size: 12px; color: #a89f91; font-style: italic;">
            Act I · 1182 BC · Levantine Coast (Kadesh-on-Sea)
          </div>

          <div id="intel-scenario-status" style="
            display: inline-block;
            padding: 2px 8px;
            border-radius: 2px;
            font-size: 11px;
            font-weight: bold;
            font-family: 'Cinzel', serif;
          "></div>

          <div style="border-top: 1px solid #3d3227; padding-top: 8px;">
            <div style="font-family: 'Cinzel', serif; font-size: 11px; color: #b5a898; margin-bottom: 4px; font-weight: bold;">
              Briefing Synopsis:
            </div>
            <div id="intel-scenario-summary" style="font-size: 13px; line-height: 1.4; color: #f7efe1;"></div>
          </div>

          <div style="margin-top: auto; padding-top: 12px;">
            <button id="intel-btn-deploy" class="svga-btn" style="
              width: 100%;
              padding: 12px;
              font-size: 14px;
              font-weight: 900;
              letter-spacing: 1px;
              background: linear-gradient(180deg, #785a2f 0%, #473215 100%);
              border-color: #ffd166;
              color: #fff8e8;
            ">
              ⚔ COMMENCE MISSION
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;

    this.bindEvents();
  }

  private bindEvents(): void {
    document.getElementById('campaign-map-close-btn')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onClose) this.onClose();
    });

    document.getElementById('intel-btn-deploy')?.addEventListener('click', () => {
      if (!this.selectedScenario) return;
      const save = SaveManager.get();
      const isCompleted = save.isScenarioCompleted(this.selectedScenario.id);
      const isCurrent = save.getData().currentScenarioId === this.selectedScenario.id;

      // Allow if unlocked or already cleared
      if (isCurrent || isCompleted || this.selectedScenario.scenarioIndex === 1) {
        EventBus.get().emit('audio:command');
        this.hide();
        if (this.onSelectScenario) {
          this.onSelectScenario(this.selectedScenario.id);
        }
      } else {
        EventBus.get().emit('audio:click');
        alert('This territory is locked! Complete prior mandates to advance.');
      }
    });

    const canvas = document.getElementById('strategic-map-canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.addEventListener('click', (e) => this.handleCanvasClick(e, canvas));
    }
  }

  public show(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'flex';
      this.renderActButtons();
      this.refreshMap();
      this.selectScenario(this.selectedScenario);
      EventBus.get().emit('audio:select');
    }
  }

  public hide(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
    }
  }

  private renderActButtons(): void {
    const container = document.getElementById('act-buttons-container');
    if (!container) return;

    container.innerHTML = '';
    const save = SaveManager.get();

    for (const act of CAMPAIGN_ACTS) {
      const btn = document.createElement('button');
      const isSelected = act.act === this.selectedActIndex;
      btn.className = 'svga-btn';
      btn.style.cssText = `
        padding: 8px 10px;
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 2px;
        ${isSelected ? 'background: linear-gradient(180deg, #6b4d24 0%, #3d2b14 100%); border-color: #ffd166;' : ''}
      `;

      // Count cleared scenarios in this Act
      const clearedInAct = act.scenarios.filter(s => save.isScenarioCompleted(s.id)).length;

      btn.innerHTML = `
        <div style="font-family: 'Cinzel', serif; font-size: 11px; font-weight: bold; color: ${isSelected ? '#ffd166' : '#d1b48c'};">
          ${act.title.split(':')[0]}
        </div>
        <div style="font-size: 11px; color: #f7efe1; font-weight: 600;">
          ${act.title.split(':')[1] || act.subtitle}
        </div>
        <div style="font-size: 10px; color: #a89f91;">
          Progress: ${clearedInAct}/${act.scenarios.length} Cleared
        </div>
      `;

      btn.addEventListener('click', () => {
        EventBus.get().emit('audio:click');
        this.selectedActIndex = act.act;
        this.renderActButtons();
        // Select first scenario of this act
        if (act.scenarios.length > 0) {
          this.selectScenario(act.scenarios[0]);
        }
        this.drawStrategicMap();
      });

      container.appendChild(btn);
    }

    // Badge
    const badge = document.getElementById('campaign-progress-badge');
    if (badge) {
      const totalCleared = save.getData().completedScenarios.length;
      badge.textContent = `${totalCleared} / 18 SCENARIOS SECURED`;
    }
  }

  private selectScenario(sc: CampaignScenarioMeta): void {
    this.selectedScenario = sc;
    const save = SaveManager.get();
    const isCompleted = save.isScenarioCompleted(sc.id);
    const isCurrent = save.getData().currentScenarioId === sc.id;
    const isUnlocked = isCurrent || isCompleted || sc.scenarioIndex === 1;

    document.getElementById('intel-scenario-title')!.textContent = `${sc.scenarioIndex}. ${sc.title}`;
    document.getElementById('intel-scenario-meta')!.textContent = `Act ${sc.act} · ${sc.yearBC} BC · ${sc.region}`;
    document.getElementById('intel-scenario-summary')!.textContent = sc.summary;

    const statusEl = document.getElementById('intel-scenario-status')!;
    const deployBtn = document.getElementById('intel-btn-deploy') as HTMLButtonElement;

    if (isCompleted) {
      statusEl.textContent = '✓ TERRITORY SECURED';
      statusEl.style.background = 'rgba(45, 224, 165, 0.2)';
      statusEl.style.color = '#2de0a5';
      statusEl.style.border = '1px solid #2de0a5';
      deployBtn.textContent = '↺ REPLAY MISSION';
      deployBtn.style.opacity = '1';
    } else if (isUnlocked) {
      statusEl.textContent = '⚔ ACTIVE CAMPAIGN MANDATE';
      statusEl.style.background = 'rgba(255, 209, 102, 0.2)';
      statusEl.style.color = '#ffd166';
      statusEl.style.border = '1px solid #ffd166';
      deployBtn.textContent = '⚔ COMMENCE MISSION';
      deployBtn.style.opacity = '1';
    } else {
      statusEl.textContent = '🔒 TERRITORY LOCKED';
      statusEl.style.background = 'rgba(74, 62, 51, 0.3)';
      statusEl.style.color = '#a89f91';
      statusEl.style.border = '1px solid #4a3e33';
      deployBtn.textContent = '🔒 COMPLETE PRIOR MANDATES';
      deployBtn.style.opacity = '0.5';
    }

    this.drawStrategicMap();
  }

  private refreshMap(): void {
    const canvas = document.getElementById('strategic-map-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    this.drawStrategicMap();
  }

  private drawStrategicMap(): void {
    const canvas = document.getElementById('strategic-map-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Deep Mediterranean Sea background
    const seaG = ctx.createLinearGradient(0, 0, w, h);
    seaG.addColorStop(0, '#102026');
    seaG.addColorStop(0.5, '#0b161a');
    seaG.addColorStop(1, '#060d0f');
    ctx.fillStyle = seaG;
    ctx.fillRect(0, 0, w, h);

    // 2. Ancient parchment grid lines
    ctx.strokeStyle = 'rgba(201, 147, 59, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 3. Render Historical Landmasses (Levant, Cyprus, Egypt, Anatolia)
    ctx.fillStyle = '#2e261d';
    ctx.strokeStyle = '#c9933b';
    ctx.lineWidth = 1.5;

    // Anatolia (North)
    ctx.beginPath();
    ctx.moveTo(w * 0.2, 0);
    ctx.bezierCurveTo(w * 0.4, h * 0.15, w * 0.7, h * 0.18, w * 0.9, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w * 0.2, 0);
    ctx.fill(); ctx.stroke();

    // Levant (East coast)
    ctx.beginPath();
    ctx.moveTo(w * 0.68, h * 0.22);
    ctx.bezierCurveTo(w * 0.72, h * 0.45, w * 0.76, h * 0.7, w * 0.78, h * 0.9);
    ctx.lineTo(w, h);
    ctx.lineTo(w, h * 0.22);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Cyprus (Alashiya)
    ctx.beginPath();
    ctx.ellipse(w * 0.52, h * 0.51, w * 0.08, h * 0.05, 0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Egypt / Nile Delta (South)
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h);
    ctx.bezierCurveTo(w * 0.45, h * 0.82, w * 0.65, h * 0.85, w * 0.78, h);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Region Labels
    ctx.fillStyle = 'rgba(217, 180, 140, 0.45)';
    ctx.font = '11px Cinzel, serif';
    ctx.fillText('ANATOLIA (HATTUSA)', w * 0.35, h * 0.12);
    ctx.fillText('GREAT GREEN (MEDITERRANEAN)', w * 0.25, h * 0.42);
    ctx.fillText('ALASHIYA (CYPRUS)', w * 0.46, h * 0.58);
    ctx.fillText('LEVANT (UGARIT & KADESH)', w * 0.78, h * 0.45);
    ctx.fillText('NILE DELTA (KEMET)', w * 0.48, h * 0.94);

    // 4. Connecting campaign routes for current Act
    const actScenarios = CAMPAIGN_SCENARIOS.filter(s => s.act === this.selectedActIndex);
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i < actScenarios.length; i++) {
      const sx = (actScenarios[i].mapX / 100) * w;
      const sy = (actScenarios[i].mapY / 100) * h;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Draw Scenario Nodes
    const save = SaveManager.get();
    for (const sc of actScenarios) {
      const nx = (sc.mapX / 100) * w;
      const ny = (sc.mapY / 100) * h;

      const isCompleted = save.isScenarioCompleted(sc.id);
      const isCurrent = save.getData().currentScenarioId === sc.id;
      const isSelected = sc.id === this.selectedScenario?.id;

      // Glow halo for active / selected
      if (isSelected || isCurrent) {
        ctx.fillStyle = 'rgba(255, 209, 102, 0.3)';
        ctx.beginPath();
        ctx.arc(nx, ny, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Base node circle
      ctx.beginPath();
      ctx.arc(nx, ny, 9, 0, Math.PI * 2);

      if (isCompleted) {
        ctx.fillStyle = '#2de0a5';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
      } else if (isCurrent || sc.scenarioIndex === 1) {
        ctx.fillStyle = '#ffd166';
        ctx.fill();
        ctx.strokeStyle = '#c9933b';
      } else {
        ctx.fillStyle = '#3a2f27';
        ctx.fill();
        ctx.strokeStyle = '#5a4c3f';
      }
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node number
      ctx.fillStyle = '#0f0c09';
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sc.scenarioIndex.toString(), nx, ny);

      // Node title label
      ctx.fillStyle = isSelected ? '#ffd166' : '#e8dccb';
      ctx.font = isSelected ? 'bold 11px Cinzel, serif' : '10px Crimson Pro, serif';
      ctx.fillText(sc.title, nx, ny + 17);
    }
  }

  private handleCanvasClick(e: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const w = canvas.width;
    const h = canvas.height;

    const actScenarios = CAMPAIGN_SCENARIOS.filter(s => s.act === this.selectedActIndex);

    for (const sc of actScenarios) {
      const nx = (sc.mapX / 100) * w;
      const ny = (sc.mapY / 100) * h;
      const dist = Math.hypot(cx - nx, cy - ny);

      if (dist <= 22) {
        EventBus.get().emit('audio:click');
        this.selectScenario(sc);
        break;
      }
    }
  }
}
