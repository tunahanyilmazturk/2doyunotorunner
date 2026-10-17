// Ses katmanı: olay → ses eşlemesi, yoğunluk freni ve "ses asla oyunu bozmaz"
// garantisi. Tarayıcı gerektirmeyen kısımlar burada; gerçek çalma elle denenir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus.js';
import { Events } from '../src/core/events.js';
import { AudioSystem } from '../src/systems/AudioSystem.js';

function makeGame(settings = {}) {
  return { bus: new EventBus(), state: { settings: { audio: true, volume: 0.5, ...settings } } };
}

/** Sahte WebAudio bağlamı: çalmayı değil, karar mantığını sınar. */
function fakeCtx({ fail = false } = {}) {
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  });
  const node = (extra = {}) => ({ connect: (n) => n, ...extra });
  return {
    state: 'running',
    currentTime: 0,
    sampleRate: 8000,
    destination: node(),
    resume: () => Promise.resolve(),
    createGain: () => {
      if (fail) throw new Error('ses aygıtı yok');
      return node({ gain: param() });
    },
    createOscillator: () => node({ type: '', frequency: param(), start() {}, stop() {} }),
    createBufferSource: () => node({ buffer: null, start() {}, stop() {} }),
    createBiquadFilter: () => node({ type: '', Q: { value: 0 }, frequency: param() }),
    createBuffer: (channels, length) => ({ getChannelData: () => new Float32Array(length) }),
  };
}

/** Sistemin sesini yakalamak için play'i değiştirir. */
function spy(settings) {
  const game = makeGame(settings);
  const sys = new AudioSystem(game);
  const names = [];
  sys.play = (name) => names.push(name);
  return { game, sys, names };
}

test('tarayıcı olmadan kurulabilir ve sessizce çalışır', () => {
  const game = makeGame();
  const sys = new AudioSystem(game);
  assert.equal(sys.supported, false, 'Node ortamında AudioContext yok');
  assert.equal(sys.play('hit'), false);
  assert.equal(sys.play('olmayanSes'), false);
});

test('ses kapalıyken hiçbir şey çalmaz', () => {
  const game = makeGame({ audio: false });
  const sys = new AudioSystem(game);
  sys.ctx = fakeCtx();
  sys.master = { gain: { value: 0 } };
  assert.equal(sys.play('hit'), false);
});

test('olaylar doğru seslere eşlenir', () => {
  const { game, names } = spy();
  game.bus.emit(Events.DAMAGE_DEALT, { crit: false });
  game.bus.emit(Events.DAMAGE_DEALT, { crit: true });
  game.bus.emit(Events.MONSTER_KILLED, { monster: { isBoss: false } });
  game.bus.emit(Events.MONSTER_KILLED, { monster: { isBoss: true } });
  game.bus.emit(Events.BOSS_SPAWNED, { monster: {} });
  game.bus.emit(Events.BOSS_FAILED, {});
  game.bus.emit(Events.BIOME_CHANGED, {});
  game.bus.emit(Events.LOOT_DROPPED, { item: { tier: 3 }, autoSold: false });
  game.bus.emit(Events.UPGRADE_BOUGHT, {});
  game.bus.emit(Events.ITEM_SOLD, {});
  game.bus.emit(Events.POTION_USED, {});
  game.bus.emit(Events.SKILL_CAST, { skill: {} });
  game.bus.emit(Events.ITEM_ENHANCED, {});
  game.bus.emit(Events.CHEST_OPENED, {});
  game.bus.emit(Events.ACHIEVEMENT_UNLOCKED, { silent: false });
  game.bus.emit(Events.PRESTIGE, {});
  game.bus.emit(Events.PLAYER_DIED, {});
  game.bus.emit(Events.OFFLINE_REWARD, {});
  assert.deepEqual(names, [
    'hit', 'crit', 'kill', 'bossKill', 'bossSpawn', 'bossFail', 'biome', 'loot',
    'buy', 'sell', 'potion', 'skill', 'forge', 'chest', 'achievement', 'prestige',
    'death', 'reward',
  ]);
});

test('otomatik satılan eşya ve sessiz başarım ses çıkarmaz', () => {
  const { game, names } = spy();
  game.bus.emit(Events.LOOT_DROPPED, { item: { tier: 0 }, autoSold: true });
  game.bus.emit(Events.ACHIEVEMENT_UNLOCKED, { silent: true });
  assert.deepEqual(names, []);
});

test('aynı ses çok sık çalmaz (bekleme süresi)', () => {
  const sys = new AudioSystem(makeGame());
  const ctx = fakeCtx();
  sys.ctx = ctx;
  sys.master = { gain: { value: 1 } };
  assert.equal(sys.play('hit'), true, 'ilk vuruş çalmalı');
  assert.equal(sys.play('hit'), false, 'aynı karede tekrar çalmamalı');
  ctx.currentTime = 0.02;
  assert.equal(sys.play('hit'), false, 'bekleme süresi dolmadı');
  ctx.currentTime = 0.2;
  assert.equal(sys.play('hit'), true, 'süre dolunca çalmalı');
});

test('saniyelik üst sınır aşılmaz: 3x hızda ses yığılmaz', () => {
  const sys = new AudioSystem(makeGame());
  const ctx = fakeCtx();
  sys.ctx = ctx;
  sys.master = { gain: { value: 1 } };
  // Saniyede 100 olay: 3x hızda yoğun bir boss savaşının üstü bile.
  const names = Object.keys({ hit: 1, crit: 1, kill: 1, loot: 1, buy: 1, sell: 1, ui: 1 });
  let played = 0;
  for (let i = 0; i < 100; i++) {
    ctx.currentTime = i * 0.01;
    if (sys.play(names[i % names.length])) played++;
  }
  assert.ok(played <= 26, `bir saniyede en fazla 26 ses çalmalı, ${played} çaldı`);
  assert.ok(played >= 10, `tamamen sessizleşmemeli (${played})`);
});

test('bozuk ses bağlamı oyunu bozmaz', () => {
  const sys = new AudioSystem(makeGame());
  sys.ctx = fakeCtx({ fail: true });
  sys.master = { gain: { value: 1 } };
  assert.equal(sys.play('hit'), false, 'hata yutulmalı');
});

test('ayar değişikliği sesi anında kapatır', () => {
  const game = makeGame();
  const sys = new AudioSystem(game);
  sys.ctx = fakeCtx();
  sys.master = { gain: { value: 1 } };
  assert.equal(sys.play('hit'), true);
  game.state.settings.audio = false;
  game.bus.emit(Events.SETTINGS_CHANGED, game.state.settings);
  assert.equal(sys.enabled, false);
  sys.ctx.currentTime = 5;
  assert.equal(sys.play('hit'), false, 'kapalıyken çalmamalı');
});

test('ses düzeyi 0..1 aralığına sıkıştırılır', () => {
  const game = makeGame({ volume: 0.5 });
  const sys = new AudioSystem(game);
  sys.ctx = fakeCtx();
  sys.master = { gain: { value: 0 } };
  sys.applySettings({ audio: true, volume: 3 });
  assert.equal(sys.volume, 1);
  assert.equal(sys.master.gain.value, 1);
  sys.applySettings({ audio: true, volume: -2 });
  assert.equal(sys.volume, 0);
  sys.applySettings({ audio: false, volume: 0.5 });
  assert.equal(sys.master.gain.value, 0, 'kapalıyken ana kazanç sıfır');
});
