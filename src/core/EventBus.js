export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /** @returns {() => void} aboneliği iptal eden fonksiyon */
  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    this.listeners.get(event)?.delete(fn);
  }

  emit(event, payload) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[EventBus] "${event}" dinleyicisinde hata:`, err);
      }
    }
  }
}
