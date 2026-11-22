import { BronzeAudioEngine } from './engine/audio/BronzeAudioEngine.ts';
import { Camera2D } from './engine/camera/Camera2D.ts';
import { TileRenderer } from './engine/rendering/TileRenderer.ts';
import { FogRenderer } from './engine/rendering/FogRenderer.ts';
import { GridGraph } from './engine/pathfinding/GridGraph.ts';
import { AStar } from './engine/pathfinding/AStar.ts';
import { EconomySystem } from './systems/EconomySystem.ts';
import { CombatSystem } from './systems/CombatSystem.ts';
import { TacticalDirector } from './ai/TacticalDirector.ts';
import { UnitFSM } from './ai/UnitFSM.ts';
import { ScenarioLoader } from './campaign/ScenarioLoader.ts';
import { HUDController } from './ui/HUDController.ts';
import { UnitEntity } from './entities/UnitEntity.ts';
import { BuildingEntity } from './entities/BuildingEntity.ts';
import { TILE_SIZE } from './data/terrain.ts';
import { BUILDINGS } from './data/buildings.ts';
import { UNITS } from './data/units.ts';
import { EventBus } from './core/EventBus.ts';
import { SVGAProceduralBank } from './engine/rendering/SVGAProceduralBank.ts';
import { AssetLoader } from './engine/rendering/AssetLoader.ts';
import { ObjectiveManager } from './campaign/ObjectiveManager.ts';
import { CouncilModal } from './ui/CouncilModal.ts';
import { DebriefingModal } from './ui/DebriefingModal.ts';
import { TitleScreen } from './ui/TitleScreen.ts';
import { CampaignMapModal } from './ui/CampaignMapModal.ts';
import { ChronicleModal } from './ui/ChronicleModal.ts';
import { SettingsModal } from './ui/SettingsModal.ts';
import { SaveManager } from './services/SaveManager.ts';

class GameApp {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  private camera!: Camera2D;
  private tileRenderer!: TileRenderer;
  private fogRenderer!: FogRenderer;
  private gridGraph!: GridGraph;
  private audio!: BronzeAudioEngine;
  private economy!: EconomySystem;
  private combat!: CombatSystem;
  private tacticalDirector!: TacticalDirector;
  private hud!: HUDController;

  private titleScreen!: TitleScreen;
  private campaignMapModal!: CampaignMapModal;
  private chronicleModal!: ChronicleModal;
  private settingsModal!: SettingsModal;
  private objectiveManager!: ObjectiveManager;
  private councilModal!: CouncilModal;
  private debriefingModal!: DebriefingModal;

  private hasGameStarted: boolean = false;
  private isGamePaused: boolean = true;
  private gameSpeedMultiplier: number = 1.0;
  private hasHarvestedFirstTin: boolean = false;
  private hasWarnedWatchtower: boolean = false;

  private units: UnitEntity[] = [];
  private buildings: BuildingEntity[] = [];
  private decorations: Array<{ x: number; y: number; type: string; current: number; max: number }> = [];
  private floatingTexts: Array<{
    id: number;
    text: string;
    color: string;
    x: number;
    y: number;
    life: number;
    maxLife: number;
  }> = [];

  private combatParticles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    maxLife: number;
    size: number;
  }> = [];

  private fallenWarriors: Array<{
    x: number;
    y: number;
    owner: string;
    defId: string;
    angle: number;
    life: number;
    maxLife: number;
  }> = [];

  private selectedUnits: UnitEntity[] = [];
  private selectedBuilding: BuildingEntity | null = null;
  private selectedVein: { name: string; type: string; current: number; max: number; tx: number; ty: number } | null = null;
  private buildingToPlace: string | null = null;

  private isDraggingBox = false;
  private dragStart = { x: 0, y: 0 };
  private dragCurrent = { x: 0, y: 0 };

  private keysDown: Set<string> = new Set();
  private lastTime = 0;
  private nextEntityId = 1;

  public async init(): Promise<void> {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Initialize procedural generators and real 2D pixel art asset loader
    SVGAProceduralBank.init();
    await AssetLoader.init();

    // Load Scenario 1
    const scenario = await ScenarioLoader.loadScenario('scenario_01_horned_sails');

    const mapW = scenario.map.width;
    const mapH = scenario.map.height;

    this.gridGraph = new GridGraph(mapW, mapH);
    this.tileRenderer = new TileRenderer(mapW, mapH, 'plain');
    this.fogRenderer = new FogRenderer(mapW, mapH);
    this.audio = new BronzeAudioEngine();
    this.economy = new EconomySystem(scenario.player.initialResources);
    this.combat = new CombatSystem();
    this.tacticalDirector = new TacticalDirector(scenario, mapW, mapH);

    this.camera = new Camera2D(
      this.canvas.width,
      this.canvas.height,
      mapW * TILE_SIZE,
      mapH * TILE_SIZE
    );

    // Setup map terrain for Levantine biome (western sea for Sea Peoples, sandy shore, copper and tin veins)
    this.setupLevantineMap(mapW, mapH);

    // Position starting Acropolis, Foundry, and foundation slabs
    const pStart = scenario.player.startPosition;
    this.gridGraph.setFoundation(pStart.tx, pStart.ty, 4, 4, true);
    this.gridGraph.setFoundation(pStart.tx + 5, pStart.ty, 3, 3, true);
    this.spawnBuilding('cyclopean_slab', 'player', pStart.tx - 2, pStart.ty, true);
    this.spawnBuilding('cyclopean_slab', 'player', pStart.tx - 2, pStart.ty + 2, true);
    this.spawnBuilding('acropolis', 'player', pStart.tx, pStart.ty, true);
    this.spawnBuilding('bronze_foundry', 'player', pStart.tx + 5, pStart.ty, true);

    // Spawn starting units
    this.spawnUnit('donkey_caravan', 'player', (pStart.tx + 2) * TILE_SIZE, (pStart.ty + 5) * TILE_SIZE);
    this.spawnUnit('spear_militia', 'player', (pStart.tx - 2) * TILE_SIZE, (pStart.ty + 3) * TILE_SIZE);
    this.spawnUnit('spear_militia', 'player', (pStart.tx - 2) * TILE_SIZE, (pStart.ty + 5) * TILE_SIZE);
    this.spawnUnit('skirmisher', 'player', (pStart.tx - 4) * TILE_SIZE, (pStart.ty + 4) * TILE_SIZE);

    this.camera.centerOn(pStart.tx * TILE_SIZE, pStart.ty * TILE_SIZE);
    this.resizeCanvas();
    this.updateFogOfWar();

    this.hud = new HUDController();
    this.hud.populateBuildMenu(scenario.player.unlockedBuildings);
    this.hud.onSelectBuildItem = (defId: string) => {
      this.buildingToPlace = defId;
    };
    this.hud.onTrainUnit = (unitDefId: string) => {
      this.trainUnit(unitDefId);
    };

    // Initialize Settings from SaveManager
    const initialSettings = SaveManager.get().getSettings();
    this.gameSpeedMultiplier = initialSettings.gameSpeed || 1.0;
    this.camera.panSpeed = initialSettings.panSpeed || 650;

    // Instantiate Campaign Transversal Modals & Menus
    this.titleScreen = new TitleScreen();
    this.campaignMapModal = new CampaignMapModal();
    this.chronicleModal = new ChronicleModal();
    this.settingsModal = new SettingsModal(this.audio);

    this.objectiveManager = new ObjectiveManager(scenario);
    this.councilModal = new CouncilModal(() => {
      this.closeAllModals();
      this.hasGameStarted = true;
      this.isGamePaused = false;
      this.updateFogOfWar();
      this.audio.startBGM();
    });
    this.debriefingModal = new DebriefingModal(
      () => window.location.reload(),
      () => {
        this.closeAllModals();
        this.campaignMapModal.show();
      }
    );

    // Title Screen button actions
    this.titleScreen.onContinue = () => {
      this.closeAllModals();
      this.councilModal.show();
    };
    this.titleScreen.onOpenMap = () => {
      this.closeAllModals();
      this.campaignMapModal.show();
    };
    this.titleScreen.onOpenChronicle = () => {
      this.closeAllModals();
      this.chronicleModal.show();
    };
    this.titleScreen.onOpenSettings = () => {
      this.closeAllModals();
      this.settingsModal.show(false);
    };
    this.titleScreen.onNewCampaign = () => {
      window.location.reload();
    };

    // Strategic Map actions
    this.campaignMapModal.onSelectScenario = (_scenarioId: string) => {
      this.closeAllModals();
      this.councilModal.show();
    };
    this.campaignMapModal.onClose = () => {
      this.closeAllModals();
      if (this.hasGameStarted) {
        this.isGamePaused = false;
        this.updateFogOfWar();
      } else {
        this.titleScreen.show();
      }
    };

    // Chronicle Modal actions
    this.chronicleModal.onProceedToBattle = () => {
      this.closeAllModals();
      if (this.hasGameStarted) {
        this.isGamePaused = false;
        this.updateFogOfWar();
      } else {
        this.councilModal.show();
      }
    };
    this.chronicleModal.onClose = () => {
      this.closeAllModals();
      if (this.hasGameStarted) {
        this.isGamePaused = false;
        this.updateFogOfWar();
      } else {
        this.titleScreen.show();
      }
    };

    // Settings Modal actions
    this.settingsModal.onResume = () => {
      this.closeAllModals();
      if (this.hasGameStarted) {
        this.isGamePaused = false;
        this.updateFogOfWar();
      } else {
        this.titleScreen.show();
      }
    };
    this.settingsModal.onRestartScenario = () => {
      window.location.reload();
    };
    this.settingsModal.onOpenCouncil = () => {
      this.closeAllModals();
      this.councilModal.show();
    };
    this.settingsModal.onReturnToMap = () => {
      this.closeAllModals();
      this.campaignMapModal.show();
    };
    this.settingsModal.onReturnToTitle = () => {
      this.closeAllModals();
      this.isGamePaused = true;
      this.titleScreen.show();
    };
    this.settingsModal.onSpeedChanged = (speed: number) => {
      this.gameSpeedMultiplier = speed;
    };
    this.settingsModal.onPanSpeedChanged = (panSpeed: number) => {
      this.camera.panSpeed = panSpeed;
    };

    // Wire Top Bar Buttons
    document.getElementById('btn-open-council')?.addEventListener('click', () => {
      this.closeAllModals();
      this.isGamePaused = true;
      this.councilModal.show();
    });
    document.getElementById('btn-open-map')?.addEventListener('click', () => {
      this.closeAllModals();
      this.isGamePaused = true;
      this.campaignMapModal.show();
    });
    document.getElementById('btn-open-chronicle')?.addEventListener('click', () => {
      this.closeAllModals();
      this.isGamePaused = true;
      this.chronicleModal.show();
    });
    document.getElementById('btn-open-settings')?.addEventListener('click', () => {
      this.closeAllModals();
      this.isGamePaused = true;
      this.settingsModal.show(true);
    });

    // Wire Floating Text visual FX
    EventBus.get().on('fx:floating_text', (data: { text: string; color: string; x: number; y: number }) => {
      this.floatingTexts.push({
        id: this.nextEntityId++,
        text: data.text,
        color: data.color || '#fef08a',
        x: data.x,
        y: data.y,
        life: 1.3,
        maxLife: 1.3
      });
    });

    // Wire Combat hit spark particles
    EventBus.get().on('fx:combat_hit', (data: { x: number; y: number; color?: string }) => {
      for (let i = 0; i < 6; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 35 + Math.random() * 85;
        this.combatParticles.push({
          x: data.x,
          y: data.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color: data.color || '#fbbf24',
          life: 0.35 + Math.random() * 0.25,
          maxLife: 0.6,
          size: 1.5 + Math.random() * 2.0
        });
      }
    });

    // Wire fallen warriors (battlefield decals)
    EventBus.get().on('combat:unit_killed', (u: UnitEntity) => {
      this.fallenWarriors.push({
        x: u.x,
        y: u.y,
        owner: u.owner,
        defId: u.defId,
        angle: Math.random() * Math.PI * 2,
        life: 22,
        maxLife: 22
      });
    });

    // Wire Victory / Defeat events
    EventBus.get().on('scenario:victory', (data: any) => {
      this.isGamePaused = true;
      this.debriefingModal.showVictory(data.stats, data.objectives);
    });
    EventBus.get().on('scenario:defeat', (data: any) => {
      this.isGamePaused = true;
      this.debriefingModal.showDefeat(data.reason, data.stats, data.objectives);
    });

    this.setupInputHandlers();

    // Show initial Title Screen on startup
    this.isGamePaused = true;
    this.titleScreen.show();

    // Send initial narrative advisor briefing
    EventBus.get().emit('advisor:message', {
      speaker: 'burna_khabir',
      text: scenario.narrative.dialogues[0].message,
      isAlert: false
    });

    // Start game loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private resizeCanvas(): void {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
      if (this.camera) {
        this.camera.updateDimensions(this.canvas.width, this.canvas.height);
      }
    }
  }

  private setupLevantineMap(w: number, h: number): void {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Western sea belt (Sea Peoples naval approach vector)
        if (x < 6) {
          this.tileRenderer.setTile(x, y, 'water');
          this.gridGraph.setTileCost(x, y, 0);
        } else if (x < 9) {
          this.tileRenderer.setTile(x, y, 'sand');
          this.gridGraph.setTileCost(x, y, 14);
        } else {
          this.tileRenderer.setTile(x, y, 'plain');
          this.gridGraph.setTileCost(x, y, 10);
        }
      }
    }

    // Copper resource nodes east of the base (9 tiles, 600 copper each)
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        this.tileRenderer.setTile(22 + dx, 26 + dy, 'vein_copper', 600);
        this.gridGraph.setTileCost(22 + dx, 26 + dy, 0);
      }
    }

    // Rare Tin (Cassiterite) nodes northeast of the settlement (4 tiles, 300 tin each)
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        this.tileRenderer.setTile(20 + dx, 14 + dy, 'vein_tin', 300);
        this.gridGraph.setTileCost(20 + dx, 14 + dy, 0);
      }
    }

    // Cyclopean Limestone / Stone Quarry nodes north of the settlement (3x2 tiles, 800 stone each)
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        this.tileRenderer.setTile(25 + dx, 10 + dy, 'vein_stone', 800);
        this.gridGraph.setTileCost(25 + dx, 10 + dy, 0);
      }
    }

    // Scatter Mediterranean Cedar Trees across the landscape (each tree has 240 Timber)
    this.decorations = [];
    for (let i = 0; i < 55; i++) {
      const tx = Math.floor((Math.sin(i * 13.7) * 0.5 + 0.5) * (w - 6)) + 8;
      const ty = Math.floor((Math.cos(i * 19.3) * 0.5 + 0.5) * (h - 6)) + 3;
      const distPlayer = Math.hypot(tx - 12, ty - 28);
      if (this.tileRenderer.getTile(tx, ty) === 'plain' && distPlayer > 6) {
        this.decorations.push({ x: tx + 0.5, y: ty + 0.5, type: 'cedar', current: 240, max: 240 });
      }
    }
  }

  private canPlaceBuilding(defId: string, tx: number, ty: number): boolean {
    const bDef = BUILDINGS[defId];
    if (!bDef) return false;

    if (!this.gridGraph.isInBounds(tx, ty) || !this.gridGraph.isInBounds(tx + bDef.width - 1, ty + bDef.height - 1)) {
      return false;
    }

    for (let dy = 0; dy < bDef.height; dy++) {
      for (let dx = 0; dx < bDef.width; dx++) {
        const curX = tx + dx;
        const curY = ty + dy;

        const tile = this.tileRenderer.getTile(curX, curY);
        // Deep water or cliffs are strictly impassable for all construction
        if (tile === 'water' || tile === 'cliff') return false;

        // Resource veins (copper, tin, iron) cannot be built over
        if (tile === 'vein_copper' || tile === 'vein_tin' || tile === 'vein_iron') return false;

        if (defId === 'cyclopean_slab') {
          // Cannot build slab if slab is already paved
          if (this.gridGraph.hasFoundation(curX, curY)) return false;
          // Cannot build slab underneath an existing building
          if (this.gridGraph.isBuildingOccupied(curX, curY)) return false;
        } else {
          // Non-slab buildings cannot overlap another building
          if (this.gridGraph.isBuildingOccupied(curX, curY)) return false;
        }
      }
    }
    return true;
  }

  private spawnBuilding(defId: string, owner: any, tx: number, ty: number, isInstant: boolean = false): BuildingEntity {
    const bDef = BUILDINGS[defId] || BUILDINGS['barracks'];
    const hasFoundation = this.gridGraph.hasFoundationArea(tx, ty, bDef.width, bDef.height);
    const b = new BuildingEntity(this.nextEntityId++, defId, owner, tx, ty, hasFoundation, isInstant);
    this.buildings.push(b);

    // Remove any trees in the construction footprint
    this.decorations = this.decorations.filter(d => {
      const dx = Math.floor(d.x);
      const dy = Math.floor(d.y);
      return !(dx >= tx && dx < tx + b.def.width && dy >= ty && dy < ty + b.def.height);
    });

    if (defId === 'cyclopean_slab') {
      this.gridGraph.setFoundation(tx, ty, b.def.width, b.def.height, true);
    } else {
      this.gridGraph.setBuildingOccupied(tx, ty, b.def.width, b.def.height, true);
    }

    if (isInstant && owner === 'player' && this.objectiveManager) {
      this.objectiveManager.recordBuildingErected(defId);
    }

    // Contextual Advisor warning / confirmation on placement
    if (!isInstant && owner === 'player') {
      if (bDef.requiresFoundation && !hasFoundation) {
        EventBus.get().emit('advisor:message', {
          speaker: 'tarkhunta',
          text: `Wanax! You erect ${bDef.name} upon bare sand! Without cyclopean slabs, its structure suffers a 50% HP penalty!`,
          isAlert: true
        });
      } else if (bDef.requiresFoundation && hasFoundation) {
        EventBus.get().emit('advisor:message', {
          speaker: 'tarkhunta',
          text: `Megalithic foundation secured. The stonecutters anchor ${bDef.name} with bronze clamps (100% HP)!`,
          isAlert: false
        });
      }
    }

    EventBus.get().emit('audio:build');
    return b;
  }

  private spawnUnit(defId: string, owner: any, wx: number, wy: number): UnitEntity {
    const u = new UnitEntity(this.nextEntityId++, defId, owner, wx, wy);
    this.units.push(u);
    return u;
  }

  private trainUnit(unitDefId: string): void {
    const def = UNITS[unitDefId];
    if (!def) return;

    if (!this.economy.canAfford(def.cost)) {
      const r = this.economy.resources;
      const missing: string[] = [];
      if (def.cost.copper && r.copper < def.cost.copper) missing.push(`${Math.ceil(def.cost.copper - r.copper)} Copper [Cop]`);
      if (def.cost.tin && r.tin < def.cost.tin) missing.push(`${Math.ceil(def.cost.tin - r.tin)} Tin [Tin]`);
      if (def.cost.stone && r.stone < def.cost.stone) missing.push(`${Math.ceil(def.cost.stone - r.stone)} Stone [Stn]`);
      if (def.cost.timber && r.timber < def.cost.timber) missing.push(`${Math.ceil(def.cost.timber - r.timber)} Timber [Tmb]`);
      if (def.cost.iron && r.iron < def.cost.iron) missing.push(`${Math.ceil(def.cost.iron - r.iron)} Iron [Irn]`);
      if (def.cost.grain && r.grain < def.cost.grain) missing.push(`${Math.ceil(def.cost.grain - r.grain)} Grain [Grn]`);
      EventBus.get().emit('advisor:message', {
        speaker: 'burna_khabir',
        text: `Tarkhunta denies us! Lacking: ${missing.join(', ')} to train ${def.name}.`,
        isAlert: true
      });
      return;
    }

    if (!this.economy.hasAvailableSupply(def.supplyCost)) {
      EventBus.get().emit('advisor:message', {
        speaker: 'burna_khabir',
        text: 'Maximum supply capacity reached! Construct additional granaries.',
        isAlert: true
      });
      return;
    }

    this.economy.spend(def.cost);
    let spawnTx = 14;
    let spawnTy = 33;
    if (this.selectedBuilding && this.selectedBuilding.owner === 'player') {
      spawnTx = this.selectedBuilding.tx + Math.floor(this.selectedBuilding.def.width / 2);
      spawnTy = this.selectedBuilding.ty + this.selectedBuilding.def.height;
    }
    const spawned = this.spawnUnit(unitDefId, 'player', spawnTx * TILE_SIZE + 12, spawnTy * TILE_SIZE + 12);
    spawned.y += 10;
    EventBus.get().emit('audio:command');
    EventBus.get().emit('fx:floating_text', {
      text: `${def.name.split(' ')[0].toUpperCase()} READY`,
      color: '#4ade80',
      x: spawnTx * TILE_SIZE + 24,
      y: spawnTy * TILE_SIZE - 12
    });
  }

  private closeAllModals(): void {
    if (this.titleScreen) this.titleScreen.hide();
    if (this.councilModal) this.councilModal.hide();
    if (this.campaignMapModal) this.campaignMapModal.hide();
    if (this.chronicleModal) this.chronicleModal.hide();
    if (this.settingsModal) this.settingsModal.hide();
  }

  private setupInputHandlers(): void {
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.code);
      if (e.code === 'Escape') {
        // If an overlay modal is open, Escape closes it and resumes
        this.closeAllModals();
        this.isGamePaused = !this.isGamePaused;
        if (this.isGamePaused) {
          this.settingsModal.show(true);
        } else {
          this.settingsModal.hide();
        }
      } else if (e.code === 'KeyM') {
        const muted = this.audio.toggleMute();
        console.log('Audio muted:', muted);
      } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        this.camera.setZoom(this.camera.zoom + 0.05);
      } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        this.camera.setZoom(this.camera.zoom - 0.05);
      } else if (e.code === 'Digit0' || e.code === 'Numpad0') {
        this.camera.setZoom(0.85);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });

    // Smooth mouse wheel zoom anchored to cursor
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const step = e.deltaY < 0 ? 0.05 : -0.05;
      this.camera.setZoom(this.camera.zoom + step, sx, sy);
    }, { passive: false });

    this.canvas.addEventListener('mousedown', (e) => {
      // Begin BGM on first interaction
      this.audio.startBGM();

      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const worldPos = this.camera.screenToWorld(sx, sy);

      if (e.button === 0) {
        // Left click: place structure or start box selection
        if (this.buildingToPlace) {
          // Place building structure
          const bDef = BUILDINGS[this.buildingToPlace];
          const tx = Math.floor(worldPos.x / TILE_SIZE);
          const ty = Math.floor(worldPos.y / TILE_SIZE);

          if (!this.canPlaceBuilding(this.buildingToPlace, tx, ty)) {
            EventBus.get().emit('advisor:message', {
              speaker: 'burna_khabir',
              text: 'Terrain unsuitable or blocked! Cannot erect structure here.',
              isAlert: true
            });
            EventBus.get().emit('audio:combat_hit');
            return;
          }

          if (this.economy.canAfford(bDef.cost)) {
            this.economy.spend(bDef.cost);
            this.spawnBuilding(this.buildingToPlace, 'player', tx, ty, false);
            this.buildingToPlace = null;
          } else {
            const missing: string[] = [];
            const r = this.economy.resources;
            if (bDef.cost.copper && r.copper < bDef.cost.copper) missing.push(`${Math.ceil(bDef.cost.copper - r.copper)} Copper [Cop]`);
            if (bDef.cost.tin && r.tin < bDef.cost.tin) missing.push(`${Math.ceil(bDef.cost.tin - r.tin)} Tin [Tin]`);
            if (bDef.cost.stone && r.stone < bDef.cost.stone) missing.push(`${Math.ceil(bDef.cost.stone - r.stone)} Stone [Stn]`);
            if (bDef.cost.timber && r.timber < bDef.cost.timber) missing.push(`${Math.ceil(bDef.cost.timber - r.timber)} Timber [Tmb]`);
            if (bDef.cost.iron && r.iron < bDef.cost.iron) missing.push(`${Math.ceil(bDef.cost.iron - r.iron)} Iron [Irn]`);
            if (bDef.cost.grain && r.grain < bDef.cost.grain) missing.push(`${Math.ceil(bDef.cost.grain - r.grain)} Grain [Grn]`);

            EventBus.get().emit('advisor:message', {
              speaker: 'burna_khabir',
              text: `Insufficient resources for ${bDef.name}! Missing: ${missing.join(', ')}.`,
              isAlert: true
            });
            EventBus.get().emit('audio:combat_hit');
          }
          return;
        }

        this.isDraggingBox = true;
        this.dragStart = { x: sx, y: sy };
        this.dragCurrent = { x: sx, y: sy };
      } else if (e.button === 2) {
        // Right click: cancel building placement or issue contextual command
        e.preventDefault();
        if (this.buildingToPlace) {
          this.buildingToPlace = null;
          EventBus.get().emit('audio:click');
          return;
        }
        this.issueContextCommand(worldPos.x, worldPos.y);
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.dragCurrent = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0 && this.isDraggingBox) {
        this.isDraggingBox = false;
        this.resolveBoxSelection();
      }
    });
  }

  private resolveBoxSelection(): void {
    const p1 = this.camera.screenToWorld(
      Math.min(this.dragStart.x, this.dragCurrent.x),
      Math.min(this.dragStart.y, this.dragCurrent.y)
    );
    const p2 = this.camera.screenToWorld(
      Math.max(this.dragStart.x, this.dragCurrent.x),
      Math.max(this.dragStart.y, this.dragCurrent.y)
    );

    const isClick = Math.abs(this.dragStart.x - this.dragCurrent.x) < 6 && Math.abs(this.dragStart.y - this.dragCurrent.y) < 6;

    for (const u of this.units) u.isSelected = false;
    for (const b of this.buildings) b.isSelected = false;
    this.selectedUnits = [];
    this.selectedBuilding = null;
    this.selectedVein = null;

    if (isClick) {
      // Single click: select unit, building, or resource vein
      const clickedUnit = this.units.find(u => Math.hypot(u.x - p1.x, u.y - p1.y) < 24);
      if (clickedUnit) {
        clickedUnit.isSelected = true;
        this.selectedUnits = [clickedUnit];
        EventBus.get().emit('audio:select');
      } else {
        const tx = Math.floor(p1.x / TILE_SIZE);
        const ty = Math.floor(p1.y / TILE_SIZE);
        // Prioritize actual buildings over cyclopean foundation slabs, and allow roof vertical reach
        const clickedRealB = this.buildings.find(
          b => b.defId !== 'cyclopean_slab' &&
               tx >= b.tx && tx < b.tx + b.def.width &&
               ty >= b.ty - 0.7 && ty < b.ty + b.def.height
        );
        const clickedB = clickedRealB || this.buildings.find(
          b => tx >= b.tx && tx < b.tx + b.def.width && ty >= b.ty && ty < b.ty + b.def.height
        );
        if (clickedB) {
          clickedB.isSelected = true;
          this.selectedBuilding = clickedB;
          EventBus.get().emit('audio:select');
        } else {
          // Check if clicking on an ore vein or stone quarry
          const tileType = this.tileRenderer.getTile(tx, ty);
          if (tileType.startsWith('vein_')) {
            const res = this.tileRenderer.getVeinReserve(tx, ty);
            if (res) {
              const oreName = res.type === 'copper' ? 'Malachite / Copper Deposit' :
                              (res.type === 'tin' ? 'Cassiterite / Tin Deposit' :
                              (res.type === 'stone' ? 'Limestone / Stone Quarry' : 'Hematite / Iron Deposit'));
              this.selectedVein = {
                name: oreName,
                type: res.type,
                current: res.current,
                max: res.max,
                tx,
                ty
              };
              EventBus.get().emit('audio:select');
            }
          } else {
            // Check if clicking on a cedar tree
            const clickedTree = this.decorations.find(
              d => Math.hypot(d.x - (tx + 0.5), d.y - (ty + 0.5)) < 1.0
            );
            if (clickedTree) {
              this.selectedVein = {
                name: clickedTree.type === 'cedar' ? 'Mediterranean Cedar Tree' : 'Felled Cedar Stump',
                type: 'timber',
                current: clickedTree.current,
                max: clickedTree.max,
                tx,
                ty
              };
              EventBus.get().emit('audio:select');
            }
          }
        }
      }
    } else {
      // Box drag selection
      for (const u of this.units) {
        if (u.owner === 'player' && u.x >= p1.x && u.x <= p2.x && u.y >= p1.y && u.y <= p2.y) {
          u.isSelected = true;
          this.selectedUnits.push(u);
        }
      }
      if (this.selectedUnits.length > 0) {
        EventBus.get().emit('audio:select');
      }
    }

    this.hud.updateInspector(
      this.selectedUnits.length > 0 ? this.selectedUnits[0] : null,
      this.selectedBuilding,
      this.selectedVein
    );
  }

  private issueContextCommand(wx: number, wy: number): void {
    if (this.selectedUnits.length === 0) return;

    EventBus.get().emit('audio:command');

    let targetTx = Math.floor(wx / TILE_SIZE);
    let targetTy = Math.floor(wy / TILE_SIZE);

    // Prevent land units from marching into the sea without boats:
    // Western sea occupies x < 6. Clamp destination to the sandy beach shoreline (x = 6)
    const isWater = targetTx < 6 || this.tileRenderer.getTile(targetTx, targetTy) === 'water';
    if (isWater) {
      targetTx = 6;
      wx = 6 * TILE_SIZE + 24;
      EventBus.get().emit('fx:floating_text', {
        text: 'CANNOT CROSS WATER!',
        color: '#38bdf8',
        x: wx,
        y: wy - 18
      });
    }

    // Check if clicking on an enemy entity
    const targetEnemyUnit = this.units.find(
      u => u.owner !== 'player' && Math.hypot(u.x - wx, u.y - wy) < 24
    );

    // Check if clicking on a friendly storehouse / dropoff building (Acropolis, Granary, Foundry, Smelter)
    const targetFriendlyBuilding = this.buildings.find(
      b => b.owner === 'player' &&
           ((targetTx >= b.tx && targetTx < b.tx + b.def.width && targetTy >= b.ty && targetTy < b.ty + b.def.height) ||
            (targetTx >= b.tx && targetTx < b.tx + b.def.width && targetTy >= b.ty - 0.7 && targetTy < b.ty + b.def.height))
    );

    // Check if clicking on a resource node vein or stone quarry
    const tileType = this.tileRenderer.getTile(targetTx, targetTy);
    const isResourceNode = tileType.startsWith('vein_');

    // Check if clicking on a cedar tree for timber
    const targetTree = this.decorations.find(
      d => d.type === 'cedar' && d.current > 0 && Math.hypot(d.x - (targetTx + 0.5), d.y - (targetTy + 0.5)) < 1.2
    );

    // Formation slotting to guarantee no two units are assigned the same tile
    const assignedTiles = new Set<string>();
    const spiralOffsets = [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
      { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: -1 },
      { dx: 2, dy: 0 }, { dx: -2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: -2 },
      { dx: 2, dy: 1 }, { dx: -2, dy: 1 }, { dx: 1, dy: 2 }, { dx: -1, dy: 2 }
    ];

    for (let i = 0; i < this.selectedUnits.length; i++) {
      const u = this.selectedUnits[i];

      if (targetEnemyUnit) {
        u.targetMineCoord = null;
        u.targetEntityId = targetEnemyUnit.id;
        u.state = 'ATTACK_TARGET';
      } else if (
        targetFriendlyBuilding &&
        u.def.category === 'worker' &&
        (u.currentCargoAmount > 0 || u.state === 'WAITING_STORAGE') &&
        (targetFriendlyBuilding.defId === 'acropolis' || targetFriendlyBuilding.defId === 'granary' || targetFriendlyBuilding.defId === 'bronze_foundry' || targetFriendlyBuilding.defId === 'iron_smelter')
      ) {
        // Player directed donkey caravan to unload at a Granary, Megaron, or Foundry!
        const harvestTarget = u.targetMineCoord || u.lastHarvestCoord;
        u.targetMineCoord = harvestTarget ? { ...harvestTarget } : null;
        u.lastHarvestCoord = harvestTarget ? { ...harvestTarget } : null;
        u.targetDropoffBuildingId = targetFriendlyBuilding.id;
        u.isManualDropoffOrder = true;

        // Find nearest walkable entrance/perimeter tile outside the solid walls of the building
        let dropTx = targetFriendlyBuilding.tx + Math.floor(targetFriendlyBuilding.def.width / 2);
        let dropTy = targetFriendlyBuilding.ty + targetFriendlyBuilding.def.height;
        if (!this.gridGraph.isInBounds(dropTx, dropTy) || !this.gridGraph.isWalkable(dropTx, dropTy) || dropTx < 6) {
          let bestD = Infinity;
          for (let dy = -1; dy <= targetFriendlyBuilding.def.height; dy++) {
            for (let dx = -1; dx <= targetFriendlyBuilding.def.width; dx++) {
              if (dx >= 0 && dx < targetFriendlyBuilding.def.width && dy >= 0 && dy < targetFriendlyBuilding.def.height) continue;
              const px = targetFriendlyBuilding.tx + dx;
              const py = targetFriendlyBuilding.ty + dy;
              if (px >= 6 && this.gridGraph.isInBounds(px, py) && this.gridGraph.isWalkable(px, py)) {
                const curTx = Math.floor(u.x / TILE_SIZE);
                const curTy = Math.floor(u.y / TILE_SIZE);
                const d = Math.hypot(px - curTx, py - curTy);
                if (d < bestD) {
                  bestD = d;
                  dropTx = px;
                  dropTy = py;
                }
              }
            }
          }
        }

        const startTx = Math.floor(u.x / TILE_SIZE);
        const startTy = Math.floor(u.y / TILE_SIZE);
        const pathCoords = AStar.findPath(this.gridGraph, { tx: startTx, ty: startTy }, { tx: dropTx, ty: dropTy });
        if (pathCoords.length > 0) {
          u.path = pathCoords.map(c => ({
            x: Math.max(6 * TILE_SIZE + 12, c.tx * TILE_SIZE + 24),
            y: c.ty * TILE_SIZE + 24
          }));
        } else {
          u.path = [{ x: dropTx * TILE_SIZE + 24, y: dropTy * TILE_SIZE + 24 }];
        }
        u.state = 'RETURN_CARGO';

        EventBus.get().emit('fx:floating_text', {
          text: `DELIVERING TO ${targetFriendlyBuilding.def.name.split(' ')[0].toUpperCase()}!`,
          color: '#60a5fa',
          x: u.x,
          y: u.y - 20
        });
        EventBus.get().emit('advisor:message', {
          speaker: 'burna_khabir',
          text: `Caravan resuming! Dispatched to unload at ${targetFriendlyBuilding.def.name}.`,
          isAlert: false
        });
      } else if (isResourceNode && u.def.category === 'worker') {
        // Caravan dispatched to harvest ore or quarry stone
        u.targetMineCoord = { tx: targetTx, ty: targetTy };
        u.lastHarvestCoord = { tx: targetTx, ty: targetTy };
        u.targetPosition = { x: targetTx * TILE_SIZE + 24, y: targetTy * TILE_SIZE + 24 };
        u.currentCargoType = tileType.replace('vein_', '');
        u.lastCargoType = u.currentCargoType;

        const startTx = Math.floor(u.x / TILE_SIZE);
        const startTy = Math.floor(u.y / TILE_SIZE);
        const pathCoords = AStar.findPath(this.gridGraph, { tx: startTx, ty: startTy }, { tx: targetTx, ty: targetTy });
        if (pathCoords.length > 0) {
          u.path = pathCoords.map(c => ({
            x: Math.max(6 * TILE_SIZE + 12, c.tx * TILE_SIZE + 24),
            y: c.ty * TILE_SIZE + 24
          }));
        } else {
          u.path = [{ x: targetTx * TILE_SIZE + 24, y: targetTy * TILE_SIZE + 24 }];
        }
        u.state = 'HARVEST_SEEK';
      } else if (targetTree && u.def.category === 'worker') {
        // Caravan dispatched to fell and harvest cedar timber
        const treeTx = Math.floor(targetTree.x);
        const treeTy = Math.floor(targetTree.y);
        u.targetMineCoord = { tx: treeTx, ty: treeTy };
        u.lastHarvestCoord = { tx: treeTx, ty: treeTy };
        u.targetPosition = { x: targetTree.x * TILE_SIZE, y: targetTree.y * TILE_SIZE };
        u.currentCargoType = 'timber';
        u.lastCargoType = 'timber';

        const startTx = Math.floor(u.x / TILE_SIZE);
        const startTy = Math.floor(u.y / TILE_SIZE);
        const pathCoords = AStar.findPath(this.gridGraph, { tx: startTx, ty: startTy }, { tx: treeTx, ty: treeTy });
        if (pathCoords.length > 0) {
          u.path = pathCoords.map(c => ({
            x: Math.max(6 * TILE_SIZE + 12, c.tx * TILE_SIZE + 24),
            y: c.ty * TILE_SIZE + 24
          }));
        } else {
          u.path = [{ x: treeTx * TILE_SIZE + 24, y: treeTy * TILE_SIZE + 24 }];
        }
        u.state = 'HARVEST_SEEK';
      } else {
        // Normal unit movement order: assign distinct destination tile for this unit
        u.targetMineCoord = null;
        u.targetEntityId = null;

        let unitTargetTx = targetTx;
        let unitTargetTy = targetTy;

        // Find a distinct walkable tile around the target point that no other selected unit has taken
        // and that is not already occupied by another stationary unit
        for (const off of spiralOffsets) {
          const cTx = targetTx + off.dx;
          const cTy = targetTy + off.dy;
          const key = `${cTx},${cTy}`;
          if (cTx >= 6 && this.gridGraph.isInBounds(cTx, cTy) && this.gridGraph.isWalkable(cTx, cTy) && !assignedTiles.has(key)) {
            const isOccupiedByOther = this.units.some(
              un => un.id !== u.id && !this.selectedUnits.includes(un) && un.hp > 0 &&
              Math.hypot(un.x - (cTx * TILE_SIZE + 24), un.y - (cTy * TILE_SIZE + 24)) < 28
            );
            if (!isOccupiedByOther) {
              unitTargetTx = cTx;
              unitTargetTy = cTy;
              assignedTiles.add(key);
              break;
            }
          }
        }

        // Navigate using A* pathfinding
        const startTx = Math.floor(u.x / TILE_SIZE);
        const startTy = Math.floor(u.y / TILE_SIZE);
        const pathCoords = AStar.findPath(this.gridGraph, { tx: startTx, ty: startTy }, { tx: unitTargetTx, ty: unitTargetTy });

        if (pathCoords.length > 0) {
          u.path = pathCoords.map(c => ({
            x: Math.max(6 * TILE_SIZE + 12, c.tx * TILE_SIZE + 24),
            y: c.ty * TILE_SIZE + 24
          }));
          u.state = 'MOVE_TO';
        } else if (this.gridGraph.isWalkable(unitTargetTx, unitTargetTy) && unitTargetTx >= 6) {
          u.path = [{ x: Math.max(6 * TILE_SIZE + 12, unitTargetTx * TILE_SIZE + 24), y: unitTargetTy * TILE_SIZE + 24 }];
          u.state = 'MOVE_TO';
        } else {
          u.path = [];
          u.state = 'IDLE';
        }
      }
    }
  }

  private update(dt: number): void {
    // Camera viewport panning
    let camDx = 0;
    let camDy = 0;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) camDx -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) camDx += 1;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) camDy -= 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) camDy += 1;

    if (camDx !== 0 || camDy !== 0) {
      const len = Math.hypot(camDx, camDy);
      this.camera.moveBy(
        (camDx / len) * this.camera.panSpeed * dt,
        (camDy / len) * this.camera.panSpeed * dt
      );
    }

    // Update Unit Finite State Machines
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      UnitFSM.updateUnit(
        u,
        dt,
        this.gridGraph,
        this.units,
        this.buildings,
        this.combat,
        this.economy,
        this.tileRenderer,
        this.decorations
      );

      // Remove fallen units and record casualties
      if (u.hp <= 0) {
        if (u.owner === 'sea_peoples') {
          this.objectiveManager.recordEnemyKilled();
        } else if (u.owner === 'player') {
          this.objectiveManager.recordFriendlyLost();
        }
        this.units.splice(i, 1);
      }
    }

    // Physical unit-to-unit separation & tile occupancy enforcement
    // Ensures troops, donkeys, and Sea Peoples never occupy the same tile or overlap
    UnitFSM.resolveUnitCollisions(this.units, this.buildings);

    // Real-time update for inspected ore vein or cedar tree
    if (this.selectedVein) {
      if (this.selectedVein.type === 'timber') {
        const tree = this.decorations.find(
          d => Math.hypot(d.x - (this.selectedVein!.tx + 0.5), d.y - (this.selectedVein!.ty + 0.5)) < 1.0
        );
        if (tree && tree.current > 0) {
          this.selectedVein.current = tree.current;
          this.hud.updateInspector(null, null, this.selectedVein);
        } else {
          this.selectedVein = null;
          this.hud.updateInspector(null, null, null);
        }
      } else {
        const res = this.tileRenderer.getVeinReserve(this.selectedVein.tx, this.selectedVein.ty);
        if (res && res.current > 0) {
          this.selectedVein.current = res.current;
          this.hud.updateInspector(null, null, this.selectedVein);
        } else {
          this.selectedVein = null;
          this.hud.updateInspector(null, null, null);
        }
      }
    }

    // Update buildings (construction progression & destruction)
    for (let i = this.buildings.length - 1; i >= 0; i--) {
      const b = this.buildings[i];
      if (b.hp <= 0) {
        if (b.defId !== 'cyclopean_slab') {
          this.gridGraph.setBuildingOccupied(b.tx, b.ty, b.def.width, b.def.height, false);
        } else {
          this.gridGraph.setFoundation(b.tx, b.ty, b.def.width, b.def.height, false);
        }
        this.buildings.splice(i, 1);
        continue;
      }

      // Progress active construction sites
      if (b.buildProgress < 1.0) {
        const finished = b.updateConstruction(dt);
        if (finished) {
          EventBus.get().emit('audio:build');
          EventBus.get().emit('fx:floating_text', {
            text: `${b.def.name.toUpperCase()} COMPLETE`,
            color: '#4ade80',
            x: b.centerX,
            y: b.centerY - 24
          });

          if (b.owner === 'player' && this.objectiveManager) {
            this.objectiveManager.recordBuildingErected(b.defId);
          }

          if (b.owner === 'player' && b.defId === 'watchtower' && !this.hasWarnedWatchtower) {
            this.hasWarnedWatchtower = true;
            if (b.hasFoundation) {
              EventBus.get().emit('advisor:message', {
                speaker: 'zalpa',
                text: 'The Watchtower is manned upon cyclopean megaliths! We command sight of the western dunes!',
                isAlert: false
              });
            } else {
              EventBus.get().emit('advisor:message', {
                speaker: 'tarkhunta',
                text: 'The Watchtower is finished, but stands on shifting sand! Without megalithic slabs, its defenses are fragile (-50% HP).',
                isAlert: true
              });
            }
          }

          if (b === this.selectedBuilding) {
            this.hud.updateInspector(null, b);
          }
        } else if (b === this.selectedBuilding) {
          this.hud.updateInspector(null, b);
        }
      }
    }

    // Calculate supply headroom (only from fully completed structures)
    let totalCap = 10;
    let used = 0;
    for (const b of this.buildings) {
      if (b.owner === 'player' && b.buildProgress >= 1.0 && b.def.supplyProvided) {
        totalCap += b.def.supplyProvided;
      }
    }
    for (const u of this.units) {
      if (u.owner === 'player') used += u.def.supplyCost;
    }
    this.economy.updateSupply(totalCap, used);
    this.economy.updateStorageCapacity(this.buildings);

    // Update combat encounters and projectiles
    this.combat.update(dt, this.units, this.buildings);

    // Update Sea Peoples AI Tactical Director with dynamic strategic targeting
    this.tacticalDirector.update(dt, this.gridGraph, this.units, 12, 28, this.buildings);

    // Update Campaign Objective Progression & Evaluation
    if (this.objectiveManager) {
      this.objectiveManager.update(
        dt,
        this.buildings,
        this.units,
        this.economy,
        this.tacticalDirector
      );
    }

    // Update combat spark particles
    for (let i = this.combatParticles.length - 1; i >= 0; i--) {
      const p = this.combatParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.combatParticles.splice(i, 1);
      }
    }

    // Update fallen warrior corpse decals
    for (let i = this.fallenWarriors.length - 1; i >= 0; i--) {
      const f = this.fallenWarriors[i];
      f.life -= dt;
      if (f.life <= 0) {
        this.fallenWarriors.splice(i, 1);
      }
    }

    // Update floating text visual FX
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= 22 * dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Contextual narrative check: first tin harvested by caravans
    if (!this.hasHarvestedFirstTin && this.economy.resources.tin > 120) {
      this.hasHarvestedFirstTin = true;
      EventBus.get().emit('advisor:message', {
        speaker: 'tarkhunta',
        text: 'The caravans return with cassiterite! Stoke the foundry flames—true bronze is at hand!',
        isAlert: false
      });
    }

    // Update live HUD countdown timer for enemy waves
    this.hud.updateWaveTimer(this.tacticalDirector.getNextWaveCountdown());

    // Update Fog of War
    this.updateFogOfWar();
  }

  private updateFogOfWar(): void {
    if (!this.fogRenderer) return;
    this.fogRenderer.resetVisibility();
    for (const u of this.units) {
      if (u.owner === 'player') {
        const tx = Math.floor(u.x / TILE_SIZE);
        const ty = Math.floor(u.y / TILE_SIZE);
        this.fogRenderer.revealRadius(tx, ty, 6);
      }
    }
    for (const b of this.buildings) {
      if (b.owner === 'player') {
        const radius = b.def.radarRange || 5;
        this.fogRenderer.revealRadius(b.tx + b.def.width / 2, b.ty + b.def.height / 2, radius);
      }
    }
  }

  private render(): void {
    // Ensure visibility is up-to-date even when game is paused
    this.updateFogOfWar();

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    this.camera.applyTransform(ctx);

    // 1. Terrain Layer & Cyclopean Foundation Slabs (World Coordinates)
    this.tileRenderer.render(ctx, this.camera, this.gridGraph);

    // 1b. Fallen Warriors battlefield decals
    for (const f of this.fallenWarriors) {
      const alpha = Math.max(0, Math.min(1, f.life / 3.0));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      // Ground dust / blood mark
      ctx.fillStyle = f.owner === 'player' ? 'rgba(153, 27, 27, 0.45)' : 'rgba(30, 41, 59, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Fallen bronze shield and weapon on ground
      ctx.fillStyle = '#b45309';
      ctx.beginPath(); ctx.arc(-3, 1, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, -2, 9, 2);
      ctx.restore();
    }

    // 1c. Sea Peoples Landing War Galleys (anchored at western water/surf edge)
    const shipAnim = Date.now() / 320;
    for (const ship of this.tacticalDirector.landingShips) {
      SVGAProceduralBank.drawSeaPeoplesShip(
        ctx,
        ship.tx * TILE_SIZE + 24,
        ship.ty * TILE_SIZE + 24,
        shipAnim + ship.waveNum * 2
      );
    }

    // 2. Layer Buildings, Units & Mediterranean Cedars with Y-Sorting for 2.5D depth
    const renderList: Array<{ type: 'b' | 'u' | 'd'; y: number; item: any }> = [];
    for (const b of this.buildings) {
      renderList.push({ type: 'b', y: (b.ty + b.def.height) * TILE_SIZE, item: b });
    }
    for (const u of this.units) {
      renderList.push({ type: 'u', y: u.y, item: u });
    }
    for (const d of this.decorations) {
      renderList.push({ type: 'd', y: d.y * TILE_SIZE, item: d });
    }
    renderList.sort((a, b) => a.y - b.y);

    for (const ent of renderList) {
      if (ent.type === 'b') {
        this.renderBuilding(ctx, ent.item as BuildingEntity);
      } else if (ent.type === 'u') {
        this.renderUnit(ctx, ent.item as UnitEntity);
      } else {
        const d = ent.item as { x: number; y: number; type: string; current: number; max: number };
        const tx = Math.floor(d.x);
        const ty = Math.floor(d.y);
        if (this.fogRenderer.getFog(tx, ty) === 0) continue;
        if (d.type === 'cedar') {
          const wx = Math.round(d.x * TILE_SIZE - 40);
          const wy = Math.round(d.y * TILE_SIZE - 74);
          ctx.drawImage(this.tileRenderer.cedarTreeCanvas, wx, wy);
          if (d.current < d.max && d.current > 0) {
            // Mini timber reserve bar
            const barW = 30;
            const barH = 4;
            const bx = Math.round(d.x * TILE_SIZE - 15);
            const by = Math.round(d.y * TILE_SIZE + 4);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
            const fillW = Math.max(1, Math.floor((d.current / d.max) * barW));
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(bx, by, fillW, barH);
          }
        } else if (d.type === 'stump') {
          const stumpWx = Math.round(d.x * TILE_SIZE - 32);
          const stumpWy = Math.round(d.y * TILE_SIZE - 36);
          ctx.drawImage(this.tileRenderer.cedarStumpCanvas, stumpWx, stumpWy);
        }
      }
    }

    // 3. In-flight combat projectiles (Parabolic ballistic arcs with shadow & rotation)
    for (const p of this.combat.projectiles) {
      let targetX = p.x;
      let targetY = p.y;
      if (p.targetIsBuilding) {
        const tb = this.buildings.find(b => b.id === p.targetId);
        if (tb) { targetX = tb.centerX; targetY = tb.centerY; }
      } else {
        const tu = this.units.find(u => u.id === p.targetId);
        if (tu) { targetX = tu.x; targetY = tu.y; }
      }
      const baseAngle = Math.atan2(targetY - p.y, targetX - p.x);

      // 3D Parabolic Ballistic Arc (Elevation above terrain)
      const progress = Math.min(1.0, (p.traveled || 0) / (p.totalDist || 180));
      const arcH = Math.sin(progress * Math.PI) * Math.min(50, (p.totalDist || 180) * 0.28);
      const renderY = p.y - arcH;

      // Ground shadow tracking beneath the projectile
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 4, 3, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(p.x, renderY);
      // Pitch angle based on arc slope: noses down as it plunges
      const pitch = (progress - 0.5) * 0.6;
      ctx.rotate(baseAngle + pitch);

      if (p.kind === 'sling_stone') {
        // High-velocity river pebble with dust vapor trail
        ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.beginPath();
        ctx.arc(-6, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(0.5, -0.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ballistic arrow with wooden shaft, bronze head & white feathers
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();

        // White feather fletching
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(-8, -2.5);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-8, 2.5);
        ctx.closePath();
        ctx.fill();

        // Gleaming bronze arrowhead
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(4, -2.5);
        ctx.lineTo(4, 2.5);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    // 3b. Combat hit sparks & battle particles
    for (const cp of this.combatParticles) {
      const alpha = Math.max(0, Math.min(1, cp.life / cp.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = cp.color;
      ctx.fillRect(cp.x - cp.size / 2, cp.y - cp.size / 2, cp.size, cp.size);
      ctx.restore();
    }

    // 4. Fog of War
    this.fogRenderer.render(ctx, this.camera);

    // 5. Structure placement preview (Ghost blueprint)
    if (this.buildingToPlace) {
      const bDef = BUILDINGS[this.buildingToPlace];
      const mouseWorld = this.camera.screenToWorld(this.dragCurrent.x, this.dragCurrent.y);
      const ghostTx = Math.floor(mouseWorld.x / TILE_SIZE);
      const ghostTy = Math.floor(mouseWorld.y / TILE_SIZE);
      const gw = bDef.width * TILE_SIZE;
      const gh = bDef.height * TILE_SIZE;

      const canPlace = this.canPlaceBuilding(this.buildingToPlace, ghostTx, ghostTy);
      const hasFullFoundation = this.gridGraph.hasFoundationArea(ghostTx, ghostTy, bDef.width, bDef.height);
      const isSlab = this.buildingToPlace === 'cyclopean_slab';

      // 5a. Tile-by-tile grid cell overlay
      for (let dy = 0; dy < bDef.height; dy++) {
        for (let dx = 0; dx < bDef.width; dx++) {
          const cx = (ghostTx + dx) * TILE_SIZE;
          const cy = (ghostTy + dy) * TILE_SIZE;
          const curTile = this.tileRenderer.getTile(ghostTx + dx, ghostTy + dy);
          const hasSlab = this.gridGraph.hasFoundation(ghostTx + dx, ghostTy + dy);
          const isOcc = this.gridGraph.isBuildingOccupied(ghostTx + dx, ghostTy + dy);

          let cellColor = 'rgba(239, 68, 68, 0.35)'; // Red
          let cellBorder = '#ef4444';

          if (isSlab) {
            if (curTile !== 'water' && curTile !== 'cliff' && !curTile.startsWith('vein_') && !hasSlab && !isOcc) {
              cellColor = 'rgba(56, 189, 248, 0.35)';
              cellBorder = '#38bdf8';
            }
          } else {
            if (curTile !== 'water' && curTile !== 'cliff' && !curTile.startsWith('vein_') && !isOcc) {
              if (hasSlab) {
                cellColor = 'rgba(34, 197, 94, 0.4)'; // Green (Cyclopean foundation)
                cellBorder = '#22c55e';
              } else {
                cellColor = 'rgba(245, 158, 11, 0.35)'; // Amber (Unstable bare ground)
                cellBorder = '#f59e0b';
              }
            }
          }

          ctx.fillStyle = cellColor;
          ctx.fillRect(cx + 1, cy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          ctx.strokeStyle = cellBorder;
          ctx.lineWidth = 1;
          ctx.strokeRect(cx + 1, cy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
      }

      // 5b. Ghost building sprite
      ctx.save();
      ctx.globalAlpha = canPlace ? 0.75 : 0.45;
      const ghostSprite = SVGAProceduralBank.getBuildingSprite(this.buildingToPlace, 'player');
      if (ghostSprite) {
        ctx.drawImage(ghostSprite, ghostTx * TILE_SIZE, ghostTy * TILE_SIZE, gw, gh);
      }
      ctx.strokeStyle = canPlace ? (hasFullFoundation || isSlab ? '#2de0a5' : '#f59e0b') : '#ff4d4d';
      ctx.lineWidth = 2;
      ctx.strokeRect(ghostTx * TILE_SIZE, ghostTy * TILE_SIZE, gw, gh);
      ctx.restore();

      // 5c. Floating status badge above ghost building
      ctx.save();
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      const badgeY = ghostTy * TILE_SIZE - 12;
      let badgeText = '';
      let badgeBg = '#1c1917';
      let badgeBorder = '#ef4444';
      let badgeTextColor = '#f87171';

      if (!canPlace) {
        badgeText = '✗ BLOCKED TERRAIN';
      } else if (isSlab) {
        badgeText = '+ MEGALITHIC SLAB';
        badgeBorder = '#38bdf8';
        badgeTextColor = '#7dd3fc';
      } else if (hasFullFoundation) {
        badgeText = '✓ CYCLOPEAN SLAB (100% HP)';
        badgeBorder = '#22c55e';
        badgeTextColor = '#4ade80';
      } else if (bDef.requiresFoundation) {
        badgeText = '⚠ BARE GROUND (-50% HP)';
        badgeBorder = '#f59e0b';
        badgeTextColor = '#fbbf24';
      } else {
        badgeText = '✓ READY TO ERECT';
        badgeBorder = '#22c55e';
        badgeTextColor = '#4ade80';
      }

      const textW = ctx.measureText(badgeText).width;
      ctx.fillStyle = badgeBg;
      ctx.fillRect(ghostTx * TILE_SIZE + gw / 2 - textW / 2 - 6, badgeY - 11, textW + 12, 16);
      ctx.strokeStyle = badgeBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(ghostTx * TILE_SIZE + gw / 2 - textW / 2 - 6, badgeY - 11, textW + 12, 16);
      ctx.fillStyle = badgeTextColor;
      ctx.fillText(badgeText, ghostTx * TILE_SIZE + gw / 2, badgeY + 1);
      ctx.restore();
    }

    // 6. Floating text visual FX (World coordinates)
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, Math.min(1, ft.life / 0.4));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '900 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f0b08';
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore(); // Restore world transform

    // 6. Box selection dragging rectangle (Screen space)
    if (this.isDraggingBox) {
      ctx.strokeStyle = '#2de0a5';
      ctx.lineWidth = 1;
      const x = Math.min(this.dragStart.x, this.dragCurrent.x);
      const y = Math.min(this.dragStart.y, this.dragCurrent.y);
      const w = Math.abs(this.dragStart.x - this.dragCurrent.x);
      const h = Math.abs(this.dragStart.y - this.dragCurrent.y);
      ctx.strokeRect(x, y, w, h);
    }

    // 7. Tactical Minimap HUD
    this.hud.renderMinimap(
      this.camera,
      this.units,
      this.buildings,
      this.tileRenderer.width,
      this.tileRenderer.height
    );
  }

  private renderBuilding(ctx: CanvasRenderingContext2D, b: BuildingEntity): void {
    const drawX = b.tx * TILE_SIZE;
    const drawY = b.ty * TILE_SIZE;
    const bw = b.def.width * TILE_SIZE;
    const bh = b.def.height * TILE_SIZE;

    // Cyclopean slabs are rendered natively on the ground terrain layer
    if (b.defId === 'cyclopean_slab') {
      if (b.isSelected) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, bw, bh);
      }
      return;
    }

    // 1. Megalithic Foundation Plinth (Dune II Style Anchor)
    if (b.hasFoundation) {
      ctx.fillStyle = '#3a342c';
      ctx.fillRect(drawX - 2, drawY + bh - 4, bw + 4, 6);
      ctx.strokeStyle = '#6b5c4b';
      ctx.lineWidth = 1;
      ctx.strokeRect(drawX - 2, drawY + bh - 4, bw + 4, 6);
      // Bronze cramps / anchor pins
      ctx.fillStyle = '#b45309';
      ctx.fillRect(drawX + 6, drawY + bh - 3, 4, 4);
      ctx.fillRect(drawX + bw - 10, drawY + bh - 3, 4, 4);
    } else if (b.def.requiresFoundation) {
      // Unstable bare ground: sand drifts encroaching on base
      ctx.fillStyle = 'rgba(201, 162, 99, 0.65)';
      ctx.beginPath();
      ctx.moveTo(drawX - 2, drawY + bh);
      ctx.lineTo(drawX + 10, drawY + bh - 5);
      ctx.lineTo(drawX + 16, drawY + bh);
      ctx.fill();
    }

    // 2. Active Construction Site vs Completed Structure
    if (b.buildProgress < 1.0) {
      // Construction foundation floor
      ctx.fillStyle = '#33271e';
      ctx.fillRect(drawX, drawY, bw, bh);

      // Progressive vertical reveal of the building sprite
      const visibleH = Math.max(4, Math.floor(bh * b.buildProgress));
      ctx.save();
      ctx.beginPath();
      ctx.rect(drawX, drawY + bh - visibleH, bw, visibleH);
      ctx.clip();
      const sprite = SVGAProceduralBank.getBuildingSprite(b.defId, b.owner);
      if (sprite) {
        ctx.drawImage(sprite, drawX, drawY, bw, bh);
      }
      ctx.restore();

      // Bronze Age Cedar Scaffolding Lattice
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      // Vertical scaffold poles
      for (let px = 8; px < bw; px += 24) {
        ctx.beginPath();
        ctx.moveTo(drawX + px, drawY - 4);
        ctx.lineTo(drawX + px, drawY + bh);
        ctx.stroke();
      }
      // Horizontal planks
      for (let py = 12; py < bh; py += 18) {
        ctx.beginPath();
        ctx.moveTo(drawX - 2, drawY + py);
        ctx.lineTo(drawX + bw + 2, drawY + py);
        ctx.stroke();
      }
      // Diagonal X-bracing across bays
      ctx.strokeStyle = 'rgba(146, 64, 14, 0.6)';
      ctx.lineWidth = 1;
      for (let px = 8; px + 24 <= bw; px += 24) {
        ctx.beginPath();
        ctx.moveTo(drawX + px, drawY + 8);
        ctx.lineTo(drawX + px + 24, drawY + bh - 4);
        ctx.moveTo(drawX + px + 24, drawY + 8);
        ctx.lineTo(drawX + px, drawY + bh - 4);
        ctx.stroke();
      }

      // Flying sparks / stone chips at working line
      const workY = drawY + bh - visibleH;
      ctx.fillStyle = '#fef08a';
      for (let s = 0; s < 3; s++) {
        ctx.fillRect(drawX + Math.random() * bw, workY - Math.random() * 6, 2, 2);
      }

      // Construction Progress Bar
      const barW = Math.min(bw, 48);
      const barX = drawX + (bw - barW) / 2;
      const barY = drawY - 14;

      ctx.fillStyle = '#110d08';
      ctx.fillRect(barX, barY, barW, 6);
      ctx.strokeStyle = '#594a3b';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, 6);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(barX + 1, barY + 1, Math.max(0, (barW - 2) * b.buildProgress), 4);

      // Percentage label
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(b.buildProgress * 100)}%`, drawX + bw / 2, barY - 2);
    } else {
      // Completed Structure
      const sprite = SVGAProceduralBank.getBuildingSprite(b.defId, b.owner);
      if (sprite) {
        ctx.drawImage(sprite, drawX, drawY, bw, bh);
      } else {
        ctx.fillStyle = b.owner === 'player' ? '#8a6234' : '#692d2d';
        ctx.fillRect(drawX, drawY, bw, bh);
      }

      // Dynamic waving cloth banner (Acropolis / Barracks)
      if (b.defId === 'acropolis' || b.defId === 'barracks') {
        const wave = Math.sin(Date.now() / 200 + b.id) * 2.5;
        ctx.fillStyle = b.owner === 'player' ? '#dc2626' : '#2563eb';
        ctx.fillRect(drawX + 12, drawY + 6, 3, 24);
        ctx.beginPath();
        ctx.moveTo(drawX + 15, drawY + 7);
        ctx.lineTo(drawX + 30, drawY + 10 + wave);
        ctx.lineTo(drawX + 15, drawY + 17);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Selection border and HP bar
    if (b.isSelected) {
      ctx.strokeStyle = b.owner === 'player' ? '#4ade80' : '#f87171';
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX, drawY, bw, bh);
    }

    if (b.isSelected || b.hp < b.maxHp) {
      const hpPct = Math.max(0, b.hp / b.maxHp);
      ctx.fillStyle = '#1c0909';
      ctx.fillRect(drawX, drawY - 7, bw, 5);
      ctx.strokeStyle = '#594a3b';
      ctx.strokeRect(drawX, drawY - 7, bw, 5);
      ctx.fillStyle = hpPct > 0.5 ? '#2b9348' : (hpPct > 0.25 ? '#eab308' : '#ef4444');
      ctx.fillRect(drawX + 1, drawY - 6, Math.max(0, (bw - 2) * hpPct), 3);
    }
  }

  private renderUnit(ctx: CanvasRenderingContext2D, u: UnitEntity): void {
    const drawX = Math.round(u.x);
    const drawY = Math.round(u.y);

    // Selection ring (original prototype green/red ellipse)
    if (u.isSelected) {
      ctx.strokeStyle = u.owner === 'player' ? '#4ade80' : '#f87171';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(drawX, drawY + 12, 16, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Dynamic animated unit with walking bob, thrusting attack, and cargo level
    SVGAProceduralBank.drawAnimatedUnit(ctx, u, drawX, drawY);

    // HP bar if wounded or selected
    const hasHpBar = u.isSelected || u.hp < u.maxHp;
    if (hasHpBar) {
      const hpPct = Math.max(0, u.hp / u.maxHp);
      ctx.fillStyle = '#1c0909';
      ctx.fillRect(drawX - 12, drawY - 16, 24, 4);
      ctx.strokeStyle = '#594a3b';
      ctx.strokeRect(drawX - 12, drawY - 16, 24, 4);
      ctx.fillStyle = hpPct > 0.5 ? '#2b9348' : (hpPct > 0.25 ? '#eab308' : '#ef4444');
      ctx.fillRect(drawX - 11, drawY - 15, Math.max(0, 22 * hpPct), 2);
    }

    // Cargo progress bar & status indicator for worker/donkey caravan
    if (u.def.category === 'worker' && (u.currentCargoAmount > 0 || u.state === 'HARVESTING' || u.isSelected || u.state === 'WAITING_STORAGE')) {
      const maxCargo = u.def.cargoCapacity || 120;
      const cargoPct = Math.min(1.0, u.currentCargoAmount / maxCargo);
      const barY = drawY - (hasHpBar ? 23 : 16);

      ctx.fillStyle = '#110d08';
      ctx.fillRect(drawX - 14, barY, 28, 4);
      ctx.strokeStyle = '#604c38';
      ctx.lineWidth = 1;
      ctx.strokeRect(drawX - 14, barY, 28, 4);

      const oreColor = u.currentCargoType === 'tin' ? '#7dd3fc' :
                       (u.currentCargoType === 'copper' ? '#2de0a5' :
                       (u.currentCargoType === 'stone' ? '#e2e8f0' :
                       (u.currentCargoType === 'timber' ? '#f59e0b' : '#cbd5e1')));
      ctx.fillStyle = oreColor;
      ctx.fillRect(drawX - 13, barY + 1, Math.max(0, 26 * cargoPct), 2);

      // Flashing golden mining pulse dot
      if (u.state === 'HARVESTING') {
        const pulse = Math.sin(Date.now() / 100) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(253, 224, 71, ${0.4 + pulse * 0.6})`;
        ctx.beginPath();
        ctx.arc(drawX + 17, barY + 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Red flashing FULL indicator when depot cannot accept more cargo
      if (u.state === 'WAITING_STORAGE') {
        const pulse = Math.sin(Date.now() / 150) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(239, 68, 68, ${0.6 + pulse * 0.4})`;
        ctx.font = 'bold 8px monospace';
        ctx.fillText('FULL', drawX - 9, barY - 2);
      }
    }
  }

  private gameLoop(timestamp: number): void {
    if (!this.lastTime) this.lastTime = timestamp;
    const rawDt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (!this.isGamePaused) {
      const dt = rawDt * this.gameSpeedMultiplier;
      this.update(dt);
    }
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new GameApp();
  app.init().catch(console.error);
});
