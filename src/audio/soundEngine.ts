import { AudioSettings, SubtitleCue } from '../types/game';

type SubtitleListener = (cue: SubtitleCue) => void;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings = {
    musicVolume: 70,
    sfxVolume: 85,
    ambienceVolume: 60,
    muted: false,
    subtitles: true,
    showTouchControls: false,
    screenShake: true,
    highContrastHud: false,
  };

  private musicTimer: number | null = null;
  private ambienceTimer: number | null = null;
  private isPlayingMusic = false;
  private isChaseIntensity = false;
  private stepIndex = 0;
  private subtitleListeners: Set<SubtitleListener> = new Set();

  public updateSettings(newSettings: AudioSettings) {
    this.settings = { ...newSettings };
    if (this.settings.muted && this.ctx && this.ctx.state === 'running') {
      // Keep context alive but volume multipliers will be 0
    }
  }

  public onSubtitle(listener: SubtitleListener): () => void {
    this.subtitleListeners.add(listener);
    return () => {
      this.subtitleListeners.delete(listener);
    };
  }

  private emitSubtitle(speaker: SubtitleCue['speaker'], text: string, color = '#F8FAFC') {
    if (!this.settings.subtitles) return;
    const cue: SubtitleCue = {
      id: `${Date.now()}-${Math.random()}`,
      speaker,
      text,
      color,
      timestamp: Date.now(),
    };
    this.subtitleListeners.forEach((cb) => cb(cue));
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getSfxGain(): number {
    if (this.settings.muted) return 0;
    return (this.settings.sfxVolume / 100) * 0.45;
  }

  private getMusicGain(): number {
    if (this.settings.muted) return 0;
    return (this.settings.musicVolume / 100) * 0.25;
  }

  private getAmbienceGain(): number {
    if (this.settings.muted) return 0;
    return (this.settings.ambienceVolume / 100) * 0.22;
  }

  public playUiClick(pitch = 520) {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.35, now + 0.065);

    gain.gain.setValueAtTime(vol * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playUiHover() {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.035);

    gain.gain.setValueAtTime(vol * 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playFootstep(isSprint: boolean, onElevated: boolean) {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = onElevated ? 165 : 95;
    const sprintBoost = isSprint ? 35 : 0;
    const jitter = (Math.random() - 0.5) * 18;

    osc.type = onElevated ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(baseFreq + sprintBoost + jitter, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.055);

    const stepVol = vol * (isSprint ? 0.42 : 0.24);
    gain.gain.setValueAtTime(stepVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  public playJump() {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(410, now + 0.14);

    gain.gain.setValueAtTime(vol * 0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playLand(heavy = false) {
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(heavy ? 120 : 95, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + (heavy ? 0.14 : 0.09));

    gain.gain.setValueAtTime(vol * (heavy ? 0.7 : 0.4), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.15 : 0.1));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playWhistle() {
    this.emitSubtitle('RADIO', '[SHARP POLICE WHISTLE BLAST — SQUAD CONVERGING]', '#38BDF8');
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2650, now);
    osc.frequency.setValueAtTime(2820, now + 0.12);
    osc.frequency.setValueAtTime(2600, now + 0.25);

    // Pea-whistle trill modulation
    mod.type = 'square';
    mod.frequency.setValueAtTime(48, now);
    modGain.gain.setValueAtTime(140, now);

    mod.connect(modGain);
    modGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol * 0.65, now + 0.03);
    gain.gain.setValueAtTime(vol * 0.65, now + 0.34);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    mod.start(now);
    osc.stop(now + 0.46);
    mod.stop(now + 0.46);
  }

  public playSmokeDecoy() {
    this.emitSubtitle('SFX', '[SMOKE CANISTER HISS — VISUAL COVER DEPLOYED]', '#FF9933');
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    // White noise buffer for smoke hiss
    const bufferSize = ctx.sampleRate * 0.45;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(380, now + 0.42);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  public playObstacleHit() {
    this.emitSubtitle('SFX', '[BARRICADE IMPACT — SPEED REDUCED]', '#F59E0B');
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.16);

    gain.gain.setValueAtTime(vol * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playChaseAlert() {
    this.emitSubtitle('RADIO', 'CONTROL ROOM: "Visual confirmed near Samrat Yantra! All units pursue!"', '#EF4444');
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    [587.33, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);
      gain.gain.setValueAtTime(vol * 0.45, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.19);
    });
  }

  public playStealthConceal() {
    this.emitSubtitle('SYSTEM', '[CROUCHED IN COVER — CONCEALED FROM PATROLS]', '#10B981');
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
    gain.gain.setValueAtTime(vol * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playVictoryFanfare() {
    this.emitSubtitle('SYSTEM', '[MISSION ACCOMPLISHED — OBJECTIVES COMPLETE]', '#10B981');
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.11);
      gain.gain.setValueAtTime(vol * 0.6, now + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.11);
      osc.stop(now + i * 0.11 + 0.36);
    });
  }

  public playDefeatSound() {
    this.emitSubtitle('SYSTEM', '[MISSION FAILED — PERIMETER BREACHED OR CAPTURED]', '#EF4444');
    const ctx = this.ensureContext();
    const vol = this.getSfxGain();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const notes = [392, 349.23, 311.13, 261.63];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.14);
      gain.gain.setValueAtTime(vol * 0.45, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.33);
    });
  }

  public setChaseIntensity(intense: boolean) {
    if (this.isChaseIntensity !== intense) {
      this.isChaseIntensity = intense;
      if (intense) {
        this.playChaseAlert();
      }
    }
  }

  public startGameplayAudio() {
    this.ensureContext();
    if (this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.stepIndex = 0;

    // Rhythmic procedural bass & dhol-inspired percussion loop
    const tickMusic = () => {
      if (!this.isPlayingMusic) return;
      const ctx = this.ctx;
      const mVol = this.getMusicGain();

      if (ctx && mVol > 0 && ctx.state === 'running') {
        const now = ctx.currentTime;
        const bassScale = this.isChaseIntensity
          ? [110, 110, 130.81, 146.83, 110, 164.81, 146.83, 130.81]
          : [110, 0, 110, 130.81, 98, 0, 110, 123.47];

        const note = bassScale[this.stepIndex % bassScale.length];
        if (note > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = this.isChaseIntensity ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(note, now);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(this.isChaseIntensity ? 680 : 360, now);

          gain.gain.setValueAtTime(mVol * (this.isChaseIntensity ? 0.55 : 0.38), now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.17);
        }

        // Syncopated Indian dhol-inspired pulse on beats 0, 3, 6
        if (this.stepIndex % 4 === 0 || (this.isChaseIntensity && this.stepIndex % 2 === 1)) {
          const drum = ctx.createOscillator();
          const dGain = ctx.createGain();
          drum.type = 'sine';
          const isAccent = this.stepIndex % 4 === 0;
          drum.frequency.setValueAtTime(isAccent ? 135 : 210, now);
          drum.frequency.exponentialRampToValueAtTime(48, now + 0.09);

          dGain.gain.setValueAtTime(mVol * (isAccent ? 0.65 : 0.35), now);
          dGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

          drum.connect(dGain);
          dGain.connect(ctx.destination);
          drum.start(now);
          drum.stop(now + 0.11);
        }
      }

      this.stepIndex++;
      const intervalMs = this.isChaseIntensity ? 155 : 230;
      this.musicTimer = window.setTimeout(tickMusic, intervalMs);
    };

    tickMusic();

    // Periodic ambient city & radio chatter cues
    const radioDispatches = [
      { speaker: 'RADIO' as const, text: 'DISPATCH: "Maintain cordons along Sansad Marg and Tolstoy Lane."', color: '#38BDF8' },
      { speaker: 'CROWD' as const, text: '[DISTANT MEGAPHONE CHANTS & DELHI TRAFFIC HORNS]', color: '#FBBF24' },
      { speaker: 'RADIO' as const, text: 'PATROL 4: "Watch the elevated Samrat Yantra steps—runners using high ground!"', color: '#38BDF8' },
      { speaker: 'CROWD' as const, text: '[CROWD CHEERS NEAR SHAMIANA PAVILION TENTS]', color: '#FF9933' },
    ];
    let dispatchIdx = 0;

    this.ambienceTimer = window.setInterval(() => {
      if (!this.isPlayingMusic) return;
      const ctx = this.ctx;
      const aVol = this.getAmbienceGain();
      if (ctx && aVol > 0 && ctx.state === 'running') {
        // Subtle radio squelch or distant horn
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(410 + Math.random() * 140, now);
        gain.gain.setValueAtTime(aVol * 0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      }

      const item = radioDispatches[dispatchIdx % radioDispatches.length];
      this.emitSubtitle(item.speaker, item.text, item.color);
      dispatchIdx++;
    }, 9500);
  }

  public stopGameplayAudio() {
    this.isPlayingMusic = false;
    this.isChaseIntensity = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ambienceTimer !== null) {
      clearInterval(this.ambienceTimer);
      this.ambienceTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
