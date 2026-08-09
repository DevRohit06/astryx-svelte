/**
 * @file Colocated types for the `search` command — source of truth for the
 * `astryx-svelte search <query>` JSON response shapes.
 *
 * ## Why the domain is still `hook`
 *
 * The command that shows a composable is `util` here (Svelte has no hooks) —
 * but that is a *command-surface* rename and it stops at the command surface,
 * exactly as `api/util/util.type.mjs` records. `SearchDomain` is a taxonomy in
 * the JSON payload, and `--type hook` is a word this CLI still answers to
 * (`util` carries `hook` as an alias). Renaming the domain would fork the JSON
 * contract from `@astryxdesign/cli`'s for no gain, so the *value* the domain
 * carries — `command`, which is a literal command line — is what changes:
 * a hook result's follow-up is `astryx-svelte util <name>`.
 */

/**
 * The domain a search result belongs to.
 * @typedef {'component' | 'hook' | 'doc' | 'template'} SearchDomain
 */

/**
 * A single ranked search result, tagged with its domain.
 * @typedef {object} SearchResultEntry
 * @property {SearchDomain} domain - Which content domain this result came from.
 * @property {string} name - Primary identifier (component/util name, doc topic, template dir).
 * @property {number} score - Relevance score (higher is better).
 * @property {string} reason - Human-readable reason the candidate matched (e.g. `keyword "button"`).
 * @property {string} description - One-line description, when available.
 * @property {string} command - Follow-up command to act on this result (e.g. `astryx-svelte component Button`).
 * @property {string} [import] - Import path — present for component and hook results.
 * @property {string} [title] - Doc title — present for doc results.
 * @property {string} [displayName] - Friendly display name — present for template results.
 * @property {'page' | 'block'} [kind] - Template kind (`page` | `block`) — present for template results.
 */

/**
 * astryx-svelte --json search <query>
 * @typedef {object} SearchResponse
 * @property {'search'} type
 * @property {object} data
 * @property {string} data.query
 * @property {SearchResultEntry[]} data.results
 */

/**
 * Options for `search()`.
 * @typedef {object} SearchOptions
 * @property {string} [cwd]
 * @property {SearchDomain} [type]
 * @property {number} [limit]
 */

export {};
