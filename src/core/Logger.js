
const LOG_LEVELS = Object.freeze({
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4
});

export default class Logger {
  constructor({
    prefix = "FlaskSnippets",
    level = "info",
    enabled = true,
    console: consoleInstance = console
  } = {}) {
    if (typeof enabled !== "boolean") {
      throw new TypeError(
        "[FlaskSnippets] Logger enabled state must be a boolean."
      );
    }

    this.disposed = false;

    this.prefix = this.validatePrefix(prefix);
    this.level = this.validateLevel(level);
    this.enabled = enabled;

    this.console = this.validateConsole(
      consoleInstance
    );
  }

  validatePrefix(prefix) {
    if (
      typeof prefix !== "string" ||
      !prefix.trim()
    ) {
      throw new TypeError(
        "[FlaskSnippets] Logger prefix must be a non-empty string."
      );
    }

    return prefix.trim();
  }

  validateLevel(level) {
    if (
      typeof level !== "string" ||
      !Object.prototype.hasOwnProperty.call(
        LOG_LEVELS,
        level
      )
    ) {
      throw new TypeError(
        `[FlaskSnippets] Invalid log level: ${level}`
      );
    }

    return level;
  }

  validateConsole(consoleInstance) {
    if (
      !consoleInstance ||
      typeof consoleInstance !== "object"
    ) {
      throw new TypeError(
        "[FlaskSnippets] A valid console instance is required."
      );
    }

    for (const method of [
      "debug",
      "info",
      "warn",
      "error"
    ]) {
      if (
        typeof consoleInstance[ method ] !== "function"
      ) {
        throw new TypeError(
          `[FlaskSnippets] Console method is unavailable: ${method}`
        );
      }
    }

    return consoleInstance;
  }

  ensureActive() {
    if (this.disposed) {
      throw new Error(
        "[FlaskSnippets] Logger has been disposed."
      );
    }
  }

  shouldLog(level) {
    this.ensureActive();

    if (!this.enabled || this.level === "silent") {
      return false;
    }

    return (
      LOG_LEVELS[ level ] >= LOG_LEVELS[ this.level ]
    );
  }

  log(level, ...args) {
    if (
      !Object.prototype.hasOwnProperty.call(
        LOG_LEVELS,
        level
      ) ||
      level === "silent"
    ) {
      throw new TypeError(
        `[FlaskSnippets] Invalid log method: ${level}`
      );
    }

    if (!this.shouldLog(level)) {
      return false;
    }

    const method = this.console[ level ];

    method.call(
      this.console,
      `[${this.prefix}]`,
      ...args
    );

    return true;
  }

  debug(...args) {
    return this.log("debug", ...args);
  }

  info(...args) {
    return this.log("info", ...args);
  }

  warn(...args) {
    return this.log("warn", ...args);
  }

  error(...args) {
    return this.log("error", ...args);
  }

  setLevel(level) {
    this.ensureActive();

    this.level = this.validateLevel(level);

    return this.level;
  }

  setEnabled(enabled) {
    this.ensureActive();

    if (typeof enabled !== "boolean") {
      throw new TypeError(
        "[FlaskSnippets] Logger enabled state must be a boolean."
      );
    }

    this.enabled = enabled;

    return this.enabled;
  }

  child(scope) {
    this.ensureActive();

    if (
      typeof scope !== "string" ||
      !scope.trim()
    ) {
      throw new TypeError(
        "[FlaskSnippets] Child logger scope must be a non-empty string."
      );
    }

    return new Logger({
      prefix: `${this.prefix}:${scope.trim()}`,
      level: this.level,
      enabled: this.enabled,
      console: this.console
    });
  }

  getStatus() {
    return {
      prefix: this.prefix,
      level: this.level,
      enabled: this.enabled,
      disposed: this.disposed
    };
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.enabled = false;
    this.console = null;
  }
}
