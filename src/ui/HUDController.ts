import { EventBus } from '../core/EventBus.ts';
import { ResourcePool } from '../data/types.ts';
import { BUILDINGS } from '../data/buildings.ts';
import { UNITS } from '../data/units.ts';
import { UnitEntity } from '../entities/UnitEntity.ts';
import { BuildingEntity } from '../entities/BuildingEntity.ts';
import { Camera2D } from '../engine/camera/Camera2D.ts';
import { SVGAProceduralBank } from '../engine/rendering/SVGAProceduralBank.ts';

export class HUDController {
  private resCopperEl!: HTMLElement;
  private resTinEl!: HTMLElement;
  private resIronEl!: HTMLElement;
  private resGrainEl!: HTMLElement;
  private resSupplyEl!: HTMLElement;

  private advisorPortraitEl!: HTMLImageElement | HTMLDivElement;
  private advisorTextEl!: HTMLElement;

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
    this.resIronEl = document.getElementById('val-iron')!;
    this.resGrainEl = document.getElementById('val-grain')!;
    this.resSupplyEl = document.getElementById('val-supply')!;

    this.advisorPortraitEl = document.getElementById('advisor-portrait')! as HTMLImageElement;
    this.advisorTextEl = document.getElementById('advisor-text')!;

    this.inspectorPanelEl = document.getElementById('inspector-panel')!;
    this.inspectorNameEl = document.getElementById('inspector-name')!;
    this.inspectorDescEl = document.getElementById('inspector-desc')!;
    this.inspectorHpFillEl = document.getElementById('inspector-hp-fill')!;

    this.minimapCanvas = document.getElementById('minimap-canvas')! as HTMLCanvasElement;
    this.minimapCtx = this.minimapCanvas.getContext('2d')!;
  }

  private setupListeners(): void {
    const bus = EventBus.get();

    bus.on('economy:changed', (res: ResourcePool) => {
      if (this.resCopperEl) this.resCopperEl.textContent = Math.floor(res.copper).toString();
      if (this.resTinEl) this.resTinEl.textContent = Math.floor(res.tin).toString();
      if (this.resIronEl) this.resIronEl.textContent = Math.floor(res.iron).toString();
      if (this.resGrainEl) this.resGrainEl.textContent = Math.floor(res.grain).toString();
    });

    bus.on('economy:supply_changed', (data: { max: number; used: number }) => {
      if (this.resSupplyEl) this.resSupplyEl.textContent = `${data.used}/${data.max}`;
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
          this.advisorPortraitEl.appendChild(img);
        } else {
          this.advisorPortraitEl.textContent = data.speaker === 'zalpa' ? 'ZA' : (data.speaker === 'tarkhunta' ? 'TA' : 'BK');
        }
      }
    });
  }

  public populateBuildMenu(): void {
    const container = document.getElementById('build-items-container');
    if (!container) return;

    container.innerHTML = '';
    for (const [id, def] of Object.entries(BUILDINGS)) {
      const btn = document.createElement('button');
      btn.className = 'svga-btn build-btn';
      btn.title = `${def.name} - ${def.description}`;

      let costStr = `${def.cost.copper || 0} C`;
      if (def.cost.tin) costStr += ` | ${def.cost.tin} T`;
      if (def.cost.iron) costStr += ` | ${def.cost.iron} Fe`;

      btn.innerHTML = `
        <div style="font-weight: bold; font-size: 11px;">${def.name}</div>
        <div style="font-size: 10px; color: #ffdf73;">${costStr}</div>
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
    selectedBuilding: BuildingEntity | null
  ): void {
    const actionsBox = document.getElementById('inspector-actions');
    if (actionsBox) actionsBox.innerHTML = '';

    if (selectedUnit) {
      this.inspectorPanelEl.style.display = 'flex';
      this.inspectorNameEl.textContent = selectedUnit.def.name;
      this.inspectorDescEl.textContent = selectedUnit.def.description;
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
      this.inspectorDescEl.textContent = selectedBuilding.def.description;
      const hpPct = Math.max(0, Math.min(100, (selectedBuilding.hp / selectedBuilding.maxHp) * 100));
      this.inspectorHpFillEl.style.width = `${hpPct}%`;

      if (actionsBox && selectedBuilding.owner === 'player' && selectedBuilding.def.producesUnits) {
        for (const uId of selectedBuilding.def.producesUnits) {
          const uDef = UNITS[uId];
          if (!uDef) continue;
          const trainBtn = document.createElement('button');
          trainBtn.className = 'svga-btn';
          trainBtn.textContent = `Train ${uDef.name.split(' ')[0]}`;
          trainBtn.onclick = () => {
            if (this.onTrainUnit) this.onTrainUnit(uId);
          };
          actionsBox.appendChild(trainBtn);
        }
      }
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

    const scaleX = cw / (mapW * 48);
    const scaleY = ch / (mapH * 48);

    // Buildings
    for (const b of buildings) {
      ctx.fillStyle = b.owner === 'player' ? '#2de0a5' : '#e63946';
      ctx.fillRect(b.tx * 48 * scaleX, b.ty * 48 * scaleY, b.def.width * 48 * scaleX, b.def.height * 48 * scaleY);
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
}
