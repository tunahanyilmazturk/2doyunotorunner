// UpgradeSystem sözleşmesi: mod aşırı yükleme (Shift/Ctrl), "En iyisini al",
// aday havuzu ve oto-alım profilleri. Danışman matematiği ayrı dosyada test edilir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAYER_BASE } from '../src/config/balance.js';
import { Events } from '../src/core/events.js';
import { EventBus } from '../src/core/EventBus.js';
import { createDefaultState } from '../src/core/GameState.js';
import { UPGRADE_MAP } from '../src/data/upgrades.js';
import { UpgradeSystem } from '../src/systems/UpgradeSystem.js';

/** Yükseltme sistemini taşıyan en küçük oyun: gerçek EventBus ve kayıt defteri. */
function makeGame({ gold = 0, autoBuy = true, profile = 'cheapest', raw = {}, stage = 1 } = {}) {
  const state = createDefaultState();
  state.gold = gold;
  state.stage = stage;
  state.settings.autoBuy = autoBuy;
  state.settings.autoBuyProfile = profile;
  state.stats.prestiges = 1; // oto-alımın kilidi bu sayaçla açılır
  const bus = new EventBus();
  const bought = [];
  bus.on(Events.UPGRADE_BOUGHT, (p) => bought.push(p));
  const game = {
    state,
    bus,
    bought,
    tree: { perk: () => 0 },
    stats: { get: () => ({ raw: { ...PLAYER_BASE, ...raw } }) },
    economy: {
      spend(cost) {
        if (state.gold < cost) return false;
        state.gold -= cost;
        return true;
      },
    },
  };
  game.upgrades = new UpgradeSystem(game);
  return game;
}

test('buy verilen modu kullanır (Shift/Ctrl kısayolu)', () => {
  const game = makeGame({ gold: 1e9 });
  const sys = game.upgrades;
  sys.buyMode = 1;

  assert.equal(sys.buy('power', 10), true, 'x10 alım');
  assert.equal(sys.level('power'), 10, 'x10 modu 10 seviye almalı');

  const before = game.state.gold;
  assert.equal(sys.buy('power', 'max'), true, 'MAKS alım');
  assert.ok(sys.level('power') > 10, 'MAKS seviyeyi yükseltmeli');
  assert.ok(game.state.gold < before, 'MAKS altın harcamalı');
  assert.equal(sys.buy('boyle-bir-sey', 1), false, 'bilinmeyen kimlik');
});

test('buyBest en verimli satırı seçer ve altını aşmaz', () => {
  const game = makeGame({ gold: 1000 });
  const sys = game.upgrades;

  const n = sys.buyBest();
  assert.ok(n > 0, 'en az bir seviye alınmalı');
  assert.ok(sys.level('power') > 0, 'başlangıçta en verimli satır Güç');
  assert.ok(sys.level('power') >= sys.level('vitality'));
  assert.ok(game.state.gold >= 0, 'altın eksiye düşmemeli');
  assert.ok(game.state.gold < 1000, 'altın harcanmalı');
});

test('buyBest parası bitince durur', () => {
  const game = makeGame({ gold: 15 });
  const sys = game.upgrades;
  assert.equal(sys.buyBest(), 1, 'tek seviye alınır (10), sonra 12 yetmez…');
  assert.equal(game.state.gold, 5);
});

test('aday havuzu işaretsiz ve pahalı satırları eler', () => {
  const game = makeGame({ gold: 50 });
  const sys = game.upgrades;
  sys.setRowAuto('power', false);

  const pool = sys.affordable(1);
  const ids = pool.map((r) => r.up.id);
  assert.ok(!ids.includes('power'), 'işaretsiz satır aday olmamalı');
  assert.ok(!ids.includes('greed'), 'parası yetmeyen satır aday olmamalı (60 > 50)');
  assert.ok(ids.includes('vitality') && ids.includes('regen'), 'ucuz satırlar aday');
  for (const r of pool) assert.ok(r.eff > 0, `${r.up.id}: verim hesaplanmalı`);
});

test('makslanan yükseltme aday havuzuna girmez', () => {
  const game = makeGame({ gold: 1e9, profile: 'cheapest' });
  const sys = game.upgrades;
  sys.state.upgrades.precision = UPGRADE_MAP.precision.maxLevel;

  assert.ok(!sys.affordable(1).some((r) => r.up.id === 'precision'), 'makslı satır aday olmamalı');
});

test('oto-alım profili ilk tercihi değiştirir', () => {
  const firstBuy = (profile) => {
    const game = makeGame({ gold: 1000, profile });
    game.upgrades.update(1);
    return game.bought[0]?.id;
  };

  assert.equal(firstBuy('cheapest'), 'power', 'en ucuz satır (Güç 10)');
  assert.equal(firstBuy('damage'), 'power', 'hasar profili');
  assert.equal(firstBuy('survive'), 'vitality', 'hayatta kalma profili');
  assert.equal(firstBuy('gold'), 'greed', 'altın profili');
  assert.equal(firstBuy('value'), 'power', 'verim profili');
});

test('setProfile kaydeder, bilinmeyen kimliği varsayılana çeker', () => {
  const game = makeGame({ gold: 0 });
  game.upgrades.setProfile('gold');
  assert.equal(game.state.settings.autoBuyProfile, 'gold');
  game.upgrades.setProfile('boyle-bir-profil-yok');
  assert.equal(game.state.settings.autoBuyProfile, 'cheapest');
});
