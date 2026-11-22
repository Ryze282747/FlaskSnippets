
import SnippetParser from "./SnippetParser.js";

export default class SnippetRegistry {
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
