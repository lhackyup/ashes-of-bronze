export interface ChronicleRecord {
  scenarioId: string;
  title: string;
  act: number;
  entry: string;
  dateCompleted: string;
  bestTimeSeconds: number;
}

export interface GameSettings {
  bgmVolume: number;   // 0.0 to 1.0
  sfxVolume: number;   // 0.0 to 1.0
  isMuted: boolean;
  gameSpeed: number;   // 1.0, 1.5, 2.0
  panSpeed: number;    // pixels/sec
}

export interface CampaignSaveData {
  version: number;
  currentScenarioId: string;
  completedScenarios: string[];
  chronicles: ChronicleRecord[];
  settings: GameSettings;
  hasSeenPrologue?: boolean;
}

const STORAGE_KEY = 'ashes_of_bronze_save_v1';

const DEFAULT_SETTINGS: GameSettings = {
  bgmVolume: 0.7,
  sfxVolume: 0.85,
  isMuted: false,
  gameSpeed: 1.0,
  panSpeed: 650
};

const DEFAULT_SAVE: CampaignSaveData = {
  version: 1,
  currentScenarioId: 'scenario_01_horned_sails',
  completedScenarios: [],
  chronicles: [],
  settings: DEFAULT_SETTINGS
};

export class SaveManager {
  private static instance: SaveManager;
  private data: CampaignSaveData = DEFAULT_SAVE;

  private constructor() {
    this.load();
  }

  public static get(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public load(): CampaignSaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version === DEFAULT_SAVE.version) {
          this.data = {
            ...DEFAULT_SAVE,
            ...parsed,
            settings: { ...DEFAULT_SETTINGS, ...parsed.settings }
          };
          return this.data;
        }
      }
    } catch (e) {
      console.warn('Could not load save data from localStorage, using defaults:', e);
    }
    this.data = { ...DEFAULT_SAVE };
    this.save();
    return this.data;
  }

  public save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save game data to localStorage:', e);
    }
  }

  public getData(): CampaignSaveData {
    return this.data;
  }

  public getCurrentScenarioId(): string {
    return this.data.currentScenarioId || 'scenario_01_horned_sails';
  }

  public setCurrentScenarioId(scenarioId: string): void {
    this.data.currentScenarioId = scenarioId;
    this.save();
  }

  public getSettings(): GameSettings {
    return this.data.settings;
  }

  public updateSettings(partial: Partial<GameSettings>): void {
    this.data.settings = { ...this.data.settings, ...partial };
    this.save();
  }

  public isScenarioCompleted(scenarioId: string): boolean {
    return this.data.completedScenarios.includes(scenarioId);
  }

  public hasSeenPrologue(): boolean {
    return !!this.data.hasSeenPrologue;
  }

  public setHasSeenPrologue(seen: boolean): void {
    this.data.hasSeenPrologue = seen;
    this.save();
  }

  public markScenarioCompleted(
    scenarioId: string,
    nextScenarioId: string | null,
    chronicle: Omit<ChronicleRecord, 'dateCompleted'>
  ): void {
    if (!this.data.completedScenarios.includes(scenarioId)) {
      this.data.completedScenarios.push(scenarioId);
    }

    if (nextScenarioId) {
      this.data.currentScenarioId = nextScenarioId;
    }

    const existingIndex = this.data.chronicles.findIndex(c => c.scenarioId === scenarioId);
    const record: ChronicleRecord = {
      ...chronicle,
      dateCompleted: new Date().toLocaleDateString('en-GB')
    };

    if (existingIndex >= 0) {
      if (chronicle.bestTimeSeconds < this.data.chronicles[existingIndex].bestTimeSeconds) {
        this.data.chronicles[existingIndex] = record;
      }
    } else {
      this.data.chronicles.push(record);
    }

    this.save();
  }

  public resetAllProgress(): void {
    this.data = {
      ...DEFAULT_SAVE,
      settings: { ...this.data.settings }
    };
    this.save();
  }
}
