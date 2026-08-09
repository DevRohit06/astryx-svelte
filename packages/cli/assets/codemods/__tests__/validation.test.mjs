/**
 * @file Colocated tests for `validateOutput` — the guard that stands between a
 * codemod's output and the disk.
 *
 * ## Ported case count
 *
 * Upstream has 13 across two describes: **6 for `validateOutput`, all 6 ported
 * here**, and **7 for `fixDirectiveCorruption`, none of them**. That second
 * block is not deferred, it is refused, and the reason is the function's own
 * upstream comment: it repairs a bug in `jscodeshift`'s `toSource()`, which
 * "double-prints the semicolon on directive prologues". There is no
 * `toSource()` in this runner — `magic-string` splices the original buffer
 * rather than re-printing an AST — so the defect cannot occur, the function does
 * not exist, and porting its seven cases would mean porting a fix for a printer
 * this port does not have. The dropped names, for the record:
 *
 *   fixes double semicolon on use client / use server / use strict,
 *   handles double-quoted directives, does not modify correct directives,
 *   does not modify double semicolons elsewhere, handles whitespace between
 *   semicolons.
 *
 * The 6 that are ported are refixtured onto inputs this parser can actually
 * read: `.svelte` where upstream used TSX, `.ts` where it used plain JS. The
 * property each asserts is unchanged.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { validateOutput } from '../runner.mjs';
import { tryLoadSvelteParse } from '../svelte-parser.mjs';

/** @type {import('../svelte-parser.mjs').SvelteParse} */
let parse;

beforeAll(async () => {
	parse = /** @type {import('../svelte-parser.mjs').SvelteParse} */ (await tryLoadSvelteParse());
	expect(parse).toBeTypeOf('function');
});

describe('validateOutput', () => {
	it('accepts valid transformed output', () => {
		const source = '<Button variant="primary" />';
		const result = '<Button container="primary" />';
		expect(validateOutput(result, source, { parse, ext: '.svelte' })).toEqual({ valid: true });
	});

	it('rejects output with syntax errors', () => {
		const source = 'const x = 1;';
		const result = 'const x = {{{;';
		const validation = validateOutput(result, source, { parse, ext: '.ts' });
		expect(validation.valid).toBe(false);
		expect(validation.reason).toMatch(/unparseable/);
	});

	it('rejects [native code] corruption in parseable output', () => {
		// Syntactically valid, but carries the corruption marker.
		const source = 'const name = "toString";';
		const result = 'const name = "[native code] toString";';
		const validation = validateOutput(result, source, { parse, ext: '.ts' });
		expect(validation.valid).toBe(false);
		expect(validation.reason).toMatch(/corruption/);
	});

	it('allows pre-existing [native code] strings', () => {
		const source = 'const msg = "[native code] is a thing";';
		const result = 'const msg = "[native code] is a thing";\nconst x = 1;';
		expect(validateOutput(result, source, { parse, ext: '.ts' })).toEqual({ valid: true });
	});

	it('catches prototype pollution that produces unparseable output', () => {
		const source = [
			"import {lineHeightVars} from '@astryx-svelte/core/tokens';",
			'const x = someValue.toString();',
			''
		].join('\n');
		// Buggy codemod replaces the toString identifier with the native fn string.
		const result = [
			"import {typeScaleVars} from '@astryx-svelte/core/tokens';",
			'const x = someValue.function toString() { [native code] }();',
			''
		].join('\n');
		const validation = validateOutput(result, source, { parse, ext: '.ts' });
		expect(validation.valid).toBe(false);
		// Could fail on parse OR corruption pattern — either is correct
		expect(validation.reason).toMatch(/unparseable|corruption|native/i);
	});

	it('rejects when new [native code] appears even if parseable', () => {
		const source = 'const x = "hello";';
		// Someone somehow produced valid JS with [native code] in a string
		const result = 'const x = "function toString() { [native code] }";';
		const validation = validateOutput(result, source, { parse, ext: '.ts' });
		expect(validation.valid).toBe(false);
		expect(validation.reason).toMatch(/corruption/);
	});
});
