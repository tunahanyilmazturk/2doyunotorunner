import assert from 'node:assert/strict';
import test from 'node:test';
import { playerDollBox } from '../src/render/sprites/PlayerSprite.js';

// Karakter panelindeki "kağıt bebek" çerçevesi. Kutu yanlış hesaplanırsa figür
// ya taşar ya da minicik kalır; bu testler o sözleşmeyi kilitler.

const slots = ['helmet', 'amulet', 'cape', 'weapon', 'shield', 'armor', 'gloves', 'belt', 'ring', 'boots'];
const blank = () => Object.fromEntries(slots.map((slot) => [slot, null]));
const gear = (slot, extra = {}) => ({ slot, tier: 4, level: 40, name: 'Test', stats: {}, ...extra });
const KINDS = ['sword', 'axe', 'hammer', 'spear', 'dagger'];

test('boş ekipmanda bebek kutusu sabit taban kutuya eşit', () => {
  assert.deepEqual(playerDollBox(blank()), { minX: -23, maxX: 23, minY: -80, maxY: 2 });
});

test('her silah türü kutuya sığar ve dikey kalır', () => {
  for (const kind of KINDS) {
    const box = playerDollBox({ ...blank(), weapon: gear('weapon', { kind }) });
    const w = box.maxX - box.minX;
    const h = box.maxY - box.minY;
    // Taban kutu (gövde) her durumda korunur
    assert.ok(box.minX <= -23 && box.maxX >= 23 && box.minY <= -80 && box.maxY >= 2, `${kind}: taban kutu korunmadı`);
    // Aşırı büyürse ölçek küçülür ve yuvalar figüre göre kayar
    assert.ok(w <= 60, `${kind}: kutu çok geniş (${w})`);
    assert.ok(h <= 100, `${kind}: kutu çok yüksek (${h})`);
    assert.ok(w / h >= 0.4, `${kind}: en-boy oranı dik değil (${(w / h).toFixed(2)})`);
    assert.ok(Number.isFinite(box.minX + box.maxX + box.minY + box.maxY), `${kind}: NaN kutu`);
  }
});

test('silah seviyesi bebekte 20. seviyede sabitlenir', () => {
  const boxAt = (level) => playerDollBox({ ...blank(), weapon: gear('weapon', { kind: 'spear', level }) });
  assert.deepEqual(boxAt(20), boxAt(100), 'yüksek seviye kutu büyütmemeli');
  assert.ok(boxAt(20).minY < boxAt(1).minY, 'seviye arttıkça silah uzar');
});

test('bilinmeyen silah türü kutuyu bozmaz', () => {
  const box = playerDollBox({ ...blank(), weapon: gear('weapon', { kind: 'bilinmeyen' }) });
  assert.ok(Number.isFinite(box.minY) && box.minY < -60);
  assert.ok(box.maxX - box.minX <= 60);
});

test('kalkan ve diğer yuvalar taban kutuyu büyütmez', () => {
  const base = playerDollBox(blank());
  const full = playerDollBox({
    ...blank(),
    helmet: gear('helmet'),
    amulet: gear('amulet'),
    cape: gear('cape'),
    shield: gear('shield'),
    armor: gear('armor'),
    gloves: gear('gloves'),
    belt: gear('belt'),
    ring: gear('ring'),
    boots: gear('boots'),
  });
  assert.deepEqual(full, base);
});
