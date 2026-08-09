/**
 * @file Command-level tests for `docs`. Drives a bare Commander program with
 * only `registerDocs` on it, exactly as upstream does, so the assertions are
 * about the command's own rendering rather than the whole CLI shell.
 *
 * Ported case for case: 7/7. One assertion moved: upstream's migration case
 * looks for the section title "Map shadcn and Radix Primitives", and this
 * port's migration doc calls that section "Map shadcn-svelte and Bits UI
 * Primitives" — a Svelte app does not arrive from Radix. The case still asserts
 * the same thing (the deepest section of the longest doc rendered), against the
 * title that exists.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';
import { registerDocs } from './docs.mjs';

beforeEach(() => {
	vi.spyOn(console, 'log').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

function createProgram() {
	const program = new Command();
	program.exitOverride(); // Throw instead of calling process.exit
	registerDocs(program);
	return program;
}

/** @returns {string} */
function logged() {
	return /** @type {any} */ (console.log).mock.calls
		.map((/** @type {any[]} */ c) => c[0])
		.join('\n');
}

describe('registerDocs', () => {
	it('lists available topics when no topic given', async () => {
		const program = createProgram();
		await program.parseAsync(['node', 'astryx-svelte', 'docs']);

		const output = logged();
		expect(output).toContain('principles');
		expect(output).toContain('tokens');
	});

	it('errors for unknown topic', async () => {
		const program = createProgram();
		vi.spyOn(process, 'exit').mockImplementation((code) => {
			throw new Error(`exit ${code}`);
		});

		await expect(
			program.parseAsync(['node', 'astryx-svelte', 'docs', 'nonexistent'])
		).rejects.toThrow('exit 1');

		const errorOutput = /** @type {any} */ (console.error).mock.calls
			.map((/** @type {any[]} */ c) => c[0])
			.join('\n');
		expect(errorOutput).toContain('Unknown topic');
	});
});

describe('hyphenated doc filenames', () => {
	it('lists hyphenated topics like getting-started', async () => {
		const program = createProgram();
		await program.parseAsync(['node', 'astryx-svelte', 'docs']);

		expect(logged()).toContain('getting-started');
	});

	it('loads a hyphenated topic by name', async () => {
		const program = createProgram();
		await program.parseAsync(['node', 'astryx-svelte', 'docs', 'getting-started']);

		expect(logged().length).toBeGreaterThan(0);
		expect(console.error).not.toHaveBeenCalled();
	});

	it('returns docs.detail via API for hyphenated topic', async () => {
		const { docs: docsApi } = await import('../../../api/docs/docs.mjs');
		const result = await docsApi('getting-started');
		expect(result.type).toBe('docs.detail');
		expect(result.data).toBeDefined();
		expect(result.data.description).toBeDefined();
	});
});

describe('migration docs', () => {
	it('lists the migration topic', async () => {
		const program = createProgram();
		await program.parseAsync(['node', 'astryx-svelte', 'docs']);

		const output = logged();
		expect(output).toContain('migration');
		expect(output).toContain('Tailwind');
	});

	it('loads migration docs by topic name', async () => {
		const program = createProgram();
		await program.parseAsync(['node', 'astryx-svelte', 'docs', 'migration']);

		const output = logged();
		expect(output).toContain('Migration Guide');
		expect(output).toContain('Recommended Order');
		expect(output).toContain('Map shadcn-svelte and Bits UI Primitives');
	});
});
