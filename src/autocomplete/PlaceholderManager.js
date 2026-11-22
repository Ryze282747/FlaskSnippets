
export default class PlaceholderManager {
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
