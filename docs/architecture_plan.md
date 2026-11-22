# Architecture Plan: Ashes of Bronze (2.5D SVGA RTS)
## Transition and Modularization from Monolithic Prototype to Full Production

---

## 1. Project Vision and Setting Transition

The project transitions from the monolithic Roman-themed prototype into its true historical setting: **The Late Bronze Age Collapse and the Iron Dawn (1200 – 900 BC)**.

### 1.1 Historical-Narrative Premise & Core Gameplay
* **Setting:** Eastern Mediterranean and Aegean post-1200 BC. International trade routes collapse, Sea Peoples ravage coastal ports, and great empires crumble.
* **Key Strategic Resource (The "Dune Spice" Mechanic): Tin (*Cassiterite*).**
  * Copper is accessible, but without tin, bronze cannot be forged. Scarcity of tin drives expeditions, trade defense, and territorial warfare in Acts I and II.
* **Epochal Technological Transition (The Iron Age):**
  * In the second half of the campaign (Acts III and IV), the player unlocks double-bellows bloomeries and **Iron Metallurgy**, breaking dependence on tin and producing more cost-effective, lethal weapons.
* **Structural Foundations:**
  * Substitution of Roman slabs with **Dry-Laid Cyclopean Megalithic Foundations** (*Cyclopean Foundations*), essential for erecting workshops, smelters, and fortifications without structural integrity penalties.

---

## 2. Monolithic Prototype Diagnosis (`imperium_romanum_strategia_svga_anni_90.html`)

The original prototype aggregated rendering, input, simulation, audio, and UI into a single 3,600+ line file.

### 2.1 Strengths to Preserve
1. **Authentic Late 90s SVGA Look & Feel:** Solid retro aesthetic (rich palette, beveled selection indicators, carved stone UI).
2. **Economic Cycle & Foundations:** Proven concrete slab foundation mechanic and dual-mode harvesters (autonomous haul loop + manual micro control).
3. **Synthetic Web Audio API:** Zero-dependency procedural sound generator for BGM and SFX.
4. **Classic RTS Controls:** Box drag selection, double-click type selection, control groups (`Ctrl+1-9`), right-click contextual orders.

### 2.2 Critical Technical Debts Resolved
* **Pathfinding:** Replaced naive linear movement with true **A\* Search** and **Dijkstra Flow Fields** for mass horde movement.
* **Procedural SVGA Bank:** Centralized all sprite generation into an offscreen canvas cache (`SVGAProceduralBank.ts`), rendering at solid 60 FPS with zero external asset bloat.
* **State Decoupling:** Converted global mutable arrays into strict TypeScript ECS/System modules (`EconomySystem`, `CombatSystem`, `TacticalDirector`).
* **Declarative Campaign Engine:** Externalized scenarios into structured JSON data files (`public/campaigns/`).

---

## 3. Technology Stack & Directory Structure

* **Language:** TypeScript (strict mode).
* **Bundler & Build Tool:** Vite (instant HMR and fast production bundling).
* **Target Platforms:** Web Browser (itch.io demo) and Desktop Packaging via Tauri (Steam release).
* **Rendering:** Pure Procedural Canvas 2D with offscreen cached buffers and 45° cavalier axonometric perspective.

```text
ashes-of-bronze/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   ├── assets/
│   └── campaigns/act1/        # JSON Scenario definitions
├── src/
│   ├── core/                  # EventBus, math helpers
│   ├── data/                  # Buildings, units, terrains, types
│   ├── engine/
│   │   ├── camera/            # 2D Camera, viewport frustum culling
│   │   ├── rendering/         # SVGAProceduralBank, TileRenderer, FogRenderer
│   │   ├── pathfinding/       # GridGraph, AStar, FlowField
│   │   └── audio/             # BronzeAudioEngine (Web Audio synthesis)
│   ├── entities/              # UnitEntity, BuildingEntity
│   ├── systems/               # EconomySystem, CombatSystem
│   ├── ai/                    # UnitFSM, TacticalDirector
│   ├── campaign/              # ScenarioLoader
│   ├── ui/                    # HUDController
│   └── main.ts                # Application bootstrap and game loop
```

---

## 4. Architectural Modules

### 4.1 Procedural SVGA Canvas Rendering Engine
Adopts a pure procedural Canvas 2D pipeline (90s DOS/SVGA style) with zero external sprite downloads:
* **High-Contrast Ashlar Limestone Masonry:** Walls rendered with bevel highlights and shadow lines, popping distinctly against arid soils.
* **Terracotta Pitched Roofs:** Slanted roofs with grooved clay tiles and raised eaves.
* **Minoan/Mycenaean Fluted Colonnades:** Tapered cedar pillars with cylindrical shading and gold disc capitals.
* **Dynamic Wave Banners:** Cloth faction flags on acropolis and watchtowers waving continuously in the wind (`Math.sin(time) * 3`).

### 4.2 Navigation & Pathfinding
* **A\* with Octile Distance Heuristic:** Handles single unit orders and path smoothing.
* **Flow Field (Vector Grids) for Hordes:** Sea Peoples landing waves read directional flow vectors in $O(1)$ time complexity without CPU degradation.

### 4.3 Artificial Intelligence
* **Unit FSM:** Handles `IDLE`, `MOVE_TO`, `ATTACK_TARGET`, and `HARVEST_CYCLE` (quarrying, hauling, unloading).
* **Tactical Director:** Manages scripted amphibious raids and timed horde assault waves.

### 4.4 Declarative Scenarios & Campaign System
Scenarios are specified in schema-validated JSON files defining maps, starting forces, wave triggers, primary/secondary objectives, and cuneiform tablet dialogue entries.
