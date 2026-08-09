/**
 * @file Colocated tests for the `doctor` leaf (api/doctor/doctor.mjs). Ported
 * case-for-case from upstream's `api/doctor/doctor.test.mjs` — 10 cases, 10
 * here. Locks the envelope shape and the summary invariant (the counts must
 * always add up to the number of checks).
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { doctor, checkVersionAlignment } from './doctor.mjs';

// api/doctor/ -> up 3 = packages/cli, up 4 = repo root (has packages/core).
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const cwd = REPO;
const SLOW = 30_000;

/** Throwaway project dirs, cleaned up after each test. */
/** @type {string[]} */
const tmpDirs = [];
/** @param {Record<string, string>} files */
function mkProject(files) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-doctor-'));
	tmpDirs.push(dir);
	for (const [rel, content] of Object.entries(files)) {
		const abs = path.join(dir, rel);
		fs.mkdirSync(path.dirname(abs), { recursive: true });
		fs.writeFileSync(abs, content);
	}
	return dir;
}
afterEach(() => {
	while (tmpDirs.length) {
		fs.rmSync(/** @type {string} */ (tmpDirs.pop()), { recursive: true, force: true });
	}
});

describe('doctor leaf', () => {
	it(
		'returns a `doctor` envelope with checks + summary',
		async () => {
			const r = await doctor({ cwd });
			expect(r.type).toBe('doctor');
			expect(Array.isArray(r.data.checks)).toBe(true);
			expect(r.data.checks.length).toBeGreaterThan(0);
			expect(r.data.summary).toBeDefined();
		},
		SLOW
	);

	it(
		'every check has an id, label, and a valid status',
		async () => {
			const r = await doctor({ cwd });
			for (const c of r.data.checks) {
				expect(typeof c.id).toBe('string');
				expect(typeof c.label).toBe('string');
				expect(['pass', 'warn', 'fail', 'info']).toContain(c.status);
			}
		},
		SLOW
	);

	it(
		'summary counts sum to the number of checks (invariant)',
		async () => {
			const r = await doctor({ cwd });
			const { pass, warn, fail, info } = r.data.summary;
			expect(pass + warn + fail + info).toBe(r.data.checks.length);
		},
		SLOW
	);

	it(
		'reports the core node-version and core-installed checks',
		async () => {
			const r = await doctor({ cwd });
			const ids = r.data.checks.map((c) => c.id);
			expect(ids).toContain('node-version');
			expect(ids).toContain('core-installed');
		},
		SLOW
	);
});

describe('doctor leaf — degradation & error paths', () => {
	it(
		'does not crash on multiple config files; reports a config FAIL',
		async () => {
			const dir = mkProject({
				'package.json': '{"name":"x"}',
				'astryx-svelte.config.mjs': 'export default {};',
				'astryx-svelte.config.js': 'export default {};'
			});
			const r = await doctor({ cwd: dir });
			const config = r.data.checks.find((c) => c.id === 'config');
			expect(config).toBeDefined();
			expect(config?.status).toBe('fail');
			expect(config?.message).toMatch(/multiple|exactly one/i);
		},
		SLOW
	);

	it(
		'reports a config FAIL (not a crash) when the config throws on import',
		async () => {
			const dir = mkProject({
				'package.json': '{"name":"x"}',
				'astryx-svelte.config.mjs': 'throw new Error("boom");\nexport default {};'
			});
			const r = await doctor({ cwd: dir });
			const config = r.data.checks.find((c) => c.id === 'config');
			expect(config?.status).toBe('fail');
			expect(config?.message).toMatch(/failed to load/i);
		},
		SLOW
	);

	it(
		'flags a non-object config default export as FAIL',
		async () => {
			const dir = mkProject({
				'package.json': '{"name":"x"}',
				'astryx-svelte.config.mjs': 'export default 42;'
			});
			const r = await doctor({ cwd: dir });
			const config = r.data.checks.find((c) => c.id === 'config');
			expect(config?.status).toBe('fail');
			expect(config?.message).toMatch(/not an object/i);
		},
		SLOW
	);

	it(
		'degrades gracefully on invalid package.json',
		async () => {
			const dir = mkProject({ 'package.json': '{ not json }' });
			const r = await doctor({ cwd: dir });
			const { pass, warn, fail, info } = r.data.summary;
			expect(pass + warn + fail + info).toBe(r.data.checks.length);
		},
		SLOW
	);
});

describe('doctor — checkVersionAlignment', () => {
	it('skips (info) when the core version is not comparable semver', () => {
		const dir = mkProject({
			'node_modules/@astryx-svelte/core/package.json': JSON.stringify({
				name: '@astryx-svelte/core',
				version: 'workspace:*'
			})
		});
		const c = checkVersionAlignment({
			cwd: dir,
			coreDir: path.join(dir, 'node_modules/@astryx-svelte/core'),
			nodeVersion: '',
			configPath: null,
			configTheme: null
		});
		expect(c.status).toBe('info');
		expect(c.fix ?? '').not.toMatch(/NaN|undefined/);
	});

	it('does not leak NaN/undefined for a comparable semver core version', () => {
		const dir = mkProject({
			'node_modules/@astryx-svelte/core/package.json': JSON.stringify({
				name: '@astryx-svelte/core',
				version: '0.0.1'
			})
		});
		const c = checkVersionAlignment({
			cwd: dir,
			coreDir: path.join(dir, 'node_modules/@astryx-svelte/core'),
			nodeVersion: '',
			configPath: null,
			configTheme: null
		});
		expect(['pass', 'warn']).toContain(c.status);
		expect(c.message).not.toMatch(/NaN|undefined/);
		if (c.fix) expect(c.fix).not.toMatch(/NaN|undefined/);
	});
});
