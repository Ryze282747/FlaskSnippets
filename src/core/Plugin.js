
import Logger from "./Logger.js";
import EventManager from "./EventManager.js";

export default class Plugin {
  constructor({
    logger = null,
    events = null,
    onError = null
  } = {}) {
    this.disposed = false;
    this.initialized = false;
    this.initializing = false;
    this.destroying = false;

    this.logger = logger || new Logger({
      prefix: "FlaskSnippets"
    });

    this.events = events || new EventManager({
      onError
    });

    this.ownsLogger = !logger;
    this.ownsEvents = !events;

    this.components = new Map();
    this.initializedComponents = [];
    this.componentLoggers = new Map();

    this.onError =
      typeof onError === "function"
        ? onError
        : null;

    this.initPromise = null;
    this.destroyPromise = null;
    this.unregisterQueue = Promise.resolve();
  }

  ensureActive() {
    if (this.disposed || this.destroying) {
      throw new Error(
        "[FlaskSnippets] Plugin is unavailable."
      );
    }
  }

  register(name, component) {
    this.ensureActive();

    if (this.initializing) {
      throw new Error(
        "[FlaskSnippets] Cannot register components during initialization."
      );
    }

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      throw new TypeError(
        "[FlaskSnippets] Component name must be a non-empty string."
      );
    }

    if (
      !component ||
      typeof component !== "object" ||
      Array.isArray(component)
    ) {
      throw new TypeError(
        "[FlaskSnippets] Component must be an object."
      );
    }

    const key = name.trim();

    if (this.components.has(key)) {
      throw new Error(
        `[FlaskSnippets] Component already registered: ${key}`
      );
    }

    for (const registered of this.components.values()) {
      if (registered === component) {
        throw new Error(
          "[FlaskSnippets] Component instance is already registered."
        );
      }
    }

    this.components.set(key, component);

    return component;
  }

  async unregister(name) {
    this.ensureActive();

    if (this.initializing) {
      throw new Error(
        "[FlaskSnippets] Cannot unregister components during initialization."
      );
    }

    const key = String(name).trim();

    if (!this.components.has(key)) {
      return false;
    }

    const component = this.components.get(key);
    const index = this.initializedComponents.indexOf(component);

    if (index !== -1) {
      this.initializedComponents.splice(index, 1);

      try {
        if (typeof component.dispose === "function") {
          await component.dispose();
        } else if (typeof component.destroy === "function") {
          await component.destroy();
        }
      } catch (error) {
        this.reportError(
          error,
          `Component cleanup: ${key}`
        );
      }
    }

    const childLogger = this.componentLoggers.get(key);

    if (childLogger) {
      try {
        childLogger.dispose();
      } catch (error) {
        this.reportError(
          error,
          `Logger cleanup: ${key}`
        );
      }

      this.componentLoggers.delete(key);
    }

    this.components.delete(key);

    return true;
  }

  reportError(error, componentName = "Plugin") {
    if (this.onError) {
      try {
        this.onError(error, componentName);
        return;
      } catch (handlerError) {
        console.error(
          "[FlaskSnippets] Error handler failed:",
          handlerError
        );
      }
    }

    try {
      this.logger?.error(
        `${componentName} failed:`,
        error
      );
    } catch (loggerError) {
      console.error(
        "[FlaskSnippets] Error reporting failed:",
        loggerError,
        error
      );
    }
  }

  emit(event, payload) {
    try {
      this.events?.emit(event, payload);
    } catch (error) {
      this.reportError(
        error,
        `Event: ${event}`
      );
    }
  }

  init(context = {}) {
    this.ensureActive();

    if (
      !context ||
      typeof context !== "object" ||
      Array.isArray(context)
    ) {
      throw new TypeError(
        "[FlaskSnippets] Plugin context must be an object."
      );
    }

    if (this.initialized) {
      return Promise.resolve(this.getStatus());
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initializing = true;

    this.initPromise = this.initialize(context);

    return this.initPromise;
  }

  async initialize(context) {
    const components = [
      ...this.components.entries()
    ];

    try {
      for (const [ name, component ] of components) {
        this.ensureActive();

        const childLogger = this.logger.child(name);

        this.componentLoggers.set(
          name,
          childLogger
        );

        // Track before initialization so partially initialized
        // components also receive cleanup.
        this.initializedComponents.push(component);

        if (typeof component.init === "function") {
          await component.init({
            ...context,
            logger: childLogger,
            events: this.events,
            plugin: this
          });
        }

        this.logger.info(
          `Component initialized: ${name}`
        );
      }

      this.ensureActive();

      this.initialized = true;

      this.emit(
        "plugin:initialized",
        this.getStatus()
      );

      return this.getStatus();
    } catch (error) {
      await this.cleanupComponents();

      this.reportError(
        error,
        "Plugin initialization"
      );

      throw error;
    } finally {
      this.initializing = false;
      this.initPromise = null;
    }
  }

  async cleanupComponents() {
    const components = [
      ...this.initializedComponents
    ].reverse();

    this.initializedComponents = [];

    for (const component of components) {
      try {
        if (typeof component.dispose === "function") {
          await component.dispose();
        } else if (typeof component.destroy === "function") {
          await component.destroy();
        }
      } catch (error) {
        this.reportError(
          error,
          "Component cleanup"
        );
      }
    }

    for (const [ name, childLogger ] of this.componentLoggers) {
      try {
        childLogger.dispose();
      } catch (error) {
        this.reportError(
          error,
          `Logger cleanup: ${name}`
        );
      }
    }

    this.componentLoggers.clear();
    this.initialized = false;
  }

  getComponent(name) {
    this.ensureActive();

    return this.components.get(
      String(name).trim()
    ) || null;
  }

  hasComponent(name) {
    this.ensureActive();

    return this.components.has(
      String(name).trim()
    );
  }

  getStatus() {
    return {
      initialized: this.initialized,
      initializing: this.initializing,
      destroying: this.destroying,
      disposed: this.disposed,
      componentCount: this.components.size,
      initializedComponentCount:
        this.initializedComponents.length,
      components: [
        ...this.components.keys()
      ]
    };
  }

  destroy() {
    if (this.destroyPromise) {
      return this.destroyPromise;
    }

    if (this.disposed) {
      return Promise.resolve();
    }

    this.destroying = true;

    this.destroyPromise = this.cleanup();

    return this.destroyPromise;
  }

  async cleanup() {
    try {
      if (this.initPromise) {
        await this.initPromise.catch(
          () => undefined
        );
      }

      this.emit(
        "plugin:destroying",
        this.getStatus()
      );

      await this.cleanupComponents();

      this.components.clear();

      if (this.ownsEvents) {
        try {
          this.events.dispose();
        } catch (error) {
          this.reportError(
            error,
            "Event manager cleanup"
          );
        }
      }

      if (this.ownsLogger) {
        try {
          this.logger.dispose();
        } catch (error) {
          console.error(
            "[FlaskSnippets] Logger cleanup failed:",
            error
          );
        }
      }

      this.disposed = true;
    } finally {
      this.destroying = false;
    }
  }
}
