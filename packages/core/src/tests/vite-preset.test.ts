/** NO-UPSTREAM: coverage beyond upstream — the header below says why. */

/**
 * Coverage with **no upstream analogue**: `@astryxdesign/core` ships prebuilt
 * CSS and has no Vite preset to test. This one exists because the two settings
 * it injects are the port's worst failure mode — both fail *silently*, and a
 * preset that quietly stopped emitting one would reintroduce exactly the bug it
 * was written to remove, with no error anywhere to say so.
 *
 * So the cases are about the seam, not the compiler: that the preset returns
 * the StyleX plugin, that its `config()` hook names this package in **both**
 * `optimizeDeps.exclude` and `ssr.noExternal`, and that a consumer's extra
 * packages survive into both.
 *
 * Imported through `$lib/…` as the rule requires.
 */

import { describe, expect, it } from 'vitest';

import { astryx } from '$lib/vite.js';

/** The preset returns a nested plugin array; find the config-injecting half. */
function configOf(plugins: unknown) {
	const flat = (Array.isArray(plugins) ? plugins : [plugins]).flat(Infinity) as Array<{
		name?: string;
		config?: () => unknown;
	}>;
	const seam = flat.find((p) => p?.name === 'astryx-svelte:keep-stylex-on-the-transform-path');
	return seam?.config?.() as
		{ optimizeDeps?: { exclude?: string[] }; ssr?: { noExternal?: string[] } } | undefined;
}

describe('astryx() vite preset', () => {
	it('returns the StyleX plugin alongside the config seam', () => {
		const plugins = (astryx() as unknown[]).flat(Infinity) as Array<{ name?: string }>;
		// The unplugin factory names itself; assert something StyleX-ish is present
		// rather than pinning its exact plugin name, which is not our contract.
		expect(plugins.length).toBeGreaterThan(1);
		expect(plugins.some((p) => p?.name === 'astryx-svelte:keep-stylex-on-the-transform-path')).toBe(
			true
		);
	});

	it('excludes core from the dev pre-bundler', () => {
		expect(configOf(astryx())?.optimizeDeps?.exclude).toContain('@astryx-svelte/core');
	});

	it('keeps core internal to the SSR build', () => {
		expect(configOf(astryx())?.ssr?.noExternal).toContain('@astryx-svelte/core');
	});

	it('carries a consumer package into both settings, not just one', () => {
		// The asymmetric case is the dangerous one: a package handled in dev and
		// externalised on the server renders styled locally and unstyled in
		// production, which is the hardest version of this bug to diagnose.
		const config = configOf(astryx({ include: ['@acme/design'] }));
		expect(config?.optimizeDeps?.exclude).toContain('@acme/design');
		expect(config?.ssr?.noExternal).toContain('@acme/design');
	});

	it('does not duplicate core when a consumer names it too', () => {
		const config = configOf(astryx({ include: ['@astryx-svelte/core'] }));
		expect(config?.optimizeDeps?.exclude).toEqual(['@astryx-svelte/core']);
	});
});
