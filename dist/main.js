/*!
 * Flask Snippets v1.0.0
 * Copyright (c) 2026 Zylle Mojica
 * Licensed under the MIT License.
 */
(function () {
  'use strict';

  const LOG_LEVELS = Object.freeze({
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    silent: 4
  });

  class Logger {
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

  class PlaceholderManager {
    constructor({
      maxPlaceholders = 100,
      maxTemplateLength = 100000
    } = {}) {
      if (
        !Number.isSafeInteger(maxPlaceholders) ||
        maxPlaceholders < 1
      ) {
        throw new TypeError(
          "[FlaskSnippets] maxPlaceholders must be a positive safe integer."
        );
      }

      if (
        !Number.isSafeInteger(maxTemplateLength) ||
        maxTemplateLength < 1
      ) {
        throw new TypeError(
          "[FlaskSnippets] maxTemplateLength must be a positive safe integer."
        );
      }

      this.disposed = false;
      this.maxPlaceholders = maxPlaceholders;
      this.maxTemplateLength = maxTemplateLength;
    }

    ensureActive() {
      if (this.disposed) {
        throw new Error(
          "[FlaskSnippets] PlaceholderManager has been disposed."
        );
      }
    }

    isPlainObject(value) {
      if (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
      ) {
        return false;
      }

      const prototype = Object.getPrototypeOf(value);

      return (
        prototype === Object.prototype ||
        prototype === null
      );
    }

    parse(template, options = {}) {
      this.ensureActive();

      if (typeof template !== "string") {
        throw new TypeError(
          "[FlaskSnippets] Placeholder template must be a string."
        );
      }

      if (template.length > this.maxTemplateLength) {
        throw new RangeError(
          "[FlaskSnippets] Placeholder template exceeds the maximum length."
        );
      }

      if (!this.isPlainObject(options)) {
        throw new TypeError(
          "[FlaskSnippets] Placeholder options must be an object."
        );
      }

      const values = options.values ?? {};

      if (!this.isPlainObject(values)) {
        throw new TypeError(
          "[FlaskSnippets] Placeholder values must be a plain object."
        );
      }

      let text = "";
      let finalCursor = null;
      let placeholderCount = 0;

      const placeholders = [];
      const resolvedValues = new Map();

      for (let index = 0; index < template.length;) {
        const character = template[ index ];

        if (
          character === "\\" &&
          template[ index + 1 ] === "$"
        ) {
          text += "$";
          index += 2;
          continue;
        }

        if (character !== "$") {
          text += character;
          index += 1;
          continue;
        }

        const next = template[ index + 1 ];

        if (next === "{") {
          const closingIndex = this.findClosingBrace(
            template,
            index + 2
          );

          if (closingIndex === -1) {
            text += "$";
            index += 1;
            continue;
          }

          const definition = template.slice(
            index + 2,
            closingIndex
          );

          const parsed = this.parseDefinition(definition);

          if (!parsed) {
            text += template.slice(
              index,
              closingIndex + 1
            );

            index = closingIndex + 1;
            continue;
          }

          index = closingIndex + 1;

          if (parsed.index === 0) {
            finalCursor = text.length;
            continue;
          }

          placeholderCount += 1;

          if (placeholderCount > this.maxPlaceholders) {
            throw new RangeError(
              "[FlaskSnippets] Too many placeholders in template."
            );
          }

          const replacement = this.getReplacement(
            parsed,
            values,
            resolvedValues
          );

          const start = text.length;

          text += replacement;

          placeholders.push({
            index: parsed.index,
            start,
            end: text.length,
            choices: parsed.choices
          });

          continue;
        }

        if (/[0-9]/.test(next || "")) {
          let end = index + 1;

          while (/[0-9]/.test(template[ end ] || "")) {
            end += 1;
          }

          const placeholderIndex = Number(
            template.slice(index + 1, end)
          );

          if (
            !Number.isSafeInteger(placeholderIndex) ||
            placeholderIndex > this.maxPlaceholders
          ) {
            text += template.slice(index, end);
            index = end;
            continue;
          }

          index = end;

          if (placeholderIndex === 0) {
            finalCursor = text.length;
            continue;
          }

          placeholderCount += 1;

          if (placeholderCount > this.maxPlaceholders) {
            throw new RangeError(
              "[FlaskSnippets] Too many placeholders in template."
            );
          }

          const replacement = this.getValue(
            values,
            placeholderIndex,
            "",
            resolvedValues
          );

          const start = text.length;

          text += replacement;

          placeholders.push({
            index: placeholderIndex,
            start,
            end: text.length,
            choices: []
          });

          continue;
        }

        text += "$";
        index += 1;
      }

      placeholders.sort((a, b) => {
        return a.index - b.index || a.start - b.start;
      });

      return {
        text,
        placeholders,
        finalCursor:
          finalCursor === null
            ? text.length
            : finalCursor
      };
    }

    findClosingBrace(template, start) {
      let depth = 1;
      let escaped = false;

      for (
        let index = start;
        index < template.length;
        index += 1
      ) {
        const character = template[ index ];

        if (escaped) {
          escaped = false;
          continue;
        }

        if (character === "\\") {
          escaped = true;
          continue;
        }

        if (character === "{") {
          depth += 1;
        } else if (character === "}") {
          depth -= 1;

          if (depth === 0) {
            return index;
          }
        }
      }

      return -1;
    }

    parseDefinition(definition) {
      if (typeof definition !== "string") {
        return null;
      }

      const match = definition.match(
        /^(\d+)(?::([\s\S]*)|\|([\s\S]*)\|)?$/
      );

      if (!match) {
        return null;
      }

      const index = Number(match[ 1 ]);

      if (
        !Number.isSafeInteger(index) ||
        index > this.maxPlaceholders
      ) {
        return null;
      }

      let defaultValue = "";
      let choices = [];

      if (match[ 2 ] !== undefined) {
        defaultValue = match[ 2 ];
      } else if (match[ 3 ] !== undefined) {
        choices = this.parseChoices(match[ 3 ]);
        defaultValue = choices[ 0 ] || "";
      }

      return {
        index,
        defaultValue,
        choices
      };
    }

    parseChoices(value) {
      const choices = [];

      let current = "";
      let escaped = false;

      for (const character of value) {
        if (escaped) {
          current += character;
          escaped = false;
          continue;
        }

        if (character === "\\") {
          escaped = true;
          continue;
        }

        if (character === ",") {
          choices.push(current);
          current = "";
          continue;
        }

        current += character;
      }

      if (escaped) {
        current += "\\";
      }

      choices.push(current);

      return choices;
    }

    getReplacement(parsed, values, resolvedValues) {
      return this.getValue(
        values,
        parsed.index,
        parsed.defaultValue,
        resolvedValues
      );
    }

    getValue(
      values,
      index,
      fallback,
      resolvedValues = new Map()
    ) {
      if (resolvedValues.has(index)) {
        return resolvedValues.get(index);
      }

      const hasValue = Object.prototype.hasOwnProperty.call(
        values,
        index
      );

      const value = hasValue
        ? values[ index ]
        : undefined;

      let replacement;

      if (value === undefined || value === null) {
        replacement = fallback;
      } else {
        if (
          typeof value !== "string" &&
          typeof value !== "number"
        ) {
          throw new TypeError(
            `[FlaskSnippets] Invalid value for placeholder ${index}.`
          );
        }

        replacement = String(value);
      }

      resolvedValues.set(index, replacement);

      return replacement;
    }

    readPlaceholder(template, start) {
      this.ensureActive();

      if (
        typeof template !== "string" ||
        template.length > this.maxTemplateLength ||
        !Number.isSafeInteger(start) ||
        start < 0 ||
        start >= template.length ||
        template[ start ] !== "$"
      ) {
        return null;
      }

      if (template[ start + 1 ] === "{") {
        const closingIndex = this.findClosingBrace(
          template,
          start + 2
        );

        if (closingIndex === -1) {
          return null;
        }

        const parsed = this.parseDefinition(
          template.slice(start + 2, closingIndex)
        );

        if (!parsed) {
          return null;
        }

        return {
          ...parsed,
          start,
          end: closingIndex + 1
        };
      }

      const match = template
        .slice(start)
        .match(/^\$(\d+)/);

      if (!match) {
        return null;
      }

      const index = Number(match[ 1 ]);

      if (
        !Number.isSafeInteger(index) ||
        index > this.maxPlaceholders
      ) {
        return null;
      }

      return {
        index,
        defaultValue: "",
        choices: [],
        start,
        end: start + match[ 0 ].length
      };
    }

    getStatus() {
      return {
        disposed: this.disposed,
        maxPlaceholders: this.maxPlaceholders,
        maxTemplateLength: this.maxTemplateLength
      };
    }

    dispose() {
      if (this.disposed) {
        return;
      }

      this.disposed = true;
    }
  }

  class SnippetParser {
    constructor({
      placeholderManager = null,
      maxBodyLength = 100000,
      maxPrefixLength = 100,
      maxNameLength = 200
    } = {}) {
      const limits = {
        maxBodyLength,
        maxPrefixLength,
        maxNameLength
      };

      for (const [ name, value ] of Object.entries(limits)) {
        if (!Number.isSafeInteger(value) || value <= 0) {
          throw new TypeError(
            `[FlaskSnippets] ${name} must be a positive safe integer.`
          );
        }
      }

      if (
        placeholderManager !== null &&
        (
          typeof placeholderManager.parse !== "function"
        )
      ) {
        throw new TypeError(
          "[FlaskSnippets] A valid PlaceholderManager is required."
        );
      }

      this.disposed = false;

      this.placeholderManager =
        placeholderManager || new PlaceholderManager();

      this.ownsPlaceholderManager = !placeholderManager;

      this.maxBodyLength = maxBodyLength;
      this.maxPrefixLength = maxPrefixLength;
      this.maxNameLength = maxNameLength;
    }

    ensureActive() {
      if (this.disposed) {
        throw new Error(
          "[FlaskSnippets] SnippetParser has been disposed."
        );
      }
    }

    ensureString(value, field, {
      required = true,
      maxLength = Infinity
    } = {}) {
      if (typeof value !== "string") {
        throw new TypeError(
          `[FlaskSnippets] Snippet ${field} must be a string.`
        );
      }

      const normalized = value.trim();

      if (required && !normalized) {
        throw new TypeError(
          `[FlaskSnippets] Snippet ${field} cannot be empty.`
        );
      }

      if (normalized.length > maxLength) {
        throw new RangeError(
          `[FlaskSnippets] Snippet ${field} exceeds the maximum length.`
        );
      }

      return normalized;
    }

    normalizeBody(body) {
      let normalized;

      if (typeof body === "string") {
        normalized = body;
      } else if (
        Array.isArray(body) &&
        body.every(line => typeof line === "string")
      ) {
        normalized = body.join("\n");
      } else {
        throw new TypeError(
          "[FlaskSnippets] Snippet body must be a string or an array of strings."
        );
      }

      if (!normalized.trim()) {
        throw new TypeError(
          "[FlaskSnippets] Snippet body cannot be empty."
        );
      }

      if (normalized.length > this.maxBodyLength) {
        throw new RangeError(
          "[FlaskSnippets] Snippet body exceeds the maximum length."
        );
      }

      return normalized;
    }

    normalizeStringArray(value, field, {
      defaultValue = [],
      maxItems = 50
    } = {}) {
      if (value === undefined || value === null) {
        return [ ...defaultValue ];
      }

      if (!Array.isArray(value)) {
        throw new TypeError(
          `[FlaskSnippets] Snippet ${field} must be an array.`
        );
      }

      if (value.length > maxItems) {
        throw new RangeError(
          `[FlaskSnippets] Snippet ${field} contains too many entries.`
        );
      }

      const result = [];

      for (const item of value) {
        const normalized = this.ensureString(
          item,
          field,
          { maxLength: 100 }
        );

        if (!result.includes(normalized)) {
          result.push(normalized);
        }
      }

      return result;
    }

    parse(definition) {
      this.ensureActive();

      if (
        !definition ||
        typeof definition !== "object" ||
        Array.isArray(definition)
      ) {
        throw new TypeError(
          "[FlaskSnippets] Snippet definition must be an object."
        );
      }

      const id = this.ensureString(
        definition.id,
        "id",
        { maxLength: 150 }
      );

      const name = this.ensureString(
        definition.name,
        "name",
        { maxLength: this.maxNameLength }
      );

      const prefix = this.ensureString(
        definition.prefix,
        "prefix",
        { maxLength: this.maxPrefixLength }
      );

      const body = this.normalizeBody(definition.body);

      const category = this.ensureString(
        definition.category ?? "core",
        "category",
        { maxLength: 100 }
      );

      const description = this.ensureString(
        definition.description ?? "",
        "description",
        {
          required: false,
          maxLength: 1000
        }
      );

      if (!/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/.test(id)) {
        throw new TypeError(
          `[FlaskSnippets] Invalid snippet id: ${id}`
        );
      }

      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(prefix)) {
        throw new TypeError(
          `[FlaskSnippets] Invalid snippet prefix: ${prefix}`
        );
      }

      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(category)) {
        throw new TypeError(
          `[FlaskSnippets] Invalid snippet category: ${category}`
        );
      }

      const scope = this.normalizeStringArray(
        definition.scope,
        "scope",
        {
          defaultValue: [ "python" ],
          maxItems: 20
        }
      );

      const tags = this.normalizeStringArray(
        definition.tags,
        "tags",
        {
          defaultValue: [],
          maxItems: 30
        }
      );

      if (scope.length === 0) {
        throw new TypeError(
          "[FlaskSnippets] Snippet must have at least one language scope."
        );
      }

      return Object.freeze({
        id,
        name,
        prefix,
        body,
        category,
        description,
        scope: Object.freeze(scope),
        tags: Object.freeze(tags)
      });
    }

    parseMany(definitions) {
      this.ensureActive();

      if (!Array.isArray(definitions)) {
        throw new TypeError(
          "[FlaskSnippets] Snippet definitions must be an array."
        );
      }

      const parsed = [];
      const ids = new Set();

      for (const definition of definitions) {
        const snippet = this.parse(definition);

        if (ids.has(snippet.id)) {
          throw new Error(
            `[FlaskSnippets] Duplicate snippet id: ${snippet.id}`
          );
        }

        ids.add(snippet.id);
        parsed.push(snippet);
      }

      return parsed;
    }

    expand(snippet, { values = {} } = {}) {
      this.ensureActive();

      if (
        !values ||
        typeof values !== "object" ||
        Array.isArray(values)
      ) {
        throw new TypeError(
          "[FlaskSnippets] Placeholder values must be an object."
        );
      }

      const parsed = this.parse(snippet);

      return this.placeholderManager.parse(
        parsed.body,
        { values }
      );
    }

    getStatus() {
      return {
        disposed: this.disposed,
        maxBodyLength: this.maxBodyLength,
        maxPrefixLength: this.maxPrefixLength,
        maxNameLength: this.maxNameLength,
        ownsPlaceholderManager: this.ownsPlaceholderManager
      };
    }

    dispose() {
      if (this.disposed) {
        return;
      }

      if (
        this.ownsPlaceholderManager &&
        this.placeholderManager &&
        typeof this.placeholderManager.dispose === "function"
      ) {
        this.placeholderManager.dispose();
      }

      this.placeholderManager = null;
      this.disposed = true;
    }
  }

  class SnippetRegistry {
    constructor({
      parser = null,
      onChange = null
    } = {}) {
      if (
        parser !== null &&
        (
          typeof parser.parse !== "function" ||
          typeof parser.parseMany !== "function"
        )
      ) {
        throw new TypeError(
          "[FlaskSnippets] A valid SnippetParser instance is required."
        );
      }

      if (
        onChange !== null &&
        typeof onChange !== "function"
      ) {
        throw new TypeError(
          "[FlaskSnippets] onChange must be a function or null."
        );
      }

      this.disposed = false;

      this.parser = parser || new SnippetParser();
      this.ownsParser = !parser;

      this.onChange = onChange;

      this.snippets = new Map();
      this.prefixIndex = new Map();
      this.categoryIndex = new Map();
    }

    ensureActive() {
      if (this.disposed) {
        throw new Error(
          "[FlaskSnippets] SnippetRegistry has been disposed."
        );
      }
    }

    normalizeKey(value, label = "Value") {
      if (typeof value !== "string") {
        throw new TypeError(
          `[FlaskSnippets] ${label} must be a string.`
        );
      }

      const normalized = value.trim();

      if (!normalized) {
        throw new TypeError(
          `[FlaskSnippets] ${label} cannot be empty.`
        );
      }

      return normalized;
    }

    freezeSnippet(snippet) {
      if (Array.isArray(snippet.body)) {
        Object.freeze(snippet.body);
      }

      if (Array.isArray(snippet.scope)) {
        Object.freeze(snippet.scope);
      }

      if (Array.isArray(snippet.tags)) {
        Object.freeze(snippet.tags);
      }

      return Object.freeze(snippet);
    }

    register(definition) {
      this.ensureActive();

      const snippet = this.freezeSnippet(
        this.parser.parse(definition)
      );

      if (this.snippets.has(snippet.id)) {
        throw new Error(
          `[FlaskSnippets] Snippet already registered: ${snippet.id}`
        );
      }

      this.addSnippet(snippet);

      this.notifyChange({
        type: "registered",
        snippet
      });

      return snippet;
    }

    registerMany(definitions) {
      this.ensureActive();

      const parsed = this.parser
        .parseMany(definitions)
        .map(snippet => this.freezeSnippet(snippet));

      const ids = new Set();

      for (const snippet of parsed) {
        if (
          ids.has(snippet.id) ||
          this.snippets.has(snippet.id)
        ) {
          throw new Error(
            `[FlaskSnippets] Snippet already registered: ${snippet.id}`
          );
        }

        ids.add(snippet.id);
      }

      for (const snippet of parsed) {
        this.addSnippet(snippet);
      }

      if (parsed.length > 0) {
        this.notifyChange({
          type: "registered-many",
          snippets: Object.freeze([ ...parsed ])
        });
      }

      return Object.freeze(parsed);
    }

    addSnippet(snippet) {
      this.snippets.set(snippet.id, snippet);

      this.addIndex(
        this.prefixIndex,
        snippet.prefix,
        snippet.id
      );

      this.addIndex(
        this.categoryIndex,
        snippet.category,
        snippet.id
      );
    }

    addIndex(index, key, id) {
      if (!index.has(key)) {
        index.set(key, new Set());
      }

      index.get(key).add(id);
    }

    removeIndex(index, key, id) {
      const entries = index.get(key);

      if (!entries) {
        return;
      }

      entries.delete(id);

      if (entries.size === 0) {
        index.delete(key);
      }
    }

    unregister(id) {
      this.ensureActive();

      const normalizedId = this.normalizeKey(
        id,
        "Snippet ID"
      );

      const snippet = this.snippets.get(normalizedId);

      if (!snippet) {
        return false;
      }

      this.snippets.delete(normalizedId);

      this.removeIndex(
        this.prefixIndex,
        snippet.prefix,
        normalizedId
      );

      this.removeIndex(
        this.categoryIndex,
        snippet.category,
        normalizedId
      );

      this.notifyChange({
        type: "unregistered",
        snippet
      });

      return true;
    }

    get(id) {
      this.ensureActive();

      if (
        typeof id !== "string" ||
        !id.trim()
      ) {
        return null;
      }

      return this.snippets.get(id.trim()) || null;
    }

    getByPrefix(prefix) {
      this.ensureActive();

      if (
        typeof prefix !== "string" ||
        !prefix.trim()
      ) {
        return [];
      }

      const ids = this.prefixIndex.get(prefix.trim());

      if (!ids) {
        return [];
      }

      return [ ...ids ]
        .map(id => this.snippets.get(id))
        .filter(Boolean);
    }

    getByCategory(category) {
      this.ensureActive();

      if (
        typeof category !== "string" ||
        !category.trim()
      ) {
        return [];
      }

      const ids = this.categoryIndex.get(category.trim());

      if (!ids) {
        return [];
      }

      return [ ...ids ]
        .map(id => this.snippets.get(id))
        .filter(Boolean);
    }

    getAll() {
      this.ensureActive();

      return [ ...this.snippets.values() ];
    }

    getCategories() {
      this.ensureActive();

      return [ ...this.categoryIndex.keys() ].sort(
        (a, b) => a.localeCompare(b)
      );
    }

    has(id) {
      this.ensureActive();

      return (
        typeof id === "string" &&
        this.snippets.has(id.trim())
      );
    }

    hasPrefix(prefix) {
      this.ensureActive();

      return (
        typeof prefix === "string" &&
        this.prefixIndex.has(prefix.trim())
      );
    }

    hasCategory(category) {
      this.ensureActive();

      return (
        typeof category === "string" &&
        this.categoryIndex.has(category.trim())
      );
    }

    clear() {
      this.ensureActive();

      const previousCount = this.snippets.size;

      if (previousCount === 0) {
        return 0;
      }

      this.snippets.clear();
      this.prefixIndex.clear();
      this.categoryIndex.clear();

      this.notifyChange({
        type: "cleared",
        count: previousCount
      });

      return previousCount;
    }

    notifyChange(change) {
      if (!this.onChange) {
        return;
      }

      try {
        this.onChange(Object.freeze(change));
      } catch (error) {
        console.error(
          "[FlaskSnippets] Registry change callback failed:",
          error
        );
      }
    }

    getStatus() {
      this.ensureActive();

      return {
        disposed: this.disposed,
        snippetCount: this.snippets.size,
        prefixCount: this.prefixIndex.size,
        categoryCount: this.categoryIndex.size,
        categories: this.getCategories(),
        ownsParser: this.ownsParser
      };
    }

    dispose() {
      if (this.disposed) {
        return;
      }

      this.snippets.clear();
      this.prefixIndex.clear();
      this.categoryIndex.clear();

      if (
        this.ownsParser &&
        this.parser &&
        typeof this.parser.dispose === "function"
      ) {
        this.parser.dispose();
      }

      this.parser = null;
      this.onChange = null;
      this.disposed = true;
    }
  }

  const coreSnippets = [
    {
      id: "flask:app",
      name: "Flask Application",
      prefix: "flask",
      category: "core",
      description: "Initialize a basic Flask application.",
      tags: [ "app", "initialization", "beginner" ],
      scope: [ "python" ],
      body: [
        "from flask import Flask",
        "",
        "app = Flask(__name__)",
        "",
        "@app.route('/')",
        "def home():",
        "    return '${1:Hello, Flask!}'",
        "",
        "if __name__ == '__main__':",
        "    app.run(debug=${2:True})"
      ]
    },
    {
      id: "flask:create-app",
      name: "Application Factory",
      prefix: "createapp",
      category: "core",
      description: "Create a Flask application using the factory pattern.",
      tags: [ "factory", "architecture", "initialization" ],
      scope: [ "python" ],
      body: [
        "from flask import Flask",
        "",
        "",
        "def create_app(config_class=None):",
        "    app = Flask(__name__)",
        "",
        "    if config_class:",
        "        app.config.from_object(config_class)",
        "",
        "    ${1:# Register extensions and blueprints here}",
        "",
        "    return app"
      ]
    },
    {
      id: "flask:route",
      name: "Flask Route",
      prefix: "route",
      category: "core",
      description: "Create a basic Flask route.",
      tags: [ "route", "view", "endpoint" ],
      scope: [ "python" ],
      body: [
        "@app.route('/${1:path}')",
        "def ${2:view_name}():",
        "    ${3:return 'Hello, Flask!'}"
      ]
    },
    {
      id: "flask:route-methods",
      name: "Route With HTTP Methods",
      prefix: "routemethods",
      category: "core",
      description: "Create a route supporting multiple HTTP methods. Requires request from flask.",
      tags: [ "route", "http", "methods" ],
      scope: [ "python" ],
      body: [
        "from flask import request",
        "",
        "@app.route('/${1:resource}', methods=['GET', 'POST'])",
        "def ${2:resource_view}():",
        "    if request.method == 'POST':",
        "        ${3:# Handle POST request}",
        "        return '${4:Created}'",
        "",
        "    return '${5:OK}'"
      ]
    },
    {
      id: "flask:request-import",
      name: "Request Import",
      prefix: "requestimport",
      category: "core",
      description: "Import Flask request utilities.",
      tags: [ "request", "import" ],
      scope: [ "python" ],
      body: [
        "from flask import request"
      ]
    },
    {
      id: "flask:request-data",
      name: "Get Request Form Data",
      prefix: "formdata",
      category: "core",
      description: "Read submitted form values.",
      tags: [ "request", "form", "post" ],
      scope: [ "python" ],
      body: [
        "${1:username} = request.form.get('${2:username}')",
        "${3:email} = request.form.get('${4:email}')"
      ]
    },
    {
      id: "flask:request-json",
      name: "Get JSON Request Data",
      prefix: "requestjson",
      category: "core",
      description: "Read JSON data sent by an API client.",
      tags: [ "request", "json", "api" ],
      scope: [ "python" ],
      body: [
        "data = request.get_json(silent=True) or {}",
        "",
        "${1:name} = data.get('${2:name}')"
      ]
    },
    {
      id: "flask:request-args",
      name: "Get Query Parameters",
      prefix: "queryparams",
      category: "core",
      description: "Read URL query parameters.",
      tags: [ "request", "query", "parameters" ],
      scope: [ "python" ],
      body: [
        "${1:search} = request.args.get('${2:q}', '${3:}')"
      ]
    },
    {
      id: "flask:json-response",
      name: "JSON Response",
      prefix: "jsonresponse",
      category: "core",
      description: "Return a JSON response.",
      tags: [ "json", "response", "api" ],
      scope: [ "python" ],
      body: [
        "from flask import jsonify",
        "",
        "return jsonify({",
        "    '${1:message}': '${2:Success}'",
        "}), ${3:200}"
      ]
    },
    {
      id: "flask:jsonify",
      name: "JSONify Data",
      prefix: "jsonify",
      category: "core",
      description: "Convert a Python value into a JSON response.",
      tags: [ "json", "response" ],
      scope: [ "python" ],
      body: [
        "return jsonify(${1:data})"
      ]
    },
    {
      id: "flask:redirect",
      name: "Redirect To Endpoint",
      prefix: "redirect",
      category: "core",
      description: "Redirect to another Flask endpoint.",
      tags: [ "redirect", "navigation" ],
      scope: [ "python" ],
      body: [
        "from flask import redirect, url_for",
        "",
        "return redirect(url_for('${1:home}'))"
      ]
    },
    {
      id: "flask:url-for",
      name: "Generate Endpoint URL",
      prefix: "urlfor",
      category: "core",
      description: "Generate a URL for a Flask endpoint.",
      tags: [ "url", "endpoint", "navigation" ],
      scope: [ "python" ],
      body: [
        "url_for('${1:home}')"
      ]
    },
    {
      id: "flask:abort",
      name: "Abort With HTTP Error",
      prefix: "abort",
      category: "core",
      description: "Raise an HTTP error response.",
      tags: [ "error", "http", "abort" ],
      scope: [ "python" ],
      body: [
        "from flask import abort",
        "",
        "abort(${1:404})"
      ]
    },
    {
      id: "flask:error-handler",
      name: "HTTP Error Handler",
      prefix: "errorhandler",
      category: "core",
      description: "Register a custom HTTP error handler.",
      tags: [ "error", "handler", "http" ],
      scope: [ "python" ],
      body: [
        "@app.errorhandler(${1:404})",
        "def handle_not_found(error):",
        "    return {",
        "        'error': '${2:Resource not found}'",
        "    }, ${3:404}"
      ]
    },
    {
      id: "flask:make-response",
      name: "Create Custom Response",
      prefix: "makeresponse",
      category: "core",
      description: "Create and configure a Flask response object.",
      tags: [ "response", "headers", "http" ],
      scope: [ "python" ],
      body: [
        "from flask import make_response",
        "",
        "response = make_response('${1:Response body}', ${2:200})",
        "response.headers['${3:Content-Type}'] = '${4:text/plain}'",
        "",
        "return response"
      ]
    },
    {
      id: "flask:render-template",
      name: "Render HTML Template",
      prefix: "render",
      category: "core",
      description: "Render a Jinja HTML template.",
      tags: [ "template", "jinja", "html" ],
      scope: [ "python" ],
      body: [
        "from flask import render_template",
        "",
        "return render_template('${1:index.html}')"
      ]
    },
    {
      id: "flask:render-template-data",
      name: "Render Template With Data",
      prefix: "renderdata",
      category: "core",
      description: "Pass Python variables into a Jinja template.",
      tags: [ "template", "jinja", "context" ],
      scope: [ "python" ],
      body: [
        "return render_template(",
        "    '${1:index.html}',",
        "    ${2:title}='${3:Home}',",
        "    ${4:user}=user",
        ")"
      ]
    },
    {
      id: "flask:static-url",
      name: "Generate Static File URL",
      prefix: "staticurl",
      category: "core",
      description: "Generate a URL for a static file.",
      tags: [ "static", "url", "assets" ],
      scope: [ "python" ],
      body: [
        "url_for('static', filename='${1:css/style.css}')"
      ]
    },
    {
      id: "flask:before-request",
      name: "Before Request Handler",
      prefix: "beforerequest",
      category: "core",
      description: "Run a function before each request.",
      tags: [ "request", "hooks", "middleware" ],
      scope: [ "python" ],
      body: [
        "@app.before_request",
        "def before_request():",
        "    ${1:# Run before the request}",
        "    return None"
      ]
    },
    {
      id: "flask:after-request",
      name: "After Request Handler",
      prefix: "afterrequest",
      category: "core",
      description: "Modify a response after each request.",
      tags: [ "request", "response", "hooks" ],
      scope: [ "python" ],
      body: [
        "@app.after_request",
        "def after_request(response):",
        "    ${1:# Modify the response}",
        "    return response"
      ]
    },
    {
      id: "flask:cli-command",
      name: "Custom Flask CLI Command",
      prefix: "clicommand",
      category: "core",
      description: "Register a custom Flask command.",
      tags: [ "cli", "command", "management" ],
      scope: [ "python" ],
      body: [
        "@app.cli.command('${1:hello}')",
        "def ${2:hello_command}():",
        "    print('${3:Hello from Flask CLI!}')"
      ]
    },
    {
      id: "flask:request-header",
      name: "Get Request Header",
      prefix: "requestheader",
      category: "core",
      description: "Retrieve a specific HTTP header from the incoming request.",
      tags: [ "request", "headers", "http" ],
      scope: [ "python" ],
      body: [
        "from flask import request",
        "",
        "${1:authorization} = request.headers.get('${2:Authorization}')"
      ]
    },
    {
      id: "flask:request-content-type",
      name: "Get Request Content Type",
      prefix: "requestcontenttype",
      category: "core",
      description: "Get the MIME content type of the incoming request.",
      tags: [ "request", "content-type", "http" ],
      scope: [ "python" ],
      body: [
        "content_type = request.content_type"
      ]
    },
    {
      id: "flask:request-is-json",
      name: "Check JSON Request",
      prefix: "requestisjson",
      category: "core",
      description: "Check whether the incoming request contains JSON data.",
      tags: [ "request", "json", "api" ],
      scope: [ "python" ],
      body: [
        "if request.is_json:",
        "    ${1:# Handle JSON request}",
        "else:",
        "    ${2:# Handle non-JSON request}"
      ]
    },
    {
      id: "flask:request-files",
      name: "Get Uploaded Files",
      prefix: "requestfiles",
      category: "core",
      description: "Retrieve an uploaded file from the request.",
      tags: [ "request", "files", "upload" ],
      scope: [ "python" ],
      body: [
        "uploaded_file = request.files.get('${1:file}')",
        "",
        "if uploaded_file:",
        "    ${2:# Process uploaded file}"
      ]
    },
    {
      id: "flask:request-user-agent",
      name: "Get Request User Agent",
      prefix: "requestuseragent",
      category: "core",
      description: "Retrieve the user-agent string from the incoming request.",
      tags: [ "request", "user-agent", "client" ],
      scope: [ "python" ],
      body: [
        "user_agent = request.user_agent.string"
      ]
    },
    {
      id: "flask:request-remote-address",
      name: "Get Client IP Address",
      prefix: "requestip",
      category: "core",
      description: "Retrieve the remote address associated with the request.",
      tags: [ "request", "ip", "client" ],
      scope: [ "python" ],
      body: [
        "client_ip = request.remote_addr"
      ]
    },
    {
      id: "flask:request-method",
      name: "Get Request Method",
      prefix: "requestmethod",
      category: "core",
      description: "Retrieve the HTTP method used for the current request.",
      tags: [ "request", "http", "method" ],
      scope: [ "python" ],
      body: [
        "method = request.method"
      ]
    },
    {
      id: "flask:request-path",
      name: "Get Request Path",
      prefix: "requestpath",
      category: "core",
      description: "Retrieve the path of the current request.",
      tags: [ "request", "path", "url" ],
      scope: [ "python" ],
      body: [
        "path = request.path"
      ]
    },
    {
      id: "flask:request-form-getlist",
      name: "Get Multiple Form Values",
      prefix: "formgetlist",
      category: "core",
      description: "Retrieve multiple values submitted under the same form field.",
      tags: [ "request", "form", "multiple", "list" ],
      scope: [ "python" ],
      body: [
        "${1:values} = request.form.getlist('${2:items}')"
      ]
    },
    {
      id: "flask:request-args-getlist",
      name: "Get Multiple Query Values",
      prefix: "argsgetlist",
      category: "core",
      description: "Retrieve multiple values for the same URL query parameter.",
      tags: [ "request", "query", "parameters", "list" ],
      scope: [ "python" ],
      body: [
        "${1:values} = request.args.getlist('${2:tags}')"
      ]
    },
    {
      id: "flask:flash-message",
      name: "Flash Message",
      prefix: "flashmessage",
      category: "core",
      description: "Send a one-time message to the next request.",
      tags: [ "flash", "message", "notification" ],
      scope: [ "python" ],
      body: [
        "from flask import flash",
        "",
        "flash('${1:Operation completed successfully}', '${2:success}')"
      ]
    },
    {
      id: "flask:get-flash-messages",
      name: "Get Flash Messages",
      prefix: "getflashmessages",
      category: "core",
      description: "Retrieve queued flash messages, optionally with their categories.",
      tags: [ "flash", "message", "notification" ],
      scope: [ "python" ],
      body: [
        "from flask import get_flashed_messages",
        "",
        "messages = get_flashed_messages(with_categories=${1:True})"
      ]
    },
    {
      id: "flask:send-file",
      name: "Send File Response",
      prefix: "sendfile",
      category: "core",
      description: "Send a file as the response to a request.",
      tags: [ "file", "download", "response" ],
      scope: [ "python" ],
      body: [
        "from flask import send_file",
        "",
        "return send_file('${1:path/to/file.pdf}', as_attachment=${2:True})"
      ]
    },
    {
      id: "flask:send-from-directory",
      name: "Send File From Directory",
      prefix: "sendfromdirectory",
      category: "core",
      description: "Send a file from a specified directory.",
      tags: [ "file", "download", "directory" ],
      scope: [ "python" ],
      body: [
        "from flask import send_from_directory",
        "",
        "return send_from_directory(",
        "    '${1:uploads}',",
        "    '${2:filename.pdf}',",
        "    as_attachment=${3:True}",
        ")"
      ]
    },
    {
      id: "flask:response-set-cookie",
      name: "Set Response Cookie",
      prefix: "setcookie",
      category: "core",
      description: "Set a cookie on the outgoing response.",
      tags: [ "response", "cookie", "http" ],
      scope: [ "python" ],
      body: [
        "from flask import make_response",
        "",
        "response = make_response('${1:Response body}')",
        "response.set_cookie('${2:theme}', '${3:dark}')",
        "",
        "return response"
      ]
    },
    {
      id: "flask:response-delete-cookie",
      name: "Delete Response Cookie",
      prefix: "deletecookie",
      category: "core",
      description: "Remove a cookie by setting it to expire.",
      tags: [ "response", "cookie", "http" ],
      scope: [ "python" ],
      body: [
        "from flask import make_response",
        "",
        "response = make_response('${1:Response body}')",
        "response.delete_cookie('${2:theme}')",
        "",
        "return response"
      ]
    }
  ];

  const architectureSnippets = [
    {
      id: "flask:blueprint",
      name: "Create Blueprint",
      prefix: "blueprint",
      category: "architecture",
      description: "Create a Flask blueprint.",
      tags: [ "blueprint", "architecture", "modular" ],
      scope: [ "python" ],
      body: [
        "from flask import Blueprint",
        "",
        "${1:main}_bp = Blueprint(",
        "    '${2:main}',",
        "    __name__",
        ")"
      ]
    },
    {
      id: "flask:blueprint-prefix",
      name: "Blueprint With URL Prefix",
      prefix: "blueprintprefix",
      category: "architecture",
      description: "Create a blueprint with a URL prefix.",
      tags: [ "blueprint", "url", "prefix" ],
      scope: [ "python" ],
      body: [
        "from flask import Blueprint",
        "",
        "${1:auth}_bp = Blueprint(",
        "    '${2:auth}',",
        "    __name__,",
        "    url_prefix='/${3:auth}'",
        ")"
      ]
    },
    {
      id: "flask:blueprint-register",
      name: "Register Blueprint",
      prefix: "registerblueprint",
      category: "architecture",
      description: "Register a blueprint with the Flask application.",
      tags: [ "blueprint", "registration" ],
      scope: [ "python" ],
      body: [
        "app.register_blueprint(${1:main_bp})"
      ]
    },
    {
      id: "flask:blueprint-import",
      name: "Import and Register Blueprint",
      prefix: "importblueprint",
      category: "architecture",
      description: "Import and register a blueprint inside create_app.",
      tags: [ "blueprint", "factory", "registration" ],
      scope: [ "python" ],
      body: [
        "from app.${1:main} import ${2:main_bp}",
        "",
        "app.register_blueprint(${2:main_bp})"
      ]
    },
    {
      id: "flask:blueprint-routes",
      name: "Blueprint Routes",
      prefix: "blueprintroutes",
      category: "architecture",
      description: "Create routes inside a blueprint module.",
      tags: [ "blueprint", "routes", "views" ],
      scope: [ "python" ],
      body: [
        "from . import ${1:main_bp}",
        "",
        "",
        "@${1:main_bp}.route('/${2:path}')",
        "def ${3:view_name}():",
        "    return '${4:Hello from blueprint!}'"
      ]
    },
    {
      id: "flask:blueprint-init",
      name: "Blueprint Package Initialization",
      prefix: "blueprintinit",
      category: "architecture",
      description: "Initialize a blueprint package. The routes module imports the blueprint from this package.",
      tags: [ "blueprint", "package", "initialization" ],
      scope: [ "python" ],
      body: [
        "from flask import Blueprint",
        "",
        "${1:main}_bp = Blueprint('${2:main}', __name__)",
        "",
        "# Import routes after creating the blueprint.",
        "from . import routes"
      ]
    },
    {
      id: "flask:factory-blueprints",
      name: "Factory With Multiple Blueprints",
      prefix: "factoryblueprints",
      category: "architecture",
      description: "Register multiple blueprints in an application factory.",
      tags: [ "factory", "blueprint", "architecture" ],
      scope: [ "python" ],
      body: [
        "from flask import Flask",
        "",
        "",
        "def create_app(config_class=None):",
        "    app = Flask(__name__)",
        "",
        "    if config_class:",
        "        app.config.from_object(config_class)",
        "",
        "    from app.main import main_bp",
        "    from app.auth import auth_bp",
        "    from app.api import api_bp",
        "",
        "    app.register_blueprint(main_bp)",
        "    app.register_blueprint(auth_bp)",
        "    app.register_blueprint(api_bp)",
        "",
        "    return app"
      ]
    },
    {
      id: "flask:extension-instance",
      name: "Create Extension Instance",
      prefix: "extensioninstance",
      category: "architecture",
      description: "Create an unbound Flask extension instance.",
      tags: [ "extension", "initialization", "factory" ],
      scope: [ "python" ],
      body: [
        "from flask_${1:extension} import ${2:Extension}",
        "",
        "${3:extension} = ${2:Extension}()"
      ]
    },
    {
      id: "flask:extension-init",
      name: "Initialize Extension",
      prefix: "extensioninit",
      category: "architecture",
      description: "Initialize a Flask extension inside create_app.",
      tags: [ "extension", "factory", "initialization" ],
      scope: [ "python" ],
      body: [
        "${1:extension}.init_app(app)"
      ]
    },
    {
      id: "flask:extensions-module",
      name: "Centralized Extensions Module",
      prefix: "extensionsmodule",
      category: "architecture",
      description: "Create a centralized module for Flask extension instances.",
      tags: [ "extensions", "architecture", "organization" ],
      scope: [ "python" ],
      body: [
        "from flask_sqlalchemy import SQLAlchemy",
        "from flask_migrate import Migrate",
        "from flask_login import LoginManager",
        "",
        "db = SQLAlchemy()",
        "migrate = Migrate()",
        "login_manager = LoginManager()"
      ]
    },
    {
      id: "flask:extensions-factory",
      name: "Initialize Multiple Extensions",
      prefix: "initextensions",
      category: "architecture",
      description: "Initialize shared extension instances in an application factory.",
      tags: [ "extensions", "factory", "initialization" ],
      scope: [ "python" ],
      body: [
        "from app.extensions import db, migrate, login_manager",
        "",
        "db.init_app(app)",
        "migrate.init_app(app, db)",
        "login_manager.init_app(app)"
      ]
    },
    {
      id: "flask:config-class",
      name: "Flask Configuration Class",
      prefix: "configclass",
      category: "architecture",
      description: "Define reusable Flask configuration. Set SECRET_KEY securely through the environment.",
      tags: [ "config", "settings", "environment" ],
      scope: [ "python" ],
      body: [
        "import os",
        "",
        "",
        "class Config:",
        "    SECRET_KEY = os.environ.get('SECRET_KEY')",
        "    DEBUG = False",
        "    TESTING = False",
        "    SQLALCHEMY_TRACK_MODIFICATIONS = False"
      ]
    },
    {
      id: "flask:development-config",
      name: "Development Configuration",
      prefix: "devconfig",
      category: "architecture",
      description: "Define development-specific configuration.",
      tags: [ "config", "development", "environment" ],
      scope: [ "python" ],
      body: [
        "class DevelopmentConfig(Config):",
        "    DEBUG = True",
        "    TESTING = False"
      ]
    },
    {
      id: "flask:production-config",
      name: "Production Configuration",
      prefix: "prodconfig",
      category: "architecture",
      description: "Define production-specific configuration.",
      tags: [ "config", "production", "environment" ],
      scope: [ "python" ],
      body: [
        "class ProductionConfig(Config):",
        "    DEBUG = False",
        "    TESTING = False"
      ]
    },
    {
      id: "flask:testing-config",
      name: "Testing Configuration",
      prefix: "testconfig",
      category: "architecture",
      description: "Define testing-specific configuration.",
      tags: [ "config", "testing", "environment" ],
      scope: [ "python" ],
      body: [
        "class TestingConfig(Config):",
        "    TESTING = True",
        "    DEBUG = False"
      ]
    },
    {
      id: "flask:load-config",
      name: "Load Flask Configuration",
      prefix: "loadconfig",
      category: "architecture",
      description: "Load a configuration class into a Flask application.",
      tags: [ "config", "factory" ],
      scope: [ "python" ],
      body: [
        "app.config.from_object(${1:Config})"
      ]
    },
    {
      id: "flask:dotenv",
      name: "Load Environment Variables",
      prefix: "dotenv",
      category: "architecture",
      description: "Load environment variables from a .env file.",
      tags: [ "dotenv", "environment", "configuration" ],
      scope: [ "python" ],
      body: [
        "from dotenv import load_dotenv",
        "",
        "load_dotenv()"
      ]
    },
    {
      id: "flask:app-context",
      name: "Flask Application Context",
      prefix: "appcontext",
      category: "architecture",
      description: "Execute code within the Flask application context.",
      tags: [ "context", "application", "database" ],
      scope: [ "python" ],
      body: [
        "with app.app_context():",
        "    ${1:# Access application-bound resources}",
        "    pass"
      ]
    },
    {
      id: "flask:request-context",
      name: "Flask Request Context",
      prefix: "requestcontext",
      category: "architecture",
      description: "Create a request context for testing or standalone operations.",
      tags: [ "context", "request", "testing" ],
      scope: [ "python" ],
      body: [
        "with app.test_request_context('/${1:path}'):",
        "    ${2:# Access request-bound resources}",
        "    pass"
      ]
    },
    {
      id: "flask:current-app",
      name: "Access Current Application",
      prefix: "currentapp",
      category: "architecture",
      description: "Import Flask's current application proxy.",
      tags: [ "context", "current-app" ],
      scope: [ "python" ],
      body: [
        "from flask import current_app",
        "",
        "current_app.${1:config}"
      ]
    },
    {
      id: "flask:project-logger",
      name: "Configure Flask Logger",
      prefix: "flasklogger",
      category: "architecture",
      description: "Configure the Flask application logger.",
      tags: [ "logging", "debugging", "configuration" ],
      scope: [ "python" ],
      body: [
        "import logging",
        "",
        "app.logger.setLevel(logging.${1:INFO})",
        "app.logger.${2:info}('${3:Application started}')"
      ]
    },

    // Blueprint hooks and handlers
    {
      id: "flask:blueprint-before-request",
      name: "Blueprint Before Request",
      prefix: "blueprintbefore",
      category: "architecture",
      description: "Run a function before each request handled by a blueprint.",
      tags: [ "blueprint", "hooks", "request" ],
      scope: [ "python" ],
      body: [
        "@${1:main_bp}.before_request",
        "def before_blueprint_request():",
        "    ${2:# Run before blueprint requests}",
        "    return None"
      ]
    },
    {
      id: "flask:blueprint-after-request",
      name: "Blueprint After Request",
      prefix: "blueprintafter",
      category: "architecture",
      description: "Modify responses after requests handled by a blueprint.",
      tags: [ "blueprint", "hooks", "response" ],
      scope: [ "python" ],
      body: [
        "@${1:main_bp}.after_request",
        "def after_blueprint_request(response):",
        "    ${2:# Modify the response}",
        "    return response"
      ]
    },
    {
      id: "flask:blueprint-error-handler",
      name: "Blueprint Error Handler",
      prefix: "blueprinterror",
      category: "architecture",
      description: "Register an error handler for errors raised while handling blueprint requests.",
      tags: [ "blueprint", "error", "handler" ],
      scope: [ "python" ],
      body: [
        "@${1:main_bp}.errorhandler(${2:404})",
        "def handle_blueprint_error(error):",
        "    return {",
        "        'error': '${3:Resource not found}'",
        "    }, ${2:404}"
      ]
    },
    {
      id: "flask:blueprint-app-error-handler",
      name: "Blueprint Application Error Handler",
      prefix: "blueprintapperror",
      category: "architecture",
      description: "Register an application-wide error handler from a blueprint.",
      tags: [ "blueprint", "application", "error" ],
      scope: [ "python" ],
      body: [
        "@${1:main_bp}.app_errorhandler(${2:500})",
        "def handle_application_error(error):",
        "    return {",
        "        'error': '${3:Internal server error}'",
        "    }, ${2:500}"
      ]
    },
    {
      id: "flask:blueprint-teardown",
      name: "Blueprint Teardown Request",
      prefix: "blueprintteardown",
      category: "architecture",
      description: "Run cleanup logic after a blueprint request.",
      tags: [ "blueprint", "teardown", "cleanup" ],
      scope: [ "python" ],
      body: [
        "@${1:main_bp}.teardown_request",
        "def teardown_blueprint_request(error=None):",
        "    ${2:# Release request-specific resources}",
        "    pass"
      ]
    },
    {
      id: "flask:nested-blueprint",
      name: "Register Nested Blueprint",
      prefix: "nestedblueprint",
      category: "architecture",
      description: "Register a child blueprint under a parent blueprint.",
      tags: [ "blueprint", "nested", "modular" ],
      scope: [ "python" ],
      body: [
        "from flask import Blueprint",
        "",
        "${1:admin_bp} = Blueprint('${2:admin}', __name__)",
        "${3:users_bp} = Blueprint('${4:users}', __name__)",
        "",
        "${1:admin_bp}.register_blueprint(",
        "    ${3:users_bp},",
        "    url_prefix='/${5:users}'",
        ")",
        "",
        "app.register_blueprint(${1:admin_bp})"
      ]
    },
    {
      id: "flask:blueprint-url-rule",
      name: "Add Blueprint URL Rule",
      prefix: "blueprinturlrule",
      category: "architecture",
      description: "Register a URL rule directly on a blueprint.",
      tags: [ "blueprint", "routing", "url-rule" ],
      scope: [ "python" ],
      body: [
        "${1:main_bp}.add_url_rule(",
        "    '/${2:path}',",
        "    endpoint='${3:view_endpoint}',",
        "    view_func=${4:view_function},",
        "    methods=['${5:GET}']",
        ")"
      ]
    },
    {
      id: "flask:blueprint-cli",
      name: "Blueprint CLI Command",
      prefix: "blueprintcli",
      category: "architecture",
      description: "Register a CLI command through a blueprint.",
      tags: [ "blueprint", "cli", "command" ],
      scope: [ "python" ],
      body: [
        "@${1:main_bp}.cli.command('${2:hello}')",
        "def ${3:hello_command}():",
        "    print('${4:Hello from blueprint CLI!}')"
      ]
    },

    // Application context and template integration
    {
      id: "flask:app-context-processor",
      name: "Application Context Processor",
      prefix: "appcontextprocessor",
      category: "architecture",
      description: "Make common variables available to all templates.",
      tags: [ "context", "template", "application" ],
      scope: [ "python" ],
      body: [
        "@app.context_processor",
        "def inject_global_data():",
        "    return {",
        "        '${1:site_name}': '${2:My Flask App}'",
        "    }"
      ]
    },
    {
      id: "flask:blueprint-context-processor",
      name: "Blueprint Context Processor",
      prefix: "blueprintcontext",
      category: "architecture",
      description: "Make variables available to templates rendered by a blueprint.",
      tags: [ "blueprint", "context", "template" ],
      scope: [ "python" ],
      body: [
        "@${1:main_bp}.context_processor",
        "def inject_blueprint_data():",
        "    return {",
        "        '${2:section_name}': '${3:Main}'",
        "    }"
      ]
    },
    {
      id: "flask:shell-context",
      name: "Flask Shell Context",
      prefix: "shellcontext",
      category: "architecture",
      description: "Automatically expose useful objects in the Flask shell.",
      tags: [ "shell", "context", "cli" ],
      scope: [ "python" ],
      body: [
        "@app.shell_context_processor",
        "def make_shell_context():",
        "    return {",
        "        '${1:db}': ${2:db},",
        "        '${3:User}': ${4:User}",
        "    }"
      ]
    },
    {
      id: "flask:app-template-filter",
      name: "Register Template Filter",
      prefix: "apptemplatefilter",
      category: "architecture",
      description: "Create a custom Jinja filter available to application templates.",
      tags: [ "template", "jinja", "filter" ],
      scope: [ "python" ],
      body: [
        "@app.template_filter('${1:capitalize_words}')",
        "def ${2:capitalize_words}(value):",
        "    return value.title()"
      ]
    },
    {
      id: "flask:blueprint-template-filter",
      name: "Blueprint Template Filter",
      prefix: "blueprintfilter",
      category: "architecture",
      description: "Register a Jinja template filter through a blueprint.",
      tags: [ "blueprint", "template", "filter" ],
      scope: [ "python" ],
      body: [
        "@${1:main_bp}.app_template_filter('${2:capitalize_words}')",
        "def ${3:capitalize_words}(value):",
        "    return value.title()"
      ]
    },
    {
      id: "flask:app-template-global",
      name: "Register Template Global",
      prefix: "apptemplateglobal",
      category: "architecture",
      description: "Register a Python function as a global available in Jinja templates.",
      tags: [ "template", "jinja", "global" ],
      scope: [ "python" ],
      body: [
        "@app.template_global()",
        "def ${1:current_year}():",
        "    from datetime import datetime",
        "    return datetime.now().year"
      ]
    },

    // Application lifecycle hooks
    {
      id: "flask:teardown-app-context",
      name: "Teardown Application Context",
      prefix: "teardownappcontext",
      category: "architecture",
      description: "Release resources when an application context ends.",
      tags: [ "context", "teardown", "cleanup" ],
      scope: [ "python" ],
      body: [
        "@app.teardown_appcontext",
        "def close_resources(error=None):",
        "    ${1:# Release application-context resources}",
        "    pass"
      ]
    },
    {
      id: "flask:teardown-request",
      name: "Teardown Request",
      prefix: "teardownrequest",
      category: "architecture",
      description: "Run cleanup logic when a request context ends.",
      tags: [ "request", "teardown", "cleanup" ],
      scope: [ "python" ],
      body: [
        "@app.teardown_request",
        "def cleanup_request(error=None):",
        "    ${1:# Release request-specific resources}",
        "    pass"
      ]
    },
    {
      id: "flask:url-value-preprocessor",
      name: "URL Value Preprocessor",
      prefix: "urlvaluepreprocessor",
      category: "architecture",
      description: "Process URL values before a view function is called.",
      tags: [ "url", "routing", "preprocessor" ],
      scope: [ "python" ],
      body: [
        "@app.url_value_preprocessor",
        "def pull_values(endpoint, values):",
        "    if values:",
        "        ${1:language} = values.pop('${2:lang}', None)"
      ]
    },
    {
      id: "flask:url-defaults",
      name: "URL Defaults",
      prefix: "urldefaults",
      category: "architecture",
      description: "Add default values when Flask builds URLs.",
      tags: [ "url", "routing", "defaults" ],
      scope: [ "python" ],
      body: [
        "@app.url_defaults",
        "def add_url_defaults(endpoint, values):",
        "    values.setdefault('${1:lang}', '${2:en}')"
      ]
    },

    // Configuration loading
    {
      id: "flask:config-pyfile",
      name: "Load Configuration From Python File",
      prefix: "configpyfile",
      category: "architecture",
      description: "Load configuration values from a Python configuration file.",
      tags: [ "config", "file", "settings" ],
      scope: [ "python" ],
      body: [
        "app.config.from_pyfile('${1:config.py}', silent=${2:False})"
      ]
    },
    {
      id: "flask:config-envvar",
      name: "Load Configuration From Environment Variable",
      prefix: "configenvvar",
      category: "architecture",
      description: "Load a Python configuration file using an environment variable.",
      tags: [ "config", "environment", "settings" ],
      scope: [ "python" ],
      body: [
        "app.config.from_envvar('${1:FLASK_CONFIG}')"
      ]
    },
    {
      id: "flask:instance-relative-config",
      name: "Instance Relative Configuration",
      prefix: "instanceconfig",
      category: "architecture",
      description: "Create a Flask application with instance-relative configuration.",
      tags: [ "config", "instance", "factory" ],
      scope: [ "python" ],
      body: [
        "from flask import Flask",
        "",
        "app = Flask(",
        "    __name__,",
        "    instance_relative_config=True",
        ")",
        "",
        "app.config.from_pyfile('${1:config.py}', silent=True)"
      ]
    }
  ];

  const extensionSnippets = [
    {
      id: "extensions:sqlalchemy-import",
      name: "Import Flask-SQLAlchemy",
      prefix: "sqlalchemyimport",
      category: "extensions",
      description: "Import SQLAlchemy and create the database extension instance.",
      body: [
        "from flask_sqlalchemy import SQLAlchemy",
        "",
        "db = SQLAlchemy()"
      ],
      tags: [ "sqlalchemy", "database", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:sqlalchemy-init",
      name: "Initialize SQLAlchemy",
      prefix: "dbinit",
      category: "extensions",
      description: "Initialize Flask-SQLAlchemy with the application.",
      body: [
        "from app.extensions import db",
        "",
        "db.init_app(${1:app})"
      ],
      tags: [ "sqlalchemy", "database", "init" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:sqlalchemy-model",
      name: "SQLAlchemy Model",
      prefix: "dbmodel",
      category: "extensions",
      description: "Create a Flask-SQLAlchemy model with common columns.",
      body: [
        "from app.extensions import db",
        "",
        "class ${1:User}(db.Model):",
        "    __tablename__ = \"${2:users}\"",
        "",
        "    id = db.Column(db.Integer, primary_key=True)",
        "    ${3:name} = db.Column(db.String(${4:120}), nullable=False)",
        "    created_at = db.Column(",
        "        db.DateTime,",
        "        server_default=db.func.now(),",
        "        nullable=False",
        "    )",
        "",
        "    def __repr__(self):",
        "        return f\"<${1:User} {self.id}>\""
      ],
      tags: [ "sqlalchemy", "model", "database" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:sqlalchemy-relationship",
      name: "SQLAlchemy Relationship",
      prefix: "dbrelationship",
      category: "extensions",
      description: "Define a one-to-many SQLAlchemy relationship. Add a matching foreign key and back_populates relationship to the related model.",
      body: [
        "${1:posts} = db.relationship(",
        "    \"${2:Post}\",",
        "    back_populates=\"${3:author}\"",
        ")"
      ],
      tags: [ "sqlalchemy", "relationship", "database" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:sqlalchemy-transaction",
      name: "Database Transaction",
      prefix: "dbtransaction",
      category: "extensions",
      description: "Commit a database transaction and roll it back if an error occurs.",
      body: [
        "try:",
        "    db.session.add(${1:instance})",
        "    db.session.commit()",
        "except Exception:",
        "    db.session.rollback()",
        "    raise"
      ],
      tags: [ "sqlalchemy", "transaction", "database" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:migrate-import",
      name: "Import Flask-Migrate",
      prefix: "migrateimport",
      category: "extensions",
      description: "Create the Flask-Migrate extension instance.",
      body: [
        "from flask_migrate import Migrate",
        "",
        "migrate = Migrate()"
      ],
      tags: [ "migrate", "database", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:migrate-init",
      name: "Initialize Flask-Migrate",
      prefix: "migrateinit",
      category: "extensions",
      description: "Connect Flask-Migrate to the application and database.",
      body: [
        "from app.extensions import db, migrate",
        "",
        "migrate.init_app(${1:app}, db)"
      ],
      tags: [ "migrate", "database", "init" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:migrate-command",
      name: "Migration Command Reference",
      prefix: "migratecommands",
      category: "extensions",
      description: "Common Flask-Migrate CLI commands.",
      body: [
        "# Initialize migrations (once per project):",
        "# flask db init",
        "",
        "# Generate a migration:",
        "# flask db migrate -m \"${1:describe changes}\"",
        "",
        "# Apply migrations:",
        "# flask db upgrade",
        "",
        "# Roll back one migration:",
        "# flask db downgrade"
      ],
      tags: [ "migrate", "database", "commands" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:login-import",
      name: "Import Flask-Login",
      prefix: "loginimport",
      category: "extensions",
      description: "Create a Flask-Login manager instance.",
      body: [
        "from flask_login import LoginManager",
        "",
        "login_manager = LoginManager()"
      ],
      tags: [ "login", "authentication", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:login-init",
      name: "Initialize Flask-Login",
      prefix: "logininit",
      category: "extensions",
      description: "Configure Flask-Login for the application.",
      body: [
        "from app.extensions import login_manager",
        "",
        "login_manager.init_app(${1:app})",
        "login_manager.login_view = \"${2:auth.login}\"",
        "login_manager.login_message_category = \"${3:info}\""
      ],
      tags: [ "login", "authentication", "init" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:login-user-loader",
      name: "Flask-Login User Loader",
      prefix: "userloader",
      category: "extensions",
      description: "Load a user from the database using their ID.",
      body: [
        "from app.extensions import login_manager, db",
        "from app.models import ${1:User}",
        "",
        "@login_manager.user_loader",
        "def load_user(user_id):",
        "    try:",
        "        return db.session.get(${1:User}, int(user_id))",
        "    except (TypeError, ValueError):",
        "        return None"
      ],
      tags: [ "login", "authentication", "user-loader" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:login-required",
      name: "Login Required Route",
      prefix: "loginrequired",
      category: "extensions",
      description: "Protect a Flask route so only authenticated users can access it.",
      body: [
        "from flask_login import login_required",
        "",
        "@${1:bp}.route(\"${2:/dashboard}\")",
        "@login_required",
        "def ${3:dashboard}():",
        "    return ${4:render_template(\"dashboard.html\")}"
      ],
      tags: [ "login", "authentication", "route" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:login-user-actions",
      name: "Flask-Login User Actions",
      prefix: "loginactions",
      category: "extensions",
      description: "Log in, log out, and access the current user.",
      body: [
        "from flask_login import login_user, logout_user, current_user",
        "",
        "# Log in:",
        "login_user(${1:user})",
        "",
        "# Access the current user:",
        "current_user",
        "",
        "# Log out:",
        "logout_user()"
      ],
      tags: [ "login", "authentication", "session" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:wtf-import",
      name: "Import Flask-WTF",
      prefix: "wtfimport",
      category: "extensions",
      description: "Import Flask-WTF form tools and validators.",
      body: [
        "from flask_wtf import FlaskForm",
        "from wtforms import StringField, PasswordField, SubmitField",
        "from wtforms.validators import DataRequired, Length"
      ],
      tags: [ "wtf", "forms", "validation", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:wtf-form",
      name: "Flask-WTF Form",
      prefix: "wtfform",
      category: "extensions",
      description: "Create a validated Flask-WTF form.",
      body: [
        "from flask_wtf import FlaskForm",
        "from wtforms import StringField, SubmitField",
        "from wtforms.validators import DataRequired, Length",
        "",
        "class ${1:ExampleForm}(FlaskForm):",
        "    ${2:name} = StringField(",
        "        \"${3:Name}\",",
        "        validators=[DataRequired(), Length(max=${4:120})]",
        "    )",
        "    submit = SubmitField(\"${5:Submit}\")"
      ],
      tags: [ "wtf", "forms", "validation" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:wtf-csrf",
      name: "Enable Flask-WTF CSRF",
      prefix: "wtfcsrf",
      category: "extensions",
      description: "Configure CSRF protection using Flask-WTF.",
      body: [
        "from flask_wtf.csrf import CSRFProtect",
        "",
        "csrf = CSRFProtect()",
        "csrf.init_app(${1:app})"
      ],
      tags: [ "wtf", "csrf", "security" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:cors-import",
      name: "Import Flask-CORS",
      prefix: "corsimport",
      category: "extensions",
      description: "Import Flask-CORS.",
      body: [
        "from flask_cors import CORS"
      ],
      tags: [ "cors", "api", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:cors-config",
      name: "Configure Flask-CORS",
      prefix: "corsconfig",
      category: "extensions",
      description: "Allow configured origins to access API routes.",
      body: [
        "from flask_cors import CORS",
        "",
        "CORS(",
        "    ${1:app},",
        "    resources={",
        "        r\"/api/*\": {",
        "            \"origins\": [\"${2:https://example.com}\"]",
        "        }",
        "    }",
        ")"
      ],
      tags: [ "cors", "api", "security", "configuration" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:mail-import",
      name: "Import Flask-Mail",
      prefix: "mailimport",
      category: "extensions",
      description: "Create a Flask-Mail extension instance.",
      body: [
        "from flask_mail import Mail, Message",
        "",
        "mail = Mail()"
      ],
      tags: [ "mail", "email", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:mail-init",
      name: "Initialize Flask-Mail",
      prefix: "mailinit",
      category: "extensions",
      description: "Initialize Flask-Mail with the application.",
      body: [
        "from app.extensions import mail",
        "",
        "mail.init_app(${1:app})"
      ],
      tags: [ "mail", "email", "init" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:mail-send",
      name: "Send Email",
      prefix: "mailsend",
      category: "extensions",
      description: "Create and send an email using Flask-Mail.",
      body: [
        "from flask_mail import Message",
        "from app.extensions import mail",
        "",
        "message = Message(",
        "    subject=\"${1:Subject}\",",
        "    recipients=[\"${2:recipient@example.com}\"],",
        "    body=\"${3:Email body}\"",
        ")",
        "",
        "mail.send(message)"
      ],
      tags: [ "mail", "email", "send" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:limiter-import",
      name: "Import Flask-Limiter",
      prefix: "limiterimport",
      category: "extensions",
      description: "Create a Flask-Limiter instance.",
      body: [
        "from flask_limiter import Limiter",
        "from flask_limiter.util import get_remote_address",
        "",
        "limiter = Limiter(",
        "    key_func=get_remote_address",
        ")"
      ],
      tags: [ "limiter", "rate-limit", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:limiter-init",
      name: "Initialize Flask-Limiter",
      prefix: "limiterinit",
      category: "extensions",
      description: "Initialize Flask-Limiter with the application.",
      body: [
        "from app.extensions import limiter",
        "",
        "limiter.init_app(${1:app})"
      ],
      tags: [ "limiter", "rate-limit", "init" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:limiter-route",
      name: "Rate-Limited Route",
      prefix: "ratelimit",
      category: "extensions",
      description: "Apply a rate limit to a Flask route.",
      body: [
        "@${1:bp}.route(\"${2:/api/resource}\")",
        "@limiter.limit(\"${3:10 per minute}\")",
        "def ${4:resource}():",
        "    return ${5:jsonify({\"message\": \"OK\"})}"
      ],
      tags: [ "limiter", "rate-limit", "route" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:marshmallow-import",
      name: "Import Flask-Marshmallow",
      prefix: "marshmallowimport",
      category: "extensions",
      description: "Create a Flask-Marshmallow extension instance.",
      body: [
        "from flask_marshmallow import Marshmallow",
        "",
        "ma = Marshmallow()"
      ],
      tags: [ "marshmallow", "serialization", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:marshmallow-init",
      name: "Initialize Flask-Marshmallow",
      prefix: "marshmallowinit",
      category: "extensions",
      description: "Initialize Flask-Marshmallow with the application.",
      body: [
        "from app.extensions import ma",
        "",
        "ma.init_app(${1:app})"
      ],
      tags: [ "marshmallow", "serialization", "init" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:marshmallow-schema",
      name: "SQLAlchemy Auto Schema",
      prefix: "sqlaschema",
      category: "extensions",
      description: "Create a Marshmallow schema for a SQLAlchemy model.",
      body: [
        "from app.extensions import ma",
        "from app.models import ${1:User}",
        "",
        "class ${2:UserSchema}(ma.SQLAlchemyAutoSchema):",
        "    class Meta:",
        "        model = ${1:User}",
        "        load_instance = True"
      ],
      tags: [ "marshmallow", "schema", "sqlalchemy", "serialization" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:cache-import",
      name: "Import Flask-Caching",
      prefix: "cacheimport",
      category: "extensions",
      description: "Create a Flask-Caching instance.",
      body: [
        "from flask_caching import Cache",
        "",
        "cache = Cache()"
      ],
      tags: [ "cache", "performance", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:cache-init",
      name: "Initialize Flask-Caching",
      prefix: "cacheinit",
      category: "extensions",
      description: "Initialize caching with the Flask application.",
      body: [
        "from app.extensions import cache",
        "",
        "cache.init_app(${1:app}, config={",
        "    \"CACHE_TYPE\": \"${2:SimpleCache}\",",
        "    \"CACHE_DEFAULT_TIMEOUT\": ${3:300}",
        "})"
      ],
      tags: [ "cache", "performance", "configuration" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:cache-route",
      name: "Cache Route Response",
      prefix: "cacheview",
      category: "extensions",
      description: "Cache the response from a Flask view.",
      body: [
        "@${1:cache}.cached(timeout=${2:300})",
        "def ${3:expensive_view}():",
        "    ${4:return \"Cached response\"}"
      ],
      tags: [ "cache", "performance", "route" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:cache-function",
      name: "Cache Function Result",
      prefix: "cachememoize",
      category: "extensions",
      description: "Cache the result of a function using Flask-Caching.",
      body: [
        "@cache.memoize(timeout=${1:300})",
        "def ${2:get_data}(${3:item_id}):",
        "    ${4:return load_data(item_id)}"
      ],
      tags: [ "cache", "memoize", "performance" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:cache-clear",
      name: "Clear Application Cache",
      prefix: "cacheclear",
      category: "extensions",
      description: "Clear all cached values.",
      body: [
        "cache.clear()"
      ],
      tags: [ "cache", "clear", "maintenance" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:socketio-import",
      name: "Import Flask-SocketIO",
      prefix: "socketioimport",
      category: "extensions",
      description: "Create a Flask-SocketIO instance.",
      body: [
        "from flask_socketio import SocketIO",
        "",
        "socketio = SocketIO()"
      ],
      tags: [ "socketio", "websocket", "realtime" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:socketio-init",
      name: "Initialize Flask-SocketIO",
      prefix: "socketioinit",
      category: "extensions",
      description: "Initialize Socket.IO with the Flask application.",
      body: [
        "from app.extensions import socketio",
        "",
        "socketio.init_app(${1:app}, cors_allowed_origins=${2:[]})"
      ],
      tags: [ "socketio", "websocket", "initialization" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:socketio-event",
      name: "Register Socket.IO Event",
      prefix: "socketioevent",
      category: "extensions",
      description: "Register a handler for an incoming Socket.IO event.",
      body: [
        "from flask_socketio import emit",
        "",
        "@socketio.on(\"${1:message}\")",
        "def ${2:handle_message}(data):",
        "    emit(\"${3:response}\", {",
        "        \"message\": data",
        "    })"
      ],
      tags: [ "socketio", "event", "realtime" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:socketio-emit",
      name: "Emit Socket.IO Event",
      prefix: "socketioemit",
      category: "extensions",
      description: "Send an event to connected Socket.IO clients.",
      body: [
        "socketio.emit(",
        "    \"${1:notification}\",",
        "    {\"message\": \"${2:Hello}\"},",
        "    room=${3:room_id}",
        ")"
      ],
      tags: [ "socketio", "emit", "realtime" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:socketio-run",
      name: "Run Socket.IO Server",
      prefix: "socketiorun",
      category: "extensions",
      description: "Start the Flask application using the Socket.IO server.",
      body: [
        "if __name__ == \"__main__\":",
        "    socketio.run(",
        "        app,",
        "        host=\"${1:127.0.0.1}\",",
        "        port=${2:5000},",
        "        debug=${3:True}",
        "    )"
      ],
      tags: [ "socketio", "server", "run" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:jwt-import",
      name: "Import Flask-JWT-Extended",
      prefix: "jwtimport",
      category: "extensions",
      description: "Create a Flask-JWT-Extended instance.",
      body: [
        "from flask_jwt_extended import JWTManager",
        "",
        "jwt = JWTManager()"
      ],
      tags: [ "jwt", "authentication", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:jwt-init",
      name: "Initialize Flask-JWT-Extended",
      prefix: "jwtinit",
      category: "extensions",
      description: "Initialize JWT authentication with the Flask application.",
      body: [
        "from app.extensions import jwt",
        "",
        "jwt.init_app(${1:app})"
      ],
      tags: [ "jwt", "authentication", "initialization" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:jwt-create",
      name: "Create JWT Access Token",
      prefix: "jwtcreate",
      category: "extensions",
      description: "Create an access token for an authenticated identity.",
      body: [
        "from flask_jwt_extended import create_access_token",
        "",
        "access_token = create_access_token(",
        "    identity=str(${1:user.id})",
        ")"
      ],
      tags: [ "jwt", "token", "authentication" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:jwt-protect",
      name: "Protect JWT Route",
      prefix: "jwtprotect",
      category: "extensions",
      description: "Require a valid JWT access token to access a route.",
      body: [
        "from flask_jwt_extended import jwt_required, get_jwt_identity",
        "",
        "@${1:bp}.route(\"${2:/api/profile}\")",
        "@jwt_required()",
        "def ${3:profile}():",
        "    current_identity = get_jwt_identity()",
        "    return {\"identity\": current_identity}"
      ],
      tags: [ "jwt", "authentication", "route" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:jwt-refresh",
      name: "Create JWT Refresh Token",
      prefix: "jwtrefresh",
      category: "extensions",
      description: "Create a refresh token for renewing access tokens.",
      body: [
        "from flask_jwt_extended import create_refresh_token",
        "",
        "refresh_token = create_refresh_token(",
        "    identity=str(${1:user.id})",
        ")"
      ],
      tags: [ "jwt", "refresh-token", "authentication" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:jwt-refresh-route",
      name: "JWT Token Refresh Route",
      prefix: "jwtrefreshroute",
      category: "extensions",
      description: "Create a route that issues a new access token from a valid refresh token.",
      body: [
        "from flask import jsonify",
        "from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token",
        "",
        "@${1:bp}.route(\"${2:/api/refresh}\", methods=[\"POST\"])",
        "@jwt_required(refresh=True)",
        "def ${3:refresh}():",
        "    identity = get_jwt_identity()",
        "    access_token = create_access_token(identity=identity)",
        "    return jsonify(access_token=access_token)"
      ],
      tags: [ "jwt", "refresh-token", "route" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:bcrypt-import",
      name: "Import Flask-Bcrypt",
      prefix: "bcryptimport",
      category: "extensions",
      description: "Create a Flask-Bcrypt instance.",
      body: [
        "from flask_bcrypt import Bcrypt",
        "",
        "bcrypt = Bcrypt()"
      ],
      tags: [ "bcrypt", "password", "security" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:bcrypt-init",
      name: "Initialize Flask-Bcrypt",
      prefix: "bcryptinit",
      category: "extensions",
      description: "Initialize Flask-Bcrypt with the application.",
      body: [
        "from app.extensions import bcrypt",
        "",
        "bcrypt.init_app(${1:app})"
      ],
      tags: [ "bcrypt", "password", "initialization" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:bcrypt-hash",
      name: "Generate Bcrypt Password Hash",
      prefix: "bcryptgenerate",
      category: "extensions",
      description: "Generate a password hash using Flask-Bcrypt.",
      body: [
        "password_hash = bcrypt.generate_password_hash(",
        "    ${1:password}",
        ").decode(\"utf-8\")"
      ],
      tags: [ "bcrypt", "password", "hashing" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:bcrypt-check",
      name: "Verify Bcrypt Password",
      prefix: "bcryptcheck",
      category: "extensions",
      description: "Check a password against a stored Bcrypt hash.",
      body: [
        "if bcrypt.check_password_hash(${1:user.password_hash}, ${2:password}):",
        "    ${3:pass}"
      ],
      tags: [ "bcrypt", "password", "verification" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:session-import",
      name: "Import Flask-Session",
      prefix: "sessionimport",
      category: "extensions",
      description: "Import the Flask-Session extension.",
      body: [
        "from flask_session import Session",
        "",
        "session_ext = Session()"
      ],
      tags: [ "session", "storage", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:session-init",
      name: "Initialize Flask-Session",
      prefix: "sessioninit",
      category: "extensions",
      description: "Configure server-side session storage.",
      body: [
        "from app.extensions import session_ext",
        "",
        "${1:app}.config[\"SESSION_TYPE\"] = \"${2:filesystem}\"",
        "session_ext.init_app(${1:app})"
      ],
      tags: [ "session", "storage", "configuration" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:compress-import",
      name: "Import Flask-Compress",
      prefix: "compressimport",
      category: "extensions",
      description: "Create a Flask-Compress instance.",
      body: [
        "from flask_compress import Compress",
        "",
        "compress = Compress()"
      ],
      tags: [ "compression", "performance", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:compress-init",
      name: "Initialize Flask-Compress",
      prefix: "compressinit",
      category: "extensions",
      description: "Enable response compression for the Flask application.",
      body: [
        "from app.extensions import compress",
        "",
        "compress.init_app(${1:app})"
      ],
      tags: [ "compression", "performance", "initialization" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:talisman-import",
      name: "Import Flask-Talisman",
      prefix: "talismanimport",
      category: "extensions",
      description: "Import Flask-Talisman for HTTP security headers.",
      body: [
        "from flask_talisman import Talisman"
      ],
      tags: [ "security", "headers", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:talisman-config",
      name: "Configure Flask-Talisman",
      prefix: "talismanconfig",
      category: "extensions",
      description: "Configure HTTP security headers and HTTPS behavior.",
      body: [
        "Talisman(",
        "    ${1:app},",
        "    force_https=${2:True},",
        "    content_security_policy=${3:None}",
        ")"
      ],
      tags: [ "security", "https", "headers" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:babel-import",
      name: "Import Flask-Babel",
      prefix: "babelimport",
      category: "extensions",
      description: "Create a Flask-Babel instance.",
      body: [
        "from flask_babel import Babel",
        "",
        "babel = Babel()"
      ],
      tags: [ "babel", "translation", "localization" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:babel-init",
      name: "Initialize Flask-Babel",
      prefix: "babelinit",
      category: "extensions",
      description: "Initialize Flask-Babel with the Flask application.",
      body: [
        "from app.extensions import babel",
        "",
        "babel.init_app(${1:app})"
      ],
      tags: [ "babel", "translation", "initialization" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:babel-translate",
      name: "Translate Text",
      prefix: "babeltranslate",
      category: "extensions",
      description: "Mark a string for translation using Flask-Babel.",
      body: [
        "from flask_babel import gettext",
        "",
        "${1:translated_text} = gettext(\"${2:Hello, world!}\")"
      ],
      tags: [ "babel", "translation", "localization" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:babel-lazy-translate",
      name: "Lazy Translate Text",
      prefix: "babellazy",
      category: "extensions",
      description: "Create a lazily evaluated translated string.",
      body: [
        "from flask_babel import lazy_gettext",
        "",
        "${1:label} = lazy_gettext(\"${2:Username}\")"
      ],
      tags: [ "babel", "translation", "lazy" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:admin-import",
      name: "Import Flask-Admin",
      prefix: "adminimport",
      category: "extensions",
      description: "Create a Flask-Admin instance.",
      body: [
        "from flask_admin import Admin",
        "",
        "admin = Admin(name=\"${1:Administration}\")"
      ],
      tags: [ "admin", "dashboard", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:admin-init",
      name: "Initialize Flask-Admin",
      prefix: "admininit",
      category: "extensions",
      description: "Initialize Flask-Admin with the Flask application.",
      body: [
        "from app.extensions import admin",
        "",
        "admin.init_app(${1:app})"
      ],
      tags: [ "admin", "dashboard", "initialization" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:admin-model-view",
      name: "Register Admin Model View",
      prefix: "adminmodelview",
      category: "extensions",
      description: "Add a SQLAlchemy model to the Flask-Admin interface.",
      body: [
        "from flask_admin.contrib.sqla import ModelView",
        "from app.extensions import admin, db",
        "from app.models import ${1:User}",
        "",
        "admin.add_view(ModelView(${1:User}, db.session))"
      ],
      tags: [ "admin", "model", "sqlalchemy" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:apscheduler-import",
      name: "Import Flask-APScheduler",
      prefix: "schedulerimport",
      category: "extensions",
      description: "Create a Flask-APScheduler instance.",
      body: [
        "from flask_apscheduler import APScheduler",
        "",
        "scheduler = APScheduler()"
      ],
      tags: [ "scheduler", "tasks", "background" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:apscheduler-init",
      name: "Initialize Flask-APScheduler",
      prefix: "schedulerinit",
      category: "extensions",
      description: "Initialize the task scheduler with the Flask application.",
      body: [
        "from app.extensions import scheduler",
        "",
        "scheduler.init_app(${1:app})",
        "scheduler.start()"
      ],
      tags: [ "scheduler", "tasks", "initialization" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:apscheduler-job",
      name: "Register Scheduled Job",
      prefix: "schedulerjob",
      category: "extensions",
      description: "Register a recurring scheduled task.",
      body: [
        "@scheduler.task(",
        "    \"interval\",",
        "    id=\"${1:cleanup_job}\",",
        "    seconds=${2:60}",
        ")",
        "def ${3:cleanup}():",
        "    ${4:print(\"Running scheduled task\")}"
      ],
      tags: [ "scheduler", "tasks", "interval" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:restful-import",
      name: "Import Flask-RESTful",
      prefix: "restfulimport",
      category: "extensions",
      description: "Create a Flask-RESTful API instance.",
      body: [
        "from flask_restful import Api",
        "",
        "api = Api()"
      ],
      tags: [ "restful", "api", "import" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:restful-init",
      name: "Initialize Flask-RESTful",
      prefix: "restfulinit",
      category: "extensions",
      description: "Attach Flask-RESTful to the Flask application.",
      body: [
        "from app.extensions import api",
        "",
        "api.init_app(${1:app})"
      ],
      tags: [ "restful", "api", "initialization" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:restful-resource",
      name: "Create RESTful Resource",
      prefix: "restfulresource",
      category: "extensions",
      description: "Create a Flask-RESTful resource with GET and POST methods.",
      body: [
        "from flask_restful import Resource",
        "",
        "class ${1:ItemResource}(Resource):",
        "    def get(self, ${2:item_id}):",
        "        return {\"id\": ${2:item_id}}",
        "",
        "    def post(self):",
        "        ${3:return {\"message\": \"Created\"}, 201}"
      ],
      tags: [ "restful", "resource", "api" ],
      scope: [ "python" ]
    },
    {
      id: "extensions:restful-add-resource",
      name: "Register RESTful Resource",
      prefix: "restfuladd",
      category: "extensions",
      description: "Register a resource class with a Flask-RESTful API.",
      body: [
        "api.add_resource(${1:ItemResource}, \"${2:/items}\")"
      ],
      tags: [ "restful", "resource", "registration" ],
      scope: [ "python" ]
    }
  ];

  const databaseSnippets = [
    // Queries
    {
      id: "database:query-all",
      name: "Query All Records",
      prefix: "queryall",
      category: "database",
      description: "Retrieve all records from a SQLAlchemy model.",
      body: [
        "${1:items} = ${2:Item}.query.all()"
      ],
      tags: [ "sqlalchemy", "query", "select" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-get",
      name: "Get Record by ID",
      prefix: "queryget",
      category: "database",
      description: "Retrieve a record by its primary key.",
      body: [
        "${1:item} = db.session.get(${2:Item}, ${3:item_id})"
      ],
      tags: [ "sqlalchemy", "query", "primary-key" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-first",
      name: "Query First Record",
      prefix: "queryfirst",
      category: "database",
      description: "Retrieve the first matching record.",
      body: [
        "${1:item} = ${2:Item}.query.filter_by(${3:name}=${4:value}).first()"
      ],
      tags: [ "sqlalchemy", "query", "filter" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-filter",
      name: "Filter Records",
      prefix: "queryfilter",
      category: "database",
      description: "Filter records using SQLAlchemy expressions.",
      body: [
        "${1:items} = ${2:Item}.query.filter(",
        "    ${2:Item}.${3:active} == ${4:True}",
        ").all()"
      ],
      tags: [ "sqlalchemy", "query", "filter" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-filter-by",
      name: "Filter by Column Values",
      prefix: "queryfilterby",
      category: "database",
      description: "Filter records using keyword arguments.",
      body: [
        "${1:items} = ${2:Item}.query.filter_by(",
        "    ${3:active}=${4:True}",
        ").all()"
      ],
      tags: [ "sqlalchemy", "query", "filter" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-order",
      name: "Order Query Results",
      prefix: "queryorder",
      category: "database",
      description: "Sort query results by a column.",
      body: [
        "${1:items} = ${2:Item}.query.order_by(",
        "    ${2:Item}.${3:created_at}.desc()",
        ").all()"
      ],
      tags: [ "sqlalchemy", "query", "sorting" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-count",
      name: "Count Records",
      prefix: "querycount",
      category: "database",
      description: "Count records matching a query.",
      body: [
        "${1:total} = ${2:Item}.query.filter_by(",
        "    ${3:active}=${4:True}",
        ").count()"
      ],
      tags: [ "sqlalchemy", "query", "count" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-exists",
      name: "Check Record Exists",
      prefix: "queryexists",
      category: "database",
      description: "Check whether a matching record exists.",
      body: [
        "${1:exists} = db.session.query(",
        "    db.session.query(${2:Item}).filter_by(",
        "        ${3:name}=${4:value}",
        "    ).exists()",
        ").scalar()"
      ],
      tags: [ "sqlalchemy", "query", "exists" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-like",
      name: "Search with LIKE",
      prefix: "querylike",
      category: "database",
      description: "Search text columns using a case-insensitive match.",
      body: [
        "${1:items} = ${2:Item}.query.filter(",
        "    ${2:Item}.${3:name}.ilike(",
        "        \"%\" + ${4:search_term} + \"%\"",
        "    )",
        ").all()"
      ],
      tags: [ "sqlalchemy", "query", "search" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-in",
      name: "Filter with IN",
      prefix: "queryin",
      category: "database",
      description: "Retrieve records whose column matches one of several values.",
      body: [
        "${1:items} = ${2:Item}.query.filter(",
        "    ${2:Item}.${3:id}.in_(${4:item_ids})",
        ").all()"
      ],
      tags: [ "sqlalchemy", "query", "filter" ],
      scope: [ "python" ]
    },
    {
      id: "database:create",
      name: "Create Database Record",
      prefix: "dbcreate",
      category: "database",
      description: "Create and save a new database record.",
      body: [
        "${1:item} = ${2:Item}(",
        "    ${3:name}=${4:name}",
        ")",
        "",
        "db.session.add(${1:item})",
        "db.session.commit()"
      ],
      tags: [ "sqlalchemy", "create", "insert" ],
      scope: [ "python" ]
    },
    {
      id: "database:update",
      name: "Update Database Record",
      prefix: "dbupdate",
      category: "database",
      description: "Update an existing database record.",
      body: [
        "${1:item} = db.session.get(${2:Item}, ${3:item_id})",
        "",
        "if ${1:item} is not None:",
        "    ${1:item}.${4:name} = ${5:new_value}",
        "    db.session.commit()"
      ],
      tags: [ "sqlalchemy", "update" ],
      scope: [ "python" ]
    },
    {
      id: "database:delete",
      name: "Delete Database Record",
      prefix: "dbdelete",
      category: "database",
      description: "Delete an existing database record.",
      body: [
        "${1:item} = db.session.get(${2:Item}, ${3:item_id})",
        "",
        "if ${1:item} is not None:",
        "    db.session.delete(${1:item})",
        "    db.session.commit()"
      ],
      tags: [ "sqlalchemy", "delete" ],
      scope: [ "python" ]
    },
    {
      id: "database:bulk-delete",
      name: "Delete Matching Records",
      prefix: "dbbulkdelete",
      category: "database",
      description: "Delete records matching a filter and return the number deleted.",
      body: [
        "${1:deleted_count} = ${2:Item}.query.filter_by(",
        "    ${3:status}=${4:'inactive'}",
        ").delete(synchronize_session=\"fetch\")",
        "",
        "db.session.commit()"
      ],
      tags: [ "sqlalchemy", "delete", "bulk" ],
      scope: [ "python" ]
    },
    {
      id: "database:pagination",
      name: "Paginate Query",
      prefix: "dbpaginate",
      category: "database",
      description: "Paginate database results using request parameters.",
      body: [
        "${1:pagination} = ${2:Item}.query.order_by(",
        "    ${2:Item}.id.desc()",
        ").paginate(",
        "    page=${3:request.args.get(\"page\", 1, type=int)},",
        "    per_page=${4:10},",
        "    error_out=False",
        ")",
        "",
        "${5:items} = ${1:pagination}.items",
        "${6:total_pages} = ${1:pagination}.pages"
      ],
      tags: [ "sqlalchemy", "pagination" ],
      scope: [ "python" ]
    },
    {
      id: "database:relationship-one-to-many",
      name: "One-to-Many Relationship",
      prefix: "dbonetomany",
      category: "database",
      description: "Define a one-to-many relationship between two models.",
      body: [
        "class ${1:Author}(db.Model):",
        "    id = db.Column(db.Integer, primary_key=True)",
        "    ${2:posts} = db.relationship(",
        "        \"${3:Post}\",",
        "        back_populates=\"${4:author}\"",
        "    )",
        "",
        "class ${3:Post}(db.Model):",
        "    id = db.Column(db.Integer, primary_key=True)",
        "    ${5:author_id} = db.Column(",
        "        db.Integer,",
        "        db.ForeignKey(\"${6:author.id}\"),",
        "        nullable=False",
        "    )",
        "    ${4:author} = db.relationship(",
        "        \"${1:Author}\",",
        "        back_populates=\"${2:posts}\"",
        "    )"
      ],
      tags: [ "sqlalchemy", "relationship", "one-to-many" ],
      scope: [ "python" ]
    },
    {
      id: "database:relationship-many-to-many",
      name: "Many-to-Many Relationship",
      prefix: "dbmanytomany",
      category: "database",
      description: "Create a many-to-many relationship using an association table.",
      body: [
        "${1:association_table} = db.Table(",
        "    \"${2:user_roles}\",",
        "    db.metadata,",
        "    db.Column(\"${3:user_id}\", db.ForeignKey(\"${4:user.id}\"), primary_key=True),",
        "    db.Column(\"${5:role_id}\", db.ForeignKey(\"${6:role.id}\"), primary_key=True)",
        ")",
        "",
        "class ${7:User}(db.Model):",
        "    id = db.Column(db.Integer, primary_key=True)",
        "    ${8:roles} = db.relationship(",
        "        \"${9:Role}\",",
        "        secondary=${1:association_table},",
        "        back_populates=\"${10:users}\"",
        "    )",
        "",
        "class ${9:Role}(db.Model):",
        "    id = db.Column(db.Integer, primary_key=True)",
        "    ${10:users} = db.relationship(",
        "        \"${7:User}\",",
        "        secondary=${1:association_table},",
        "        back_populates=\"${8:roles}\"",
        "    )"
      ],
      tags: [ "sqlalchemy", "relationship", "many-to-many" ],
      scope: [ "python" ]
    },
    {
      id: "database:serialize-dict",
      name: "Serialize Model to Dictionary",
      prefix: "dbtodict",
      category: "database",
      description: "Define a to_dict method inside a model to serialize selected fields.",
      body: [
        "def ${1:to_dict}(self):",
        "    return {",
        "        \"id\": self.id,",
        "        \"${2:name}\": self.${2:name}",
        "    }"
      ],
      tags: [ "sqlalchemy", "serialization", "dictionary" ],
      scope: [ "python" ]
    },
    {
      id: "database:serialize-list",
      name: "Serialize Query Results",
      prefix: "dbserialize",
      category: "database",
      description: "Convert model instances into dictionaries using an existing to_dict() method.",
      body: [
        "${1:data} = [",
        "    item.to_dict()",
        "    for item in ${2:items}",
        "]"
      ],
      tags: [ "sqlalchemy", "serialization", "dictionary" ],
      scope: [ "python" ]
    },
    {
      id: "database:transaction",
      name: "Safe Database Transaction",
      prefix: "dbsafecommit",
      category: "database",
      description: "Commit a transaction or roll it back when an exception occurs.",
      body: [
        "try:",
        "    ${1:db.session.add(instance)}",
        "    db.session.commit()",
        "except Exception:",
        "    db.session.rollback()",
        "    raise"
      ],
      tags: [ "sqlalchemy", "transaction", "rollback" ],
      scope: [ "python" ]
    },
    {
      id: "database:select-session",
      name: "SQLAlchemy Select Query",
      prefix: "dbselect",
      category: "database",
      description: "Build a query using SQLAlchemy's select statement.",
      body: [
        "from sqlalchemy import select",
        "",
        "${1:statement} = select(${2:Item}).where(",
        "    ${2:Item}.${3:active}.is_(True)",
        ")",
        "${4:items} = db.session.scalars(${1:statement}).all()"
      ],
      tags: [ "sqlalchemy", "select", "query" ],
      scope: [ "python" ]
    },
    {
      id: "database:join",
      name: "Join Related Models",
      prefix: "dbjoin",
      category: "database",
      description: "Query records using a SQLAlchemy join.",
      body: [
        "${1:results} = db.session.query(${2:User}, ${3:Post}).join(",
        "    ${3:Post},",
        "    ${3:Post}.${4:user_id} == ${2:User}.id",
        ").all()"
      ],
      tags: [ "sqlalchemy", "join", "query" ],
      scope: [ "python" ]
    },
    {
      id: "database:group-by",
      name: "Group Query Results",
      prefix: "dbgroupby",
      category: "database",
      description: "Group and count records using SQLAlchemy.",
      body: [
        "from sqlalchemy import func",
        "",
        "${1:results} = db.session.query(",
        "    ${2:Item}.${3:status},",
        "    func.count(${2:Item}.id)",
        ").group_by(${2:Item}.${3:status}).all()"
      ],
      tags: [ "sqlalchemy", "group-by", "aggregation" ],
      scope: [ "python" ]
    },

    // Dictionary conversion
    {
      id: "database:from-dict",
      name: "Create Model From Dictionary",
      prefix: "dbfromdict",
      category: "database",
      description: "Create a model instance from a dictionary of allowed fields.",
      body: [
        "@classmethod",
        "def ${1:from_dict}(cls, data):",
        "    return cls(",
        "        ${2:name}=data.get('${2:name}'),",
        "        ${3:description}=data.get('${3:description}')",
        "    )"
      ],
      tags: [ "sqlalchemy", "dictionary", "serialization", "model" ],
      scope: [ "python" ]
    },
    {
      id: "database:update-from-dict",
      name: "Update Model From Dictionary",
      prefix: "dbupdatefromdict",
      category: "database",
      description: "Update selected model attributes from a dictionary using an explicit allowlist.",
      body: [
        "def ${1:update_from_dict}(self, data):",
        "    allowed_fields = { '${2:name}', '${3:description}' }",
        "",
        "    for key, value in data.items():",
        "        if key in allowed_fields:",
        "            setattr(self, key, value)"
      ],
      tags: [ "sqlalchemy", "dictionary", "update", "model" ],
      scope: [ "python" ]
    },
    {
      id: "database:serialize-dict-fields",
      name: "Serialize Selected Model Fields",
      prefix: "dbtodictfields",
      category: "database",
      description: "Serialize selected model attributes into a dictionary.",
      body: [
        "def ${1:to_dict}(self):",
        "    return {",
        "        '${2:name}': self.${2:name},",
        "        '${3:description}': self.${3:description}",
        "    }"
      ],
      tags: [ "sqlalchemy", "serialization", "dictionary" ],
      scope: [ "python" ]
    },

    // Advanced queries
    {
      id: "database:query-limit",
      name: "Limit Query Results",
      prefix: "querylimit",
      category: "database",
      description: "Limit the number of records returned by a query.",
      body: [
        "${1:items} = ${2:Item}.query.limit(${3:10}).all()"
      ],
      tags: [ "sqlalchemy", "query", "limit" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-offset",
      name: "Offset Query Results",
      prefix: "queryoffset",
      category: "database",
      description: "Skip a number of records before returning query results.",
      body: [
        "${1:items} = ${2:Item}.query.offset(${3:10}).all()"
      ],
      tags: [ "sqlalchemy", "query", "offset" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-distinct",
      name: "Get Distinct Values",
      prefix: "querydistinct",
      category: "database",
      description: "Retrieve unique values from a database column.",
      body: [
        "${1:values} = db.session.query(",
        "    ${2:Item}.${3:category}",
        ").distinct().all()"
      ],
      tags: [ "sqlalchemy", "query", "distinct" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-between",
      name: "Filter Between Values",
      prefix: "querybetween",
      category: "database",
      description: "Retrieve records where a column falls within a range.",
      body: [
        "${1:items} = ${2:Item}.query.filter(",
        "    ${2:Item}.${3:price}.between(${4:minimum}, ${5:maximum})",
        ").all()"
      ],
      tags: [ "sqlalchemy", "query", "range" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-null",
      name: "Filter NULL Values",
      prefix: "querynull",
      category: "database",
      description: "Find records where a column has a NULL value.",
      body: [
        "${1:items} = ${2:Item}.query.filter(",
        "    ${2:Item}.${3:deleted_at}.is_(None)",
        ").all()"
      ],
      tags: [ "sqlalchemy", "query", "null" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-not-null",
      name: "Filter Non-NULL Values",
      prefix: "querynotnull",
      category: "database",
      description: "Find records where a column is not NULL.",
      body: [
        "${1:items} = ${2:Item}.query.filter(",
        "    ${2:Item}.${3:deleted_at}.is_not(None)",
        ").all()"
      ],
      tags: [ "sqlalchemy", "query", "null" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-or",
      name: "Query With OR Conditions",
      prefix: "queryor",
      category: "database",
      description: "Match records satisfying at least one condition.",
      body: [
        "from sqlalchemy import or_",
        "",
        "${1:items} = ${2:Item}.query.filter(",
        "    or_(",
        "        ${2:Item}.${3:status} == '${4:pending}',",
        "        ${2:Item}.${5:status} == '${6:active}'",
        "    )",
        ").all()"
      ],
      tags: [ "sqlalchemy", "query", "or" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-and",
      name: "Query With AND Conditions",
      prefix: "queryand",
      category: "database",
      description: "Match records satisfying multiple conditions.",
      body: [
        "from sqlalchemy import and_",
        "",
        "${1:items} = ${2:Item}.query.filter(",
        "    and_(",
        "        ${2:Item}.${3:active}.is_(True),",
        "        ${2:Item}.${4:price} > ${5:0}",
        "    )",
        ").all()"
      ],
      tags: [ "sqlalchemy", "query", "and" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-first-or-404",
      name: "Get First Record or 404",
      prefix: "queryfirst404",
      category: "database",
      description: "Retrieve the first matching record or return HTTP 404.",
      body: [
        "${1:item} = ${2:Item}.query.filter_by(",
        "    ${3:slug}=${4:slug}",
        ").first_or_404()"
      ],
      tags: [ "sqlalchemy", "query", "404" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-get-or-404",
      name: "Get Record by ID or 404",
      prefix: "queryget404",
      category: "database",
      description: "Retrieve a record by primary key or return HTTP 404.",
      body: [
        "${1:item} = db.get_or_404(${2:Item}, ${3:item_id})"
      ],
      tags: [ "sqlalchemy", "query", "404" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-sum",
      name: "Calculate Column Sum",
      prefix: "querysum",
      category: "database",
      description: "Calculate the sum of a numeric database column.",
      body: [
        "from sqlalchemy import func",
        "",
        "${1:total} = db.session.query(",
        "    func.sum(${2:Item}.${3:price})",
        ").scalar() or 0"
      ],
      tags: [ "sqlalchemy", "aggregation", "sum" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-average",
      name: "Calculate Column Average",
      prefix: "queryaverage",
      category: "database",
      description: "Calculate the average of a numeric database column.",
      body: [
        "from sqlalchemy import func",
        "",
        "${1:average} = db.session.query(",
        "    func.avg(${2:Item}.${3:price})",
        ").scalar()"
      ],
      tags: [ "sqlalchemy", "aggregation", "average" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-max",
      name: "Get Maximum Column Value",
      prefix: "querymax",
      category: "database",
      description: "Retrieve the maximum value from a database column.",
      body: [
        "from sqlalchemy import func",
        "",
        "${1:maximum} = db.session.query(",
        "    func.max(${2:Item}.${3:price})",
        ").scalar()"
      ],
      tags: [ "sqlalchemy", "aggregation", "maximum" ],
      scope: [ "python" ]
    },
    {
      id: "database:query-min",
      name: "Get Minimum Column Value",
      prefix: "querymin",
      category: "database",
      description: "Retrieve the minimum value from a database column.",
      body: [
        "from sqlalchemy import func",
        "",
        "${1:minimum} = db.session.query(",
        "    func.min(${2:Item}.${3:price})",
        ").scalar()"
      ],
      tags: [ "sqlalchemy", "aggregation", "minimum" ],
      scope: [ "python" ]
    },

    // Database session operations
    {
      id: "database:session-flush",
      name: "Flush Database Session",
      prefix: "dbflush",
      category: "database",
      description: "Send pending changes to the database without committing the transaction.",
      body: [
        "db.session.flush()"
      ],
      tags: [ "sqlalchemy", "session", "flush" ],
      scope: [ "python" ]
    },
    {
      id: "database:session-refresh",
      name: "Refresh Database Object",
      prefix: "dbrefresh",
      category: "database",
      description: "Reload an object's attributes from the database.",
      body: [
        "db.session.refresh(${1:item})"
      ],
      tags: [ "sqlalchemy", "session", "refresh" ],
      scope: [ "python" ]
    },
    {
      id: "database:session-rollback",
      name: "Rollback Database Session",
      prefix: "dbrollback",
      category: "database",
      description: "Undo uncommitted changes in the current database transaction.",
      body: [
        "db.session.rollback()"
      ],
      tags: [ "sqlalchemy", "session", "rollback" ],
      scope: [ "python" ]
    },
    {
      id: "database:session-commit",
      name: "Commit Database Session",
      prefix: "dbcommit",
      category: "database",
      description: "Commit pending changes in the current database transaction.",
      body: [
        "db.session.commit()"
      ],
      tags: [ "sqlalchemy", "session", "commit" ],
      scope: [ "python" ]
    },
    {
      id: "database:session-add-all",
      name: "Add Multiple Records",
      prefix: "dbaddall",
      category: "database",
      description: "Add multiple model instances to the current session.",
      body: [
        "db.session.add_all(${1:items})",
        "db.session.commit()"
      ],
      tags: [ "sqlalchemy", "session", "bulk", "insert" ],
      scope: [ "python" ]
    },
    {
      id: "database:session-delete",
      name: "Delete Database Object",
      prefix: "dbsessiondelete",
      category: "database",
      description: "Mark a model instance for deletion.",
      body: [
        "db.session.delete(${1:item})",
        "db.session.commit()"
      ],
      tags: [ "sqlalchemy", "session", "delete" ],
      scope: [ "python" ]
    },

    // Model definitions
    {
      id: "database:model-basic",
      name: "Basic SQLAlchemy Model",
      prefix: "dbmodel",
      category: "database",
      description: "Define a basic SQLAlchemy model with a primary key and columns.",
      body: [
        "class ${1:Item}(db.Model):",
        "    __tablename__ = '${2:items}'",
        "",
        "    id = db.Column(db.Integer, primary_key=True)",
        "    ${3:name} = db.Column(db.String(${4:120}), nullable=False)",
        "    ${5:description} = db.Column(db.Text, nullable=True)"
      ],
      tags: [ "sqlalchemy", "model", "table" ],
      scope: [ "python" ]
    },
    {
      id: "database:model-timestamps",
      name: "Model With Timestamps",
      prefix: "dbtimestamps",
      category: "database",
      description: "Add automatically managed creation and update timestamps to a model.",
      body: [
        "from datetime import datetime, timezone",
        "",
        "created_at = db.Column(",
        "    db.DateTime(timezone=True),",
        "    default=lambda: datetime.now(timezone.utc),",
        "    nullable=False",
        ")",
        "updated_at = db.Column(",
        "    db.DateTime(timezone=True),",
        "    default=lambda: datetime.now(timezone.utc),",
        "    onupdate=lambda: datetime.now(timezone.utc),",
        "    nullable=False",
        ")"
      ],
      tags: [ "sqlalchemy", "model", "timestamps" ],
      scope: [ "python" ]
    },
    {
      id: "database:model-unique",
      name: "Unique Model Column",
      prefix: "dbunique",
      category: "database",
      description: "Define a column whose values must be unique.",
      body: [
        "${1:email} = db.Column(",
        "    db.String(${2:255}),",
        "    unique=True,",
        "    nullable=False",
        ")"
      ],
      tags: [ "sqlalchemy", "model", "constraint", "unique" ],
      scope: [ "python" ]
    },
    {
      id: "database:model-index",
      name: "Indexed Model Column",
      prefix: "dbindex",
      category: "database",
      description: "Create a database index for a frequently queried column.",
      body: [
        "${1:email} = db.Column(",
        "    db.String(${2:255}),",
        "    index=True,",
        "    nullable=False",
        ")"
      ],
      tags: [ "sqlalchemy", "model", "index" ],
      scope: [ "python" ]
    },
    {
      id: "database:model-default",
      name: "Column With Default Value",
      prefix: "dbdefault",
      category: "database",
      description: "Define a column with a Python-side default value.",
      body: [
        "${1:is_active} = db.Column(",
        "    db.Boolean,",
        "    default=${2:True},",
        "    nullable=False",
        ")"
      ],
      tags: [ "sqlalchemy", "model", "default" ],
      scope: [ "python" ]
    },
    {
      id: "database:model-foreign-key",
      name: "Foreign Key Column",
      prefix: "dbforeignkey",
      category: "database",
      description: "Define a foreign key column referencing another table.",
      body: [
        "${1:user_id} = db.Column(",
        "    db.Integer,",
        "    db.ForeignKey('${2:user.id}'),",
        "    nullable=False",
        ")"
      ],
      tags: [ "sqlalchemy", "model", "foreign-key" ],
      scope: [ "python" ]
    },
    {
      id: "database:model-composite-index",
      name: "Composite Model Index",
      prefix: "dbcompositeindex",
      category: "database",
      description: "Create a composite index across multiple model columns.",
      body: [
        "__table_args__ = (",
        "    db.Index(",
        "        '${1:ix_items_status_created}',",
        "        '${2:status}',",
        "        '${3:created_at}'",
        "    ),",
        ")"
      ],
      tags: [ "sqlalchemy", "model", "index", "composite" ],
      scope: [ "python" ]
    },
    {
      id: "database:model-check-constraint",
      name: "Model Check Constraint",
      prefix: "dbcheckconstraint",
      category: "database",
      description: "Add a database-level check constraint to a model.",
      body: [
        "__table_args__ = (",
        "    db.CheckConstraint(",
        "        '${1:price >= 0}',",
        "        name='${2:check_price_nonnegative}'",
        "    ),",
        ")"
      ],
      tags: [ "sqlalchemy", "model", "constraint" ],
      scope: [ "python" ]
    },
    {
      id: "database:model-enum",
      name: "Enum Model Column",
      prefix: "dbenum",
      category: "database",
      description: "Define a column using a Python enum.",
      body: [
        "import enum",
        "",
        "class ${1:Status}(enum.Enum):",
        "    ${2:PENDING} = '${3:pending}'",
        "    ${4:ACTIVE} = '${5:active}'",
        "    ${6:INACTIVE} = '${7:inactive}'",
        "",
        "${8:status} = db.Column(",
        "    db.Enum(${1:Status}),",
        "    nullable=False,",
        "    default=${1:Status}.${2:PENDING}",
        ")"
      ],
      tags: [ "sqlalchemy", "model", "enum" ],
      scope: [ "python" ]
    },

    // Relationships
    {
      id: "database:relationship-one-to-one",
      name: "One-to-One Relationship",
      prefix: "dbonetoone",
      category: "database",
      description: "Define a one-to-one relationship using uselist=False.",
      body: [
        "class ${1:User}(db.Model):",
        "    id = db.Column(db.Integer, primary_key=True)",
        "    ${2:profile} = db.relationship(",
        "        '${3:Profile}',",
        "        back_populates='${4:user}',",
        "        uselist=False",
        "    )",
        "",
        "class ${3:Profile}(db.Model):",
        "    id = db.Column(db.Integer, primary_key=True)",
        "    ${5:user_id} = db.Column(",
        "        db.Integer,",
        "        db.ForeignKey('${6:user.id}'),",
        "        unique=True",
        "    )",
        "    ${4:user} = db.relationship(",
        "        '${1:User}',",
        "        back_populates='${2:profile}'",
        "    )"
      ],
      tags: [ "sqlalchemy", "relationship", "one-to-one" ],
      scope: [ "python" ]
    },
    {
      id: "database:relationship-backref",
      name: "Relationship With Backref",
      prefix: "dbbackref",
      category: "database",
      description: "Define a relationship that creates a reverse attribute automatically.",
      body: [
        "${1:posts} = db.relationship(",
        "    '${2:Post}',",
        "    backref='${3:author}',",
        "    lazy=True",
        ")"
      ],
      tags: [ "sqlalchemy", "relationship", "backref" ],
      scope: [ "python" ]
    },
    {
      id: "database:relationship-cascade",
      name: "Relationship With Cascade",
      prefix: "dbcascade",
      category: "database",
      description: "Configure cascading operations for related model objects.",
      body: [
        "${1:posts} = db.relationship(",
        "    '${2:Post}',",
        "    back_populates='${3:author}',",
        "    cascade='all, delete-orphan'",
        ")"
      ],
      tags: [ "sqlalchemy", "relationship", "cascade" ],
      scope: [ "python" ]
    },

    // Raw SQL and database utilities
    {
      id: "database:raw-sql",
      name: "Execute Raw SQL",
      prefix: "dbrawsql",
      category: "database",
      description: "Execute a parameterized SQL statement using SQLAlchemy.",
      body: [
        "from sqlalchemy import text",
        "",
        "${1:result} = db.session.execute(",
        "    text('${2:SELECT * FROM items WHERE id = :item_id}'),",
        "    { '${3:item_id}': ${4:item_id} }",
        ")"
      ],
      tags: [ "sqlalchemy", "sql", "execute" ],
      scope: [ "python" ]
    },
    {
      id: "database:raw-sql-fetch",
      name: "Fetch Raw SQL Results",
      prefix: "dbrawfetch",
      category: "database",
      description: "Execute SQL and fetch all returned rows.",
      body: [
        "from sqlalchemy import text",
        "",
        "${1:rows} = db.session.execute(",
        "    text('${2:SELECT * FROM items}')",
        ").mappings().all()"
      ],
      tags: [ "sqlalchemy", "sql", "fetch" ],
      scope: [ "python" ]
    },
    {
      id: "database:create-all",
      name: "Create Database Tables",
      prefix: "dbcreateall",
      category: "database",
      description: "Create all tables registered in SQLAlchemy metadata. Mainly for development and tests.",
      body: [
        "with app.app_context():",
        "    db.create_all()"
      ],
      tags: [ "sqlalchemy", "database", "tables" ],
      scope: [ "python" ]
    },
    {
      id: "database:drop-all",
      name: "Drop All Database Tables",
      prefix: "dbdropall",
      category: "database",
      description: "Drop all registered tables. Destructive operation intended only for disposable development databases.",
      body: [
        "with app.app_context():",
        "    db.drop_all()"
      ],
      tags: [ "sqlalchemy", "database", "tables" ],
      scope: [ "python" ]
    },
    {
      id: "database:database-inspect",
      name: "Inspect Database Tables",
      prefix: "dbinspect",
      category: "database",
      description: "Inspect available database table names using SQLAlchemy's inspector.",
      body: [
        "from sqlalchemy import inspect",
        "",
        "${1:inspector} = inspect(db.engine)",
        "${2:tables} = ${1:inspector}.get_table_names()"
      ],
      tags: [ "sqlalchemy", "database", "inspect" ],
      scope: [ "python" ]
    }
  ];

  const authenticationSnippets = [
    {
      id: "authentication:password-hash",
      name: "Hash Password",
      prefix: "passwordhash",
      category: "authentication",
      description: "Generate a secure password hash using Werkzeug.",
      body: [
        "from werkzeug.security import generate_password_hash",
        "",
        "${1:password_hash} = generate_password_hash(${2:password})"
      ],
      tags: [ "password", "security", "hashing" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:password-check",
      name: "Verify Password",
      prefix: "passwordcheck",
      category: "authentication",
      description: "Verify a password against its stored hash.",
      body: [
        "from werkzeug.security import check_password_hash",
        "",
        "if check_password_hash(${1:user.password_hash}, ${2:password}):",
        "    ${3:pass}"
      ],
      tags: [ "password", "security", "verification" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:register-user",
      name: "Register User",
      prefix: "registeruser",
      category: "authentication",
      description: "Create a user account with a securely hashed password.",
      body: [
        "from werkzeug.security import generate_password_hash",
        "from app.extensions import db",
        "from app.models import ${1:User}",
        "",
        "user = ${1:User}(",
        "    username=${2:username},",
        "    email=${3:email},",
        "    password_hash=generate_password_hash(${4:password})",
        ")",
        "",
        "db.session.add(user)",
        "db.session.commit()"
      ],
      tags: [ "registration", "password", "database" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:login-user",
      name: "Authenticate User",
      prefix: "authenticateuser",
      category: "authentication",
      description: "Find a user and verify their password inside a reusable function.",
      body: [
        "from werkzeug.security import check_password_hash",
        "from app.models import ${1:User}",
        "",
        "def ${2:authenticate_user}(email, password):",
        "    user = ${1:User}.query.filter_by(email=email).first()",
        "",
        "    if user and check_password_hash(user.password_hash, password):",
        "        return user",
        "",
        "    return None"
      ],
      tags: [ "login", "authentication", "password" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:login-route",
      name: "Login Route",
      prefix: "loginroute",
      category: "authentication",
      description: "Authenticate a user and create a Flask-Login session.",
      body: [
        "from flask import request, redirect, url_for, flash, render_template",
        "from flask_login import login_user",
        "from werkzeug.security import check_password_hash",
        "from app.models import ${1:User}",
        "",
        "@${2:auth_bp}.route(\"${3:/login}\", methods=[\"GET\", \"POST\"])",
        "def ${4:login}():",
        "    if request.method == \"POST\":",
        "        email = request.form.get(\"email\", \"\")",
        "        password = request.form.get(\"password\", \"\")",
        "        user = ${1:User}.query.filter_by(email=email).first()",
        "",
        "        if user and check_password_hash(user.password_hash, password):",
        "            login_user(user)",
        "            return redirect(url_for(\"${5:main.index}\"))",
        "",
        "        flash(\"Invalid email or password.\", \"error\")",
        "",
        "    return render_template(\"${6:auth/login.html}\")"
      ],
      tags: [ "login", "authentication", "route" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:logout-route",
      name: "Logout Route",
      prefix: "logoutroute",
      category: "authentication",
      description: "Log out the current user and redirect them.",
      body: [
        "from flask import redirect, url_for",
        "from flask_login import login_required, logout_user",
        "",
        "@${1:auth_bp}.route(\"${2:/logout}\")",
        "@login_required",
        "def ${3:logout}():",
        "    logout_user()",
        "    return redirect(url_for(\"${4:auth.login}\"))"
      ],
      tags: [ "logout", "authentication", "route" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:user-loader",
      name: "Load User by ID",
      prefix: "authuserloader",
      category: "authentication",
      description: "Register a Flask-Login user loader callback. The ID type must match your user model's primary key.",
      body: [
        "from app.extensions import login_manager, db",
        "from app.models import ${1:User}",
        "",
        "@login_manager.user_loader",
        "def load_user(user_id):",
        "    return db.session.get(${1:User}, user_id)"
      ],
      tags: [ "login", "user-loader", "authentication" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:current-user",
      name: "Access Current User",
      prefix: "currentuser",
      category: "authentication",
      description: "Access the currently authenticated user.",
      body: [
        "from flask_login import current_user",
        "",
        "if current_user.is_authenticated:",
        "    ${1:username} = current_user.username"
      ],
      tags: [ "login", "current-user", "authentication" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:login-required",
      name: "Protect Route",
      prefix: "authrequired",
      category: "authentication",
      description: "Require authentication before allowing access to a route.",
      body: [
        "from flask import render_template",
        "from flask_login import login_required",
        "",
        "@${1:bp}.route(\"${2:/profile}\")",
        "@login_required",
        "def ${3:profile}():",
        "    return render_template(\"${4:profile.html}\")"
      ],
      tags: [ "login", "authorization", "protection" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:role-decorator",
      name: "Role Required Decorator",
      prefix: "rolerequired",
      category: "authentication",
      description: "Create a decorator that restricts access by user role. Requires a role attribute on your user model.",
      body: [
        "from functools import wraps",
        "from flask import abort",
        "from flask_login import current_user",
        "",
        "def ${1:role_required}(role):",
        "    def decorator(view):",
        "        @wraps(view)",
        "        def wrapped_view(*args, **kwargs):",
        "            if not current_user.is_authenticated:",
        "                abort(401)",
        "",
        "            if current_user.role != role:",
        "                abort(403)",
        "",
        "            return view(*args, **kwargs)",
        "",
        "        return wrapped_view",
        "",
        "    return decorator"
      ],
      tags: [ "roles", "authorization", "decorator" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:admin-required",
      name: "Admin Required Decorator",
      prefix: "adminrequired",
      category: "authentication",
      description: "Restrict a route to authenticated administrators. Requires a role attribute on your user model.",
      body: [
        "from functools import wraps",
        "from flask import abort",
        "from flask_login import current_user",
        "",
        "def ${1:admin_required}(view):",
        "    @wraps(view)",
        "    def wrapped_view(*args, **kwargs):",
        "        if not current_user.is_authenticated:",
        "            abort(401)",
        "",
        "        if current_user.role != \"${2:admin}\":",
        "            abort(403)",
        "",
        "        return view(*args, **kwargs)",
        "",
        "    return wrapped_view"
      ],
      tags: [ "admin", "roles", "authorization", "decorator" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:permission-decorator",
      name: "Permission Required Decorator",
      prefix: "permissionrequired",
      category: "authentication",
      description: "Restrict access based on a named user permission. Requires a has_permission() method on your user model.",
      body: [
        "from functools import wraps",
        "from flask import abort",
        "from flask_login import current_user",
        "",
        "def ${1:permission_required}(permission):",
        "    def decorator(view):",
        "        @wraps(view)",
        "        def wrapped_view(*args, **kwargs):",
        "            if not current_user.is_authenticated:",
        "                abort(401)",
        "",
        "            if not current_user.has_permission(permission):",
        "                abort(403)",
        "",
        "            return view(*args, **kwargs)",
        "",
        "        return wrapped_view",
        "",
        "    return decorator"
      ],
      tags: [ "permissions", "authorization", "decorator" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:password-change",
      name: "Change Password",
      prefix: "passwordchange",
      category: "authentication",
      description: "Verify the current password before saving a new password hash.",
      body: [
        "from werkzeug.security import generate_password_hash, check_password_hash",
        "from app.extensions import db",
        "",
        "if check_password_hash(${1:user}.password_hash, ${2:current_password}):",
        "    ${1:user}.password_hash = generate_password_hash(${3:new_password})",
        "    db.session.commit()",
        "else:",
        "    ${4:raise ValueError(\"Current password is incorrect\")}"
      ],
      tags: [ "password", "security", "update" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:logout-all",
      name: "Clear Login Session",
      prefix: "clearsession",
      category: "authentication",
      description: "Log out the current user and clear the Flask session.",
      body: [
        "from flask import session",
        "from flask_login import logout_user",
        "",
        "logout_user()",
        "session.clear()"
      ],
      tags: [ "logout", "session", "authentication" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:anonymous-check",
      name: "Check Authentication Status",
      prefix: "isauthenticated",
      category: "authentication",
      description: "Check whether the current user is authenticated.",
      body: [
        "from flask_login import current_user",
        "",
        "if current_user.is_authenticated:",
        "    ${1:pass}",
        "else:",
        "    ${2:pass}"
      ],
      tags: [ "login", "authentication", "condition" ],
      scope: [ "python" ]
    },

    // Flask-Login configuration
    {
      id: "authentication:login-manager-config",
      name: "Configure Login Manager",
      prefix: "loginmanagerconfig",
      category: "authentication",
      description: "Configure the Flask-Login manager and its login view.",
      body: [
        "login_manager.login_view = '${1:auth.login}'",
        "login_manager.login_message = '${2:Please log in to access this page.}'",
        "login_manager.login_message_category = '${3:info}'"
      ],
      tags: [ "flask-login", "configuration", "login" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:login-manager-init",
      name: "Initialize Login Manager",
      prefix: "loginmanagerinit",
      category: "authentication",
      description: "Initialize Flask-Login with the Flask application.",
      body: [
        "from flask_login import LoginManager",
        "",
        "login_manager = LoginManager()",
        "",
        "def init_login_manager(app):",
        "    login_manager.init_app(app)"
      ],
      tags: [ "flask-login", "initialization", "factory" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:unauthorized-handler",
      name: "Unauthorized Handler",
      prefix: "unauthorizedhandler",
      category: "authentication",
      description: "Customize the response when an unauthenticated user accesses a protected route.",
      body: [
        "from flask import redirect, url_for, request",
        "",
        "@login_manager.unauthorized_handler",
        "def handle_unauthorized():",
        "    return redirect(url_for('${1:auth.login}'))"
      ],
      tags: [ "flask-login", "unauthorized", "handler" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:needs-refresh-handler",
      name: "Needs Refresh Handler",
      prefix: "needsrefreshhandler",
      category: "authentication",
      description: "Customize the response when a fresh login is required.",
      body: [
        "from flask import redirect, url_for",
        "",
        "@login_manager.needs_refresh_handler",
        "def handle_needs_refresh():",
        "    return redirect(url_for('${1:auth.reauthenticate}'))"
      ],
      tags: [ "flask-login", "session", "handler" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:session-protection",
      name: "Configure Session Protection",
      prefix: "sessionprotection",
      category: "authentication",
      description: "Enable Flask-Login session protection.",
      body: [
        "login_manager.session_protection = '${1:strong}'"
      ],
      tags: [ "flask-login", "session", "security" ],
      scope: [ "python" ]
    },

    // Remember-me and fresh authentication
    {
      id: "authentication:remember-login",
      name: "Remember Me Login",
      prefix: "rememberlogin",
      category: "authentication",
      description: "Create a persistent Flask-Login session when the remember-me option is selected.",
      body: [
        "from flask_login import login_user",
        "",
        "remember = ${1:request.form.get('remember') == 'on'}",
        "login_user(${2:user}, remember=remember)"
      ],
      tags: [ "login", "remember-me", "session" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:fresh-login-required",
      name: "Require Fresh Login",
      prefix: "freshloginrequired",
      category: "authentication",
      description: "Require a recently authenticated session for sensitive operations.",
      body: [
        "from flask_login import fresh_login_required",
        "",
        "@${1:auth_bp}.route('${2:/account/security}')",
        "@fresh_login_required",
        "def ${3:security_settings}():",
        "    ${4:pass}"
      ],
      tags: [ "flask-login", "fresh-login", "security" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:confirm-login",
      name: "Confirm Fresh Login",
      prefix: "confirmlogin",
      category: "authentication",
      description: "Mark the current Flask-Login session as fresh after verifying the user's credentials.",
      body: [
        "from flask_login import confirm_login",
        "from werkzeug.security import check_password_hash",
        "",
        "if check_password_hash(${1:current_user.password_hash}, ${2:password}):",
        "    confirm_login()",
        "    ${3:return redirect(url_for('main.index'))}"
      ],
      tags: [ "flask-login", "fresh-login", "verification" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:reauthenticate-route",
      name: "Reauthentication Route",
      prefix: "reauthroute",
      category: "authentication",
      description: "Verify the current user's password and refresh their login session.",
      body: [
        "from flask import request, redirect, url_for, render_template, flash",
        "from flask_login import login_required, current_user, confirm_login",
        "from werkzeug.security import check_password_hash",
        "",
        "@${1:auth_bp}.route('${2:/reauthenticate}', methods=['GET', 'POST'])",
        "@login_required",
        "def ${3:reauthenticate}():",
        "    if request.method == 'POST':",
        "        password = request.form.get('password', '')",
        "",
        "        if check_password_hash(current_user.password_hash, password):",
        "            confirm_login()",
        "            return redirect(url_for('${4:main.index}'))",
        "",
        "        flash('Incorrect password.', 'error')",
        "",
        "    return render_template('${5:auth/reauthenticate.html}')"
      ],
      tags: [ "reauthentication", "fresh-login", "route" ],
      scope: [ "python" ]
    },

    // Password reset tokens
    {
      id: "authentication:password-reset-token-create",
      name: "Generate Password Reset Token",
      prefix: "passwordresettoken",
      category: "authentication",
      description: "Generate a time-limited signed password reset token using itsdangerous.",
      body: [
        "from itsdangerous import URLSafeTimedSerializer",
        "from flask import current_app",
        "",
        "serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])",
        "token = serializer.dumps(${1:user.id}, salt='password-reset')"
      ],
      tags: [ "password", "reset", "token", "security" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:password-reset-token-verify",
      name: "Verify Password Reset Token",
      prefix: "verifyresettoken",
      category: "authentication",
      description: "Validate a password reset token with an expiration time.",
      body: [
        "from itsdangerous import URLSafeTimedSerializer, BadSignature",
        "from flask import current_app",
        "",
        "serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])",
        "",
        "try:",
        "    user_id = serializer.loads(",
        "        ${1:token},",
        "        salt='password-reset',",
        "        max_age=${2:3600}",
        "    )",
        "except BadSignature:",
        "    user_id = None"
      ],
      tags: [ "password", "reset", "token", "verification" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:password-reset-save",
      name: "Save New Password",
      prefix: "passwordresetsave",
      category: "authentication",
      description: "Save a new password hash after validating the reset token.",
      body: [
        "from werkzeug.security import generate_password_hash",
        "from app.extensions import db",
        "",
        "${1:user}.password_hash = generate_password_hash(${2:new_password})",
        "db.session.commit()"
      ],
      tags: [ "password", "reset", "database" ],
      scope: [ "python" ]
    },

    // Email verification
    {
      id: "authentication:email-verification-token",
      name: "Generate Email Verification Token",
      prefix: "emailverifytoken",
      category: "authentication",
      description: "Generate a signed token for email address verification.",
      body: [
        "from itsdangerous import URLSafeTimedSerializer",
        "from flask import current_app",
        "",
        "serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])",
        "token = serializer.dumps(${1:user.email}, salt='email-verification')"
      ],
      tags: [ "email", "verification", "token" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:email-verification-check",
      name: "Verify Email Token",
      prefix: "checkemailtoken",
      category: "authentication",
      description: "Validate an email verification token with an expiration time.",
      body: [
        "from itsdangerous import URLSafeTimedSerializer, BadSignature",
        "from flask import current_app",
        "",
        "serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])",
        "",
        "try:",
        "    email = serializer.loads(",
        "        ${1:token},",
        "        salt='email-verification',",
        "        max_age=${2:86400}",
        "    )",
        "except BadSignature:",
        "    email = None"
      ],
      tags: [ "email", "verification", "token" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:email-mark-verified",
      name: "Mark Email as Verified",
      prefix: "markemailverified",
      category: "authentication",
      description: "Mark a user's email address as verified and save the change.",
      body: [
        "from app.extensions import db",
        "",
        "${1:user}.is_verified = True",
        "db.session.commit()"
      ],
      tags: [ "email", "verification", "database" ],
      scope: [ "python" ]
    },

    // Request-based authentication
    {
      id: "authentication:request-loader",
      name: "Flask-Login Request Loader",
      prefix: "authrequestloader",
      category: "authentication",
      description: "Load a user from an incoming request, commonly for API authentication.",
      body: [
        "from flask import request",
        "from app.models import ${1:User}",
        "",
        "@login_manager.request_loader",
        "def load_user_from_request(req):",
        "    token = req.headers.get('Authorization', '')",
        "",
        "    if not token.startswith('Bearer '):",
        "        return None",
        "",
        "    token = token.removeprefix('Bearer ')",
        "    return ${1:User}.verify_auth_token(token)"
      ],
      tags: [ "api", "request", "token", "authentication" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:token-create",
      name: "Generate Random Authentication Token",
      prefix: "authtokencreate",
      category: "authentication",
      description: "Generate a cryptographically secure random token.",
      body: [
        "import secrets",
        "",
        "${1:token} = secrets.token_urlsafe(${2:32})"
      ],
      tags: [ "token", "security", "api" ],
      scope: [ "python" ]
    },
    {
      id: "authentication:token-compare",
      name: "Compare Authentication Tokens",
      prefix: "authtokencompare",
      category: "authentication",
      description: "Compare authentication tokens using a constant-time comparison.",
      body: [
        "import secrets",
        "",
        "if secrets.compare_digest(${1:provided_token}, ${2:stored_token}):",
        "    ${3:pass}"
      ],
      tags: [ "token", "security", "comparison" ],
      scope: [ "python" ]
    }
  ];

  const jinjaSnippets = [
    {
      id: "jinja:html5",
      name: "HTML5 Template",
      prefix: "jinjahtml",
      category: "jinja",
      description: "Create a basic HTML5 page using Jinja.",
      body: [
        "<!DOCTYPE html>",
        "<html lang=\"en\">",
        "<head>",
        "    <meta charset=\"UTF-8\">",
        "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">",
        "    <title>${1:My Flask App}</title>",
        "</head>",
        "<body>",
        "    ${2:}",
        "</body>",
        "</html>"
      ],
      tags: [ "html", "template", "jinja" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:extends",
      name: "Extend Base Template",
      prefix: "jinjaextends",
      category: "jinja",
      description: "Extend a shared base template.",
      body: [
        "{% extends \"${1:base.html}\" %}",
        "",
        "{% block ${2:content} %}",
        "    ${3:}",
        "{% endblock %}"
      ],
      tags: [ "inheritance", "template" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:block",
      name: "Template Block",
      prefix: "jinjablock",
      category: "jinja",
      description: "Define a reusable template block.",
      body: [
        "{% block ${1:content} %}",
        "    ${2:}",
        "{% endblock %}"
      ],
      tags: [ "block", "inheritance" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:include",
      name: "Include Template",
      prefix: "jinjainclude",
      category: "jinja",
      description: "Include another template file.",
      body: [
        "{% include \"${1:partials/navbar.html}\" %}"
      ],
      tags: [ "include", "template" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:if",
      name: "If Statement",
      prefix: "jinjaif",
      category: "jinja",
      description: "Create a Jinja conditional.",
      body: [
        "{% if ${1:condition} %}",
        "    ${2:}",
        "{% endif %}"
      ],
      tags: [ "condition", "if" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:if-else",
      name: "If Else Statement",
      prefix: "jinjaifelse",
      category: "jinja",
      description: "Create a Jinja if-else conditional.",
      body: [
        "{% if ${1:condition} %}",
        "    ${2:}",
        "{% else %}",
        "    ${3:}",
        "{% endif %}"
      ],
      tags: [ "condition", "if", "else" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:if-elif",
      name: "If Elif Else Statement",
      prefix: "jinjaelif",
      category: "jinja",
      description: "Create a conditional with multiple branches.",
      body: [
        "{% if ${1:condition} %}",
        "    ${2:}",
        "{% elif ${3:other_condition} %}",
        "    ${4:}",
        "{% else %}",
        "    ${5:}",
        "{% endif %}"
      ],
      tags: [ "condition", "elif", "else" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:for",
      name: "For Loop",
      prefix: "jinjafor",
      category: "jinja",
      description: "Loop through a collection in a template.",
      body: [
        "{% for ${1:item} in ${2:items} %}",
        "    ${3:}",
        "{% endfor %}"
      ],
      tags: [ "loop", "for" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:for-empty",
      name: "For Loop with Empty State",
      prefix: "jinjaforempty",
      category: "jinja",
      description: "Display fallback content when a collection is empty.",
      body: [
        "{% for ${1:item} in ${2:items} %}",
        "    ${3:}",
        "{% else %}",
        "    ${4:No items found.}",
        "{% endfor %}"
      ],
      tags: [ "loop", "empty-state" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:variable",
      name: "Output Variable",
      prefix: "jinjavariable",
      category: "jinja",
      description: "Render a variable in a Jinja template.",
      body: [
        "{{ ${1:variable} }}"
      ],
      tags: [ "variable", "output" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:default-filter",
      name: "Default Filter",
      prefix: "jinjadefault",
      category: "jinja",
      description: "Provide a fallback value when a variable is undefined or false.",
      body: [
        "{{ ${1:variable}|default(\"${2:Default value}\", true) }}"
      ],
      tags: [ "filter", "default" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:length-filter",
      name: "Length Filter",
      prefix: "jinjalength",
      category: "jinja",
      description: "Get the length of a collection.",
      body: [
        "{{ ${1:items}|length }}"
      ],
      tags: [ "filter", "length" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:upper-filter",
      name: "Uppercase Filter",
      prefix: "jinjaupper",
      category: "jinja",
      description: "Convert text to uppercase.",
      body: [
        "{{ ${1:value}|upper }}"
      ],
      tags: [ "filter", "string" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:lower-filter",
      name: "Lowercase Filter",
      prefix: "jinjalower",
      category: "jinja",
      description: "Convert text to lowercase.",
      body: [
        "{{ ${1:value}|lower }}"
      ],
      tags: [ "filter", "string" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:date-filter",
      name: "Format Date",
      prefix: "jinjadate",
      category: "jinja",
      description: "Format a date value using strftime.",
      body: [
        "{{ ${1:created_at}.strftime(\"${2:%Y-%m-%d}\") }}"
      ],
      tags: [ "filter", "date", "format" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:url-for",
      name: "Generate URL",
      prefix: "jinjaurlfor",
      category: "jinja",
      description: "Generate a URL using Flask's url_for function.",
      body: [
        "{{ url_for(\"${1:main.index}\") }}"
      ],
      tags: [ "flask", "url", "navigation" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:url-for-args",
      name: "Generate URL with Arguments",
      prefix: "jinjaurlargs",
      category: "jinja",
      description: "Generate a URL with dynamic route arguments.",
      body: [
        "{{ url_for(\"${1:items.details}\", ${2:item_id}=${3:item.id}) }}"
      ],
      tags: [ "flask", "url", "arguments" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:static",
      name: "Static File URL",
      prefix: "jinjastatic",
      category: "jinja",
      description: "Generate a URL for a static asset.",
      body: [
        "{{ url_for(\"static\", filename=\"${1:css/style.css}\") }}"
      ],
      tags: [ "flask", "static", "assets" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:flash",
      name: "Display Flash Messages",
      prefix: "jinjaflash",
      category: "jinja",
      description: "Render categorized Flask flash messages.",
      body: [
        "{% with messages = get_flashed_messages(with_categories=true) %}",
        "    {% if messages %}",
        "        {% for category, message in messages %}",
        "            <div class=\"alert alert-{{ category }}\">",
        "                {{ message }}",
        "            </div>",
        "        {% endfor %}",
        "    {% endif %}",
        "{% endwith %}"
      ],
      tags: [ "flask", "flash", "messages" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:form",
      name: "HTML Form",
      prefix: "jinjaform",
      category: "jinja",
      description: "Create an HTML form with a CSRF token.",
      body: [
        "<form method=\"${1:POST}\" action=\"{{ url_for('${2:auth.login}') }}\">",
        "    <input type=\"hidden\" name=\"csrf_token\" value=\"{{ csrf_token() }}\">",
        "    ${3:}",
        "    <button type=\"submit\">${4:Submit}</button>",
        "</form>"
      ],
      tags: [ "form", "csrf", "html" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:wtf-form",
      name: "Flask-WTF Form",
      prefix: "jinjawtfform",
      category: "jinja",
      description: "Render a Flask-WTF form with field errors.",
      body: [
        "<form method=\"POST\">",
        "    {{ form.hidden_tag() }}",
        "",
        "    <div>",
        "        {{ form.${1:email}.label }}",
        "        {{ form.${1:email}(class=\"${2:form-control}\") }}",
        "        {% for error in form.${1:email}.errors %}",
        "            <small class=\"error\">{{ error }}</small>",
        "        {% endfor %}",
        "    </div>",
        "",
        "    {{ form.${3:submit}(class=\"${4:btn btn-primary}\") }}",
        "</form>"
      ],
      tags: [ "flask-wtf", "form", "validation" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:macro",
      name: "Jinja Macro",
      prefix: "jinjamacro",
      category: "jinja",
      description: "Define a reusable Jinja macro.",
      body: [
        "{% macro ${1:input_field}(field) %}",
        "    <div class=\"form-group\">",
        "        {{ field.label }}",
        "        {{ field(**kwargs) }}",
        "    </div>",
        "{% endmacro %}"
      ],
      tags: [ "macro", "reusable", "forms" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:with",
      name: "With Statement",
      prefix: "jinjawith",
      category: "jinja",
      description: "Define scoped variables inside a template.",
      body: [
        "{% with ${1:message} = ${2:\"Hello\"} %}",
        "    {{ ${1:message} }}",
        "{% endwith %}"
      ],
      tags: [ "with", "variables" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:comment",
      name: "Jinja Comment",
      prefix: "jinjacomment",
      category: "jinja",
      description: "Add a comment that is not rendered in the output.",
      body: [
        "{# ${1:Comment} #}"
      ],
      tags: [ "comment" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:autoescape",
      name: "Autoescape Block",
      prefix: "jinjaautoescape",
      category: "jinja",
      description: "Explicitly control automatic escaping. Disabling it can expose templates to XSS.",
      body: [
        "{% autoescape ${1:true} %}",
        "    ${2:}",
        "{% endautoescape %}"
      ],
      tags: [ "escaping", "security" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:for-index",
      name: "Loop Index",
      prefix: "jinjaindex",
      category: "jinja",
      description: "Access the current loop index and iteration information.",
      body: [
        "{{ loop.index }}",
        "{{ loop.index0 }}",
        "{{ loop.first }}",
        "{{ loop.last }}"
      ],
      tags: [ "loop", "index", "iteration" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:for-reversed",
      name: "Reverse Loop",
      prefix: "jinjareverse",
      category: "jinja",
      description: "Iterate over a collection in reverse order.",
      body: [
        "{% for ${1:item} in ${2:items}|reverse %}",
        "    ${3:}",
        "{% endfor %}"
      ],
      tags: [ "loop", "reverse" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:for-recursive",
      name: "Recursive Loop",
      prefix: "jinjarecursive",
      category: "jinja",
      description: "Render nested collections using a recursive loop.",
      body: [
        "{% for ${1:item} in ${2:items} recursive %}",
        "    {{ item.name }}",
        "    {% if item.children %}",
        "        <ul>{{ loop(item.children) }}</ul>",
        "    {% endif %}",
        "{% endfor %}"
      ],
      tags: [ "loop", "recursive", "nested" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:set",
      name: "Set Variable",
      prefix: "jinjaset",
      category: "jinja",
      description: "Assign a value to a template variable.",
      body: [
        "{% set ${1:total} = ${2:0} %}"
      ],
      tags: [ "variable", "assignment" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:set-capture",
      name: "Capture Block Content",
      prefix: "jinjacapture",
      category: "jinja",
      description: "Capture rendered block content into a variable.",
      body: [
        "{% set ${1:content} %}",
        "    ${2:}",
        "{% endset %}"
      ],
      tags: [ "variable", "capture", "block" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:filter-block",
      name: "Filter Block",
      prefix: "jinjafilterblock",
      category: "jinja",
      description: "Apply a filter to an entire block of content.",
      body: [
        "{% filter ${1:upper} %}",
        "    ${2:content}",
        "{% endfilter %}"
      ],
      tags: [ "filter", "block" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:apply-filter",
      name: "Apply Multiple Filters",
      prefix: "jinjafilters",
      category: "jinja",
      description: "Chain multiple filters on a value.",
      body: [
        "{{ ${1:value}|${2:trim}|${3:title} }}"
      ],
      tags: [ "filter", "chain", "format" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:escape",
      name: "Escape HTML",
      prefix: "jinjaescape",
      category: "jinja",
      description: "Escape HTML-sensitive characters in a value.",
      body: [
        "{{ ${1:value}|e }}"
      ],
      tags: [ "filter", "escape", "security" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:truncate",
      name: "Truncate Text",
      prefix: "jinjatruncate",
      category: "jinja",
      description: "Shorten text to a specified length.",
      body: [
        "{{ ${1:description}|truncate(${2:100}) }}"
      ],
      tags: [ "filter", "text", "truncate" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:join",
      name: "Join Collection",
      prefix: "jinjajoin",
      category: "jinja",
      description: "Join collection values into a single string.",
      body: [
        "{{ ${1:items}|join(\", \") }}"
      ],
      tags: [ "filter", "join", "collection" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:replace",
      name: "Replace Text",
      prefix: "jinjareplace",
      category: "jinja",
      description: "Replace occurrences of text in a string.",
      body: [
        "{{ ${1:value}|replace(\"${2:old}\", \"${3:new}\") }}"
      ],
      tags: [ "filter", "replace", "string" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:round",
      name: "Round Number",
      prefix: "jinjaround",
      category: "jinja",
      description: "Round a numeric value.",
      body: [
        "{{ ${1:price}|round(${2:2}) }}"
      ],
      tags: [ "filter", "number", "round" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:sort",
      name: "Sort Collection",
      prefix: "jinjasort",
      category: "jinja",
      description: "Sort a collection by its values or attributes.",
      body: [
        "{% for ${1:item} in ${2:items}|sort(attribute=\"${3:name}\") %}",
        "    ${4:}",
        "{% endfor %}"
      ],
      tags: [ "filter", "sort", "collection" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:selectattr",
      name: "Filter by Attribute",
      prefix: "jinjaselectattr",
      category: "jinja",
      description: "Select collection items matching an attribute test.",
      body: [
        "{% for ${1:item} in ${2:items}|selectattr(\"${3:active}\") %}",
        "    ${4:}",
        "{% endfor %}"
      ],
      tags: [ "filter", "selectattr", "collection" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:map",
      name: "Map Collection Attribute",
      prefix: "jinjamap",
      category: "jinja",
      description: "Extract an attribute from each item in a collection.",
      body: [
        "{{ ${1:items}|map(attribute=\"${2:name}\")|list }}"
      ],
      tags: [ "filter", "map", "collection" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:dict-access",
      name: "Dictionary Access",
      prefix: "jinjadict",
      category: "jinja",
      description: "Access a dictionary value by key.",
      body: [
        "{{ ${1:user}[\"${2:name}\"] }}"
      ],
      tags: [ "dictionary", "variable", "access" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:attribute-access",
      name: "Object Attribute",
      prefix: "jinjaattr",
      category: "jinja",
      description: "Access an object attribute.",
      body: [
        "{{ ${1:user}.${2:name} }}"
      ],
      tags: [ "object", "attribute", "variable" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:defined",
      name: "Check If Defined",
      prefix: "jinjadefined",
      category: "jinja",
      description: "Check whether a variable is defined.",
      body: [
        "{% if ${1:variable} is defined %}",
        "    ${2:}",
        "{% endif %}"
      ],
      tags: [ "test", "defined", "condition" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:none",
      name: "Check If None",
      prefix: "jinjanone",
      category: "jinja",
      description: "Check whether a value is none.",
      body: [
        "{% if ${1:value} is none %}",
        "    ${2:}",
        "{% endif %}"
      ],
      tags: [ "test", "none", "condition" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:even",
      name: "Check Even Number",
      prefix: "jinjaeven",
      category: "jinja",
      description: "Check whether a number is even.",
      body: [
        "{% if ${1:number} is even %}",
        "    ${2:}",
        "{% endif %}"
      ],
      tags: [ "test", "number", "condition" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:odd",
      name: "Check Odd Number",
      prefix: "jinjaodd",
      category: "jinja",
      description: "Check whether a number is odd.",
      body: [
        "{% if ${1:number} is odd %}",
        "    ${2:}",
        "{% endif %}"
      ],
      tags: [ "test", "number", "condition" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:call",
      name: "Call Macro",
      prefix: "jinjacall",
      category: "jinja",
      description: "Call a macro that accepts a caller block.",
      body: [
        "{% call ${1:render_field}(${2:field}) %}",
        "    ${3:}",
        "{% endcall %}"
      ],
      tags: [ "macro", "call", "caller" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:import",
      name: "Import Macros",
      prefix: "jinjaimport",
      category: "jinja",
      description: "Import macros from another template file.",
      body: [
        "{% from \"${1:macros.html}\" import ${2:input_field} %}"
      ],
      tags: [ "macro", "import", "template" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:import-as",
      name: "Import Macros as Namespace",
      prefix: "jinjaimportas",
      category: "jinja",
      description: "Import macros under a namespace.",
      body: [
        "{% import \"${1:macros.html}\" as ${2:forms} %}",
        "{{ ${2:forms}.${3:input_field}(${4:field}) }}"
      ],
      tags: [ "macro", "import", "namespace" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:pluralize",
      name: "Pluralize Text",
      prefix: "jinjaplural",
      category: "jinja",
      description: "Display singular or plural text based on a count.",
      body: [
        "{{ ${1:count} }} ${1:count} {% if ${1:count} == 1 %}${2:item}{% else %}${3:items}{% endif %}"
      ],
      tags: [ "condition", "plural", "count" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:csrf-hidden",
      name: "CSRF Hidden Field",
      prefix: "jinjacsrffield",
      category: "jinja",
      description: "Render a Flask-WTF CSRF hidden field.",
      body: [
        "{{ csrf_token() }}"
      ],
      tags: [ "flask", "csrf", "security" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:current-user",
      name: "Current User",
      prefix: "jinjacurrentuser",
      category: "jinja",
      description: "Render information about the authenticated Flask-Login user.",
      body: [
        "{% if current_user.is_authenticated %}",
        "    {{ current_user.${1:username} }}",
        "{% else %}",
        "    ${2:Guest}",
        "{% endif %}"
      ],
      tags: [ "flask", "login", "user" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:request-method",
      name: "Request Method",
      prefix: "jinjarequestmethod",
      category: "jinja",
      description: "Access the current request method.",
      body: [
        "{{ request.method }}"
      ],
      tags: [ "flask", "request", "method" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:request-args",
      name: "Request Query Arguments",
      prefix: "jinjarequestargs",
      category: "jinja",
      description: "Access a query parameter from the current request.",
      body: [
        "{{ request.args.get(\"${1:page}\", ${2:1}) }}"
      ],
      tags: [ "flask", "request", "query" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:request-path",
      name: "Request Path",
      prefix: "jinjarequestpath",
      category: "jinja",
      description: "Render the current request path.",
      body: [
        "{{ request.path }}"
      ],
      tags: [ "flask", "request", "path" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:config",
      name: "Application Config",
      prefix: "jinjaconfig",
      category: "jinja",
      description: "Access a Flask application configuration value.",
      body: [
        "{{ config[\"${1:SECRET_KEY}\"] }}"
      ],
      tags: [ "flask", "config", "application" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:static-css",
      name: "Stylesheet Link",
      prefix: "jinjacss",
      category: "jinja",
      description: "Include a static CSS file.",
      body: [
        "<link rel=\"stylesheet\" href=\"{{ url_for('static', filename='${1:css/style.css}') }}\">"
      ],
      tags: [ "flask", "static", "css" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:static-js",
      name: "JavaScript Script",
      prefix: "jinjajs",
      category: "jinja",
      description: "Include a static JavaScript file.",
      body: [
        "<script src=\"{{ url_for('static', filename='${1:js/script.js}') }}\" defer></script>"
      ],
      tags: [ "flask", "static", "javascript" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:static-image",
      name: "Static Image",
      prefix: "jinjaimage",
      category: "jinja",
      description: "Render an image from the static folder.",
      body: [
        "<img src=\"{{ url_for('static', filename='${1:images/photo.png}') }}\" alt=\"${2:Description}\">"
      ],
      tags: [ "flask", "static", "image" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:active-link",
      name: "Active Navigation Link",
      prefix: "jinjaactivelink",
      category: "jinja",
      description: "Apply a class when the current request endpoint matches.",
      body: [
        "<a href=\"{{ url_for('${1:main.index}') }}\"",
        "   class=\"{% if request.endpoint == '${1:main.index}' %}active{% endif %}\">",
        "    ${2:Home}",
        "</a>"
      ],
      tags: [ "flask", "navigation", "active" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:pagination",
      name: "Pagination Controls",
      prefix: "jinjapagination",
      category: "jinja",
      description: "Render previous and next links for a Flask-SQLAlchemy pagination object.",
      body: [
        "{% if ${1:pagination}.has_prev %}",
        "    <a href=\"{{ url_for('${2:main.index}', page=${1:pagination}.prev_num) }}\">Previous</a>",
        "{% endif %}",
        "",
        "{% if ${1:pagination}.has_next %}",
        "    <a href=\"{{ url_for('${2:main.index}', page=${1:pagination}.next_num) }}\">Next</a>",
        "{% endif %}"
      ],
      tags: [ "flask", "pagination", "navigation" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:pagination-pages",
      name: "Pagination Page Numbers",
      prefix: "jinjapages",
      category: "jinja",
      description: "Render page number links from a pagination object.",
      body: [
        "{% for page_num in ${1:pagination}.iter_pages() %}",
        "    {% if page_num %}",
        "        {% if page_num == ${1:pagination}.page %}",
        "            <strong>{{ page_num }}</strong>",
        "        {% else %}",
        "            <a href=\"{{ url_for('${2:main.index}', page=page_num) }}\">{{ page_num }}</a>",
        "        {% endif %}",
        "    {% else %}",
        "        <span>…</span>",
        "    {% endif %}",
        "{% endfor %}"
      ],
      tags: [ "flask", "pagination", "navigation" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:table",
      name: "Dynamic HTML Table",
      prefix: "jinjatable",
      category: "jinja",
      description: "Render a table from a collection of objects.",
      body: [
        "<table>",
        "    <thead>",
        "        <tr>",
        "            <th>${1:Name}</th>",
        "            <th>${2:Value}</th>",
        "        </tr>",
        "    </thead>",
        "    <tbody>",
        "        {% for ${3:item} in ${4:items} %}",
        "            <tr>",
        "                <td>{{ ${3:item}.${5:name} }}</td>",
        "                <td>{{ ${3:item}.${6:value} }}</td>",
        "            </tr>",
        "        {% else %}",
        "            <tr><td colspan=\"2\">${7:No records found}</td></tr>",
        "        {% endfor %}",
        "    </tbody>",
        "</table>"
      ],
      tags: [ "html", "table", "loop" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:select",
      name: "Dynamic Select Options",
      prefix: "jinjaselect",
      category: "jinja",
      description: "Render select options from a collection.",
      body: [
        "<select name=\"${1:category}\">",
        "    {% for ${2:item} in ${3:items} %}",
        "        <option value=\"{{ ${2:item}.id }}\">{{ ${2:item}.name }}</option>",
        "    {% endfor %}",
        "</select>"
      ],
      tags: [ "html", "form", "select", "loop" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:checkboxes",
      name: "Dynamic Checkboxes",
      prefix: "jinjacheckboxes",
      category: "jinja",
      description: "Render checkboxes from a collection.",
      body: [
        "{% for ${1:item} in ${2:items} %}",
        "    <label>",
        "        <input type=\"checkbox\" name=\"${3:choices}\" value=\"{{ ${1:item}.id }}\">",
        "        {{ ${1:item}.name }}",
        "    </label>",
        "{% endfor %}"
      ],
      tags: [ "html", "form", "checkbox", "loop" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:radio",
      name: "Dynamic Radio Buttons",
      prefix: "jinjaradio",
      category: "jinja",
      description: "Render radio buttons from a collection.",
      body: [
        "{% for ${1:item} in ${2:items} %}",
        "    <label>",
        "        <input type=\"radio\" name=\"${3:choice}\" value=\"{{ ${1:item}.id }}\">",
        "        {{ ${1:item}.name }}",
        "    </label>",
        "{% endfor %}"
      ],
      tags: [ "html", "form", "radio", "loop" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:checked",
      name: "Checked Form Value",
      prefix: "jinjachecked",
      category: "jinja",
      description: "Mark an option as checked when it matches the submitted value.",
      body: [
        "{% if ${1:item}.id == ${2:selected_id} %}checked{% endif %}"
      ],
      tags: [ "html", "form", "checked", "condition" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:selected",
      name: "Selected Option",
      prefix: "jinjaselected",
      category: "jinja",
      description: "Mark a select option as selected when it matches the current value.",
      body: [
        "{% if ${1:item}.id == ${2:selected_id} %}selected{% endif %}"
      ],
      tags: [ "html", "form", "selected", "condition" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:form-errors",
      name: "Display All Form Errors",
      prefix: "jinjaformerrors",
      category: "jinja",
      description: "Display validation errors for every Flask-WTF form field.",
      body: [
        "{% for field in ${1:form} %}",
        "    {% for error in field.errors %}",
        "        <div class=\"error\">",
        "            {{ field.label.text }}: {{ error }}",
        "        </div>",
        "    {% endfor %}",
        "{% endfor %}"
      ],
      tags: [ "flask-wtf", "form", "errors", "validation" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:form-field",
      name: "Reusable Form Field",
      prefix: "jinjafield",
      category: "jinja",
      description: "Render a form field with label, widget, and validation errors.",
      body: [
        "<div class=\"form-group\">",
        "    {{ ${1:field}.label }}",
        "    {{ ${1:field}(class=\"${2:form-control}\") }}",
        "    {% for error in ${1:field}.errors %}",
        "        <small class=\"error\">{{ error }}</small>",
        "    {% endfor %}",
        "</div>"
      ],
      tags: [ "flask-wtf", "form", "field", "validation" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:form-submit",
      name: "Form Submit Button",
      prefix: "jinjasubmit",
      category: "jinja",
      description: "Render a Flask-WTF submit field.",
      body: [
        "{{ ${1:form}.submit(class=\"${2:btn btn-primary}\") }}"
      ],
      tags: [ "flask-wtf", "form", "submit" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:form-hidden",
      name: "Hidden Form Field",
      prefix: "jinjahidden",
      category: "jinja",
      description: "Render a hidden Flask-WTF field.",
      body: [
        "{{ ${1:form}.${2:hidden_field}(value=\"${3:value}\") }}"
      ],
      tags: [ "flask-wtf", "form", "hidden" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:json",
      name: "Render JSON",
      prefix: "jinjajson",
      category: "jinja",
      description: "Serialize a value as JSON for embedding in a template.",
      body: [
        "{{ ${1:data}|tojson }}"
      ],
      tags: [ "filter", "json", "data" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:tojson-script",
      name: "JSON Script Data",
      prefix: "jinjajsonscript",
      category: "jinja",
      description: "Safely expose server data to JavaScript using Jinja's tojson filter.",
      body: [
        "<script>",
        "    const ${1:data} = {{ ${2:data}|tojson }};",
        "</script>"
      ],
      tags: [ "javascript", "json", "data" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:debug",
      name: "Debug Variable",
      prefix: "jinjadebug",
      category: "jinja",
      description: "Temporarily inspect a variable in rendered HTML.",
      body: [
        "<pre>{{ ${1:value}|pprint }}</pre>"
      ],
      tags: [ "debug", "filter", "development" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:spaceless",
      name: "Whitespace Control",
      prefix: "jinjawhitespace",
      category: "jinja",
      description: "Control whitespace around Jinja template tags.",
      body: [
        "{%- ${1:statement} -%}"
      ],
      tags: [ "whitespace", "syntax", "formatting" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:raw",
      name: "Raw Block",
      prefix: "jinjaraw",
      category: "jinja",
      description: "Prevent Jinja from interpreting template syntax inside a block.",
      body: [
        "{% raw %}",
        "    ${1:{{ example }}}",
        "{% endraw %}"
      ],
      tags: [ "raw", "syntax" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:verbatim",
      name: "Verbatim Template Syntax",
      prefix: "jinjaverbatim",
      category: "jinja",
      description: "Output literal template syntax inside a raw block.",
      body: [
        "{% raw %}{{ ${1:variable} }}{% endraw %}"
      ],
      tags: [ "raw", "literal", "syntax" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:cycle",
      name: "Alternate Row Classes",
      prefix: "jinjacycle",
      category: "jinja",
      description: "Alternate CSS classes while iterating over a collection.",
      body: [
        "{% for ${1:item} in ${2:items} %}",
        "    <div class=\"{{ loop.cycle('${3:odd}', '${4:even}') }}\">",
        "        {{ ${1:item} }}",
        "    </div>",
        "{% endfor %}"
      ],
      tags: [ "loop", "cycle", "html" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:changed",
      name: "Detect Changed Loop Value",
      prefix: "jinjachanged",
      category: "jinja",
      description: "Detect when a loop value changes.",
      body: [
        "{% for ${1:item} in ${2:items}|sort(attribute='${3:category}') %}",
        "    {% if loop.changed(${1:item}.${3:category}) %}",
        "        <h3>{{ ${1:item}.${3:category} }}</h3>",
        "    {% endif %}",
        "    ${4:}",
        "{% endfor %}"
      ],
      tags: [ "loop", "changed", "grouping" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:groupby",
      name: "Group Collection",
      prefix: "jinjagroupby",
      category: "jinja",
      description: "Group collection items by an attribute.",
      body: [
        "{% for ${1:group}, ${2:items} in ${3:items}|groupby('${4:category}') %}",
        "    <h3>{{ ${1:group} }}</h3>",
        "    {% for item in ${2:items} %}",
        "        {{ item.name }}",
        "    {% endfor %}",
        "{% endfor %}"
      ],
      tags: [ "filter", "groupby", "collection" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:if-expression",
      name: "Inline Conditional",
      prefix: "jinjaconditional",
      category: "jinja",
      description: "Choose a value using an inline conditional expression.",
      body: [
        "{{ '${1:Yes}' if ${2:condition} else '${3:No}' }}"
      ],
      tags: [ "condition", "inline", "expression" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:ternary-class",
      name: "Conditional CSS Class",
      prefix: "jinjaclass",
      category: "jinja",
      description: "Apply a CSS class based on a condition.",
      body: [
        "<div class=\"${1:card} {% if ${2:condition} %}${3:active}{% endif %}\">",
        "    ${4:}",
        "</div>"
      ],
      tags: [ "html", "css", "condition" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:if-in",
      name: "Membership Check",
      prefix: "jinjain",
      category: "jinja",
      description: "Check whether a value exists in a collection.",
      body: [
        "{% if ${1:value} in ${2:collection} %}",
        "    ${3:}",
        "{% endif %}"
      ],
      tags: [ "condition", "membership", "collection" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:if-not",
      name: "Negated Condition",
      prefix: "jinjanot",
      category: "jinja",
      description: "Run a block when a condition is false.",
      body: [
        "{% if not ${1:condition} %}",
        "    ${2:}",
        "{% endif %}"
      ],
      tags: [ "condition", "not", "logic" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:elif",
      name: "Else If Branch",
      prefix: "jinjaelseif",
      category: "jinja",
      description: "Add an additional conditional branch.",
      body: [
        "{% elif ${1:condition} %}",
        "    ${2:}"
      ],
      tags: [ "condition", "elif" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:with-context",
      name: "With Context Include",
      prefix: "jinjaincludecontext",
      category: "jinja",
      description: "Include a template while explicitly passing the current context.",
      body: [
        "{% include \"${1:partials/card.html}\" with context %}"
      ],
      tags: [ "include", "context", "template" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:without-context",
      name: "Include Without Context",
      prefix: "jinjaincludenocontext",
      category: "jinja",
      description: "Include a template without passing the current context.",
      body: [
        "{% include \"${1:partials/card.html}\" without context %}"
      ],
      tags: [ "include", "context", "template" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:ignore-missing",
      name: "Optional Include",
      prefix: "jinjaoptionalinclude",
      category: "jinja",
      description: "Include a template only if it exists.",
      body: [
        "{% include \"${1:partials/optional.html}\" ignore missing %}"
      ],
      tags: [ "include", "optional", "template" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:extends-scope",
      name: "Extend Template with Scoped Blocks",
      prefix: "jinjaextendscope",
      category: "jinja",
      description: "Define a block that receives the current template context.",
      body: [
        "{% block ${1:content} scoped %}",
        "    ${2:}",
        "{% endblock %}"
      ],
      tags: [ "inheritance", "block", "scope" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:super",
      name: "Parent Block Content",
      prefix: "jinjasuper",
      category: "jinja",
      description: "Render the parent template block content.",
      body: [
        "{{ super() }}"
      ],
      tags: [ "inheritance", "block", "super" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:call-config",
      name: "Flask Config Conditional",
      prefix: "jinjaconfigif",
      category: "jinja",
      description: "Render content based on a Flask configuration setting.",
      body: [
        "{% if config.get('${1:FEATURE_ENABLED}', false) %}",
        "    ${2:}",
        "{% endif %}"
      ],
      tags: [ "flask", "config", "condition" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:request-user-agent",
      name: "Request User Agent",
      prefix: "jinjauseragent",
      category: "jinja",
      description: "Access the current request user-agent string.",
      body: [
        "{{ request.user_agent.string }}"
      ],
      tags: [ "flask", "request", "user-agent" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:request-url",
      name: "Request URL",
      prefix: "jinjarequesturl",
      category: "jinja",
      description: "Render the current full request URL.",
      body: [
        "{{ request.url }}"
      ],
      tags: [ "flask", "request", "url" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:request-referrer",
      name: "Request Referrer",
      prefix: "jinjareferrer",
      category: "jinja",
      description: "Access the referring URL when available.",
      body: [
        "{{ request.referrer or '' }}"
      ],
      tags: [ "flask", "request", "referrer" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:request-json",
      name: "Request JSON Data",
      prefix: "jinjarequestjson",
      category: "jinja",
      description: "Access JSON data attached to the current request, if available.",
      body: [
        "{{ request.get_json(silent=true) }}"
      ],
      tags: [ "flask", "request", "json" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:session",
      name: "Session Value",
      prefix: "jinjasession",
      category: "jinja",
      description: "Read a value from the Flask session.",
      body: [
        "{{ session.get('${1:user_id}') }}"
      ],
      tags: [ "flask", "session", "value" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:session-if",
      name: "Session Conditional",
      prefix: "jinjasessionif",
      category: "jinja",
      description: "Render content when a session value exists.",
      body: [
        "{% if session.get('${1:user_id}') %}",
        "    ${2:}",
        "{% endif %}"
      ],
      tags: [ "flask", "session", "condition" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:flash-category",
      name: "Flash Message Category",
      prefix: "jinjaflashcategory",
      category: "jinja",
      description: "Render a flash message with its category.",
      body: [
        "{% for category, message in get_flashed_messages(with_categories=true) %}",
        "    <div class=\"alert alert-{{ category }}\" role=\"alert\">",
        "        {{ message }}",
        "    </div>",
        "{% endfor %}"
      ],
      tags: [ "flask", "flash", "category" ],
      scope: [ "html" ]
    },
    {
      id: "jinja:csrf-form",
      name: "Flask-WTF CSRF Form",
      prefix: "jinjacsrfwtf",
      category: "jinja",
      description: "Render the CSRF token using a Flask-WTF form object.",
      body: [
        "<form method=\"POST\">",
        "    {{ ${1:form}.csrf_token }}",
        "    ${2:}",
        "</form>"
      ],
      tags: [ "flask-wtf", "csrf", "form" ],
      scope: [ "html" ]
    },
  ];

  function freezeSnippet(snippet) {
    if (!snippet || typeof snippet !== "object") {
      return snippet;
    }

    if (Array.isArray(snippet.body)) {
      Object.freeze(snippet.body);
    }

    if (Array.isArray(snippet.tags)) {
      Object.freeze(snippet.tags);
    }

    if (Array.isArray(snippet.scope)) {
      Object.freeze(snippet.scope);
    }

    return Object.freeze(snippet);
  }

  function freezeSnippets(snippets) {
    for (const snippet of snippets) {
      freezeSnippet(snippet);
    }

    return Object.freeze(snippets);
  }

  Object.freeze({
    core: freezeSnippets(coreSnippets),
    architecture: freezeSnippets(architectureSnippets),
    extensions: freezeSnippets(extensionSnippets),
    database: freezeSnippets(databaseSnippets),
    authentication: freezeSnippets(authenticationSnippets),
    jinja: freezeSnippets(jinjaSnippets)
  });

  const allSnippets = Object.freeze([
    ...coreSnippets,
    ...architectureSnippets,
    ...extensionSnippets,
    ...databaseSnippets,
    ...authenticationSnippets,
    ...jinjaSnippets
  ]);

  Object.freeze([
    {
      id: "core",
      name: "Flask Core",
      description: "Application setup, routes, requests, and responses.",
      icon: "code"
    },
    {
      id: "architecture",
      name: "Architecture",
      description: "Blueprints, application factories, configuration, and extensions.",
      icon: "layers"
    },
    {
      id: "extensions",
      name: "Extensions",
      description: "Popular Flask extensions and their integrations.",
      icon: "puzzle"
    },
    {
      id: "database",
      name: "Database",
      description: "Models, queries, relationships, pagination, and transactions.",
      icon: "database"
    },
    {
      id: "authentication",
      name: "Authentication",
      description: "Login, registration, passwords, roles, and permissions.",
      icon: "shield"
    },
    {
      id: "jinja",
      name: "Jinja",
      description: "HTML templates, inheritance, expressions, and filters.",
      icon: "file-code"
    }
  ].map(metadata => Object.freeze(metadata)));

  const STORAGE_KEY = "dev.zylle.flasksnippets.custom-snippets";
  const STORAGE_VERSION = 1;

  class SnippetStorage {
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

  class CustomSnippetManager {
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

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  var SnippetFormatter_1;
  var hasRequiredSnippetFormatter;

  function requireSnippetFormatter () {
  	if (hasRequiredSnippetFormatter) return SnippetFormatter_1;
  	hasRequiredSnippetFormatter = 1;
  	const DEFAULT_INDENTATION = "4-spaces";

  	const INDENTATION_OPTIONS = {
  	  "2-spaces": "  ",
  	  "4-spaces": "    ",
  	  "8-spaces": "        ",
  	  tabs: "\t"
  	};

  	class SnippetFormatter {
  	  constructor(indentation = DEFAULT_INDENTATION) {
  	    this.setIndentation(indentation);
  	  }

  	  setIndentation(indentation) {
  	    this.indentation = Object.prototype.hasOwnProperty.call(
  	      INDENTATION_OPTIONS,
  	      indentation
  	    )
  	      ? indentation
  	      : DEFAULT_INDENTATION;

  	    this.indentUnit = INDENTATION_OPTIONS[ this.indentation ];
  	  }

  	  getIndentation() {
  	    return this.indentation;
  	  }

  	  getIndentUnit() {
  	    return this.indentUnit;
  	  }

  	  format(body) {
  	    if (Array.isArray(body)) {
  	      body = body.join("\n");
  	    }

  	    if (typeof body !== "string" || body.length === 0) {
  	      return "";
  	    }

  	    const lines = body.split("\n");

  	    const indentationLevels = lines
  	      .filter((line) => line.trim().length > 0)
  	      .map((line) => {
  	        const match = line.match(/^[ \t]*/);
  	        return this.getIndentationWidth(match ? match[ 0 ] : "");
  	      });

  	    if (indentationLevels.length === 0) {
  	      return body;
  	    }

  	    const baseIndentation = Math.min(...indentationLevels);

  	    return lines
  	      .map((line) => {
  	        if (line.trim().length === 0) {
  	          return "";
  	        }

  	        const match = line.match(/^[ \t]*/);
  	        const leadingWhitespace = match ? match[ 0 ] : "";
  	        const content = line.slice(leadingWhitespace.length);

  	        const indentationWidth = this.getIndentationWidth(
  	          leadingWhitespace
  	        );

  	        const relativeIndentation = Math.max(
  	          0,
  	          indentationWidth - baseIndentation
  	        );

  	        const levels = this.getIndentationLevels(
  	          relativeIndentation
  	        );

  	        return this.indentUnit.repeat(levels) + content;
  	      })
  	      .join("\n");
  	  }

  	  getIndentationWidth(whitespace) {
  	    let width = 0;

  	    for (const character of whitespace) {
  	      if (character === "\t") {
  	        width += 4;
  	      } else {
  	        width += 1;
  	      }
  	    }

  	    return width;
  	  }

  	  getIndentationLevels(width) {
  	    return Math.round(width / 4);
  	  }
  	}

  	SnippetFormatter_1 = SnippetFormatter;
  	return SnippetFormatter_1;
  }

  var SnippetFormatterExports = /*@__PURE__*/ requireSnippetFormatter();
  var SnippetFormatter = /*@__PURE__*/getDefaultExportFromCjs(SnippetFormatterExports);

  const COMMAND_NAME = "flaskSnippetsExpand";

  const DEFAULT_INDENTATION$3 = "4-spaces";

  const VALID_INDENTATIONS$5 = new Set([
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

  class AceSnippetAdapter {
    constructor({
      registry,
      logger = null,
      indentation = DEFAULT_INDENTATION$3
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

      if (!VALID_INDENTATIONS$5.has(value)) {
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

  const DEFAULT_SCOPE = "python";
  const DEFAULT_INDENTATION$2 = "4-spaces";

  const VALID_INDENTATIONS$4 = new Set([
    "2-spaces",
    "4-spaces",
    "8-spaces",
    "tabs"
  ]);

  const EDITOR_EVENTS$1 = [
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

  class CodeMirrorSnippetAdapter {
    constructor({
      registry,
      logger = null,
      defaultScope = DEFAULT_SCOPE,
      indentation = DEFAULT_INDENTATION$2
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
          EDITOR_EVENTS$1,
          this.managerListener
        );

        this.registeredEvents = [ ...EDITOR_EVENTS$1 ];

        return;
      }

      if (typeof manager.addEventListener === "function") {
        for (const eventName of EDITOR_EVENTS$1) {
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
              : EDITOR_EVENTS$1,
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

      if (!VALID_INDENTATIONS$4.has(value)) {
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

  const EDITOR_EVENTS = [
    "switch-file",
    "file-loaded",
    "new-file",
    "rename-file",
    "editor-state-changed",
    "update:read-only"
  ];

  const REFRESH_DELAYS = [ 0, 50, 250 ];

  const DEFAULT_INDENTATION$1 = "4-spaces";

  const VALID_INDENTATIONS$3 = new Set([
    "2-spaces",
    "4-spaces",
    "8-spaces",
    "tabs"
  ]);

  class SnippetAdapter {
    constructor({
      registry,
      logger = null,
      aceAdapter = null,
      codeMirrorAdapter = null,
      indentation = DEFAULT_INDENTATION$1
    } = {}) {
      if (
        !registry ||
        typeof registry.getAll !== "function"
      ) {
        throw new TypeError(
          "[FlaskSnippets] SnippetAdapter requires a valid registry."
        );
      }

      if (!VALID_INDENTATIONS$3.has(indentation)) {
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

      if (!VALID_INDENTATIONS$3.has(value)) {
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

  const DEFAULT_INDENTATION = "4-spaces";

  const VALID_INDENTATIONS$2 = new Set([
    "2-spaces",
    "4-spaces",
    "8-spaces",
    "tabs"
  ]);

  class FlaskSnippetsService {
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

      if (!VALID_INDENTATIONS$2.has(indentation)) {
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

  const PLUGIN_ID$1 = "dev.zylle.flasksnippets";

  const INDENTATION_OPTIONS = Object.freeze([
    [ "2-spaces", "2 Spaces" ],
    [ "4-spaces", "4 Spaces" ],
    [ "8-spaces", "8 Spaces" ],
    [ "tabs", "Tabs" ]
  ]);

  const DEFAULT_SETTINGS$1 = Object.freeze({
    enabled: true,
    autocomplete: true,
    indentation: "4-spaces"
  });

  const VALID_INDENTATIONS$1 = new Set(
    INDENTATION_OPTIONS.map(([ value ]) => value)
  );

  class PluginSettings {
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

      const stored = this.settingsApi.value[ PLUGIN_ID$1 ];

      const settings = {
        ...DEFAULT_SETTINGS$1,
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
            : DEFAULT_SETTINGS$1.enabled,

        autocomplete:
          typeof settings.autocomplete === "boolean"
            ? settings.autocomplete
            : DEFAULT_SETTINGS$1.autocomplete,

        indentation:
          VALID_INDENTATIONS$1.has(settings.indentation)
            ? settings.indentation
            : DEFAULT_SETTINGS$1.indentation
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

      const allowedKeys = Object.keys(DEFAULT_SETTINGS$1);

      for (const [ key, value ] of Object.entries(changes)) {
        if (!allowedKeys.includes(key)) {
          throw new Error(
            `[FlaskSnippets] Unknown setting: ${key}.`
          );
        }

        if (key === "indentation") {
          if (!VALID_INDENTATIONS$1.has(value)) {
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
        this.settingsApi.value[ PLUGIN_ID$1 ];

      this.settingsApi.value[ PLUGIN_ID$1 ] = next;

      try {
        await this.settingsApi.update();
      } catch (error) {
        if (previousStored === undefined) {
          delete this.settingsApi.value[ PLUGIN_ID$1 ];
        } else {
          this.settingsApi.value[ PLUGIN_ID$1 ] = previousStored;
        }

        throw error;
      }

      return next;
    }

    async restoreSettings(previous) {
      try {
        this.settingsApi.value[ PLUGIN_ID$1 ] = previous;

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
                if (!VALID_INDENTATIONS$1.has(value)) {
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

})();
//# sourceMappingURL=main.js.map
