/**
 * @file Colocated tests for `runCodemods` — the core-registry runner.
 *
 * ## Ported case count
 *
 * Upstream has 6; 6 here, all live. The registry being empty does not reach
 * this suite: every case builds its own `versionManifests` literal, which is
 * what the runner takes, so the runner is fully exercisable without a single
 * registered version.
 *
 * Adaptations, all mechanical: `astryx.config.*` → `astryx-svelte.config.*`,
 * `a.tsx` → `a.svelte`, and `runCodemods` takes a `parse` where upstream
 * imported jscodeshift internally. One assertion changed rather than moved —
 * upstream's config-codemod case asserts `typeof api.jscodeshift === 'function'`
 * to prove the unified `(file, api)` contract is wired; here the same case
 * asserts the pair that replaced it, `api.magicString` and `api.parseSvelte`,
 * and that `api.jscodeshift` is `undefined` (present for authoring-contract
 * parity, never populated).
 */

import { afterEach, beforeEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { runCodemods } from '../runner.mjs';
import { tryLoadSvelteParse } from '../svelte-parser.mjs';

let tmpDir;
let originalCwd;
/** @type {import('../svelte-parser.mjs').SvelteParse} */
let parse;

beforeAll(async () => {
	parse = /** @type {import('../svelte-parser.mjs').SvelteParse} */ (await tryLoadSvelteParse());
	expect(parse).toBeTypeOf('function');
});

beforeEach(() => {
	originalCwd = process.cwd();
	// Repo-local temp dir (not /tmp) to mirror the integration-runner tests and
	// avoid any Vite dynamic-import quirks with absolute /tmp paths.
	tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-runner-test-'));
	process.chdir(tmpDir);
});

afterEach(() => {
	process.chdir(originalCwd);
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('runCodemods — unified config codemod path', () => {
	it('routes a core config codemod through the (file, api) runner to edit astryx-svelte.config.*', async () => {
		fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'consumer' }));
		fs.writeFileSync(
			path.join(tmpDir, 'astryx-svelte.config.mjs'),
			`export default { theme: 'old-theme' };\n`
		);

		// A synthetic CORE registry transform marked as a config codemod via
		// meta.codemodType === 'config'. It authors against the unified
		// (file, api) => string contract every codemod in this CLI uses.
		const versionManifests = [
			{
				version: '0.1.3',
				transforms: [
					{
						name: 'synthetic-config-codemod',
						meta: {
							title: 'Synthetic config codemod',
							codemodType: 'config'
						},
						transform: (file, api) => {
							// Exercise the unified (file, api) contract: api carries the
							// editing + parsing pair, and the transform returns the rewritten
							// source string (or null/undefined for no-op).
							expect(typeof api.magicString).toBe('function');
							expect(typeof api.parseSvelte).toBe('function');
							expect(api.jscodeshift).toBeUndefined();
							return file.source.replace('old-theme', 'new-theme');
						}
					}
				]
			}
		];

		const result = await runCodemods(versionManifests, {
			apply: true,
			path: './src',
			parse,
			silent: true
		});

		expect(result.errors).toHaveLength(0);
		expect(result.totalFilesChanged).toBe(1);
		expect(fs.readFileSync(path.join(tmpDir, 'astryx-svelte.config.mjs'), 'utf-8')).toContain(
			'new-theme'
		);
	});

	it('surfaces a findConfigPath throw (multiple config files) as a structured error, not a crash', async () => {
		fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'consumer' }));
		// Two config files → findConfigPath throws. Config codemods run before the
		// strict project loader, so an uncaught throw here would abort the whole
		// upgrade. It must degrade to a structured error and let the run continue.
		fs.writeFileSync(
			path.join(tmpDir, 'astryx-svelte.config.ts'),
			`export default { theme: 'x' };\n`
		);
		fs.writeFileSync(
			path.join(tmpDir, 'astryx-svelte.config.js'),
			`export default { theme: 'x' };\n`
		);
		const srcDir = path.join(tmpDir, 'src');
		fs.mkdirSync(srcDir);
		fs.writeFileSync(path.join(srcDir, 'a.svelte'), '<p>const a = 1</p>\n');

		const versionManifests = [
			{
				version: '0.1.3',
				transforms: [
					{
						name: 'cfg',
						meta: { title: 'cfg', codemodType: 'config' },
						transform: () => null
					},
					// A code codemod that MUST still run after the config one fails.
					{
						name: 'code-after',
						meta: { title: 'code after' },
						transform: (file) =>
							file.source.includes('const a')
								? file.source.replace('const a', 'const b')
								: undefined
					}
				]
			}
		];

		// Must NOT throw; the multi-config problem is surfaced as a structured
		// error, and the subsequent code codemod is still reached.
		const result = await runCodemods(versionManifests, {
			apply: false,
			path: './src',
			parse,
			silent: true
		});
		expect(result.errors.some((e) => /Multiple Astryx config files/.test(e.error))).toBe(true);
		expect(result.totalFilesChanged).toBe(1); // code-after previewed a change
	});

	it('still runs core code codemods against source files', async () => {
		const srcDir = path.join(tmpDir, 'src');
		fs.mkdirSync(srcDir);
		fs.writeFileSync(path.join(srcDir, 'a.ts'), 'const foo = 1;\n');

		const versionManifests = [
			{
				version: '0.1.3',
				transforms: [
					{
						name: 'synthetic-code-codemod',
						meta: { title: 'Synthetic code codemod' },
						transform: (file) => file.source.replace(/foo/g, 'bar')
					}
				]
			}
		];

		const result = await runCodemods(versionManifests, {
			apply: true,
			path: './src',
			parse,
			silent: true
		});

		expect(result.errors).toHaveLength(0);
		expect(result.totalFilesChanged).toBe(1);
		expect(fs.readFileSync(path.join(srcDir, 'a.ts'), 'utf-8')).toContain('const bar = 1');
		// writtenFiles must be returned (consumed by api/upgrade/run to feed the
		// post-codemod formatting/lint hooks). Regression guard: it was previously
		// built internally but omitted from the return object, so hooks received an
		// empty file list and silently skipped, leaving codemod output unformatted.
		expect(result.writtenFiles).toEqual([path.join(srcDir, 'a.ts')]);
	});

	it('returns writtenFiles for every changed file (post-codemod hook input)', async () => {
		const srcDir = path.join(tmpDir, 'src');
		fs.mkdirSync(srcDir);
		fs.writeFileSync(path.join(srcDir, 'a.ts'), 'const foo = 1;\n');
		fs.writeFileSync(path.join(srcDir, 'b.ts'), 'const foo = 2;\n');
		fs.writeFileSync(path.join(srcDir, 'c.ts'), 'const untouched = 3;\n');

		const versionManifests = [
			{
				version: '0.1.3',
				transforms: [
					{
						name: 'synthetic-code-codemod',
						meta: { title: 'Synthetic code codemod' },
						transform: (file) => file.source.replace(/foo/g, 'bar')
					}
				]
			}
		];

		const result = await runCodemods(versionManifests, {
			apply: true,
			path: './src',
			parse,
			silent: true
		});

		expect(result.totalFilesChanged).toBe(2);
		// Only the two files that actually changed are reported (not c.ts).
		expect([...result.writtenFiles].sort()).toEqual(
			[path.join(srcDir, 'a.ts'), path.join(srcDir, 'b.ts')].sort()
		);
	});
});

describe('findSourceFiles — scan boundaries (symlink + build dirs)', () => {
	const manifests = [
		{
			version: '0.1.3',
			transforms: [
				{
					name: 'p',
					meta: { title: 'p' },
					transform: (f) => f.source.replace(/foo/g, 'bar')
				}
			]
		}
	];

	it('does not follow a symlinked file out of the scan tree', async () => {
		const outside = path.join(tmpDir, 'outside');
		fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
		fs.mkdirSync(outside, { recursive: true });
		const secret = path.join(outside, 'secret.ts');
		fs.writeFileSync(secret, 'const foo = 1;\n');
		fs.writeFileSync(path.join(tmpDir, 'src', 'real.ts'), 'const foo = 2;\n');
		fs.symlinkSync(secret, path.join(tmpDir, 'src', 'link.ts'));

		const r = await runCodemods(manifests, { apply: true, path: './src', parse, silent: true });
		// the symlink target (outside the tree) must be untouched
		expect(fs.readFileSync(secret, 'utf-8')).toBe('const foo = 1;\n');
		expect(r.writtenFiles.map((f) => path.basename(f))).toEqual(['real.ts']);
	});

	it('does not scan generated-output dirs (dist/build/out)', async () => {
		fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
		fs.mkdirSync(path.join(tmpDir, 'dist'), { recursive: true });
		fs.mkdirSync(path.join(tmpDir, 'build'), { recursive: true });
		fs.writeFileSync(path.join(tmpDir, 'src', 'a.ts'), 'const foo = 1;\n');
		fs.writeFileSync(path.join(tmpDir, 'dist', 'b.js'), 'const foo = 2;\n');
		fs.writeFileSync(path.join(tmpDir, 'build', 'c.js'), 'const foo = 3;\n');

		const r = await runCodemods(manifests, { apply: true, path: '.', parse, silent: true });
		expect(r.writtenFiles.map((f) => path.basename(f))).toEqual(['a.ts']);
		expect(fs.readFileSync(path.join(tmpDir, 'dist', 'b.js'), 'utf-8')).toContain('foo');
	});
});
