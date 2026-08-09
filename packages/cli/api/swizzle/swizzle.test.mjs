/**
 * @file Ported case-for-case from upstream's `api/swizzle/swizzle.test.mjs` —
 * 12 cases, 12 here.
 *
 * Upstream's nine `rewriteImports` cases are pure string tests of a textual
 * `../<dir>/<x>` -> `<pkg>/<dir>` collapse. This port resolves each specifier
 * against the owner's real `package.json#exports` instead (see the header of
 * copy/copy.mjs), so every case keeps its *property* — where does an escaping
 * import land? — against this port's actual export surface, and names the
 * specifier it targets where the answer differs.
 *
 * Three hazards with no upstream analogue at all (a `.svelte` default import, a
 * nested family directory, the no-`exports` owner) live in
 * `swizzle.svelte-adaptations.test.mjs` rather than inflating this count.
 */

import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rewriteImports, swizzle } from './swizzle.mjs';

// api/swizzle/ -> up 3 = packages/cli, up 4 = repo root (has packages/core).
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const CORE_ROOT = path.join(REPO, 'packages', 'core');
const BUTTON_DIR = path.join(CORE_ROOT, 'src', 'lib', 'components', 'button');

/**
 * A rewrite context for a file sitting in core's `components/button/`, i.e. what
 * `swizzle button` builds. `unresolved` collects anything with no public home.
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

describe('rewriteImports', () => {
	it('routes the theme token module to the subpath that publishes it', () => {
		// Upstream's `../theme/tokens.stylex` is a dedicated deep export there. Core
		// publishes no `./theme/tokens.stylex`; the token objects are re-exported
		// from `theme/index.ts`, so `./theme` is the specifier that resolves.
		const { ctx } = coreRewriteContext();
		const input = `import { tokens } from '../../styles/tokens.stylex.js';`;
		expect(rewriteImports(input, ctx)).toBe(`import { tokens } from '@astryx-svelte/core/theme';`);
	});

	it('routes a sibling utils module to the entrypoint that re-exports it', () => {
		// Upstream collapses `../utils/mergeProps` to `<pkg>/utils`. Core's root
		// barrel does `export * from './utils/index.js'`, and the root is the
		// canonical entrypoint when both publish a module, so `cx` lands there.
		const { ctx } = coreRewriteContext();
		const input = `import { warnOnce } from '../../utils/dev-warning.js';`;
		expect(rewriteImports(input, ctx)).toBe(`import { warnOnce } from '@astryx-svelte/core';`);
	});

	it('leaves same-level relative imports untouched', () => {
		const { ctx } = coreRewriteContext();
		const input = `import { helper } from './helper';`;
		expect(rewriteImports(input, ctx)).toBe(`import { helper } from './helper';`);
	});

	it('rewrites export from statements', () => {
		const { ctx } = coreRewriteContext();
		const input = `export { useTranslator } from '../../i18n/use-translator.svelte.js';`;
		expect(rewriteImports(input, ctx)).toBe(
			`export { useTranslator } from '@astryx-svelte/core/i18n';`
		);
	});

	it('handles double quotes', () => {
		const { ctx } = coreRewriteContext();
		const input = `import { tokens } from "../../styles/tokens.stylex.js";`;
		expect(rewriteImports(input, ctx)).toBe(`import { tokens } from "@astryx-svelte/core/theme";`);
	});

	it('handles multiple imports in one file', () => {
		const { ctx } = coreRewriteContext();
		const input = [
			`import { tokens } from '../../styles/tokens.stylex.js';`,
			`import { warnOnce } from '../../utils/dev-warning.js';`,
			`import { helper } from './helper';`
		].join('\n');

		expect(rewriteImports(input, ctx)).toBe(
			[
				`import { tokens } from '@astryx-svelte/core/theme';`,
				`import { warnOnce } from '@astryx-svelte/core';`,
				`import { helper } from './helper';`
			].join('\n')
		);
	});

	it('records a dynamic import() of a sibling component rather than breaking its default', () => {
		// Upstream rewrites the specifier and is done, because `<pkg>/Tooltip`'s
		// namespace still carries the binding it destructures. Here the barrel
		// publishes the component's *default* under a name, so
		// `(await import('@astryx-svelte/core')).default` would be undefined — the
		// `{#await … then {default: Tooltip}}` shape is out of a specifier
		// rewriter's reach, so the import is left alone and reported.
		const { ctx, unresolved } = coreRewriteContext();
		const input = `{#await import('../tooltip/tooltip.svelte') then { default: Tooltip }}`;
		expect(rewriteImports(input, ctx)).toBe(input);
		expect(unresolved).toEqual(['../tooltip/tooltip.svelte']);
	});

	it('rewrites a two-levels-up asset import to a valid subpath (never /..)', () => {
		// Core DOES publish `./locales/*.json`, so the wildcard export is matched
		// against the resolved file rather than guessed from the text.
		const chatDir = path.join(CORE_ROOT, 'src', 'lib', 'components', 'chat');
		const { ctx } = coreRewriteContext({
			dir: chatDir,
			fileDir: path.join(chatDir, 'nested')
		});
		const out = rewriteImports(
			`import en from '../../../locales/en.json' with {type: 'json'};`,
			ctx
		);
		expect(out).not.toContain('@astryx-svelte/core/..');
		expect(out).toBe(`import en from '@astryx-svelte/core/locales/en.json' with {type: 'json'};`);
	});

	it('keeps a component-local .stylex on the entrypoint that re-exports it', () => {
		// Upstream's point is that only `theme/tokens.stylex` is a deep export and a
		// component-local `.stylex` collapses to its directory barrel. Here there
		// are no per-component subpaths at all, so the root barrel — which really
		// does re-export the layer animations — is the collapse target.
		const { ctx } = coreRewriteContext();
		const input = `import { s } from '../layer/layer-animations.stylex.js';`;
		expect(rewriteImports(input, ctx)).toBe(`import { s } from '@astryx-svelte/core';`);
	});
});

describe('swizzle() API', () => {
	it('no component -> swizzle.list of core component directories', async () => {
		// Upstream lists component names because its directories are the names;
		// this port's `--list` is the directory listing, which is what a swizzle
		// copies. `button`, not `Button`.
		const r = await swizzle(undefined, { cwd: REPO });
		expect(r.type).toBe('swizzle.list');
		expect(Array.isArray(r.data)).toBe(true);
		expect(r.data).toContain('button');
	});

	it('--list -> swizzle.list even with a component arg', async () => {
		const r = await swizzle('Button', { cwd: REPO, list: true });
		expect(r.type).toBe('swizzle.list');
	});

	it('unknown component -> AstryxError ERR_UNKNOWN_COMPONENT with suggestions', async () => {
		await expect(swizzle('NotARealComponent99', { cwd: REPO })).rejects.toMatchObject({
			code: 'ERR_UNKNOWN_COMPONENT'
		});
	});
});
