import { Events } from '../core/events.js';

// Prosedürel ses katmanı: hazır ses dosyası yok, her ses osilatör/gürültü ile
// üretilir. Böylece depoda ikili varlık ve lisans sorunu olmaz.
//
// Tarayıcı politikası: AudioContext yalnızca ilk kullanıcı etkileşiminden sonra
// çalışır. Bu yüzden bağlam ilk dokunuş/tuşta açılır; açılmadan `play` sessizce
// başarısız olur (oyunu etkilemez).
//
// Yoğunluk freni: 3x hızda saniyede onlarca vuruş olur. Ses başına bekleme +
// saniyelik üst sınır olmadan ses yığılır ve donma hissi yaratır.
const MAX_PER_SECOND = 26;
const noiseCache = new WeakMap();

function noiseBuffer(ctx) {
  let buffer = noiseCache.get(ctx);
  if (buffer) return buffer;
  const length = Math.floor(ctx.sampleRate * 0.3);
  buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Deterministik gürültü: aynı ses her çalışta benzer duyulsun.
  let seed = 1234567;
  for (let i = 0; i < length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    data[i] = (seed / 0x3fffffff) - 1;
  }
  noiseCache.set(ctx, buffer);
  return buffer;
}

/** Tek osilatörlü kısa ton; `to` verilirse perde süpürülür. */
function tone(ctx, out, { from, to = from, dur = 0.08, gain = 0.15, type = 'square', at = 0, delay = 0 }) {
  const t = at + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

/** Bant geçiren gürültü: vuruş, patlama, kılıç sesi. */
function noise(ctx, out, { dur = 0.12, gain = 0.1, freq = 1400, q = 1.2, at = 0, to = null, delay = 0 }) {
  const t = at + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freq, t);
  if (to) filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(out);
  src.start(t);
  src.stop(t + dur + 0.03);
}

/** Ses tarifleri: `cooldown` saniye cinsinden aynı sesin en kısa tekrar aralığı. */
const RECIPES = {
  hit: { cooldown: 0.045, make: (c, o, t) => tone(c, o, { from: 300, to: 170, dur: 0.05, gain: 0.07, type: 'square', at: t }) },
  crit: {
    cooldown: 0.07,
    make: (c, o, t) => {
      tone(c, o, { from: 760, to: 420, dur: 0.07, gain: 0.1, type: 'square', at: t });
      tone(c, o, { from: 1140, to: 620, dur: 0.05, gain: 0.05, type: 'triangle', at: t, delay: 0.02 });
    },
  },
  kill: {
    cooldown: 0.06,
    make: (c, o, t) => {
      noise(c, o, { dur: 0.1, gain: 0.08, freq: 900, to: 300, at: t });
      tone(c, o, { from: 240, to: 90, dur: 0.1, gain: 0.08, type: 'sawtooth', at: t });
    },
  },
  bossKill: {
    cooldown: 1,
    make: (c, o, t) => {
      [523, 659, 784, 1047].forEach((f, i) => tone(c, o, { from: f, dur: 0.14, gain: 0.11, type: 'square', at: t, delay: i * 0.07 }));
      noise(c, o, { dur: 0.3, gain: 0.07, freq: 500, to: 180, at: t });
    },
  },
  death: {
    cooldown: 0.5,
    make: (c, o, t) => [392, 311, 233].forEach((f, i) => tone(c, o, { from: f, dur: 0.16, gain: 0.11, type: 'triangle', at: t, delay: i * 0.11 })),
  },
  playerHit: { cooldown: 0.09, make: (c, o, t) => tone(c, o, { from: 180, to: 110, dur: 0.08, gain: 0.08, type: 'square', at: t }) },
  warning: {
    cooldown: 0.7,
    make: (c, o, t) => {
      tone(c, o, { from: 880, dur: 0.08, gain: 0.09, type: 'square', at: t });
      tone(c, o, { from: 660, dur: 0.09, gain: 0.09, type: 'square', at: t, delay: 0.11 });
    },
  },
  bossSpawn: {
    cooldown: 1.2,
    make: (c, o, t) => {
      tone(c, o, { from: 110, to: 220, dur: 0.5, gain: 0.12, type: 'sawtooth', at: t });
      tone(c, o, { from: 440, to: 880, dur: 0.35, gain: 0.06, type: 'square', at: t, delay: 0.12 });
      noise(c, o, { dur: 0.4, gain: 0.05, freq: 300, to: 1200, at: t });
    },
  },
  bossFail: {
    cooldown: 1.2,
    make: (c, o, t) => [330, 262, 196].forEach((f, i) => tone(c, o, { from: f, to: f * 0.8, dur: 0.2, gain: 0.1, type: 'sawtooth', at: t, delay: i * 0.13 })),
  },
  biome: {
    cooldown: 1.5,
    make: (c, o, t) => [523, 698, 880].forEach((f, i) => tone(c, o, { from: f, dur: 0.16, gain: 0.07, type: 'triangle', at: t, delay: i * 0.09 })),
  },
  loot: {
    cooldown: 0.08,
    make: (c, o, t, tier = 0) => tone(c, o, { from: 520 + tier * 95, to: 700 + tier * 130, dur: 0.09, gain: 0.07, type: 'triangle', at: t }),
  },
  buy: {
    cooldown: 0.08,
    make: (c, o, t) => {
      tone(c, o, { from: 560, dur: 0.06, gain: 0.09, type: 'square', at: t });
      tone(c, o, { from: 840, dur: 0.08, gain: 0.08, type: 'square', at: t, delay: 0.05 });
    },
  },
  sell: { cooldown: 0.08, make: (c, o, t) => tone(c, o, { from: 640, to: 420, dur: 0.07, gain: 0.07, type: 'triangle', at: t }) },
  potion: { cooldown: 0.2, make: (c, o, t) => tone(c, o, { from: 420, to: 900, dur: 0.14, gain: 0.08, type: 'sine', at: t }) },
  skill: {
    cooldown: 0.12,
    make: (c, o, t) => {
      noise(c, o, { dur: 0.22, gain: 0.09, freq: 400, to: 2600, q: 0.8, at: t });
      tone(c, o, { from: 300, to: 1200, dur: 0.16, gain: 0.05, type: 'triangle', at: t });
    },
  },
  forge: {
    cooldown: 0.15,
    make: (c, o, t) => {
      tone(c, o, { from: 1320, dur: 0.12, gain: 0.08, type: 'square', at: t });
      tone(c, o, { from: 1980, dur: 0.1, gain: 0.04, type: 'sine', at: t, delay: 0.02 });
    },
  },
  chest: {
    cooldown: 0.5,
    make: (c, o, t) => {
      [784, 988, 1319].forEach((f, i) => tone(c, o, { from: f, dur: 0.18, gain: 0.08, type: 'triangle', at: t, delay: i * 0.08 }));
      noise(c, o, { dur: 0.25, gain: 0.05, freq: 2200, to: 900, at: t });
    },
  },
  achievement: {
    cooldown: 0.6,
    make: (c, o, t) => {
      [880, 1175].forEach((f, i) => tone(c, o, { from: f, dur: 0.22, gain: 0.08, type: 'sine', at: t, delay: i * 0.12 }));
    },
  },
  prestige: {
    cooldown: 2,
    make: (c, o, t) => {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(c, o, { from: f, dur: 0.3, gain: 0.08, type: 'triangle', at: t, delay: i * 0.1 }));
    },
  },
  reward: {
    cooldown: 0.6,
    make: (c, o, t) => {
      tone(c, o, { from: 1047, to: 1568, dur: 0.1, gain: 0.07, type: 'square', at: t });
      tone(c, o, { from: 784, to: 1175, dur: 0.12, gain: 0.07, type: 'square', at: t, delay: 0.09 });
    },
  },
  hatch: {
    cooldown: 0.5,
    make: (c, o, t) => {
      tone(c, o, { from: 880, to: 1320, dur: 0.08, gain: 0.06, type: 'sine', at: t });
      tone(c, o, { from: 1100, to: 1650, dur: 0.08, gain: 0.06, type: 'sine', at: t, delay: 0.08 });
      tone(c, o, { from: 1320, to: 1980, dur: 0.1, gain: 0.06, type: 'sine', at: t, delay: 0.16 });
    },
  },
  levelUp: {
    cooldown: 0.4,
    make: (c, o, t) => {
      tone(c, o, { from: 523, to: 784, dur: 0.1, gain: 0.06, type: 'square', at: t });
      tone(c, o, { from: 659, to: 988, dur: 0.12, gain: 0.06, type: 'square', at: t, delay: 0.1 });
    },
  },
  rune: { cooldown: 0.15, make: (c, o, t) => tone(c, o, { from: 1400, to: 2100, dur: 0.12, gain: 0.05, type: 'sine', at: t }) },
  towerClear: {
    cooldown: 0.6,
    make: (c, o, t) => {
      tone(c, o, { from: 392, to: 523, dur: 0.12, gain: 0.07, type: 'triangle', at: t });
      tone(c, o, { from: 523, to: 784, dur: 0.14, gain: 0.07, type: 'triangle', at: t, delay: 0.12 });
    },
  },
  ui: { cooldown: 0.03, make: (c, o, t) => tone(c, o, { from: 700, dur: 0.03, gain: 0.04, type: 'square', at: t }) },
};

const clamp01 = (v) => (Number.isFinite(Number(v)) ? Math.min(1, Math.max(0, Number(v))) : 0.7);

// Olay → ses eşlemesi tek yerde durur; sistemler sesi doğrudan çağırmaz.
const EVENT_SOUNDS = [
  [Events.DAMAGE_DEALT, (p) => (p.crit ? 'crit' : 'hit')],
  [Events.MONSTER_KILLED, (p) => (p.monster?.isBoss ? 'bossKill' : 'kill')],
  [Events.PLAYER_HIT, () => 'playerHit'],
  [Events.PLAYER_DIED, () => 'death'],
  [Events.HEAVY_WARNING, () => 'warning'],
  [Events.BOSS_SPAWNED, () => 'bossSpawn'],
  [Events.BOSS_FAILED, () => 'bossFail'],
  [Events.BIOME_CHANGED, () => 'biome'],
  [Events.LOOT_DROPPED, (p) => (p.autoSold ? null : 'loot'), (p) => p.item?.tier ?? 0],
  [Events.UPGRADE_BOUGHT, () => 'buy'],
  [Events.ITEM_SOLD, () => 'sell'],
  [Events.POTION_USED, () => 'potion'],
  [Events.SKILL_CAST, () => 'skill'],
  [Events.ITEM_ENHANCED, () => 'forge'],
  [Events.CHEST_OPENED, () => 'chest'],
  [Events.ACHIEVEMENT_UNLOCKED, (p) => (p.silent ? null : 'achievement')],
  [Events.PRESTIGE, () => 'prestige'],
  [Events.OFFLINE_REWARD, () => 'reward'],
  [Events.COMPANION_HATCHED, () => 'hatch'],
  [Events.COMPANION_LEVELED, () => 'levelUp'],
  [Events.RUNE_FOUND, () => 'rune'],
  [Events.TOWER_FLOOR_CLEARED, () => 'towerClear'],
];

export class AudioSystem {
  constructor(game) {
    this.game = game;
    this.ctx = null;
    this.master = null;
    this.supported = typeof globalThis.AudioContext === 'function' || typeof globalThis.webkitAudioContext === 'function';
    this.enabled = game.state.settings.audio !== false;
    this.volume = clamp01(game.state.settings.volume);
    this.lastPlayed = new Map();
    this.recent = [];
    this.suspended = false;

    for (const [event, pick, arg] of EVENT_SOUNDS) {
      game.bus.on(event, (payload) => {
        const name = pick(payload);
        if (name) this.play(name, arg ? arg(payload) : undefined);
      });
    }
    game.bus.on(Events.SETTINGS_CHANGED, (settings) => this.applySettings(settings));
    this.listenForGesture();
  }

  /**
   * Bağlamı ilk kullanıcı etkileşiminde açar. Zamanlayıcılar/gürültü düğümleri
   * yalnızca gerçek bir tuş/dokunuştan sonra kurulur; aksi halde tarayıcı
   * bağlamı askıya alır ve konsola uyarı basar.
   */
  listenForGesture() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      const ctx = this.ensureContext();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  ensureContext() {
    if (this.ctx || !this.supported) return this.ctx;
    const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
    try {
      this.ctx = new Ctor();
    } catch {
      this.supported = false;
      return null;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? this.volume : 0;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  applySettings(settings = this.game.state.settings) {
    this.enabled = settings.audio !== false;
    this.volume = clamp01(settings.volume);
    if (this.master) this.master.gain.value = this.enabled ? this.volume : 0;
  }

  /** @returns {boolean} ses gerçekten çaldı mı (testte ve teşhiste işe yarar) */
  play(name, payload) {
    const recipe = RECIPES[name];
    if (!recipe || !this.enabled) return false;
    if (name === 'ui' && this.game.state.settings.uiSounds === false) return false;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return false;

    const now = ctx.currentTime;
    if (now - (this.lastPlayed.get(name) ?? -Infinity) < recipe.cooldown) return false;
    this.recent = this.recent.filter((at) => now - at < 1);
    if (this.recent.length >= MAX_PER_SECOND) return false;

    this.lastPlayed.set(name, now);
    this.recent.push(now);
    try {
      recipe.make(ctx, this.master, now, payload);
    } catch {
      return false; // ses asla oyunu bozmasın
    }
    return true;
  }
}
