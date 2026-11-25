import { EventBus } from '../core/EventBus.ts';
import { SVGAProceduralBank } from '../engine/rendering/SVGAProceduralBank.ts';
import { MissionStats, ObjectiveProgress } from '../campaign/ObjectiveManager.ts';
import { SaveManager } from '../services/SaveManager.ts';
import { CAMPAIGN_SCENARIOS } from '../data/campaignActs.ts';

export class DebriefingModal {
  private overlayEl: HTMLElement | null = null;
  private onRestartCallback?: () => void;
  private onNextCallback?: () => void;

  constructor(onRestart?: () => void, onNext?: () => void) {
    this.onRestartCallback = onRestart;
    this.onNextCallback = onNext;
  }

  public showVictory(stats: MissionStats, objectives: ObjectiveProgress[], scenarioId?: string): void {
    this.renderModal(true, stats, objectives, undefined, scenarioId);
  }

  public showDefeat(reason: string, stats: MissionStats, objectives: ObjectiveProgress[], scenarioId?: string): void {
    this.renderModal(false, stats, objectives, reason, scenarioId);
  }

  private renderModal(
    isVictory: boolean,
    stats: MissionStats,
    objectives: ObjectiveProgress[],
    defeatReason?: string,
    scenarioId?: string
  ): void {
    const curScenarioId = scenarioId || SaveManager.get().getCurrentScenarioId();
    const curMeta = CAMPAIGN_SCENARIOS.find(s => s.id === curScenarioId) || CAMPAIGN_SCENARIOS[0];
    const curIndex = CAMPAIGN_SCENARIOS.findIndex(s => s.id === curScenarioId);
    const nextScenario = curIndex >= 0 && curIndex + 1 < CAMPAIGN_SCENARIOS.length ? CAMPAIGN_SCENARIOS[curIndex + 1] : null;

    const existing = document.getElementById('debriefing-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'debriefing-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(6, 4, 3, 0.92);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(5px);
    `;

    const bkPortrait = SVGAProceduralBank.advisorPortraits.get('burna_khabir')?.toDataURL() || '';
    const titleColor = isVictory ? '#2de0a5' : '#ef4444';
    const titleText = isVictory ? `VICTORY: ${curMeta.title.toUpperCase()}` : 'DEFEAT: ASHES AND RUIN';

    const chronicleText = isVictory
      ? (curScenarioId === 'scenario_03_gate_of_cedars'
          ? 'The Lebanon mountain passes echo with the thunder of royal chariot wheels! By the swift archery of our two-horse war chariots and the discipline of our mountain militia, the Shardana arsonists have been cut down. The sacred cedar groves stand unharmed, our foundries overflow with charcoal and timber, and the secret raider ambush camp has been burned to ash. The Gate of Cedars is barred against the sea invaders!'
          : (curScenarioId === 'scenario_02_last_cargo_alashiya'
              ? 'The reefs of Ugarit run quiet. By the lethal range of our Cypriot bowmen and the courage of our donkey teams, the precious oxhide ingots of Alashiya have been hauled to safety! The Shardana raiding skiffs drift burning on the tide. Our foundries have secured the tin to forge our destiny!'
              : 'The sea churns red with the blood of the horned raiders. By blade, bow, and the unyielding strength of our cyclopean foundations, Kadesh-on-Sea has held fast! The cassiterite is secured in our storehouses, and the fires of our foundries will keep our people armed through the collapsing age.'))
      : 'The walls of our settlement have crumbled into dust. The sea raiders have overrun our hearths, and our people scatter into the wilderness. The memory of our colony dissolves into the ashes of bronze...';

    if (isVictory) {
      SaveManager.get().markScenarioCompleted(curScenarioId, nextScenario?.id || null, {
        scenarioId: curScenarioId,
        title: curMeta.title,
        act: curMeta.act,
        entry: chronicleText,
        bestTimeSeconds: stats.elapsedSeconds
      });
    }

    const minutes = Math.floor(stats.elapsedSeconds / 60);
    const seconds = Math.floor(stats.elapsedSeconds % 60);
    const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    let objectivesHtml = '';
    for (const obj of objectives) {
      const mark = obj.isCompleted
        ? '<span style="color: #2de0a5; font-weight: bold;">[COMPLETED]</span>'
        : (obj.isFailed ? '<span style="color: #ef4444; font-weight: bold;">[FAILED]</span>' : '<span style="color: #ffd166;">[INCOMPLETE]</span>');
      objectivesHtml += `
        <div style="display: flex; justify-content: space-between; font-size: 13px; border-bottom: 1px solid #2a221a; padding: 4px 0;">
          <span>${obj.description}</span>
          <span>${mark}</span>
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="stone-panel" style="
        width: 740px;
        max-width: 95vw;
        border: 2px solid ${isVictory ? '#c9933b' : '#991b1b'};
        box-shadow: 0 0 35px rgba(0,0,0,0.95);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      ">
        <!-- HEADER -->
        <div style="
          padding: 16px 20px;
          background: linear-gradient(180deg, ${isVictory ? '#282017' : '#2b1212'} 0%, #15100c 100%);
          border-bottom: 2px solid ${isVictory ? '#c9933b' : '#991b1b'};
          text-align: center;
        ">
          <div style="font-family: 'Cinzel', serif; font-size: 22px; font-weight: 900; color: ${titleColor}; letter-spacing: 2px;">
            ${titleText}
          </div>
          <div style="font-size: 13px; color: #a89f91; font-style: italic; margin-top: 4px;">
            Scenario I Chronicle — The Horned Sails
          </div>
        </div>

        <!-- BODY -->
        <div style="padding: 18px 24px; display: flex; flex-direction: column; gap: 14px;">
          <!-- CHRONICLE ENTRY -->
          <div style="display: flex; gap: 16px; background: rgba(20, 16, 12, 0.85); border: 1px solid #4a3e33; padding: 14px; border-radius: 4px;">
            <img src="${bkPortrait}" style="width: 76px; height: 76px; border: 2px solid #c9933b; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.8); flex-shrink: 0; object-fit: cover;" alt="Burna-Khabir" />
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="font-family: 'Cinzel', serif; font-size: 12px; font-weight: 700; color: #ffd166;">Chronicle of Burna-Khabir, Scribe of the Wanax:</div>
              <div style="font-size: 14px; line-height: 1.4; color: #f7efe1; font-style: italic;">
                "${chronicleText}"
              </div>
              ${defeatReason ? `<div style="font-size: 13px; color: #ef4444; font-weight: bold; margin-top: 4px;">Cause of Collapse: ${defeatReason}</div>` : ''}
            </div>
          </div>

          <!-- BATTLE STATISTICS -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
            <div class="stone-panel" style="padding: 8px; text-align: center; border-radius: 3px;">
              <div style="font-size: 11px; color: #a89f91; font-family: 'Cinzel', serif;">Colony Time</div>
              <div style="font-size: 18px; font-weight: bold; color: #ffd166; font-family: 'Cinzel', serif;">${timeFormatted}</div>
            </div>
            <div class="stone-panel" style="padding: 8px; text-align: center; border-radius: 3px;">
              <div style="font-size: 11px; color: #a89f91; font-family: 'Cinzel', serif;">Tin Stockpiled</div>
              <div style="font-size: 18px; font-weight: bold; color: #c0c6cc; font-family: 'Cinzel', serif;">${stats.tinHarvested}</div>
            </div>
            <div class="stone-panel" style="padding: 8px; text-align: center; border-radius: 3px;">
              <div style="font-size: 11px; color: #a89f91; font-family: 'Cinzel', serif;">Raiders Slain</div>
              <div style="font-size: 18px; font-weight: bold; color: #2de0a5; font-family: 'Cinzel', serif;">${stats.enemiesSlain}</div>
            </div>
            <div class="stone-panel" style="padding: 8px; text-align: center; border-radius: 3px;">
              <div style="font-size: 11px; color: #a89f91; font-family: 'Cinzel', serif;">Casualties</div>
              <div style="font-size: 18px; font-weight: bold; color: #ef4444; font-family: 'Cinzel', serif;">${stats.friendlyCasualties}</div>
            </div>
          </div>

          <!-- OBJECTIVE BREAKDOWN -->
          <div style="background: rgba(14, 11, 8, 0.85); border: 1px solid #3d3227; padding: 10px 14px; border-radius: 3px;">
            <div style="font-family: 'Cinzel', serif; font-size: 12px; font-weight: bold; color: #ffd166; margin-bottom: 6px;">
              OBJECTIVE PERFORMANCE
            </div>
            ${objectivesHtml}
          </div>
        </div>

        <!-- ACTIONS -->
        <div style="
          padding: 12px 20px;
          background: linear-gradient(180deg, #1f1813 0%, #110d0a 100%);
          border-top: 1px solid #3d3227;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        ">
          ${isVictory ? `
            <button id="debrief-continue-btn" class="svga-btn" style="padding: 8px 16px;">
              Continue Colony
            </button>
            <button id="debrief-next-btn" class="svga-btn" style="
              padding: 8px 20px;
              background: linear-gradient(180deg, #2b7a58 0%, #194a35 100%);
              border-color: #2de0a5;
              color: #f7efe1;
              font-weight: bold;
            ">
              ${nextScenario ? `Next Scenario: ${nextScenario.title} ➔` : 'Strategic Map ➔'}
            </button>
          ` : `
            <button id="debrief-retry-btn" class="svga-btn" style="
              padding: 8px 22px;
              background: linear-gradient(180deg, #782828 0%, #4a1515 100%);
              border-color: #ef4444;
              color: #fff0f0;
              font-weight: bold;
            ">
              ↻ Retry Scenario
            </button>
          `}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;

    if (isVictory) {
      document.getElementById('debrief-continue-btn')?.addEventListener('click', () => {
        EventBus.get().emit('audio:click');
        this.hide();
      });
      document.getElementById('debrief-next-btn')?.addEventListener('click', () => {
        EventBus.get().emit('audio:click');
        this.hide();
        if (this.onNextCallback) this.onNextCallback();
        else window.location.reload();
      });
    } else {
      document.getElementById('debrief-retry-btn')?.addEventListener('click', () => {
        EventBus.get().emit('audio:click');
        this.hide();
        if (this.onRestartCallback) this.onRestartCallback();
        else window.location.reload();
      });
    }
  }

  public hide(): void {
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
  }
}
