import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { astryx } from '@astryx-svelte/core/vite';
import { contentPlugin } from './scripts/vite-plugin-content.mjs';

// The monorepo root. StyleX resolves cross-package `.stylex` imports relative to
// this, and `@astryx-svelte/core` is a workspace symlink into `packages/core`,
// so the root has to sit above both this app and the library. A single-app
// consumer wants the preset's default (`process.cwd()`) instead.
const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
	plugins: [
		// Emits src/lib/generated/* from the upstream `.doc.mjs` files. Runs
		// first so the generated modules exist before SvelteKit resolves them.
		contentPlugin(),
		// `@astryx-svelte/core` ships its `.stylex.js` modules *uncompiled* —
		// `svelte-package` only transpiles TS, it does not run StyleX — so every
		// consumer runs the compiler itself, with `optimizeDeps.exclude` and
		// `ssr.noExternal` to stop Vite routing the package around it.
		//
		// This site is the preset's first consumer, deliberately: it used to
		// hand-roll all three, and a preset nobody uses is a preset nobody knows
		// is broken. The 25 lines it replaces are the ones a reader would have
		// copied out of the README.
		astryx({ rootDir: workspaceRoot }),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
