import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import type { PluginOption } from 'vite';
import stylexPlugin from '@stylexjs/unplugin/vite';
import { contentPlugin } from './scripts/vite-plugin-content.mjs';

// The package's `exports` map lists `types` after `import`, so TypeScript
// resolves the untyped .mjs and loses the call signature. The runtime export is
// a plugin factory; assert that shape. Same workaround as packages/core.
const stylex = stylexPlugin as unknown as (options?: Record<string, unknown>) => PluginOption;

// The monorepo root. StyleX resolves cross-package `.stylex` imports relative to
// this, and `@astryx-svelte/core` is a workspace symlink into `packages/core`,
// so the root has to sit above both this app and the library.
const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
	plugins: [
		// Emits src/lib/generated/* from the upstream `.doc.mjs` files. Runs
		// first so the generated modules exist before SvelteKit resolves them.
		contentPlugin(),
		// `@astryx-svelte/core` ships its `.stylex.js` modules *uncompiled* —
		// `svelte-package` only transpiles TS, it does not run StyleX. So every
		// consumer runs the compiler itself, and these options must match
		// packages/core/vite.config.ts exactly or the docs site would emit
		// different atomic CSS than the class oracle verifies.
		stylex({
			dev: process.env.NODE_ENV !== 'production',
			runtimeInjection: false,
			treeshakeCompensation: true,
			useCSSLayers: true,
			// Without explicit targets, lightningcss lowers `light-dark()` into
			// `var(--lightningcss-light, …) var(--lightningcss-dark, …)`, which
			// resolves to nothing and silently kills every colour token.
			lightningcssOptions: {
				targets: {
					chrome: 123 << 16,
					firefox: 120 << 16,
					safari: (17 << 16) | (5 << 8)
				}
			},
			unstable_moduleResolution: { type: 'commonJS', rootDir: workspaceRoot }
		}),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	optimizeDeps: {
		// Vite's dev-time pre-bundler runs esbuild *outside* the plugin pipeline,
		// so anything it optimises never reaches the StyleX transform and its
		// `stylex.create` calls survive into the browser as runtime no-ops.
		// Excluding core keeps its `.stylex.js` modules on the normal
		// transform path.
		exclude: ['@astryx-svelte/core']
	},
	ssr: {
		// Same reasoning for the server build: externalised deps are `import`ed
		// from node_modules at runtime rather than transformed.
		noExternal: ['@astryx-svelte/core']
	}
});
