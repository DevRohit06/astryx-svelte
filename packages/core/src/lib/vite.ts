/**
 * @file vite.ts
 *
 * The Vite preset — one import that replaces the three-part StyleX setup every
 * consumer of this package would otherwise copy by hand.
 *
 * ```ts
 * // vite.config.ts
 * import { astryx } from '@astryx-svelte/core/vite';
 * import { sveltekit } from '@sveltejs/kit/vite';
 *
 * export default defineConfig({ plugins: [astryx(), sveltekit()] });
 * ```
 *
 * **Why this exists at all**, since it has no upstream counterpart:
 * `@astryxdesign/core` is built with Babel and ships prebuilt CSS, so its
 * consumers import a stylesheet and are done. This package is built by
 * `svelte-package`, which transpiles TypeScript and does not run StyleX, so
 * `dist/**\/*.stylex.js` publishes **uncompiled** and every consumer runs the
 * compiler themselves. Three things have to be true for that to work, and all
 * three fail *silently* — the components render, with correct markup and no
 * styling, and nothing throws.
 *
 * Hand-configuring them is the single most common way to get this wrong, and
 * the compiler options are worse than merely fiddly: they must match
 * `packages/core/vite.config.ts` **exactly**, or the atomic CSS a consumer
 * compiles differs from the output the class oracle verified against upstream.
 * A preset is the only form in which "exactly" is checkable.
 *
 * This is a deliberate addition to the published surface, like the
 * `liquid-glass` theme — it is build tooling required by the port's
 * distribution model, not invented component API.
 *
 * @input  the consumer's vite config
 * @output the StyleX plugin, plus the two settings that keep Vite from routing
 *         this package around it
 * @position `@astryx-svelte/core/vite`
 */

import stylexPlugin from '@stylexjs/unplugin/vite';
import type { PluginOption } from 'vite';

// The package's `exports` map lists `types` after `import`, so TypeScript
// resolves the untyped `.mjs` and loses the call signature. The runtime export
// is a plugin factory; assert that shape. Same workaround as this package's own
// vite.config.ts and the docs site's.
const stylex = stylexPlugin as unknown as (options?: Record<string, unknown>) => PluginOption;

/** Packages whose `.stylex.js` modules must reach the compiler. */
const ASTRYX_PACKAGES = ['@astryx-svelte/core'];

export interface AstryxViteOptions {
	/**
	 * Further packages that ship uncompiled `.stylex.js` and must be routed
	 * through the compiler — your own component library built on Astryx, for
	 * instance. `@astryx-svelte/core` is always included.
	 */
	include?: string[];
	/**
	 * Root for StyleX's module resolution. Defaults to the process working
	 * directory, which is what a single-app project wants. A monorepo that
	 * imports `.stylex` modules across packages needs the workspace root
	 * instead, because StyleX resolves those paths relative to it.
	 */
	rootDir?: string;
	/**
	 * Defaults to `NODE_ENV !== 'production'`. Only override this if you are
	 * driving the build yourself and know `NODE_ENV` is wrong.
	 */
	dev?: boolean;
}

/**
 * The StyleX compiler wired the way this package's own build wires it, plus the
 * two escapes Vite would otherwise take.
 *
 * Place it **before** `sveltekit()`, as this package's own config does.
 */
export function astryx(options: AstryxViteOptions = {}): PluginOption {
	const {
		include = [],
		rootDir = process.cwd(),
		dev = process.env.NODE_ENV !== 'production'
	} = options;

	const packages = [...new Set([...ASTRYX_PACKAGES, ...include])];

	return [
		// Options mirror packages/core/vite.config.ts, which in turn mirrors
		// Astryx's own Vite integration (@astryxdesign/build/vite) so the emitted
		// classes match theirs byte for byte. Changing one here without changing
		// it there is how a consumer ends up with CSS no oracle has ever checked.
		stylex({
			dev,
			runtimeInjection: false,
			treeshakeCompensation: true,
			useCSSLayers: true,
			// Without explicit targets, lightningcss lowers `light-dark()` into
			// `var(--lightningcss-light, …) var(--lightningcss-dark, …)`, which
			// resolves to nothing and silently empties every colour token. These
			// are the first versions with native `light-dark()`, and are the
			// targets Astryx ships in @astryxdesign/build.
			lightningcssOptions: {
				targets: {
					chrome: 123 << 16,
					firefox: 120 << 16,
					safari: (17 << 16) | (5 << 8)
				}
			},
			unstable_moduleResolution: { type: 'commonJS', rootDir }
		}),
		{
			name: 'astryx-svelte:keep-stylex-on-the-transform-path',
			// Vite has **two** ways to route a dependency around its own plugin
			// pipeline, and each defeats the compiler on its own:
			//
			//  - the dev-time pre-bundler runs esbuild outside the pipeline, so a
			//    pre-bundled dependency never reaches the StyleX transform and its
			//    `stylex.create` calls survive into the browser as runtime no-ops;
			//  - the SSR build externalises `node_modules` by default, importing
			//    them from disk at runtime instead of transforming them.
			//
			// Returning partial config here merges with the user's own, so a
			// project that already lists other packages in either field keeps them.
			config: () => ({
				optimizeDeps: { exclude: packages },
				ssr: { noExternal: packages }
			})
		}
	];
}
