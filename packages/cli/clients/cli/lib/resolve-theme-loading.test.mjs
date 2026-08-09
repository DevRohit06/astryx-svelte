/**
 * @file BEYOND UPSTREAM — pins the loader `resolveTheme` had to grow, and the
 * two failures that forced it.
 *
 * Upstream's `resolve-theme.test.mjs` (ported verbatim beside this file) asserts
 * only that a malformed `astryx.theme` degrades to `null`. It has no positive
 * case, because upstream's themes are plain token objects that `createRequire()`
 * loads without ceremony. Ported verbatim, that suite passes here **while
 * `resolveTheme` resolves nothing at all** — `tryLoadModule`'s bare catch turns
 * a resolution failure into "no theme configured", so every assertion still
 * reads `null` and every one of them is right for the wrong reason.
 *
 * That is a hazard with no upstream analogue (its cause is a `.svelte` import in
 * a theme package's entry) which the ported suite structurally cannot catch, so
 * this file exists under CLAUDE.md's bar for coverage beyond upstream. Three of
 * its four cases assert the *failures* rather than the fix, deliberately: they
 * are what makes the fourth meaningful, and they fail loudly if a future change
 * to the theme packages removes the constraint the `./tokens` subpath exists for
 * — at which point this file, not folklore, is what says so.
 *
 * Mutation-checked: pointing `tryLoadModule`'s package branch at the main entry
 * instead of `<pkg>/tokens` fails "resolves a bundled theme package by bare
 * name" and nothing else.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTheme } from './resolve-theme.mjs';

const dirs = [];
/** An empty project dir — no package.json, so only ASTRYX_THEME is consulted. */
function emptyProject() {
	const d = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-theme-load-'));
	dirs.push(d);
	return d;
}
afterEach(() => {
	delete process.env.ASTRYX_THEME;
	while (dirs.length) fs.rmSync(dirs.pop(), { recursive: true, force: true });
});

describe('resolveTheme — this port’s theme packages really load', () => {
	it('resolves a bundled theme package by bare name', async () => {
		process.env.ASTRYX_THEME = 'neutral';
		const theme = await resolveTheme(emptyProject());
		expect(theme).not.toBeNull();
		expect(theme?.name).toBe('neutral');
	});

	it('resolves a relative theme file, TypeScript included', async () => {
		const dir = emptyProject();
		fs.writeFileSync(
			path.join(dir, 'mine.ts'),
			`export const mineTheme = { name: 'mine', tokens: { '--color-bg': '#fff' } };\n`
		);
		process.env.ASTRYX_THEME = './mine.ts';
		const theme = await resolveTheme(dir);
		expect(theme?.name).toBe('mine');
	});
});

describe('resolveTheme — the two loaders that do not work here', () => {
	it("require() cannot reach a theme package: no 'require' condition is exported", () => {
		const req = createRequire(import.meta.url);
		expect(() => req('@astryx-svelte/theme-neutral')).toThrowError(
			expect.objectContaining({ code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' })
		);
	});

	it("import() of a theme's main entry hits the .svelte icon registry", () => {
		// Deliberately a real `node` child rather than an inline `import()`: under
		// Vitest the specifier goes through Vite's module runner, which parses
		// `.svelte` itself and fails with a plugin error. The claim being pinned is
		// about plain Node, so plain Node has to be the thing that answers.
		const probe = `import('@astryx-svelte/theme-neutral').then(() => console.log('LOADED'), e => console.log(e.code));`;
		const out = execFileSync(process.execPath, ['--input-type=module', '-e', probe], {
			cwd: path.dirname(fileURLToPath(import.meta.url)),
			encoding: 'utf-8'
		}).trim();
		expect(out).toBe('ERR_UNKNOWN_FILE_EXTENSION');
	});
});
