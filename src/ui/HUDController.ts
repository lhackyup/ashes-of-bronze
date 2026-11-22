import { EventBus } from '../core/EventBus.ts';
import { ResourcePool, Cost } from '../data/types.ts';
import { BUILDINGS } from '../data/buildings.ts';
import { UNITS } from '../data/units.ts';
import { UnitEntity } from '../entities/UnitEntity.ts';
import { BuildingEntity } from '../entities/BuildingEntity.ts';
import { Camera2D } from '../engine/camera/Camera2D.ts';
import { SVGAProceduralBank } from '../engine/rendering/SVGAProceduralBank.ts';
import { TILE_SIZE } from '../data/terrain.ts';
import { ObjectiveProgress } from '../campaign/ObjectiveManager.ts';

export class HUDController {
  private resCopperEl!: HTMLElement;
  private resTinEl!: HTMLElement;
  private resStoneEl!: HTMLElement;
  private resTimberEl!: HTMLElement;
  private resIronEl!: HTMLElement;
  private resGrainEl!: HTMLElement;
  private resSupplyEl!: HTMLElement;

  private capCopperEl: HTMLElement | null = null;
  private capTinEl: HTMLElement | null = null;
  private capStoneEl: HTMLElement | null = null;
  private capTimberEl: HTMLElement | null = null;
  private capIronEl: HTMLElement | null = null;
  private capGrainEl: HTMLElement | null = null;

  private barCopperEl: HTMLElement | null = null;
  private barTinEl: HTMLElement | null = null;
  private barStoneEl: HTMLElement | null = null;
  private barTimberEl: HTMLElement | null = null;
  private barIronEl: HTMLElement | null = null;
  private barGrainEl: HTMLElement | null = null;
  private barSupplyEl: HTMLElement | null = null;

  private advisorPortraitEl!: HTMLImageElement | HTMLDivElement;
  private advisorTextEl!: HTMLElement;

  private objectivesListEl: HTMLElement | null = null;
  private trackerTimerEl: HTMLElement | null = null;

  private inspectorPanelEl!: HTMLElement;
  private inspectorNameEl!: HTMLElement;
  private inspectorDescEl!: HTMLElement;
  private inspectorHpFillEl!: HTMLElement;

  private minimapCanvas!: HTMLCanvasElement;
  private minimapCtx!: CanvasRenderingContext2D;

  public onSelectBuildItem?: (defId: string) => void;
  public onTrainUnit?: (unitDefId: string) => void;

  constructor() {
    this.cacheDOMElements();
    this.setupListeners();
    this.populateBuildMenu();
  }

  private cacheDOMElements(): void {
    this.resCopperEl = document.getElementById('val-copper')!;
    this.resTinEl = document.getElementById('val-tin')!;
    this.resStoneEl = document.getElementById('val-stone')!;
    this.resTimberEl = document.getElementById('val-timber')!;
    this.resIronEl = document.getElementById('val-iron')!;
    this.resGrainEl = document.getElementById('val-grain')!;
    this.resSupplyEl = document.getElementById('val-supply')!;

    this.capCopperEl = document.getElementById('cap-copper');
    this.capTinEl = document.getElementById('cap-tin');
    this.capStoneEl = document.getElementById('cap-stone');
    this.capTimberEl = document.getElementById('cap-timber');
    this.capIronEl = document.getElementById('cap-iron');
    this.capGrainEl = document.getElementById('cap-grain');

    this.barCopperEl = document.getElementById('bar-copper');
    this.barTinEl = document.getElementById('bar-tin');
    this.barStoneEl = document.getElementById('bar-stone');
    this.barTimberEl = document.getElementById('bar-timber');
    this.barIronEl = document.getElementById('bar-iron');
    this.barGrainEl = document.getElementById('bar-grain');
    this.barSupplyEl = document.getElementById('bar-supply');

    this.advisorPortraitEl = document.getElementById('advisor-portrait')! as HTMLImageElement;
    this.advisorTextEl = document.getElementById('advisor-text')!;

    this.inspectorPanelEl = document.getElementById('inspector-panel')!;
    this.inspectorNameEl = document.getElementById('inspector-name')!;
    this.inspectorDescEl = document.getElementById('inspector-desc')!;
    this.inspectorHpFillEl = document.getElementById('inspector-hp-fill')!;

    this.minimapCanvas = document.getElementById('minimap-canvas')! as HTMLCanvasElement;
    this.minimapCtx = this.minimapCanvas.getContext('2d')!;

    this.objectivesListEl = document.getElementById('objectives-list');
    this.trackerTimerEl = document.getElementById('tracker-wave-timer');
  }

  private setupListeners(): void {
    const bus = EventBus.get();

    bus.on('objectives:updated', (objs: ObjectiveProgress[]) => {
      this.updateObjectives(objs);
    });

    let latestRes: ResourcePool = { copper: 400, tin: 100, iron: 0, grain: 200, stone: 150, timber: 150 };
    let latestMax: Record<string, number> = { copper: 500, tin: 500, iron: 500, grain: 500, stone: 500, timber: 500 };

    const updateDisplay = () => {
      const format = (
        cur: number,
        max: number,
        valEl: HTMLElement | null,
        capEl: HTMLElement | null,
        barEl: HTMLElement | null,
        baseColor: string
      ) => {
        const val = Math.floor(cur);
        const safeMax = Math.max(1, max);
        const ratio = Math.min(1.0, cur / safeMax);
        const pct = Math.floor(ratio * 100);
        const isFull = cur >= max;
        const isNearFull = ratio >= 0.85;

        if (valEl) {
          valEl.textContent = `${val} / ${max}`;
          if (isFull) {
            valEl.style.color = '#ef4444';
            valEl.title = `STORAGE FULL (${val}/${max})! Build a Granary or Foundry to expand.`;
          } else if (isNearFull) {
            valEl.style.color = '#fbbf24';
            valEl.title = `Stockpile nearing maximum capacity (${pct}% - ${val}/${max})!`;
          } else {
            valEl.style.color = baseColor;
            valEl.title = `Stockpile: ${val} / Max Capacity: ${max} (${pct}%)`;
          }
        }

        if (capEl) {
          capEl.textContent = `${pct}%`;
          capEl.style.color = isFull ? '#ef4444' : (isNearFull ? '#fbbf24' : '#8c7d6b');
        }

        if (barEl) {
          barEl.style.width = `${pct}%`;
          barEl.style.backgroundColor = isFull ? '#ef4444' : (isNearFull ? '#fbbf24' : baseColor);
        }
      };

      format(latestRes.copper, latestMax.copper, this.resCopperEl, this.capCopperEl, this.barCopperEl, '#2de0a5');
      format(latestRes.tin, latestMax.tin, this.resTinEl, this.capTinEl, this.barTinEl, '#c0c6cc');
      format(latestRes.stone, latestMax.stone, this.resStoneEl, this.capStoneEl, this.barStoneEl, '#e2e8f0');
      format(latestRes.timber, latestMax.timber, this.resTimberEl, this.capTimberEl, this.barTimberEl, '#f59e0b');
      format(latestRes.iron, latestMax.iron, this.resIronEl, this.capIronEl, this.barIronEl, '#e07a5f');
      format(latestRes.grain, latestMax.grain, this.resGrainEl, this.capGrainEl, this.barGrainEl, '#ffd166');
    };

    bus.on('economy:changed', (res: ResourcePool) => {
      latestRes = res;
      updateDisplay();
    });

    bus.on('economy:storage_changed', (storage: Record<string, number>) => {
      latestMax = storage;
      updateDisplay();
    });

    bus.on('economy:supply_changed', (data: { max: number; used: number }) => {
      if (this.resSupplyEl) this.resSupplyEl.textContent = `${data.used}/${data.max}`;
      if (this.barSupplyEl) {
        const sPct = Math.min(100, Math.floor((data.used / Math.max(1, data.max)) * 100));
        this.barSupplyEl.style.width = `${sPct}%`;
        this.barSupplyEl.style.backgroundColor = data.used >= data.max ? '#ef4444' : '#fbbf24';
      }
    });

    bus.on('advisor:message', (data: { speaker: string; text: string; isAlert?: boolean }) => {
      if (this.advisorTextEl) {
        this.advisorTextEl.textContent = data.text;
        this.advisorTextEl.style.color = data.isAlert ? '#ff5555' : '#f7e6b5';
      }
      if (this.advisorPortraitEl) {
        const portraitCanvas = SVGAProceduralBank.advisorPortraits.get(data.speaker);
        if (portraitCanvas) {
          this.advisorPortraitEl.innerHTML = '';
          const img = document.createElement('img');
          img.src = portraitCanvas.toDataURL();
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          this.advisorPortraitEl.appendChild(img);
        } else {
          this.advisorPortraitEl.textContent = data.speaker === 'zalpa' ? 'ZA' : (data.speaker === 'tarkhunta' ? 'TA' : 'BK');
        }
      }
    });
  }

  public formatCostHtml(cost: Cost): string {
    const parts: string[] = [];
    if (cost.copper) parts.push(`<span style="color: #2de0a5;">${cost.copper} Cop</span>`);
    if (cost.tin) parts.push(`<span style="color: #c0c6cc;">${cost.tin} Tin</span>`);
    if (cost.stone) parts.push(`<span style="color: #e2e8f0;">${cost.stone} Stn</span>`);
    if (cost.timber) parts.push(`<span style="color: #f59e0b;">${cost.timber} Tmb</span>`);
    if (cost.iron) parts.push(`<span style="color: #e07a5f;">${cost.iron} Irn</span>`);
    if (cost.grain) parts.push(`<span style="color: #ffd166;">${cost.grain} Grn</span>`);
    return parts.join(' · ') || '<span style="color: #a3e635;">Free</span>';
  }

  public formatCostTooltip(cost: Cost): string {
    const parts: string[] = [];
    if (cost.copper) parts.push(`${cost.copper} Copper`);
    if (cost.tin) parts.push(`${cost.tin} Tin`);
    if (cost.stone) parts.push(`${cost.stone} Stone`);
    if (cost.timber) parts.push(`${cost.timber} Timber`);
    if (cost.iron) parts.push(`${cost.iron} Iron`);
    if (cost.grain) parts.push(`${cost.grain} Grain`);
    return parts.join(', ') || 'Free';
  }

  public populateBuildMenu(unlockedBuildings?: string[]): void {
    const container = document.getElementById('build-items-container');
    if (!container) return;

    container.innerHTML = '';
    const entries = Object.entries(BUILDINGS).filter(([id]) => {
      if (unlockedBuildings && unlockedBuildings.length > 0) {
        return unlockedBuildings.includes(id);
      }
      return true;
    });

    for (const [id, def] of entries) {
      const btn = document.createElement('button');
      btn.className = 'svga-btn build-btn';
      const costHtml = this.formatCostHtml(def.cost);
      const costText = this.formatCostTooltip(def.cost);
      btn.title = `${def.name} (${costText}) - ${def.description}`;

      btn.innerHTML = `
        <div style="font-weight: bold; font-size: 11px;">${def.name}</div>
        <div style="font-size: 10px; margin-top: 2px;">${costHtml}</div>
      `;

      btn.addEventListener('click', () => {
        EventBus.get().emit('audio:click');
        if (this.onSelectBuildItem) {
          this.onSelectBuildItem(id);
        }
      });

      container.appendChild(btn);
    }
  }

  public updateInspector(
    selectedUnit: UnitEntity | null,
    selectedBuilding: BuildingEntity | null,
    selectedVein?: { name: string; type: string; current: number; max: number } | null
  ): void {
    const actionsBox = document.getElementById('inspector-actions');
    if (actionsBox) actionsBox.innerHTML = '';
    this.inspectorHpFillEl.style.backgroundColor = '';

    if (selectedUnit) {
      this.inspectorPanelEl.style.display = 'flex';
      this.inspectorNameEl.textContent = selectedUnit.def.name;
      let desc = selectedUnit.def.description;
      if (selectedUnit.def.category === 'worker') {
        const cType = (selectedUnit.currentCargoType || 'cargo').toUpperCase();
        if (selectedUnit.state === 'WAITING_STORAGE') {
          desc += `\n[STATUS: WAITING FOR STORAGE SPACE - Baskets Full: ${selectedUnit.currentCargoAmount} ${cType}]`;
        } else if (selectedUnit.state === 'HARVESTING') {
          desc += `\n[STATUS: Harvesting ${cType} - Baskets: ${selectedUnit.currentCargoAmount}/${selectedUnit.def.cargoCapacity || 120}]`;
        } else if (selectedUnit.state === 'RETURN_CARGO') {
          desc += `\n[STATUS: Hauling ${selectedUnit.currentCargoAmount} ${cType} to depot]`;
        }
      }
      this.inspectorDescEl.textContent = desc;
      const hpPct = Math.max(0, Math.min(100, (selectedUnit.hp / selectedUnit.maxHp) * 100));
      this.inspectorHpFillEl.style.width = `${hpPct}%`;

      if (actionsBox && selectedUnit.owner === 'player') {
        const stopBtn = document.createElement('button');
        stopBtn.className = 'svga-btn';
        stopBtn.textContent = 'Halt / Stop';
        stopBtn.onclick = () => {
          selectedUnit.path = [];
          selectedUnit.state = 'IDLE';
        };
        actionsBox.appendChild(stopBtn);
      }
    } else if (selectedBuilding) {
      this.inspectorPanelEl.style.display = 'flex';
      this.inspectorNameEl.textContent = selectedBuilding.def.name;
      const isUnderConstruction = selectedBuilding.buildProgress < 1.0;
      if (isUnderConstruction) {
        const buildPct = Math.floor(selectedBuilding.buildProgress * 100);
        this.inspectorDescEl.textContent = `[Under Construction ${buildPct}%] Scaffolding active. Cedar frames being lashed.`;
      } else {
        this.inspectorDescEl.textContent = selectedBuilding.def.description;
      }
      const hpPct = Math.max(0, Math.min(100, (selectedBuilding.hp / selectedBuilding.maxHp) * 100));
      this.inspectorHpFillEl.style.width = `${hpPct}%`;

      if (actionsBox && selectedBuilding.owner === 'player' && selectedBuilding.def.producesUnits) {
        for (const uId of selectedBuilding.def.producesUnits) {
          const uDef = UNITS[uId];
          if (!uDef) continue;
          // Filter out future era locked units
          if (uDef.unlockEra === 'early_iron') continue;

          const uCostHtml = this.formatCostHtml(uDef.cost);
          const uCostText = this.formatCostTooltip(uDef.cost);
          const shortName = uId === 'spear_militia' ? 'Spearman' :
                            (uId === 'skirmisher' ? 'Slinger' :
                            (uId === 'bronze_swordsman' ? 'Khopesh' :
                            (uId === 'donkey_caravan' ? 'Donkey' : uDef.name.split(' ')[0])));

          const trainBtn = document.createElement('button');
          trainBtn.className = 'svga-btn';
          trainBtn.title = isUnderConstruction ?
            `Cannot train during construction (${Math.floor(selectedBuilding.buildProgress * 100)}%)` :
            `Train ${uDef.name} (${uCostText}, Supply: ${uDef.supplyCost}) - ${uDef.description}`;
          if (isUnderConstruction) {
            trainBtn.style.opacity = '0.5';
            trainBtn.style.cursor = 'not-allowed';
          }
          trainBtn.innerHTML = `
            <div style="font-weight: bold; font-size: 11px;">Train ${shortName}</div>
            <div style="font-size: 9px; margin-top: 2px;">${uCostHtml}</div>
          `;
          trainBtn.onclick = () => {
            if (isUnderConstruction) {
              EventBus.get().emit('advisor:message', {
                speaker: 'tarkhunta',
                text: 'The Barracks is still swarming with carpenters! Wait for scaffolding removal.',
                isAlert: true
              });
              return;
            }
            if (this.onTrainUnit) this.onTrainUnit(uId);
          };
          actionsBox.appendChild(trainBtn);
        }
      }
    } else if (selectedVein) {
      this.inspectorPanelEl.style.display = 'flex';
      this.inspectorNameEl.textContent = selectedVein.name;
      const typeLabel = selectedVein.type === 'copper' ? 'Copper [Cop]' : (selectedVein.type === 'tin' ? 'Tin [Tin]' : 'Iron [Irn]');
      this.inspectorDescEl.textContent = `Mineral reserve: ${Math.floor(selectedVein.current)} / ${selectedVein.max} ${typeLabel}. Harvested by Caravans.`;
      const pct = Math.max(0, Math.min(100, (selectedVein.current / selectedVein.max) * 100));
      this.inspectorHpFillEl.style.width = `${pct}%`;
      this.inspectorHpFillEl.style.backgroundColor = selectedVein.type === 'copper' ? '#2de0a5' : (selectedVein.type === 'tin' ? '#c0c6cc' : '#e07a5f');
    } else {
      this.inspectorPanelEl.style.display = 'none';
    }
  }

  public renderMinimap(
    camera: Camera2D,
    units: UnitEntity[],
    buildings: BuildingEntity[],
    mapW: number,
    mapH: number
  ): void {
    const ctx = this.minimapCtx;
    const cw = this.minimapCanvas.width;
    const ch = this.minimapCanvas.height;

    // Minimap background
    ctx.fillStyle = '#1c1712';
    ctx.fillRect(0, 0, cw, ch);

    const scaleX = cw / (mapW * TILE_SIZE);
    const scaleY = ch / (mapH * TILE_SIZE);

    // Buildings
    for (const b of buildings) {
      ctx.fillStyle = b.owner === 'player' ? '#2de0a5' : '#e63946';
      ctx.fillRect(b.tx * TILE_SIZE * scaleX, b.ty * TILE_SIZE * scaleY, b.def.width * TILE_SIZE * scaleX, b.def.height * TILE_SIZE * scaleY);
    }

    // Units
    for (const u of units) {
      ctx.fillStyle = u.owner === 'player' ? '#ffd166' : '#ff4d6d';
      ctx.fillRect(u.x * scaleX - 1.5, u.y * scaleY - 1.5, 3, 3);
    }

    // Camera viewport rectangle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      camera.x * scaleX,
      camera.y * scaleY,
      (camera.viewportWidth / camera.zoom) * scaleX,
      (camera.viewportHeight / camera.zoom) * scaleY
    );
  }

  public updateWaveTimer(countdown: number | null): void {
    if (!this.trackerTimerEl) return;
    if (countdown !== null) {
      this.trackerTimerEl.textContent = `Wave in: ${countdown}s`;
      this.trackerTimerEl.style.color = countdown <= 15 ? '#ef4444' : '#ffd166';
    } else {
      this.trackerTimerEl.textContent = 'All Waves Beaten';
      this.trackerTimerEl.style.color = '#2de0a5';
    }
  }

  public updateObjectives(objectives: ObjectiveProgress[]): void {
    if (!this.objectivesListEl) return;
    this.objectivesListEl.innerHTML = '';

    for (const obj of objectives) {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'flex-start';
      item.style.gap = '6px';
      item.style.lineHeight = '1.25';

      let icon = '<span style="color: #ffd166; font-weight: bold;">[ ]</span>';
      let textStyle = 'color: #e8dccb;';
      if (obj.isCompleted) {
        icon = '<span style="color: #2de0a5; font-weight: bold;">[✓]</span>';
        textStyle = 'color: #a0c49d; text-decoration: line-through;';
      } else if (obj.isFailed) {
        icon = '<span style="color: #ef4444; font-weight: bold;">[✕]</span>';
        textStyle = 'color: #ef4444;';
      }

      let progressStr = '';
      if (!obj.isCompleted && obj.targetAmount && obj.targetAmount > 1) {
        progressStr = ` <span style="color: #ffd166; font-size: 11px;">(${obj.currentAmount || 0}/${obj.targetAmount})</span>`;
      }

      item.innerHTML = `${icon} <span style="${textStyle}">${obj.description}${progressStr}</span>`;
      this.objectivesListEl.appendChild(item);
    }
  }
}
