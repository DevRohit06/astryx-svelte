import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'svelte/compiler';
import { stableClassName } from '$lib/internal/naming.js';

/**
 * Astryx's `theme/themingTargets.test.ts`, ported case for case — **16 upstream
 * `it` declarations at v0.4.5, 16 here**, in upstream's order and under
 * upstream's titles. Nothing dropped, nothing added. Two of the sixteen are
 * declared inside a loop over the discovered components, so the case count that
 * runs is higher on both sides and tracks the tree.
 *
 * A **server** project file (`*.test.ts`), as upstream's is: it parses source
 * and reads doc files, and renders nothing.
 *
 * `theming.targets` is the documented CSS surface of a component: the stable
 * `astryx-*` classes it renders and the visual props it reflects as data
 * attributes. It is hand-authored — generated from upstream's here — while the
 * truth lives in `themeProps()` calls in the source, and nothing kept the two in
 * agreement. **This is the guard that would have caught the three documented
 * theming targets which shipped at 0.4.5 rendering no class at all**, found
 * instead by a full gate run after the fact.
 *
 * Policy is SUBSET, not equality: every class rendered by `themeProps()` must be
 * documented, and every prop key passed to it must appear in that target's
 * `visualProps` or `states`. Docs may list MORE than the source passes —
 * components forward props they don't themselves reflect — and that is
 * intentional.
 *
 * ## Four translations, none of them a case
 *
 * **The parser.** Upstream reads its call sites out of the TypeScript AST, and
 * says why: the sites use every object form — shorthand (`{variant}`), renamed
 * (`{variant: fillVariant}`, where the KEY is the prop and the value is a
 * local), multi-line — so a regex reading identifiers after `:` records
 * `fillVariant`, a prop that does not exist. The same argument holds here and
 * the same answer applies, with the parser that fits this port's source:
 * `svelte/compiler`'s `parse`, whose output carries an ESTree `Program` for the
 * `<script>` and ESTree expressions inside the markup — so one walk finds
 * `themeProps('x')` in a `const` and `{...themeProps('x')}` on an element alike.
 * A `.ts` module is analysed by wrapping it in a `<script lang="ts">` and
 * parsing that, which keeps one AST shape and one visitor rather than two.
 *
 * **Where components and docs live.** `src/lib/components/<kebab-name>/` with a
 * `<PascalName>.doc.mjs`, against upstream's `src/<Name>/<Name>.doc.mjs`; the
 * fallback search for whichever doc file documents a rendered class walks
 * `src/lib` so it reaches the docs outside `components/` too. Doc modules are
 * ESM with a default export here rather than CommonJS `{docs}`.
 *
 * **A split family doc.** Upstream's `Indicator.doc.mjs` is one file covering
 * six classes; this port's generator emits one file per family member, so no
 * single file documents the directory's whole surface. Where the fallback
 * search returns several files for one directory, their union is compared —
 * that union is what upstream's single file is. A directory with a doc named
 * for it is checked against that file alone, exactly as upstream does.
 *
 * **No `docsZh`.** Upstream carries a second, Chinese doc block per file and
 * holds both to the same guard. This port has no translated docs, so there is
 * one block per file to check. That is an absence in the documentation surface,
 * not a dropped case: the `it` that checks a block is declared once and runs per
 * block found.
 */

const COMPONENTS_DIR = resolve(__dirname, '../lib/components');
const LIB_DIR = resolve(__dirname, '../lib');

interface ThemeTargetSite {
	/** Full stable class, e.g. 'astryx-progressbar-fill'. */
	className: string;
	/** Keys of the object literal passed as the 2nd arg (may be empty). */
	propKeys: string[];
	/** True when the 2nd arg exists but its keys can't be read statically. */
	isOpaque: boolean;
}

// ---------------------------------------------------------------------------
// Source scanning: find themeProps() call sites via the Svelte/ESTree AST
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Keys of a spread whose operand is a conditional object literal:
 * `...(cond && {a})`, `...(cond ? {a} : null)`, `...(cond || {a})`.
 * Returns null when the operand is anything else (a bag like `...rest`, or an
 * object with a computed key), which the caller treats as opaque.
 */
function conditionalSpreadKeys(expression: any): string[] | null {
	const branches: any[] = [];
	if (
		expression?.type === 'LogicalExpression' &&
		(expression.operator === '&&' || expression.operator === '||')
	) {
		branches.push(expression.right);
	} else if (expression?.type === 'ConditionalExpression') {
		branches.push(expression.consequent, expression.alternate);
	} else if (expression?.type === 'ObjectExpression') {
		branches.push(expression);
	} else {
		return null;
	}

	const keys: string[] = [];
	for (const object of branches) {
		// A falsy filler arm (`null`, `undefined`) contributes no keys; anything
		// else that is not an object literal hides its keys, so give up.
		if (
			(object?.type === 'Literal' && object.value === null) ||
			(object?.type === 'Identifier' && object.name === 'undefined')
		) {
			continue;
		}
		if (object?.type !== 'ObjectExpression') return null;
		for (const prop of object.properties) {
			const key = propertyKey(prop);
			if (key == null) return null;
			keys.push(key);
		}
	}
	return keys;
}

/** The static name of an object property, or null when it has none. */
function propertyKey(prop: any): string | null {
	if (prop?.type !== 'Property' || prop.computed) return null;
	if (prop.key?.type === 'Identifier') return prop.key.name;
	if (prop.key?.type === 'Literal' && typeof prop.key.value === 'string') return prop.key.value;
	return null;
}

/**
 * Extract every `themeProps('name', {...})` call from a source file.
 *
 * See the header for why this is an AST walk rather than a regex.
 */
export function extractThemeTargets(
	sourceText: string,
	fileName = 'source.svelte'
): ThemeTargetSite[] {
	const isSvelte = fileName.endsWith('.svelte');
	// Svelte's parser ends a script region at the first `</script>` it sees —
	// including one inside a JSDoc example, which ten hook modules here have, so
	// wrapping them verbatim cuts the module off mid-comment. Neutralising the
	// sequence keeps the comment a comment; nothing downstream reads offsets.
	const wrapped = `<script lang="ts">\n${sourceText.replaceAll('</script', '<\\/script')}\n</script>`;
	const root = parse(isSvelte ? sourceText : wrapped, { modern: true }) as any;

	const sites: ThemeTargetSite[] = [];

	const visit = (node: any): void => {
		if (node == null || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			for (const child of node) visit(child);
			return;
		}

		if (
			node.type === 'CallExpression' &&
			node.callee?.type === 'Identifier' &&
			node.callee.name === 'themeProps'
		) {
			const [nameArg, propsArg] = node.arguments ?? [];

			// Only string-literal component names are resolvable. A dynamic name
			// can't be checked statically; skip rather than guess.
			if (nameArg?.type === 'Literal' && typeof nameArg.value === 'string') {
				const site: ThemeTargetSite = {
					className: stableClassName(nameArg.value),
					propKeys: [],
					isOpaque: false
				};

				if (propsArg != null) {
					if (propsArg.type === 'ObjectExpression') {
						for (const prop of propsArg.properties) {
							if (prop.type === 'SpreadElement') {
								// A conditional spread of an object literal — `...(type &&
								// {type})` — has statically known keys. Treating it as
								// opaque is how `astryx-heading`'s `type` stayed
								// undocumented upstream: the same drift this file exists to
								// catch (#3652, #3680).
								const spreadKeys = conditionalSpreadKeys(prop.argument);
								if (spreadKeys == null) site.isOpaque = true;
								else site.propKeys.push(...spreadKeys);
								continue;
							}
							const key = propertyKey(prop);
							// Computed key: themeProps('x', {[k]: v})
							if (key == null) site.isOpaque = true;
							else site.propKeys.push(key);
						}
					} else {
						// A variable or call passed as the props bag.
						site.isOpaque = true;
					}
				}

				sites.push(site);
			}
		}

		for (const key of Object.keys(node)) {
			if (key === 'parent') continue;
			visit(node[key]);
		}
	};

	visit(root);
	return sites;
}

// ---------------------------------------------------------------------------
// The extractor must be right before its verdicts mean anything.
// ---------------------------------------------------------------------------

describe('extractThemeTargets', () => {
	it('reads a bare call with no props', () => {
		expect(extractThemeTargets(`themeProps('progressbar-track')`, 'x.ts')).toEqual([
			{ className: 'astryx-progressbar-track', propKeys: [], isOpaque: false }
		]);
	});

	it('reads shorthand props', () => {
		expect(extractThemeTargets(`themeProps('progressbar', {variant})`, 'x.ts')).toEqual([
			{ className: 'astryx-progressbar', propKeys: ['variant'], isOpaque: false }
		]);
	});

	it('records the KEY, not the value, when a prop is renamed', () => {
		// The trap a regex falls into: `fillVariant` is a local, not a prop.
		expect(
			extractThemeTargets(`themeProps('progressbar-fill', {variant: fillVariant})`, 'x.ts')
		).toEqual([{ className: 'astryx-progressbar-fill', propKeys: ['variant'], isOpaque: false }]);
	});

	it('reads multi-line object literals', () => {
		const src = `
      const p = themeProps('outline', {
        variant,
        size: resolvedSize,
      });
    `;
		expect(extractThemeTargets(src, 'x.ts')).toEqual([
			{ className: 'astryx-outline', propKeys: ['variant', 'size'], isOpaque: false }
		]);
	});

	it('reads a call whose result is immediately accessed', () => {
		// Table does `themeProps('table').class` — still a rendered class.
		expect(extractThemeTargets(`themeProps('table').class`, 'x.ts')).toEqual([
			{ className: 'astryx-table', propKeys: [], isOpaque: false }
		]);
	});

	it('finds every call in a file', () => {
		// Upstream's is JSX; this is the same markup in Svelte, spreads and all.
		const src = `
      <div {...themeProps('card', {variant})}>
        <span {...themeProps('card-header')}></span>
      </div>
    `;
		expect(
			extractThemeTargets(src, 'x.svelte')
				.map((s) => s.className)
				.sort()
		).toEqual(['astryx-card', 'astryx-card-header']);
	});

	it('reads the keys of a conditional spread', () => {
		// Heading's real call site: `{level, color, ...(type && {type})}`.
		const [site] = extractThemeTargets(
			`themeProps('heading', {level, color, ...(type && {type})})`,
			'x.ts'
		);
		expect(site.propKeys).toEqual(['level', 'color', 'type']);
		expect(site.isOpaque).toBe(false);
	});

	it('reads both arms of a ternary spread', () => {
		const [site] = extractThemeTargets(
			`themeProps('card', {...(isOpen ? {expanded} : {collapsed})})`,
			'x.ts'
		);
		expect(site.propKeys).toEqual(['expanded', 'collapsed']);
		expect(site.isOpaque).toBe(false);
	});

	it('marks a spread props bag opaque rather than guessing its keys', () => {
		const [site] = extractThemeTargets(`themeProps('card', {...rest})`, 'x.ts');
		expect(site.isOpaque).toBe(true);
		expect(site.propKeys).toEqual([]);
	});

	it('marks a conditional spread of a non-literal opaque', () => {
		const [site] = extractThemeTargets(`themeProps('card', {...(on && rest)})`, 'x.ts');
		expect(site.isOpaque).toBe(true);
		expect(site.propKeys).toEqual([]);
	});

	it('marks a non-literal props bag opaque', () => {
		const [site] = extractThemeTargets(`themeProps('card', visualProps)`, 'x.ts');
		expect(site.isOpaque).toBe(true);
	});

	it('ignores a dynamic component name it cannot resolve', () => {
		expect(extractThemeTargets(`themeProps(name, {variant})`, 'x.ts')).toEqual([]);
	});

	it('ignores an unrelated function of a similar shape', () => {
		expect(extractThemeTargets(`stylex.props('card', {variant})`, 'x.ts')).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// Discovery: every component dir's rendered classes vs its documented targets
// ---------------------------------------------------------------------------

interface DocTarget {
	className: string;
	visualProps?: string[];
	states?: string[];
}

type ComponentDocModule = {
	default?: { theming?: { targets?: DocTarget[] } };
};

interface ComponentInfo {
	dir: string;
	sites: ThemeTargetSite[];
	/** The doc blocks that carry theming.targets, by the key they live under. */
	docBlocks: { key: 'default'; file: string; targets: DocTarget[] }[];
}

const pascalCase = (dir: string): string =>
	dir
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');

/**
 * Every `*.doc.mjs` under lib that declares a theming target for one of
 * `classNames`. Lets a component be checked against the doc that documents it,
 * wherever that file lives.
 *
 * Reads the file as text rather than importing it: this runs for directories
 * that have no doc of their own, so most candidates are misses.
 */
function docFilesDocumenting(classNames: Set<string>): string[] {
	const matches: string[] = [];
	const walk = (dir: string): void => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const p = join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(p);
			} else if (entry.name.endsWith('.doc.mjs')) {
				const source = readFileSync(p, 'utf-8');
				for (const className of classNames) {
					if (source.includes(`'${className}'`)) {
						matches.push(p);
						break;
					}
				}
			}
		}
	};
	walk(LIB_DIR);
	return matches;
}

async function discoverComponents(): Promise<ComponentInfo[]> {
	const results: ComponentInfo[] = [];
	const dirs = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);

	for (const dir of dirs) {
		const dirPath = join(COMPONENTS_DIR, dir);
		const dirEntries = readdirSync(dirPath);

		const sourceFiles = dirEntries.filter(
			(f) =>
				(f.endsWith('.svelte') || f.endsWith('.ts')) &&
				!f.includes('.test.') &&
				!f.endsWith('.d.ts')
		);

		const sites: ThemeTargetSite[] = [];
		for (const f of sourceFiles) {
			const filePath = join(dirPath, f);
			sites.push(...extractThemeTargets(readFileSync(filePath, 'utf-8'), filePath));
		}
		if (sites.length === 0) continue;

		// A component's doc file usually sits beside its source, but not always:
		// `heading/heading.svelte` is documented by `text/Text.doc.mjs`. Requiring
		// a same-directory doc silently exempts every such component. Fall back to
		// whichever doc file documents the classes this directory renders.
		//
		// Both paths match the on-disk listing rather than existsSync: on
		// case-insensitive filesystems existsSync would match a differently-cased
		// doc file that CI never checks. (Same guard as derived-var-registry.)
		const docName = `${pascalCase(dir)}.doc.mjs`;
		const docFiles = dirEntries.includes(docName)
			? [join(dirPath, docName)]
			: docFilesDocumenting(new Set(sites.map((s) => s.className)));
		if (docFiles.length === 0) continue;

		const found: { file: string; targets: DocTarget[] }[] = [];
		for (const docFile of docFiles) {
			let mod: ComponentDocModule;
			try {
				mod = (await import(pathToFileURL(docFile).href)) as ComponentDocModule;
			} catch {
				continue;
			}
			const targets = mod.default?.theming?.targets;
			// Only blocks that already document a theming surface are held to it —
			// a doc with no theming block at all is a separate (documentation) gap.
			if (targets != null) found.push({ file: relative(LIB_DIR, docFile), targets });
		}
		if (found.length === 0) continue;

		// One doc file per directory is upstream's shape and is checked as upstream
		// checks it. The fallback path is where this port differs: upstream's
		// `Indicator.doc.mjs` is a family doc covering six classes, and this port's
		// generator emits one file per member, so no single file here documents
		// the directory's whole surface. Their union is what upstream's one file
		// is, so the fallback matches are compared as one block naming every file
		// it drew from — otherwise each half would be failed for not documenting
		// the other half's classes.
		const docBlocks: ComponentInfo['docBlocks'] =
			found.length === 1
				? [{ key: 'default', ...found[0] }]
				: [
						{
							key: 'default',
							file: found.map((f) => f.file).join(' + '),
							targets: found.flatMap((f) => f.targets)
						}
					];

		results.push({ dir, sites, docBlocks });
	}
	return results;
}

// ---------------------------------------------------------------------------
// The guard
// ---------------------------------------------------------------------------

const components = await discoverComponents();

describe('theming.targets matches the themeProps() call sites', () => {
	it('finds components to check', () => {
		// A refactor that renames themeProps must not silently disable this file.
		expect(components.length).toBeGreaterThan(0);
	});

	for (const { dir, sites, docBlocks } of components) {
		const renderedClasses = [...new Set(sites.map((s) => s.className))].sort();

		for (const { key, file, targets } of docBlocks) {
			const documented = new Set(targets.map((t) => t.className));

			it(`${dir} (${file} ${key}): every rendered class is documented`, () => {
				const undocumented = renderedClasses.filter((c) => !documented.has(c));
				expect(
					undocumented,
					`${dir} renders ${undocumented.length} astryx-* class(es) that ` +
						`${file} ${key}.theming.targets does not document: ` +
						`${undocumented.join(', ')}. An undocumented class is an ` +
						`unthemeable element — theme authors and codegen read targets[] ` +
						`to learn which selectors exist. Add {className: '...'} entries.`
				).toEqual([]);
			});

			it(`${dir} (${file} ${key}): every visual prop passed to themeProps is documented`, () => {
				const missing: string[] = [];
				for (const site of sites) {
					const target = targets.find((t) => t.className === site.className);
					if (target == null) continue; // Reported by the class test above.
					const known = new Set([...(target.visualProps || []), ...(target.states || [])]);
					for (const propKey of site.propKeys) {
						if (!known.has(propKey)) missing.push(`${site.className}: ${propKey}`);
					}
				}
				expect(
					[...new Set(missing)],
					`${dir} passes prop keys to themeProps() that ${file} ` +
						`${key}.theming.targets does not list under visualProps/states. ` +
						`Each one is a [data-*] selector consumers cannot discover.`
				).toEqual([]);
			});
		}
	}
});
