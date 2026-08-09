/**
 * @file API error class — carries structured error info matching CLIError shape.
 *
 * `AstryxError` is what the API layer throws. Alongside the human-readable
 * message and optional `suggestions`, it carries a stable machine-readable
 * `code` (see ../foundation/response/error-codes.mjs). When the CLI catches an
 * AstryxError and routes it through `cliError`, it propagates `e.code` so the
 * JSON error envelope's `code` field matches the API contract exactly. The code
 * defaults to `ERR_UNKNOWN` so older throw sites still produce a valid envelope.
 *
 * This is one half of the seam: `api/` throws, `clients/cli/` catches and
 * formats. An API function never writes to stdout, never calls `process.exit`,
 * and never knows whether `--json` is active — so the same function is usable
 * from a programmatic embedder (`@astryx-svelte/cli/api`) and from the CLI, and
 * the JSON contract is guaranteed in exactly one place.
 */

import { ERROR_CODES } from '../foundation/response/error-codes.mjs';

export class AstryxError extends Error {
	/** @type {import('../foundation/response/base').Suggestion[] | undefined} */
	suggestions;

	/**
	 * Stable, machine-readable error code (error-codes.mjs). Consumers branch
	 * on this, never on the message text.
	 * @type {string}
	 */
	code;

	/**
	 * @param {string} message
	 * @param {import('../foundation/response/base').Suggestion[]} [suggestions]
	 * @param {string} [code] - Stable error code. Defaults to ERR_UNKNOWN.
	 */
	constructor(message, suggestions, code) {
		super(message);
		this.name = 'AstryxError';
		this.code = code || ERROR_CODES.ERR_UNKNOWN;
		if (Array.isArray(suggestions) && suggestions.length) this.suggestions = suggestions;
	}
}
