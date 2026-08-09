/**
 * @file build API — dispatcher + barrel for the "assemble a page" assistant.
 *
 * `build()` with no query signals the workflow playbook (`build.help`). With a
 * query it runs the unified search and groups the results into a composition
 * KIT (`build.kit`). Each shape is projected by its own leaf; this file only
 * routes to the leaves and re-exports them, keeping the SAME `build` export so
 * api/index.mjs and the CLI consumer stay unchanged.
 *
 *   no query  → build.help  (api/build/help/help.mjs)
 *   a query   → build.kit   (api/build/kit/kit.mjs)
 *
 * Worth stating once, because the name collides with two other things in this
 * repo: `build` does not compile anything. It is the page-composition
 * assistant. The theme compiler is `theme build` (api/theme/build/), and the
 * per-package theme artifacts are built by `packages/themes/*\/scripts/
 * build-theme.mjs`. The three share a verb and nothing else.
 */

import { buildHelp } from './help/help.mjs';
import { buildKit } from './kit/kit.mjs';

// Barrel: surface the leaves alongside the dispatcher for the fractal shape.
export { buildHelp, buildKit };

/**
 * The page-building assistant. No query → the playbook signal; a query → the
 * grouped composition kit.
 *
 * @param {string} [query] what you're building (e.g. "analytics dashboard")
 * @param {{cwd?: string, type?: import('../search/search.type.mjs').SearchDomain, limit?: number}} [options]
 * @returns {Promise<import('./build.type.mjs').BuildHelpResponse | import('./build.type.mjs').BuildKitResponse>}
 */
export async function build(query, options = {}) {
	if (!query || !String(query).trim()) {
		return buildHelp();
	}
	return buildKit(query, options);
}
