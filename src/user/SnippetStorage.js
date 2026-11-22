
const STORAGE_KEY = "dev.zylle.flasksnippets.custom-snippets";
const STORAGE_VERSION = 1;

export default class SnippetStorage {
  constructor({
    storage = null,
    key = STORAGE_KEY
  } = {}) {
    if (storage !== null) {
      if (
        typeof storage.getItem !== "function" ||
        typeof storage.setItem !== "function" ||
        typeof storage.removeItem !== "function"
      ) {
        throw new TypeError(
          "[FlaskSnippets] Storage backend must provide getItem(), setItem(), and removeItem()."
        );
      }
    }

    if (
      typeof key !== "string" ||
      !key.trim()
    ) {
      throw new TypeError(
        "[FlaskSnippets] Storage key must be a non-empty string."
      );
    }

    this.storage = storage;
    this.key = key.trim();

    this.operationQueue = Promise.resolve();

    this.pendingOperations = 0;

    this.disposed = false;
  }

  ensureActive() {
    if (this.disposed) {
      throw new Error(
        "[FlaskSnippets] SnippetStorage has been disposed."
      );
    }
  }

  getBackend() {
    this.ensureActive();

    if (this.storage) {
      return this.storage;
    }

    try {
      if (
        typeof window !== "undefined" &&
        window.localStorage
      ) {
        return window.localStorage;
      }
    } catch (error) {
      throw new Error(
        "[FlaskSnippets] Browser storage is unavailable.",
        { cause: error }
      );
    }

    throw new Error(
      "[FlaskSnippets] No persistent storage backend is available."
    );
  }

  enqueueOperation(callback) {
    this.ensureActive();

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

  parseData(raw) {
    if (
      raw === null ||
      raw === undefined ||
      raw === ""
    ) {
      return [];
    }

    if (typeof raw !== "string") {
      throw new TypeError(
        "[FlaskSnippets] Stored custom snippet data must be a string."
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(
        "[FlaskSnippets] Stored custom snippets contain invalid JSON.",
        { cause: error }
      );
    }

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      Object.getPrototypeOf(parsed) !== Object.prototype
    ) {
      throw new TypeError(
        "[FlaskSnippets] Stored custom snippet data has an invalid format."
      );
    }

    if (parsed.version !== STORAGE_VERSION) {
      throw new Error(
        `[FlaskSnippets] Unsupported custom snippet storage version: ${parsed.version}`
      );
    }

    if (!Array.isArray(parsed.snippets)) {
      throw new TypeError(
        "[FlaskSnippets] Stored snippets must be an array."
      );
    }

    return parsed.snippets;
  }

  validateSnippets(snippets) {
    if (!Array.isArray(snippets)) {
      throw new TypeError(
        "[FlaskSnippets] Custom snippets must be an array."
      );
    }

    const ids = new Set();

    return snippets.map((snippet, index) => {
      if (
        !snippet ||
        typeof snippet !== "object" ||
        Array.isArray(snippet) ||
        Object.getPrototypeOf(snippet) !== Object.prototype
      ) {
        throw new TypeError(
          `[FlaskSnippets] Invalid custom snippet at index ${index}.`
        );
      }

      if (
        typeof snippet.id !== "string" ||
        !snippet.id.trim()
      ) {
        throw new TypeError(
          `[FlaskSnippets] Custom snippet at index ${index} has no valid ID.`
        );
      }

      const id = snippet.id.trim();

      if (ids.has(id)) {
        throw new Error(
          `[FlaskSnippets] Duplicate custom snippet ID: ${id}`
        );
      }

      ids.add(id);

      if (
        typeof snippet.prefix !== "string" ||
        !snippet.prefix.trim()
      ) {
        throw new TypeError(
          `[FlaskSnippets] Custom snippet at index ${index} has no valid prefix.`
        );
      }

      if (
        typeof snippet.name !== "string" ||
        !snippet.name.trim()
      ) {
        throw new TypeError(
          `[FlaskSnippets] Custom snippet at index ${index} has no valid name.`
        );
      }

      if (
        typeof snippet.body !== "string" &&
        !Array.isArray(snippet.body)
      ) {
        throw new TypeError(
          `[FlaskSnippets] Custom snippet at index ${index} has an invalid body.`
        );
      }

      if (
        Array.isArray(snippet.body) &&
        !snippet.body.every(
          line => typeof line === "string"
        )
      ) {
        throw new TypeError(
          `[FlaskSnippets] Custom snippet at index ${index} has invalid body lines.`
        );
      }

      if (
        snippet.scope !== undefined &&
        typeof snippet.scope !== "string" &&
        !Array.isArray(snippet.scope)
      ) {
        throw new TypeError(
          `[FlaskSnippets] Custom snippet at index ${index} has an invalid scope.`
        );
      }

      if (
        Array.isArray(snippet.scope) &&
        !snippet.scope.every(
          scope =>
            typeof scope === "string" &&
            scope.trim().length > 0
        )
      ) {
        throw new TypeError(
          `[FlaskSnippets] Custom snippet at index ${index} has invalid scope entries.`
        );
      }

      if (
        typeof snippet.scope === "string" &&
        !snippet.scope.trim()
      ) {
        throw new TypeError(
          `[FlaskSnippets] Custom snippet at index ${index} has an empty scope.`
        );
      }

      if (
        snippet.tags !== undefined &&
        !Array.isArray(snippet.tags)
      ) {
        throw new TypeError(
          `[FlaskSnippets] Custom snippet at index ${index} has invalid tags.`
        );
      }

      if (
        Array.isArray(snippet.tags) &&
        !snippet.tags.every(
          tag =>
            typeof tag === "string" &&
            tag.trim().length > 0
        )
      ) {
        throw new TypeError(
          `[FlaskSnippets] Custom snippet at index ${index} has invalid tag entries.`
        );
      }

      return {
        ...snippet,
        id,
        name: snippet.name.trim(),
        prefix: snippet.prefix.trim(),

        body: Array.isArray(snippet.body)
          ? [ ...snippet.body ]
          : snippet.body,

        scope: Array.isArray(snippet.scope)
          ? snippet.scope.map(scope => scope.trim())
          : typeof snippet.scope === "string"
            ? snippet.scope.trim()
            : snippet.scope,

        tags: Array.isArray(snippet.tags)
          ? snippet.tags.map(tag => tag.trim())
          : []
      };
    });
  }

  async load() {
    this.ensureActive();

    return this.enqueueOperation(async () => {
      const backend = this.getBackend();

      try {
        const raw = await backend.getItem(this.key);

        this.ensureActive();

        const snippets = this.parseData(raw);

        return this.validateSnippets(snippets);
      } catch (error) {
        throw new Error(
          "[FlaskSnippets] Could not load custom snippets.",
          { cause: error }
        );
      }
    });
  }

  async save(snippets) {
    this.ensureActive();

    const validated = this.validateSnippets(snippets);

    return this.enqueueOperation(async () => {
      const backend = this.getBackend();

      const payload = {
        version: STORAGE_VERSION,
        snippets: validated
      };

      try {
        await backend.setItem(
          this.key,
          JSON.stringify(payload)
        );
      } catch (error) {
        throw new Error(
          "[FlaskSnippets] Could not persist custom snippets.",
          { cause: error }
        );
      }

      return {
        saved: true,
        count: validated.length
      };
    });
  }

  async clear() {
    this.ensureActive();

    return this.enqueueOperation(async () => {
      const backend = this.getBackend();

      try {
        await backend.removeItem(this.key);
      } catch (error) {
        throw new Error(
          "[FlaskSnippets] Could not clear custom snippets.",
          { cause: error }
        );
      }

      return true;
    });
  }

  getStatus() {
    return {
      disposed: this.disposed,
      key: this.key,
      hasCustomBackend: Boolean(this.storage),
      pendingOperations: this.pendingOperations
    };
  }

  async dispose() {
    if (this.disposed) {
      return;
    }

    await this.operationQueue.catch(() => undefined);

    this.disposed = true;
    this.storage = null;
  }
}
