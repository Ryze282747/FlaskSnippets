
import AceSnippetAdapter from "./AceSnippetAdapter.js";
import CodeMirrorSnippetAdapter from "./CodeMirrorSnippetAdapter.js";

const EDITOR_EVENTS = [
  "switch-file",
  "file-loaded",
  "new-file",
  "rename-file",
  "editor-state-changed",
  "update:read-only"
];

const REFRESH_DELAYS = [ 0, 50, 250 ];

const DEFAULT_INDENTATION = "4-spaces";

const VALID_INDENTATIONS = new Set([
  "2-spaces",
  "4-spaces",
  "8-spaces",
  "tabs"
]);

export default class SnippetAdapter {
  constructor({
    registry,
    logger = null,
    aceAdapter = null,
    codeMirrorAdapter = null,
    indentation = DEFAULT_INDENTATION
  } = {}) {
    if (
      !registry ||
      typeof registry.getAll !== "function"
    ) {
      throw new TypeError(
        "[FlaskSnippets] SnippetAdapter requires a valid registry."
      );
    }

    if (!VALID_INDENTATIONS.has(indentation)) {
      throw new TypeError(
        `[FlaskSnippets] Invalid indentation option: ${indentation}.`
      );
    }

    this.registry = registry;
    this.logger = logger;

    this.indentation = indentation;

    this.aceAdapter =
      aceAdapter ||
      new AceSnippetAdapter({
        registry,
        logger,
        indentation
      });

    this.codeMirrorAdapter =
      codeMirrorAdapter ||
      new CodeMirrorSnippetAdapter({
        registry,
        logger,
        indentation
      });

    this.ownsAceAdapter = !aceAdapter;
    this.ownsCodeMirrorAdapter = !codeMirrorAdapter;

    this.enabled = true;
    this.autocompleteEnabled = true;

    this.initialized = false;
    this.initializing = false;

    this.disposing = false;
    this.disposed = false;

    this.initPromise = null;
    this.disposePromise = null;

    this.activeType = null;
    this.activeAdapter = null;

    this.editorManager = null;
    this.editorChangeListener = null;
    this.registeredEvents = [];

    this.refreshTimers = new Map();
  }

  ensureActive() {
    if (this.disposed || this.disposing) {
      throw new Error(
        "[FlaskSnippets] SnippetAdapter is unavailable."
      );
    }
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

  getEditorManager() {
    if (
      typeof window === "undefined" ||
      !window.editorManager
    ) {
      return null;
    }

    return window.editorManager;
  }

  getEditorType() {
    const manager = this.getEditorManager();

    if (!manager) {
      return null;
    }

    if (manager.isCodeMirror === true) {
      return "codemirror";
    }

    const editor = manager.editor;

    if (
      editor &&
      editor.state &&
      typeof editor.dispatch === "function"
    ) {
      return "codemirror";
    }

    if (editor) {
      return "ace";
    }

    return null;
  }

  getAdapter(type = this.getEditorType()) {
    if (type === "ace") {
      return this.aceAdapter;
    }

    if (type === "codemirror") {
      return this.codeMirrorAdapter;
    }

    return null;
  }

  getActiveAdapter() {
    return this.activeAdapter;
  }

  validateAdapter(adapter, name) {
    const requiredMethods = [
      "init",
      "refresh",
      "setEnabled",
      "setAutocompleteEnabled",
      "dispose"
    ];

    for (const method of requiredMethods) {
      if (typeof adapter?.[ method ] !== "function") {
        throw new TypeError(
          `[FlaskSnippets] ${name} must implement ${method}().`
        );
      }
    }
  }

  async init() {
    this.ensureActive();

    if (this.initialized) {
      return this;
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
      this.validateAdapter(
        this.aceAdapter,
        "AceSnippetAdapter"
      );

      this.validateAdapter(
        this.codeMirrorAdapter,
        "CodeMirrorSnippetAdapter"
      );

      this.ensureActive();

      this.editorManager = this.getEditorManager();

      if (!this.editorManager) {
        throw new Error(
          "[FlaskSnippets] Acode editor manager is unavailable."
        );
      }

      this.registerEditorManagerListener();

      const activated = await this.activateCurrentAdapter();

      this.ensureActive();

      if (!activated) {
        this.log(
          "warn",
          "No supported editor could be activated during initialization."
        );
      }

      this.initialized = true;

      this.scheduleRefresh();

      this.log(
        "info",
        "Snippet adapter initialized."
      );

      return this;
    } catch (error) {
      await this.cleanupAdapters();
      throw error;
    } finally {
      this.initializing = false;
      this.initPromise = null;
    }
  }

  registerEditorManagerListener() {
    const manager = this.editorManager;

    if (!manager || this.editorChangeListener) {
      return;
    }

    this.editorChangeListener =
      this.handleEditorChange.bind(this);

    if (typeof manager.on === "function") {
      manager.on(
        EDITOR_EVENTS,
        this.editorChangeListener
      );

      this.registeredEvents = [ ...EDITOR_EVENTS ];

      return;
    }

    if (typeof manager.addEventListener === "function") {
      for (const eventName of EDITOR_EVENTS) {
        manager.addEventListener(
          eventName,
          this.editorChangeListener
        );

        this.registeredEvents.push(eventName);
      }
    }
  }

  unregisterEditorManagerListener() {
    const manager = this.editorManager;

    if (
      !manager ||
      !this.editorChangeListener
    ) {
      return;
    }

    try {
      if (typeof manager.off === "function") {
        manager.off(
          this.registeredEvents.length
            ? this.registeredEvents
            : EDITOR_EVENTS,
          this.editorChangeListener
        );
      } else if (
        typeof manager.removeListener === "function"
      ) {
        for (const eventName of this.registeredEvents) {
          manager.removeListener(
            eventName,
            this.editorChangeListener
          );
        }
      } else if (
        typeof manager.removeEventListener === "function"
      ) {
        for (const eventName of this.registeredEvents) {
          manager.removeEventListener(
            eventName,
            this.editorChangeListener
          );
        }
      }
    } catch (error) {
      this.log(
        "error",
        "Could not remove editor manager listeners.",
        error
      );
    }

    this.registeredEvents = [];
    this.editorChangeListener = null;
  }

  clearRefreshTimers() {
    for (const timer of this.refreshTimers.values()) {
      clearTimeout(timer);
    }

    this.refreshTimers.clear();
  }

  scheduleRefresh() {
    if (
      this.disposed ||
      this.disposing ||
      !this.initialized ||
      !this.enabled
    ) {
      return false;
    }

    for (const delay of REFRESH_DELAYS) {
      const existingTimer = this.refreshTimers.get(delay);

      if (existingTimer !== undefined) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        this.refreshTimers.delete(delay);

        if (
          this.disposed ||
          this.disposing ||
          !this.initialized ||
          !this.enabled
        ) {
          return;
        }

        this.refresh().catch(error => {
          this.log(
            "error",
            "Scheduled editor refresh failed.",
            error
          );
        });
      }, delay);

      this.refreshTimers.set(delay, timer);
    }

    return true;
  }

  async activateCurrentAdapter() {
    this.ensureActive();

    const nextType = this.getEditorType();
    const nextAdapter = this.getAdapter(nextType);

    if (!nextType || !nextAdapter) {
      this.log(
        "warn",
        "No supported editor is currently active."
      );

      await this.deactivateCurrentAdapter();

      return false;
    }

    if (
      this.activeType === nextType &&
      this.activeAdapter
    ) {
      return true;
    }

    await this.deactivateCurrentAdapter();

    this.ensureActive();

    const previousType = this.activeType;
    const previousAdapter = this.activeAdapter;

    this.activeType = nextType;
    this.activeAdapter = nextAdapter;

    try {
      const initialized = await nextAdapter.init();

      this.ensureActive();

      if (initialized === false) {
        throw new Error(
          `[FlaskSnippets] ${nextType} adapter initialization failed.`
        );
      }

      if (
        typeof nextAdapter.setIndentation === "function"
      ) {
        await nextAdapter.setIndentation(
          this.indentation
        );
      }

      this.ensureActive();

      await nextAdapter.setEnabled(this.enabled);

      this.ensureActive();

      await nextAdapter.setAutocompleteEnabled(
        this.autocompleteEnabled
      );

      this.ensureActive();

      return true;
    } catch (error) {
      this.activeType = previousType;
      this.activeAdapter = previousAdapter;

      throw error;
    }
  }

  async deactivateCurrentAdapter() {
    const adapter = this.activeAdapter;
    const type = this.activeType;

    this.activeAdapter = null;
    this.activeType = null;

    if (!adapter) {
      return;
    }

    try {
      await adapter.setEnabled(false);
    } catch (error) {
      this.log(
        "error",
        `Could not deactivate ${type} adapter.`,
        error
      );
    }
  }

  handleEditorChange() {
    if (
      this.disposed ||
      this.disposing ||
      !this.initialized ||
      !this.enabled
    ) {
      return;
    }

    this.scheduleRefresh();
  }

  async refresh() {
    this.ensureActive();

    if (!this.initialized || !this.enabled) {
      return false;
    }

    const currentType = this.getEditorType();

    if (
      currentType !== this.activeType ||
      !this.activeAdapter
    ) {
      const activated = await this.activateCurrentAdapter();

      if (!activated) {
        return false;
      }
    }

    if (!this.activeAdapter) {
      return false;
    }

    try {
      const result = await this.activeAdapter.refresh();

      return result !== false;
    } catch (error) {
      this.log(
        "error",
        "Could not refresh the active editor adapter.",
        error
      );

      return false;
    }
  }

  async setEnabled(value) {
    this.ensureActive();

    if (typeof value !== "boolean") {
      throw new TypeError(
        "[FlaskSnippets] Enabled state must be a boolean."
      );
    }

    this.enabled = value;

    if (!this.initialized) {
      return this.enabled;
    }

    if (!value) {
      this.clearRefreshTimers();

      if (this.activeAdapter) {
        const result = await this.activeAdapter.setEnabled(false);

        return result !== false;
      }

      return true;
    }

    const activated = await this.activateCurrentAdapter();

    if (!activated || !this.activeAdapter) {
      return false;
    }

    const result = await this.activeAdapter.setEnabled(true);

    this.scheduleRefresh();

    return result !== false;
  }

  async setAutocompleteEnabled(value) {
    this.ensureActive();

    if (typeof value !== "boolean") {
      throw new TypeError(
        "[FlaskSnippets] Autocomplete state must be a boolean."
      );
    }

    this.autocompleteEnabled = value;

    if (
      !this.initialized ||
      !this.activeAdapter
    ) {
      return this.autocompleteEnabled;
    }

    return (
      await this.activeAdapter.setAutocompleteEnabled(value)
    ) !== false;
  }

  async setIndentation(value) {
    this.ensureActive();

    if (!VALID_INDENTATIONS.has(value)) {
      throw new TypeError(
        `[FlaskSnippets] Invalid indentation option: ${value}.`
      );
    }

    this.indentation = value;

    const adapters = [
      this.aceAdapter,
      this.codeMirrorAdapter
    ];

    for (const adapter of adapters) {
      if (
        adapter &&
        typeof adapter.setIndentation === "function"
      ) {
        await adapter.setIndentation(value);
      }
    }

    return this.indentation;
  }

  async cleanupAdapters() {
    const errors = [];

    this.clearRefreshTimers();
    this.unregisterEditorManagerListener();

    const adapters = [
      {
        adapter: this.codeMirrorAdapter,
        owned: this.ownsCodeMirrorAdapter
      },
      {
        adapter: this.aceAdapter,
        owned: this.ownsAceAdapter
      }
    ];

    for (const { adapter, owned } of adapters) {
      if (!owned || !adapter) {
        continue;
      }

      try {
        await adapter.dispose();
      } catch (error) {
        errors.push(error);
      }
    }

    this.activeAdapter = null;
    this.activeType = null;

    this.initialized = false;

    for (const error of errors) {
      this.log(
        "error",
        "Editor adapter cleanup failed.",
        error
      );
    }

    return errors;
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
      if (this.initPromise) {
        await this.initPromise.catch(
          () => undefined
        );
      }

      await this.cleanupAdapters();

      this.registry = null;

      this.aceAdapter = null;
      this.codeMirrorAdapter = null;

      this.editorManager = null;

      this.initialized = false;
      this.initializing = false;

      this.disposed = true;
      this.disposing = false;

      this.log(
        "info",
        "Snippet adapter disposed."
      );

      this.logger = null;
    })();

    return this.disposePromise;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      initializing: this.initializing,
      enabled: this.enabled,
      autocompleteEnabled: this.autocompleteEnabled,
      indentation: this.indentation,
      disposing: this.disposing,
      disposed: this.disposed,
      editorType: this.getEditorType(),
      activeAdapter: this.activeType,
      registeredEvents: [ ...this.registeredEvents ],
      adapterStatus:
        this.activeAdapter?.getStatus?.() || null
    };
  }
}
