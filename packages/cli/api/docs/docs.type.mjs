/**
 * @file Colocated types for the `docs` command — source of truth for the docs
 *   command JSON responses.
 *
 *   Invocation                                        -> type discriminator
 *   ----------------------------------------------------------------------
 *   astryx-svelte --json docs                         -> docs.list
 *   astryx-svelte --json docs <topic>                 -> docs.detail
 *   astryx-svelte --json docs <topic> <section>       -> docs.detail.section
 *   (unknown topic/section)                           -> CLIError
 */

/**
 * astryx-svelte --json docs
 * @typedef {object} DocsListResponse
 * @property {'docs.list'} type
 * @property {DocsListEntry[]} data
 */

/**
 * @typedef {object} DocsListEntry
 * @property {string} topic
 * @property {string} description
 */

/**
 * astryx-svelte --json docs <topic>
 * @typedef {object} DocsDetailResponse
 * @property {'docs.detail'} type
 * @property {import('../../authoring/doctypes/types').ReferenceDoc} data
 */

/**
 * astryx-svelte --json docs <topic> <section>
 * @typedef {object} DocsDetailSectionResponse
 * @property {'docs.detail.section'} type
 * @property {import('../../authoring/doctypes/types').ReferenceSection} data
 */

/**
 * Options for `docs()`.
 * @typedef {object} DocsOptions
 * @property {string} [lang]
 * @property {boolean} [zh]
 * @property {boolean} [dense]
 */

export {};
