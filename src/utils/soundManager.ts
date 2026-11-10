import { STORAGE_KEYS, storage } from './storage.ts';

class RetroSoundManager {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private isMusicEnabled = false;
  private musicMode: 'playing' | 'paused' | 'stopped' = 'stopped';
  private musicTimer: ReturnType<typeof setTimeout> | null = null;
  private musicGain: GainNode | null = null;
  private pitchStep = 0;
  private musicStep = 0;

  private audioFiles: Record<string, HTMLAudioElement> = {};

  constructor() {
    const saved = storage.getItem(STORAGE_KEYS.soundEnabled);
    this.isEnabled = saved !== null ? saved === 'true' : true;
    this.isMusicEnabled = storage.getItem(STORAGE_KEYS.musicEnabled) === 'true';

    if (typeof window !== 'undefined') {
      try {
        this.audioFiles = {
          button_click: new Audio('/audio/button_click_sound.wav'),
          eat: new Audio('/audio/eat_sound.wav'),
          crash: new Audio('/audio/crash_sound.wav'),
        };
      } catch (error) {
        console.warn('Unable to initialize audio fallbacks:', error);
      }
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch (error) {
          console.warn('Unable to initialize Web Audio:', error);
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch((error: unknown) => {
        console.warn('Unable to resume audio context:', error);
      });
    }
    return this.ctx;
  }

  private playFallback(name: string) {
    const audio = this.audioFiles[name];
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch((error: unknown) => {
      console.warn(`Unable to play ${name} fallback audio:`, error);
    });
  }

  public setSoundEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    storage.setItem(STORAGE_KEYS.soundEnabled, String(enabled));
  }

  public getSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    storage.setItem(STORAGE_KEYS.musicEnabled, String(enabled));
    if (enabled) {
      this.initCtx();
      this.startMusicLoop();
    }
    else this.stopMusicLoop();
  }

  public getMusicEnabled(): boolean {
    return this.isMusicEnabled;
  }

  public setMusicMode(mode: 'playing' | 'paused' | 'stopped') {
    this.musicMode = mode;
    if (mode === 'stopped' || !this.isMusicEnabled) {
      this.stopMusicLoop();
      return;
    }
    this.startMusicLoop();
    if (this.musicGain && this.ctx) {
      const target = mode === 'paused' ? 0.008 : 0.035;
      this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
    }
  }

  private startMusicLoop() {
    if (!this.isMusicEnabled || this.musicMode === 'stopped' || this.musicTimer) return;
    const ctx = this.initCtx();
    if (!ctx) return;
    if (!this.musicGain) {
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = this.musicMode === 'paused' ? 0.008 : 0.035;
      this.musicGain.connect(ctx.destination);
    }
    const notes = [262, 330, 392, 330, 294, 349, 440, 349, 262, 330, 392, 523, 440, 392, 330, 294];
    const playNextNote = () => {
      if (!this.isMusicEnabled || this.musicMode === 'stopped' || !this.ctx || !this.musicGain) {
        this.musicTimer = null;
        return;
      }
      const now = this.ctx.currentTime;
      const oscillator = this.ctx.createOscillator();
      const envelope = this.ctx.createGain();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(notes[this.musicStep % notes.length], now);
      envelope.gain.setValueAtTime(1, now);
      envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      oscillator.connect(envelope);
      envelope.connect(this.musicGain);
      oscillator.start(now);
      oscillator.stop(now + 0.14);
      this.musicStep = (this.musicStep + 1) % notes.length;
      this.musicTimer = setTimeout(playNextNote, 180);
    };
    playNextNote();
  }

  private stopMusicLoop() {
    if (this.musicTimer) clearTimeout(this.musicTimer);
    this.musicTimer = null;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
    }
  }

  public playButtonClick() {
    if (!this.isEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) {
      this.playFallback('button_click');
      return;
    }
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (error) {
      console.warn('Unable to play button sound:', error);
    }
  }

  public playEat() {
    if (!this.isEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) {
      this.playFallback('eat');
      return;
    }
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const pentatonicSemitones = [0, 2, 4, 7, 9, 12, 14, 16];
      const frequency = 450 * 2 ** (pentatonicSemitones[this.pitchStep] / 12);
      this.pitchStep = (this.pitchStep + 1) % pentatonicSemitones.length;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (error) {
      console.warn('Unable to play food sound:', error);
    }
  }

  public playBonusEat() {
    if (!this.isEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) {
      this.playFallback('eat');
      return;
    }

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.08);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(987.77, now + 0.08);
      gain2.gain.setValueAtTime(0.18, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.18);
    } catch (error) {
      console.warn('Unable to play bonus food sound:', error);
    }
  }

  public playGoldenEat() {
    if (!this.isEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) {
      this.playFallback('eat');
      return;
    }
    try {
      const now = ctx.currentTime;
      [880, 1108.73, 1318.51, 1760].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.12, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * 0.04 + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + (idx + 1) * 0.04 + 0.03);
      });
    } catch (error) {
      console.warn('Unable to play golden food sound:', error);
    }
  }

  public playIceEat() {
    if (!this.isEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) {
      this.playFallback('eat');
      return;
    }
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (error) {
      console.warn('Unable to play ice food sound:', error);
    }
  }

  public playPoisonEat() {
    if (!this.isEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) {
      this.playFallback('crash');
      return;
    }
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (error) {
      console.warn('Unable to play poison sound:', error);
    }
  }

  public playMysteryEat() {
    if (!this.isEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) {
      this.playFallback('eat');
      return;
    }
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.16);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (error) {
      console.warn('Unable to play mystery sound:', error);
    }
  }

  public playCrash() {
    if (!this.isEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) {
      this.playFallback('crash');
      return;
    }
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (error) {
      console.warn('Unable to play crash sound:', error);
    }
  }

  public playTick() {
    if (!this.isEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.03);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch (error) {
      console.warn('Unable to play tick sound:', error);
    }
  }
}

export const soundManager = new RetroSoundManager();
