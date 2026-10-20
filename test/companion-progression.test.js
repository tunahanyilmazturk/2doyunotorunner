import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_EGG_CHANCE, EGG_HATCH_KILLS } from '../src/data/companions.js';
import { BOSS_EVERY, KILLS_PER_STAGE } from '../src/config/constants.js';

test('boss yumurta arzı kuluçka temposundan fazla geride kalmaz', () => {
  const progressPerStage = KILLS_PER_STAGE + 5 / BOSS_EVERY;
  const stagesPerHatch = EGG_HATCH_KILLS / progressPerStage;
  const stagesPerEgg = BOSS_EVERY / BOSS_EGG_CHANCE;

  assert.ok(stagesPerEgg <= stagesPerHatch * 1.2,
    `yumurta ${stagesPerEgg.toFixed(1)} bölgede, kuluçka ${stagesPerHatch.toFixed(1)} bölgede hazır olmalı`);
});
