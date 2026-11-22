
import coreSnippets from "./core/index.js";
import architectureSnippets from "./architecture/index.js";
import extensionSnippets from "./extensions/index.js";
import databaseSnippets from "./database/index.js";
import authenticationSnippets from "./authentication/index.js";
import jinjaSnippets from "./jinja/index.js";

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

export const snippetCategories = Object.freeze({
  core: freezeSnippets(coreSnippets),
  architecture: freezeSnippets(architectureSnippets),
  extensions: freezeSnippets(extensionSnippets),
  database: freezeSnippets(databaseSnippets),
  authentication: freezeSnippets(authenticationSnippets),
  jinja: freezeSnippets(jinjaSnippets)
});

export const allSnippets = Object.freeze([
  ...coreSnippets,
  ...architectureSnippets,
  ...extensionSnippets,
  ...databaseSnippets,
  ...authenticationSnippets,
  ...jinjaSnippets
]);

export const categoryMetadata = Object.freeze([
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

function normalizeCategory(category) {
  if (typeof category !== "string") {
    return null;
  }

  const normalized = category.trim().toLowerCase();

  return normalized || null;
}

export function getCategorySnippets(category) {
  const normalized = normalizeCategory(category);

  if (!normalized) {
    return [];
  }

  return snippetCategories[ normalized ] || [];
}

export function getCategoryMetadata(category) {
  const normalized = normalizeCategory(category);

  if (!normalized) {
    return null;
  }

  return (
    categoryMetadata.find(
      item => item.id === normalized
    ) || null
  );
}

export function getSnippetCount() {
  return allSnippets.length;
}

export default allSnippets;
