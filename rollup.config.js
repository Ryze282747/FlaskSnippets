
import { readFileSync } from "node:fs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

const isProduction = process.env.NODE_ENV === "production";

export default {
  input: "main.js",

  output: {
    file: "dist/main.js",
    format: "iife",
    name: "FlaskSnippets",
    sourcemap: !isProduction,
    inlineDynamicImports: true,

    banner: `/*!
 * Flask Snippets v${packageJson.version}
 * Copyright (c) 2026 Zylle Mojica
 * Licensed under the MIT License.
 */`
  },

  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false,
      extensions: [ ".js", ".json" ]
    }),

    commonjs()
  ],

  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: true,
    tryCatchDeoptimization: true
  },

  onwarn(warning, warn) {
    if (warning.code === "CIRCULAR_DEPENDENCY") {
      console.warn(`[FlaskSnippets] ${warning.message}`);
      return;
    }

    warn(warning);
  }
};
