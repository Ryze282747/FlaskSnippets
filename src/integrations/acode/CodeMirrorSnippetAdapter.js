import SnippetFormatter from "../../snippets/SnippetFormatter.js";

const DEFAULT_SCOPE = "python";
const DEFAULT_INDENTATION = "4-spaces";

const VALID_INDENTATIONS = new Set([
  "2-spaces",
  "4-spaces",
  "8-spaces",
  "tabs"
]);

const EDITOR_EVENTS = [
  "switch-file",
  "file-loaded",
  "new-file",
  "rename-file",
  "editor-state-changed",
  "update:read-only"
];

const INTERACTION_EVENTS = [
  "focusin",
  "pointerdown",
  "beforeinput"
];

const RECONCILE_DELAYS = [ 0, 50, 250 ];

const PYTHON_EXTENSIONS = new Set([
  "py",
  "pyw"
]);

const HTML_SCOPE = "html";

const HTML_EXTENSIONS = new Set([
  "html",
  "htm",
  "xhtml",
  "jinja",
  "jinja2",
  "j2"
]);

const PYTHON_MODES = new Set([
  "python",
  "python3",
  "py"
]);

const HTML_MODES = new Set([
  "html",
  "htm",
  "xhtml",
  "django",
  "jinja",
  "jinja2"
]);

const GENERIC_MODES = new Set([
  "",
  "text",
  "plain",
  "plaintext",
  "plain_text",
  "text/plain"
]);

export default class CodeMirrorSnippetAdapter {
  constructor({
    registry,
    logger = null,
    defaultScope = DEFAULT_SCOPE,
    indentation = DEFAULT_INDENTATION
  } = {}) {
    if (
      !registry ||
      typeof registry.getAll !== "function"
    ) {
      throw new TypeError(
        "[FlaskSnippets] CodeMirrorSnippetAdapter requires a valid snippet registry."
      );
    }

    if (
      typeof defaultScope !== "string" ||
      !defaultScope.trim()
    ) {
      throw new TypeError(
        "[FlaskSnippets] defaultScope must be a non-empty string."
      );
    }

    this.registry = registry;
    this.logger = logger;
    this.defaultScope = defaultScope.trim().toLowerCase();

    this.formatter = new SnippetFormatter(indentation);

    this.completionSources = new Map();
    this.attachments = new Map();
    this.reconcileTimers = new Map();

    // One compartment is shared by every CodeMirror view.
    this.compartment = null;

    this.acode = null;
    this.editorManager = null;
    this.autocomplete = null;
    this.stateModule = null;

    this.enabled = true;
    this.autocompleteEnabled = true;

    this.initialized = false;
    this.initializing = false;
    this.disposing = false;
    this.disposed = false;

    this.initPromise = null;
    this.disposePromise = null;

    this.managerListener = null;
    this.interactionListener = null;

    this.registeredEvents = [];
    this.registeredInteractionEvents = [];
  }

  ensureActive() {
    if (this.disposed || this.disposing) {
      throw new Error(
        "[FlaskSnippets] CodeMirrorSnippetAdapter is unavailable."
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

  async init({
    acodeInstance = null,
    editorManagerInstance = null
  } = {}) {
    this.ensureActive();

    if (this.initialized) {
      return true;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initializing = true;

    this.initPromise = this.initialize({
      acodeInstance,
      editorManagerInstance
    });

    return this.initPromise;
  }

  async initialize({
    acodeInstance,
    editorManagerInstance
  }) {
    try {
      const runtime =
        acodeInstance ||
        (typeof window !== "undefined"
          ? window.acode
          : null);

      const manager =
        editorManagerInstance ||
        (typeof window !== "undefined"
          ? window.editorManager
          : null);

      if (
        !runtime ||
        typeof runtime.require !== "function"
      ) {
        throw new Error(
          "[FlaskSnippets] Acode runtime is unavailable."
        );
      }

      if (!manager) {
        throw new Error(
          "[FlaskSnippets] Acode editor manager is unavailable."
        );
      }

      const autocomplete = runtime.require(
        "@codemirror/autocomplete"
      );

      const stateModule = runtime.require(
        "@codemirror/state"
      );

      if (
        !autocomplete ||
        typeof autocomplete.snippetCompletion !== "function" ||
        !stateModule ||
        typeof stateModule.Compartment !== "function" ||
        !stateModule.StateEffect?.appendConfig ||
        typeof stateModule.EditorState?.languageData?.of !== "function"
      ) {
        throw new Error(
          "[FlaskSnippets] Required CodeMirror APIs are unavailable."
        );
      }

      this.ensureActive();

      this.acode = runtime;
      this.editorManager = manager;
      this.autocomplete = autocomplete;
      this.stateModule = stateModule;
      this.compartment = new stateModule.Compartment();

      this.managerListener =
        this.handleEditorChange.bind(this);

      this.interactionListener =
        this.handleInteraction.bind(this);

      this.registerManagerListener();
      this.registerInteractionListeners();

      this.initialized = true;

      this.scheduleReconcile();

      this.log(
        "info",
        `CodeMirror integration initialized. Found ${this.getEditorViews().length} editor view(s); attached ${this.attachments.size}.`
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

  normalizeScope(scope) {
    if (
      typeof scope !== "string" ||
      !scope.trim()
    ) {
      throw new TypeError(
        "[FlaskSnippets] Editor scope must be a non-empty string."
      );
    }

    return scope.trim().toLowerCase();
  }

  isEditorView(candidate) {
    return Boolean(
      candidate &&
      candidate.state &&
      typeof candidate.dispatch === "function"
    );
  }

  getEditorView(manager = this.editorManager) {
    if (!manager) {
      return null;
    }

    if (this.isEditorView(manager.editor)) {
      return manager.editor;
    }

    return null;
  }

  getEditorViews() {
    const manager = this.editorManager;

    if (!manager) {
      return [];
    }

    const views = new Set();

    if (this.isEditorView(manager.editor)) {
      views.add(manager.editor);
    }

    if (Array.isArray(manager.panes)) {
      for (const pane of manager.panes) {
        const view = pane?.editor;

        if (this.isEditorView(view)) {
          views.add(view);
        }
      }
    }

    return [ ...views ];
  }

  registerManagerListener() {
    const manager = this.editorManager;

    if (
      !manager ||
      !this.managerListener
    ) {
      return;
    }

    if (typeof manager.on === "function") {
      manager.on(
        EDITOR_EVENTS,
        this.managerListener
      );

      this.registeredEvents = [ ...EDITOR_EVENTS ];

      return;
    }

    if (typeof manager.addEventListener === "function") {
      for (const eventName of EDITOR_EVENTS) {
        manager.addEventListener(
          eventName,
          this.managerListener
        );

        this.registeredEvents.push(eventName);
      }
    }
  }

  unregisterManagerListener() {
    const manager = this.editorManager;

    if (
      !manager ||
      !this.managerListener
    ) {
      return;
    }

    try {
      if (typeof manager.off === "function") {
        manager.off(
          this.registeredEvents.length
            ? this.registeredEvents
            : EDITOR_EVENTS,
          this.managerListener
        );
      } else if (
        typeof manager.removeListener === "function"
      ) {
        for (const eventName of this.registeredEvents) {
          manager.removeListener(
            eventName,
            this.managerListener
          );
        }
      } else if (
        typeof manager.removeEventListener === "function"
      ) {
        for (const eventName of this.registeredEvents) {
          manager.removeEventListener(
            eventName,
            this.managerListener
          );
        }
      }
    } catch (error) {
      this.log(
        "error",
        "Could not remove CodeMirror editor listeners.",
        error
      );
    }

    this.registeredEvents = [];
    this.managerListener = null;
  }

  registerInteractionListeners() {
    if (
      typeof document === "undefined" ||
      !this.interactionListener
    ) {
      return;
    }

    for (const eventName of INTERACTION_EVENTS) {
      try {
        document.addEventListener(
          eventName,
          this.interactionListener,
          true
        );

        this.registeredInteractionEvents.push(eventName);
      } catch (error) {
        this.log(
          "warn",
          `Could not register ${eventName} interaction listener.`,
          error
        );
      }
    }
  }

  unregisterInteractionListeners() {
    if (
      typeof document === "undefined" ||
      !this.interactionListener
    ) {
      this.registeredInteractionEvents = [];
      this.interactionListener = null;
      return;
    }

    for (const eventName of this.registeredInteractionEvents) {
      try {
        document.removeEventListener(
          eventName,
          this.interactionListener,
          true
        );
      } catch (error) {
        this.log(
          "warn",
          `Could not remove ${eventName} interaction listener.`,
          error
        );
      }
    }

    this.registeredInteractionEvents = [];
    this.interactionListener = null;
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

    this.scheduleReconcile();
  }

  scheduleReconcile(candidate = null) {
    if (
      !this.initialized ||
      this.disposed ||
      this.disposing ||
      !this.enabled
    ) {
      return false;
    }

    this.reconcileEditors(candidate);

    for (const delay of RECONCILE_DELAYS) {
      const existingTimer = this.reconcileTimers.get(delay);

      if (existingTimer !== undefined) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        this.reconcileTimers.delete(delay);

        if (
          this.disposed ||
          this.disposing ||
          !this.initialized ||
          !this.enabled
        ) {
          return;
        }

        this.reconcileEditors();
      }, delay);

      this.reconcileTimers.set(delay, timer);
    }

    return true;
  }

  clearReconcileTimers() {
    for (const timer of this.reconcileTimers.values()) {
      clearTimeout(timer);
    }

    this.reconcileTimers.clear();
  }

  getViewForEvent(event) {
    if (!event) {
      return null;
    }

    const views = this.getEditorViews();

    if (views.length === 0) {
      return null;
    }

    let elements = [];

    if (typeof event.composedPath === "function") {
      elements = event.composedPath();
    } else if (event.target) {
      elements = [ event.target ];
    }

    for (const view of views) {
      const dom = view.dom;
      const contentDOM = view.contentDOM;

      if (!dom) {
        continue;
      }

      for (const element of elements) {
        if (
          !element ||
          typeof element.nodeType !== "number"
        ) {
          continue;
        }

        if (
          element === dom ||
          element === contentDOM
        ) {
          return view;
        }

        if (
          typeof dom.contains === "function" &&
          dom.contains(element)
        ) {
          return view;
        }

        if (
          contentDOM &&
          typeof contentDOM.contains === "function" &&
          contentDOM.contains(element)
        ) {
          return view;
        }
      }
    }

    return null;
  }

  // Find the file associated with a CodeMirror editor view.
  getFileForView(view) {
    const manager = this.editorManager;

    if (!manager || !view) {
      return null;
    }

    const panes = Array.isArray(manager.panes)
      ? manager.panes
      : [];

    const pane = panes.find(candidate => {
      return (
        candidate?.editor === view ||
        candidate?.editor?.state === view.state
      );
    });

    const paneFile =
      pane?.activeFile ||
      pane?.file ||
      null;

    if (
      paneFile &&
      typeof paneFile === "object"
    ) {
      return paneFile;
    }

    if (
      manager.editor === view ||
      manager.editor?.state === view.state
    ) {
      if (
        manager.activeFile &&
        typeof manager.activeFile === "object"
      ) {
        return manager.activeFile;
      }
    }

    const files = Array.isArray(manager.files)
      ? manager.files
      : [];

    return files.find(file => {
      const session = file?.session;

      return (
        session === view.state ||
        session?.__rawState === view.state
      );
    }) || null;
  }

  getFilePath(file) {
    if (typeof file === "string") {
      return file;
    }

    if (!file || typeof file !== "object") {
      return "";
    }

    const candidates = [
      file.filename,
      file.fileName,
      file.name,
      file.path,
      file.filepath,
      file.filePath,
      file.uri,
      file.location,
      file.title
    ];

    for (const candidate of candidates) {
      if (
        typeof candidate === "string" &&
        candidate.trim()
      ) {
        return candidate.trim();
      }
    }

    return "";
  }

  getFileExtension(file) {
    const filePath = this.getFilePath(file);

    if (!filePath) {
      return "";
    }

    const cleanPath = filePath
      .split(/[?#]/, 1)[ 0 ]
      .replace(/\\/g, "/");

    const filename = cleanPath.split("/").pop() || "";
    const match = filename.match(/\.([^.]+)$/);

    return match
      ? match[ 1 ].toLowerCase()
      : "";
  }

  normalizeLanguageMode(mode) {
    if (typeof mode !== "string") {
      return "";
    }

    let normalized = mode
      .trim()
      .toLowerCase();

    if (!normalized) {
      return "";
    }

    normalized = normalized
      .replace(/^ace\/mode\//, "")
      .replace(/^text\/x-/, "")
      .replace(/^application\/x-/, "")
      .replace(/^text\//, "")
      .replace(/^source\./, "");

    normalized = normalized.split("/").pop();

    return normalized;
  }

  getFileMode(file) {
    if (!file || typeof file !== "object") {
      return "";
    }

    const candidates = [
      file.currentMode,
      file.mode,
      file.language,
      file.languageId,
      file.session?.language,
      file.session?.$mode?.$id,
      file.session?.$mode
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return this.normalizeLanguageMode(candidate);
      }

      if (
        candidate &&
        typeof candidate === "object"
      ) {
        const name =
          candidate.name ||
          candidate.id ||
          candidate.language;

        if (typeof name === "string" && name.trim()) {
          return this.normalizeLanguageMode(name);
        }
      }
    }

    return "";
  }

  // Detect the appropriate snippet scope for each editor.
  // Flask snippets use Python scope, while Jinja snippets
  // use HTML scope.
  getScopeForView(view) {
    const file = this.getFileForView(view);

    if (!file) {
      return null;
    }

    const extension = this.getFileExtension(file);

    // A known extension takes priority over language mode.
    if (extension) {
      if (PYTHON_EXTENSIONS.has(extension)) {
        return this.defaultScope;
      }

      if (HTML_EXTENSIONS.has(extension)) {
        return HTML_SCOPE;
      }

      return null;
    }

    const mode = this.getFileMode(file);

    if (!mode || GENERIC_MODES.has(mode)) {
      return null;
    }

    if (PYTHON_MODES.has(mode)) {
      return this.defaultScope;
    }

    if (HTML_MODES.has(mode)) {
      return HTML_SCOPE;
    }

    return null;
  }

  handleInteraction(event) {
    if (
      this.disposed ||
      this.disposing ||
      !this.initialized ||
      !this.enabled
    ) {
      return;
    }

    const view = this.getViewForEvent(event);

    if (!view) {
      return;
    }

    this.reconcileView(view);
  }

  reconcileView(view) {
    if (
      !this.initialized ||
      this.disposed ||
      this.disposing ||
      !this.isEditorView(view)
    ) {
      return false;
    }

    const scope = this.getScopeForView(view);
    const installed = this.compartment?.get(view.state);

    if (!scope) {
      if (installed !== undefined) {
        try {
          view.dispatch({
            effects: this.compartment.reconfigure([])
          });
        } catch (error) {
          this.log(
            "warn",
            "Could not remove snippets from an unsupported editor.",
            error
          );
        }
      }

      this.attachments.delete(view);

      return false;
    }

    const attachment = this.attachments.get(view);

    if (installed !== undefined) {
      if (attachment?.scope !== scope) {
        try {
          view.dispatch({
            effects: this.compartment.reconfigure(
              this.createExtension(scope)
            )
          });
        } catch (error) {
          this.log(
            "error",
            "Could not update editor language scope.",
            error
          );

          return false;
        }
      }

      this.attachments.set(view, { scope });
      this.syncFileSession(view);

      return true;
    }

    return this.attach(view, { scope });
  }

  reconcileEditors(candidate = null) {
    if (
      !this.initialized ||
      this.disposed ||
      this.disposing
    ) {
      return false;
    }

    if (!this.enabled) {
      return true;
    }

    const currentViews = new Set(this.getEditorViews());

    if (this.isEditorView(candidate)) {
      currentViews.add(candidate);
    }

    let successful = true;

    for (const view of currentViews) {
      try {
        if (!this.reconcileView(view)) {
          if (this.getScopeForView(view) !== null) {
            successful = false;
          }
        }
      } catch (error) {
        successful = false;

        this.log(
          "error",
          "Could not reconcile an editor.",
          error
        );
      }
    }

    this.log(
      "debug",
      `Editor reconciliation completed. Found ${currentViews.size} visible view(s); tracking ${this.attachments.size} eligible editor(s).`
    );

    return successful;
  }

  normalizeTemplate(body) {
    if (Array.isArray(body)) {
      body = body.join("\n");
    }

    if (typeof body !== "string") {
      throw new TypeError(
        "[FlaskSnippets] Snippet body must be a string or an array of strings."
      );
    }

    const formattedBody = this.formatter.format(body);

    return formattedBody.replace(/\\\$/g, "$");
  }

  getSuggestions(prefix, scope) {
    const normalizedPrefix = prefix.toLowerCase();

    return this.registry
      .getAll()
      .filter(snippet => {
        const scopes = Array.isArray(snippet.scope)
          ? snippet.scope
          : [ snippet.scope ];

        return (
          scopes.some(item => {
            return (
              typeof item === "string" &&
              item.toLowerCase() === scope
            );
          }) &&
          typeof snippet.prefix === "string" &&
          snippet.prefix
            .toLowerCase()
            .startsWith(normalizedPrefix)
        );
      })
      .sort((a, b) => {
        const aPrefix = a.prefix.toLowerCase();
        const bPrefix = b.prefix.toLowerCase();

        const aExact = aPrefix === normalizedPrefix;
        const bExact = bPrefix === normalizedPrefix;

        if (aExact !== bExact) {
          return aExact ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      });
  }

  createCompletionSource(scope) {
    return context => {
      if (
        !this.enabled ||
        !this.autocompleteEnabled ||
        this.disposed ||
        this.disposing
      ) {
        return null;
      }

      const match = context.matchBefore(
        /[A-Za-z0-9_]*/
      );

      if (!match || !match.text) {
        return null;
      }

      const snippets = this.getSuggestions(
        match.text,
        scope
      );

      console.log(
        "[FlaskSnippets] Completion requested:",
        {
          typed: match.text,
          scope,
          matchingSnippets: snippets.length
        }
      );

      if (snippets.length === 0) {
        return null;
      }

      const options = snippets.map(snippet => {
        return this.autocomplete.snippetCompletion(
          this.normalizeTemplate(snippet.body),
          {
            label: snippet.prefix,
            detail: snippet.name,
            info: snippet.description || snippet.category,
            type: "keyword"
          }
        );
      });

      return {
        from: match.from,
        options,
        validFor: /^[A-Za-z0-9_]*$/
      };
    };
  }

  getCompletionSource(scope) {
    const normalizedScope = this.normalizeScope(scope);

    if (!this.completionSources.has(normalizedScope)) {
      this.completionSources.set(
        normalizedScope,
        this.createCompletionSource(normalizedScope)
      );
    }

    return this.completionSources.get(normalizedScope);
  }

  createExtension(scope) {
    if (
      !this.enabled ||
      !this.autocompleteEnabled
    ) {
      return [];
    }

    const completionSource =
      this.getCompletionSource(scope);

    return this.stateModule.EditorState.languageData.of(
      () => [
        {
          autocomplete: completionSource
        }
      ]
    );
  }

  syncFileSession(view) {
    const file = this.getFileForView(view);

    if (file?.type === "editor") {
      file.session = view.state;
    }
  }

  attach(view, {
    scope = null
  } = {}) {
    this.ensureActive();

    if (!this.initialized) {
      throw new Error(
        "[FlaskSnippets] Initialize the adapter before attaching an editor."
      );
    }

    if (!this.isEditorView(view)) {
      throw new TypeError(
        "[FlaskSnippets] A valid CodeMirror EditorView is required."
      );
    }

    if (!scope) {
      return false;
    }

    const normalizedScope = this.normalizeScope(scope);

    if (!this.compartment) {
      throw new Error(
        "[FlaskSnippets] CodeMirror completion compartment is unavailable."
      );
    }

    const existingExtension = this.compartment.get(view.state);

    if (existingExtension !== undefined) {
      this.attachments.set(view, {
        scope: normalizedScope
      });

      return false;
    }

    view.dispatch({
      effects:
        this.stateModule.StateEffect.appendConfig.of(
          this.compartment.of(
            this.createExtension(normalizedScope)
          )
        )
    });

    this.attachments.set(view, {
      scope: normalizedScope
    });

    this.syncFileSession(view);

    this.log(
      "debug",
      `Attached CodeMirror completion extension. Scope: ${normalizedScope}.`
    );

    return true;
  }

  detach(view) {
    if (!view) {
      return false;
    }

    const attachment = this.attachments.get(view);

    if (!attachment) {
      return false;
    }

    try {
      if (
        this.compartment &&
        this.isEditorView(view) &&
        this.compartment.get(view.state) !== undefined
      ) {
        view.dispatch({
          effects: this.compartment.reconfigure([])
        });
      }
    } catch (error) {
      this.log(
        "warn",
        "Could not remove CodeMirror completion extension.",
        error
      );
    }

    this.attachments.delete(view);

    return true;
  }

  updateAttachment(view, attachment) {
    if (
      !view ||
      !attachment ||
      !this.initialized
    ) {
      return false;
    }

    try {
      const scope = this.getScopeForView(view);

      if (!scope) {
        this.reconcileView(view);
        return true;
      }

      attachment.scope = scope;

      if (!this.compartment) {
        return false;
      }

      if (this.compartment.get(view.state) === undefined) {
        if (!this.enabled) {
          return true;
        }

        this.attach(view, { scope });

        return true;
      }

      view.dispatch({
        effects: this.compartment.reconfigure(
          this.createExtension(scope)
        )
      });

      this.attachments.set(view, { scope });
      this.syncFileSession(view);

      return true;
    } catch (error) {
      this.log(
        "error",
        "Could not update CodeMirror completion extension.",
        error
      );

      return false;
    }
  }

  updateAttachments() {
    let successful = true;

    for (const [ view, attachment ] of [ ...this.attachments ]) {
      if (!this.updateAttachment(view, attachment)) {
        successful = false;
      }
    }

    return successful;
  }

  refresh() {
    this.ensureActive();

    if (!this.initialized || !this.enabled) {
      return false;
    }

    return this.scheduleReconcile();
  }

  async setIndentation(value) {
    this.ensureActive();

    if (!VALID_INDENTATIONS.has(value)) {
      throw new TypeError(
        `[FlaskSnippets] Invalid indentation option: ${value}`
      );
    }

    if (this.formatter.getIndentation() === value) {
      return value;
    }

    this.formatter.setIndentation(value);

    return value;
  }

  async setEnabled(value) {
    this.ensureActive();

    if (typeof value !== "boolean") {
      throw new TypeError(
        "[FlaskSnippets] CodeMirror enabled state must be a boolean."
      );
    }

    this.enabled = value;

    if (!this.initialized) {
      return this.enabled;
    }

    if (!value) {
      this.clearReconcileTimers();
      return this.updateAttachments();
    }

    return this.scheduleReconcile();
  }

  async setAutocompleteEnabled(value) {
    this.ensureActive();

    if (typeof value !== "boolean") {
      throw new TypeError(
        "[FlaskSnippets] CodeMirror autocomplete state must be a boolean."
      );
    }

    this.autocompleteEnabled = value;

    if (!this.initialized) {
      return this.autocompleteEnabled;
    }

    return this.updateAttachments();
  }

  cleanupRuntime() {
    const errors = [];

    this.clearReconcileTimers();

    try {
      this.unregisterInteractionListeners();
    } catch (error) {
      errors.push(error);
    }

    try {
      this.unregisterManagerListener();
    } catch (error) {
      errors.push(error);
    }

    for (const view of [ ...this.attachments.keys() ]) {
      try {
        this.detach(view);
      } catch (error) {
        errors.push(error);
      }
    }

    const manager = this.editorManager;

    if (this.compartment && Array.isArray(manager?.files)) {
      for (const file of manager.files) {
        if (file?.type !== "editor") {
          continue;
        }

        const state = file.session?.__rawState || file.session;

        if (
          !state ||
          typeof state.update !== "function" ||
          this.compartment.get(state) === undefined
        ) {
          continue;
        }

        try {
          file.session = state.update({
            effects: this.compartment.reconfigure([])
          }).state;
        } catch (error) {
          errors.push(error);
        }
      }
    }

    this.attachments.clear();
    this.compartment = null;

    this.acode = null;
    this.editorManager = null;

    this.autocomplete = null;
    this.stateModule = null;

    this.completionSources.clear();

    this.initialized = false;

    for (const error of errors) {
      this.log(
        "error",
        "CodeMirror runtime cleanup failed.",
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
      disposing: this.disposing,
      disposed: this.disposed,
      defaultScope: this.defaultScope,
      editorViewCount: this.getEditorViews().length,
      attachedEditorCount: this.attachments.size,
      attachedScopes: [
        ...new Set(
          [ ...this.attachments.values() ].map(
            attachment => attachment.scope
          )
        )
      ],
      registeredEvents: [ ...this.registeredEvents ],
      registeredInteractionEvents: [
        ...this.registeredInteractionEvents
      ]
    };
  }

  async dispose() {
    if (this.disposePromise) {
      return this.disposePromise;
    }

    if (this.disposed) {
      return;
    }

    this.disposing = true;

    this.disposePromise = (async () => {
      if (this.initPromise) {
        await this.initPromise.catch(
          () => undefined
        );
      }

      this.cleanupRuntime();

      this.registry = null;
      this.logger = null;

      this.disposed = true;
      this.disposing = false;

      console.info(
        "[FlaskSnippets] CodeMirror integration disposed."
      );
    })();

    return this.disposePromise;
  }
}
