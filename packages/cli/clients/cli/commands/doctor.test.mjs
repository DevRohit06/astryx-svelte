/**
 * @file Ported case-for-case from upstream's
 * `clients/cli/commands/doctor.test.mjs` — 28 cases, 28 here.
 *
 * The only substantive adaptation is the peer-dependency fixture: core declares
 * `svelte` where upstream declares `react`/`react-dom` *and* `@stylexjs/stylex`
 * (StyleX is a plain dependency here, never a peer). The `@stylexjs/stylex`
 * cases keep that name — they are synthetic fixtures testing scoped-name
 * handling and range checking, and any scoped package name serves.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';

import { registerDoctor } from './doctor.mjs';
import {
	runChecks,
	doctor as doctorApi,
	checkNodeVersion,
	checkCoreInstalled,
	checkVersionAlignment,
	checkThemes,
	checkConfig,
	checkAgentDocs,
	checkPeerDeps,
	checkPackageManager
} from '../../../api/doctor/doctor.mjs';
import { MIN_NODE_VERSION } from '../../../foundation/env/node-version.mjs';

/** @type {string} */
let tmpDir;
/** @type {string[]} */
let logCalls;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-doctor-test-'));
	logCalls = [];
	vi.spyOn(console, 'log').mockImplementation((...args) => {
		logCalls.push(args.join(' '));
	});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
	vi.restoreAllMocks();
	delete process.env.ASTRYX_THEME;
});

/**
 * Make a minimal node_modules/@astryx-svelte/core in tmpDir with the given version.
 * @param {string} [version]
 * @param {Record<string, string>} [peerDependencies]
 */
function installCore(version = '0.0.14', peerDependencies) {
	const coreDir = path.join(tmpDir, 'node_modules', '@astryx-svelte', 'core');
	fs.mkdirSync(coreDir, { recursive: true });
	/** @type {Record<string, unknown>} */
	const pkg = { name: '@astryx-svelte/core', version };
	if (peerDependencies) pkg.peerDependencies = peerDependencies;
	fs.writeFileSync(path.join(coreDir, 'package.json'), JSON.stringify(pkg));
	return coreDir;
}

/**
 * @param {string} name
 * @param {string} [version]
 */
function installPkg(name, version = '1.0.0') {
	const dir = path.join(tmpDir, 'node_modules', ...name.split('/'));
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, 'package.json'),
		JSON.stringify({ name, version, main: 'index.js' })
	);
	fs.writeFileSync(path.join(dir, 'index.js'), 'module.exports = {};');
	return dir;
}

/**
 * Mirror pnpm's layout: the real package lives under node_modules/.pnpm and
 * the entry in the scope directory is a symlink to it.
 * @param {string} name
 * @param {string} [version]
 */
function installPkgPnpmStyle(name, version = '1.0.0') {
	const realDir = path.join(
		tmpDir,
		'node_modules',
		'.pnpm',
		`${name.replace('/', '+')}@${version}`,
		'node_modules',
		...name.split('/')
	);
	fs.mkdirSync(realDir, { recursive: true });
	fs.writeFileSync(
		path.join(realDir, 'package.json'),
		JSON.stringify({ name, version, main: 'index.js' })
	);
	fs.writeFileSync(path.join(realDir, 'index.js'), 'module.exports = {};');
	const linkPath = path.join(tmpDir, 'node_modules', ...name.split('/'));
	fs.mkdirSync(path.dirname(linkPath), { recursive: true });
	// 'junction' keeps this working on Windows without elevated permissions;
	// it is ignored on posix.
	fs.symlinkSync(realDir, linkPath, 'junction');
	return linkPath;
}

/**
 * @param {import('../../../api/doctor/doctor.mjs').DoctorCheck[]} checks
 * @param {string} id
 */
function find(checks, id) {
	return checks.find((c) => c.id === id);
}

describe('doctor — individual checks', () => {
	it('node-version: PASS uses the real CLI threshold', () => {
		const ok = checkNodeVersion(/** @type {any} */ ({ nodeVersion: '99.0.0' }));
		expect(ok.status).toBe('pass');
		expect(ok.message).toContain(MIN_NODE_VERSION);

		const bad = checkNodeVersion(/** @type {any} */ ({ nodeVersion: '18.0.0' }));
		expect(bad.status).toBe('fail');
		expect(bad.fix).toContain(MIN_NODE_VERSION);
	});

	it('core-installed: FAIL when core is missing, PASS when present', () => {
		const missing = checkCoreInstalled(/** @type {any} */ ({ cwd: tmpDir, coreDir: null }));
		expect(missing.status).toBe('fail');
		expect(missing.fix).toBeTruthy();

		const coreDir = installCore('0.0.14');
		const present = checkCoreInstalled(/** @type {any} */ ({ cwd: tmpDir, coreDir }));
		expect(present.status).toBe('pass');
		expect(present.message).toContain('0.0.14');
	});

	it('version-alignment: WARN on major/minor drift', () => {
		const coreDir = installCore('9.9.0');
		const drift = checkVersionAlignment(/** @type {any} */ ({ cwd: tmpDir, coreDir }));
		expect(drift.status).toBe('warn');
		expect(drift.fix).toBeTruthy();
	});

	it('version-alignment: INFO when core is not installed', () => {
		const res = checkVersionAlignment(/** @type {any} */ ({ cwd: tmpDir, coreDir: null }));
		expect(res.status).toBe('info');
	});

	it('themes: WARN when no theme packages installed', () => {
		const res = checkThemes(/** @type {any} */ ({ cwd: tmpDir, configTheme: null }));
		expect(res.status).toBe('warn');
	});

	it('themes: WARN when theme installed but not wired', () => {
		installPkg('@astryx-svelte/theme-neutral', '0.0.14');
		const res = checkThemes(/** @type {any} */ ({ cwd: tmpDir, configTheme: null }));
		expect(res.status).toBe('warn');
		expect(res.message).toContain('@astryx-svelte/theme-neutral');
	});

	it('themes: PASS when theme installed and wired via config', () => {
		installPkg('@astryx-svelte/theme-neutral', '0.0.14');
		const res = checkThemes(/** @type {any} */ ({ cwd: tmpDir, configTheme: 'default' }));
		expect(res.status).toBe('pass');
	});

	it('themes: detects pnpm-style symlinked theme packages', () => {
		installPkgPnpmStyle('@astryx-svelte/theme-neutral', '0.1.2');
		const res = checkThemes(/** @type {any} */ ({ cwd: tmpDir, configTheme: 'default' }));
		expect(res.status).toBe('pass');
		expect(res.message).toContain('@astryx-svelte/theme-neutral');
	});

	it('config: INFO when no astryx-svelte.config.*', async () => {
		const res = await checkConfig(/** @type {any} */ ({ cwd: tmpDir, configPath: null }));
		expect(res.status).toBe('info');
	});

	it('config: PASS when a valid astryx-svelte.config.mjs loads', async () => {
		// Vitest intercepts dynamic import() through Vite's resolver, which can't
		// serve a file written to an arbitrary tmp path at runtime. Write the
		// fixture inside the package tree so Vite can resolve it, then clean up.
		const fixtureDir = fs.mkdtempSync(
			path.join(path.dirname(fileURLToPath(import.meta.url)), '.astryx-doctor-cfg-')
		);
		const configPath = path.join(fixtureDir, 'astryx-svelte.config.mjs');
		try {
			fs.writeFileSync(configPath, 'export default { integrations: [] };');
			const res = await checkConfig(/** @type {any} */ ({ cwd: fixtureDir, configPath }));
			if (res.status !== 'pass') {
				throw new Error(`expected pass, got ${res.status}: ${res.message}`);
			}
			expect(res.status).toBe('pass');
		} finally {
			fs.rmSync(fixtureDir, { recursive: true, force: true });
		}
	});

	it('config: FAIL when the config throws on import', async () => {
		const fixtureDir = fs.mkdtempSync(
			path.join(path.dirname(fileURLToPath(import.meta.url)), '.astryx-doctor-cfg-')
		);
		const configPath = path.join(fixtureDir, 'astryx-svelte.config.mjs');
		try {
			fs.writeFileSync(configPath, 'throw new Error("boom");\nexport default {};');
			const res = await checkConfig(/** @type {any} */ ({ cwd: fixtureDir, configPath }));
			expect(res.status).toBe('fail');
			expect(res.fix).toBeTruthy();
		} finally {
			fs.rmSync(fixtureDir, { recursive: true, force: true });
		}
	});

	it('config: FAIL when default export is not an object', async () => {
		const fixtureDir = fs.mkdtempSync(
			path.join(path.dirname(fileURLToPath(import.meta.url)), '.astryx-doctor-cfg-')
		);
		const configPath = path.join(fixtureDir, 'astryx-svelte.config.mjs');
		try {
			fs.writeFileSync(configPath, 'export default 123;');
			const res = await checkConfig(/** @type {any} */ ({ cwd: fixtureDir, configPath }));
			expect(res.status).toBe('fail');
		} finally {
			fs.rmSync(fixtureDir, { recursive: true, force: true });
		}
	});

	it('agent-docs: INFO when no docs present', () => {
		const res = checkAgentDocs(/** @type {any} */ ({ cwd: tmpDir }));
		expect(res.status).toBe('info');
		expect(res.fix).toContain('astryx-svelte init');
	});

	it('agent-docs: WARN when docs exist without XDS markers', () => {
		fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# AGENTS\nno markers here');
		const res = checkAgentDocs(/** @type {any} */ ({ cwd: tmpDir }));
		expect(res.status).toBe('warn');
	});

	it('agent-docs: PASS when XDS markers present', () => {
		fs.writeFileSync(
			path.join(tmpDir, 'AGENTS.md'),
			'# AGENTS\n<!-- XDS:START -->\nstuff\n<!-- XDS:END -->\n'
		);
		const res = checkAgentDocs(/** @type {any} */ ({ cwd: tmpDir }));
		expect(res.status).toBe('pass');
	});

	it('peer-deps: INFO when core not installed', () => {
		const res = checkPeerDeps(/** @type {any} */ ({ cwd: tmpDir, coreDir: null }));
		expect(res.status).toBe('info');
	});

	it('peer-deps: WARN when a peer is missing', () => {
		const coreDir = installCore('0.0.14', { svelte: '>=5.0.0' });
		const res = checkPeerDeps(/** @type {any} */ ({ cwd: tmpDir, coreDir }));
		expect(res.status).toBe('warn');
		expect(res.message).toContain('svelte');
	});

	it('peer-deps: PASS when peers are installed', () => {
		const coreDir = installCore('0.0.14', { svelte: '>=5.0.0' });
		installPkg('svelte', '5.0.0');
		const res = checkPeerDeps(/** @type {any} */ ({ cwd: tmpDir, coreDir }));
		expect(res.status).toBe('pass');
	});

	it('peer-deps: fix names a scoped missing peer (no empty install command)', () => {
		const coreDir = installCore('0.0.14', { '@stylexjs/stylex': '^0.19.0' });
		const res = checkPeerDeps(/** @type {any} */ ({ cwd: tmpDir, coreDir }));
		expect(res.status).toBe('warn');
		// The scope must survive version-stripping — `split('@')[0]` used to drop it,
		// leaving a bare `npm install ` with no package name.
		expect(res.fix).toContain('npm install @stylexjs/stylex');
		expect(res.fix).not.toMatch(/npm install\s*`/);
	});

	it('peer-deps: WARN when an installed peer is out of the declared range', () => {
		const coreDir = installCore('0.0.14', { '@stylexjs/stylex': '^0.19.0' });
		// Present, but a stale range resolved an incompatible version.
		installPkg('@stylexjs/stylex', '0.10.1');
		const res = checkPeerDeps(/** @type {any} */ ({ cwd: tmpDir, coreDir }));
		expect(res.status).toBe('warn');
		expect(res.message).toContain('0.10.1');
		expect(res.message).toContain('^0.19.0');
		// The fix pins the required range so it overrides the stale one.
		expect(res.fix).toContain('@stylexjs/stylex@^0.19.0');
	});

	it('peer-deps: PASS when an installed peer satisfies the range', () => {
		const coreDir = installCore('0.0.14', { '@stylexjs/stylex': '^0.19.0' });
		installPkg('@stylexjs/stylex', '0.19.2');
		const res = checkPeerDeps(/** @type {any} */ ({ cwd: tmpDir, coreDir }));
		expect(res.status).toBe('pass');
	});

	it('package-manager: INFO, reports yarn from lockfile', () => {
		fs.writeFileSync(path.join(tmpDir, 'yarn.lock'), '');
		const res = checkPackageManager(/** @type {any} */ ({ cwd: tmpDir }));
		expect(res.status).toBe('info');
		expect(res.message.toLowerCase()).toContain('yarn');
	});
});

describe('doctor — runChecks / report', () => {
	it('returns checks + a summary with per-status counts', async () => {
		const report = await runChecks({ cwd: tmpDir });
		expect(Array.isArray(report.checks)).toBe(true);
		expect(report.checks.length).toBeGreaterThan(0);
		const { pass, warn, fail, info } = report.summary;
		const total = pass + warn + fail + info;
		expect(total).toBe(report.checks.length);
	});

	it('reports a FAIL for core when run in a bare directory', async () => {
		const report = await runChecks({ cwd: tmpDir });
		expect(find(report.checks, 'core-installed')?.status).toBe('fail');
		expect(report.summary.fail).toBeGreaterThan(0);
	});

	it('api doctor() returns the {type, data} envelope', async () => {
		const res = await doctorApi({ cwd: tmpDir });
		expect(res.type).toBe('doctor');
		expect(res.data.checks).toBeTruthy();
		expect(res.data.summary).toBeTruthy();
	});
});

function createProgram() {
	const program = new Command();
	program.exitOverride();
	program.option('--json', 'Output as typed JSON');
	registerDoctor(program);
	return program;
}

describe('doctor — command', () => {
	it('--json emits a doctor envelope', async () => {
		const program = createProgram();
		await program.parseAsync(['node', 'astryx-svelte', '--json', 'doctor']);
		const out = logCalls.join('\n');
		const parsed = JSON.parse(out);
		expect(parsed.apiVersion).toBe(1);
		expect(parsed.type).toBe('doctor');
		expect(Array.isArray(parsed.data.checks)).toBe(true);
		expect(parsed.data.summary).toHaveProperty('fail');
	});

	it('exit code stays 0 when there are no failures', async () => {
		// Run against the monorepo (where @astryx-svelte/core resolves) → no FAIL.
		const prevExit = process.exitCode;
		process.exitCode = undefined;
		const program = createProgram();
		await program.parseAsync(['node', 'astryx-svelte', 'doctor']);
		// In the repo, core resolves, so no failures → exitCode untouched.
		expect(process.exitCode).toBeUndefined();
		process.exitCode = prevExit;
	});

	it('sets exit code 1 when a check FAILs (bare dir, no core)', async () => {
		const prevCwd = process.cwd();
		const prevExit = process.exitCode;
		process.exitCode = undefined;
		process.chdir(tmpDir);
		try {
			const program = createProgram();
			await program.parseAsync(['node', 'astryx-svelte', 'doctor']);
			expect(process.exitCode).toBe(1);
		} finally {
			process.chdir(prevCwd);
			process.exitCode = prevExit;
		}
	});
});
