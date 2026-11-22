
export default class EventManager {
  constructor({
    onError = null
  } = {}) {
    if (
      onError !== null &&
      typeof onError !== "function"
    ) {
      throw new TypeError(
        "[FlaskSnippets] onError must be a function or null."
      );
    }

    this.disposed = false;
    this.events = new Map();
    this.onError = onError;
  }

  ensureActive() {
    if (this.disposed) {
      throw new Error(
        "[FlaskSnippets] EventManager has been disposed."
      );
    }
  }

  validateEventName(eventName) {
    if (
      typeof eventName !== "string" ||
      !eventName.trim()
    ) {
      throw new TypeError(
        "[FlaskSnippets] Event name must be a non-empty string."
      );
    }

    return eventName.trim();
  }

  validateCallback(callback) {
    if (typeof callback !== "function") {
      throw new TypeError(
        "[FlaskSnippets] Event callback must be a function."
      );
    }
  }

  on(eventName, callback) {
    return this.addListener(
      eventName,
      callback,
      false
    );
  }

  once(eventName, callback) {
    return this.addListener(
      eventName,
      callback,
      true
    );
  }

  addListener(eventName, callback, once) {
    this.ensureActive();

    const name = this.validateEventName(eventName);

    this.validateCallback(callback);

    if (!this.events.has(name)) {
      this.events.set(name, new Set());
    }

    const record = {
      callback,
      once,
      active: true
    };

    this.events.get(name).add(record);

    return () => {
      return this.removeRecord(name, record);
    };
  }

  off(eventName, callback) {
    this.ensureActive();

    const name = this.validateEventName(eventName);

    this.validateCallback(callback);

    const listeners = this.events.get(name);

    if (!listeners) {
      return false;
    }

    let removed = false;

    for (const record of [ ...listeners ]) {
      if (record.callback === callback) {
        if (this.removeRecord(name, record)) {
          removed = true;
        }
      }
    }

    return removed;
  }

  removeRecord(eventName, record) {
    if (!record.active) {
      return false;
    }

    record.active = false;

    const listeners = this.events.get(eventName);

    if (!listeners) {
      return false;
    }

    listeners.delete(record);

    if (listeners.size === 0) {
      this.events.delete(eventName);
    }

    return true;
  }

  emit(eventName, ...args) {
    this.ensureActive();

    const name = this.validateEventName(eventName);
    const listeners = this.events.get(name);

    if (!listeners || listeners.size === 0) {
      return 0;
    }

    const snapshot = [ ...listeners ];
    let executed = 0;

    for (const record of snapshot) {
      if (!record.active) {
        continue;
      }

      if (record.once) {
        this.removeRecord(name, record);
      }

      try {
        const result = record.callback(...args);

        if (
          result &&
          typeof result.then === "function"
        ) {
          Promise.resolve(result).catch(error => {
            this.handleError(error, name);
          });
        }

        executed += 1;
      } catch (error) {
        this.handleError(error, name);
      }
    }

    return executed;
  }

  async emitAsync(eventName, ...args) {
    this.ensureActive();

    const name = this.validateEventName(eventName);
    const listeners = this.events.get(name);

    if (!listeners || listeners.size === 0) {
      return 0;
    }

    const snapshot = [ ...listeners ];
    const pending = [];

    for (const record of snapshot) {
      if (!record.active) {
        continue;
      }

      if (record.once) {
        this.removeRecord(name, record);
      }

      pending.push(
        Promise.resolve().then(() => {
          return record.callback(...args);
        }).then(
          () => true,
          error => {
            this.handleError(error, name);
            return false;
          }
        )
      );
    }

    const results = await Promise.all(pending);

    return results.filter(Boolean).length;
  }

  handleError(error, eventName) {
    if (this.onError) {
      try {
        this.onError(error, eventName);
        return;
      } catch (handlerError) {
        console.error(
          "[FlaskSnippets] Event error handler failed:",
          handlerError
        );
      }
    }

    console.error(
      `[FlaskSnippets] Event listener failed (${eventName}):`,
      error
    );
  }

  removeAllListeners(eventName = null) {
    this.ensureActive();

    if (eventName === null) {
      const count = this.listenerCount();

      for (const listeners of this.events.values()) {
        for (const record of listeners) {
          record.active = false;
        }
      }

      this.events.clear();

      return count;
    }

    const name = this.validateEventName(eventName);
    const listeners = this.events.get(name);

    if (!listeners) {
      return 0;
    }

    const count = listeners.size;

    for (const record of listeners) {
      record.active = false;
    }

    this.events.delete(name);

    return count;
  }

  listenerCount(eventName = null) {
    this.ensureActive();

    if (eventName !== null) {
      const name = this.validateEventName(eventName);

      return this.events.get(name)?.size || 0;
    }

    let count = 0;

    for (const listeners of this.events.values()) {
      count += listeners.size;
    }

    return count;
  }

  eventNames() {
    this.ensureActive();

    return [ ...this.events.keys() ];
  }

  getStatus() {
    return {
      disposed: this.disposed,
      eventCount: this.events.size,
      listenerCount: this.listenerCount(),
      events: this.eventNames()
    };
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    for (const listeners of this.events.values()) {
      for (const record of listeners) {
        record.active = false;
      }
    }

    this.events.clear();
    this.onError = null;
    this.disposed = true;
  }
}
