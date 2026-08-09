/**
 * @file Colocated types for the `layout` command — source of truth for its JSON
 * responses. `astryx-svelte layout expand|check|grammar` turn compressed
 * XLE/XLO expressions into a validated Svelte component (or echo canonical
 * surfaces / a grammar cheatsheet).
 *
 * Invocation                                        -> type discriminator
 * ------------------------------------------------------------------------
 * astryx-svelte --json layout expand "<expr>"       -> layout.expand
 * astryx-svelte --json layout check "<expr>"        -> layout.check
 * astryx-svelte --json layout grammar               -> layout.grammar
 */

/**
 * The input surface an expression was parsed as.
 * @typedef {'compact' | 'outline' | 'auto'} LayoutForm
 */

/**
 * A validation issue with its formatted, human-readable rendering.
 * @typedef {object} LayoutIssue
 * @property {number} [line]
 * @property {number} [col]
 * @property {string} message
 * @property {string} formatted
 * @property {string[]} [suggestions]
 */

/**
 * A block referenced by a layout expression and how it was spliced in.
 * @typedef {object} LayoutBlockReference
 * @property {string} name
 * @property {string} mode
 */

/**
 * astryx-svelte --json layout expand "<expr>" [path]
 * @typedef {object} LayoutExpandResponse
 * @property {'layout.expand'} type
 * @property {object} data
 * @property {LayoutForm} data.form
 * @property {string} data.code
 * @property {string[]} data.componentsUsed
 * @property {number} data.states Number of `$state` declarations the expansion scaffolded.
 * @property {string[]} data.todos
 * @property {LayoutBlockReference[]} data.blocksReferenced
 * @property {string[]} data.warnings
 * @property {string | null} data.written
 */

/**
 * astryx-svelte --json layout check "<expr>"
 * @typedef {object} LayoutCheckResponse
 * @property {'layout.check'} type
 * @property {object} data
 * @property {boolean} data.valid
 * @property {LayoutForm} data.form
 * @property {LayoutIssue[]} data.errors
 * @property {string[]} data.warnings
 * @property {string} data.compact
 * @property {string} data.outline
 */

/**
 * astryx-svelte --json layout grammar
 * @typedef {object} LayoutGrammarResponse
 * @property {'layout.grammar'} type
 * @property {object} data
 * @property {string} data.text
 * @property {Record<string, string>} data.aliases Alias table (short name -> canonical component), from the registry.
 */

/**
 * @typedef {LayoutExpandResponse | LayoutCheckResponse | LayoutGrammarResponse} LayoutResponse
 */

/**
 * Options for `layoutExpand()`.
 * @typedef {object} LayoutExpandOptions
 * @property {string} [targetPath]
 * @property {LayoutForm} [form]
 * @property {boolean} [loose]
 * @property {string} [name]
 * @property {string} [cwd]
 */

/**
 * Options for `layoutCheck()`.
 * @typedef {object} LayoutCheckOptions
 * @property {LayoutForm} [form]
 * @property {boolean} [loose]
 * @property {string} [cwd]
 */

/**
 * Options for `layoutGrammar()`.
 * @typedef {object} LayoutGrammarOptions
 * @property {string} [cwd]
 */

export {};
