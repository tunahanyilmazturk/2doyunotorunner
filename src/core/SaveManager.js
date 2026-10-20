import { BACKUP_COUNT, BACKUP_KEY, SAVE_KEY } from '../config/constants.js';
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

  /**
   * Yedek al: mevcut durumun bir kopyası listeye eklenir; en eskisi düşer.
   * Yedekler ayrı bir anahtarda tutulur, bu yüzden ana kaydın üzerine yazmaz.
   */
  backup(state) {
    try {
      const entry = {
        at: Date.now(),
        stage: state.runMaxStage ?? state.stage,
        souls: state.souls,
        data: JSON.stringify(state),
      };
      const next = [entry, ...this.listBackups()].slice(0, BACKUP_COUNT);
      localStorage.setItem(BACKUP_KEY, JSON.stringify(next));
      return true;
    } catch (err) {
      console.warn('[SaveManager] Yedek yazılamadı.', err);
      return false;
    }
  }

  /** Yedek listesi (en yenisi önde). Bozuk ya da okunamayan yedekler boş liste sayılır. */
  listBackups() {
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  /** Bir yedeği içe aktarma kodu olarak döndürür (geri yüklemek için importSave'e verilir). */
  backupCode(index) {
    const entry = this.listBackups()[index];
    if (!entry || typeof entry.data !== 'string') return null;
    return this.exportString(JSON.parse(entry.data));
  }

  /** Dışarıdan gelen (güvenilmeyen) kayıt kodunu okur ve doğrular. */
  importString(str) {
    return migrate(JSON.parse(decodeURIComponent(escape(atob(str.trim())))));
  }
}
