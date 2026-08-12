// Partytown's two build-time jobs, in one plugin.
//
// Partytown runs a third-party script inside a web worker instead of on the
// main thread, which is what keeps Google Analytics off this site's critical
// path — `analytics.svelte` is the consumer, and explains the runtime half.
// Two things have to happen at build time for that to work:
//
//   1. **The library files have to be served from this origin.** Partytown
//      registers a service worker (`partytown-sw.js`) whose scope *is* the
//      directory it is served from, so a CDN copy cannot work. `copyLibFiles`
//      puts them in `static/~partytown/`, which is the path the loader assumes
//      and where SvelteKit both serves from in dev and copies from at build.
//      The directory is gitignored: it is a verbatim copy of a pinned package,
//      and committing it would let it drift from the version in the lockfile.
//
//   2. **The loader snippet has to be inlined into the page.** It is ~2.4kB of
//      code that must run before the browser would otherwise start fetching
//      analytics, so Partytown's own guidance is to inline it rather than pay a
//      round trip for it. `partytownSnippet()` produces it with the `forward`
//      config baked in, and this plugin hands it over as a virtual module so
//      the `@qwik.dev/partytown` package itself never enters the client graph —
//      only the string it returns does.
//
// `buildStart` covers dev and build alike; the copy is idempotent, so a restart
// costs four `copyFile` calls.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyLibFiles } from '@qwik.dev/partytown/utils';
import { partytownSnippet } from '@qwik.dev/partytown/integration';

const DOCS_ROOT = fileURLToPath(new URL('..', import.meta.url));
const LIB_DEST = path.join(DOCS_ROOT, 'static', '~partytown');

const VIRTUAL_ID = 'virtual:partytown-snippet';
// Rollup's convention for "this id is mine, do not touch it".
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/**
 * @param {object} [options]
 * @param {string[]} [options.forward]
 *   Global call paths to patch on the main thread and forward into the worker.
 *   Anything the page itself calls has to be listed here, because the real
 *   implementation only exists inside the worker.
 * @returns {import('vite').Plugin}
 */
export function partytownPlugin({ forward = [] } = {}) {
	return {
		name: 'docs-partytown',
		// Before SvelteKit, so `static/` is populated by the time it is copied.
		enforce: 'pre',

		async buildStart() {
			// `debugDir: false` skips `lib/debug/`, ~200kB of unminified copies that
			// only a `debug: true` config would ever request.
			await copyLibFiles(LIB_DEST, { debugDir: false });
		},

		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
		},

		load(id) {
			if (id !== RESOLVED_ID) return;
			return `export default ${JSON.stringify(partytownSnippet({ forward }))};`;
		}
	};
}
