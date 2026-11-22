
let idCounter = 0;

export function isPlainObject(value) {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return (
    prototype === Object.prototype ||
    prototype === null
  );
}

export function clone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags);
  }

  if (value instanceof Map) {
    const result = new Map();

    seen.set(value, result);

    for (const [ key, item ] of value.entries()) {
      result.set(
        clone(key, seen),
        clone(item, seen)
      );
    }

    return result;
  }

  if (value instanceof Set) {
    const result = new Set();

    seen.set(value, result);

    for (const item of value.values()) {
      result.add(clone(item, seen));
    }

    return result;
  }

  if (ArrayBuffer.isView(value)) {
    if (value instanceof DataView) {
      const buffer = clone(value.buffer, seen);

      return new DataView(
        buffer,
        value.byteOffset,
        value.byteLength
      );
    }

    return new value.constructor(value);
  }

  if (value instanceof ArrayBuffer) {
    const result = value.slice(0);

    seen.set(value, result);

    return result;
  }

  if (Array.isArray(value)) {
    const result = [];

    seen.set(value, result);

    for (const item of value) {
      result.push(clone(item, seen));
    }

    return result;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const result = Object.create(
    Object.getPrototypeOf(value)
  );

  seen.set(value, result);

  for (const [ key, item ] of Object.entries(value)) {
    Object.defineProperty(result, key, {
      value: clone(item, seen),
      enumerable: true,
      configurable: true,
      writable: true
    });
  }

  return result;
}

export function generateId(prefix = "custom") {
  if (
    typeof prefix !== "string" ||
    !prefix.trim()
  ) {
    throw new TypeError(
      "[FlaskSnippets] ID prefix must be a non-empty string."
    );
  }

  idCounter += 1;

  const timestamp = Date.now().toString(36);
  const counter = idCounter.toString(36);

  return `${prefix.trim()}-${timestamp}-${counter}`;
}

export function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

export function normalizeArray(value) {
  if (Array.isArray(value)) {
    return [ ...value ];
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [ value ];
}

export function uniqueArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [ ...new Set(values) ];
}

export function debounce(callback, delay = 200) {
  if (typeof callback !== "function") {
    throw new TypeError(
      "[FlaskSnippets] Debounce requires a callback."
    );
  }

  if (!Number.isFinite(delay) || delay < 0) {
    throw new RangeError(
      "[FlaskSnippets] Debounce delay must be a non-negative number."
    );
  }

  let timeout = null;
  let lastArgs = null;
  let lastThis = null;

  function invoke() {
    const args = lastArgs;
    const context = lastThis;

    lastArgs = null;
    lastThis = null;

    return callback.apply(context, args);
  }

  function debounced(...args) {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    lastArgs = args;
    lastThis = this;

    timeout = setTimeout(() => {
      timeout = null;
      invoke();
    }, delay);
  }

  debounced.cancel = () => {
    if (timeout === null) {
      return false;
    }

    clearTimeout(timeout);

    timeout = null;
    lastArgs = null;
    lastThis = null;

    return true;
  };

  debounced.flush = () => {
    if (timeout === null) {
      return undefined;
    }

    clearTimeout(timeout);
    timeout = null;

    return invoke();
  };

  debounced.pending = () => timeout !== null;

  return debounced;
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function clamp(value, min, max) {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    min > max
  ) {
    throw new RangeError(
      "[FlaskSnippets] Invalid clamp arguments."
    );
  }

  return Math.min(max, Math.max(min, value));
}

export function sleep(milliseconds) {
  if (
    !Number.isFinite(milliseconds) ||
    milliseconds < 0
  ) {
    throw new RangeError(
      "[FlaskSnippets] Sleep duration must be non-negative."
    );
  }

  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}
