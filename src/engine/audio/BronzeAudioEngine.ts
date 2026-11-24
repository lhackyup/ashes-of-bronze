import { EventBus } from '../../core/EventBus.ts';

export class BronzeAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted: boolean = false;
  private bgmPlaying: boolean = false;
  private bgmIntervalId: number | null = null;
  private bgmStep: number = 0;

  private masterVol: number = 1.0;
  private bgmVol: number = 0.7;
  private sfxVol: number = 0.85;

  // Scala modale arcaica egea/anatolica (Modo Frigio / Eolio antico)
  private readonly bgmMelody = [
    55, 57, 58, 62, 60, 58, 57, 55,
    58, 62, 65, 63, 62, 60, 58, 57,
    50, 55, 57, 58, 57, 55, 53, 50,
    55, 58, 62, 60, 58, 57, 58, 55
  ];

  constructor() {
    this.setupEventListeners();
  }

  private initContext(): boolean {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmVol, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  public setMasterVolume(v: number): void {
    this.masterVol = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
    }
  }

  public setBGMVolume(v: number): void {
    this.bgmVol = Math.max(0, Math.min(1, v));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmVol, this.ctx.currentTime);
    }
  }

  public setSFXVolume(v: number): void {
    this.sfxVol = Math.max(0, Math.min(1, v));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
  }

  private setupEventListeners(): void {
    const bus = EventBus.get();
    bus.on('audio:click', () => this.playClick());
    bus.on('audio:select', () => this.playSelect());
    bus.on('audio:command', () => this.playCommand());
    bus.on('audio:build', () => this.playBuild());
    bus.on('audio:harvest', () => this.playHarvest());
    bus.on('audio:horn_alert', () => this.playHornAlert());
    bus.on('audio:combat_hit', () => this.playCombatHit());
    bus.on('audio:arrow', () => this.playArrowWhoosh());
    bus.on('audio:explosion', () => this.playExplosion());
    bus.on('audio:objective_complete', () => this.playObjectiveComplete());
    bus.on('audio:victory', () => this.playVictoryFanfare());
    bus.on('audio:defeat', () => this.playDefeatSound());
    bus.on('audio:lion_roar', () => this.playLionRoar());
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted && this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    } else if (!muted && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // --- Effetti Sonori Sintetizzati ---

  public playTone(freq: number, type: OscillatorType, duration: number, gainVal = 0.15, isBGM = false): void {
    if (this.isMuted || !this.initContext() || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      const destination = (isBGM ? this.bgmGain : this.sfxGain) || this.masterGain || this.ctx.destination;
      gain.connect(destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore audio policy errors
    }
  }

  public playNoise(duration: number, filterFreq = 1000, gainVal = 0.2): void {
    if (this.isMuted || !this.initContext() || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain || this.masterGain || this.ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // Ignore
    }
  }

  public playClick(): void {
    this.playTone(850, 'sine', 0.04, 0.06);
  }

  public playSelect(): void {
    this.playTone(440, 'triangle', 0.08, 0.1);
  }

  public playCommand(): void {
    this.playTone(330, 'triangle', 0.06, 0.1);
    setTimeout(() => this.playTone(495, 'triangle', 0.07, 0.1), 50);
  }

  public playBuild(): void {
    // Colpo di martello e scalpello su pietra ciclopica
    this.playTone(280, 'square', 0.09, 0.12);
    this.playNoise(0.12, 1200, 0.15);
  }

  public playHarvest(): void {
    // Tintinnio di metallo e roccia
    this.playTone(980, 'sine', 0.06, 0.08);
    setTimeout(() => this.playTone(1320, 'sine', 0.08, 0.06), 70);
  }

  public playHornAlert(): void {
    // Corno d'ariete / allarme navale
    if (this.isMuted || !this.initContext() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(277.18, now + 0.35); // C#
    osc.frequency.linearRampToValueAtTime(329.63, now + 0.7);  // E

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.95);
  }

  public playLionRoar(): void {
    // Powerful synthesized feline roar: guttural low-frequency sawtooth growl with resonant noise breath
    if (this.isMuted || !this.initContext() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const duration = 1.35;

      // 1. Low guttural growling oscillator (pitch sweeps 110Hz -> 175Hz -> 65Hz)
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(175, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(65, now + duration);

      // Tremolo LFO for guttural throat rasp
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(32, now); // 32 Hz rasp
      lfoGain.gain.setValueAtTime(25, now);
      lfo.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + duration);

      oscGain.gain.setValueAtTime(0.01, now);
      oscGain.gain.linearRampToValueAtTime(0.32, now + 0.2);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain || this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);

      // 2. Resonant breath roar noise
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(380, now);
      filter.frequency.linearRampToValueAtTime(620, now + 0.3);
      filter.frequency.linearRampToValueAtTime(280, now + duration);
      filter.Q.setValueAtTime(3.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, now);
      noiseGain.gain.linearRampToValueAtTime(0.24, now + 0.25);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain || this.masterGain || this.ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // Audio policy safe
    }
  }

  public playCombatHit(): void {
    this.playTone(160, 'sawtooth', 0.08, 0.18);
    this.playNoise(0.08, 800, 0.22);
  }

  public playArrowWhoosh(): void {
    this.playNoise(0.12, 2400, 0.12);
  }

  public playExplosion(): void {
    this.playTone(90, 'sawtooth', 0.45, 0.3);
    this.playNoise(0.5, 450, 0.35);
  }

  public playObjectiveComplete(): void {
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 bright bronze chime
    notes.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'sine', 0.22, 0.15), idx * 110);
    });
  }

  public playVictoryFanfare(): void {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.28, 0.2), idx * 160);
    });
  }

  public playDefeatSound(): void {
    const notes = [330, 311.13, 293.66, 220];
    notes.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'sine', 0.4, 0.2), idx * 240);
    });
  }

  // --- Musica di Sottofondo Modale Ciclica ---

  public startBGM(): void {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;

    this.bgmIntervalId = window.setInterval(() => {
      if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

      const note = this.bgmMelody[this.bgmStep % this.bgmMelody.length];
      if (note > 0) {
        const freq = 440 * Math.pow(2, (note - 69) / 12);
        this.playTone(freq, 'triangle', 0.45, 0.04, true);

        // Tamburo di fondo ogni 4 battute
        if (this.bgmStep % 4 === 0) {
          this.playTone(75, 'sine', 0.35, 0.09, true);
        }
      }
      this.bgmStep++;
    }, 450);
  }

  public stopBGM(): void {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.bgmPlaying = false;
  }
}
