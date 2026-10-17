import { SAVE_KEY } from '../config/constants.js';
import { createDefaultState, mergeWithDefaults } from './GameState.js';

export class SaveManager {
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return createDefaultState();
      return mergeWithDefaults(JSON.parse(raw));
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

  importString(str) {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
    return mergeWithDefaults(parsed);
  }
}
