/**
 * @file Upgrade integration error-policy + --skip-codemod tests.
 *
 * These scaffold a real consumer project (astryx-svelte.config.mjs + an
 * installed integration package with codemods) under a repo-local temp dir and
 * chdir in. They assert:
 *   - a broken integration codemod definition is SKIPPED (warned), not a hard
 *     fail of the upgrade;
 *   - --skip-codemod excludes a named integration codemod.
 *
 * ## Ported case count
 *
 * Upstream has 3; 3 here, all live. Integration codemods need no core registry,
 * so this is the one upgrade suite the empty registry does not touch.
 *
 * **One fixture is strengthened rather than copied**, and the reason is that
 * copying it would have made the case pass for the wrong reason.
 * `--skip-codemod` on upstream's single-codemod fixture still leaves core
 * codemods to run; here it would leave *nothing*, and `run` correctly treats
 * "every selected codemod was filtered out" as `ERR_UNKNOWN_CODEMOD`. The
 * source would be unchanged — upstream's assertion — but because the upgrade
 * aborted, not because the codemod was skipped. So the fixture contributes
 * **two** codemods and the case asserts the skipped one did not run *and the
 * other one did*, which is a strictly stronger statement than upstream's.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from 'commander';
import { registerUpgrade } from './upgrade.mjs';

let tmpDir;
let originalCwd;
let logCalls;
let errCalls;
let exitCode;

beforeEach(() => {
	originalCwd = process.cwd();
	tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-upgrade-policy-'));
	process.chdir(tmpDir);
	logCalls = [];
	errCalls = [];
	exitCode = undefined;
	vi.spyOn(console, 'log').mockImplementation((...a) => logCalls.push(a.join(' ')));
	vi.spyOn(console, 'error').mockImplementation((...a) => errCalls.push(a.join(' ')));
	vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
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

function writeInstalledCore(version) {
	const dir = path.join(tmpDir, 'node_modules', '@astryx-svelte', 'core');
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, 'package.json'),
		JSON.stringify({ name: '@astryx-svelte/core', version })
	);
}

function writeSource() {
	fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
	fs.writeFileSync(path.join(tmpDir, 'src', 'index.ts'), 'const foo = 1;\n');
}

/**
 * Scaffold a consumer + an installed integration package with codemods.
 * @param {Object<string,string>} codemodFiles "<version>/<id>.mjs" -> body
 */
function scaffoldIntegration(codemodFiles) {
	fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'consumer' }));
	fs.writeFileSync(
		path.join(tmpDir, 'astryx-svelte.config.mjs'),
		`export default { integrations: ['@acme/widgets'] };\n`
	);
	const pkgDir = path.join(tmpDir, 'node_modules', '@acme', 'widgets');
	fs.mkdirSync(pkgDir, { recursive: true });
	fs.writeFileSync(
		path.join(pkgDir, 'package.json'),
		JSON.stringify({ name: '@acme/widgets', version: '1.0.0' })
	);
	fs.writeFileSync(
		path.join(pkgDir, 'astryx-svelte.integration.mjs'),
		`export default { codemods: './codemods' };\n`
	);
	for (const [rel, body] of Object.entries(codemodFiles)) {
		const full = path.join(pkgDir, 'codemods', rel);
		fs.mkdirSync(path.dirname(full), { recursive: true });
		fs.writeFileSync(full, body);
	}
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

describe('upgrade integration error policy (skip + warn)', () => {
	it('SKIPS a broken integration codemod instead of hard-failing the upgrade', async () => {
		// A codemod module whose default export is not a valid codemod result —
		// a DEFINITION error. The upgrade must NOT abort; it skips the broken
		// integration's codemods and completes.
		scaffoldIntegration({
			'0.2.0/bad.mjs': `export default { not: 'a codemod' };\n`
		});
		writeInstalledCore('0.2.0');
		writeSource();

		const result = await runJson(['--json', 'upgrade', '--from', '0.1.0', '--path', 'src']);

		// Did NOT hard-fail: no error envelope, and it ran to a status/run result.
		expect(result).not.toBeNull();
		expect(result.error).toBeUndefined();
		expect(exitCode).not.toBe(1);
	});

	it('runs a healthy integration codemod for an applicable range', async () => {
		scaffoldIntegration({
			'0.2.0/drop-foo.mjs': `export default { type: 'code', title: 'Drop foo', transform: (file) => file.source.replace(/foo/g, 'bar') };\n`
		});
		writeInstalledCore('0.2.0');
		writeSource();

		const result = await runJson([
			'--json',
			'upgrade',
			'--from',
			'0.1.0',
			'--path',
			'src',
			'--apply'
		]);
		expect(result).not.toBeNull();
		expect(result.error).toBeUndefined();
		// The codemod rewrote foo -> bar.
		const out = fs.readFileSync(path.join(tmpDir, 'src', 'index.ts'), 'utf-8');
		expect(out).toContain('bar');
	});

	it('--skip-codemod excludes a named integration codemod', async () => {
		// Two codemods, so the skip is proven positively — see the file header.
		scaffoldIntegration({
			'0.2.0/drop-foo.mjs': `export default { type: 'code', title: 'Drop foo', transform: (file) => file.source.replace(/foo/g, 'bar') };\n`,
			'0.2.0/add-marker.mjs': `export default { type: 'code', title: 'Add marker', transform: (file) => file.source + '// marker\\n' };\n`
		});
		writeInstalledCore('0.2.0');
		writeSource();

		const result = await runJson([
			'--json',
			'upgrade',
			'--from',
			'0.1.0',
			'--path',
			'src',
			'--apply',
			'--skip-codemod',
			'drop-foo'
		]);
		expect(result).not.toBeNull();
		expect(result.error).toBeUndefined();
		const out = fs.readFileSync(path.join(tmpDir, 'src', 'index.ts'), 'utf-8');
		// Skipped: the source is unchanged (foo not rewritten to bar)…
		expect(out).toContain('foo');
		expect(out).not.toContain('bar');
		// …while the codemod that was NOT skipped still ran, so the run reached
		// execution rather than aborting on "no codemods left".
		expect(out).toContain('// marker');
	});
});
