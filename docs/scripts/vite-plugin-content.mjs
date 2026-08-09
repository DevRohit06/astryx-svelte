// Runs the content generator inside Vite so `.doc.mjs` edits hot-reload.
//
// The generated modules are plain data under `src/lib/generated/`, so once a
// regeneration writes a changed file Vite's own watcher picks it up and
// invalidates every importer. `writeIfChanged` in the generator is what keeps
// that from looping: an unchanged run touches nothing.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './generate-content.mjs';
import { buildAstryxTheme } from './build-astryx-theme.mjs';

const DOCS_ROOT = fileURLToPath(new URL('..', import.meta.url));
const GENERATED_DIR = path.join(DOCS_ROOT, 'src', 'lib', 'generated');

/**
 * @returns {import('vite').Plugin}
 */
export function contentPlugin() {
	/** @type {import('vite').ViteDevServer | null} */
	let server = null;

	/**
	 * Regenerate, reporting failures to the overlay instead of killing the server.
	 *
	 * @param {string} [reason]
	 */
	async function regenerate(reason) {
		try {
			await generate({ quiet: true });
			await buildAstryxTheme({ quiet: true });
			if (reason) server?.config.logger.info(`  content regenerated (${reason})`);
		} catch (error) {
			const failure = error instanceof Error ? error : new Error(String(error));
			server?.config.logger.error(`content generation failed: ${failure.message}`);
			server?.ws.send({
				type: 'error',
				err: { message: failure.message, stack: failure.stack ?? '', plugin: 'docs-content' }
			});
		}
	}

	return {
		name: 'docs-content',
		// Before SvelteKit, so the generated modules exist for the first resolve.
		enforce: 'pre',

		async buildStart() {
			await generate({ quiet: true });
			await buildAstryxTheme({ quiet: true });
		},

		configureServer(devServer) {
			server = devServer;

			// The doc modules live in node_modules, which the dev watcher ignores
			// by default; add them explicitly so edits to a linked/patched
			// upstream package still trigger a rebuild.
			// Keep these in step with the content roots in `generate-content.mjs`;
			// 0.3.0 moved the CLI's docs under `assets/`.
			const watched = [
				path.join(DOCS_ROOT, 'node_modules', '@astryxdesign', 'core', 'src'),
				path.join(DOCS_ROOT, 'node_modules', '@astryxdesign', 'cli', 'assets', 'docs'),
				path.join(
					DOCS_ROOT,
					'node_modules',
					'@astryxdesign',
					'cli',
					'assets',
					'templates',
					'blocks'
				),
				path.join(DOCS_ROOT, 'src', 'lib', 'examples')
			];
			devServer.watcher.add(watched);

			devServer.watcher.on('all', (_event, file) => {
				// A write the generator itself made must not re-trigger it.
				if (file.startsWith(GENERATED_DIR)) return;

				const isDocModule = file.endsWith('.doc.mjs');
				const isExample = file.startsWith(path.join(DOCS_ROOT, 'src', 'lib', 'examples'));
				// The landing page's brand theme compiles to a generated stylesheet,
				// so an edit to its source has to re-run the build the same way a
				// `.doc.mjs` edit re-runs the content generator.
				const isTheme = file === path.join(DOCS_ROOT, 'src', 'lib', 'themes', 'astryx-theme.ts');
				if (!isDocModule && !isExample && !isTheme) return;

				regenerate(path.basename(file));
			});
		}
	};
}
