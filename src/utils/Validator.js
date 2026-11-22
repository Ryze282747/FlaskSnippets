
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/;
const PREFIX_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

export default class Validator {
  static isObject(value) {
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

  static isNonEmptyString(value) {
    return (
      typeof value === "string" &&
      value.trim().length > 0
    );
  }

  static isValidId(value) {
    return (
      typeof value === "string" &&
      ID_PATTERN.test(value)
    );
  }

  static isValidPrefix(value) {
    return (
      typeof value === "string" &&
      PREFIX_PATTERN.test(value)
    );
  }

  static isValidBody(value) {
    if (typeof value === "string") {
      return this.isNonEmptyString(value);
    }

    if (
      !Array.isArray(value) ||
      value.length === 0
    ) {
      return false;
    }

    return value.every(
      line => typeof line === "string"
    );
  }

  static isValidScope(value) {
    if (typeof value === "string") {
      return this.isNonEmptyString(value);
    }

    if (Array.isArray(value)) {
      return value.every(
        item => this.isNonEmptyString(item)
      );
    }

    return false;
  }

  static isValidTags(value) {
    return (
      Array.isArray(value) &&
      value.every(
        tag => this.isNonEmptyString(tag)
      )
    );
  }

  static validateSnippet(snippet) {
    const errors = [];

    if (!this.isObject(snippet)) {
      return {
        valid: false,
        errors: [
          "Snippet must be a plain object."
        ]
      };
    }

    if (!this.isValidId(snippet.id)) {
      errors.push(
        "ID must start with a letter or number and contain only letters, numbers, colons, underscores, or hyphens."
      );
    }

    if (!this.isNonEmptyString(snippet.name)) {
      errors.push("Name is required.");
    }

    if (!this.isValidPrefix(snippet.prefix)) {
      errors.push(
        "Prefix must start with a letter and contain only letters, numbers, underscores, or hyphens."
      );
    }

    if (!this.isValidBody(snippet.body)) {
      errors.push(
        "Body must be a non-empty string or a non-empty array of strings."
      );
    }

    if (
      snippet.scope !== undefined &&
      !this.isValidScope(snippet.scope)
    ) {
      errors.push(
        "Scope must be a non-empty string or an array of non-empty strings."
      );
    }

    if (
      snippet.tags !== undefined &&
      !this.isValidTags(snippet.tags)
    ) {
      errors.push(
        "Tags must be an array of non-empty strings."
      );
    }

    if (
      snippet.description !== undefined &&
      typeof snippet.description !== "string"
    ) {
      errors.push(
        "Description must be a string."
      );
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static assertSnippet(snippet) {
    const result = this.validateSnippet(snippet);

    if (!result.valid) {
      throw new TypeError(
        `[FlaskSnippets] Invalid snippet: ${result.errors.join(" ")}`
      );
    }

    return true;
  }

  static validateSnippetList(snippets) {
    if (!Array.isArray(snippets)) {
      return {
        valid: false,
        errors: [
          "Snippet collection must be an array."
        ]
      };
    }

    const errors = [];
    const ids = new Set();

    snippets.forEach((snippet, index) => {
      const result = this.validateSnippet(snippet);

      for (const error of result.errors) {
        errors.push(
          `Snippet ${index + 1}: ${error}`
        );
      }

      if (
        this.isObject(snippet) &&
        this.isValidId(snippet.id)
      ) {
        if (ids.has(snippet.id)) {
          errors.push(
            `Snippet ${index + 1}: duplicate ID "${snippet.id}".`
          );
        }

        ids.add(snippet.id);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static assertSnippetList(snippets) {
    const result = this.validateSnippetList(snippets);

    if (!result.valid) {
      throw new TypeError(
        `[FlaskSnippets] Invalid snippet collection: ${result.errors.join(" ")}`
      );
    }

    return true;
  }
}
