import { EventBus } from '../core/EventBus.ts';
import { SaveManager } from '../services/SaveManager.ts';
import { BronzeAudioEngine } from '../engine/audio/BronzeAudioEngine.ts';

export class SettingsModal {
  private overlayEl: HTMLElement | null = null;
  private audio: BronzeAudioEngine;
  private isPauseMode: boolean = false;

  public onResume?: () => void;
  public onRestartScenario?: () => void;
  public onOpenCouncil?: () => void;
  public onReturnToMap?: () => void;
  public onReturnToTitle?: () => void;
  public onSpeedChanged?: (speed: number) => void;
  public onPanSpeedChanged?: (speed: number) => void;

  constructor(audio: BronzeAudioEngine) {
    this.audio = audio;
    this.createDOM();
  }

  private createDOM(): void {
    const existing = document.getElementById('settings-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'settings-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(5, 3, 2, 0.94);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(5px);
      user-select: none;
    `;

    overlay.innerHTML = `
      <div class="stone-panel" style="
        width: 580px;
        max-width: 95vw;
        border: 2px solid #c9933b;
        box-shadow: 0 0 35px rgba(0,0,0,0.95);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      ">
        <!-- HEADER -->
        <div style="
          padding: 14px 20px;
          background: linear-gradient(180deg, #382c20 0%, #1c1510 100%);
          border-bottom: 2px solid #c9933b;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div id="settings-modal-title" style="font-family: 'Cinzel', serif; font-size: 18px; font-weight: 900; color: #ffd166; letter-spacing: 1.5px;">
            SETTINGS & OPTIONS
          </div>
          <button id="settings-close-btn" class="svga-btn" style="padding: 4px 12px; font-size: 12px;">✕</button>
        </div>

        <!-- BODY -->
        <div style="padding: 18px 24px; display: flex; flex-direction: column; gap: 16px;">
          <!-- IN-GAME PAUSE MENU ACTIONS (Hidden in main menu mode) -->
          <div id="pause-menu-actions" style="display: flex; flex-direction: column; gap: 8px; border-bottom: 1px solid #3d3227; padding-bottom: 14px;">
            <button id="pause-btn-resume" class="svga-btn" style="padding: 10px; font-size: 14px; font-weight: bold; background: linear-gradient(180deg, #6b4d24 0%, #3d2b14 100%); border-color: #ffd166; color: #fff8e8;">
              ▶ RESUME BATTLE
            </button>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button id="pause-btn-council" class="svga-btn" style="padding: 8px;">🏛 War Council Intel</button>
              <button id="pause-btn-restart" class="svga-btn" style="padding: 8px;">↻ Restart Scenario</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button id="pause-btn-map" class="svga-btn" style="padding: 8px;">🗺 Strategic Map</button>
              <button id="pause-btn-title" class="svga-btn" style="padding: 8px;">⌂ Main Menu</button>
            </div>
          </div>

          <!-- AUDIO SETTINGS -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="font-family: 'Cinzel', serif; font-size: 12px; font-weight: bold; color: #ffd166; border-bottom: 1px solid #3d3227; padding-bottom: 2px;">
              ACOUSTIC SETTINGS
            </div>

            <!-- MUTE TOGGLE -->
            <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer; color: #f7efe1;">
              <input type="checkbox" id="setting-mute-toggle" style="cursor: pointer; width: 16px; height: 16px;" />
              <span>Mute All Audio</span>
            </label>

            <!-- BGM VOLUME -->
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
              <span>Music Volume (Modal Phrygian BGM):</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="range" id="setting-bgm-slider" min="0" max="100" value="70" style="width: 140px; cursor: pointer;" />
                <span id="setting-bgm-val" style="width: 32px; text-align: right; font-family: 'Cinzel', serif; color: #ffd166;">70%</span>
              </div>
            </div>

            <!-- SFX VOLUME -->
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
              <span>Sound Effects (Weapons, Horns & Stone):</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="range" id="setting-sfx-slider" min="0" max="100" value="85" style="width: 140px; cursor: pointer;" />
                <span id="setting-sfx-val" style="width: 32px; text-align: right; font-family: 'Cinzel', serif; color: #ffd166;">85%</span>
              </div>
            </div>
          </div>

          <!-- GAMEPLAY & SIMULATION SETTINGS -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="font-family: 'Cinzel', serif; font-size: 12px; font-weight: bold; color: #ffd166; border-bottom: 1px solid #3d3227; padding-bottom: 2px;">
              SIMULATION & CONTROLS
            </div>

            <!-- GAME SPEED -->
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
              <span>Battle Simulation Speed:</span>
              <div style="display: flex; gap: 6px;">
                <button id="speed-1x-btn" class="svga-btn" style="padding: 4px 10px; font-size: 11px;">1.0×</button>
                <button id="speed-15x-btn" class="svga-btn" style="padding: 4px 10px; font-size: 11px;">1.5×</button>
                <button id="speed-2x-btn" class="svga-btn" style="padding: 4px 10px; font-size: 11px;">2.0×</button>
              </div>
            </div>

            <!-- PAN SPEED -->
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
              <span>Camera Pan Speed:</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="range" id="setting-pan-slider" min="300" max="1200" step="50" value="650" style="width: 140px; cursor: pointer;" />
                <span id="setting-pan-val" style="width: 48px; text-align: right; font-family: 'Cinzel', serif; color: #ffd166;">650</span>
              </div>
            </div>
          </div>

          <!-- CAMPAIGN DATA RESET -->
          <div style="border-top: 1px solid #3d3227; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 12px; color: #a89f91;">Reset all campaign progress:</div>
            <button id="settings-btn-reset-save" class="svga-btn" style="padding: 4px 10px; font-size: 11px; color: #ef4444; border-color: #7f1d1d;">
              Reset Save Data
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;

    this.bindInputs();
  }

  private bindInputs(): void {
    const saveMgr = SaveManager.get();
    const settings = saveMgr.getSettings();

    const muteCheck = document.getElementById('setting-mute-toggle') as HTMLInputElement;
    const bgmSlider = document.getElementById('setting-bgm-slider') as HTMLInputElement;
    const sfxSlider = document.getElementById('setting-sfx-slider') as HTMLInputElement;
    const panSlider = document.getElementById('setting-pan-slider') as HTMLInputElement;

    const bgmVal = document.getElementById('setting-bgm-val')!;
    const sfxVal = document.getElementById('setting-sfx-val')!;
    const panVal = document.getElementById('setting-pan-val')!;

    // Initial values
    muteCheck.checked = settings.isMuted;
    bgmSlider.value = Math.round(settings.bgmVolume * 100).toString();
    sfxSlider.value = Math.round(settings.sfxVolume * 100).toString();
    panSlider.value = settings.panSpeed.toString();

    bgmVal.textContent = `${bgmSlider.value}%`;
    sfxVal.textContent = `${sfxSlider.value}%`;
    panVal.textContent = `${panSlider.value}`;

    // Apply audio initial
    this.audio.setMuted(settings.isMuted);
    this.audio.setBGMVolume(settings.bgmVolume);
    this.audio.setSFXVolume(settings.sfxVolume);

    // Mute listener
    muteCheck.addEventListener('change', () => {
      this.audio.setMuted(muteCheck.checked);
      saveMgr.updateSettings({ isMuted: muteCheck.checked });
    });

    // BGM slider
    bgmSlider.addEventListener('input', () => {
      const v = Number(bgmSlider.value) / 100;
      bgmVal.textContent = `${bgmSlider.value}%`;
      this.audio.setBGMVolume(v);
      saveMgr.updateSettings({ bgmVolume: v });
    });

    // SFX slider
    sfxSlider.addEventListener('input', () => {
      const v = Number(sfxSlider.value) / 100;
      sfxVal.textContent = `${sfxSlider.value}%`;
      this.audio.setSFXVolume(v);
      saveMgr.updateSettings({ sfxVolume: v });
    });

    // Pan slider
    panSlider.addEventListener('input', () => {
      const v = Number(panSlider.value);
      panVal.textContent = `${v}`;
      saveMgr.updateSettings({ panSpeed: v });
      if (this.onPanSpeedChanged) this.onPanSpeedChanged(v);
    });

    // Speed buttons
    const setSpeedUI = (speed: number) => {
      const btn1 = document.getElementById('speed-1x-btn');
      const btn15 = document.getElementById('speed-15x-btn');
      const btn2 = document.getElementById('speed-2x-btn');

      [btn1, btn15, btn2].forEach(b => {
        if (b) {
          b.style.borderColor = '#14100c';
          b.style.color = '#fff6e5';
        }
      });

      if (speed === 1.0 && btn1) { btn1.style.borderColor = '#ffd166'; btn1.style.color = '#ffd166'; }
      if (speed === 1.5 && btn15) { btn15.style.borderColor = '#ffd166'; btn15.style.color = '#ffd166'; }
      if (speed === 2.0 && btn2) { btn2.style.borderColor = '#ffd166'; btn2.style.color = '#ffd166'; }
    };

    setSpeedUI(settings.gameSpeed || 1.0);

    document.getElementById('speed-1x-btn')?.addEventListener('click', () => {
      setSpeedUI(1.0);
      saveMgr.updateSettings({ gameSpeed: 1.0 });
      if (this.onSpeedChanged) this.onSpeedChanged(1.0);
    });
    document.getElementById('speed-15x-btn')?.addEventListener('click', () => {
      setSpeedUI(1.5);
      saveMgr.updateSettings({ gameSpeed: 1.5 });
      if (this.onSpeedChanged) this.onSpeedChanged(1.5);
    });
    document.getElementById('speed-2x-btn')?.addEventListener('click', () => {
      setSpeedUI(2.0);
      saveMgr.updateSettings({ gameSpeed: 2.0 });
      if (this.onSpeedChanged) this.onSpeedChanged(2.0);
    });

    // Reset button
    document.getElementById('settings-btn-reset-save')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (confirm('Clear all campaign progress and unlocked chronicles?')) {
        saveMgr.resetAllProgress();
        alert('Campaign data reset.');
      }
    });

    // In-game Pause menu actions
    document.getElementById('settings-close-btn')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.isPauseMode && this.onResume) this.onResume();
    });

    document.getElementById('pause-btn-resume')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onResume) this.onResume();
    });

    document.getElementById('pause-btn-council')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onOpenCouncil) this.onOpenCouncil();
    });

    document.getElementById('pause-btn-restart')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      if (confirm('Restart current scenario from the beginning?')) {
        this.hide();
        if (this.onRestartScenario) this.onRestartScenario();
      }
    });

    document.getElementById('pause-btn-map')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onReturnToMap) this.onReturnToMap();
    });

    document.getElementById('pause-btn-title')?.addEventListener('click', () => {
      EventBus.get().emit('audio:click');
      this.hide();
      if (this.onReturnToTitle) this.onReturnToTitle();
    });
  }

  public show(isPauseMode: boolean = false): void {
    this.isPauseMode = isPauseMode;
    if (this.overlayEl) {
      this.overlayEl.style.display = 'flex';
      const pauseActions = document.getElementById('pause-menu-actions');
      const title = document.getElementById('settings-modal-title');
      if (pauseActions && title) {
        if (isPauseMode) {
          pauseActions.style.display = 'flex';
          title.textContent = 'BATTLE PAUSED · WAR ROOM';
        } else {
          pauseActions.style.display = 'none';
          title.textContent = 'SETTINGS & OPTIONS';
        }
      }
      EventBus.get().emit('audio:select');
    }
  }

  public hide(): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
    }
  }
}
