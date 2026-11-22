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
      display: none;
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

    window.addEventListener('resize', () => {
      if (this.overlayEl && this.overlayEl.style.display !== 'none') {
        this.refreshMap();
      }
    });
  }

  public show(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'flex';
      this.renderActButtons();
      // Use requestAnimationFrame to ensure container dimensions are computed after flex layout reflow
      requestAnimationFrame(() => {
        this.refreshMap();
        this.selectScenario(this.selectedScenario);
      });
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
      const rect = parent.getBoundingClientRect();
      canvas.width = Math.max(rect.width, 600);
      canvas.height = Math.max(rect.height, 450);
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

    // Coordinate mapping helper
    const mx = (pct: number) => (pct / 100) * w;
    const my = (pct: number) => (pct / 100) * h;

    // 1. DEEP MEDITERRANEAN SEA BACKGROUND (Ancient Sea of Darkness / Great Green)
    const seaG = ctx.createRadialGradient(w * 0.35, h * 0.55, 30, w * 0.35, h * 0.55, w * 0.85);
    seaG.addColorStop(0, '#152b33');
    seaG.addColorStop(0.4, '#0d1e24');
    seaG.addColorStop(0.8, '#081217');
    seaG.addColorStop(1, '#04090b');
    ctx.fillStyle = seaG;
    ctx.fillRect(0, 0, w, h);

    // 2. NAUTICAL RHUMB LINES (Portolan chart navigation lines radiating across the sea)
    const roseX = mx(30);
    const roseY = my(55);

    ctx.save();
    ctx.strokeStyle = 'rgba(217, 180, 140, 0.08)';
    ctx.lineWidth = 1;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
      ctx.beginPath();
      ctx.moveTo(roseX, roseY);
      ctx.lineTo(roseX + Math.cos(angle) * w * 1.5, roseY + Math.sin(angle) * w * 1.5);
      ctx.stroke();
    }

    // Secondary rhumb center in the northern Aegean
    const rose2X = mx(14);
    const rose2Y = my(18);
    ctx.strokeStyle = 'rgba(201, 147, 59, 0.05)';
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      ctx.beginPath();
      ctx.moveTo(rose2X, rose2Y);
      ctx.lineTo(rose2X + Math.cos(angle) * w * 1.2, rose2Y + Math.sin(angle) * w * 1.2);
      ctx.stroke();
    }
    ctx.restore();

    // 3. PARCHMENT LATITUDE / LONGITUDE CARTO-GRID
    ctx.strokeStyle = 'rgba(201, 147, 59, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 55) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 55) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 4. WATER WAVES TEXTURE (Subtle ancient woodcut ripples in open sea)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const waveSeeds = [
      [22, 38], [24, 40], [32, 42], [34, 45], [20, 65], [23, 67],
      [36, 68], [38, 70], [42, 62], [44, 65], [16, 75], [18, 78],
      [28, 30], [32, 28], [48, 40], [52, 38], [62, 60], [64, 62]
    ];
    for (const [wx, wy] of waveSeeds) {
      const rx = mx(wx);
      const ry = my(wy);
      ctx.beginPath();
      ctx.arc(rx, ry, 12, Math.PI * 0.2, Math.PI * 0.8, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rx + 16, ry, 12, Math.PI * 0.2, Math.PI * 0.8, false);
      ctx.stroke();
    }

    // 5. DEFINE DETAILED GEOGRAPHICAL PATHS
    // A) CONTINENTAL LANDMASS (Anatolia, Levant, Sinai, Egypt, Marmarica)
    const drawContinent = () => {
      ctx.beginPath();
      // Start North-West corner
      ctx.moveTo(0, 0);
      // Lycia / Aegean Anatolian coast
      ctx.lineTo(mx(0), my(16));
      ctx.bezierCurveTo(mx(4), my(17), mx(8), my(20), mx(12), my(22));
      ctx.bezierCurveTo(mx(16), my(24), mx(20), my(26), mx(24), my(26.5));
      // Gulf of Pamphylia / Antalya
      ctx.bezierCurveTo(mx(27), my(23), mx(29), my(22), mx(32), my(24));
      ctx.bezierCurveTo(mx(35), my(26), mx(38), my(29), mx(42), my(32.5)); // Cape Anamur
      // Cilicia Trachea & Pedias
      ctx.bezierCurveTo(mx(46), my(31), mx(51), my(30), mx(57), my(30.5));
      // Gulf of Issus (Alexandretta inlet)
      ctx.bezierCurveTo(mx(61), my(28), mx(63.5), my(26), mx(65), my(28));
      ctx.bezierCurveTo(mx(66), my(30), mx(65.5), my(32), mx(65), my(33));
      // Northern Levant / Mount Kasios / Ugarit (Ras Shamra)
      ctx.bezierCurveTo(mx(66.5), my(36), mx(68), my(38), mx(69.5), my(41));
      // Amurru / Arwad (Island of Arados) / Tripoli
      ctx.bezierCurveTo(mx(71), my(45), mx(71.5), my(48), mx(72), my(52));
      // Phoenicia (Byblos, Berytus, Sidon, Tyre)
      ctx.bezierCurveTo(mx(73), my(55), mx(73.5), my(58), mx(73.5), my(61));
      ctx.bezierCurveTo(mx(73.5), my(63), mx(73), my(65), mx(72.5), my(66.5));
      // Mount Carmel & Bay of Acre
      ctx.bezierCurveTo(mx(71.2), my(68.5), mx(71.5), my(70), mx(70.5), my(71));
      // Sharon & Philistine coast (Dor, Ashdod, Ashkelon, Gaza)
      ctx.bezierCurveTo(mx(69), my(74), mx(67), my(78), mx(64), my(81.5));
      // Sinai Shore & Lake Bardawil (Serbonian Bog)
      ctx.bezierCurveTo(mx(60), my(84.5), mx(56), my(86.5), mx(52), my(87));
      // NILE DELTA (Fanned green delta with Pelusiac, Damietta, and Rosetta promontories)
      ctx.bezierCurveTo(mx(48), my(85), mx(44), my(83.5), mx(41), my(83)); // Burullus cape
      ctx.bezierCurveTo(mx(37), my(83.5), mx(33), my(85.5), mx(30), my(88)); // Abu Qir & Alexandria
      // Marmarica / North African coast toward Libya
      ctx.bezierCurveTo(mx(22), my(90.5), mx(12), my(92), mx(0), my(93.5));
      // Close border frame to fill entire land interior
      ctx.lineTo(0, h);
      ctx.lineTo(w, h);
      ctx.lineTo(w, 0);
      ctx.closePath();
    };

    // B) CYPRUS (ALASHIYA) - Detailed historical contour with Karpas horn pointing NE
    const drawCyprus = () => {
      ctx.beginPath();
      // Karpas horn tip pointing northeast toward Issus and Ugarit
      ctx.moveTo(mx(61.2), my(43.5));
      // Northern Kyrenia ridge coast
      ctx.bezierCurveTo(mx(59.5), my(44.8), mx(57), my(46.2), mx(53.5), my(47.5));
      ctx.bezierCurveTo(mx(50.5), my(48.5), mx(48), my(49.5), mx(46.5), my(50.8)); // Morphou Bay
      // Western Akamas Peninsula
      ctx.bezierCurveTo(mx(45.2), my(51.8), mx(45.5), my(53), mx(46.5), my(54.5));
      // Southwestern Paphos coast
      ctx.bezierCurveTo(mx(47.5), my(55.8), mx(49), my(56.8), mx(51.2), my(57.5)); // Akrotiri Cape Gata
      // Southern coast & Larnaca Bay
      ctx.bezierCurveTo(mx(53), my(56.5), mx(54.5), my(55.2), mx(56.2), my(54.8));
      // Cape Greco promontory
      ctx.bezierCurveTo(mx(57.8), my(54.2), mx(58.5), my(53.2), mx(57.5), my(51.5));
      // Famagusta Bay returning to base of Karpas
      ctx.bezierCurveTo(mx(56.5), my(49.5), mx(57.5), my(47), mx(59.5), my(45));
      ctx.closePath();
    };

    // C) RHODES (ISLE OF RHODOS)
    const drawRhodes = () => {
      ctx.beginPath();
      ctx.moveTo(mx(13.5), my(27.5));
      ctx.lineTo(mx(16.5), my(25));
      ctx.lineTo(mx(17.5), my(26.5));
      ctx.lineTo(mx(14.8), my(30));
      ctx.closePath();
    };

    // D) EASTERN CRETE (KAPO SIDERO & SITIA)
    const drawCrete = () => {
      ctx.beginPath();
      ctx.moveTo(0, my(39));
      ctx.bezierCurveTo(mx(3.5), my(37.5), mx(6), my(38), mx(6.8), my(39.5));
      ctx.bezierCurveTo(mx(5.5), my(41.5), mx(3), my(42.5), 0, my(43));
      ctx.closePath();
    };

    // 6. DRAW SHALLOW COASTAL WATERS (Bathymetric turquoise/gold sea glow)
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(45, 224, 165, 0.35)';
    ctx.strokeStyle = 'rgba(45, 224, 165, 0.45)';
    ctx.lineWidth = 3.5;
    drawContinent(); ctx.stroke();
    drawCyprus(); ctx.stroke();
    drawRhodes(); ctx.stroke();
    drawCrete(); ctx.stroke();

    // Outer ripple ring
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(201, 147, 59, 0.2)';
    ctx.lineWidth = 1;
    drawContinent(); ctx.stroke();
    drawCyprus(); ctx.stroke();
    ctx.restore();

    // 7. RENDER LANDMASS BASE & TEXTURED SHADING
    // Ancient Ochre / Earth / Bronze Pigment Gradient
    const landG = ctx.createLinearGradient(0, 0, w, h);
    landG.addColorStop(0, '#2e251b'); // Dark Anatolian highlands
    landG.addColorStop(0.35, '#382e22'); // Cilicia & Taurus
    landG.addColorStop(0.65, '#3b3021'); // Fertile Levant & Orontes
    landG.addColorStop(0.9, '#2f2418'); // Egyptian desert & Nile silt
    ctx.fillStyle = landG;

    // Fill all landmasses
    drawContinent(); ctx.fill();
    drawCyprus(); ctx.fill();
    drawRhodes(); ctx.fill();
    drawCrete(); ctx.fill();

    // Coastline borders (Fired bronze incised line)
    ctx.strokeStyle = '#c9933b';
    ctx.lineWidth = 1.8;
    drawContinent(); ctx.stroke();
    drawCyprus(); ctx.stroke();
    drawRhodes(); ctx.stroke();
    drawCrete(); ctx.stroke();

    // 8. HISTORICAL RIVERS (Nile, Orontes, Jordan / Dead Sea, Euphrates)
    ctx.save();
    ctx.strokeStyle = '#4da699';
    ctx.lineWidth = 1.8;

    // The Nile River & Delta branches
    ctx.beginPath();
    ctx.moveTo(mx(41), my(100));
    ctx.bezierCurveTo(mx(42), my(95), mx(41.5), my(91), mx(41), my(87)); // Main stem to Delta apex
    // Rosetta branch
    ctx.bezierCurveTo(mx(38), my(86), mx(35), my(85.8), mx(34), my(85.5));
    ctx.moveTo(mx(41), my(87));
    // Damietta branch
    ctx.bezierCurveTo(mx(44), my(86), mx(46.5), my(85.5), mx(47.5), my(85));
    ctx.stroke();

    // The Orontes River (Siria / Kadesh / Amurru)
    ctx.beginPath();
    ctx.moveTo(mx(74.5), my(58)); // Source in Beqaa near Kadesh
    ctx.bezierCurveTo(mx(75.5), my(52), mx(74), my(46), mx(72), my(42));
    ctx.bezierCurveTo(mx(70), my(40), mx(68), my(38), mx(67), my(37.5)); // Mouth near Ugarit
    ctx.stroke();

    // Dead Sea & Jordan Rift
    ctx.beginPath();
    ctx.moveTo(mx(73.5), my(68));
    ctx.lineTo(mx(73.5), my(74));
    ctx.stroke();
    ctx.fillStyle = '#4da699';
    ctx.fillRect(mx(73.2), my(74), mx(0.8), my(3)); // Dead Sea basin

    // Euphrates River in Mesopotamia (Upper right)
    ctx.beginPath();
    ctx.moveTo(mx(80), my(0));
    ctx.bezierCurveTo(mx(82), my(8), mx(86), my(14), mx(92), my(20));
    ctx.bezierCurveTo(mx(95), my(24), mx(98), my(26), mx(100), my(28));
    ctx.stroke();
    ctx.restore();

    // 9. HAND-DRAWN MOUNTAIN RIDGES (Ancient cartographic hachure cones)
    const drawMountainRange = (startX: number, startY: number, count: number, stepX: number, stepY: number, size: number) => {
      ctx.save();
      for (let i = 0; i < count; i++) {
        const px = mx(startX) + i * stepX;
        const py = my(startY) + i * stepY;
        ctx.fillStyle = '#221b13';
        ctx.strokeStyle = '#c9933b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py + size);
        ctx.lineTo(px + size * 0.7, py - size * 0.8);
        ctx.lineTo(px + size * 1.4, py + size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shading hatch on the east flank
        ctx.beginPath();
        ctx.moveTo(px + size * 0.7, py - size * 0.8);
        ctx.lineTo(px + size * 0.7, py + size);
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)';
        ctx.stroke();
      }
      ctx.restore();
    };

    // Taurus Mountains (Cilicia / Southern Anatolia)
    drawMountainRange(20, 20, 7, 18, 2, 7);
    drawMountainRange(34, 23, 8, 16, 2, 8);
    drawMountainRange(50, 24, 7, 16, 1, 9);

    // Lebanon & Anti-Lebanon Mountain Ranges (Cedars of God)
    drawMountainRange(74, 49, 9, 1, 15, 8);
    drawMountainRange(76, 52, 7, 1, 16, 7);

    // Troodos Mountains on Cyprus (Copper veins)
    drawMountainRange(48.5, 52, 4, 14, -2, 7);

    // Sinai Mountain Crags
    drawMountainRange(60, 89, 5, 12, 10, 7);

    // 10. COMPASS ROSE (Rosa dei Venti - 16-point Golden Navigational Star)
    ctx.save();
    ctx.translate(roseX, roseY);

    // Outer Brass Ring
    ctx.strokeStyle = '#c9933b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(201, 147, 59, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.stroke();

    // 16 Compass Points
    const numPoints = 16;
    for (let p = 0; p < numPoints; p++) {
      const isCardinal = p % 4 === 0;
      const isInter = p % 2 === 0;
      const len = isCardinal ? 42 : (isInter ? 30 : 20);
      const angle = (p * Math.PI * 2) / numPoints;
      const halfAngle = Math.PI / numPoints;

      // Dark half
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.lineTo(Math.cos(angle + halfAngle) * (len * 0.35), Math.sin(angle + halfAngle) * (len * 0.35));
      ctx.closePath();
      ctx.fillStyle = '#473215';
      ctx.fill();

      // Light gold half
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.lineTo(Math.cos(angle - halfAngle) * (len * 0.35), Math.sin(angle - halfAngle) * (len * 0.35));
      ctx.closePath();
      ctx.fillStyle = '#ffd166';
      ctx.fill();
    }

    // North Fleur-de-lis / Arrowhead
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(6, -38);
    ctx.lineTo(0, -41);
    ctx.lineTo(-6, -38);
    ctx.closePath();
    ctx.fill();

    // Center pivot jewel
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#c9933b';
    ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.stroke();

    // Cardinal Labels
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -56);
    ctx.fillText('E', 50, 0);
    ctx.fillText('S', 0, 50);
    ctx.fillText('W', -50, 0);
    ctx.restore();

    // 11. SEA PEOPLES HORNED WAR SKIFF (Drawn sailing west of Cyprus)
    ctx.save();
    const shipX = mx(36);
    const shipY = my(42);
    ctx.translate(shipX, shipY);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.4;

    // Hull with high upturned bird prow and stern
    ctx.beginPath();
    ctx.moveTo(-22, -3);
    ctx.bezierCurveTo(-26, -14, -28, -18, -25, -20); // Bird-head prow
    ctx.bezierCurveTo(-20, -10, -12, 4, 0, 5);
    ctx.bezierCurveTo(12, 4, 20, -10, 25, -18); // High stern
    ctx.lineTo(21, -3);
    ctx.closePath();
    ctx.fillStyle = '#2b1c11';
    ctx.fill();
    ctx.stroke();

    // Mast & Horned Sail
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, -26); // Mast
    ctx.stroke();

    // Square sail with braided brail ropes
    ctx.beginPath();
    ctx.moveTo(-16, -24);
    ctx.lineTo(16, -24);
    ctx.bezierCurveTo(14, -12, -14, -12, -16, -24);
    ctx.fillStyle = 'rgba(255, 235, 190, 0.85)';
    ctx.fill();
    ctx.stroke();

    // Label under ship
    ctx.fillStyle = 'rgba(255, 209, 102, 0.7)';
    ctx.font = 'italic 9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Horned Raiders of the Sea', 0, 16);
    ctx.restore();

    // 12. ANCIENT TOPONYMS (Authentic 1200 BC Inscriptions)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 225, 160, 0.55)';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.letterSpacing = '2px';

    // Anatolia / Hatti
    ctx.fillText('EMPIRE OF HATTI (ANATOLIA)', mx(18), my(12));
    ctx.font = 'italic 10px Cinzel, serif';
    ctx.fillText('Taurus Iron Crags · Kizzuwatna', mx(22), my(15.5));

    // Great Green
    ctx.font = 'bold 14px Cinzel, serif';
    ctx.fillStyle = 'rgba(77, 166, 153, 0.5)';
    ctx.fillText('THE GREAT GREEN (WADJ-WER)', mx(16), my(49));

    // Cyprus / Alashiya
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillStyle = 'rgba(255, 209, 102, 0.75)';
    ctx.fillText('ALASHIYA (CYPRUS)', mx(47.5), my(46));
    ctx.font = 'italic 9px Cinzel, serif';
    ctx.fillText('Isle of Copper', mx(50.5), my(59.5));

    // Levant / Amurru / Phoenicia / Ugarit
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.fillStyle = 'rgba(255, 225, 160, 0.7)';
    ctx.fillText('KINGDOM OF UGARIT', mx(76), my(38));
    ctx.fillText('AMURRU & PHOENICIA', mx(78), my(48));
    ctx.fillText('CANAANITE HIGHLANDS', mx(78), my(65));

    // Egypt / Nile Delta
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.fillStyle = 'rgba(255, 209, 102, 0.65)';
    ctx.fillText('KEMET (NILE DELTA)', mx(35), my(92));
    ctx.font = 'italic 9px Cinzel, serif';
    ctx.fillText('Kingdom of the Two Lands', mx(35), my(95));

    // Sinai
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillText('SINAI WILDERNESS', mx(62), my(92));
    ctx.restore();

    // 13. CONNECTING CAMPAIGN ROUTES FOR CURRENT ACT
    const actScenarios = CAMPAIGN_SCENARIOS.filter(s => s.act === this.selectedActIndex);
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i < actScenarios.length; i++) {
      const sx = mx(actScenarios[i].mapX);
      const sy = my(actScenarios[i].mapY);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 14. DRAW SCENARIO NODES
    const save = SaveManager.get();
    for (const sc of actScenarios) {
      const nx = mx(sc.mapX);
      const ny = my(sc.mapY);

      const isCompleted = save.isScenarioCompleted(sc.id);
      const isCurrent = save.getData().currentScenarioId === sc.id;
      const isSelected = sc.id === this.selectedScenario?.id;

      // Glow halo for active / selected
      if (isSelected || isCurrent) {
        ctx.fillStyle = isSelected ? 'rgba(255, 209, 102, 0.35)' : 'rgba(45, 224, 165, 0.25)';
        ctx.beginPath();
        ctx.arc(nx, ny, 18, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing outer orbit ring
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(nx, ny, 15, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Base node circle
      ctx.beginPath();
      ctx.arc(nx, ny, 10, 0, Math.PI * 2);

      if (isCompleted) {
        ctx.fillStyle = '#2de0a5';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
      } else if (isCurrent || sc.scenarioIndex === 1) {
        ctx.fillStyle = '#ffd166';
        ctx.fill();
        ctx.strokeStyle = '#8a6234';
      } else {
        ctx.fillStyle = '#3a2f27';
        ctx.fill();
        ctx.strokeStyle = '#5a4c3f';
      }
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Node number inside circle
      ctx.fillStyle = '#0f0c09';
      ctx.font = 'bold 10px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sc.scenarioIndex.toString(), nx, ny);

      // Node title plaque with background pill for perfect readability
      ctx.save();
      ctx.font = isSelected ? 'bold 11px Cinzel, serif' : '10px Cinzel, serif';
      const textMetrics = ctx.measureText(sc.title);
      const pillW = textMetrics.width + 12;
      const pillH = 18;
      const pillX = nx - pillW / 2;
      const pillY = ny + 15;

      ctx.fillStyle = isSelected ? 'rgba(30, 22, 16, 0.95)' : 'rgba(15, 12, 10, 0.85)';
      ctx.fillRect(pillX, pillY, pillW, pillH);
      ctx.strokeStyle = isSelected ? '#ffd166' : '#5a4c3f';
      ctx.lineWidth = 1;
      ctx.strokeRect(pillX, pillY, pillW, pillH);

      ctx.fillStyle = isSelected ? '#ffd166' : '#e8dccb';
      ctx.fillText(sc.title, nx, pillY + 9);
      ctx.restore();
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

      // Hit area includes the node circle and title plaque underneath
      if (dist <= 26 || (Math.abs(cx - nx) <= 60 && cy >= ny && cy <= ny + 35)) {
        EventBus.get().emit('audio:click');
        this.selectScenario(sc);
        break;
      }
    }
  }
}
