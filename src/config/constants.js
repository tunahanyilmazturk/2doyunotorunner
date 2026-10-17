// Oyun genelindeki sabitler. Denge formülleri için bkz. balance.js

// Mantıksal yükseklik sabittir; genişlik ekran oranına göre MIN..MAX arasında uyarlanır.
export const BASE_VIEW_WIDTH = 960;
export const MIN_VIEW_WIDTH = 720;
export const MAX_VIEW_WIDTH = 1800;
export const GAME_HEIGHT = 400;
export const GROUND_Y = 330;
export const PLAYER_X = 220;

export const RUN_SPEED = 300; // px/sn — dünyanın kayma hızı
export const PLAYER_ATTACK_RANGE = 52;
export const SPRITE_SCALE = 1.3; // oyuncu ve canavarların çizim ölçeği
export const SPAWN_MARGIN = 40; // canavar görüş alanının bu kadar sağında doğar
export const SPAWN_DELAY = 0.35;

export const KILLS_PER_STAGE = 10;
export const STAGES_PER_BIOME = 10;
export const BOSS_EVERY = 5;
export const BOSS_TIME_LIMIT = 30;
export const RESPAWN_TIME = 2.5;

export const INVENTORY_SIZE = 30;
export const SHOP_SIZE = 6;
export const SHOP_REFRESH_SECONDS = 300;
export const MAX_POTIONS = 999;
export const POTION_COOLDOWN = 3;
export const AUTO_POTION_THRESHOLD = 0.35;

export const SAVE_KEY = 'idle-runner-rpg-save';
export const SAVE_VERSION = 1;
export const AUTOSAVE_INTERVAL = 10;
export const OFFLINE_MIN_SECONDS = 60;
export const OFFLINE_CAP_SECONDS = 8 * 3600;
export const OFFLINE_EFFICIENCY = 0.5;

export const PRESTIGE_MIN_STAGE = 20;
export const GAME_SPEEDS = [1, 2, 3];
