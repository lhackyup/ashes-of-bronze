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

  private units: UnitEntity[] = [];
  private buildings: BuildingEntity[] = [];

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

    // Inizializza generatori procedurali SVGA
    SVGAProceduralBank.init();

    // Carica lo Scenario 1
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

    // Configura la mappa in base al bioma (costa levantina con mare a sinistra, sabbia, nodi di rame e stagno)
    this.setupLevantineMap(mapW, mapH);

    // Posiziona il Megaron iniziale e la Caserma
    const pStart = scenario.player.startPosition;
    this.spawnBuilding('cyclopean_slab', 'player', pStart.tx - 1, pStart.ty - 1);
    this.spawnBuilding('cyclopean_slab', 'player', pStart.tx + 1, pStart.ty - 1);
    this.spawnBuilding('acropolis', 'player', pStart.tx, pStart.ty);
    this.spawnBuilding('bronze_foundry', 'player', pStart.tx + 5, pStart.ty);

    // Spawna le unità iniziali
    this.spawnUnit('donkey_caravan', 'player', (pStart.tx + 2) * TILE_SIZE, (pStart.ty + 5) * TILE_SIZE);
    this.spawnUnit('spear_militia', 'player', (pStart.tx - 2) * TILE_SIZE, (pStart.ty + 3) * TILE_SIZE);
    this.spawnUnit('spear_militia', 'player', (pStart.tx - 2) * TILE_SIZE, (pStart.ty + 5) * TILE_SIZE);
    this.spawnUnit('skirmisher', 'player', (pStart.tx - 4) * TILE_SIZE, (pStart.ty + 4) * TILE_SIZE);

    this.camera.centerOn(pStart.tx * TILE_SIZE, pStart.ty * TILE_SIZE);

    this.hud = new HUDController();
    this.hud.onSelectBuildItem = (defId: string) => {
      this.buildingToPlace = defId;
    };
    this.hud.onTrainUnit = (unitDefId: string) => {
      this.trainUnit(unitDefId);
    };

    this.setupInputHandlers();

    // Invia messaggio iniziale di Burna-Khabir
    EventBus.get().emit('advisor:message', {
      speaker: 'burna_khabir',
      text: scenario.narrative.dialogues[0].message,
      isAlert: false
    });

    // Avvia loop
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
        // Fascia marina occidentale (mare dei Popoli del Mare)
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

    // Nodi di Rame a est della base
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        this.tileRenderer.setTile(22 + dx, 26 + dy, 'vein_copper');
        this.gridGraph.setTileCost(22 + dx, 26 + dy, 0);
      }
    }

    // Nodi rari di Stagno (Cassiterite) a nord-est
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        this.tileRenderer.setTile(20 + dx, 14 + dy, 'vein_tin');
        this.gridGraph.setTileCost(20 + dx, 14 + dy, 0);
      }
    }
  }

  private spawnBuilding(defId: string, owner: any, tx: number, ty: number): BuildingEntity {
    const hasFoundation = this.gridGraph.hasFoundation(tx, ty);
    const b = new BuildingEntity(this.nextEntityId++, defId, owner, tx, ty, hasFoundation);
    this.buildings.push(b);

    if (defId === 'cyclopean_slab') {
      this.gridGraph.setFoundation(tx, ty, b.def.width, b.def.height, true);
    } else {
      this.gridGraph.setBuildingOccupied(tx, ty, b.def.width, b.def.height, true);
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
        text: 'Risorse insufficienti per reclutare questa unità!',
        isAlert: true
      });
      return;
    }

    if (!this.economy.hasAvailableSupply(def.supplyCost)) {
      EventBus.get().emit('advisor:message', {
        speaker: 'burna_khabir',
        text: 'Raggiunto il limite massimo di sussistenza! Costruite altri granai.',
        isAlert: true
      });
      return;
    }

    this.economy.spend(def.cost);
    const pStart = { tx: 14, ty: 33 };
    this.spawnUnit(unitDefId, 'player', pStart.tx * TILE_SIZE, pStart.ty * TILE_SIZE);
    EventBus.get().emit('audio:command');
  }

  private setupInputHandlers(): void {
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.code);
      if (e.code === 'KeyM') {
        const muted = this.audio.toggleMute();
        console.log('Audio muted:', muted);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      // Inizia riproduzione BGM al primo gesto
      this.audio.startBGM();

      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const worldPos = this.camera.screenToWorld(sx, sy);

      if (e.button === 0) {
        // Tasto sinistro
        if (this.buildingToPlace) {
          // Posiziona edificio
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
              text: 'Risorse insufficienti per erigere questa struttura!',
              isAlert: true
            });
          }
          return;
        }

        this.isDraggingBox = true;
        this.dragStart = { x: sx, y: sy };
        this.dragCurrent = { x: sx, y: sy };
      } else if (e.button === 2) {
        // Tasto destro: impartisci ordine contestuale
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
      // Clic singolo: trova unità o edificio
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
      // Selezione a rettangolo
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

    // Controlla se clicchiamo su un nemico
    const targetEnemyUnit = this.units.find(
      u => u.owner !== 'player' && Math.hypot(u.x - wx, u.y - wy) < 24
    );

    // Controlla se clicchiamo su un nodo risorsa
    const tileType = this.tileRenderer.getTile(targetTx, targetTy);
    const isResourceNode = tileType === 'vein_copper' || tileType === 'vein_tin' || tileType === 'vein_iron';

    for (const u of this.selectedUnits) {
      if (targetEnemyUnit) {
        u.targetEntityId = targetEnemyUnit.id;
        u.state = 'ATTACK_TARGET';
      } else if (isResourceNode && u.def.category === 'worker') {
        // Carovana inviata a raccogliere
        u.targetPosition = { x: targetTx * TILE_SIZE + 24, y: targetTy * TILE_SIZE + 24 };
        u.currentCargoType = tileType.replace('vein_', '');
        u.path = [{ x: targetTx * TILE_SIZE + 24, y: targetTy * TILE_SIZE + 24 }];
        u.state = 'HARVESTING';
      } else {
        // Movimento con Pathfinding A*
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
    // Panning della telecamera
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

    // Aggiornamento FSM unità
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

      // Rimuovi morti
      if (u.hp <= 0) {
        this.units.splice(i, 1);
      }
    }

    // Aggiornamento edifici
    for (let i = this.buildings.length - 1; i >= 0; i--) {
      const b = this.buildings[i];
      if (b.hp <= 0) {
        this.gridGraph.setBuildingOccupied(b.tx, b.ty, b.def.width, b.def.height, false);
        this.buildings.splice(i, 1);
      }
    }

    // Calcolo approvvigionamento (supply)
    let totalCap = 10;
    let used = 0;
    for (const b of this.buildings) {
      if (b.owner === 'player' && b.def.supplyProvided) totalCap += b.def.supplyProvided;
    }
    for (const u of this.units) {
      if (u.owner === 'player') used += u.def.supplyCost;
    }
    this.economy.updateSupply(totalCap, used);

    // Aggiornamento combattimento & proiettili
    this.combat.update(dt, this.units, this.buildings);

    // Aggiornamento Tactical Director nemico (Popoli del Mare)
    this.tacticalDirector.update(dt, this.gridGraph, this.units, 12, 28);

    // Aggiornamento Fog of War
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
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Layer Terreno & Terrapieni ciclopici
    this.tileRenderer.render(ctx, this.camera, this.gridGraph);

    // 2. Layer Edifici & Unità con Y-Sorting per profondità 2.5D
    const renderList: Array<{ type: 'b' | 'u'; y: number; item: any }> = [];
    for (const b of this.buildings) {
      renderList.push({ type: 'b', y: (b.ty + b.def.height) * TILE_SIZE, item: b });
    }
    for (const u of this.units) {
      renderList.push({ type: 'u', y: u.y, item: u });
    }
    renderList.sort((a, b) => a.y - b.y);

    for (const ent of renderList) {
      if (ent.type === 'b') {
        this.renderBuilding(ctx, ent.item as BuildingEntity);
      } else {
        this.renderUnit(ctx, ent.item as UnitEntity);
      }
    }

    // 3. Proiettili in volo
    ctx.fillStyle = '#ffdf73';
    for (const p of this.combat.projectiles) {
      const sp = this.camera.worldToScreen(p.x, p.y);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Fog of War
    this.fogRenderer.render(ctx, this.camera);

    // 5. Anteprima posizionamento edificio in costruzione (Ghost preview)
    if (this.buildingToPlace) {
      const bDef = BUILDINGS[this.buildingToPlace];
      const mouseWorld = this.camera.screenToWorld(this.dragCurrent.x, this.dragCurrent.y);
      const ghostTx = Math.floor(mouseWorld.x / TILE_SIZE);
      const ghostTy = Math.floor(mouseWorld.y / TILE_SIZE);
      const ghostScreen = this.camera.worldToScreen(ghostTx * TILE_SIZE, ghostTy * TILE_SIZE);
      const gw = bDef.width * TILE_SIZE * this.camera.zoom;
      const gh = bDef.height * TILE_SIZE * this.camera.zoom;

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
        ctx.drawImage(ghostSprite, ghostScreen.x, ghostScreen.y, gw, gh);
      }
      ctx.strokeStyle = canPlace ? '#2de0a5' : '#ff4d4d';
      ctx.lineWidth = 2;
      ctx.strokeRect(ghostScreen.x, ghostScreen.y, gw, gh);
      ctx.restore();
    }

    // 6. Box selection dragging
    if (this.isDraggingBox) {
      ctx.strokeStyle = '#2de0a5';
      ctx.lineWidth = 1;
      const x = Math.min(this.dragStart.x, this.dragCurrent.x);
      const y = Math.min(this.dragStart.y, this.dragCurrent.y);
      const w = Math.abs(this.dragStart.x - this.dragCurrent.x);
      const h = Math.abs(this.dragStart.y - this.dragCurrent.y);
      ctx.strokeRect(x, y, w, h);
    }

    // 6. Minimappa
    this.hud.renderMinimap(
      this.camera,
      this.units,
      this.buildings,
      this.tileRenderer.width,
      this.tileRenderer.height
    );
  }

  private renderBuilding(ctx: CanvasRenderingContext2D, b: BuildingEntity): void {
    const sp = this.camera.worldToScreen(b.tx * TILE_SIZE, b.ty * TILE_SIZE);
    const bw = b.def.width * TILE_SIZE * this.camera.zoom;
    const bh = b.def.height * TILE_SIZE * this.camera.zoom;

    // Disegna sprite procedurale SVGA memorizzato nella banca
    const sprite = SVGAProceduralBank.getBuildingSprite(b.defId, b.owner);
    if (sprite) {
      // Ombra edificio proiettata
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(sp.x + 6, sp.y + 6, bw, bh);
      ctx.drawImage(sprite, sp.x, sp.y, bw, bh);
    } else {
      ctx.fillStyle = b.owner === 'player' ? '#8a6234' : '#692d2d';
      ctx.fillRect(sp.x, sp.y, bw, bh);
    }

    // Bandiere animate che sventolano nel vento per Acropoli, Caserma e Torri
    if (b.defId === 'acropolis' || b.defId === 'barracks' || b.defId === 'watchtower') {
      const now = Date.now() / 200;
      const wave = Math.sin(now + b.id) * 3;
      const poleX = sp.x + (b.defId === 'watchtower' ? 14 : 24);
      const poleY = sp.y + 8;

      // Asta in bronzo
      ctx.fillStyle = '#b8944d';
      ctx.fillRect(poleX, poleY, 3, 22);

      // Tessuto bandiera con pieghe mosse dal vento levantino
      ctx.fillStyle = b.owner === 'player' ? '#2de0a5' : '#e63946';
      ctx.beginPath();
      ctx.moveTo(poleX + 3, poleY + 2);
      ctx.lineTo(poleX + 18, poleY + 5 + wave);
      ctx.lineTo(poleX + 3, poleY + 12);
      ctx.closePath();
      ctx.fill();
    }

    // Bordo di selezione
    if (b.isSelected) {
      ctx.strokeStyle = '#ffff55';
      ctx.lineWidth = 2;
      ctx.strokeRect(sp.x, sp.y, bw, bh);
    }

    // Etichetta edificio
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Cinzel, serif';
    ctx.fillText(b.def.name.substring(0, 14), sp.x + 4, sp.y + bh + 12);

    // Barra HP se selezionato o danneggiato
    if (b.isSelected || b.hp < b.maxHp) {
      const hpPct = Math.max(0, b.hp / b.maxHp);
      ctx.fillStyle = '#1c0909';
      ctx.fillRect(sp.x, sp.y - 6, bw, 4);
      ctx.fillStyle = '#2b9348';
      ctx.fillRect(sp.x, sp.y - 6, bw * hpPct, 4);
    }
  }

  private renderUnit(ctx: CanvasRenderingContext2D, u: UnitEntity): void {
    const sp = this.camera.worldToScreen(u.x, u.y);

    // Render animato procedurale dell'Età del Bronzo
    SVGAProceduralBank.drawAnimatedUnit(ctx, u, sp.x, sp.y);

    // Bordo o indicatore di selezione
    if (u.isSelected) {
      ctx.strokeStyle = '#ffff33';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Barra HP se selezionata o ferita
    if (u.isSelected || u.hp < u.maxHp) {
      const hpPct = Math.max(0, u.hp / u.maxHp);
      ctx.fillStyle = '#1c0909';
      ctx.fillRect(sp.x - 12, sp.y - 18, 24, 3);
      ctx.fillStyle = '#2b9348';
      ctx.fillRect(sp.x - 12, sp.y - 18, 24 * hpPct, 3);
    }
  }

  private gameLoop(timestamp: number): void {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new GameApp();
  app.init().catch(console.error);
});
