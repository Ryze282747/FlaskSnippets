
import Logger from "./Logger.js";
import SnippetRegistry from "../snippets/SnippetRegistry.js";
import allSnippets from "../snippets/categories/index.js";
import SnippetStorage from "../user/SnippetStorage.js";
import CustomSnippetManager from "../user/CustomSnippetManager.js";
import SnippetAdapter from "../integrations/acode/SnippetAdapter.js";

const DEFAULT_INDENTATION = "4-spaces";

const VALID_INDENTATIONS = new Set([
  "2-spaces",
  "4-spaces",
  "8-spaces",
  "tabs"
]);

export default class FlaskSnippetsService {
  constructor({ logger = null } = {}) {
    if (
      logger !== null &&
      (
        typeof logger.info !== "function" ||
        typeof logger.error !== "function"
      )
    ) {
      throw new TypeError(
        "[FlaskSnippets] A valid logger instance is required."
      );
    }

    this.logger = logger || new Logger({
      prefix: "FlaskSnippets",
      level: "info"
    });

    this.ownsLogger = !logger;

    this.registry = null;
    this.storage = null;
    this.customSnippets = null;
    this.adapter = null;

    this.enabled = true;
    this.indentation = DEFAULT_INDENTATION;

    this.initialized = false;
    this.initializing = false;
    this.disposed = false;

    this.initPromise = null;
    this.disposePromise = null;

    this.operationQueue = Promise.resolve();
    this.pendingOperations = 0;
  }

  ensureActive() {
    if (this.disposed) {
      throw new Error(
        "[FlaskSnippets] FlaskSnippetsService has been disposed."
      );
    }
  }

  enqueueOperation(callback) {
    this.ensureActive();

    if (typeof callback !== "function") {
      throw new TypeError(
        "[FlaskSnippets] Service operation must be a function."
      );
    }

    this.pendingOperations += 1;

    const operation = this.operationQueue.then(() => {
      this.ensureActive();
      return callback();
    });

    this.operationQueue = operation
      .catch(() => undefined)
      .finally(() => {
        this.pendingOperations = Math.max(
          0,
          this.pendingOperations - 1
        );
      });

    return operation;
  }

  async createAdapter() {
    this.ensureActive();

    if (!this.enabled || this.adapter) {
      return;
    }

    const adapter = new SnippetAdapter({
      registry: this.registry,
      logger: this.logger,
      indentation: this.indentation
    });

    this.adapter = adapter;

    try {
      await adapter.init();

      this.ensureActive();
    } catch (error) {
      if (this.adapter === adapter) {
        this.adapter = null;
      }

      await adapter.dispose().catch(() => undefined);

      throw error;
    }
  }

  init() {
    this.ensureActive();

    if (this.initialized) {
      return Promise.resolve(this);
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initializing = true;

    this.initPromise = this.initialize();

    return this.initPromise;
  }

  async initialize() {
    try {
      this.registry = new SnippetRegistry();

      this.registry.registerMany(allSnippets);

      this.storage = new SnippetStorage();

      this.customSnippets = new CustomSnippetManager({
        registry: this.registry,
        storage: this.storage,
        logger: this.logger
      });

      await this.customSnippets.init();

      this.ensureActive();

      await this.createAdapter();

      this.ensureActive();

      this.initialized = true;

      this.logger.info(
        `Service initialized with ${this.registry.getAll().length} snippets.`
      );

      return this;
    } catch (error) {
      this.logger?.error(
        "Service initialization failed.",
        error
      );

      await this.cleanup();

      throw error;
    } finally {
      this.initializing = false;
      this.initPromise = null;
    }
  }

  getRegistry() {
    this.ensureActive();
    return this.registry;
  }

  getCustomSnippetManager() {
    this.ensureActive();
    return this.customSnippets;
  }

  getAdapter() {
    this.ensureActive();
    return this.adapter;
  }

  getIndentation() {
    this.ensureActive();
    return this.indentation;
  }

  setIndentation(indentation) {
    this.ensureActive();

    if (!VALID_INDENTATIONS.has(indentation)) {
      throw new TypeError(
        `[FlaskSnippets] Invalid indentation option: ${indentation}.`
      );
    }

    if (!this.initialized) {
      throw new Error(
        "[FlaskSnippets] Initialize the service before changing indentation."
      );
    }

    return this.enqueueOperation(async () => {
      if (this.indentation === indentation) {
        return this.indentation;
      }

      const previous = this.indentation;

      this.indentation = indentation;

      try {
        if (this.adapter) {
          if (
            typeof this.adapter.setIndentation !== "function"
          ) {
            throw new Error(
              "[FlaskSnippets] The active adapter does not support indentation settings."
            );
          }

          await this.adapter.setIndentation(indentation);
        }

        this.logger.info(
          `Snippet indentation updated: ${indentation}.`
        );

        return this.indentation;
      } catch (error) {
        this.indentation = previous;

        this.logger.error(
          "Could not update snippet indentation.",
          error
        );

        throw error;
      }
    });
  }

  setEnabled(enabled) {
    this.ensureActive();

    if (typeof enabled !== "boolean") {
      throw new TypeError(
        "[FlaskSnippets] Enabled state must be a boolean."
      );
    }

    if (!this.initialized) {
      throw new Error(
        "[FlaskSnippets] Initialize the service before changing its enabled state."
      );
    }

    return this.enqueueOperation(async () => {
      if (this.enabled === enabled) {
        return this.enabled;
      }

      if (!enabled) {
        const adapter = this.adapter;

        this.adapter = null;
        this.enabled = false;

        if (adapter) {
          await adapter.dispose();
        }

        this.logger.info(
          "Snippet integration disabled."
        );

        return false;
      }

      this.enabled = true;

      try {
        await this.createAdapter();

        this.logger.info(
          "Snippet integration enabled."
        );

        return true;
      } catch (error) {
        this.enabled = false;

        this.logger.error(
          "Could not enable snippet integration.",
          error
        );

        throw error;
      }
    });
  }

  refresh() {
    this.ensureActive();

    if (
      !this.initialized ||
      !this.enabled ||
      !this.adapter
    ) {
      return Promise.resolve(false);
    }

    return this.enqueueOperation(async () => {
      if (
        !this.initialized ||
        !this.enabled ||
        !this.adapter
      ) {
        return false;
      }

      await this.adapter.refresh();

      return true;
    });
  }

  async cleanup() {
    const components = [
      this.adapter,
      this.customSnippets,
      this.storage,
      this.registry
    ];

    this.adapter = null;
    this.customSnippets = null;
    this.storage = null;
    this.registry = null;

    this.initialized = false;
    this.enabled = true;

    const errors = [];

    for (const component of components) {
      if (
        !component ||
        typeof component.dispose !== "function"
      ) {
        continue;
      }

      try {
        await component.dispose();
      } catch (error) {
        errors.push(error);
      }
    }

    for (const error of errors) {
      this.logger?.error(
        "A component failed to dispose.",
        error
      );
    }

    return errors;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      initializing: this.initializing,
      disposed: this.disposed,
      enabled: this.enabled,
      indentation: this.indentation,

      snippetCount:
        this.registry?.getAll().length || 0,

      customSnippetCount:
        this.customSnippets?.getAll().length || 0,

      editor:
        this.adapter?.getStatus() || null,

      pendingOperations: this.pendingOperations
    };
  }

  dispose() {
    if (this.disposePromise) {
      return this.disposePromise;
    }

    if (this.disposed) {
      return Promise.resolve();
    }

    this.disposed = true;

    this.disposePromise = (async () => {
      if (this.initPromise) {
        await this.initPromise.catch(() => undefined);
      }

      await this.operationQueue.catch(() => undefined);

      await this.cleanup();

      if (this.ownsLogger) {
        this.logger?.dispose();
      }

      this.logger = null;
    })();

    return this.disposePromise;
  }
}
