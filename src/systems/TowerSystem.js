import { SPAWN_MARGIN } from '../config/constants.js';
import { Events } from '../core/events.js';
import { BOSSES } from '../data/monsters.js';
import { TOWER_HP_MULT, TOWER_TIME, TOWER_UNLOCK_STAGE, floorRewards, towerBossId, towerStage } from '../data/tower.js';
import { Monster } from '../entities/Monster.js';
import { grantReward } from './rewards.js';

// Boss Kulesi. Etkinken SpawnSystem normal canavar yerine kule bossu doğurur,
// ana bölge ilerlemesi donar ve ölüm bölge kaybettirmez.
// Kalıcı kayıt: state.tower = { best, attempts, keys }; çalışma anı: this.floor.
export class TowerSystem {
  constructor(game) {
    this.game = game;
    /** Şu an tırmanılan kat (kulede değilse null) */
    this.floor = null;
    this.clearedThisRun = 0;
  }

  get data() {
    return this.game.state.tower;
  }

  get active() {
    return this.floor !== null;
  }

  /** Bir sonraki girişte başlanacak kat */
  get nextFloor() {
    return this.data.best + 1;
  }

  /** Kilit şu anki koşunun bölgesine bağlıdır: savaş gücü de bu koşudan gelir. */
  get unlocked() {
    return this.game.state.stage >= TOWER_UNLOCK_STAGE;
  }

  get canEnter() {
    return this.unlocked && !this.active && !this.game.player.dead && (this.data.attempts > 0 || this.data.keys > 0);
  }

  enter() {
    if (!this.canEnter) return false;
    if (this.data.attempts > 0) this.data.attempts--;
    else this.data.keys--;
    this.floor = this.nextFloor;
    this.clearedThisRun = 0;
    const { spawn, player, stats } = this.game;
    spawn.reset();
    spawn.spawnTimer = 0.6;
    player.reset(stats.get()); // tam canla başla
    this.game.bus.emit(Events.TOWER_STARTED, { floor: this.floor });
    this.changed();
    return true;
  }

  /** SpawnSystem çağırır: mevcut katın bossunu üretir. */
  createBoss() {
    const floor = this.floor;
    const def = BOSSES[towerBossId(floor)];
    const monster = new Monster(def, towerStage(floor), { boss: true, spawnX: this.game.world.viewWidth + SPAWN_MARGIN });
    monster.maxHp *= TOWER_HP_MULT;
    monster.hp = monster.maxHp;
    monster.towerFloor = floor;
    return monster;
  }

  get timeLimit() {
    return TOWER_TIME + this.game.tree.perk('bossTime');
  }

  /** Kat bossu yenildi: ilk kez geçildiyse ödül, sonra bir üst kat. */
  onFloorCleared(monster) {
    const floor = monster.towerFloor;
    const firstClear = floor > this.data.best;
    let rewards = [];
    if (firstClear) {
      this.data.best = floor;
      rewards = floorRewards(floor).map((r) => grantReward(this.game, r, { x: monster.x, y: monster.centerY }));
    }
    this.clearedThisRun++;
    this.game.bus.emit(Events.TOWER_FLOOR_CLEARED, { floor, firstClear, rewards });
    this.floor = floor + 1;
    // Katlar arası kısa nefes: canın bir kısmı yenilenir
    const p = this.game.player;
    p.heal(p.maxHp * 0.3);
    this.changed();
  }

  /** Kuleden çık (süre doldu, ölüm, oyuncu isteği veya yeniden doğuş). */
  end(reason = 'exit') {
    if (!this.active) return;
    const reached = this.floor;
    this.floor = null;
    this.game.spawn.reset();
    this.game.bus.emit(Events.TOWER_ENDED, { reason, reached, cleared: this.clearedThisRun, best: this.data.best });
    this.changed();
  }

  changed() {
    this.game.bus.emit(Events.TOWER_CHANGED, this.data);
  }
}
