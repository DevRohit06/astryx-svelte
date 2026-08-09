/**
 * @file **Coverage beyond upstream.** Three swizzle hazards with no upstream
 * analogue, which the ported suites structurally cannot catch because the shape
 * that causes each one does not exist in a React codebase or in upstream's
 * package layout. Each case names the mutation that makes it fail.
 *
 * 1. **A `.svelte` default import.** A Svelte component's export is its default;
 *    the barrel republishes it under a name (`export {default as Spinner}`), so
 *    a specifier-only rewrite yields `import Spinner from '@astryx-svelte/core'`
 *    — a default import from a namespace that has none. React components are
 *    already imported by name, so upstream never changes a statement's shape.
 *    *Mutation:* drop the DEFAULT_IMPORT_RE pass and this case reports the
 *    default form.
 *
 * 2. **A nested component family.** `chat/`, `nav-menu/`, `power-search/`,
 *    `resizable/` and `table/` hold subdirectories, so a file inside one reaches
 *    its own package with `../../x` — an *escaping-looking* specifier that must
 *    not be touched, because the target travels with the copy. Upstream's regex
 *    rewrites every `../`; it is safe there only because no component directory
 *    nests. *Mutation:* remove the copiedRoot containment check and this case
 *    rewrites a sibling into the package root.
 *
 * 3. **An owner with no `exports` map.** The resolving path is only correct for
 *    an owner whose public surface is knowable. A third-party integration
 *    usually declares no `exports`, and Node then lets any deep path be
 *    imported — so upstream's textual collapse is the right answer and must
 *    still run. *Mutation:* make `publicSurface` return a surface unconditionally
 *    and this case leaves the specifier unrewritten.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rewriteImports } from './swizzle.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const CORE_ROOT = path.join(REPO, 'packages', 'core');
const BUTTON_DIR = path.join(CORE_ROOT, 'src', 'lib', 'components', 'button');

/**
 * A rewrite context for a file in core's `components/button/`. Duplicated from
 * swizzle.test.mjs rather than imported: importing a `*.test.mjs` re-runs its
 * `describe` blocks in this file's report, doubling every ported case.
 * @param {{dir?: string, fileDir?: string}} [opts]
 */
function coreRewriteContext({ dir, fileDir } = {}) {
	const copiedRoot = dir ?? BUTTON_DIR;
	/** @type {string[]} */
	const unresolved = [];
	return {
		ctx: {
			ownerPackage: '@astryx-svelte/core',
			ownerRoot: CORE_ROOT,
			fileDir: fileDir ?? copiedRoot,
			copiedRoot,
			onUnresolved: (/** @type {string} */ s) => void unresolved.push(s)
		},
		unresolved
	};
}

describe('swizzle import rewriting — Svelte-only hazards', () => {
	it('converts an escaping .svelte default import into a named import', () => {
		const { ctx } = coreRewriteContext();
		const input = `import Spinner from '../spinner/spinner.svelte';`;
		expect(rewriteImports(input, ctx)).toBe(`import { Spinner } from '@astryx-svelte/core';`);
	});

	it('aliases when the local name differs from the published one', () => {
		const { ctx } = coreRewriteContext();
		const input = `import Spin from '../spinner/spinner.svelte';`;
		expect(rewriteImports(input, ctx)).toBe(
			`import { Spinner as Spin } from '@astryx-svelte/core';`
		);
	});

	it('leaves an import that escapes the file but stays inside the copied directory alone', () => {
		const chatDir = path.join(CORE_ROOT, 'src', 'lib', 'components', 'chat');
		const { ctx } = coreRewriteContext({
			dir: chatDir,
			fileDir: path.join(chatDir, 'nested', 'deeper')
		});
		const input = `import { x } from '../../chat-context.svelte.js';`;
		expect(rewriteImports(input, ctx)).toBe(input);
	});

	it('falls back to upstream’s textual collapse for an owner with no exports map', () => {
		const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-swizzle-noexports-'));
		try {
			const ctx = {
				ownerPackage: '@test/meta',
				ownerRoot: empty,
				fileDir: empty,
				copiedRoot: empty,
				onUnresolved: () => {}
			};
			expect(rewriteImports(`import x from '../utils/foo';`, ctx)).toBe(
				`import x from '@test/meta/utils';`
			);
			// The two-levels-up asset must never produce `<pkg>/..`.
			const asset = rewriteImports(
				`import en from '../../locales/en.json' with {type: 'json'};`,
				ctx
			);
			expect(asset).not.toContain('@test/meta/..');
			expect(asset).toBe(`import en from '@test/meta/locales/en.json' with {type: 'json'};`);
		} finally {
			fs.rmSync(empty, { recursive: true, force: true });
		}
	});
});
