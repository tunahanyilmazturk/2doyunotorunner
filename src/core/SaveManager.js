import { SAVE_KEY } from '../config/constants.js';
import { createDefaultState } from './GameState.js';
import { migrate } from './saveIntegrity.js';

export class SaveManager {
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return createDefaultState();
      // migrate(): sürüm adımları + tam doğrulama (bkz. core/saveIntegrity.js)
      return migrate(JSON.parse(raw));
    } catch (err) {
      console.warn('[SaveManager] Kayıt okunamadı, yeni oyun başlatılıyor.', err);
      return createDefaultState();
    }
  }

  save(state) {
    state.lastSave = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      console.warn('[SaveManager] Kayıt yazılamadı.', err);
      return false;
    }
  }

  clear() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* yoksay */
    }
  }

  exportString(state) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  }

  /** Dışarıdan gelen (güvenilmeyen) kayıt kodunu okur ve doğrular. */
  importString(str) {
    return migrate(JSON.parse(decodeURIComponent(escape(atob(str.trim())))));
  }
}
