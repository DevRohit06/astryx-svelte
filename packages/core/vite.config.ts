import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import type { PluginOption } from 'vite';
import stylexPlugin from '@stylexjs/unplugin/vite';
// Serves real SSR markup to the browser project so hydration can be tested at
// all — see the file for why a client-rendered snapshot cannot stand in.
import { ssrFixturePlugin } from './scripts/ssr-fixture-plugin.mjs';

// The package's `exports` map lists `types` after `import`, so TypeScript
// resolves the untyped .mjs and loses the call signature. The runtime export is
// a plugin factory; assert that shape.
const stylex = stylexPlugin as unknown as (options?: Record<string, unknown>) => PluginOption;

export default defineConfig({
	plugins: [
		ssrFixturePlugin(),
		// StyleX compiles `stylex.create`/`defineVars` out of .stylex.ts modules
		// into atomic CSS at build time. Settings mirror Astryx's own Vite
		// integration (@astryxdesign/build/vite) so our output matches theirs:
		// no runtime injection, and rules emitted into CSS layers.
		stylex({
			dev: process.env.NODE_ENV !== 'production',
			runtimeInjection: false,
			treeshakeCompensation: true,
			useCSSLayers: true,
			// Without explicit targets, lightningcss lowers `light-dark()` into
			// `var(--lightningcss-light, …) var(--lightningcss-dark, …)`, which
			// resolves to nothing and silently kills every colour token. These are
			// the first versions with native `light-dark()` support, and match the
			// targets Astryx ships in @astryxdesign/build.
			lightningcssOptions: {
				targets: {
					chrome: 123 << 16,
					firefox: 120 << 16,
					safari: (17 << 16) | (5 << 8)
				}
			},
			unstable_moduleResolution: { type: 'commonJS', rootDir: process.cwd() }
		}),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						/**
						 * `contextOptions.locale` is load-bearing, not cosmetic. `plainDateFormat`
						 * and `Timestamp` format through `new Intl.DateTimeFormat(undefined,
						 * …)` — the *runtime default* locale. Node and jsdom report `en-US`,
						 * which is what upstream's literal `"January 15, 2026"` assertions
						 * are written against; headless Chromium instead inherits the host
						 * OS locale, so the same assertion passes or fails depending on
						 * whose machine runs it. Pinning it here makes the browser project
						 * deterministic and lets a ported case keep upstream's literal
						 * string. It also pins `isLocaleDayFirst()` in `date-parser.ts`,
						 * which reads the same default to decide DD/MM vs MM/DD.
						 *
						 * It goes on the **provider factory**, not the instance. Two nearby
						 * spellings both look right and neither works: `context` on the
						 * instance is not a known property at all, and `contextOptions` on
						 * the instance typechecks but is never passed to
						 * `browser.newContext`. Both fail *silently* — the suites still pass,
						 * because they carry their own locale handling — so verify a change
						 * here by asserting
						 * `new Intl.DateTimeFormat().resolvedOptions().locale` from inside a
						 * browser test, not by watching the suites stay green.
						 */
						provider: playwright({ contextOptions: { locale: 'en-US' } }),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					/**
					 * One file at a time. This is what retired the standing flake
					 * family — the "waits that starve under load" cases that failed on
					 * roughly half of full runs, never the same case twice, and always
					 * passed in isolation.
					 *
					 * They were contention, not logic: 82 files sharing one Chromium
					 * starve each other's timers and Playwright actionability checks,
					 * and the symptom moved around (a hover-intent timer here, a
					 * `:popover-open` assertion there, a 15 s click timeout elsewhere)
					 * because whichever file lost the scheduler that run was the one
					 * that failed.
					 *
					 * It is close to free, which is the part worth knowing. Parallelism
					 * was buying ~20 s of wall clock while paying for it many times
					 * over in redundant per-worker setup: measured over four runs each,
					 * parallel ran 68–78 s wall against **358–390 s** of summed setup
					 * and 89–103 s of import; serialized runs 89–92 s wall against
					 * 33–37 s setup and 4–6 s import. So the real cost of determinism
					 * here is about 20 seconds, and it buys a suite that does not need
					 * re-running until green.
					 *
					 * Raise this only with a measurement. If the file count grows enough
					 * that 90 s hurts, the lever to reach for is more browser
					 * *instances* (each with its own scheduler) rather than more files
					 * per instance, which is what caused this.
					 */
					fileParallelism: false,
					// Puts the compiled StyleX sheet on every test page. Without it,
					// computed-style assertions depend on which modules the plugin
					// happened to have transformed — see the file for why the import
					// inside it is what makes the sheet complete.
					setupFiles: ['./src/tests/setup-stylex.ts']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					/**
					 * Serialized for the same reason the client project is, even though
					 * these are node files with no browser of their own: the two
					 * projects run together under `npm run test:unit`, so node workers
					 * spinning up in parallel compete for the same cores as the single
					 * Chromium and reintroduce exactly the starvation the client
					 * setting removes. Fifteen pure-module files cost little to
					 * serialize.
					 */
					fileParallelism: false
				}
			}
		]
	}
});
