const PLUGIN_ID = "dev.zylle.flasksnippets";

const INDENTATION_OPTIONS = Object.freeze([
  [ "2-spaces", "2 Spaces" ],
  [ "4-spaces", "4 Spaces" ],
  [ "8-spaces", "8 Spaces" ],
  [ "tabs", "Tabs" ]
]);

const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  autocomplete: true,
  indentation: "4-spaces"
});

const VALID_INDENTATIONS = new Set(
  INDENTATION_OPTIONS.map(([ value ]) => value)
);

export default class PluginSettings {
  constructor({
    customSnippetManager,
    settingsApi,
    onRefresh = null,
    onSettingChange = null,
    logger = null
  } = {}) {
    if (
      !customSnippetManager ||
      typeof customSnippetManager.add !== "function" ||
      typeof customSnippetManager.update !== "function" ||
      typeof customSnippetManager.remove !== "function"
    ) {
      throw new TypeError(
        "[FlaskSnippets] PluginSettings requires a valid CustomSnippetManager."
      );
    }

    if (
      !settingsApi ||
      !settingsApi.value ||
      typeof settingsApi.update !== "function"
    ) {
      throw new TypeError(
        "[FlaskSnippets] Acode Settings API is unavailable."
      );
    }

    if (
      onRefresh !== null &&
      typeof onRefresh !== "function"
    ) {
      throw new TypeError(
        "[FlaskSnippets] onRefresh must be a function."
      );
    }

    if (
      onSettingChange !== null &&
      typeof onSettingChange !== "function"
    ) {
      throw new TypeError(
        "[FlaskSnippets] onSettingChange must be a function."
      );
    }

    this.customSnippetManager = customSnippetManager;
    this.settingsApi = settingsApi;
    this.onRefresh = onRefresh;
    this.onSettingChange = onSettingChange;
    this.logger = logger;

    this.operationQueue = Promise.resolve();

    this.disposed = false;
  }

  ensureActive() {
    if (this.disposed) {
      throw new Error(
        "[FlaskSnippets] PluginSettings has been disposed."
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

  serializeOperation(operation) {
    this.ensureActive();

    const result = this.operationQueue.then(() => {
      this.ensureActive();
      return operation();
    });

    this.operationQueue = result.catch(() => undefined);

    return result;
  }

  getSettings() {
    this.ensureActive();

    const stored = this.settingsApi.value[ PLUGIN_ID ];

    const settings = {
      ...DEFAULT_SETTINGS,
      ...(stored &&
        typeof stored === "object" &&
        !Array.isArray(stored)
        ? stored
        : {})
    };

    return {
      enabled:
        typeof settings.enabled === "boolean"
          ? settings.enabled
          : DEFAULT_SETTINGS.enabled,

      autocomplete:
        typeof settings.autocomplete === "boolean"
          ? settings.autocomplete
          : DEFAULT_SETTINGS.autocomplete,

      indentation:
        VALID_INDENTATIONS.has(settings.indentation)
          ? settings.indentation
          : DEFAULT_SETTINGS.indentation
    };
  }

  async saveSettings(changes) {
    this.ensureActive();

    if (
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      throw new TypeError(
        "[FlaskSnippets] Settings changes must be an object."
      );
    }

    const allowedKeys = Object.keys(DEFAULT_SETTINGS);

    for (const [ key, value ] of Object.entries(changes)) {
      if (!allowedKeys.includes(key)) {
        throw new Error(
          `[FlaskSnippets] Unknown setting: ${key}.`
        );
      }

      if (key === "indentation") {
        if (!VALID_INDENTATIONS.has(value)) {
          throw new TypeError(
            `[FlaskSnippets] Invalid indentation option: ${value}.`
          );
        }
      } else if (typeof value !== "boolean") {
        throw new TypeError(
          `[FlaskSnippets] Setting "${key}" must be a boolean.`
        );
      }
    }

    const current = this.getSettings();

    const next = {
      ...current,
      ...changes
    };

    const previousStored =
      this.settingsApi.value[ PLUGIN_ID ];

    this.settingsApi.value[ PLUGIN_ID ] = next;

    try {
      await this.settingsApi.update();
    } catch (error) {
      if (previousStored === undefined) {
        delete this.settingsApi.value[ PLUGIN_ID ];
      } else {
        this.settingsApi.value[ PLUGIN_ID ] = previousStored;
      }

      throw error;
    }

    return next;
  }

  async restoreSettings(previous) {
    try {
      this.settingsApi.value[ PLUGIN_ID ] = previous;

      await this.settingsApi.update();
    } catch (error) {
      this.log(
        "error",
        "Could not restore previous plugin settings.",
        error
      );
    }
  }

  getList() {
    this.ensureActive();

    const settings = this.getSettings();

    return [
      {
        key: "enabled",
        text: "Enable Flask Snippets",
        info: "Enable or disable the plugin's snippet functionality.",
        checkbox: settings.enabled,
        value: settings.enabled,
        category: "General"
      },
      {
        key: "autocomplete",
        text: "Enable Autocomplete",
        info: "Show Flask snippets in the native editor completion popup.",
        checkbox: settings.autocomplete,
        value: settings.autocomplete,
        category: "General"
      },
      {
        key: "indentation",
        text: "Snippet Indentation",
        info: "Choose the indentation style used when inserting snippets.",
        select: INDENTATION_OPTIONS,
        value: settings.indentation,
        category: "General"
      },
      {
        key: "addCustomSnippet",
        text: "Add Custom Snippet",
        info: "Enter a JSON snippet object to add a custom snippet.",
        prompt: "Enter the snippet as JSON",
        promptType: "text",
        promptOptions: {
          required: true,
          placeholder: "{\"id\":\"my-snippet\",\"name\":\"My Snippet\",\"prefix\":\"mysnippet\",\"body\":\"print('Hello')\",\"scope\":\"python\"}"
        },
        value: "",
        category: "Custom Snippets"
      },
      {
        key: "editCustomSnippet",
        text: "Edit Custom Snippet",
        info: "Enter the complete updated snippet JSON, including its existing ID.",
        prompt: "Enter the updated snippet as JSON",
        promptType: "text",
        promptOptions: {
          required: true,
          placeholder: "{\"id\":\"my-snippet\",\"name\":\"Updated Snippet\",\"prefix\":\"mysnippet\",\"body\":\"print('Updated')\",\"scope\":\"python\"}"
        },
        value: "",
        category: "Custom Snippets"
      },
      {
        key: "removeCustomSnippet",
        text: "Delete Custom Snippet",
        info: "Enter the ID of the custom snippet you want to delete.",
        prompt: "Enter the custom snippet ID",
        promptType: "text",
        promptOptions: {
          required: true,
          placeholder: "my-snippet"
        },
        value: "",
        category: "Custom Snippets"
      }
    ];
  }

  async handleChange(key, value) {
    this.ensureActive();

    try {
      return await this.serializeOperation(async () => {
        switch (key) {
          case "enabled":
          case "autocomplete":
          case "indentation": {
            if (key === "indentation") {
              if (!VALID_INDENTATIONS.has(value)) {
                throw new TypeError(
                  `Invalid indentation option: ${value}.`
                );
              }
            } else if (typeof value !== "boolean") {
              throw new TypeError(
                `Setting "${key}" must be a boolean.`
              );
            }

            const previous = this.getSettings();

            const next = await this.saveSettings({
              [ key ]: value
            });

            try {
              await this.onSettingChange?.(
                key,
                value,
                next
              );
            } catch (error) {
              await this.restoreSettings(previous);
              throw error;
            }

            this.log(
              "info",
              `Setting updated: ${key}.`
            );

            return next;
          }

          case "addCustomSnippet": {
            const snippet = this.parseSnippet(value);

            await this.customSnippetManager.add(snippet);
            await this.onRefresh?.();

            this.log(
              "info",
              `Custom snippet "${snippet.id}" added.`
            );

            return true;
          }

          case "editCustomSnippet": {
            const snippet = this.parseSnippet(value);

            if (!snippet.id) {
              throw new Error(
                "The updated snippet must contain its existing ID."
              );
            }

            await this.customSnippetManager.update(
              snippet.id,
              snippet
            );

            await this.onRefresh?.();

            this.log(
              "info",
              `Custom snippet "${snippet.id}" updated.`
            );

            return true;
          }

          case "removeCustomSnippet": {
            if (
              typeof value !== "string" ||
              !value.trim()
            ) {
              throw new TypeError(
                "A snippet ID is required."
              );
            }

            const id = value.trim();

            await this.customSnippetManager.remove(id);
            await this.onRefresh?.();

            this.log(
              "info",
              `Custom snippet "${id}" deleted.`
            );

            return true;
          }

          default:
            this.log(
              "warn",
              `Unknown settings key: ${key}.`
            );

            return false;
        }
      });
    } catch (error) {
      this.log(
        "error",
        `Could not update setting "${key}".`,
        error
      );

      throw error;
    }
  }

  parseSnippet(value) {
    if (
      typeof value !== "string" ||
      !value.trim()
    ) {
      throw new TypeError(
        "Snippet JSON cannot be empty."
      );
    }

    let snippet;

    try {
      snippet = JSON.parse(value);
    } catch {
      throw new SyntaxError(
        "Invalid JSON. Please check your snippet."
      );
    }

    if (
      !snippet ||
      typeof snippet !== "object" ||
      Array.isArray(snippet) ||
      Object.getPrototypeOf(snippet) !== Object.prototype
    ) {
      throw new TypeError(
        "Snippet JSON must be a plain object."
      );
    }

    return snippet;
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    this.customSnippetManager = null;
    this.settingsApi = null;

    this.onRefresh = null;
    this.onSettingChange = null;

    this.logger = null;

    this.disposed = true;
  }
}
