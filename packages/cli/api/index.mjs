/**
 * @file Programmatic API for the Astryx CLI.
 *
 * Every function returns the same `{ type, data }` envelope that
 * `astryx-svelte --json` outputs. Errors throw `AstryxError` (with optional
 * `.suggestions` and a stable `.code`).
 *
 * ## The seam
 *
 * `api/` is the logic; `clients/cli/` is presentation. The split is load
 * bearing, not cosmetic:
 *
 *   - An `api/` function returns `{type, data}` and throws `AstryxError`. It
 *     never writes to stdout, never calls `process.exit`, and never reads
 *     `--json`. That is what makes it usable as a library.
 *   - A `clients/cli/commands/*.mjs` module is a thin Commander shell: parse
 *     flags, `await` the api function, then either `jsonOut(result)` or render
 *     the same payload as text through `clients/cli/formatters`. Because the
 *     envelope is produced in exactly one place, `--json` behaves identically
 *     for every command — there is no per-command JSON code path to get wrong.
 *   - Errors cross the seam once, at `cliError`, which reads `AstryxError.code`
 *     and puts it on the envelope verbatim.
 *
 * The one deliberate exception is `manifest`, which introspects the live
 * Commander program and therefore has no `api/` entry — see
 * `clients/cli/lib/manifest.mjs`.
 *
 * @example
 * import { AstryxError, component, logger } from '@astryx-svelte/cli/api';
 *
 * Each command slice adds its `export {verb} from './<verb>/<verb>.mjs'` line
 * plus the matching `export * from './<verb>/<verb>.type.mjs'` below.
 */

// ── Functions (runtime) ──────────────────────────────────────────────
export { AstryxError } from './error.mjs';
export { component } from './component/component.mjs';
export { docs } from './docs/docs.mjs';
export { discover } from './discover/discover.mjs';
// `util` is upstream's `hook`, renamed at the command surface only (Svelte has
// no hooks); see api/util/util.type.mjs.
export { util } from './util/util.mjs';
export { search } from './search/search.mjs';
// Only the command verb, as upstream's barrel does. The discovery helpers
// (`discoverTemplates`, `findShowcase`, `findRelatedBlocks`, …) are a
// cross-command seam inside the CLI, published from `api/template/template.mjs`
// rather than from this barrel — same as upstream.
export { template } from './template/template.mjs';
// Only the command verb, as upstream's barrel does. `rewriteImports` stays on
// `api/swizzle/swizzle.mjs` — it is the copy leaf's internals, not a published
// helper.
export { swizzle } from './swizzle/swizzle.mjs';
export { init } from './init/init.mjs';
export { doctor } from './doctor/doctor.mjs';
// `buildHelp`/`buildKit`/`importSpecifier` are module-public and barrel-absent
// upstream (`api/index.mjs:28,31`), so they stay internals here too — a name on
// this barrel is a compatibility promise.
export { build } from './build/build.mjs';
export { themeBuild, themeAdd, themeList, listThemes } from './theme/theme.mjs';
export { layoutExpand, layoutCheck, layoutGrammar } from './layout/layout.mjs';
export { upgrade } from './upgrade/upgrade.mjs';
// Landed with `validate-integration` but missing from this barrel until slice 5
// noticed: nothing guards it, so an omission here is invisible.
export { validateIntegration, summarizeIssues } from './integration/validate-integration.mjs';
// The one shared logger: the `logger` instance side-effecting commands write
// through, plus its generated `Logger` type. Part of the public surface so an
// embedder can enable/inspect output.
export { logger } from './logger.mjs';
/**
 * @typedef {import('./logger.mjs').Logger} Logger
 */

// ── Types (re-exported from each command's colocated `.type.mjs`) ─────
// Runtime no-ops (the .type.mjs files are `export {}`); tsc carries these
// through to the generated api/index.d.mts so the public type surface exposes
// every command's Options + response types by name. Populated per slice.
export * from './component/component.type.mjs';
export * from './docs/docs.type.mjs';
export * from './discover/discover.type.mjs';
export * from './util/util.type.mjs';
export * from './search/search.type.mjs';
export * from './template/template.type.mjs';
export * from './swizzle/swizzle.type.mjs';
export * from './init/init.type.mjs';
export * from './doctor/doctor.type.mjs';
export * from './build/build.type.mjs';
export * from './theme/theme.type.mjs';
export * from './layout/layout.type.mjs';
export * from './upgrade/upgrade.type.mjs';
export * from './integration/validate-integration.type.mjs';
