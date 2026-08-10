/**
 * @file Coverage with **no upstream analogue**, for the two doctor behaviours
 * the Vite preset introduced. `@astryxdesign/core` ships prebuilt CSS, so
 * upstream's doctor has no reason to inspect a bundler config and its suite has
 * no counterpart case. Kept out of `doctor.test.mjs`, whose header states a
 * ported count of 10 that is its contract.
 *
 * `checkStyleXSetup` exists because this is the port's worst failure mode: a
 * project whose bundler never runs StyleX renders every component with correct
 * markup and no styling, and nothing throws. Its cases pin the three settings
 * it looks for and, more importantly, that a *partial* setup is reported rather
 * than passed — one missing line produces the same silent failure as three.
 *
 * The `checkPeerDeps` case is here because the preset is what made core declare
 * optional peers at all, and the first run of doctor after that change told
 * this repo to install two packages it does not need.
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { checkStyleXSetup, checkPeerDeps } from './doctor.mjs';

/** @type {string[]} */
const tmpDirs = [];

/** @param {string} [viteConfig] @returns {string} project dir */
function project(viteConfig) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-stylex-'));
	tmpDirs.push(dir);
	if (viteConfig !== undefined) fs.writeFileSync(path.join(dir, 'vite.config.ts'), viteConfig);
	return dir;
}

afterEach(() => {
	while (tmpDirs.length) {
		fs.rmSync(/** @type {string} */ (tmpDirs.pop()), { recursive: true, force: true });
	}
});

const PRESET = `
import { astryx } from '@astryx-svelte/core/vite';
import { sveltekit } from '@sveltejs/kit/vite';
export default defineConfig({ plugins: [astryx(), sveltekit()] });
`;

const HAND_ROLLED = `
import stylex from '@stylexjs/unplugin/vite';
export default defineConfig({
	plugins: [stylex({ runtimeInjection: false })],
	optimizeDeps: { exclude: ['@astryx-svelte/core'] },
	ssr: { noExternal: ['@astryx-svelte/core'] }
});
`;

/** The dangerous shape: dev works, the production SSR build renders unstyled. */
const MISSING_SSR = `
import stylex from '@stylexjs/unplugin/vite';
export default defineConfig({
	plugins: [stylex({ runtimeInjection: false })],
	optimizeDeps: { exclude: ['@astryx-svelte/core'] }
});
`;

const PLUGIN_ONLY = `
import { sveltekit } from '@sveltejs/kit/vite';
export default defineConfig({ plugins: [sveltekit()] });
`;

describe('doctor — checkStyleXSetup', () => {
	it('passes on the preset without looking for the individual settings', () => {
		const result = checkStyleXSetup({ cwd: project(PRESET) });
		expect(result.status).toBe('pass');
		expect(result.message).toContain('preset');
	});

	it('passes a complete hand-rolled config', () => {
		expect(checkStyleXSetup({ cwd: project(HAND_ROLLED) }).status).toBe('pass');
	});

	it('warns and names the setting when only ssr.noExternal is missing', () => {
		const result = checkStyleXSetup({ cwd: project(MISSING_SSR) });
		expect(result.status).toBe('warn');
		expect(result.message).toContain('ssr.noExternal');
		// The consequence matters more than the setting name: this is the case
		// that works in dev and ships unstyled.
		expect(result.message).toContain('unstyled');
		expect(result.fix).toContain('@astryx-svelte/core/vite');
	});

	it('warns about all three when none are present', () => {
		const result = checkStyleXSetup({ cwd: project(PLUGIN_ONLY) });
		expect(result.status).toBe('warn');
		expect(result.message).toContain('the StyleX plugin');
		expect(result.message).toContain('optimizeDeps.exclude');
		expect(result.message).toContain('ssr.noExternal');
	});

	it('is informational, not a failure, when there is no vite config at all', () => {
		// A consumer on another bundler is not misconfigured; doctor only knows
		// how to read Vite, and says so rather than guessing.
		const result = checkStyleXSetup({ cwd: project(undefined) });
		expect(result.status).toBe('info');
	});
});

describe('doctor — checkPeerDeps and optional peers', () => {
	/** A project with core installed, declaring one required and one optional peer. */
	function projectWithCore() {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-peers-'));
		tmpDirs.push(dir);
		const coreDir = path.join(dir, 'node_modules', '@astryx-svelte', 'core');
		fs.mkdirSync(coreDir, { recursive: true });
		fs.writeFileSync(
			path.join(coreDir, 'package.json'),
			JSON.stringify({
				name: '@astryx-svelte/core',
				version: '0.3.1',
				peerDependencies: { svelte: '^5.0.0', vite: '^8.0.0' },
				peerDependenciesMeta: { vite: { optional: true } }
			})
		);
		return { cwd: dir, coreDir };
	}

	it('does not report an optional peer as missing', () => {
		// `vite` is only needed by core's `./vite` preset. A project on another
		// bundler needs neither it nor `@stylexjs/unplugin`, and being told to
		// install them is how a health check trains people to ignore it.
		const { cwd, coreDir } = projectWithCore();
		const result = checkPeerDeps({ cwd, coreDir });
		expect(result.message).not.toContain('vite');
	});

	it('still reports a required peer as missing', () => {
		const { cwd, coreDir } = projectWithCore();
		const result = checkPeerDeps({ cwd, coreDir });
		expect(result.status).not.toBe('pass');
		expect(result.message).toContain('svelte');
	});
});
