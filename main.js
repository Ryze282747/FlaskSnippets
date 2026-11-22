
import FlaskSnippetsService from "./src/core/FlaskSnippetsService.js";
import PluginSettings from "./src/settings/PluginSettings.js";
import Logger from "./src/core/Logger.js";

const PLUGIN_ID = "dev.zylle.flasksnippets";

const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  autocomplete: true,
  indentation: "4-spaces"
});

const VALID_INDENTATIONS = new Set([
  "2-spaces",
  "4-spaces",
  "8-spaces",
  "tabs"
]);

function getInitialSettings() {
  try {
    if (
      typeof window === "undefined" ||
      !window.acode
    ) {
      return { ...DEFAULT_SETTINGS };
    }

    const settingsApi = window.acode.require("settings");
    const stored = settingsApi?.value?.[ PLUGIN_ID ];

    if (
      !stored ||
      typeof stored !== "object" ||
      Array.isArray(stored)
    ) {
      return { ...DEFAULT_SETTINGS };
    }

    return {
      enabled:
        typeof stored.enabled === "boolean"
          ? stored.enabled
          : DEFAULT_SETTINGS.enabled,

      autocomplete:
        typeof stored.autocomplete === "boolean"
          ? stored.autocomplete
          : DEFAULT_SETTINGS.autocomplete,

      indentation:
        VALID_INDENTATIONS.has(stored.indentation)
          ? stored.indentation
          : DEFAULT_SETTINGS.indentation
    };
  } catch (error) {
    console.warn(
      "[FlaskSnippets] Could not load initial settings.",
      error
    );

    return { ...DEFAULT_SETTINGS };
  }
}

const INITIAL_SETTINGS = getInitialSettings();

const SETTINGS_LIST = [
  {
    key: "enabled",
    text: "Enable Flask Snippets",
    info: "Enable or disable the plugin's snippet functionality.",
    checkbox: INITIAL_SETTINGS.enabled,
    value: INITIAL_SETTINGS.enabled,
    category: "General"
  },
  {
    key: "autocomplete",
    text: "Enable Autocomplete",
    info: "Show Flask snippets in the native editor completion popup.",
    checkbox: INITIAL_SETTINGS.autocomplete,
    value: INITIAL_SETTINGS.autocomplete,
    category: "General"
  },
  {
    key: "indentation",
    text: "Snippet Indentation",
    info: "Choose the indentation style used when inserting snippets.",
    select: [
      [ "2-spaces", "2 Spaces" ],
      [ "4-spaces", "4 Spaces" ],
      [ "8-spaces", "8 Spaces" ],
      [ "tabs", "Tabs" ]
    ],
    value: INITIAL_SETTINGS.indentation,
    category: "General"
  },
  {
    key: "addCustomSnippet",
    text: "Add Custom Snippet",
    info: "JSON example: {\"id\":\"my-snippet\",\"name\":\"My Snippet\",\"prefix\":\"mysnippet\",\"body\":\"print('Hello')\",\"scope\":\"python\"}",
    prompt: "Enter the snippet as JSON",
    promptType: "text",
    promptOptions: {
      required: true,
      placeholder: "Paste snippet JSON here"
    },
    value: "",
    category: "Custom Snippets"
  },
  {
    key: "editCustomSnippet",
    text: "Edit Custom Snippet",
    info: "Use the same JSON format as Add Custom Snippet. Keep the existing snippet ID when updating.",
    prompt: "Enter the updated snippet as JSON",
    promptType: "text",
    promptOptions: {
      required: true,
      placeholder: "Paste updated snippet JSON here"
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

function resetSettingValue(key) {
  const setting = SETTINGS_LIST.find(
    item => item.key === key
  );

  if (setting) {
    setting.value = "";
  }
}

class FlaskSnippetsPlugin {
  constructor() {
    this.logger = new Logger({
      prefix: "FlaskSnippets",
      level: "info"
    });

    this.service = null;
    this.settingsController = null;
    this.settingsApi = null;

    this.baseUrl = "";
    this.page = null;
    this.context = null;
    this.cacheFile = null;
    this.cacheFileUrl = null;
    this.fileIcons = null;

    this.initialized = false;
    this.initializing = false;
    this.destroyed = false;

    this.initPromise = null;
    this.destroyPromise = null;
    this.cleanupPromise = null;
  }

  ensureActive() {
    if (this.destroyed) {
      throw new Error(
        "[FlaskSnippets] Plugin has been destroyed."
      );
    }
  }

  init(baseUrl, page, options = {}) {
    this.ensureActive();

    if (this.initialized) {
      return Promise.resolve(this.getStatus());
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    if (
      typeof baseUrl !== "string" ||
      !baseUrl.trim()
    ) {
      throw new TypeError(
        "[FlaskSnippets] Invalid plugin base URL."
      );
    }

    if (
      typeof window === "undefined" ||
      !window.acode
    ) {
      throw new Error(
        "[FlaskSnippets] Acode runtime is unavailable."
      );
    }

    if (
      options === null ||
      typeof options !== "object" ||
      Array.isArray(options)
    ) {
      throw new TypeError(
        "[FlaskSnippets] Plugin options must be an object."
      );
    }

    this.baseUrl = baseUrl.trim().endsWith("/")
      ? baseUrl.trim()
      : `${baseUrl.trim()}/`;

    this.page = page || null;

    const {
      cacheFileUrl = null,
      cacheFile = null,
      firstInit = false,
      ctx = null,
      fileIcons = null
    } = options;

    this.context = ctx;
    this.cacheFile = cacheFile;
    this.cacheFileUrl = cacheFileUrl;
    this.fileIcons = fileIcons;

    this.initializing = true;

    this.initPromise = this.initialize(firstInit);

    return this.initPromise;
  }

  async initialize(firstInit) {
    try {
      this.settingsApi = window.acode.require("settings");

      if (
        !this.settingsApi ||
        !this.settingsApi.value ||
        typeof this.settingsApi.update !== "function"
      ) {
        throw new Error(
          "[FlaskSnippets] Acode Settings API is unavailable."
        );
      }

      this.ensureActive();

      this.service = new FlaskSnippetsService({
        logger: this.logger
      });

      await this.service.init();

      this.ensureActive();

      this.settingsController = new PluginSettings({
        customSnippetManager:
          this.service.getCustomSnippetManager(),

        settingsApi: this.settingsApi,
        logger: this.logger,

        onRefresh: async () => {
          this.ensureActive();
          await this.service.refresh();
        },

        onSettingChange: async (key, value) => {
          await this.handleSettingChange(key, value);
        }
      });

      const savedSettings =
        this.settingsController.getSettings();

      if (!savedSettings) {
        throw new Error(
          "[FlaskSnippets] Could not load plugin settings."
        );
      }

      await this.service.setIndentation(
        savedSettings.indentation
      );

      if (!savedSettings.enabled) {
        await this.service.setEnabled(false);
      } else {
        const adapter = this.service.getAdapter();

        if (adapter) {
          await adapter.setAutocompleteEnabled(
            savedSettings.autocomplete
          );
        }
      }

      this.ensureActive();

      this.initialized = true;

      this.logger.info("Plugin initialized.");

      if (firstInit) {
        this.logger.info(
          "First installation detected."
        );
      }

      return this.getStatus();
    } catch (error) {
      this.logger?.error(
        "Plugin initialization failed.",
        error
      );

      try {
        await this.cleanup();
      } catch (cleanupError) {
        this.logger?.error(
          "Cleanup after initialization failure failed.",
          cleanupError
        );
      }

      throw error;
    } finally {
      this.initializing = false;
      this.initPromise = null;
    }
  }

  async handleSettingChange(key, value) {
    this.ensureActive();

    if (!this.service) {
      throw new Error(
        "[FlaskSnippets] Plugin service is unavailable."
      );
    }

    switch (key) {
      case "enabled": {
        await this.service.setEnabled(value);

        if (value) {
          this.ensureActive();

          const settings =
            this.settingsController.getSettings();

          const adapter = this.service.getAdapter();

          if (adapter) {
            await adapter.setAutocompleteEnabled(
              settings.autocomplete
            );
          }
        }

        break;
      }

      case "autocomplete": {
        const adapter = this.service.getAdapter();

        if (adapter) {
          await adapter.setAutocompleteEnabled(value);
        }

        break;
      }

      case "indentation": {
        await this.service.setIndentation(value);
        break;
      }

      default:
        break;
    }
  }

  async handleSettingsChange(key, value) {
    if (
      !this.settingsController ||
      this.destroyed
    ) {
      return;
    }

    try {
      const result =
        await this.settingsController.handleChange(
          key,
          value
        );

      if (result !== true) {
        return;
      }

      const successMessages = {
        addCustomSnippet: {
          title: "Custom Snippet Added",
          message: "Custom snippet added successfully!"
        },
        editCustomSnippet: {
          title: "Custom Snippet Updated",
          message: "Custom snippet updated successfully!"
        },
        removeCustomSnippet: {
          title: "Custom Snippet Deleted",
          message: "Custom snippet deleted successfully!"
        }
      };

      const success = successMessages[ key ];

      if (success) {
        resetSettingValue(key);

        if (typeof window.acode.alert === "function") {
          window.acode.alert(
            success.title,
            success.message
          );
        }

        this.logger?.info(success.message);
      }
    } catch (error) {
      const message =
        error?.message || "The operation could not be completed.";

      let title = "Custom Snippet Error";
      let displayMessage = message;

      if (key === "addCustomSnippet") {
        title = "Custom Snippet Not Added";
      } else if (key === "editCustomSnippet") {
        title = "Custom Snippet Not Updated";
      } else if (key === "removeCustomSnippet") {
        title = "Custom Snippet Not Deleted";
      }

      if (message.includes("Custom snippet not found:")) {
        const id = message
          .split("Custom snippet not found:")
          .pop()
          .trim();

        displayMessage =
          `Custom snippet does not exist: ${id}`;
      }

      if (typeof window.acode.alert === "function") {
        window.acode.alert(
          title,
          displayMessage
        );
      }

      this.logger?.error(
        `Could not handle settings change: ${key}.`,
        error
      );
    }
  }

  async cleanup() {
    if (this.cleanupPromise) {
      return this.cleanupPromise;
    }

    this.cleanupPromise = (async () => {
      const errors = [];

      const settingsController = this.settingsController;
      const service = this.service;

      this.settingsController = null;
      this.service = null;
      this.settingsApi = null;

      this.initialized = false;

      if (settingsController) {
        try {
          await settingsController.dispose();
        } catch (error) {
          errors.push(error);
        }
      }

      if (service) {
        try {
          await service.dispose();
        } catch (error) {
          errors.push(error);
        }
      }

      this.baseUrl = "";
      this.page = null;
      this.context = null;
      this.cacheFile = null;
      this.cacheFileUrl = null;
      this.fileIcons = null;

      for (const error of errors) {
        try {
          this.logger?.error(
            "Plugin cleanup failed.",
            error
          );
        } catch {
          // Continue cleanup even if logging fails.
        }
      }

      return errors;
    })();

    try {
      return await this.cleanupPromise;
    } finally {
      this.cleanupPromise = null;
    }
  }

  destroy() {
    if (this.destroyPromise) {
      return this.destroyPromise;
    }

    if (this.destroyed) {
      return Promise.resolve();
    }

    this.destroyed = true;

    this.destroyPromise = (async () => {
      if (this.initPromise) {
        await this.initPromise.catch(
          () => undefined
        );
      }

      await this.cleanup();

      try {
        this.logger?.info("Plugin destroyed.");
      } finally {
        this.logger?.dispose();
        this.logger = null;
      }
    })();

    return this.destroyPromise;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      initializing: this.initializing,
      destroyed: this.destroyed,
      service: this.service?.getStatus() || null,
      settings: this.settingsController?.getSettings() || null
    };
  }
}

if (
  typeof window !== "undefined" &&
  window.acode
) {
  const plugin = new FlaskSnippetsPlugin();

  window.acode.setPluginInit(
    PLUGIN_ID,
    async (baseUrl, page, options) => {
      try {
        await plugin.init(
          baseUrl,
          page,
          options
        );
      } catch (error) {
        console.error(
          "[FlaskSnippets] Initialization failed:",
          error
        );

        throw error;
      }
    },
    {
      list: SETTINGS_LIST,

      cb: (key, value) => {
        plugin.handleSettingsChange(key, value);
      }
    }
  );

  window.acode.setPluginUnmount(
    PLUGIN_ID,
    () => {
      plugin.destroy().catch(error => {
        console.error(
          "[FlaskSnippets] Cleanup failed:",
          error
        );
      });
    }
  );
}
