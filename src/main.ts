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
  private decorations: Array<{ x: number; y: number; type: string }> = [];
  private floatingTexts: Array<{
    id: number;
    text: string;
    color: string;
    x: number;
    y: number;
    life: number;
    maxLife: number;
  }> = [];

  private selectedUnits: UnitEntity[] = [];
  private selectedBuilding: BuildingEntity | null = null;
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
    this.spawnBuilding('cyclopean_slab', 'player', pStart.tx - 1, pStart.ty - 1);
    this.spawnBuilding('cyclopean_slab', 'player', pStart.tx + 1, pStart.ty - 1);
    this.spawnBuilding('acropolis', 'player', pStart.tx, pStart.ty);
    this.spawnBuilding('bronze_foundry', 'player', pStart.tx + 5, pStart.ty);

    // Spawn starting units
    this.spawnUnit('donkey_caravan', 'player', (pStart.tx + 2) * TILE_SIZE, (pStart.ty + 5) * TILE_SIZE);
    this.spawnUnit('spear_militia', 'player', (pStart.tx - 2) * TILE_SIZE, (pStart.ty + 3) * TILE_SIZE);
    this.spawnUnit('spear_militia', 'player', (pStart.tx - 2) * TILE_SIZE, (pStart.ty + 5) * TILE_SIZE);
    this.spawnUnit('skirmisher', 'player', (pStart.tx - 4) * TILE_SIZE, (pStart.ty + 4) * TILE_SIZE);

    this.camera.centerOn(pStart.tx * TILE_SIZE, pStart.ty * TILE_SIZE);
    this.resizeCanvas();
    this.updateFogOfWar();

    this.hud = new HUDController();
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

    // Copper resource nodes east of the base
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        this.tileRenderer.setTile(22 + dx, 26 + dy, 'vein_copper');
        this.gridGraph.setTileCost(22 + dx, 26 + dy, 0);
      }
    }

    // Rare Tin (Cassiterite) nodes northeast of the settlement
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        this.tileRenderer.setTile(20 + dx, 14 + dy, 'vein_tin');
        this.gridGraph.setTileCost(20 + dx, 14 + dy, 0);
      }
    }

    // Scatter Mediterranean Cedar Trees across the landscape
    this.decorations = [];
    for (let i = 0; i < 55; i++) {
      const tx = Math.floor((Math.sin(i * 13.7) * 0.5 + 0.5) * (w - 6)) + 8;
      const ty = Math.floor((Math.cos(i * 19.3) * 0.5 + 0.5) * (h - 6)) + 3;
      const distPlayer = Math.hypot(tx - 12, ty - 28);
      if (this.tileRenderer.getTile(tx, ty) === 'plain' && distPlayer > 6) {
        this.decorations.push({ x: tx + 0.5, y: ty + 0.5, type: 'cedar' });
      }
    }
  }

  private spawnBuilding(defId: string, owner: any, tx: number, ty: number): BuildingEntity {
    const hasFoundation = this.gridGraph.hasFoundation(tx, ty);
    const b = new BuildingEntity(this.nextEntityId++, defId, owner, tx, ty, hasFoundation);
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

    if (owner === 'player' && this.objectiveManager) {
      this.objectiveManager.recordBuildingErected(defId);
    }

    if (owner === 'player' && defId === 'watchtower' && !this.hasWarnedWatchtower) {
      this.hasWarnedWatchtower = true;
      EventBus.get().emit('advisor:message', {
        speaker: 'zalpa',
        text: 'The Watchtower is manned! We now command sight of the western dunes and coastline.',
        isAlert: false
      });
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
      EventBus.get().emit('advisor:message', {
        speaker: 'burna_khabir',
        text: 'Insufficient resources to train this unit!',
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
    const pStart = { tx: 14, ty: 33 };
    this.spawnUnit(unitDefId, 'player', pStart.tx * TILE_SIZE, pStart.ty * TILE_SIZE);
    EventBus.get().emit('audio:command');
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

          if (this.economy.canAfford(bDef.cost)) {
            this.economy.spend(bDef.cost);
            this.spawnBuilding(this.buildingToPlace, 'player', tx, ty);
            this.buildingToPlace = null;
          } else {
            EventBus.get().emit('advisor:message', {
              speaker: 'burna_khabir',
              text: 'Insufficient resources to erect this structure!',
              isAlert: true
            });
          }
          return;
        }

        this.isDraggingBox = true;
        this.dragStart = { x: sx, y: sy };
        this.dragCurrent = { x: sx, y: sy };
      } else if (e.button === 2) {
        // Right click: issue contextual command
        e.preventDefault();
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

    if (isClick) {
      // Single click: select unit or building
      const clickedUnit = this.units.find(u => Math.hypot(u.x - p1.x, u.y - p1.y) < 24);
      if (clickedUnit) {
        clickedUnit.isSelected = true;
        this.selectedUnits = [clickedUnit];
        EventBus.get().emit('audio:select');
      } else {
        const tx = Math.floor(p1.x / TILE_SIZE);
        const ty = Math.floor(p1.y / TILE_SIZE);
        const clickedB = this.buildings.find(
          b => tx >= b.tx && tx < b.tx + b.def.width && ty >= b.ty && ty < b.ty + b.def.height
        );
        if (clickedB) {
          clickedB.isSelected = true;
          this.selectedBuilding = clickedB;
          EventBus.get().emit('audio:select');
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
      this.selectedBuilding
    );
  }

  private issueContextCommand(wx: number, wy: number): void {
    if (this.selectedUnits.length === 0) return;

    EventBus.get().emit('audio:command');

    const targetTx = Math.floor(wx / TILE_SIZE);
    const targetTy = Math.floor(wy / TILE_SIZE);

    // Check if clicking on an enemy entity
    const targetEnemyUnit = this.units.find(
      u => u.owner !== 'player' && Math.hypot(u.x - wx, u.y - wy) < 24
    );

    // Check if clicking on a resource node vein
    const tileType = this.tileRenderer.getTile(targetTx, targetTy);
    const isResourceNode = tileType === 'vein_copper' || tileType === 'vein_tin' || tileType === 'vein_iron';

    for (const u of this.selectedUnits) {
      if (targetEnemyUnit) {
        u.targetMineCoord = null;
        u.targetEntityId = targetEnemyUnit.id;
        u.state = 'ATTACK_TARGET';
      } else if (isResourceNode && u.def.category === 'worker') {
        // Caravan dispatched to harvest ore with automated lifecycle
        u.targetMineCoord = { tx: targetTx, ty: targetTy };
        u.targetPosition = { x: targetTx * TILE_SIZE + 24, y: targetTy * TILE_SIZE + 24 };
        u.currentCargoType = tileType.replace('vein_', '');

        const startTx = Math.floor(u.x / TILE_SIZE);
        const startTy = Math.floor(u.y / TILE_SIZE);
        const pathCoords = AStar.findPath(this.gridGraph, { tx: startTx, ty: startTy }, { tx: targetTx, ty: targetTy });
        if (pathCoords.length > 0) {
          u.path = pathCoords.map(c => ({
            x: c.tx * TILE_SIZE + 24,
            y: c.ty * TILE_SIZE + 24
          }));
        } else {
          u.path = [{ x: targetTx * TILE_SIZE + 24, y: targetTy * TILE_SIZE + 24 }];
        }
        u.state = 'HARVEST_SEEK';
      } else {
        // Clear automated mining target if player orders a manual move
        u.targetMineCoord = null;
        u.targetEntityId = null;

        // Navigate using A* pathfinding
        const startTx = Math.floor(u.x / TILE_SIZE);
        const startTy = Math.floor(u.y / TILE_SIZE);
        const pathCoords = AStar.findPath(this.gridGraph, { tx: startTx, ty: startTy }, { tx: targetTx, ty: targetTy });

        if (pathCoords.length > 0) {
          u.path = pathCoords.map(c => ({
            x: c.tx * TILE_SIZE + 24,
            y: c.ty * TILE_SIZE + 24
          }));
          u.state = 'MOVE_TO';
        } else {
          u.path = [{ x: wx, y: wy }];
          u.state = 'MOVE_TO';
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
        this.economy
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

    // Update buildings
    for (let i = this.buildings.length - 1; i >= 0; i--) {
      const b = this.buildings[i];
      if (b.hp <= 0) {
        this.gridGraph.setBuildingOccupied(b.tx, b.ty, b.def.width, b.def.height, false);
        this.buildings.splice(i, 1);
      }
    }

    // Calculate supply headroom
    let totalCap = 10;
    let used = 0;
    for (const b of this.buildings) {
      if (b.owner === 'player' && b.def.supplyProvided) totalCap += b.def.supplyProvided;
    }
    for (const u of this.units) {
      if (u.owner === 'player') used += u.def.supplyCost;
    }
    this.economy.updateSupply(totalCap, used);

    // Update combat encounters and projectiles
    this.combat.update(dt, this.units, this.buildings);

    // Update Sea Peoples AI Tactical Director
    this.tacticalDirector.update(dt, this.gridGraph, this.units, 12, 28);

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
        const d = ent.item as { x: number; y: number; type: string };
        const tx = Math.floor(d.x);
        const ty = Math.floor(d.y);
        if (this.fogRenderer.getFog(tx, ty) === 0) continue;
        const wx = Math.round(d.x * TILE_SIZE - 24);
        const wy = Math.round(d.y * TILE_SIZE - 52);
        ctx.drawImage(this.tileRenderer.cedarTreeCanvas, wx, wy);
      }
    }

    // 3. In-flight combat projectiles
    ctx.fillStyle = '#ffdf73';
    for (const p of this.combat.projectiles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
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

      let canPlace = true;
      for (let dy = 0; dy < bDef.height; dy++) {
        for (let dx = 0; dx < bDef.width; dx++) {
          if (!this.gridGraph.isWalkable(ghostTx + dx, ghostTy + dy) && this.buildingToPlace !== 'cyclopean_slab') {
            canPlace = false;
          }
        }
      }

      ctx.save();
      ctx.globalAlpha = 0.65;
      const ghostSprite = SVGAProceduralBank.getBuildingSprite(this.buildingToPlace, 'player');
      if (ghostSprite) {
        ctx.drawImage(ghostSprite, ghostTx * TILE_SIZE, ghostTy * TILE_SIZE, gw, gh);
      }
      ctx.strokeStyle = canPlace ? '#2de0a5' : '#ff4d4d';
      ctx.lineWidth = 2;
      ctx.strokeRect(ghostTx * TILE_SIZE, ghostTy * TILE_SIZE, gw, gh);
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

    const sprite = SVGAProceduralBank.getBuildingSprite(b.defId, b.owner);
    if (sprite) {
      ctx.drawImage(sprite, drawX, drawY, bw, bh);
    } else {
      ctx.fillStyle = b.owner === 'player' ? '#8a6234' : '#692d2d';
      ctx.fillRect(drawX, drawY, bw, bh);
    }

    // Dynamic waving cloth banner (from original prototype)
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

    // Selection border and HP bar (original prototype style)
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
    if (u.def.category === 'worker' && (u.currentCargoAmount > 0 || u.state === 'HARVESTING' || u.isSelected)) {
      const maxCargo = u.def.cargoCapacity || 120;
      const cargoPct = Math.min(1.0, u.currentCargoAmount / maxCargo);
      const barY = drawY - (hasHpBar ? 23 : 16);

      ctx.fillStyle = '#110d08';
      ctx.fillRect(drawX - 14, barY, 28, 4);
      ctx.strokeStyle = '#604c38';
      ctx.lineWidth = 1;
      ctx.strokeRect(drawX - 14, barY, 28, 4);

      const oreColor = u.currentCargoType === 'tin' ? '#7dd3fc' : (u.currentCargoType === 'copper' ? '#fbbf24' : '#cbd5e1');
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
