
export default class CustomSnippetManager {
  constructor({
    registry,
    storage,
    logger = null
  } = {}) {
    if (
      !registry ||
      typeof registry.register !== "function" ||
      typeof registry.unregister !== "function" ||
      typeof registry.get !== "function"
    ) {
      throw new TypeError(
        "[FlaskSnippets] CustomSnippetManager requires a valid registry."
      );
    }

    if (
      !storage ||
      typeof storage.load !== "function" ||
      typeof storage.save !== "function"
    ) {
      throw new TypeError(
        "[FlaskSnippets] CustomSnippetManager requires valid storage."
      );
    }

    this.registry = registry;
    this.storage = storage;
    this.logger = logger;

    this.snippets = new Map();

    this.saveQueue = Promise.resolve();
    this.mutationQueue = Promise.resolve();

    this.pendingMutations = 0;
    this.pendingSaves = 0;

    this.initialized = false;
    this.initializing = false;
    this.initializationPromise = null;

    this.disposing = false;
    this.disposed = false;

    this.disposePromise = null;
  }

  ensureActive() {
    if (this.disposed || this.disposing) {
      throw new Error(
        "[FlaskSnippets] CustomSnippetManager is unavailable."
      );
    }
  }

  normalizeId(id) {
    if (typeof id !== "string") {
      throw new TypeError(
        "[FlaskSnippets] Snippet ID must be a string."
      );
    }

    const normalized = id.trim();

    if (!normalized) {
      throw new TypeError(
        "[FlaskSnippets] Snippet ID cannot be empty."
      );
    }

    return normalized;
  }

  validateSnippet(snippet) {
    if (
      !snippet ||
      typeof snippet !== "object" ||
      Array.isArray(snippet) ||
      Object.getPrototypeOf(snippet) !== Object.prototype
    ) {
      throw new TypeError(
        "[FlaskSnippets] A valid snippet object is required."
      );
    }

    return {
      ...snippet,
      id: this.normalizeId(snippet.id),
      category: "custom"
    };
  }

  log(level, message, error = null) {
    if (
      this.logger &&
      typeof this.logger[ level ] === "function"
    ) {
      this.logger[ level ](message, error);
      return;
    }

    const method = console[ level ] || console.log;

    method.call(
      console,
      `[FlaskSnippets] ${message}`,
      error || ""
    );
  }

  clone(snippet) {
    return {
      ...snippet,

      body: Array.isArray(snippet.body)
        ? [ ...snippet.body ]
        : snippet.body,

      scope: Array.isArray(snippet.scope)
        ? [ ...snippet.scope ]
        : snippet.scope,

      tags: Array.isArray(snippet.tags)
        ? [ ...snippet.tags ]
        : []
    };
  }

  enqueueMutation(callback) {
    this.ensureActive();

    this.pendingMutations += 1;

    const operation = this.mutationQueue.then(() => {
      this.ensureActive();
      return callback();
    });

    this.mutationQueue = operation
      .catch(() => undefined)
      .finally(() => {
        this.pendingMutations = Math.max(
          0,
          this.pendingMutations - 1
        );
      });

    return operation;
  }

  async init() {
    this.ensureActive();

    if (this.initialized) {
      return this;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializing = true;

    this.initializationPromise = this.initialize();

    return this.initializationPromise;
  }

  async initialize() {
    const registered = [];

    try {
      const stored = await this.storage.load();

      this.ensureActive();

      if (!Array.isArray(stored)) {
        throw new TypeError(
          "[FlaskSnippets] Stored custom snippets must be an array."
        );
      }

      const validated = [];
      const ids = new Set();

      for (const item of stored) {
        const snippet = this.validateSnippet(item);
        const { id } = snippet;

        if (ids.has(id)) {
          throw new Error(
            `[FlaskSnippets] Duplicate stored snippet ID: ${id}`
          );
        }

        if (this.registry.get(id)) {
          throw new Error(
            `[FlaskSnippets] Snippet ID already exists: ${id}`
          );
        }

        ids.add(id);
        validated.push(snippet);
      }

      for (const snippet of validated) {
        this.ensureActive();

        const canonical = this.registry.register(
          this.clone(snippet)
        );

        if (
          !canonical ||
          typeof canonical.id !== "string"
        ) {
          throw new Error(
            "[FlaskSnippets] Registry returned an invalid registered snippet."
          );
        }

        registered.push(canonical.id);

        this.snippets.set(
          canonical.id,
          canonical
        );
      }

      this.initialized = true;

      this.log(
        "info",
        `Loaded ${this.snippets.size} custom snippets.`
      );

      return this;
    } catch (error) {
      for (const id of registered.reverse()) {
        try {
          this.registry.unregister(id);
        } catch (cleanupError) {
          this.log(
            "error",
            `Could not roll back snippet registration: ${id}`,
            cleanupError
          );
        }
      }

      this.snippets.clear();

      throw error;
    } finally {
      this.initializing = false;
      this.initializationPromise = null;
    }
  }

  async add(snippet) {
    return this.enqueueMutation(async () => {
      if (!this.initialized) {
        throw new Error(
          "[FlaskSnippets] Initialize the manager before adding snippets."
        );
      }

      const definition = this.validateSnippet(snippet);
      const { id } = definition;

      if (
        this.snippets.has(id) ||
        this.registry.get(id)
      ) {
        throw new Error(
          `[FlaskSnippets] Snippet ID already exists: ${id}`
        );
      }

      const canonical = this.registry.register(
        this.clone(definition)
      );

      this.snippets.set(
        canonical.id,
        canonical
      );

      try {
        await this.persist();

        this.log(
          "info",
          `Added custom snippet: ${canonical.id}`
        );

        return this.clone(canonical);
      } catch (error) {
        this.snippets.delete(canonical.id);

        try {
          this.registry.unregister(canonical.id);
        } catch (rollbackError) {
          this.log(
            "error",
            `Could not roll back added snippet: ${canonical.id}`,
            rollbackError
          );
        }

        throw error;
      }
    });
  }

  async update(id, updates) {
    return this.enqueueMutation(async () => {
      if (!this.initialized) {
        throw new Error(
          "[FlaskSnippets] Initialize the manager before updating snippets."
        );
      }

      const normalizedId = this.normalizeId(id);
      const existing = this.snippets.get(normalizedId);

      if (!existing) {
        throw new Error(
          `[FlaskSnippets] Custom snippet not found: ${normalizedId}`
        );
      }

      if (
        !updates ||
        typeof updates !== "object" ||
        Array.isArray(updates) ||
        Object.getPrototypeOf(updates) !== Object.prototype
      ) {
        throw new TypeError(
          "Updated snippet data must be a plain object."
        );
      }

      if (
        updates.id !== undefined &&
        this.normalizeId(updates.id) !== normalizedId
      ) {
        throw new Error(
          "Changing a custom snippet ID is not supported."
        );
      }

      const definition = this.validateSnippet({
        ...existing,
        ...updates,
        id: normalizedId
      });

      this.registry.unregister(normalizedId);

      let canonical;

      try {
        canonical = this.registry.register(
          this.clone(definition)
        );

        this.snippets.set(
          normalizedId,
          canonical
        );
      } catch (error) {
        try {
          const restored = this.registry.register(
            this.clone(existing)
          );

          this.snippets.set(
            normalizedId,
            restored
          );
        } catch (rollbackError) {
          this.log(
            "error",
            `Could not restore custom snippet: ${normalizedId}`,
            rollbackError
          );
        }

        throw error;
      }

      try {
        await this.persist();

        this.log(
          "info",
          `Updated custom snippet: ${normalizedId}`
        );

        return this.clone(canonical);
      } catch (error) {
        this.registry.unregister(normalizedId);

        const restored = this.registry.register(
          this.clone(existing)
        );

        this.snippets.set(
          normalizedId,
          restored
        );

        throw error;
      }
    });
  }

  async remove(id) {
    return this.enqueueMutation(async () => {
      if (!this.initialized) {
        throw new Error(
          "[FlaskSnippets] Initialize the manager before removing snippets."
        );
      }

      const normalizedId = this.normalizeId(id);
      const existing = this.snippets.get(normalizedId);

      if (!existing) {
        throw new Error(
          `[FlaskSnippets] Custom snippet not found: ${normalizedId}`
        );
      }

      this.registry.unregister(normalizedId);
      this.snippets.delete(normalizedId);

      try {
        await this.persist();

        this.log(
          "info",
          `Removed custom snippet: ${normalizedId}`
        );

        return true;
      } catch (error) {
        const restored = this.registry.register(
          this.clone(existing)
        );

        this.snippets.set(
          normalizedId,
          restored
        );

        throw error;
      }
    });
  }

  get(id) {
    this.ensureActive();

    const normalizedId = this.normalizeId(id);
    const snippet = this.snippets.get(normalizedId);

    return snippet
      ? this.clone(snippet)
      : null;
  }

  getAll() {
    this.ensureActive();

    return [ ...this.snippets.values() ].map(
      snippet => this.clone(snippet)
    );
  }

  has(id) {
    this.ensureActive();

    if (typeof id !== "string") {
      return false;
    }

    return this.snippets.has(id.trim());
  }

  persist() {
    this.ensureActive();

    const snapshot = this.getAll();

    this.pendingSaves += 1;

    const saveOperation = this.saveQueue
      .catch(() => undefined)
      .then(() => {
        this.ensureActive();
        return this.storage.save(snapshot);
      });

    this.saveQueue = saveOperation.finally(() => {
      this.pendingSaves = Math.max(
        0,
        this.pendingSaves - 1
      );
    });

    return this.saveQueue;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      initializing: this.initializing,
      disposing: this.disposing,
      disposed: this.disposed,
      count: this.snippets.size,
      pendingMutations: this.pendingMutations,
      pendingSaves: this.pendingSaves,
      hasPendingMutations: this.pendingMutations > 0,
      hasPendingSaves: this.pendingSaves > 0
    };
  }

  dispose() {
    if (this.disposePromise) {
      return this.disposePromise;
    }

    if (this.disposed) {
      return Promise.resolve();
    }

    this.disposing = true;

    this.disposePromise = (async () => {
      if (this.initializationPromise) {
        try {
          await this.initializationPromise;
        } catch (error) {
          this.log(
            "warn",
            "Initialization ended during disposal.",
            error
          );
        }
      }

      await this.mutationQueue.catch(error => {
        this.log(
          "error",
          "Pending custom snippet mutation failed.",
          error
        );
      });

      await this.saveQueue.catch(error => {
        this.log(
          "error",
          "Pending custom snippet save failed.",
          error
        );
      });

      this.snippets.clear();

      this.registry = null;
      this.storage = null;
      this.logger = null;

      this.initialized = false;
      this.initializing = false;

      this.disposed = true;
      this.disposing = false;
    })();

    return this.disposePromise;
  }
}
