import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatNumber, formatPercent, formatTime } from '../src/utils/format.js';

test('formatNumber: küçük değerler ve kısaltmalar', () => {
  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(5), '5');
  assert.equal(formatNumber(5.5), '5.5');
  assert.equal(formatNumber(999), '999');
  assert.equal(formatNumber(1000), '1.00K');
  assert.equal(formatNumber(1500), '1.50K');
  assert.equal(formatNumber(12345), '12.3K');
  assert.equal(formatNumber(1_234_567), '1.23M');
  assert.equal(formatNumber(1e9), '1.00B');
});

test('formatNumber: negatif, sonsuz ve taşma', () => {
  assert.equal(formatNumber(-1500), '-1.50K');
  assert.equal(formatNumber(Infinity), '∞');
  assert.equal(formatNumber(NaN), '∞');
  // Kısaltma tablosundan büyük değerler bilimsel gösterime düşer, çökmemeli
  assert.match(formatNumber(1e60), /e\+/);
});

test('formatTime', () => {
  assert.equal(formatTime(0), '0sn');
  assert.equal(formatTime(59), '59sn');
  assert.equal(formatTime(60), '1dk 0sn');
  assert.equal(formatTime(3661), '1sa 1dk');
});

test('formatPercent tam sayıyı ondalıksız gösterir', () => {
  assert.equal(formatPercent(5), '5%');
  assert.equal(formatPercent(5.25), '5.3%');
});
