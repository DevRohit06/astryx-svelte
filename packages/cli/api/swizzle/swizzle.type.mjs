/**
 * @file Colocated types for the `swizzle` command — source of truth for the
 * `swizzle.list` and `swizzle.copy` JSON responses, re-exported through
 * `api/index.mjs`.
 */

/**
 * astryx-svelte --json swizzle [--list]
 *
 * The payload is the list of swizzlable **directories** (`button`, `avatar`,
 * `chat`), which is what a swizzle copies. An export name resolves to its
 * directory too — see api/swizzle/copy/copy.mjs.
 *
 * @typedef {object} SwizzleListResponse
 * @property {'swizzle.list'} type
 * @property {string[]} data
 */

/**
 * Maintainer feedback note emitted after a successful swizzle.
 *
 * @typedef {object} SwizzleFeedback
 * @property {string} issuesUrl Where to report the gap that led to swizzling.
 * @property {string} [ghCommand] Ready-to-run `gh issue create` command, when `gh` is available.
 */

/**
 * astryx-svelte --json swizzle <component>
 *
 * @typedef {object} SwizzleCopyResponse
 * @property {'swizzle.copy'} type
 * @property {object} data
 * @property {string} data.component The name that was asked for.
 * @property {string} data.package Owner package the component source was copied from.
 * @property {string} data.outputDir Named for the directory that was copied, not for `component`.
 * @property {number} data.filesCopied
 * @property {string[]} data.files Paths relative to `outputDir`, '/'-joined (the copy is recursive).
 * @property {boolean} data.usesStyleX Whether any copied `.ts` module imports StyleX (needs a compiler in the consumer's build).
 * @property {string[]} data.unresolvedImports Escaping specifiers left untouched because the owner publishes no entrypoint that re-exports them. Empty for an owner with no `exports` map. Has no upstream analogue: upstream publishes a subpath per component directory, so its rewrite can never fail to find a home.
 * @property {SwizzleFeedback} [data.feedback]
 */

/**
 * Options for `swizzle()`.
 * @typedef {object} SwizzleOptions
 * @property {string} [cwd]
 * @property {string} [output] Output directory (must resolve inside cwd). Defaults to ./components/astryx.
 * @property {string} [package] Scope to a specific owning package when a name is ambiguous.
 * @property {boolean} [list] Force the list response even with a component argument.
 * @property {boolean} [overwrite] Overwrite existing files instead of erroring.
 */

export {};
