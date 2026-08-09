/**
 * Type surface for the `@astryx-svelte/cli/json` export — the out-of-process
 * consumer's view of `astryx-svelte --json` output.
 *
 * Upstream re-exports every command's colocated `api/<cmd>/<cmd>.type.mjs` here
 * alongside the shared response contract, so `./json` and `./api` describe the
 * same data from one source. No command has landed yet, so only the shared
 * contract is present: the envelope/error/suggestion base, the error-code
 * union, and the manifest types. **Each command slice adds its own
 * `export type * from '../<cmd>/<cmd>.type.mjs'` line here** — that is the
 * mechanism keeping the two surfaces from drifting, and it is per-slice work,
 * not a trailing task.
 */

export type * from '../../foundation/response/base';
export type * from '../../foundation/response/error-codes';
export type * from '../../clients/cli/lib/manifest';
