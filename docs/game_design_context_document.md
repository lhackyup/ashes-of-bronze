# Game Design Document & Contesto di Sviluppo (RTS Browser / Indie)

## 1. Visione del Progetto
* **Genere:** Strategico in Tempo Reale (RTS) classico ispirato alle meccaniche fondamentali di *Dune II* (1992) e *Command & Conquer: Tiberian Sun* (1999).
* **Piattaforma Target:** Browser web (HTML5 Canvas / WebGL 2) con successivo impacchettamento desktop (Electron / Tauri) per eventuale distribuzione su **itch.io** (demo browser gratuita) e **Steam** (campagna completa).
* **Direzione Artistica:** Grafica **2.5D SVGA / High-Color di fine anni '90** (sprite pre-renderizzati ad alta leggibilità, ombre portate direzionali, animazioni fluide, interfaccia scolpita).

---

## 2. Meccaniche Core di Gioco
1. **Fondamenta Obbligatorie / Consigliate (stile Concrete Slabs):**
   * Prima di edificare strutture avanzate, il giocatore posiziona piastre di fondazione sul terreno (es. *Lastricato Romano*, *Piastre Geotermiche* o *Terrapieni in Pietra*).
   * Costruire senza fondamenta complete riduce l'integrità strutturale iniziale dell'edificio.
2. **Economia e Raccolta Risorse Automatizzata + Manuale:**
   * Una struttura di raffinazione/stoccaggio genera un **Mezzo di Trasporto / Estrattore**.
   * Il mezzo opera autonomamente tra i giacimenti sulla mappa e la raffineria, ma è anche **selezionabile e comandabile manualmente** dal giocatore (spostamento per evitare attacchi, estrazione da un giacimento specifico, scarico anticipato).
3. **Albero Tecnologico Progressivo:**
   * Struttura Comando → Fondazione → Raffineria/Cava → Caserma → Torre di Vedetta (sblocca la minimappa radar e difende la base) → Officina Mezzi Pesanti / Assedio.
4. **Campagna Lineare a Espansione (15–20 Scenari):**
   * Si parte da un piccolo nucleo iniziale e, missione dopo missione, si espande il territorio su una mappa strategica, sbloccando nuove unità e tecnologie fino alla vittoria finale.
5. **Controlli Classici RTS:**
   * Selezione singola (clic sinistro), selezione a rettangolo (trascinamento), doppio clic per selezionare unità dello stesso tipo su schermo.
   * Gruppi rapidi (`Ctrl + 1/2/3` per salvare, `1/2/3` per richiamare).
   * Ordini contestuali con clic destro (movimento, attacco, raccolta, rientro).
   * Nebbia di guerra (*Fog of War*) a tre stati: inesplorato, esplorato in ombra, visibile attivamente.

---

## 3. Opzioni di Ambientazione Valutate (Libere da Copyright)

### Opzione A: L'Ascesa dell'Impero Romano (Prototipo Attuale)
* **Concept:** Partendo da un embrione di città sul Tevere, si unifica l'Italia e si conquista il Mediterraneo.
* **Risorse:** Denarii (oro e pietra estratti dalle cave), Viveri/Supporto Legioni.
* **Punti di forza:** Massima attrattiva commerciale immediata su Steam/itch.io, zero rischi di copyright, progressione geografica storica reale.

### Opzione B: Fantascienza "Galattica" (Ispirata al *Ciclo della Fondazione* con Lore Originale)
* **Nota Legale:** Non utilizzare nomi proprietari di Asimov (*Terminus*, *Seldon*, *Fondazione*, *Mulo*). Creare nomi e fazioni originali basati sull'archetipo della *piccola enclave scientifica ai confini della galassia contro un impero galattico in decadenza*.
* **Struttura in 18 Scenari (4 Atti):**
  * *Atto I (1–5):* Sopravvivenza su un pianeta periferico freddo, piastre geotermiche, difesa dai regni vicini decaduti.
  * *Atto II (6–10):* Espansione commerciale e scontri asimmetrici contro le flotte pesanti dell'Impero.
  * *Atto III (11–14):* Crisi psionica/anomalia improvvisa, evacuazione, resistenza clandestina e spedizione sulle rovine della vecchia capitale imperiale.
  * *Atto IV (15–18):* Guerra civile/ideologica e stabilizzazione finale della nuova federazione galattica.

### Opzione C: L'Età del Bronzo e la Rivoluzione del Ferro (1200 – 900 a.C.)
* **Concept:** Dopo il collasso dei grandi imperi dell'Età del Bronzo e le incursioni dei Popoli del Mare, una città-stato superstite ricostruisce la civiltà.
* **Meccanica distintiva:** Raccolta dello **Stagno** (raro quanto la Spezia di *Dune*) nella prima metà della campagna, seguita dalla scoperta della metallurgia del **Ferro** che rende le nuove unità superiori agli eserciti di bronzo nemici.

---

## 4. Pipeline Grafica (Blender su Ubuntu → Sprite 2.5D)
Per evolvere la grafica procedurale del prototipo verso veri asset pre-renderizzati di fine anni '90:
1. **Ambiente:** Blender su Ubuntu (`sudo snap install blender --classic` o pacchetto ufficiale `.tar.xz`).
2. **Scena Template:**
   * Camera **Orthographic** inclinata a 35.264° / 45° (isometrica) o 45° / 60° (top-down stile *Dune II*).
   * Luce direzionale fissa (`Sun`) per ombre coerenti + sfondo trasparente (`Film > Transparent`, export PNG RGBA).
   * Colore chiave (es. magenta `#FF00FF`) sui dettagli di fazione per ricolorazione dinamica via shader/canvas.
3. **Automazione Python:** Script Blender che ruota il pivot del modello su **8 o 16 angolazioni** ed esporta i frame di `Idle`, `Move`, `Attack` e `Death`, poi impacchettati in atlanti *spritesheet* PNG + JSON.

---

## 5. Prossimi Passi Consigliati in Antigravity
1. Analizzare il file `imperium_romanum_rts.html` e separare il codice monolitico in moduli puliti (`src/engine/`, `src/entities/`, `src/ai/`, `src/ui/`, `src/data/`).
2. Implementare un sistema di salvataggio locale (`localStorage` / file JSON) per gestire una campagna persistente di 15–20 missioni.
3. Migliorare il pathfinding (algoritmo A* o Flow Field) per gestire mappe più complesse con ponti, fiumi, strettoie e fortificazioni.
4. Sostituire gradualmente gli sprite procedurali con atlanti PNG pre-renderizzati da Blender.