/**
 * Direct API tests for `upgrade()` — the programmatic surface
 * (`@astryx-svelte/cli/api`).
 *
 * The CLI suites (clients/cli/commands/upgrade*.test.mjs) drive `registerUpgrade`
 * and cover behavior end-to-end; these assert the API contract you get when
 * calling `upgrade()` in code: the typed receipt shape, thrown AstryxError
 * codes, that it honors the `cwd` option for detection/agent-docs, and that it
 * stays SILENT under the default logger (no console spam for a scripted caller).
 *
 * ## Ported case count
 *
 * Upstream has 9; 9 here, all live. Three carry a fixture or assertion change,
 * each forced by the empty core codemod registry (see
 * `assets/codemods/registry.mjs`) and named at its case:
 *
 *   - `returns upgrade.list …` asserts the list is `[]` rather than non-empty.
 *   - `returns upgrade.run for an applicable range` gets an **integration**
 *     codemod in its fixture, which is what makes `upgrade.run` reachable at
 *     all — without one the pipeline correctly short-circuits to
 *     `upgrade.status`/`no_codemods` and the case would not be about a run.
 *   - `scans the cwd source tree` keeps upstream's log assertion (the core
 *     runner emits its `Scanning …` line even for an empty manifest list, so
 *     the property is live) and only relaxes the envelope it ends on.
 *
 * Temp dirs are repo-local rather than under the OS temp dir, matching the rest
 * of this port's CLI suites: the fixtures dynamically import a config and an
 * integration manifest, and keeping every such suite on one convention is worth
 * more than matching upstream's `os.tmpdir()`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { upgrade } from './upgrade.mjs';
import { logger } from '../logger.mjs';
import { AstryxError } from '../error.mjs';
import { ERROR_CODES } from '../../foundation/response/error-codes.mjs';
import { generateCompressedIndex } from '../../foundation/agent-docs/agent-docs.mjs';

vi.setConfig({ testTimeout: 30000 });

let tmpDir;
let originalCwd;

beforeEach(() => {
	originalCwd = process.cwd();
	tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-upgrade-api-'));
});

afterEach(() => {
	process.chdir(originalCwd);
	fs.rmSync(tmpDir, { recursive: true, force: true });
	vi.restoreAllMocks();
	logger.setSilent(true);
});

function writePkg(dir, deps = {}) {
	fs.writeFileSync(
		path.join(dir, 'package.json'),
		JSON.stringify({ name: 'fixture', dependencies: deps }, null, 2)
	);
}

function writeInstalledCore(dir, version) {
	const d = path.join(dir, 'node_modules', '@astryx-svelte', 'core');
	fs.mkdirSync(d, { recursive: true });
	fs.writeFileSync(
		path.join(d, 'package.json'),
		JSON.stringify({ name: '@astryx-svelte/core', version }, null, 2)
	);
}

function writeAgentBlock(dir, rel, version) {
	fs.writeFileSync(path.join(dir, rel), `# Doc\n\n${generateCompressedIndex(version)}\n`);
}

/**
 * An installed integration package contributing one `0.0.15` code codemod.
 * The core registry is empty, so an integration codemod is the only way a run
 * receipt (rather than a status short-circuit) can be produced today.
 */
function writeIntegration(dir) {
	fs.writeFileSync(
		path.join(dir, 'astryx-svelte.config.mjs'),
		`export default { integrations: ['@acme/widgets'] };\n`
	);
	const pkgDir = path.join(dir, 'node_modules', '@acme', 'widgets');
	fs.mkdirSync(path.join(pkgDir, 'codemods', '0.0.15'), { recursive: true });
	fs.writeFileSync(
		path.join(pkgDir, 'package.json'),
		JSON.stringify({ name: '@acme/widgets', version: '1.0.0' })
	);
	fs.writeFileSync(
		path.join(pkgDir, 'astryx-svelte.integration.mjs'),
		`export default { codemods: './codemods' };\n`
	);
	fs.writeFileSync(
		path.join(pkgDir, 'codemods', '0.0.15', 'drop-foo.mjs'),
		`export default {type: 'code', title: 'Drop foo', transform: (file) => file.source.replace(/foo/g, 'bar')};\n`
	);
}

describe('upgrade() — receipts', () => {
	it('returns upgrade.list without touching cwd', async () => {
		const res = await upgrade({ list: true });
		expect(res.type).toBe('upgrade.list');
		expect(Array.isArray(res.data)).toBe(true);
		// Upstream asserts a non-empty list, and so does this now. It asserted `[]`
		// until the v0.4.0 manifest landed — `latestVersion` is the registry's max
		// version, so `collectAllCodemods` went non-empty the moment a transform was
		// registered, and this case had been failing unnoticed ever since because
		// CI was dying at Typecheck before it could run.
		expect(res.data.map((c) => c.name)).toEqual([
			'rename-dropdown-menu-radio-dot-target',
			'migrate-table-rowexpansion-to-tree',
			'rename-menu-divider-data-types'
		]);
		// The public list entry is the stripped shape (no `pr`).
		for (const entry of res.data) {
			expect(entry).toHaveProperty('name');
			expect(entry).toHaveProperty('title');
			expect(entry).toHaveProperty('version');
			expect(entry).not.toHaveProperty('pr');
		}
	});

	it('honors cwd: refreshes a stale agent-docs block on the up-to-date path (--apply)', async () => {
		// from == installed → up_to_date short-circuit (returns before the codemod
		// runner), so this exercises detection + agent-docs purely via the cwd
		// option, with NO process.chdir.
		writePkg(tmpDir);
		writeInstalledCore(tmpDir, '0.0.15');
		writeAgentBlock(tmpDir, 'AGENTS.md', '0.0.1');

		const res = await upgrade({ from: '0.0.15', apply: true }, { cwd: tmpDir });

		expect(res.type).toBe('upgrade.status');
		expect(res.data.status).toBe('up_to_date');
		expect(res.data.from).toBe('0.0.15');
		expect(res.data.to).toBe('0.0.15');
		expect(res.data.agentDocs.action).toBe('refreshed');
		expect(res.data.agentDocs.refreshed).toBe(true);
		expect(res.data.agentDocs.files).toContain('AGENTS.md');
		// The file at the *cwd* fixture was rewritten to the installed version.
		const content = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8');
		expect(content).toMatch(/Astryx v0\.0\.15 ·/);
		expect(content).not.toMatch(/Astryx v0\.0\.1 ·/);
	});

	it('reports would-refresh on a dry run without writing (honors cwd)', async () => {
		writePkg(tmpDir);
		writeInstalledCore(tmpDir, '0.0.15');
		writeAgentBlock(tmpDir, 'AGENTS.md', '0.0.1');
		const before = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8');

		const res = await upgrade({ from: '0.0.15' }, { cwd: tmpDir });

		expect(res.data.status).toBe('up_to_date');
		expect(res.data.agentDocs.action).toBe('would-refresh');
		expect(res.data.agentDocs.refreshed).toBe(false);
		expect(fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8')).toBe(before);
	});

	it('returns upgrade.run for an applicable range', async () => {
		// Integration loading resolves specs against process.cwd() (upstream's
		// behavior, replicated), so chdir into the fixture.
		writePkg(tmpDir);
		writeInstalledCore(tmpDir, '0.0.15');
		writeIntegration(tmpDir);
		fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
		fs.writeFileSync(path.join(tmpDir, 'src', 'index.ts'), 'const foo = 1;\n');
		process.chdir(tmpDir);

		const res = await upgrade({ from: '0.0.1', apply: false, path: 'src' }, { cwd: tmpDir });

		expect(res.type).toBe('upgrade.run');
		expect(res.data.from).toBe('0.0.1');
		expect(res.data.to).toBe('0.0.15');
		expect(typeof res.data.codemods).toBe('number');
		expect(res.data.agentDocs).toBeDefined();
	});
});

describe('upgrade() — honors cwd for codemod scanning (no chdir)', () => {
	it('scans the cwd source tree, not process.cwd()', async () => {
		// Fixture lives in tmpDir; process.cwd() stays the package root (NO chdir).
		// The codemod runner resolves --path against the API cwd, so it must scan
		// tmpDir/src — regression guard for the earlier process.cwd()-relative bug.
		writePkg(tmpDir);
		writeInstalledCore(tmpDir, '0.0.15');
		fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
		fs.writeFileSync(path.join(tmpDir, 'src', 'index.ts'), 'const x = 1;\n');

		// Capture stdout: the runner logs the directory it scans. Enabling the
		// shared logger keeps the runner non-silent so its scan line is emitted.
		const out = [];
		vi.spyOn(console, 'log').mockImplementation((...a) => out.push(a.join(' ')));
		vi.spyOn(process.stdout, 'write').mockImplementation((c) => {
			out.push(typeof c === 'string' ? c : c.toString());
			return true;
		});
		logger.setSilent(false);

		const res = await upgrade({ from: '0.0.1', apply: false, path: 'src' }, { cwd: tmpDir });

		const joined = out.join('\n');
		// Upstream ends on `upgrade.run` because its registry has codemods in
		// (0.0.1, 0.0.15]; ours is empty and no integration is configured here, so
		// the pipeline correctly resolves to the no_codemods status. The scan still
		// happens either way — `runCoreCodemods` is called before the short-circuit
		// — which is the property this case is about.
		expect(res.type).toBe('upgrade.status');
		// Scanned the cwd tree…
		expect(joined).toContain(path.join(tmpDir, 'src'));
		// …and did NOT report the path missing (which is what the old,
		// process.cwd()-relative resolution produced here).
		expect(joined).not.toMatch(/Source path not found/);
	});
});

describe('upgrade() — errors throw AstryxError', () => {
	it('missing --from → ERR_INVALID_ARGUMENT', async () => {
		writePkg(tmpDir);
		writeInstalledCore(tmpDir, '0.0.15');
		await expect(upgrade({}, { cwd: tmpDir })).rejects.toMatchObject({
			name: 'AstryxError',
			code: ERROR_CODES.ERR_INVALID_ARGUMENT
		});
		await expect(upgrade({}, { cwd: tmpDir })).rejects.toThrow(/Missing required --from/);
	});

	it('invalid --from → ERR_INVALID_VERSION', async () => {
		writePkg(tmpDir);
		writeInstalledCore(tmpDir, '0.0.15');
		await expect(upgrade({ from: 'not-a-version' }, { cwd: tmpDir })).rejects.toMatchObject({
			code: ERROR_CODES.ERR_INVALID_VERSION
		});
	});

	it('no installed core → ERR_VERSION_DETECT (uses the cwd option to look)', async () => {
		// Empty cwd (no node_modules/@astryx-svelte/core) — detection must fail here,
		// proving the cwd option routes version detection.
		writePkg(tmpDir);
		const err = await upgrade({ from: '0.0.1' }, { cwd: tmpDir }).catch((e) => e);
		expect(err).toBeInstanceOf(AstryxError);
		expect(err.code).toBe(ERROR_CODES.ERR_VERSION_DETECT);
	});
});

describe('upgrade() — silent by default', () => {
	it('prints nothing to stdout when called programmatically', async () => {
		writePkg(tmpDir);
		writeInstalledCore(tmpDir, '0.0.15');
		writeAgentBlock(tmpDir, 'AGENTS.md', '0.0.1');

		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const outSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

		const res = await upgrade({ from: '0.0.15', apply: true }, { cwd: tmpDir });

		// The receipt still comes back…
		expect(res.data.agentDocs.action).toBe('refreshed');
		// …but a scripted caller sees zero human output (default silent logger).
		expect(logSpy).not.toHaveBeenCalled();
		expect(outSpy).not.toHaveBeenCalled();
		expect(errSpy).not.toHaveBeenCalled();
	});
});
