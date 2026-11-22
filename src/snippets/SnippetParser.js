
import PlaceholderManager from "../autocomplete/PlaceholderManager.js";

export default class SnippetParser {
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
