// Sound system — opt-in, preloaded on first interaction
// Sound files go in client/public/sounds/

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

  constructor() {
    this._enabled = localStorage.getItem('lbjj_sound_enabled') === 'true';
  }

  preload(keys: SoundKey[]) {
    keys.forEach(key => {
      try {
        const audio = new Audio(SOUND_REGISTRY[key]);
        audio.preload = 'auto';
        audio.volume = 0.6;
        this.cache.set(key, audio);
      } catch {}
    });
  }

  play(key: SoundKey) {
    if (!this._enabled) return;
    try {
      const cached = this.cache.get(key);
      const audio = cached || new Audio(SOUND_REGISTRY[key]);
      audio.currentTime = 0;
      audio.volume = 0.6;
      audio.play().catch(() => {});
      if (!cached) this.cache.set(key, audio);
    } catch {}
  }

  setEnabled(val: boolean) {
    this._enabled = val;
    localStorage.setItem('lbjj_sound_enabled', String(val));
  }

  get isEnabled() { return this._enabled; }
}

export const soundSystem = new SoundSystem();
export type { SoundKey };
