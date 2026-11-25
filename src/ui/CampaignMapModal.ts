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

      // Allow if unlocked or already cleared (Scenarios 1, 2 and 3 unlocked directly during dev)
      if (isCurrent || isCompleted || this.selectedScenario.scenarioIndex <= 3) {
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
    // Allow Scenario 1, 2 and 3 directly during development
    const isUnlocked = isCurrent || isCompleted || sc.scenarioIndex <= 3;

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
      const displayW = Math.max(Math.floor(rect.width), 700);
      const displayH = Math.max(Math.floor(rect.height), 480);
      canvas.width = displayW;
      canvas.height = displayH;
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

    // Coordinate mapping helpers
    const mx = (pct: number) => (pct / 100) * w;
    const my = (pct: number) => (pct / 100) * h;

    // =========================================================================
    // 1. DEEP MEDITERRANEAN SEA BACKGROUND (The Great Green / Wadj-Wer)
    // =========================================================================
    const seaG = ctx.createRadialGradient(mx(32), my(52), 40, mx(32), my(52), w * 0.9);
    seaG.addColorStop(0, '#162e38');
    seaG.addColorStop(0.35, '#0f222a');
    seaG.addColorStop(0.7, '#09151b');
    seaG.addColorStop(1, '#04090c');
    ctx.fillStyle = seaG;
    ctx.fillRect(0, 0, w, h);

    // =========================================================================
    // 2. NAUTICAL RHUMB LINES (Portolan chart navigation rays radiating at sea)
    // =========================================================================
    const roseX = mx(30);
    const roseY = my(55);

    ctx.save();
    ctx.strokeStyle = 'rgba(217, 180, 140, 0.075)';
    ctx.lineWidth = 1;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
      ctx.beginPath();
      ctx.moveTo(roseX, roseY);
      ctx.lineTo(roseX + Math.cos(angle) * w * 1.5, roseY + Math.sin(angle) * w * 1.5);
      ctx.stroke();
    }

    // Secondary rhumb center in the northern Aegean
    const rose2X = mx(12);
    const rose2Y = my(16);
    ctx.strokeStyle = 'rgba(201, 147, 59, 0.05)';
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      ctx.beginPath();
      ctx.moveTo(rose2X, rose2Y);
      ctx.lineTo(rose2X + Math.cos(angle) * w * 1.2, rose2Y + Math.sin(angle) * w * 1.2);
      ctx.stroke();
    }
    ctx.restore();

    // =========================================================================
    // 3. PARCHMENT CARTO-GRID (Latitude & Longitude degree ticks)
    // =========================================================================
    ctx.save();
    ctx.strokeStyle = 'rgba(201, 147, 59, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 55) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 55) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.restore();

    // Subtle ancient woodcut waves in open water
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    const waveSeeds = [
      [20, 36], [23, 38], [28, 42], [32, 44], [18, 62], [22, 65],
      [36, 66], [40, 68], [42, 60], [45, 63], [14, 76], [17, 78],
      [27, 28], [31, 26], [48, 38], [52, 36], [62, 58], [65, 60],
      [8, 50], [11, 52], [25, 82], [29, 84]
    ];
    for (const [wx, wy] of waveSeeds) {
      const rx = mx(wx);
      const ry = my(wy);
      ctx.beginPath();
      ctx.arc(rx, ry, 10, Math.PI * 0.2, Math.PI * 0.8, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rx + 14, ry, 10, Math.PI * 0.2, Math.PI * 0.8, false);
      ctx.stroke();
    }
    ctx.restore();

    // =========================================================================
    // 4. PRECISE HISTORICAL GEOGRAPHICAL COASTLINES (1200 BC)
    // =========================================================================
    // A) CONTINENTAL LANDMASS (Anatolia, Levant, Sinai, Egypt, Marmarica)
    const drawContinent = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Caria & Lycian coast (Halicarnassus to Rhodes gulf)
      ctx.lineTo(mx(0), my(14));
      ctx.bezierCurveTo(mx(3), my(15), mx(5), my(18), mx(8), my(20)); // Gulf of Kos / Knidos
      ctx.bezierCurveTo(mx(11), my(22), mx(14), my(23.5), mx(17), my(24.5)); // Telmessos / Fethiye
      ctx.bezierCurveTo(mx(20), my(25.5), mx(22), my(26.5), mx(24), my(26.2)); // Cape Gelidonya
      // Gulf of Pamphylia (Antalya, Perga, Side)
      ctx.bezierCurveTo(mx(26), my(23.5), mx(28.5), my(22.2), mx(31.5), my(23.5));
      ctx.bezierCurveTo(mx(34), my(24.5), mx(37.5), my(28), mx(41.5), my(32.5)); // Cape Anamur
      // Rough Cilicia & Calycadnus (Goksu) river delta
      ctx.bezierCurveTo(mx(44.5), my(31.5), mx(47.5), my(30.5), mx(50.5), my(30.2));
      // Flat Cilicia (Tarsus lagoon & Cydnus)
      ctx.bezierCurveTo(mx(53.5), my(29.8), mx(57), my(30.5), mx(60), my(29.5));
      // Deep Gulf of Issus (Alexandretta bay & Syrian Gates)
      ctx.bezierCurveTo(mx(62.5), my(27), mx(64), my(25.5), mx(65), my(27.5));
      ctx.bezierCurveTo(mx(65.8), my(29.5), mx(65.2), my(31.5), mx(64.8), my(33));
      // Mount Kasios headland (Jebel Aqra - sacred peak of Ba'al Saphon)
      ctx.bezierCurveTo(mx(66), my(34.5), mx(67), my(35.5), mx(67.5), my(37)); // Ras Shamra (Ugarit)
      // Amurru coast & Nahr al-Kabir (opposite Arwad island)
      ctx.bezierCurveTo(mx(69), my(40.5), mx(70), my(43.5), mx(70.8), my(47));
      // Phoenician Coast: Byblos (Gubla) promontory & cedar port
      ctx.bezierCurveTo(mx(71.8), my(50), mx(72.5), my(52.5), mx(72.8), my(55)); // Berytus
      // Sidon & Island Fortress of Tyre (Sur)
      ctx.bezierCurveTo(mx(73.2), my(57.5), mx(73.4), my(60), mx(73.3), my(62.5)); // Tyre headland
      ctx.bezierCurveTo(mx(73), my(64.5), mx(72.2), my(66), mx(71.5), my(67.5)); // Ladder of Tyre
      // Mount Carmel headland & Bay of Acre
      ctx.bezierCurveTo(mx(70.2), my(68.5), mx(70.6), my(70), mx(71.2), my(70.5));
      // Plain of Sharon (Dor, Jaffa / Yafo)
      ctx.bezierCurveTo(mx(70), my(72.5), mx(68.5), my(75.5), mx(67.2), my(78));
      // Philistine Coast (Ashdod, Ashkelon harbor, Gaza)
      ctx.bezierCurveTo(mx(65.8), my(80), mx(64), my(82.5), mx(62), my(84.5));
      // Brook of Egypt (El-Arish) & Lake Bardawil barrier sand spit (Serbonian Bog)
      ctx.bezierCurveTo(mx(59), my(86.2), mx(55.5), my(87.2), mx(51.8), my(87)); // Pelusium
      // Grand Nile Delta: fanned fertile alluvial delta
      ctx.bezierCurveTo(mx(48), my(85.5), mx(44), my(83.8), mx(39), my(83.2)); // Cape Burullus promontory
      ctx.bezierCurveTo(mx(35), my(83.8), mx(32), my(85.8), mx(29), my(88.2)); // Canopus & Alexandria
      // Marmarica & Western Desert coast toward Libya
      ctx.bezierCurveTo(mx(23), my(90.5), mx(13), my(92), mx(0), my(93.5));
      // Close bounding frame
      ctx.lineTo(0, h);
      ctx.lineTo(w, h);
      ctx.lineTo(w, 0);
      ctx.closePath();
    };

    // B) CYPRUS (ALASHIYA) - Detailed historical contour with Karpas horn pointing NE
    const drawCyprus = () => {
      ctx.beginPath();
      // Sharp Karpas peninsula (Cape Apostolos Andreas) pointing northeast
      ctx.moveTo(mx(61.5), my(43.5));
      // Northern Kyrenia ridge coast
      ctx.bezierCurveTo(mx(58), my(45.2), mx(54), my(46.8), mx(50), my(48.2));
      // Morphou Bay inlet
      ctx.bezierCurveTo(mx(47.5), my(49.8), mx(46), my(51), mx(45.5), my(52.2));
      // Western Akamas Peninsula
      ctx.bezierCurveTo(mx(45), my(53.2), mx(45.8), my(54.2), mx(46.8), my(55));
      // Southwestern Paphos coast & Coral Bay
      ctx.bezierCurveTo(mx(48), my(56.2), mx(49.5), my(57.2), mx(51), my(57.6)); // Akrotiri Cape Gata
      // Southern coast & Larnaca Bay
      ctx.bezierCurveTo(mx(53), my(56.5), mx(55), my(55.5), mx(56.5), my(55));
      // Cape Greco promontory
      ctx.bezierCurveTo(mx(58), my(54.2), mx(58.5), my(53), mx(57.5), my(51.2));
      // Famagusta Bay returning to base of Karpas
      ctx.bezierCurveTo(mx(56.2), my(49.5), mx(57.5), my(46.8), mx(59.5), my(44.8));
      ctx.closePath();
    };

    // C) RHODES (ISLE OF RHODOS - Lindos, Ialysos, Kamiros)
    const drawRhodes = () => {
      ctx.beginPath();
      ctx.moveTo(mx(13.2), my(26));
      ctx.lineTo(mx(16.5), my(23.5));
      ctx.lineTo(mx(17.8), my(25.5));
      ctx.lineTo(mx(15), my(29));
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

    // E) ARWAD ISLAND (Phoenician Offshore Island Citadel of Amurru)
    const drawArwad = () => {
      ctx.beginPath();
      ctx.arc(mx(69.8), my(44.2), 2.8, 0, Math.PI * 2);
      ctx.closePath();
    };

    // F) AEGEAN ISLES: Karpathos, Kasos, Kos, Symi
    const drawAegeanIsles = () => {
      ctx.beginPath();
      // Karpathos
      ctx.ellipse(mx(9.8), my(32.5), 1.8, 4, -0.3, 0, Math.PI * 2);
      // Kasos
      ctx.arc(mx(8.2), my(34.2), 1.4, 0, Math.PI * 2);
      // Kos
      ctx.ellipse(mx(9.2), my(20.2), 3, 1.2, 0.4, 0, Math.PI * 2);
      // Symi
      ctx.arc(mx(12.2), my(22.5), 1.3, 0, Math.PI * 2);
      ctx.closePath();
    };

    // =========================================================================
    // 5. SHALLOW COASTAL WATERS & BATHYMETRIC GLOW
    // =========================================================================
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(45, 224, 165, 0.35)';
    ctx.strokeStyle = 'rgba(45, 224, 165, 0.45)';
    ctx.lineWidth = 3.5;
    drawContinent(); ctx.stroke();
    drawCyprus(); ctx.stroke();
    drawRhodes(); ctx.stroke();
    drawCrete(); ctx.stroke();
    drawArwad(); ctx.stroke();
    drawAegeanIsles(); ctx.stroke();

    // Outer golden ripple contour
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(201, 147, 59, 0.22)';
    ctx.lineWidth = 1;
    drawContinent(); ctx.stroke();
    drawCyprus(); ctx.stroke();
    drawRhodes(); ctx.stroke();
    drawCrete(); ctx.stroke();
    ctx.restore();

    // =========================================================================
    // 6. LANDMASS BASE FILL & RICH BIOME TEXTURE
    // =========================================================================
    const landG = ctx.createLinearGradient(0, 0, w, h);
    landG.addColorStop(0, '#32281d'); // Dark Anatolian highlands
    landG.addColorStop(0.35, '#3a2e22'); // Cilicia & Taurus foothill earth
    landG.addColorStop(0.65, '#3f3223'); // Fertile Levant & Orontes ochre
    landG.addColorStop(0.9, '#362a1b'); // Egyptian desert & Nile silt
    ctx.fillStyle = landG;

    drawContinent(); ctx.fill();
    drawCyprus(); ctx.fill();
    drawRhodes(); ctx.fill();
    drawCrete(); ctx.fill();
    drawArwad(); ctx.fill();
    drawAegeanIsles(); ctx.fill();

    // --- BIOME WASH 1: NILE DELTA ALLUVIAL MARSHLANDS ---
    ctx.save();
    const deltaG = ctx.createRadialGradient(mx(41), my(89), 5, mx(41), my(89), mx(14));
    deltaG.addColorStop(0, 'rgba(46, 92, 44, 0.55)');
    deltaG.addColorStop(0.5, 'rgba(38, 77, 36, 0.4)');
    deltaG.addColorStop(0.85, 'rgba(30, 60, 30, 0.15)');
    deltaG.addColorStop(1, 'rgba(30, 60, 30, 0)');
    ctx.fillStyle = deltaG;
    ctx.beginPath();
    ctx.arc(mx(41), my(89), mx(14), 0, Math.PI * 2);
    ctx.fill();

    // Coastal Delta Lagoons (Lake Manzala & Lake Burullus)
    ctx.fillStyle = 'rgba(18, 55, 65, 0.7)';
    // Lake Burullus
    ctx.beginPath();
    ctx.ellipse(mx(39), my(84.8), mx(3.2), my(1.2), -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Lake Manzala
    ctx.beginPath();
    ctx.ellipse(mx(47.5), my(86.5), mx(3), my(1.4), 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Lake Bardawil (Serbonian Bog on Sinai spit)
    ctx.beginPath();
    ctx.ellipse(mx(55), my(87.6), mx(3.5), my(0.9), 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- BIOME WASH 2: FERTILE CRESCENT (Orontes Basin & Phoenician Littoral) ---
    ctx.save();
    const levantG = ctx.createLinearGradient(mx(66), my(35), mx(77), my(65));
    levantG.addColorStop(0, 'rgba(56, 85, 42, 0.35)');
    levantG.addColorStop(0.5, 'rgba(64, 96, 48, 0.45)');
    levantG.addColorStop(1, 'rgba(48, 72, 36, 0.25)');
    ctx.fillStyle = levantG;
    ctx.beginPath();
    ctx.moveTo(mx(67), my(36));
    ctx.lineTo(mx(76), my(37));
    ctx.lineTo(mx(78), my(64));
    ctx.lineTo(mx(71), my(68));
    ctx.closePath();
    ctx.fill();

    // Plain of Issus & Cilician Plain (Adana basin)
    ctx.fillStyle = 'rgba(54, 86, 44, 0.35)';
    ctx.beginPath();
    ctx.ellipse(mx(57), my(29), mx(5), my(2.5), -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- BIOME WASH 3: ARID DESERTS & DUNE STIPPLING (Sinai, Negev, Syrian Desert) ---
    ctx.save();
    ctx.strokeStyle = 'rgba(217, 180, 130, 0.12)';
    ctx.lineWidth = 1;
    // Dune ripples in Sinai & Syrian desert
    const duneLines = [
      [58, 92, 63, 93], [60, 95, 65, 96], [67, 88, 72, 89], [69, 91, 74, 92],
      [82, 45, 87, 46], [84, 49, 90, 50], [83, 55, 88, 56], [85, 60, 91, 61],
      [78, 75, 84, 76], [80, 79, 86, 80], [15, 95, 22, 96], [18, 97, 25, 98]
    ];
    for (const [x1, y1, x2, y2] of duneLines) {
      ctx.beginPath();
      ctx.moveTo(mx(x1), my(y1));
      ctx.quadraticCurveTo(mx((x1 + x2) / 2), my(y1 - 0.5), mx(x2), my(y2));
      ctx.stroke();
    }
    ctx.restore();

    // Coastline borders (Burnished Bronze incised rim)
    ctx.save();
    ctx.strokeStyle = '#c9933b';
    ctx.lineWidth = 1.8;
    drawContinent(); ctx.stroke();
    drawCyprus(); ctx.stroke();
    drawRhodes(); ctx.stroke();
    drawCrete(); ctx.stroke();
    drawArwad(); ctx.stroke();
    drawAegeanIsles(); ctx.stroke();
    ctx.restore();

    // =========================================================================
    // 7. HISTORICAL RIVERS, LAKES & INLAND WATERS
    // =========================================================================
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.6;

    // A) The Nile River Trunk & 7 Classical Delta Branches
    // Main Trunk from Memphis northwards
    ctx.beginPath();
    ctx.moveTo(mx(41), my(100));
    ctx.bezierCurveTo(mx(42), my(96), mx(41.5), my(92), mx(41), my(89)); // Apex at Memphis
    // Branch 1: Pelusiac Branch (East to Pelusium & Sinai)
    ctx.bezierCurveTo(mx(44), my(88.5), mx(48), my(87.8), mx(51.5), my(87));
    // Branch 2: Tanitic Branch (Tanis / Avaris)
    ctx.moveTo(mx(42), my(88.8));
    ctx.bezierCurveTo(mx(44), my(87.5), mx(46), my(86.8), mx(47), my(85.8));
    // Branch 3: Mendesian Branch
    ctx.moveTo(mx(41.5), my(88.5));
    ctx.bezierCurveTo(mx(43), my(86.8), mx(44.5), my(85.5), mx(45.5), my(84.6));
    // Branch 4: Damietta / Phatnitic Branch
    ctx.moveTo(mx(41), my(88.5));
    ctx.bezierCurveTo(mx(42.5), my(86.5), mx(43.5), my(84.8), mx(44), my(83.8));
    // Branch 5: Sebennytic Branch (Central Spine to Cape Burullus)
    ctx.moveTo(mx(41), my(88.5));
    ctx.bezierCurveTo(mx(40.5), my(86.2), mx(39.8), my(84.5), mx(39), my(83.4));
    // Branch 6: Bolbitic / Rosetta Branch
    ctx.moveTo(mx(40.5), my(88.8));
    ctx.bezierCurveTo(mx(38), my(87.5), mx(36), my(86.2), mx(34.5), my(85.2));
    // Branch 7: Canopic Branch (West to Canopus & Alexandria)
    ctx.moveTo(mx(40), my(89));
    ctx.bezierCurveTo(mx(36), my(88), mx(32.5), my(87.8), mx(30), my(88));
    ctx.stroke();

    // B) The Orontes River (Nahr al-Asi - Kadesh, Hamath, Ugarit outlet)
    ctx.beginPath();
    ctx.moveTo(mx(75.5), my(58)); // Source in Beqaa valley
    ctx.bezierCurveTo(mx(76.2), my(54), mx(75.5), my(49), mx(73.5), my(45)); // Passing Kadesh & Lake Homs
    ctx.bezierCurveTo(mx(71.5), my(42), mx(69.5), my(39), mx(67.2), my(37.5)); // Emptying near Mount Kasios
    ctx.stroke();

    // Lake of Homs / Qattinah Reservoir (Kadesh dam reservoir)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(mx(75.6), my(54.5), mx(0.7), my(1.2), 0.2, 0, Math.PI * 2);
    ctx.fill();

    // C) Jordan River System, Sea of Galilee & Dead Sea
    // Mount Hermon springs
    ctx.beginPath();
    ctx.moveTo(mx(73.8), my(63));
    ctx.lineTo(mx(73.5), my(66)); // Into Lake Kinneret
    ctx.stroke();

    // Sea of Galilee (Yam Kinneret)
    ctx.beginPath();
    ctx.ellipse(mx(73.5), my(66.5), mx(0.6), my(0.9), 0, 0, Math.PI * 2);
    ctx.fill();

    // Jordan River Canyon
    ctx.beginPath();
    ctx.moveTo(mx(73.5), my(67.4));
    ctx.bezierCurveTo(mx(73.6), my(70), mx(73.4), my(72), mx(73.5), my(73.5));
    ctx.stroke();

    // Dead Sea (Yam HaMelah - Salt Sea)
    ctx.beginPath();
    ctx.ellipse(mx(73.6), my(76), mx(0.8), my(2.4), 0.05, 0, Math.PI * 2);
    ctx.fill();

    // D) Cilician Rivers: Calycadnus (Goksu), Cydnus, Pyramus (Ceyhan)
    ctx.beginPath();
    // Calycadnus cutting through Taurus
    ctx.moveTo(mx(44), my(25));
    ctx.bezierCurveTo(mx(46), my(27), mx(48), my(28.5), mx(47.5), my(30.5));
    // Cydnus at Tarsus
    ctx.moveTo(mx(54), my(24));
    ctx.bezierCurveTo(mx(53.5), my(26.5), mx(53.8), my(28), mx(53.5), my(29.8));
    // Pyramus / Ceyhan
    ctx.moveTo(mx(62), my(22));
    ctx.bezierCurveTo(mx(60), my(25), mx(59), my(27.5), mx(59.5), my(29.5));
    ctx.stroke();

    // E) Mesopotamian Euphrates River (Upper Right Euphrates Bend)
    ctx.beginPath();
    ctx.moveTo(mx(78), my(0));
    ctx.bezierCurveTo(mx(80), my(7), mx(83), my(13), mx(87), my(17)); // Near Carchemish
    ctx.bezierCurveTo(mx(91), my(21), mx(95), my(24), mx(100), my(27)); // Emar toward Babylon
    ctx.stroke();
    ctx.restore();

    // =========================================================================
    // 8. MAJESTIC SHADED MOUNTAIN RANGES (3D Hachure Peaks with Sunlit Ridges)
    // =========================================================================
    const drawMountainRange = (startX: number, startY: number, count: number, stepX: number, stepY: number, size: number, hasSnow: boolean = false) => {
      ctx.save();
      for (let i = 0; i < count; i++) {
        const px = mx(startX) + i * stepX;
        const py = my(startY) + i * stepY;
        const hSize = size * (0.85 + (i % 3) * 0.15);

        // Dark Shadow Eastern Flank
        ctx.fillStyle = '#221912';
        ctx.beginPath();
        ctx.moveTo(px, py - hSize * 0.85);
        ctx.lineTo(px + hSize * 1.3, py + hSize);
        ctx.lineTo(px, py + hSize);
        ctx.closePath();
        ctx.fill();

        // Sunlit Western Flank
        ctx.fillStyle = '#8f7760';
        ctx.beginPath();
        ctx.moveTo(px - hSize * 1.3, py + hSize);
        ctx.lineTo(px, py - hSize * 0.85);
        ctx.lineTo(px, py + hSize);
        ctx.closePath();
        ctx.fill();

        // Incised Bronze Ridge Outline
        ctx.strokeStyle = '#c9933b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px - hSize * 1.3, py + hSize);
        ctx.lineTo(px, py - hSize * 0.85);
        ctx.lineTo(px + hSize * 1.3, py + hSize);
        ctx.stroke();

        // Central Spine Line
        ctx.beginPath();
        ctx.moveTo(px, py - hSize * 0.85);
        ctx.lineTo(px, py + hSize);
        ctx.strokeStyle = '#473215';
        ctx.stroke();

        // Snow-capped peak for highest summits
        if (hasSnow && (i === 2 || i === 3 || i === count - 2)) {
          ctx.fillStyle = '#f1ece1';
          ctx.beginPath();
          ctx.moveTo(px, py - hSize * 0.85);
          ctx.lineTo(px - hSize * 0.35, py - hSize * 0.35);
          ctx.lineTo(px, py - hSize * 0.4);
          ctx.lineTo(px + hSize * 0.35, py - hSize * 0.35);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    };

    // A) The Mighty Taurus Mountains (Toros Daglari - Western, Central, Cilician Gates)
    drawMountainRange(18, 19, 8, 17, 2, 7.5, false);
    drawMountainRange(32, 22, 9, 16, 2, 8.5, true);
    drawMountainRange(48, 23, 8, 15, 1, 9, true);

    // B) Mount Amanus (Nur Mountains - Cilician & Syrian Gates barrier)
    drawMountainRange(63, 23, 6, 2, 14, 7.5, false);

    // C) Mount Kasios / Jebel Aqra (Sacred Mountain of Ugarit)
    drawMountainRange(66.5, 34, 3, 1, 14, 8, false);

    // D) Mount Lebanon & Anti-Lebanon Ranges (Home of the Royal Cedars)
    drawMountainRange(74.5, 48, 8, 1, 15, 8.5, false);
    drawMountainRange(76.5, 50, 7, 1, 16, 7.5, false);

    // E) Mount Hermon (Snow-crowned sacred sentinel of Upper Jordan)
    drawMountainRange(74.2, 62, 3, 1, 14, 9, true);

    // F) Troodos Mountain Dome on Cyprus (Richest Copper Veins of the Aegean)
    drawMountainRange(48.5, 52, 5, 13, -1.8, 7.5, false);
    // Kyrenia Ridge on Northern Cyprus
    drawMountainRange(52, 46.5, 5, 12, -2.5, 5.5, false);

    // G) Sinai Granite Peaks (Southern Massif)
    drawMountainRange(59, 90, 6, 12, 10, 7.5, false);

    // =========================================================================
    // 9. DENSE EVERGREEN CEDAR & PINE GROVES (Royal Cedars of God)
    // =========================================================================
    const drawCedarTree = (tx: number, ty: number, scale: number = 1) => {
      ctx.save();
      const x = mx(tx);
      const y = my(ty);
      // Trunk
      ctx.fillStyle = '#3a2512';
      ctx.fillRect(x - 0.7 * scale, y, 1.4 * scale, 3 * scale);
      // Foliage tiers (Deep cedar evergreen)
      ctx.fillStyle = '#1c4220';
      // Tier 1 (bottom)
      ctx.beginPath();
      ctx.moveTo(x - 4 * scale, y);
      ctx.lineTo(x, y - 4 * scale);
      ctx.lineTo(x + 4 * scale, y);
      ctx.closePath();
      ctx.fill();
      // Tier 2 (middle)
      ctx.fillStyle = '#26572b';
      ctx.beginPath();
      ctx.moveTo(x - 3 * scale, y - 2.5 * scale);
      ctx.lineTo(x, y - 6 * scale);
      ctx.lineTo(x + 3 * scale, y - 2.5 * scale);
      ctx.closePath();
      ctx.fill();
      // Tier 3 (top peak)
      ctx.fillStyle = '#346f3a';
      ctx.beginPath();
      ctx.moveTo(x - 2 * scale, y - 4.5 * scale);
      ctx.lineTo(x, y - 8 * scale);
      ctx.lineTo(x + 2 * scale, y - 4.5 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Mount Lebanon Cedar Groves (Byblos hinterlands)
    const cedarSpots = [
      [73.5, 49.5], [74, 51.5], [74.5, 53.5], [73.8, 55], [74.2, 57],
      [74.8, 59], [74, 60.5],
      // Troodos pine forests on Cyprus
      [49.5, 53.5], [51.5, 52.8], [53, 53.8],
      // Taurus slopes
      [36, 23.5], [40, 24.5], [52, 25.5], [55, 26]
    ];
    for (const [cx, cy] of cedarSpots) {
      drawCedarTree(cx, cy, 0.9);
    }

    // =========================================================================
    // 10. ANCIENT BRONZE AGE HISTORICAL CITIES & METROPOLISES (1200 BC)
    // =========================================================================
    const HISTORIC_CITIES = [
      { name: 'HATTUSA', x: 28, y: 9, title: 'Hittite Imperial Capital' },
      { name: 'TARSUS', x: 53.5, y: 27.5, title: 'Cilician Empyrium' },
      { name: 'CARCHEMISH', x: 81.5, y: 17.5, title: 'Hittite Viceroyalty on Euphrates' },
      { name: 'UGARIT', x: 68.5, y: 36.8, title: 'Royal Palace of Cuneiform Tablets' },
      { name: 'ARWAD', x: 70.2, y: 44.5, title: 'Phoenician Island Fortress' },
      { name: 'KADESH', x: 75.8, y: 54.5, title: 'Chariot Fortress on the Orontes' },
      { name: 'BYBLOS', x: 73.2, y: 52.5, title: 'Ancient Port of Papyrus & Cedar' },
      { name: 'SIDON', x: 73.8, y: 58.5, title: 'Harbor of Murex Purple' },
      { name: 'TYRE', x: 73.8, y: 62.2, title: 'Island Citadel of Sur' },
      { name: 'MEGIDDO', x: 71.8, y: 69.2, title: 'Armageddon Crossroads Pass' },
      { name: 'HAZOR', x: 74.2, y: 65.8, title: 'Head of all Canaanite Kingdoms' },
      { name: 'GAZA', x: 63.8, y: 82.2, title: 'Pharaoh’s Governor Seat in Canaan' },
      { name: 'ENKOMI', x: 56.5, y: 49.5, title: 'Copper Smelting Metropolis of Alashiya' },
      { name: 'KITION', x: 54.5, y: 55, title: 'Phoenician/Cypriot Copper Anchorage' },
      { name: 'PI-RAMESSES', x: 46.5, y: 87.5, title: 'Imperial Delta Residence of Pharaoh' },
      { name: 'MEMPHIS', x: 40.5, y: 93.5, title: 'The White Walls of Lower Egypt' },
      { name: 'PELUSIUM', x: 52, y: 88, title: 'Sinai Frontier Shield' }
    ];

    ctx.save();
    for (const city of HISTORIC_CITIES) {
      const cx = mx(city.x);
      const cy = my(city.y);

      // Bronze fortified crenellated megaron tower icon
      ctx.fillStyle = '#1e140d';
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.2;
      // Bastion base
      ctx.fillRect(cx - 3.5, cy - 3.5, 7, 7);
      ctx.strokeRect(cx - 3.5, cy - 3.5, 7, 7);
      // Center golden ember
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(cx - 1.2, cy - 1.2, 2.4, 2.4);

      // Antique City Name
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.fillStyle = 'rgba(255, 235, 190, 0.85)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(city.name, cx + 6, cy);
    }
    ctx.restore();

    // =========================================================================
    // 11. HISTORICAL OVERLAND & MARITIME TRADE ROUTES
    // =========================================================================
    ctx.save();
    // A) The Bronze & Tin Sea Road (Via Marina Aenea)
    ctx.strokeStyle = 'rgba(45, 224, 165, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    // Rhodes -> Enkomi -> Ugarit -> Byblos -> Pelusium -> Nile
    ctx.moveTo(mx(16), my(26));
    ctx.lineTo(mx(46), my(52)); // Rounding West Cyprus
    ctx.lineTo(mx(56.5), my(49.5)); // Enkomi
    ctx.lineTo(mx(68.5), my(37)); // Ugarit
    ctx.lineTo(mx(73), my(52.5)); // Byblos
    ctx.lineTo(mx(73.5), my(62)); // Tyre
    ctx.lineTo(mx(64), my(82)); // Gaza
    ctx.lineTo(mx(52), my(87.5)); // Pelusium
    ctx.lineTo(mx(41), my(89)); // Delta apex
    ctx.stroke();

    // B) The Way of the Sea (Via Maris - Overland Highway)
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(mx(41), my(93)); // Memphis
    ctx.lineTo(mx(52), my(88)); // Pelusium
    ctx.lineTo(mx(58), my(86)); // El Arish
    ctx.lineTo(mx(64), my(82)); // Gaza
    ctx.lineTo(mx(67), my(78)); // Ashkelon
    ctx.lineTo(mx(71.8), my(69.2)); // Megiddo
    ctx.lineTo(mx(74.2), my(65.8)); // Hazor
    ctx.lineTo(mx(78), my(61)); // Toward Damascus
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // =========================================================================
    // 12. ANTIQUE CARTOGRAPHIC ART: SEA MONSTER & HISTORICAL VESSELS
    // =========================================================================
    // A) Mythological Sea Serpent: LOTAN / LEVIATHAN (Ugaritic Chaos Monster)
    ctx.save();
    const levX = mx(26);
    const levY = my(69);
    ctx.translate(levX, levY);
    ctx.strokeStyle = '#2de0a5';
    ctx.lineWidth = 1.5;

    // Coiled serpentine body
    ctx.beginPath();
    ctx.moveTo(-25, 4);
    ctx.bezierCurveTo(-20, -14, -10, -18, 0, -6);
    ctx.bezierCurveTo(8, 6, 16, 12, 25, 0);
    ctx.bezierCurveTo(32, -10, 36, -8, 42, -16);
    ctx.stroke();

    // Secondary lower belly contour
    ctx.beginPath();
    ctx.moveTo(-22, 6);
    ctx.bezierCurveTo(-18, -10, -8, -14, 0, -2);
    ctx.bezierCurveTo(8, 10, 16, 15, 26, 3);
    ctx.stroke();

    // Serrated dorsal fins
    ctx.fillStyle = '#ffd166';
    for (let f = -16; f <= 30; f += 8) {
      ctx.beginPath();
      ctx.moveTo(f, -8);
      ctx.lineTo(f + 3, -15);
      ctx.lineTo(f + 6, -7);
      ctx.closePath();
      ctx.fill();
    }

    // Serpent Head with open fanged jaws
    ctx.beginPath();
    ctx.moveTo(42, -16);
    ctx.lineTo(49, -20);
    ctx.lineTo(44, -14);
    ctx.lineTo(49, -11);
    ctx.lineTo(41, -12);
    ctx.closePath();
    ctx.fillStyle = '#2de0a5';
    ctx.fill();
    ctx.stroke();

    // Glowing red eye
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(44, -16, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Sea foam ripples under serpent
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 10, 16, 0.2, Math.PI * 0.9);
    ctx.arc(24, 8, 12, 0.2, Math.PI * 0.9);
    ctx.stroke();

    // Monster label
    ctx.fillStyle = 'rgba(45, 224, 165, 0.7)';
    ctx.font = 'italic 9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOTAN · The Serpent of the Abyss', 10, 22);
    ctx.restore();

    // B) Sea Peoples Horned Raider Skiff (Off Levant Coast)
    ctx.save();
    const shipX = mx(36);
    const shipY = my(42);
    ctx.translate(shipX, shipY);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.4;

    // High upturned bird-head prow & stern
    ctx.beginPath();
    ctx.moveTo(-22, -3);
    ctx.bezierCurveTo(-26, -14, -28, -18, -25, -20);
    ctx.bezierCurveTo(-20, -10, -12, 4, 0, 5);
    ctx.bezierCurveTo(12, 4, 20, -10, 25, -18);
    ctx.lineTo(21, -3);
    ctx.closePath();
    ctx.fillStyle = '#2b1c11';
    ctx.fill();
    ctx.stroke();

    // Mast & Brailed Horned Square Sail
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, -26);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-16, -24);
    ctx.lineTo(16, -24);
    ctx.bezierCurveTo(14, -12, -14, -12, -16, -24);
    ctx.fillStyle = 'rgba(255, 235, 190, 0.88)';
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 209, 102, 0.75)';
    ctx.font = 'italic 9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Horned Raiders of the Sea', 0, 16);
    ctx.restore();

    // C) Egyptian Nile Barque (Off Alexandria & Delta Mouth)
    ctx.save();
    const nileShipX = mx(32);
    const nileShipY = my(80);
    ctx.translate(nileShipX, nileShipY);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.2;

    // Curled papyrus hull with lotus stern
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.bezierCurveTo(-14, 6, 12, 6, 18, -4);
    ctx.bezierCurveTo(20, -10, 21, -12, 19, -14); // Curled lotus ornament
    ctx.lineTo(16, -2);
    ctx.lineTo(-14, -2);
    ctx.closePath();
    ctx.fillStyle = '#5c4021';
    ctx.fill();
    ctx.stroke();

    // Double A-frame mast & broad Egyptian sail
    ctx.beginPath();
    ctx.moveTo(-4, 0); ctx.lineTo(0, -22); ctx.lineTo(4, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-14, -20); ctx.lineTo(14, -20); ctx.lineTo(12, -6); ctx.lineTo(-12, -6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(250, 240, 215, 0.85)';
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 209, 102, 0.7)';
    ctx.font = 'italic 8px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Royal Barque of Pharaoh', 0, 14);
    ctx.restore();

    // D) Cypriot Merchant Vessel "Gaulos" (South of Cyprus laden with oxhide copper ingots)
    ctx.save();
    const gaulosX = mx(54);
    const gaulosY = my(65);
    ctx.translate(gaulosX, gaulosY);
    ctx.strokeStyle = '#c9933b';
    ctx.lineWidth = 1.2;

    // Deep rounded merchant hull
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0.1, Math.PI * 0.9);
    ctx.lineTo(-15, -2);
    ctx.lineTo(15, -2);
    ctx.closePath();
    ctx.fillStyle = '#442d18';
    ctx.fill();
    ctx.stroke();

    // Central mast & square sail
    ctx.beginPath();
    ctx.moveTo(0, 6); ctx.lineTo(0, -20);
    ctx.stroke();
    ctx.fillStyle = 'rgba(235, 215, 180, 0.85)';
    ctx.fillRect(-12, -18, 24, 12);
    ctx.strokeRect(-12, -18, 24, 12);

    // Oxhide copper ingot silhouette
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-3, 0, 6, 4);

    ctx.fillStyle = 'rgba(201, 147, 59, 0.75)';
    ctx.font = 'italic 8px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Cypriot Copper Merchant', 0, 16);
    ctx.restore();

    // =========================================================================
    // 13. GRAND 16-POINT GOLDEN COMPASS ROSE (Rosa dei Venti)
    // =========================================================================
    ctx.save();
    ctx.translate(roseX, roseY);

    // Outer & Inner Brass Rings
    ctx.strokeStyle = '#c9933b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(201, 147, 59, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.stroke();

    // 16 Compass Points
    const numPoints = 16;
    for (let p = 0; p < numPoints; p++) {
      const isCardinal = p % 4 === 0;
      const isInter = p % 2 === 0;
      const len = isCardinal ? 42 : (isInter ? 30 : 20);
      const angle = (p * Math.PI * 2) / numPoints;
      const halfAngle = Math.PI / numPoints;

      // Dark shaded facet
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.lineTo(Math.cos(angle + halfAngle) * (len * 0.35), Math.sin(angle + halfAngle) * (len * 0.35));
      ctx.closePath();
      ctx.fillStyle = '#473215';
      ctx.fill();

      // Light gold sunlit facet
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.lineTo(Math.cos(angle - halfAngle) * (len * 0.35), Math.sin(angle - halfAngle) * (len * 0.35));
      ctx.closePath();
      ctx.fillStyle = '#ffd166';
      ctx.fill();
    }

    // North Fleur-de-lis / Golden Arrowhead
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(6, -38);
    ctx.lineTo(0, -41);
    ctx.lineTo(-6, -38);
    ctx.closePath();
    ctx.fill();

    // Central brass jewel pivot
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

    // =========================================================================
    // 14. REGIONAL TOPONYMS & REALM INSCRIPTIONS
    // =========================================================================
    ctx.save();
    // Empire of Hatti
    ctx.fillStyle = 'rgba(255, 225, 160, 0.6)';
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('EMPIRE OF HATTI (ANATOLIA)', mx(18), my(12));
    ctx.font = 'italic 10px Cinzel, serif';
    ctx.fillText('Taurus Iron Crags · Kizzuwatna', mx(22), my(15.5));

    // The Great Green
    ctx.font = 'bold 14px Cinzel, serif';
    ctx.fillStyle = 'rgba(77, 166, 153, 0.55)';
    ctx.fillText('THE GREAT GREEN (WADJ-WER)', mx(16), my(49));

    // Alashiya (Cyprus)
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillStyle = 'rgba(255, 209, 102, 0.8)';
    ctx.fillText('ALASHIYA (CYPRUS)', mx(47.5), my(45.5));
    ctx.font = 'italic 9px Cinzel, serif';
    ctx.fillText('Isle of Copper & Cassiterite', mx(50.5), my(59.5));

    // Levant / Amurru / Phoenicia / Canaan
    ctx.font = 'bold 12px Cinzel, serif';
    ctx.fillStyle = 'rgba(255, 225, 160, 0.75)';
    ctx.fillText('KINGDOM OF UGARIT', mx(76), my(38));
    ctx.fillText('AMURRU & PHOENICIA', mx(78), my(48));
    ctx.fillText('CANAANITE HIGHLANDS', mx(78), my(65));

    // Egypt / Kemet
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.fillStyle = 'rgba(255, 209, 102, 0.75)';
    ctx.fillText('KEMET (LOWER EGYPT)', mx(35), my(92));
    ctx.font = 'italic 9px Cinzel, serif';
    ctx.fillText('Kingdom of the Two Lands', mx(35), my(95));

    // Sinai Wilderness
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.fillText('SINAI WILDERNESS', mx(62), my(92));
    ctx.restore();

    // =========================================================================
    // 15. ORNATE TITLE CARTOUCHE BANNER (Top-Left Corner)
    // =========================================================================
    ctx.save();
    const cartX = 14;
    const cartY = 12;
    const cartW = 260;
    const cartH = 50;

    // Cartouche parchment background
    ctx.fillStyle = 'rgba(20, 15, 11, 0.88)';
    ctx.fillRect(cartX, cartY, cartW, cartH);
    ctx.strokeStyle = '#c9933b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cartX, cartY, cartW, cartH);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(cartX + 3, cartY + 3, cartW - 6, cartH - 6);

    // Corner rivet dots
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(cartX + 5, cartY + 5, 3, 3);
    ctx.fillRect(cartX + cartW - 8, cartY + 5, 3, 3);
    ctx.fillRect(cartX + 5, cartY + cartH - 8, 3, 3);
    ctx.fillRect(cartX + cartW - 8, cartY + cartH - 8, 3, 3);

    // Banner Text
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText('TABULA ORIENTIS ANTIQUI · MCC A.C.', cartX + cartW / 2, cartY + 20);
    ctx.font = 'italic 9.5px Cinzel, serif';
    ctx.fillStyle = '#e8dccb';
    ctx.fillText('Eastern Mediterranean · The Great Bronze Collapse', cartX + cartW / 2, cartY + 36);
    ctx.restore();

    // =========================================================================
    // 16. ANTIQUE MAP BORDER WITH DEGREE SCALE TICKS
    // =========================================================================
    ctx.save();
    ctx.strokeStyle = '#785a2f';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    // Coordinate degree tick marks along top & bottom borders
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1;
    for (let bx = 20; bx < w - 20; bx += 30) {
      ctx.beginPath();
      ctx.moveTo(bx, 6); ctx.lineTo(bx, 11);
      ctx.moveTo(bx, h - 6); ctx.lineTo(bx, h - 11);
      ctx.stroke();
    }
    for (let by = 20; by < h - 20; by += 30) {
      ctx.beginPath();
      ctx.moveTo(6, by); ctx.lineTo(11, by);
      ctx.moveTo(w - 6, by); ctx.lineTo(w - 11, by);
      ctx.stroke();
    }
    ctx.restore();

    // =========================================================================
    // 17. CONNECTING CAMPAIGN ROUTES FOR CURRENT ACT
    // =========================================================================
    const actScenarios = CAMPAIGN_SCENARIOS.filter(s => s.act === this.selectedActIndex);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
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
    ctx.restore();

    // =========================================================================
    // 18. DRAW SCENARIO MISSION NODES (Interactive Pins)
    // =========================================================================
    const save = SaveManager.get();
    for (const sc of actScenarios) {
      const nx = mx(sc.mapX);
      const ny = my(sc.mapY);

      const isCompleted = save.isScenarioCompleted(sc.id);
      const isCurrent = save.getData().currentScenarioId === sc.id;
      const isSelected = sc.id === this.selectedScenario?.id;

      // Glow halo for active / selected
      if (isSelected || isCurrent) {
        ctx.fillStyle = isSelected ? 'rgba(255, 209, 102, 0.4)' : 'rgba(45, 224, 165, 0.3)';
        ctx.beginPath();
        ctx.arc(nx, ny, 19, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing outer orbit ring
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(nx, ny, 16, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Base node circle
      ctx.beginPath();
      ctx.arc(nx, ny, 10.5, 0, Math.PI * 2);

      if (isCompleted) {
        ctx.fillStyle = '#2de0a5';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
      } else if (isCurrent || sc.scenarioIndex <= 3) {
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
      ctx.font = 'bold 10.5px Cinzel, serif';
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
