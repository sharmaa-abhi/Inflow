/**
 * Light pub/sub event bus for decoupling application modules.
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Register an event listener.
   * @param {string} event - The event name.
   * @param {Function} callback - The event callback.
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove an event listener.
   * @param {string} event - The event name.
   * @param {Function} callback - The event callback.
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit an event.
   * @param {string} event - The event name.
   * @param {any} data - Event payload.
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    for (const callback of callbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }
  }
}

// Singleton event bus instance
export const eventBus = new EventBus();
