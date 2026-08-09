/**
 * @file Tests for the stable error-code contract.
 *
 * Three layers:
 *
 *   1. Unit — the taxonomy itself: every code is a non-empty, unique,
 *      stable string; the object is frozen; helpers behave.
 *
 *   2. Declaration parity — the `.d.ts` union and the frozen runtime object
 *      describe the same 43 codes. This layer has **no upstream analogue** and
 *      exists because upstream is currently wrong: its `error-codes.d.ts` at
 *      `v0.3.0` omits `ERR_UNKNOWN_POST` and `ERR_FETCH_FAILED`, so a
 *      TypeScript consumer cannot compare against two codes the CLI really
 *      emits. Upstream's own suite iterates `ERROR_CODES` only, which is why
 *      nothing caught it. See the note in `error-codes.d.ts`.
 *
 *   3. End-to-end — drive the CLI in-process and assert that representative
 *      error paths emit the right `code` in their JSON envelope. This is the
 *      only way to exercise Commander hooks, the json-shim, and the error
 *      boundary together.
 *
 * ## Ported case count
 *
 * Upstream's `error-codes.test.mjs` has 10 e2e cases. Five need a command verb
 * that has not landed in this slice and are deferred rather than dropped —
 * each is named below with the slice that unblocks it:
 *
 *   - unknown component  → `component` slice
 *   - unknown hook       → `util`/`hook` slice
 *   - unknown topic      → `docs` slice
 *   - unknown template   → `template` slice
 *   - missing argument   → any slice adding a command with a required
 *                          positional (upstream's case is `theme build`)
 *
 * The remaining five are ported as-is, with `json not supported` retargeted
 * from `theme bogus-sub` to the hidden `postinstall` command — the only
 * registered non-allowlisted command in this slice, and it exercises the same
 * preAction gate. Upstream's two human-mode cases port to one: the second
 * needs a command group (`theme`) for its unknown-subcommand path.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ERROR_CODES, isErrorCode, allErrorCodes } from './error-codes.mjs';
import { runCli } from '../../test-utils/run-cli.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Parse the JSON envelope from stdout. Throws if stdout isn't clean JSON. */
function envelope(stdout) {
	return JSON.parse(stdout);
}

describe('error-codes taxonomy', () => {
	it('every code is a non-empty string', () => {
		for (const [key, value] of Object.entries(ERROR_CODES)) {
			expect(typeof value).toBe('string');
			expect(value.length).toBeGreaterThan(0);
			// Key and value must match — the object is a string enum.
			expect(value).toBe(key);
		}
	});

	it('every code follows the ERR_ naming convention', () => {
		for (const value of Object.values(ERROR_CODES)) {
			expect(value).toMatch(/^ERR_[A-Z0-9_]+$/);
		}
	});

	it('all codes are unique', () => {
		const values = Object.values(ERROR_CODES);
		expect(new Set(values).size).toBe(values.length);
	});

	it('includes the generic fallback', () => {
		expect(ERROR_CODES.ERR_UNKNOWN).toBe('ERR_UNKNOWN');
	});

	it('the taxonomy object is frozen (codes are stable, append-only)', () => {
		expect(Object.isFrozen(ERROR_CODES)).toBe(true);
		expect(() => {
			// @ts-expect-error - intentional mutation attempt
			ERROR_CODES.ERR_NEW = 'ERR_NEW';
		}).toThrow();
		expect(ERROR_CODES.ERR_NEW).toBeUndefined();
	});

	it('isErrorCode recognizes known codes and rejects others', () => {
		expect(isErrorCode('ERR_UNKNOWN_COMPONENT')).toBe(true);
		expect(isErrorCode('ERR_UNKNOWN')).toBe(true);
		expect(isErrorCode('ERR_NOT_A_REAL_CODE')).toBe(false);
		expect(isErrorCode('')).toBe(false);
		expect(isErrorCode(42)).toBe(false);
		expect(isErrorCode(undefined)).toBe(false);
	});

	it('allErrorCodes returns the sorted, complete set', () => {
		const codes = allErrorCodes();
		expect(codes.length).toBe(Object.keys(ERROR_CODES).length);
		expect(codes).toEqual([...codes].sort());
		expect(codes).toContain('ERR_UNKNOWN');
		expect(codes).toContain('ERR_UNKNOWN_COMPONENT');
	});

	it('carries exactly the 43 codes upstream freezes at v0.3.0', () => {
		// The count is the contract: the list is a compatibility surface shared
		// with `@astryxdesign/cli`, so it may only ever grow, and only by a
		// deliberate append. A drop or a rename fails here.
		expect(Object.keys(ERROR_CODES)).toHaveLength(43);
	});
});

describe('error-codes: the .d.ts union matches the runtime object', () => {
	// Beyond upstream, and deliberately so — see the file header.
	const declaration = fs.readFileSync(path.join(__dirname, 'error-codes.d.ts'), 'utf-8');
	// `?? []` rather than a non-null assertion: if the declaration is ever
	// restructured so the scrape finds nothing, an empty list fails the two
	// membership cases below with a readable diff, instead of throwing a
	// TypeError that says nothing about what changed.
	const union =
		declaration
			.slice(declaration.indexOf('export type ErrorCode ='))
			.split(';')[0]
			.match(/ERR_[A-Z0-9_]+/g) ?? [];

	it('scraped the union at all (guards the regex itself)', () => {
		expect(union.length).toBeGreaterThan(0);
	});

	it('declares every code the runtime freezes', () => {
		const missing = Object.keys(ERROR_CODES).filter((c) => !union.includes(c));
		expect(missing, `codes missing from error-codes.d.ts: ${missing.join(', ')}`).toEqual([]);
	});

	it('declares no code the runtime does not have', () => {
		const extra = union.filter((c) => !Object.hasOwn(ERROR_CODES, c));
		expect(extra, `codes in error-codes.d.ts with no runtime entry: ${extra.join(', ')}`).toEqual(
			[]
		);
	});

	it('lists the union in the same order as the frozen object', () => {
		// Append-only means order carries meaning: a reorder is how a "tidy-up"
		// silently becomes a renumbering.
		expect(union).toEqual(Object.keys(ERROR_CODES));
	});
});

describe('error codes: end-to-end JSON envelopes', () => {
	const cases = [
		{ name: 'unknown command', args: ['bogus-cmd', '--json'], code: 'ERR_UNKNOWN_COMMAND' },
		{ name: 'invalid --lang', args: ['--lang', 'fr', '--json'], code: 'ERR_INVALID_LANG' },
		{ name: 'invalid --detail', args: ['--detail', 'bogus', '--json'], code: 'ERR_INVALID_DETAIL' },
		{
			name: 'unknown option',
			args: ['manifest', '--bogus-flag', '--json'],
			code: 'ERR_INVALID_OPTION'
		},
		// `postinstall` is hidden and not on the --json allowlist, so --json on it
		// is rejected at the preAction gate with a stable invalid-option code.
		{ name: 'json not supported', args: ['postinstall', '--json'], code: 'ERR_INVALID_OPTION' }
	];

	for (const { name, args, code } of cases) {
		it(`${name} → ${code}`, async () => {
			const { status, stdout } = await runCli(args);
			expect(status).toBe(1);
			const env = envelope(stdout);
			expect(env).toHaveProperty('apiVersion');
			expect(env).toHaveProperty('error');
			expect(env.code).toBe(code);
			// The code must be a recognized member of the taxonomy.
			expect(isErrorCode(env.code)).toBe(true);
		});
	}

	it('every error envelope carries a code (even unmatched paths fall back to ERR_UNKNOWN)', async () => {
		const { stdout } = await runCli(['bogus-cmd', '--json']);
		const env = envelope(stdout);
		expect(typeof env.code).toBe('string');
		expect(env.code.length).toBeGreaterThan(0);
	});
});

describe('error codes: human mode stays clean', () => {
	it('the code is NOT printed in the human-facing error line', async () => {
		const { status, stderr, stdout } = await runCli(['bogus-cmd']);
		expect(status).toBe(1);
		// Human output goes to stderr and must not leak the machine code.
		expect(stderr).toContain("unknown command 'bogus-cmd'");
		expect(stderr).not.toContain('ERR_UNKNOWN_COMMAND');
		expect(stdout).not.toContain('ERR_UNKNOWN_COMMAND');
	});
});
