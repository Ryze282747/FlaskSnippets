
import SnippetFormatter from "../../snippets/SnippetFormatter.js";

const COMMAND_NAME = "flaskSnippetsExpand";

const DEFAULT_INDENTATION = "4-spaces";

const VALID_INDENTATIONS = new Set([
  "2-spaces",
  "4-spaces",
  "8-spaces",
  "tabs"
]);

const EDITOR_OPTIONS = Object.freeze({
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  enableSnippets: true
});

export default class AceSnippetAdapter {
  constructor({
    registry,
    logger = null,
    indentation = DEFAULT_INDENTATION
  } = {}) {
    if (
      !registry ||
      typeof registry.getAll !== "function"
    ) {
      throw new TypeError(
        "[FlaskSnippets] AceSnippetAdapter requires a valid snippet registry."
      );
    }

    this.registry = registry;
    this.logger = logger;

    this.formatter = new SnippetFormatter(
      indentation
    );

    this.ace = null;
    this.editorManager = null;
    this.editor = null;
    this.snippetManager = null;

    this.registeredScopes = new Map();
    this.previousOptions = new Map();

    this.changeModeListener = null;
    this.editorChangeListener = null;

    this.activeScope = null;

    this.enabled = true;
    this.autocompleteEnabled = true;

    this.initialized = false;
    this.initializing = false;
    this.disposed = false;

    this.commandRegistered = false;

    this.initPromise = null;
    this.lastEditor = null;
  }

  ensureActive() {
    if (this.disposed) {
      throw new Error(
        "[FlaskSnippets] AceSnippetAdapter has been disposed."
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

  getRuntime({
    aceInstance = null,
    editorManagerInstance = null
  } = {}) {
    const aceRuntime =
      aceInstance ||
      (typeof window !== "undefined"
        ? window.ace
        : null);

    const manager =
      editorManagerInstance ||
      (typeof window !== "undefined"
        ? window.editorManager
        : null);

    return {
      ace: aceRuntime,
      manager
    };
  }

  async init(options = {}) {
    this.ensureActive();

    if (this.initialized) {
      return true;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initializing = true;

    this.initPromise = this.initialize(options);

    return this.initPromise;
  }

  async initialize(options = {}) {
    try {
      const {
        ace: aceRuntime,
        manager
      } = this.getRuntime(options);

      if (manager?.isCodeMirror) {
        return false;
      }

      if (
        !aceRuntime ||
        typeof aceRuntime.require !== "function" ||
        !manager?.editor
      ) {
        return false;
      }

      const snippetModule = aceRuntime.require(
        "ace/snippets"
      );

      const snippetManager =
        snippetModule?.snippetManager;

      if (
        !snippetManager ||
        typeof snippetManager.register !== "function" ||
        typeof snippetManager.unregister !== "function" ||
        typeof snippetManager.expandWithTab !== "function"
      ) {
        throw new Error(
          "[FlaskSnippets] Required Ace snippet manager APIs are unavailable."
        );
      }

      this.ace = aceRuntime;
      this.editorManager = manager;
      this.snippetManager = snippetManager;

      this.initialized = true;

      this.attachEditor(manager.editor);

      this.editorChangeListener =
        this.handleEditorChange.bind(this);

      this.registerEditorManagerListener();

      this.log(
        "info",
        "Ace integration initialized."
      );

      return true;
    } catch (error) {
      this.cleanupRuntime();
      throw error;
    } finally {
      this.initializing = false;
      this.initPromise = null;
    }
  }

  registerEditorManagerListener() {
    const manager = this.editorManager;

    if (!manager) {
      return;
    }

    if (typeof manager.on === "function") {
      manager.on(
        "change",
        this.editorChangeListener
      );

      return;
    }

    if (typeof manager.addEventListener === "function") {
      manager.addEventListener(
        "change",
        this.editorChangeListener
      );
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
          "change",
          this.editorChangeListener
        );
      } else if (
        typeof manager.removeListener === "function"
      ) {
        manager.removeListener(
          "change",
          this.editorChangeListener
        );
      } else if (
        typeof manager.removeEventListener === "function"
      ) {
        manager.removeEventListener(
          "change",
          this.editorChangeListener
        );
      }
    } catch (error) {
      this.log(
        "error",
        "Could not remove editor manager listener.",
        error
      );
    }

    this.editorChangeListener = null;
  }

  handleEditorChange() {
    if (
      this.disposed ||
      !this.initialized ||
      !this.enabled
    ) {
      return;
    }

    const nextEditor = this.editorManager?.editor;

    if (
      !nextEditor ||
      nextEditor === this.editor
    ) {
      return;
    }

    try {
      this.attachEditor(nextEditor);
    } catch (error) {
      this.log(
        "error",
        "Could not attach to the active Ace editor.",
        error
      );
    }
  }

  validateEditor(editor) {
    return Boolean(
      editor &&
      typeof editor.on === "function" &&
      typeof editor.setOption === "function" &&
      typeof editor.getOption === "function" &&
      editor.commands &&
      typeof editor.commands.addCommand === "function"
    );
  }

  attachEditor(editor) {
    this.ensureActive();

    if (!this.validateEditor(editor)) {
      throw new Error(
        "[FlaskSnippets] Required Ace editor APIs are unavailable."
      );
    }

    if (editor === this.editor) {
      return true;
    }

    this.detachEditor();

    this.editor = editor;
    this.lastEditor = editor;

    this.saveEditorOptions();

    this.changeModeListener =
      this.handleModeChange.bind(this);

    this.editor.on(
      "changeMode",
      this.changeModeListener
    );

    if (this.enabled) {
      this.applyEditorOptions();
      this.registerExpandCommand();
      this.registerCurrentMode();
    }

    return true;
  }

  detachEditor() {
    const editor = this.editor;

    if (!editor) {
      this.unregisterAllScopes();
      return;
    }

    try {
      if (this.changeModeListener) {
        editor.off?.(
          "changeMode",
          this.changeModeListener
        );
      }
    } catch (error) {
      this.log(
        "error",
        "Could not remove Ace mode listener.",
        error
      );
    }

    try {
      this.unregisterExpandCommand();
    } catch (error) {
      this.log(
        "error",
        "Could not remove Ace expansion command.",
        error
      );
    }

    try {
      this.unregisterAllScopes();
    } catch (error) {
      this.log(
        "error",
        "Could not unregister Ace snippets.",
        error
      );
    }

    try {
      this.restoreEditorOptions();
    } catch (error) {
      this.log(
        "error",
        "Could not restore Ace editor options.",
        error
      );
    }

    this.changeModeListener = null;
    this.commandRegistered = false;

    this.previousOptions.clear();

    this.editor = null;
    this.activeScope = null;
  }

  saveEditorOptions() {
    if (!this.editor) {
      return;
    }

    this.previousOptions.clear();

    for (const option of Object.keys(EDITOR_OPTIONS)) {
      this.previousOptions.set(
        option,
        this.editor.getOption(option)
      );
    }
  }

  applyEditorOptions() {
    if (!this.editor || !this.enabled) {
      return;
    }

    this.editor.setOption(
      "enableBasicAutocompletion",
      this.autocompleteEnabled
    );

    this.editor.setOption(
      "enableLiveAutocompletion",
      this.autocompleteEnabled
    );

    this.editor.setOption(
      "enableSnippets",
      true
    );
  }

  restoreEditorOptions() {
    if (!this.editor) {
      return;
    }

    for (const [ option, value ] of this.previousOptions) {
      if (value === undefined) {
        continue;
      }

      this.editor.setOption(option, value);
    }
  }

  registerExpandCommand() {
    if (
      !this.editor ||
      this.commandRegistered ||
      !this.enabled
    ) {
      return;
    }

    this.editor.commands.addCommand({
      name: COMMAND_NAME,
      description: "Expand Flask snippet",

      exec: activeEditor => {
        if (
          !this.enabled ||
          !this.snippetManager ||
          !activeEditor
        ) {
          return;
        }

        this.snippetManager.expandWithTab(
          activeEditor
        );
      },

      bindKey: {
        win: "Tab"
      }
    });

    this.commandRegistered = true;
  }

  unregisterExpandCommand() {
    if (
      !this.editor ||
      !this.commandRegistered
    ) {
      return;
    }

    this.editor.commands.removeCommand?.(
      COMMAND_NAME
    );

    this.commandRegistered = false;
  }

  getCurrentScope() {
    const mode = this.editor?.session?.$mode;

    if (!mode) {
      return null;
    }

    const modeId =
      typeof mode === "string"
        ? mode
        : mode.$id;

    if (
      typeof modeId !== "string" ||
      !modeId.trim()
    ) {
      return null;
    }

    return modeId
      .replace(/^ace\/mode\//, "")
      .split("/")
      .pop()
      .toLowerCase();
  }

  createAceSnippet(snippet, scope) {
    return {
      name: snippet.name,
      tabTrigger: snippet.prefix,
      content: this.formatter.format(snippet.body),
      scope
    };
  }

  getSnippetsForScope(scope) {
    return this.registry
      .getAll()
      .filter(snippet => {
        const scopes = Array.isArray(snippet.scope)
          ? snippet.scope
          : [ snippet.scope ];

        return scopes.some(item => {
          return (
            typeof item === "string" &&
            item.toLowerCase() === scope
          );
        });
      })
      .map(snippet => {
        return this.createAceSnippet(
          snippet,
          scope
        );
      });
  }

  registerScope(scope) {
    this.ensureActive();

    if (
      !this.snippetManager ||
      typeof scope !== "string" ||
      !scope.trim()
    ) {
      return false;
    }

    const normalizedScope = scope.trim().toLowerCase();

    this.unregisterScope(normalizedScope);

    const snippets = this.getSnippetsForScope(
      normalizedScope
    );

    if (snippets.length === 0) {
      return false;
    }

    this.snippetManager.register(
      snippets,
      normalizedScope
    );

    this.registeredScopes.set(
      normalizedScope,
      snippets
    );

    return true;
  }

  unregisterScope(scope) {
    const snippets = this.registeredScopes.get(scope);

    if (!snippets) {
      return false;
    }

    if (
      this.snippetManager &&
      typeof this.snippetManager.unregister === "function"
    ) {
      this.snippetManager.unregister(snippets);
    }

    this.registeredScopes.delete(scope);

    if (this.activeScope === scope) {
      this.activeScope = null;
    }

    return true;
  }

  unregisterAllScopes() {
    const scopes = [
      ...this.registeredScopes.keys()
    ];

    for (const scope of scopes) {
      try {
        this.unregisterScope(scope);
      } catch (error) {
        this.log(
          "error",
          `Could not unregister snippets for "${scope}".`,
          error
        );
      }
    }

    this.registeredScopes.clear();
    this.activeScope = null;
  }

  registerCurrentMode() {
    this.ensureActive();

    if (
      !this.enabled ||
      !this.initialized
    ) {
      return false;
    }

    const scope = this.getCurrentScope();

    if (!scope) {
      this.unregisterAllScopes();
      return false;
    }

    if (
      this.activeScope &&
      this.activeScope !== scope
    ) {
      this.unregisterScope(this.activeScope);
    }

    const registered = this.registerScope(scope);

    this.activeScope = registered
      ? scope
      : null;

    return registered;
  }

  handleModeChange() {
    if (
      this.disposed ||
      !this.initialized ||
      !this.enabled
    ) {
      return;
    }

    try {
      this.registerCurrentMode();
    } catch (error) {
      this.log(
        "error",
        "Failed to register Ace snippets.",
        error
      );
    }
  }

  refresh() {
    this.ensureActive();

    if (
      !this.initialized ||
      !this.enabled
    ) {
      return false;
    }

    try {
      this.unregisterAllScopes();

      return this.registerCurrentMode();
    } catch (error) {
      this.log(
        "error",
        "Failed to refresh Ace snippets.",
        error
      );

      return false;
    }
  }

  async setIndentation(value) {
    this.ensureActive();

    if (!VALID_INDENTATIONS.has(value)) {
      throw new TypeError(
        `[FlaskSnippets] Invalid indentation option: ${value}`
      );
    }

    if (
      this.formatter.getIndentation() === value
    ) {
      return value;
    }

    this.formatter.setIndentation(value);

    if (this.initialized && this.enabled) {
      this.refresh();
    }

    return value;
  }

  async setEnabled(value) {
    this.ensureActive();

    if (typeof value !== "boolean") {
      throw new TypeError(
        "[FlaskSnippets] Ace enabled state must be a boolean."
      );
    }

    this.enabled = value;

    if (!this.initialized) {
      return this.enabled;
    }

    if (value) {
      this.applyEditorOptions();
      this.registerExpandCommand();
      this.registerCurrentMode();
    } else {
      this.unregisterExpandCommand();
      this.unregisterAllScopes();
      this.restoreEditorOptions();
    }

    return this.enabled;
  }

  async setAutocompleteEnabled(value) {
    this.ensureActive();

    if (typeof value !== "boolean") {
      throw new TypeError(
        "[FlaskSnippets] Ace autocomplete state must be a boolean."
      );
    }

    this.autocompleteEnabled = value;

    if (this.initialized && this.enabled) {
      this.applyEditorOptions();
    }

    return this.autocompleteEnabled;
  }

  cleanupRuntime() {
    const errors = [];

    try {
      this.unregisterEditorManagerListener();
    } catch (error) {
      errors.push(error);
    }

    try {
      this.detachEditor();
    } catch (error) {
      errors.push(error);
    }

    try {
      this.unregisterAllScopes();
    } catch (error) {
      errors.push(error);
    }

    this.ace = null;
    this.editorManager = null;
    this.snippetManager = null;

    this.initialized = false;
    this.initializing = false;

    for (const error of errors) {
      this.log(
        "error",
        "Ace runtime cleanup failed.",
        error
      );
    }

    return errors;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      initializing: this.initializing,
      enabled: this.enabled,
      autocompleteEnabled: this.autocompleteEnabled,
      indentation: this.formatter.getIndentation(),
      disposed: this.disposed,
      currentScope: this.getCurrentScope(),
      activeScope: this.activeScope,
      registeredScopeCount: this.registeredScopes.size,
      registeredScopes: [
        ...this.registeredScopes.keys()
      ]
    };
  }

  async dispose() {
    if (this.disposed) {
      return;
    }

    if (this.initPromise) {
      await this.initPromise.catch(
        () => undefined
      );
    }

    this.cleanupRuntime();

    this.registry = null;

    this.disposed = true;

    this.log(
      "info",
      "Ace integration disposed."
    );

    this.logger = null;
  }
}
