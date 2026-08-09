/**
 * @file Colocated tests for component-discovery, run against the real
 * `@astryx-svelte/core` source tree plus throwaway fixtures. Complements
 * component-discovery.importpath.test.mjs (which covers the `.ts`-source
 * import-path derivation) by pinning the discovery/grouping/resolution
 * behavior and the crash-on-missing-src surface.
 *
 * ## Ported case count
 *
 * 19, matching upstream one for one. Every case survives; four have adapted
 * **fixtures or expectations**, all for the one structural difference this
 * module's header spells out — upstream discovers by scanning
 * `<core>/src/<PascalName>/XDS<Name>.tsx`, ours reads the co-located
 * `.doc.mjs` index plus the source barrels under `<core>/src/lib`:
 *
 *   - the fixture core roots are `src/lib/<dir>/`, not `src/<Name>/`, and a
 *     component is present when its **doc** is, not when a `.tsx` is;
 *   - `hiddenComponents` needs a second doc to hide, because with one doc per
 *     export there is no directory-wide source scan for it to filter;
 *   - the nested-`group:` fixture is tab-indented, which is how this port's
 *     docs are actually formatted (upstream's are two-space);
 *   - `resolveImportPath(CORE, 'Button')` is the bare package root, because
 *     this port publishes one component barrel where upstream publishes a
 *     subpath per component. See the importpath suite for the full rule.
 */

import { describe, it, expect, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
	CORE_PACKAGE,
	discoverComponents,
	findComponentReadme,
	findComponentSource,
	resolveImportPath,
	discoverExternalComponentsGrouped,
	findExternalComponentDoc,
	discoverIntegrationComponents,
	findIntegrationComponentDoc,
	findIntegrationComponentSource,
	discoverOwnedComponents,
	__resetDiscoveryCache
} from './component-discovery.mjs';

// packages/cli/foundation/discovery/ -> up 3 = packages/cli, up 4 = repo root.
const CLI_ROOT = path.resolve(import.meta.dirname, '..', '..');
const REPO = path.resolve(CLI_ROOT, '..', '..');
const CORE = path.join(REPO, 'packages', 'core');

const SLOW = 30_000;

/** @type {string[]} */
const tmpDirs = [];
/**
 * Temp roots live under `packages/cli` rather than the OS temp dir: the
 * `.astryx-*` prefix is the one glob `.gitignore`, `.prettierignore` and
 * `eslint.config.js` all key on, so a fixture that outlives a crashed run is
 * still invisible to every repo-wide check.
 * @param {string} prefix
 * @returns {string}
 */
function mkTmp(prefix) {
	const d = fs.mkdtempSync(path.join(CLI_ROOT, prefix));
	tmpDirs.push(d);
	return d;
}
afterAll(() => {
	for (const d of tmpDirs) {
		fs.rmSync(d, { recursive: true, force: true });
	}
	__resetDiscoveryCache();
});

/**
 * Write a file, creating its directory.
 * @param {string} file
 * @param {string} content
 */
function write(file, content) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content);
}

describe('discoverComponents (real core)', () => {
	it(
		'discovers and groups real components',
		() => {
			const comps = discoverComponents(CORE);
			const keys = Object.keys(comps);
			expect(keys.length).toBeGreaterThan(20);
			for (const members of Object.values(comps)) {
				expect(Array.isArray(members)).toBe(true);
				expect(members.length).toBeGreaterThan(0);
				expect([...members].sort()).toEqual(members);
			}
			expect([...keys].sort((a, b) => a.localeCompare(b))).toEqual(keys);
			expect(keys).toContain('Button');
			expect(comps.Button).toContain('Button');
			expect(comps.Button).toContain('IconButton');
			expect(comps.Button.length).toBeGreaterThan(1);
		},
		SLOW
	);

	it(
		'never emits a non-ASCII (translated) group key',
		() => {
			// Regression: a `group:` prop inside a docsZh propDescriptions block leaked
			// a Chinese string as a group key in the default (English) listing.
			const comps = discoverComponents(CORE);
			for (const key of Object.keys(comps)) {
				expect([...key].every((ch) => ch.charCodeAt(0) < 128)).toBe(true);
			}
		},
		SLOW
	);

	it('honors group, hidden, and hiddenComponents from a directory doc', () => {
		const core = mkTmp('.astryx-cd-group-');
		const dir = path.join(core, 'src', 'lib', 'foo');
		write(path.join(dir, 'foo.svelte'), 'x');
		write(path.join(dir, 'foo-internal.svelte'), 'x');
		// One doc per export is this port's convention, so `hiddenComponents`
		// filters a SIBLING DOC rather than a sibling source file.
		write(
			path.join(dir, 'Foo.doc.mjs'),
			"export default {\n\tgroup: 'Widgets',\n\thiddenComponents: ['FooInternal']\n};\n"
		);
		write(path.join(dir, 'FooInternal.doc.mjs'), 'export default {};\n');
		expect(discoverComponents(core)).toEqual({ Widgets: ['Foo'] });
	});

	it('does not read a group: nested in a propDescriptions block', () => {
		// The ChatMessageBubble bug: a `group:` nested inside propDescriptions must
		// NOT be picked up as the component's group. Upstream's docs are two-space
		// indented and its fixture nests at four spaces; ours are tab indented, so
		// the nested field carries two tabs.
		const core = mkTmp('.astryx-cd-nested-');
		const dir = path.join(core, 'src', 'lib', 'bubble');
		write(path.join(dir, 'bubble.svelte'), 'x');
		write(
			path.join(dir, 'Bubble.doc.mjs'),
			'export default {\n' +
				"\tdisplayName: 'Bubble',\n" +
				'\tpropDescriptions: {\n' +
				"\t\tgroup: 'position within a multi-bubble group'\n" +
				'\t}\n' +
				'};\n'
		);
		// No top-level group -> falls back to the component name, NOT the prop text.
		expect(discoverComponents(core)).toEqual({ Bubble: ['Bubble'] });
	});

	it('skips an entire directory whose doc is hidden: true', () => {
		const core = mkTmp('.astryx-cd-hidden-');
		const dir = path.join(core, 'src', 'lib', 'bar');
		write(path.join(dir, 'bar.svelte'), 'x');
		write(path.join(dir, 'Bar.doc.mjs'), 'export default {\n\thidden: true\n};\n');
		expect(discoverComponents(core)).toEqual({});
	});

	it('omits component source files that have no sibling doc file', () => {
		const core = mkTmp('.astryx-cd-nodoc-');
		const dir = path.join(core, 'src', 'lib', 'naked');
		write(path.join(dir, 'naked.svelte'), 'x');
		expect(discoverComponents(core)).toEqual({});
	});

	it('returns {} for an empty src/ dir', () => {
		const core = mkTmp('.astryx-cd-emptysrc-');
		fs.mkdirSync(path.join(core, 'src', 'lib'), { recursive: true });
		expect(discoverComponents(core)).toEqual({});
	});

	it('throws when src/ is missing (no existsSync guard on the top readdir)', () => {
		const core = mkTmp('.astryx-cd-nosrc-');
		expect(() => discoverComponents(core)).toThrow(/ENOENT/);
	});
});

describe('findComponentReadme / findComponentSource / resolveImportPath', () => {
	it(
		'finds the doc + source for a top-level component',
		() => {
			expect(findComponentReadme(CORE, 'Button')).toMatch(/Button\.doc\.mjs$/);
			// Upstream's source is a `.tsx`; a Svelte component is a `.svelte`.
			expect(findComponentSource(CORE, 'Button')).toMatch(/\.svelte$/);
			// Upstream answers `@astryxdesign/core/Button`. This port publishes ONE
			// component barrel, so the bare root is the correct specifier — the
			// importpath suite pins the whole rule.
			expect(resolveImportPath(CORE, 'Button')).toBe(CORE_PACKAGE);
		},
		SLOW
	);

	it(
		'returns null for an unknown component (no fuzzy fallback, unlike hooks)',
		() => {
			expect(findComponentReadme(CORE, 'Buton')).toBeNull();
			expect(findComponentSource(CORE, 'Buton')).toBeNull();
		},
		SLOW
	);

	it('falls back to the bare package root when no source is found', () => {
		const core = mkTmp('.astryx-rip-empty-');
		fs.mkdirSync(path.join(core, 'src', 'lib'), { recursive: true });
		expect(resolveImportPath(core, 'Nope')).toBe(CORE_PACKAGE);
	});

	it('throws when src/ is missing', () => {
		const core = mkTmp('.astryx-fcr-nosrc-');
		expect(() => findComponentReadme(core, 'Button')).toThrow(/ENOENT/);
		expect(() => findComponentSource(core, 'Button')).toThrow(/ENOENT/);
		expect(() => resolveImportPath(core, 'Button')).toThrow(/ENOENT/);
	});
});

describe('external package discovery', () => {
	function buildExternalDocs() {
		const root = mkTmp('.astryx-ext-');
		const docs = path.join(root, 'docs');
		write(path.join(docs, 'AppShell.doc.mjs'), "export default {\n\tgroup: 'App Chrome'\n};\n");
		write(
			path.join(docs, 'sub', 'SideNav.doc.mjs'),
			"export default {\n\tgroup: 'App Chrome'\n};\n"
		);
		write(path.join(docs, 'Diff.doc.mjs'), 'export default {};\n');
		write(path.join(docs, 'Secret.doc.mjs'), 'export default {\n\thidden: true\n};\n');
		return docs;
	}

	it('discoverExternalComponentsGrouped groups + drops hidden', () => {
		expect(discoverExternalComponentsGrouped(buildExternalDocs())).toEqual({
			'App Chrome': ['AppShell', 'SideNav'],
			Diff: ['Diff']
		});
	});

	it('findExternalComponentDoc locates a nested doc by name', () => {
		const docs = buildExternalDocs();
		expect(findExternalComponentDoc(docs, 'SideNav')).toMatch(/SideNav\.doc\.mjs$/);
		expect(findExternalComponentDoc(docs, 'Nope')).toBeNull();
	});

	it('returns empty for a missing docs dir (guarded)', () => {
		expect(discoverExternalComponentsGrouped('/no/such/dir')).toEqual({});
		expect(findExternalComponentDoc('/no/such/dir', 'X')).toBeNull();
	});
});

describe('integration component discovery (ownership-aware)', () => {
	function buildIntegration() {
		const root = mkTmp('.astryx-integ-');
		const cdir = path.join(root, 'components');
		write(path.join(cdir, 'MetaAppShell.doc.mjs'), "export default {\n\tgroup: 'App Chrome'\n};\n");
		// The same-stem source an integration contributes is a `.svelte`, not a
		// `.tsx` — the one extension this port's integration convention renames.
		write(path.join(cdir, 'MetaAppShell.svelte'), 'x');
		write(path.join(cdir, 'sub', 'MetaDiff.doc.ts'), 'export default {};\n');
		write(path.join(cdir, 'MetaSecret.doc.mjs'), 'export default {\n\thidden: true\n};\n');
		return {
			name: '@acme/astryx-meta',
			components: cdir,
			issuesUrl: 'https://example.com/issues'
		};
	}

	it('records owner package, issuesUrl, group, and source presence; drops hidden', () => {
		const recs = discoverIntegrationComponents(buildIntegration()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);
		expect(recs.map((r) => r.name)).toEqual(['MetaAppShell', 'MetaDiff']);
		const shell = recs.find((r) => r.name === 'MetaAppShell');
		expect(shell.package).toBe('@acme/astryx-meta');
		expect(shell.issuesUrl).toBe('https://example.com/issues');
		expect(shell.group).toBe('App Chrome');
		expect(shell.sourcePath).toMatch(/MetaAppShell\.svelte$/);
		expect(recs.find((r) => r.name === 'MetaDiff').sourcePath).toBeNull();
	});

	it('finds an integration doc + source by name', () => {
		const integ = buildIntegration();
		expect(findIntegrationComponentDoc(integ, 'MetaAppShell')).toMatch(/MetaAppShell\.doc\.mjs$/);
		expect(findIntegrationComponentSource(integ, 'MetaAppShell')).toMatch(/MetaAppShell\.svelte$/);
		expect(findIntegrationComponentDoc(integ, 'MetaDiff')).toMatch(/MetaDiff\.doc\.ts$/);
		expect(findIntegrationComponentSource(integ, 'MetaDiff')).toBeNull();
		expect(findIntegrationComponentDoc(integ, 'Nope')).toBeNull();
	});

	it('gracefully handles a broken/missing integration components dir', () => {
		expect(discoverIntegrationComponents({ name: 'x' })).toEqual([]);
		expect(discoverIntegrationComponents({ name: 'x', components: '/no/such/dir' })).toEqual([]);
		expect(findIntegrationComponentDoc({ name: 'x', components: '/no/such/dir' }, 'A')).toBeNull();
	});

	it(
		'discoverOwnedComponents merges core + integration records',
		() => {
			const recs = discoverOwnedComponents(CORE, [buildIntegration()]);
			const button = recs.find((r) => r.name === 'Button');
			expect(button).toBeDefined();
			expect(button.package).toBe(CORE_PACKAGE);
			expect(button.sourcePath).toMatch(/\.svelte$/);
			expect(recs.find((r) => r.name === 'MetaAppShell').package).toBe('@acme/astryx-meta');
		},
		SLOW
	);
});
