import { BOSS_EVERY, KILLS_PER_STAGE, PLAYER_ATTACK_RANGE, SPAWN_DELAY, SPAWN_MARGIN } from '../config/constants.js';
import { Balance } from '../config/balance.js';
import { Events } from '../core/events.js';
import { getBiome, getBiomeIndex } from '../data/biomes.js';
import { BOSSES, MONSTERS } from '../data/monsters.js';
import { Monster } from '../entities/Monster.js';
import { chance, pick } from '../utils/random.js';

/** Dağlım: çoğu dalga tek düşman, bazen ikili, nadiren üçlü gelir. */
export function waveSizeForRoll(roll) {
  if (roll < 0.06) return 3;
  if (roll < 0.34) return 2;
  return 1;
}

// Canavar doğurma + bölge ilerlemesi + boss zamanlayıcısı.
export class SpawnSystem {
  constructor(game, { random = Math.random } = {}) {
    this.game = game;
    this.monsters = [];
    this.random = random;
    this.spawnTimer = SPAWN_DELAY;
    this.bossTimer = 0;
    this.bossTimeTotal = Balance.bossTimeLimit(1);

    game.bus.on(Events.MONSTER_KILLED, ({ monster }) => this.onKill(monster));
    game.bus.on(Events.PLAYER_DIED, () => this.onPlayerDied());
  }

  get state() {
    return this.game.state;
  }

  /** Öndeki yaşayan düşman; eski tek düşman kullanan sistemlerle uyumludur. */
  get current() {
    return this.monsters.find((monster) => !monster.dead) ?? this.monsters[0] ?? null;
  }

  set current(monster) {
    this.monsters = monster ? [monster] : [];
  }

  get isBossStage() {
    return this.state.stage % BOSS_EVERY === 0;
  }

  get bossActive() {
    return !!this.current && this.current.isBoss && !this.current.dead;
  }

  update(dt) {
    // Cesetler yaşayan düşman listesine girmediği için kendi ölüm zamanlayıcısını
    // burada ilerlet; aksi halde `removable` hiç true olmaz ve spawn kilitlenir.
    for (const monster of this.monsters) {
      if (monster.dead) monster.update(dt);
    }
    this.monsters = this.monsters.filter((monster) => !monster.removable);
    const active = this.monsters.filter((monster) => !monster.dead);
    if (active.length) {
      const front = active[0];
      for (let i = 0; i < active.length; i++) {
        const monster = active[i];
        monster.update(dt);
        if (monster.dead) continue;

        if (i === 0) {
          if (monster.state === 'approach') {
            monster.x -= (this.game.world.scrollSpeed + monster.speed * this.game.world.speedScale) * dt;
          } else if (this.game.combat.gapTo(monster) > PLAYER_ATTACK_RANGE) {
            // Savaşta olan canavar temas mesafesine kadar yürür.
            monster.x -= monster.speed * this.game.world.speedScale * dt;
          }
        } else {
          // Grup üyeleri öndeki düşmanla aralığını korur ve sırayla savaşa girer.
          const previous = active[i - 1];
          const targetX = previous.x + (previous.size + monster.size) * 0.5 + 18;
          if (monster.x > targetX) {
            monster.x = Math.max(targetX, monster.x - (this.game.world.scrollSpeed + monster.speed * this.game.world.speedScale) * dt);
          }
        }
      }
      if (front.isBoss && !front.dead && !this.game.player.dead) {
        this.bossTimer -= dt;
        if (this.bossTimer <= 0) this.failBoss();
      }
    } else if (!this.game.player.dead) {
      if (!this.monsters.length) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) (this.game.tower.active ? this.spawnTowerBoss() : this.spawnNext());
      }
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
      const count = waveSizeForRoll(this.random());
      this.monsters = [];
      for (let i = 0; i < count; i++) {
        const elite = this.state.stage >= Balance.eliteMinStage && chance(Balance.eliteChance(this.state.stage));
        monster = new Monster(MONSTERS[pick(biome.monsters)], this.state.stage, { elite, spawnX: spawnX + i * 110 });
        this.monsters.push(monster);
        this.game.bus.emit(Events.MONSTER_SPAWNED, { monster, waveSize: count, waveIndex: i });
      }
    }
    if (spawnBoss) this.current = monster;
    this.spawnTimer = SPAWN_DELAY;
    if (spawnBoss) this.game.bus.emit(Events.MONSTER_SPAWNED, { monster, waveSize: 1, waveIndex: 0 });
  }

  /** Kuledeyken: sıradaki katın bossu (ana bölge ilerlemesi donuk kalır) */
  spawnTowerBoss() {
    const monster = this.game.tower.createBoss();
    this.bossTimeTotal = this.game.tower.timeLimit;
    this.bossTimer = this.bossTimeTotal;
    this.current = monster;
    this.spawnTimer = SPAWN_DELAY;
    this.game.bus.emit(Events.BOSS_SPAWNED, { monster });
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
      if (monster.towerFloor) this.game.tower.onFloorCleared(monster);
      else this.advanceStage();
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
    if (this.game.tower.active) return this.game.tower.end('timeout');
    this.current = null;
    this.spawnTimer = SPAWN_DELAY;
    this.state.kills = 0;
    this.state.autoAdvance = false;
    this.game.bus.emit(Events.BOSS_FAILED);
    this.game.bus.emit(Events.STAGE_PROGRESS, this.state);
  }

  onPlayerDied() {
    // Kulede ölmek bölge kaybettirmez; sadece kule tırmanışı biter
    if (this.game.tower.active) return this.game.tower.end('death');
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
    this.monsters = [];
    this.spawnTimer = SPAWN_DELAY;
    this.bossTimer = 0;
  }
}
