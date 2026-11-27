import { EventBus } from '../core/EventBus.ts';
import { SVGAProceduralBank } from '../engine/rendering/SVGAProceduralBank.ts';
import { ScenarioData } from '../data/types.ts';
import { CAMPAIGN_SCENARIOS } from '../data/campaignActs.ts';

export class CouncilModal {
  private overlayEl: HTMLElement | null = null;
  private onDeployCallback?: () => void;
  private currentScenario?: ScenarioData;

  constructor(onDeploy?: () => void) {
    this.onDeployCallback = onDeploy;
    this.createDOM();
  }

  public setScenario(scenario: ScenarioData): void {
    this.currentScenario = scenario;
    this.createDOM();
  }

  private createDOM(): void {
    // Remove if existing
    const existing = document.getElementById('council-modal-overlay');
    if (existing) existing.remove();

    const scenario = this.currentScenario;
    const scenarioMeta = scenario ? CAMPAIGN_SCENARIOS.find(s => s.id === scenario.id) : CAMPAIGN_SCENARIOS[0];

    const title = scenario?.id === 'scenario_05_silence_great_kings'
      ? 'THE WAR COUNCIL: SILENCE OF THE GREAT KINGS'
      : (scenario?.id === 'scenario_04_siege_kadesh_sea'
          ? 'THE WAR COUNCIL: THE SIEGE OF KADESH-ON-SEA'
          : (scenario?.id === 'scenario_03_gate_of_cedars'
              ? 'THE WAR COUNCIL: THE GATE OF CEDARS'
              : (scenario?.id === 'scenario_02_last_cargo_alashiya'
                  ? 'THE WAR COUNCIL: THE SHALLOWS OF UGARIT'
                  : 'THE WAR COUNCIL OF KADESH-ON-SEA')));

    const subtitle = scenarioMeta
      ? `Scenario ${scenarioMeta.scenarioIndex}: ${scenarioMeta.title} — ${scenarioMeta.yearBC} BC, ${scenarioMeta.region}`
      : 'Scenario I: The Horned Sails — 1182 BC, Levantine Coastline';

    const briefing = scenario?.narrative?.briefing ||
      'Clay tablets from Hattusa and Ugarit have ceased to arrive. From the Great Green, marauding fleets strike coastal outposts without warning. Establish our redoubt, extract Cassiterite Tin, and repel the sea raiders.';

    let burnaText = "The kings of the Earth are weeping into the dust. Guard our Megaron with stone and blood.";
    let tarkhuntaText = "Copper is as soft as river mud without Cassiterite! Send Donkey Caravans to gather pure Tin for the armory.";
    let zalpaText = "Bird prows have been spotted off the coast. Deploy our forces to intercept the landing craft!";

    if (scenario?.id === 'scenario_05_silence_great_kings') {
      burnaText = "The Great Kings are silent, Wanax! Hattusa is cold ash and Mycenae lies in ruin. In Ugarit, the inscribed memory of our world is burning: extract the sacred tablets before civilization dissolves into three centuries of darkness!";
      tarkhuntaText = "No overseas fleet will ever bring tin again! Every ingot salvaged from the ruins of Ugarit is precious as life: send Donkey Caravans to mine the ruined merchant vault at (34, 18) or sack enemy pirate camps to recover plundered tin!";
      zalpaText = "Peleset and Shardana raiders have fortified two blockade outposts in the northwest to cut our retreat to Kar-Sur! Raze their camps with war chariots and shatter their supreme warlord!";
    } else if (scenario?.id === 'scenario_04_siege_kadesh_sea') {
      burnaText = "The Great Green is filled with horned sails under the black sky! The Great Kings of Hatti and Mycenae are silent; only our Megaron still shines. If we fall tonight, humanity enters three centuries of darkness!";
      tarkhuntaText = "Erect Cyclopean Ramparts across every choke point! Lay heavy stone slabs and man the walls with composite bowmen. When the Shardana broadswords strike our megalithic stone, they will shatter!";
      zalpaText = "Wanax, the enemy has pitched a forward war camp in the northern gorge that will spawn raiding parties! We must use our War Chariots to sweep around and burn that camp to ash, or we will be harassed before their Warlord arrives!";
    } else if (scenario?.id === 'scenario_02_last_cargo_alashiya') {
      burnaText = "The last merchant galleys of Alashiya have run aground upon the reefs. If we secure their copper and tin, our foundries will supply the army for an entire campaign!";
      tarkhuntaText = "The stranded oxhide ingots are pure Cypriot bronze bullion! Dispatch our donkey caravans onto the sandbars immediately before the Shardana torch the hulks!";
      zalpaText = "Our new Cypriot Composite Bowmen outrange the raiders' broadswords! Train at least 3 bowmen squads to control the tidal flats and screen our salvagers!";
    } else if (scenario?.id === 'scenario_03_gate_of_cedars') {
      burnaText = "The sacred cedar groves of the Lebanon range are the lungs of our realm. If the Sea Peoples burn the timber passes, our city will starve and our furnaces turn cold.";
      tarkhuntaText = "Our bronze foundries have a voracious hunger for cedar charcoal! Stockpile at least 350 timber, and build the War Chariot Stables—without heavy bronze-tired wheels, we cannot hold the open valleys!";
      zalpaText = "My Wanax! Unleash the Royal Two-Horse War Chariots! Across the open plains of the pass, our composite bowmen will crush their arsonists and burn out their northeastern forest ambush!";
    }

    let objectivesListHtml = '';
    if (scenario?.objectives?.primary) {
      for (const obj of scenario.objectives.primary) {
        objectivesListHtml += `
          <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
            <span style="color: #ffd166; font-weight: bold;">[PRIMARY]</span>
            <span>${obj.description}</span>
          </div>
        `;
      }
    } else {
      objectivesListHtml += `
        <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
          <span style="color: #ffd166; font-weight: bold;">[PRIMARY]</span>
          <span>Erect a Cyclopean Watchtower to secure the coastal approaches (0 / 1)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
          <span style="color: #ffd166; font-weight: bold;">[PRIMARY]</span>
          <span>Stockpile at least 200 bars of Cassiterite Tin to forge weapons of war</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
          <span style="color: #ffd166; font-weight: bold;">[PRIMARY]</span>
          <span>Withstand and repel 3 Sea Peoples landing waves without losing your Acropolis</span>
        </div>
      `;
    }

    if (scenario?.objectives?.secondary) {
      for (const obj of scenario.objectives.secondary) {
        objectivesListHtml += `
          <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #b0a390;">
            <span style="color: #a0a8b0; font-weight: bold;">[SECONDARY]</span>
            <span>${obj.description}</span>
          </div>
        `;
      }
    } else {
      objectivesListHtml += `
        <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #b0a390;">
          <span style="color: #a0a8b0; font-weight: bold;">[SECONDARY]</span>
          <span>Protect the Bronze Foundry from coastal raiding parties</span>
        </div>
      `;
    }

    const overlay = document.createElement('div');
    overlay.id = 'council-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(8, 6, 5, 0.88);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    `;

    const getPortraitURL = (key: string): string => {
      const canvas = SVGAProceduralBank.advisorPortraits.get(key);
      return canvas ? canvas.toDataURL() : '';
    };

    overlay.innerHTML = `
      <div class="stone-panel" style="
        width: 860px;
        max-width: 95vw;
        max-height: 92vh;
        border: 2px solid #c9933b;
        box-shadow: 0 0 25px rgba(0,0,0,0.9), inset 0 0 15px rgba(0,0,0,0.7);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      ">
        <!-- HEADER -->
        <div style="
          padding: 14px 20px;
          background: linear-gradient(180deg, #3d3126 0%, #201a14 100%);
          border-bottom: 2px solid #c9933b;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <div style="font-family: 'Cinzel', serif; font-size: 20px; font-weight: 900; color: #ffd166; letter-spacing: 1px;">
              ${title}
            </div>
            <div style="font-family: 'Crimson Pro', Georgia, serif; font-size: 14px; color: #a89f91; font-style: italic;">
              ${subtitle}
            </div>
          </div>
          <button id="council-close-btn" class="svga-btn" style="padding: 4px 10px; font-size: 13px;">✕</button>
        </div>

        <!-- BODY CONTENT -->
        <div style="padding: 16px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;">
          <!-- GENERAL NARRATIVE BRIEFING -->
          <div style="
            background: rgba(22, 17, 13, 0.85);
            border-left: 3px solid #ffd166;
            padding: 10px 14px;
            font-size: 15px;
            line-height: 1.45;
            color: #f7efe1;
          ">
            <strong>Mandate of the Wanax:</strong> ${briefing}
          </div>

          <!-- ADVISORS CARDS -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <!-- BURNA-KHABIR -->
            <div class="stone-panel advisor-briefing-card" style="padding: 12px; border-radius: 4px; display: flex; flex-direction: column; gap: 8px; border: 1px solid #785a2b;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${getPortraitURL('burna_khabir')}" style="width: 74px; height: 74px; border: 2px solid #c9933b; border-radius: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.8); object-fit: cover;" alt="Burna-Khabir" />
                <div>
                  <div style="font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: #ffd166;">Burna-Khabir</div>
                  <div style="font-size: 11px; color: #b0a390;">Royal Scribe & Chronicler</div>
                </div>
              </div>
              <div style="font-size: 13px; color: #e8dccb; line-height: 1.4; font-style: italic;">
                "${burnaText}"
              </div>
            </div>

            <!-- TARKHUNTA -->
            <div class="stone-panel advisor-briefing-card" style="padding: 12px; border-radius: 4px; display: flex; flex-direction: column; gap: 8px; border: 1px solid #784520;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${getPortraitURL('tarkhunta')}" style="width: 74px; height: 74px; border: 2px solid #f59e0b; border-radius: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.8); object-fit: cover;" alt="Tarkhunta" />
                <div>
                  <div style="font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: #ffd166;">Tarkhunta</div>
                  <div style="font-size: 11px; color: #b0a390;">Luwian Master Smelter</div>
                </div>
              </div>
              <div style="font-size: 13px; color: #e8dccb; line-height: 1.4; font-style: italic;">
                "${tarkhuntaText}"
              </div>
            </div>

            <!-- ZALPA -->
            <div class="stone-panel advisor-briefing-card" style="padding: 12px; border-radius: 4px; display: flex; flex-direction: column; gap: 8px; border: 1px solid #1e6653;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${getPortraitURL('zalpa')}" style="width: 74px; height: 74px; border: 2px solid #2de0a5; border-radius: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.8); object-fit: cover;" alt="Zalpa" />
                <div>
                  <div style="font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: #ffd166;">Zalpa</div>
                  <div style="font-size: 11px; color: #b0a390;">Kaska Scout Captain</div>
                </div>
              </div>
              <div style="font-size: 13px; color: #e8dccb; line-height: 1.4; font-style: italic;">
                "${zalpaText}"
              </div>
            </div>
          </div>

          <!-- MISSION OBJECTIVES LIST -->
          <div style="
            background: rgba(15, 12, 10, 0.9);
            border: 1px solid #5a4c3f;
            border-radius: 3px;
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          ">
            <div style="font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: #ffd166; border-bottom: 1px solid #3d3227; padding-bottom: 4px;">
              TABLET OF MANDATES & OBJECTIVES
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
              ${objectivesListHtml}
            </div>
          </div>
        </div>

        <!-- FOOTER ACTION BAR -->
        <div style="
          padding: 12px 20px;
          background: linear-gradient(180deg, #201a14 0%, #15110d 100%);
          border-top: 1px solid #3d3227;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        ">
          <button id="council-deploy-btn" class="svga-btn" style="
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 1px;
            background: linear-gradient(180deg, #8a6234 0%, #573c1c 100%);
            border-color: #ffd166;
            color: #fff9e6;
            cursor: pointer;
          ">
            COMMENCE MISSION ➔
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;

    document.getElementById('council-close-btn')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
    });

    document.getElementById('council-deploy-btn')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onDeployCallback) {
        this.onDeployCallback();
      }
    });
  }

  public show(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'flex';
      EventBus.get().emit('audio:select');
    }
  }

  public hide(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
    }
  }
}
