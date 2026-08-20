import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { stableClassName } from '$lib/internal/naming.js';

/**
 * Astryx's `theme/extensibleAxes.test.ts` — **3 of upstream's 4 `it`
 * declarations**, in upstream's order and under upstream's titles. The fourth is
 * dropped, named below with its reason. Two of the three are `it.each` over the
 * axes found in the tree, so the case count runs with the tree on both sides.
 *
 * A **server** project file (`*.test.ts`), as upstream's is.
 *
 * An extensible axis is a promise made in three places at once, and it is only
 * kept if all three agree:
 *
 *   1. `export interface FooVariantMap` — the augmentation point a consumer
 *      writes `declare module` against.
 *   2. `themeProps('foo', {variant})` — the axis reaching the DOM. Without it a
 *      custom variant renders no selector, so there is nothing to style.
 *   3. `visualProps: ['variant']` on the doc's theming target — discovery, and
 *      the reason `theme build` does not reject `'foo': {'variant:custom': …}`
 *      as an unknown prop.
 *
 * Miss (2) and the type says yes while the CSS says nothing: upstream's
 * `TreeList` shipped `TreeListVariantMap`, with a module-augmentation example in
 * its own JSDoc, while `themeProps('tree-list', {density})` never passed
 * `variant` — so an augmented variant type-checked, rendered, and could not be
 * themed.
 *
 * ## Dropped, named
 *
 * **`every open prop union is declared in an index a consumer can augment`.**
 * Upstream declares each map in `<Component>/index.ts`, because a consumer
 * augments `'@astryxdesign/core/<Component>'` and `astryx theme build` greps
 * that public subpath for the literal declaration — a map in a sibling file,
 * re-exported, satisfies neither. **This port ships no per-component subpath**
 * (`port/debts.md`, `retires: never`), so the augmentation point is the package
 * root and there is no index for the case to check. The other three cases below
 * are what keep the axes honest here.
 *
 * ## Two translations
 *
 * **Where a map may be declared.** Following from the above, `collectExtensibleAxes`
 * reads every source file under a component directory rather than only its
 * index, and takes the directory as the owner. The same 19 maps are found as
 * upstream's index-only walk finds.
 *
 * **Reading a `.svelte` file.** Props interfaces live in `<script module>` here,
 * so a component's `*Props` declaration is inside the markup file. The script
 * bodies are lifted out and handed to the TypeScript parser as one module, which
 * is the same AST upstream walks.
 */

const COMPONENTS_DIR = resolve(__dirname, '../lib/components');
const LIB_DIR = resolve(__dirname, '../lib');

/**
 * An extensible axis, keyed by the map that owns it.
 *
 * The OWNER is the component whose directory declares the interface — that is
 * the component that has to reflect the prop. Other components may declare a
 * prop of the same type (`AlertDialog`'s `actionVariant: ButtonVariant`, every
 * field's `statusVariant`); they forward the value to the owner and are not
 * separately accountable for it.
 */
interface ExtensibleAxis {
	/** Component directory whose source declares the map. */
	dir: string;
	/** Interface name, e.g. 'TreeListVariantMap'. */
	mapName: string;
	/** The prop it types, read off the interface name, e.g. 'variant'. */
	prop: string;
}

function sourceFilesUnder(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'node_modules') continue;
			sourceFilesUnder(full, out);
		} else if (
			(/\.ts$/.test(entry.name) || /\.svelte$/.test(entry.name)) &&
			!entry.name.includes('.test.') &&
			!entry.name.endsWith('.d.ts')
		) {
			out.push(full);
		}
	}
	return out;
}

/** A `.svelte` file's script bodies, concatenated; a `.ts` file's own text. */
const SCRIPT_BLOCK = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
function moduleText(file: string): string {
	const source = readFileSync(file, 'utf8');
	if (!file.endsWith('.svelte')) return source;
	return [...source.matchAll(SCRIPT_BLOCK)].map((m) => m[1]).join('\n');
}

function parse(file: string): ts.SourceFile {
	return ts.createSourceFile(
		file,
		moduleText(file),
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS
	);
}

/**
 * Every `type Alias = keyof SomethingMap` in the tree, as alias -> map name.
 * This is the shape that makes a union OPEN: augmenting the interface widens
 * the alias, which is the whole mechanism a theme package uses.
 */
function collectKeyofAliases(files: string[]): Map<string, string> {
	const aliases = new Map<string, string>();

	/** `keyof FooMap`, and the `keyof FooMap & string` narrowing form. */
	const mapBehind = (type: ts.TypeNode): string | null => {
		if (ts.isIntersectionTypeNode(type)) {
			for (const member of type.types) {
				const found = mapBehind(member);
				if (found != null) return found;
			}
			return null;
		}
		if (
			ts.isTypeOperatorNode(type) &&
			type.operator === ts.SyntaxKind.KeyOfKeyword &&
			ts.isTypeReferenceNode(type.type) &&
			ts.isIdentifier(type.type.typeName) &&
			type.type.typeName.text.endsWith('Map')
		) {
			return type.type.typeName.text;
		}
		return null;
	};

	for (const file of files) {
		const visit = (node: ts.Node): void => {
			if (ts.isTypeAliasDeclaration(node)) {
				const map = mapBehind(node.type);
				if (map != null) aliases.set(node.name.text, map);
			}
			ts.forEachChild(node, visit);
		};
		visit(parse(file));
	}
	return aliases;
}

/**
 * Maps whose alias types a prop on some `*Props` interface — i.e. the open
 * union is a COMPONENT PROP, which is what makes it a theming axis.
 *
 * This is the line between the two kinds of augmentable map in the tree.
 * `ButtonVariantMap` widens `<Button variant>`, a visual prop that reaches the
 * DOM and gets styled. `IndicatorMap` widens the set of registered indicator
 * NAMES — a different extension mechanism (the theme's `indicators` field,
 * swapping a component), with no selector and no visual prop. Holding the
 * second to the theming contract below would be a category error.
 */
function mapsTypingAProp(files: string[], aliases: Map<string, string>): Set<string> {
	const used = new Set<string>();
	for (const file of files) {
		const visit = (node: ts.Node): void => {
			if (ts.isInterfaceDeclaration(node) && node.name.text.endsWith('Props')) {
				for (const member of node.members) {
					if (!ts.isPropertySignature(member) || member.type == null) continue;
					const typeNode = ts.isArrayTypeNode(member.type) ? member.type.elementType : member.type;
					if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
						const map = aliases.get(typeNode.typeName.text);
						if (map != null) used.add(map);
					}
				}
			}
			ts.forEachChild(node, visit);
		};
		visit(parse(file));
	}
	return used;
}

/**
 * Every map that is (a) an open union — some `type X = keyof <Map>` exists, so
 * augmenting it widens a real type — and (b) declared under a component
 * directory.
 *
 * The prop name is read off the interface, which is the same convention
 * `astryx theme build` uses to find an augmentation point:
 * `<Prefix><Prop>Map`. `TextColorMap` -> text, `color`.
 * `AvatarStatusDotVariantMap` -> avatar, `variant`.
 */
function collectExtensibleAxes(files: string[], propMaps: Set<string>): ExtensibleAxis[] {
	const axes: ExtensibleAxis[] = [];
	for (const file of files) {
		if (!file.startsWith(COMPONENTS_DIR)) continue;
		const dir = relative(COMPONENTS_DIR, file).split(/[\\/]/)[0];
		const visit = (node: ts.Node): void => {
			if (
				ts.isInterfaceDeclaration(node) &&
				node.name.text.endsWith('Map') &&
				propMaps.has(node.name.text)
			) {
				const bare = node.name.text.slice(0, -'Map'.length);
				// The trailing PascalCase word is the prop.
				const match = /([A-Z][a-z0-9]*)$/.exec(bare);
				if (match == null) return;
				const prop = match[1].charAt(0).toLowerCase() + match[1].slice(1);
				axes.push({ dir, mapName: node.name.text, prop });
			}
			ts.forEachChild(node, visit);
		};
		visit(parse(file));
	}
	return axes;
}

/** Every `themeProps('name', {...})` site, as class -> the prop keys it passes. */
function collectThemePropsSites(files: string[]): Map<string, Set<string>> {
	const sites = new Map<string, Set<string>>();
	for (const file of files) {
		const visit = (node: ts.Node): void => {
			if (
				ts.isCallExpression(node) &&
				ts.isIdentifier(node.expression) &&
				node.expression.text === 'themeProps'
			) {
				const [nameArg, propsArg] = node.arguments;
				if (nameArg != null && ts.isStringLiteralLike(nameArg)) {
					const cls = stableClassName(nameArg.text);
					const keys = sites.get(cls) ?? new Set<string>();
					if (propsArg != null && ts.isObjectLiteralExpression(propsArg)) {
						for (const prop of propsArg.properties) {
							const name = prop.name;
							if (name != null && (ts.isIdentifier(name) || ts.isStringLiteralLike(name))) {
								keys.add(name.text);
							}
						}
					}
					sites.set(cls, keys);
				}
			}
			ts.forEachChild(node, visit);
		};
		visit(parse(file));
	}
	return sites;
}

// ---------------------------------------------------------------------------
// Docs
// ---------------------------------------------------------------------------

interface DocTarget {
	className: string;
	visualProps: string[];
}

async function collectDocTargets(dir: string): Promise<Map<string, DocTarget[]>> {
	const byDir = new Map<string, DocTarget[]>();
	const files: string[] = [];
	const walk = (current: string): void => {
		for (const entry of readdirSync(current, { withFileTypes: true })) {
			const full = join(current, entry.name);
			if (entry.isDirectory()) {
				if (entry.name === 'node_modules') continue;
				walk(full);
			} else if (entry.name.endsWith('.doc.mjs')) {
				files.push(full);
			}
		}
	};
	walk(dir);

	for (const full of files) {
		// Keyed by the component directory, so a family doc emitted per member
		// still lands under the directory that owns the axis.
		const componentDir = relative(COMPONENTS_DIR, full).split(/[\\/]/)[0];
		let doc;
		try {
			doc = (await import(pathToFileURL(full).href)).default;
		} catch {
			continue;
		}
		const targets = (doc?.theming?.targets ?? [])
			.filter(
				(t: unknown): t is { className: string } =>
					typeof (t as { className?: unknown })?.className === 'string'
			)
			.map((t: { className: string; visualProps?: string[] }) => ({
				className: t.className,
				visualProps: t.visualProps ?? []
			}));
		byDir.set(componentDir, [...(byDir.get(componentDir) ?? []), ...targets]);
	}
	return byDir;
}

// ---------------------------------------------------------------------------

const files = sourceFilesUnder(LIB_DIR);
const aliases = collectKeyofAliases(files);
const propMaps = mapsTypingAProp(files, aliases);
const axes = collectExtensibleAxes(files, propMaps);
const themePropsSites = collectThemePropsSites(files);
const docTargets = await collectDocTargets(LIB_DIR);

/** The targets a component's own directory documents, e.g. tree-list -> astryx-tree-list. */
function ownTargets(axis: ExtensibleAxis): DocTarget[] {
	return docTargets.get(axis.dir) ?? [];
}

describe('extensible prop axes are reachable by a theme', () => {
	it('finds the axes at all (guards the guard)', () => {
		// If the AST walk silently stopped matching, every assertion below would
		// pass on an empty list.
		expect(axes.length).toBeGreaterThan(10);
		expect(axes.map((a) => a.mapName)).toContain('ButtonVariantMap');
	});

	it.each(axes.map((a) => [`${a.dir}.${a.prop} (${a.mapName})`, a] as const))(
		'%s reaches the DOM through themeProps',
		(_label, axis) => {
			// The axis is extensible, so a consumer can add a value we have never
			// seen. The only way their CSS can select it is if the component
			// reflects the prop.
			const targets = ownTargets(axis);
			const reflected = targets.some((t) => themePropsSites.get(t.className)?.has(axis.prop));
			expect(
				reflected,
				`${axis.dir} lets a theme add \`${axis.prop}\` values via ${axis.mapName}, but no ` +
					`themeProps() call passes \`${axis.prop}\` — a custom value renders no selector, ` +
					`so it cannot be styled. Pass it: themeProps('<target>', {${axis.prop}}).`
			).toBe(true);
		}
	);

	it.each(axes.map((a) => [`${a.dir}.${a.prop} (${a.mapName})`, a] as const))(
		'%s is documented as a visual prop',
		(_label, axis) => {
			// Undocumented, it is undiscoverable — and `theme build` rejects
			// `'<target>': {'<prop>:custom': …}` as an unknown prop, because its
			// known-prop set is built from exactly this field.
			const targets = ownTargets(axis);
			const documented = targets.some((t) => t.visualProps.includes(axis.prop));
			expect(
				documented,
				`${axis.dir} lets a theme add \`${axis.prop}\` values via ${axis.mapName}, but no ` +
					`theming target documents \`${axis.prop}\` in visualProps — a theme author cannot ` +
					`discover the axis, and \`astryx theme build\` warns "Unknown prop" on it.`
			).toBe(true);
		}
	);
});
