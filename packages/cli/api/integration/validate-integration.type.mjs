/**
 * @file Colocated types for the `validate-integration` command — source of truth
 * for its options + response. `AstryxIntegrationIssue` stays shared in
 * `foundation/integrations/issue.ts` (it's not command-owned).
 */

/**
 * A loaded integration manifest — the shape `validateLoadedIntegration` accepts.
 * Colocated here (rather than referencing the internal
 * `foundation/integrations/integrations.mjs` module) so the generated public
 * `./api` surface stays self-contained.
 * @typedef {object} LoadedIntegration
 * @property {string} name
 * @property {string} [version]
 * @property {string} [components]
 * @property {string} [templates]
 * @property {string} [codemods]
 * @property {string} [issuesUrl]
 * @property {string} __spec
 * @property {string} __packageDir
 * @property {string} __manifestFile
 */

/**
 * Options for `validateIntegration()`.
 * @typedef {object} ValidateIntegrationOptions
 * @property {string} [cwd]
 */

/**
 * `astryx-svelte --json validate-integration [package]`.
 * @typedef {object} ValidateIntegrationResponse
 * @property {'integration.validate'} type
 * @property {{name: string | null, version: string | null, issues: import('../../foundation/integrations/issue').AstryxIntegrationIssue[]}} data
 */

export {};
