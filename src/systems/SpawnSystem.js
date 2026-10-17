import { BOSS_EVERY, KILLS_PER_STAGE, SPAWN_DELAY, SPAWN_MARGIN } from '../config/constants.js';
import { Balance } from '../config/balance.js';
import { Events } from '../core/events.js';
import { getBiome, getBiomeIndex } from '../data/biomes.js';
import { BOSSES, MONSTERS } from '../data/monsters.js';
import { Monster } from '../entities/Monster.js';
import { chance, pick } from '../utils/random.js';

// Canavar doğurma + bölge ilerlemesi + boss zamanlayıcısı.
export class SpawnSystem {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.spawnTimer = SPAWN_DELAY;
    this.bossTimer = 0;
    this.bossTimeTotal = Balance.bossTimeLimit(1);

    game.bus.on(Events.MONSTER_KILLED, ({ monster }) => this.onKill(monster));
    game.bus.on(Events.PLAYER_DIED, () => this.onPlayerDied());
  }

  get state() {
    return this.game.state;
  }

  get isBossStage() {
    return this.state.stage % BOSS_EVERY === 0;
  }

  get bossActive() {
    return !!this.current && this.current.isBoss && !this.current.dead;
  }

  update(dt) {
    const m = this.current;
    if (m) {
      m.update(dt);
      if (m.dead) {
        if (m.removable) this.current = null;
      } else {
        if (m.state === 'approach') m.x -= (this.game.world.scrollSpeed + m.speed * this.game.world.speedScale) * dt;
        if (this.bossActive && !this.game.player.dead) {
          this.bossTimer -= dt;
          if (this.bossTimer <= 0) this.failBoss();
        }
      }
    } else if (!this.game.player.dead) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) this.spawnNext();
    }
  }

  spawnNext() {
    const biome = getBiome(this.state.stage);
    const spawnBoss = this.isBossStage && this.state.autoAdvance && this.state.kills >= KILLS_PER_STAGE;
    const spawnX = this.game.world.viewWidth + SPAWN_MARGIN;
    let monster;
    if (spawnBoss) {
      const bossId = biome.bosses[this.state.stage % 10 === 0 ? 1 : 0];
      monster = new Monster(BOSSES[bossId], this.state.stage, { boss: true, spawnX });
      this.bossTimeTotal = Balance.bossTimeLimit(this.state.stage) + this.game.tree.perk('bossTime');
      this.bossTimer = this.bossTimeTotal;
      this.game.bus.emit(Events.BOSS_SPAWNED, { monster });
    } else {
      const elite = this.state.stage >= Balance.eliteMinStage && chance(Balance.eliteChance(this.state.stage));
      monster = new Monster(MONSTERS[pick(biome.monsters)], this.state.stage, { elite, spawnX });
    }
    this.current = monster;
    this.spawnTimer = SPAWN_DELAY;
    this.game.bus.emit(Events.MONSTER_SPAWNED, { monster });
  }

  onKill(monster) {
    const state = this.state;
    state.stats.totalKills++;
    const addUnique = (list, id) => !list.includes(id) && list.push(id);
    addUnique(state.stats.monstersKilled, monster.def.id);
    if (monster.isElite) {
      state.stats.elitesKilled++;
      addUnique(state.stats.traitsKilled, monster.trait.id);
    }
    if (monster.isBoss) {
      state.stats.bossKills++;
      if (this.bossTimeTotal - this.bossTimer <= 10) state.stats.fastBossKills++;
      this.advanceStage();
      return;
    }
    state.kills++;
    if (state.kills >= KILLS_PER_STAGE) {
      if (!state.autoAdvance) {
        state.kills = 0; // aynı bölgede kas
        // Ruh Ağacı "Savaş Çağrısı": bir bölge kastıktan sonra tekrar ilerlemeyi dene
        if (this.game.tree.perk('autoBoss')) state.autoAdvance = true;
      }
      else if (!this.isBossStage) this.advanceStage();
      // boss bölgesi: bir sonraki doğan canavar boss olur
    }
    this.game.bus.emit(Events.STAGE_PROGRESS, state);
  }

  advanceStage() {
    this.setStage(this.state.stage + 1);
  }

  setStage(stage) {
    const state = this.state;
    const prevBiome = getBiomeIndex(state.stage);
    state.stage = Math.max(1, stage);
    state.kills = 0;
    state.runMaxStage = Math.max(state.runMaxStage, state.stage);
    state.bestStage = Math.max(state.bestStage, state.stage);
    this.game.bus.emit(Events.STAGE_CHANGED, state.stage);
    this.game.bus.emit(Events.STAGE_PROGRESS, state);
    if (getBiomeIndex(state.stage) !== prevBiome) {
      this.game.bus.emit(Events.BIOME_CHANGED, getBiome(state.stage));
    }
  }

  failBoss() {
    this.current = null;
    this.spawnTimer = SPAWN_DELAY;
    this.state.kills = 0;
    this.state.autoAdvance = false;
    this.game.bus.emit(Events.BOSS_FAILED);
    this.game.bus.emit(Events.STAGE_PROGRESS, this.state);
  }

  onPlayerDied() {
    const wasBoss = this.current?.isBoss;
    this.current = null;
    this.spawnTimer = SPAWN_DELAY;
    this.state.autoAdvance = false;
    if (wasBoss) {
      this.state.kills = 0;
      this.game.bus.emit(Events.BOSS_FAILED);
      this.game.bus.emit(Events.STAGE_PROGRESS, this.state);
    } else {
      // Normal canavara yenilince bir bölge geri çekil
      this.setStage(this.state.stage - 1);
    }
  }

  /** Oyuncu "Boss'a Meydan Oku" dediğinde otomatik ilerlemeyi aç. */
  challengeBoss() {
    this.state.autoAdvance = true;
    this.game.bus.emit(Events.STAGE_PROGRESS, this.state);
  }

  reset() {
    this.current = null;
    this.spawnTimer = SPAWN_DELAY;
    this.bossTimer = 0;
  }
}
