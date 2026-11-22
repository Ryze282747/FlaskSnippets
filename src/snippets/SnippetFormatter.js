
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

module.exports = SnippetFormatter;
