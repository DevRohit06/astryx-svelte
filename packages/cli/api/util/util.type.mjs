/**
 * @file Colocated types for the `util` command — source of truth for its JSON
 * responses.
 *
 * ## Why `util` and not `hook`
 *
 * Svelte has no hooks. Upstream's `hook` command lists React hooks; the same
 * things here are runes-based composables in `.svelte.ts` modules, so the verb
 * is `util` with `hook` kept as a `.alias(...)` and the response discriminators
 * are `util.*` (planning/02 §857). The *doctype* stays `hook` — `HookDoc` is
 * what an author writes and what `authoring/doctypes/hook/parse.mjs` validates —
 * so this file reads `HookDoc` and returns `util.*`. The rename is a
 * command-surface rename and stops at the command surface.
 *
 * Detail-level contract for list views (brief < compact < full):
 *   --detail brief    Names only. Smallest, most scannable. (DEFAULT for --list)
 *   --detail compact  Names + 1-line description + import path.
 *   --detail full     Full HookDoc per entry (params, returns, usage, etc.).
 *
 * Invocation                                             -> type discriminator
 * ----------------------------------------------------------------------------
 * astryx-svelte --json util                              -> util.list (data.detail='names')
 * astryx-svelte --json util --list                       -> util.list (data.detail='names')
 * astryx-svelte --json util --category Media             -> util.list (filtered)
 * astryx-svelte --json util --list --detail compact      -> util.list (data.detail='compact')
 * astryx-svelte --json util --list --detail full         -> util.list (data.detail='full')
 * astryx-svelte --json util useMediaQuery                -> util.detail
 * astryx-svelte --json util useMediaQuery --params       -> util.detail.params
 * (not found)                                            -> CLIError
 */

/** @typedef {import('../../authoring/doctypes/types').HookDoc} HookDoc */
/** @typedef {import('../../authoring/doctypes/types').HookParamDoc} HookParamDoc */

/**
 * astryx-svelte --json util [--list] [--category X] [--detail names|compact|full]
 *
 * The list view emits ONE `util.list` type across all three detail levels; the
 * depth is carried in `data.detail` and `data.components` holds the grouped map
 * whose entry shape depends on that level:
 *   - 'names'   -> string[]         (util names only)
 *   - 'compact' -> UtilBriefEntry[] (name + 1-line description + import)
 *   - 'full'    -> HookDoc[]        (full authored doc per entry)
 *
 * `data.components` keeps upstream's key name even for utils — it is the shared
 * list envelope both commands emit, and renaming it would fork the JSON
 * contract for no gain.
 *
 * @typedef {object} UtilListResponse
 * @property {'util.list'} type
 * @property {UtilListData} data
 */

/**
 * Detail-tagged payload for `util.list` (discriminated on `detail`).
 * @typedef {{detail: 'names', components: Record<string, string[]>} | {detail: 'compact', components: Record<string, UtilBriefEntry[]>} | {detail: 'full', components: Record<string, HookDoc[]>}} UtilListData
 */

/**
 * A single entry in a `util.list` group at `detail: 'compact'`.
 * @typedef {object} UtilBriefEntry
 * @property {string} name
 * @property {string} description
 * @property {string} import
 */

/**
 * astryx-svelte --json util <name>
 * @typedef {object} UtilDetailResponse
 * @property {'util.detail'} type
 * @property {HookDoc} data
 */

/**
 * astryx-svelte --json util <name> --params
 * @typedef {object} UtilDetailParamsResponse
 * @property {'util.detail.params'} type
 * @property {HookParamDoc[]} data
 */

/**
 * Options for `util()`.
 * @typedef {object} UtilOptions
 * @property {string} [cwd]
 * @property {boolean} [list]
 * @property {string} [category]
 * @property {boolean} [params]
 * @property {'full' | 'compact' | 'brief'} [detail]
 * @property {string} [lang]
 * @property {boolean} [zh]
 */

export {};
