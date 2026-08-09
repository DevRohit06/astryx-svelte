/**
 * @file Upgrade config-codemod-ordering tests.
 *
 * Verifies that CORE codemods run BEFORE the consumer's config is loaded, so a
 * config codemod (`meta.codemodType === 'config'`) can repair an otherwise-
 * invalid config that strict `Project.load` would reject.
 *
 * ## Ported case count
 *
 * Upstream has 5; 5 here, **2 live and 3 `it.todo`**, and the split falls
 * exactly along "does this case need a CORE config codemod to exist?".
 *
 * The `config_fixable` status is gated on `hasCoreConfigCodemod` — an
 * *integration* config codemod deliberately does not open it, because
 * integrations are skipped for the preview and their codemods run only on the
 * `--apply` pass. So the three cases that drive upstream's v0.1.3
 * `migrate-layout-components-to-experimental` have no substitute here: this
 * port's core codemod registry is empty (see `assets/codemods/registry.mjs`),
 * and faking one with an integration codemod would test a different branch
 * while keeping the case's name. **Unblocked by this port's second release.**
 *
 * The two that survive are the ones the ordering guard actually protects
 * against, and neither needs a codemod: a genuinely invalid config still
 * aborts, and a valid config still completes.
 *
 * Repo-local temp dirs, as upstream: the fixtures dynamically import a config
 * module.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from 'commander';
import { registerUpgrade } from './upgrade.mjs';

let tmpDir;
let originalCwd;
let logCalls;
let stdoutCalls;
let exitCode;

beforeEach(() => {
	originalCwd = process.cwd();
	tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-upgrade-order-'));
	process.chdir(tmpDir);
	logCalls = [];
	stdoutCalls = [];
	exitCode = undefined;
	vi.spyOn(console, 'log').mockImplementation((...a) => logCalls.push(a.join(' ')));
	// Warnings/errors go to stderr (console.error) — capture them too so the
	// human-output assertions see guidance lines regardless of channel.
	vi.spyOn(console, 'error').mockImplementation((...a) => logCalls.push(a.join(' ')));
	vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
		stdoutCalls.push(typeof chunk === 'string' ? chunk : chunk.toString());
		return true;
	});
	vi.spyOn(process, 'exit').mockImplementation((code) => {
		exitCode = code;
		throw new Error(`__exit ${code}`);
	});
});

afterEach(() => {
	process.chdir(originalCwd);
	fs.rmSync(tmpDir, { recursive: true, force: true });
	vi.restoreAllMocks();
});

function writePkg() {
	fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'consumer' }));
}

function writeInstalledCore(version) {
	const dir = path.join(tmpDir, 'node_modules', '@astryx-svelte', 'core');
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, 'package.json'),
		JSON.stringify({ name: '@astryx-svelte/core', version })
	);
}

function writeConfig(body) {
	fs.writeFileSync(path.join(tmpDir, 'astryx-svelte.config.mjs'), body);
}

function writeSource() {
	fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
	fs.writeFileSync(path.join(tmpDir, 'src', 'index.ts'), 'const foo = 1;\n');
}

function createProgram() {
	const program = new Command();
	program.exitOverride();
	program.option('--json', 'Output as typed JSON');
	registerUpgrade(program);
	return program;
}

async function runJson(args) {
	const program = createProgram();
	try {
		await program.parseAsync(['node', 'astryx-svelte', ...args]);
	} catch (err) {
		if (!String(err?.message || '').startsWith('__exit')) throw err;
	}
	for (let i = logCalls.length - 1; i >= 0; i--) {
		const line = logCalls[i];
		if (line.startsWith('{')) {
			try {
				return JSON.parse(line);
			} catch {
				// keep looking
			}
		}
	}
	return null;
}

describe('upgrade — core codemods run before config load', () => {
	// Needs a CORE config codemod in range — see the file header. Unblocked by
	// this port's second release.
	it.todo('dry-run: a legacy config shape is reported as fixable, not an abort');

	it.todo('human dry-run prints the fixable guidance + suggested command');

	it.todo('--apply: core config codemod repairs the config, then the upgrade completes');

	it('dry-run: a genuinely invalid config with NO fixing codemod still aborts', async () => {
		writePkg();
		writeInstalledCore('0.1.3');
		// `integrations: 5` is invalid AND no config codemod in 0.1.2->0.1.3 fixes it.
		writeConfig(`export default { integrations: 5 };\n`);
		writeSource();

		const result = await runJson(['--json', 'upgrade', '--from', '0.1.2', '--path', 'src']);

		expect(result).not.toBeNull();
		// Aborts with a config-validation error (not the fixable status).
		expect(result.error).toBeTruthy();
		expect(result.type).not.toBe('upgrade.status');
		expect(exitCode).toBe(1);
	});

	it('happy path: valid config with no config codemod behaves normally', async () => {
		writePkg();
		writeInstalledCore('0.1.3');
		// A valid, already-migrated config; no relocation needed.
		writeConfig(`export default { integrations: [] };\n`);
		writeSource();

		const result = await runJson([
			'--json',
			'upgrade',
			'--from',
			'0.1.2',
			'--path',
			'src',
			'--apply'
		]);

		expect(result).not.toBeNull();
		expect(result.error).toBeUndefined();
		expect(exitCode).not.toBe(1);
		// Upstream ends on `upgrade.run` because its 0.1.2 → 0.1.3 range has
		// codemods. Ours is empty and no integration contributes one, so the
		// pipeline resolves to the no_codemods status — which is the same
		// "behaves normally, does not abort on the config" property, reached one
		// short-circuit earlier.
		expect(result.type).toBe('upgrade.status');
		expect(result.data.status).toBe('no_codemods');
	});
});
