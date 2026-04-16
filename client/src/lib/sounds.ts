// Sound system — ON by default, preloaded on first user interaction
// Sound files live in client/public/sounds/

const SOUND_REGISTRY = {
  checkin:     '/sounds/checkin.mp3',
  xpEarn:      '/sounds/xp-earn.mp3',
  levelUp:     '/sounds/level-up.mp3',
  achievement: '/sounds/achievement.mp3',
  beltPromo:   '/sounds/belt-promo.mp3',
  streak:      '/sounds/streak.mp3',
} as const;

type SoundKey = keyof typeof SOUND_REGISTRY;

class SoundSystem {
  private cache: Map<SoundKey, HTMLAudioElement> = new Map();
  private _enabled: boolean;
  private _unlocked = false;
  private _pendingPlay: SoundKey | null = null;

  constructor() {
    // Default ON — only off if the user has explicitly disabled it
    const stored = localStorage.getItem('lbjj_sound_enabled');
    this._enabled = stored === null ? true : stored === 'true';

    // Persist the default so future reads are consistent
    if (stored === null) {
      try { localStorage.setItem('lbjj_sound_enabled', 'true'); } catch {}
    }

    // Register one-time unlock on any user gesture (required by iOS/Android)
    // We do this regardless of enabled state so it's ready when toggled on
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this._unlock();
        window.removeEventListener('touchstart', unlock, true);
        window.removeEventListener('mousedown', unlock, true);
      };
      window.addEventListener('touchstart', unlock, { once: true, passive: true, capture: true });
      window.addEventListener('mousedown',   unlock, { once: true, passive: true, capture: true });
    }
  }

  // Play a silent 0-duration buffer to unlock the audio context on iOS/Safari
  private _unlock() {
    if (this._unlocked) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        ctx.resume().then(() => {
          this._unlocked = true;
          // Preload all sounds now that the context is live
          this._preloadAll();
          // Fire any sound that was queued before unlock
          if (this._pendingPlay) {
            const key = this._pendingPlay;
            this._pendingPlay = null;
            setTimeout(() => this.play(key), 50);
          }
        }).catch(() => {
          this._unlocked = true;
          this._preloadAll();
        });
      } else {
        this._unlocked = true;
        this._preloadAll();
      }
    } catch {
      this._unlocked = true;
      this._preloadAll();
    }
  }

  private _preloadAll() {
    (Object.keys(SOUND_REGISTRY) as SoundKey[]).forEach(key => {
      if (!this.cache.has(key)) {
        try {
          const audio = new Audio(SOUND_REGISTRY[key]);
          audio.preload = 'auto';
          audio.volume = 0.6;
          // Load it into the buffer
          audio.load();
          this.cache.set(key, audio);
        } catch {}
      }
    });
  }

  /** Manually preload a subset — kept for backwards compat with existing call sites */
  preload(keys: SoundKey[]) {
    keys.forEach(key => {
      if (!this.cache.has(key)) {
        try {
          const audio = new Audio(SOUND_REGISTRY[key]);
          audio.preload = 'auto';
          audio.volume = 0.6;
          audio.load();
          this.cache.set(key, audio);
        } catch {}
      }
    });
  }

  play(key: SoundKey) {
    if (!this._enabled) return;

    // If not yet unlocked (first gesture hasn't fired), queue and wait
    if (!this._unlocked) {
      this._pendingPlay = key;
      return;
    }

    try {
      const cached = this.cache.get(key);
      const audio = cached ?? new Audio(SOUND_REGISTRY[key]);
      // Reset so rapid re-plays work (e.g. multiple check-ins)
      audio.currentTime = 0;
      audio.volume = 0.6;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((err) => {
          // NotAllowedError = audio context still blocked — try to re-unlock
          if (err?.name === 'NotAllowedError') {
            this._unlocked = false;
            this._pendingPlay = key;
            const retry = () => {
              this._unlock();
              window.removeEventListener('touchstart', retry, true);
              window.removeEventListener('mousedown',   retry, true);
            };
            window.addEventListener('touchstart', retry, { once: true, passive: true, capture: true });
            window.addEventListener('mousedown',   retry, { once: true, passive: true, capture: true });
          }
        });
      }
      if (!cached) this.cache.set(key, audio);
    } catch {}
  }

  setEnabled(val: boolean) {
    this._enabled = val;
    try { localStorage.setItem('lbjj_sound_enabled', String(val)); } catch {}
    // Preload immediately when turning on so first play isn't delayed
    if (val && this._unlocked) this._preloadAll();
  }

  get isEnabled() { return this._enabled; }
}

export const soundSystem = new SoundSystem();
export type { SoundKey };
