/**
 * @file Colocated types for the `template` command — source of truth for the
 * template command JSON responses.
 *
 * Each template is exactly two files: a Svelte source plus a template spec
 * (`template.doc.mjs`, or the canonical `<id>.template.ts`). Upstream's source
 * half is `page.tsx`; a page template here is a SvelteKit route component,
 * `+page.svelte`, and a block template is `<Name>.svelte`.
 *
 * Invocation                                          -> type discriminator
 * ---------------------------------------------------------------------------
 * astryx-svelte --json template [--list]              -> template.list
 * astryx-svelte --json template <name>                -> template.show
 * astryx-svelte --json template <name> --skeleton     -> template.skeleton
 * astryx-svelte --json template <name> [path]         -> template.copy
 * (unknown template)                                  -> CLIError
 */

/**
 * astryx-svelte --json template [--list]
 * @typedef {object} TemplateListResponse
 * @property {'template.list'} type
 * @property {TemplateListEntry[]} data
 */

/**
 * @typedef {object} TemplateListEntry
 * @property {string} id - Stable template id (relative path under the templates root, minus the template-spec suffix).
 * @property {string} name
 * @property {string} description
 * @property {'page' | 'block'} type
 * @property {string} package - Owning package; core (built-in) templates report '@astryx-svelte/core'.
 * @property {string} [category] - Optional grouping/category label.
 * @property {string[]} [componentsUsed] - Component display names the template composes.
 * @property {boolean} isReady
 * @property {boolean} [scaffold]
 */

/**
 * astryx-svelte --json template <name>
 * @typedef {object} TemplateShowResponse
 * @property {'template.show'} type
 * @property {object} data
 * @property {string} data.template
 * @property {string} data.description
 * @property {'page' | 'block'} data.type
 * @property {string[]} data.components
 * @property {string} data.source
 */

/**
 * astryx-svelte --json template <name> --skeleton
 * @typedef {object} TemplateSkeletonResponse
 * @property {'template.skeleton'} type
 * @property {object} data
 * @property {string} data.template
 * @property {string} data.description
 * @property {string[]} data.components
 * @property {string} data.skeleton
 */

/**
 * astryx-svelte --json template <name> [path]
 * @typedef {object} TemplateCopyResponse
 * @property {'template.copy'} type
 * @property {object} data
 * @property {string} data.template
 * @property {string} data.outputDir
 * @property {string} data.fileName
 * @property {number} data.filesCopied
 */

/**
 * Options for `template()`.
 * @typedef {object} TemplateOptions
 * @property {boolean} [list]
 * @property {boolean} [skeleton]
 * @property {boolean} [show]
 * @property {'page' | 'block'} [type] Filter templates by kind: 'page' or 'block'. Only applies to list views.
 * @property {string} [package] Narrow to templates from a specific package (id-only lookups across packages are ambiguous).
 * @property {string} [targetPath]
 * @property {boolean} [overwrite] Overwrite an existing target file instead of erroring (ERR_FILE_EXISTS).
 * @property {string} [cwd]
 */

export {};
