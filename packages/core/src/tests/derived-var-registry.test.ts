import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { derivedVarRegistry, getDerivedVars } from '$lib/theme/derived-var-registry.js';

/**
 * Astryx's `theme/derivedVarRegistry.test.ts`, ported case for case — **10
 * upstream `it` declarations at v0.4.5, 10 here**, in upstream's order and under
 * upstream's titles. Nothing dropped, nothing added. Two of the ten are declared
 * inside a loop over the discovered components, so the case count that actually
 * runs is higher on both sides and tracks the tree.
 *
 * A **server** project file (`*.test.ts`), as upstream's is: it reads source and
 * doc files off disk and never renders anything.
 *
 * This is a **guard**, not a unit test — it is the check that would have caught
 * the three documented theming targets that shipped at 0.4.5 rendering no class
 * at all. It scans every component's source for CSS custom property
 * declarations, checks each against that component's `.doc.mjs` `theming.vars[]`,
 * and checks that `derivedVarRegistry` agrees with the `derived[]` those docs
 * declare.
 *
 * ## Four translations, none of them a case
 *
 * **Where components live.** Upstream's are `src/<Name>/` and their doc file is
 * `<Name>.doc.mjs`; this port's are `src/lib/components/<kebab-name>/` with a
 * `<PascalName>.doc.mjs` beside them. A directory with no doc file named for it
 * is skipped on both sides — which is how upstream's own `Chat` behaves too, and
 * why this port's `chat/` is likewise not checked (there is no `Chat.doc.mjs`
 * because upstream ships no `Chat.tsx`; recorded in `port/debts.md`).
 *
 * **How the doc file is loaded.** Upstream `require()`s a CommonJS `.doc.mjs`
 * whose shape is `{docs: {...}}`; this port's are ESM with a default export, so
 * they are loaded with `import()` and read off `.default`. The doc files are
 * generated from upstream's, so the theming blocks being compared are upstream's
 * own prose either way.
 *
 * **What counts as a declaration.** Upstream matches `'--x':` — a quoted object
 * key — because a React component writes its custom properties in a style
 * object. This port writes them two ways: as object keys in `.stylex.ts`, and as
 * text inside a `style` attribute in `.svelte`. Matching only the first would
 * leave the extractor blind to a whole class of declaration upstream's is not
 * blind to — `--_tree-indent` is exactly that case, declared in both trees and
 * visible only to upstream's. So `.svelte` files are additionally scanned for a
 * bare `--x:`. It finds three vars the strict pattern misses and nothing else;
 * no component here has a `<style>` block for it to misread.
 *
 * **Two more structural vars.** `--_app-shell-header-height` and
 * `--_sheet-budget` join `STRUCTURAL_VARS`. Both are written by JavaScript at
 * runtime — a measured header height and a mobile-keyboard budget — which is
 * what that list is for; upstream's own entry for the first is
 * `--appshell-header-height`, the name its own tree used when the list was
 * written. Neither is a theming lever, and documenting them to satisfy the guard
 * would be inventing doc prose upstream does not have.
 */

const SRC_DIR = resolve(__dirname, '../lib/components');

interface DerivedDocEntry {
	property: string;
	vars?: string[];
	expand?: string;
}

type ComponentDocModule = {
	default?: {
		theming?: {
			vars?: { name: string }[];
			derived?: DerivedDocEntry[];
		};
	};
};

// ---------------------------------------------------------------------------
// Source scanning: find CSS custom property declarations in component files
// ---------------------------------------------------------------------------

/**
 * Structural/runtime vars that are NOT component-specific theming vars.
 * These are set by JS at runtime or cascade through layout — they don't
 * belong in derived[] because they aren't things theme authors write.
 */
const STRUCTURAL_VARS = new Set([
	'--container-padding',
	'--container-padding-inline',
	'--container-padding-inline-start',
	'--container-padding-inline-end',
	'--edge-inset-start',
	'--edge-inset-end',
	'--container-padding-block-start',
	'--container-padding-block-end',
	'--container-max-height',
	'--layout-padding-inner-x',
	'--layout-padding-inner-y',
	'--layout-padding-outer-x',
	'--layout-padding-outer-y',
	'--layout-content-width',
	'--appshell-header-height',
	// This port's name for the same measured height, published on the shell by
	// the header's resize observer. See the header's fourth translation.
	'--_app-shell-header-height',
	'--dialog-dir-x',
	'--dialog-dir-y',
	'--indicator-color',
	'--indicator-width',
	'--table-resize-height',
	// sticky-columns plugin: opaque backdrop (overridable) + the row overlay it
	// replays on pinned cells. Structural/runtime, not themeable design tokens.
	'--table-sticky-background',
	'--table-row-overlay',
	'--separator-display',
	'--astryx-section-padding',
	// The height a BottomSheet may grow into when the mobile keyboard is open,
	// written per-frame from the visual viewport.
	'--_sheet-budget'
]);

const KEY_PATTERN = /['"](--(\w[\w-]*))['"]\s*:/g;
/** Svelte writes custom properties as text in a `style` attribute, not as object keys. */
const INLINE_PATTERN = /--(\w[\w-]*)\s*:/g;

function isComponentVar(varName: string): boolean {
	// Skip token vars (--color-*, --spacing-*, --radius-*, etc.)
	if (/^--(color|spacing|radius|shadow|duration|ease|transition|font|text|size)-/.test(varName)) {
		return false;
	}
	if (STRUCTURAL_VARS.has(varName)) return false;
	// Skip vars that start with structural prefixes
	if (/^--(container-|layout-|edge-|component-)/.test(varName)) return false;
	return true;
}

/**
 * Extract component-specific CSS custom property names from a source file.
 *
 * Private (`--_*`) vars are INCLUDED. They are internal in the sense that a
 * theme author does not set them directly, but they are still part of the
 * documented theming surface (`theming.vars[]` with `private: true`) and are
 * how derived[] entries connect a standard CSS property to a component.
 */
function extractComponentVars(filePath: string): string[] {
	const content = readFileSync(filePath, 'utf-8');
	const vars = new Set<string>();

	for (const [, varName] of content.matchAll(KEY_PATTERN)) {
		if (isComponentVar(varName)) vars.add(varName);
	}
	if (filePath.endsWith('.svelte')) {
		for (const [, name] of content.matchAll(INLINE_PATTERN)) {
			const varName = `--${name}`;
			if (isComponentVar(varName)) vars.add(varName);
		}
	}
	return [...vars];
}

// ---------------------------------------------------------------------------
// Discovery: scan all component directories
// ---------------------------------------------------------------------------

interface ComponentInfo {
	dir: string;
	sourceVars: string[];
	docVars: string[];
	docDerived: DerivedDocEntry[];
}

const pascalCase = (dir: string): string =>
	dir
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');

async function discoverComponents(): Promise<ComponentInfo[]> {
	const results: ComponentInfo[] = [];
	const dirs = readdirSync(SRC_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);

	for (const dir of dirs) {
		const dirPath = join(SRC_DIR, dir);
		const dirEntries = readdirSync(dirPath);
		// Find source files with component vars, excluding tests and declarations.
		const sourceFiles = dirEntries
			.filter(
				(f) =>
					(f.endsWith('.svelte') || f.endsWith('.ts')) &&
					!f.includes('.test.') &&
					!f.endsWith('.doc.mjs') &&
					!f.endsWith('.d.ts')
			)
			.map((f) => join(dirPath, f));

		const allVars = new Set<string>();
		for (const f of sourceFiles) {
			for (const v of extractComponentVars(f)) allVars.add(v);
		}
		if (allVars.size === 0) continue;

		// Only check component directories (those with a doc file named after the
		// directory). Match against the on-disk listing rather than existsSync so
		// the comparison is case-exact everywhere — on case-insensitive
		// filesystems (macOS, Windows) existsSync would match a differently-cased
		// sibling and pull in a directory CI never checks.
		const docName = `${pascalCase(dir)}.doc.mjs`;
		if (!dirEntries.includes(docName)) continue;

		let docVars: string[] = [];
		let docDerived: DerivedDocEntry[] = [];
		try {
			const mod = (await import(pathToFileURL(join(dirPath, docName)).href)) as ComponentDocModule;
			docVars = (mod.default?.theming?.vars || []).map((v) => v.name);
			docDerived = mod.default?.theming?.derived || [];
		} catch {
			/* skip */
		}

		results.push({ dir, sourceVars: [...allVars], docVars, docDerived });
	}
	return results;
}

// ---------------------------------------------------------------------------
// Known mapping: component dir → registry key
// ---------------------------------------------------------------------------

const DIR_TO_REGISTRY_KEY: Record<string, string> = {
	banner: 'banner',
	button: 'button',
	card: 'card',
	chat: 'chat',
	'context-menu': 'context-menu',
	dialog: 'dialog',
	'dropdown-menu': 'dropdown-menu',
	field: 'field',
	'hover-card': 'hovercard',
	popover: 'popover',
	'progress-bar': 'progressbar-mark',
	section: 'section',
	'segmented-control': 'segmented-control',
	'text-area': 'textarea'
};

/**
 * Vars that are intentionally set by one component for use by another
 * (cross-component vars). These are documented in the *consuming* component's
 * doc, not the *setting* component's doc.
 *
 * e.g. Carousel and Thumbnail set --_button-radius for their child Buttons,
 * but --_button-radius is documented in Button's doc.
 */
const CROSS_COMPONENT_VARS: Record<string, string[]> = {
	carousel: ['--_button-radius'],
	thumbnail: ['--_button-radius'],
	chat: ['--_button-radius'],
	// AvatarGroupOverflow sets the overlap for the Avatars it lays out; Avatar
	// owns and documents it (and sets it itself when it is the group root).
	'avatar-group': ['--_avatar-group-overlap'],
	// BreadcrumbItem tunes the DropdownMenu it opens.
	breadcrumbs: ['--_dropdown-menu-radius', '--_dropdown-menu-padding'],
	// SelectableCard draws its selection ring through the Card shadow slot.
	'selectable-card': ['--_card-ring'],
	// Toolbar offsets the TabList indicator it hosts.
	toolbar: ['--_tab-indicator-bottom'],
	// The destructive item variant recolors the Item it renders; Item owns,
	// documents and reads both slots.
	'dropdown-menu': ['--_item-label-color', '--_item-description-color']
};

/**
 * Documented vars that intentionally have NO derived[] entry — a theme author
 * cannot reach them by writing a standard CSS property, only by targeting the
 * component's own theming surface.
 *
 * Each entry is a deliberate classification, so a NEW var has to be argued into
 * the list rather than slipping past on its name. The list should shrink over
 * time, not grow.
 */
const VARS_WITHOUT_DERIVED_MAPPING = new Set([
	// No standard CSS property maps onto these — they are component behaviors.
	'--button-focus-offset',
	'--button-icon-only-aspect',
	'--_avatar-group-overlap',
	'--_codeblock-gutter-width',
	'--_tab-indicator-bottom',
	// Hit-area outset on a ::after overlay — `inset` on a pseudo-element is not
	// a property a theme author sets on the component.
	'--_thumbnail-hit-inset',
	// The same shape, arriving with the clear button's coarse-pointer hit target
	// at 0.5.0: one is the ::after overlay's `inset`, the other whether the
	// overlay is generated at all (`content: none` vs `""`). Neither is a
	// standard property on the `field` target, and a theme that wanted the larger
	// touch area would set the var rather than reach the pseudo-element.
	'--_input-clear-hit-inset',
	'--_input-clear-hit-content',
	// Indentation and row-spacing metrics: --tree-list-indent is the authorable
	// step, --_tree-indent the per-row distance TreeListItem computes from it.
	// --tree-list-row-gap is applied as half a padding-block on each row wrapper,
	// not as gap on the list, so no standard property on the tree-list target
	// maps onto it; a theme sets the var directly.
	'--tree-list-indent',
	'--_tree-indent',
	'--tree-list-row-gap',
	// Composed into a single box-shadow list on the card, so neither maps 1:1
	// onto boxShadow — setting one through a derived entry would clobber the
	// other.
	'--_card-elevation',
	'--_card-ring'
]);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const components = await discoverComponents();

describe('component CSS vars are documented and themeable', () => {
	for (const { dir, sourceVars, docVars, docDerived } of components) {
		const crossVars = new Set(CROSS_COMPONENT_VARS[dir] || []);

		it(`${dir}: all source vars are in doc file`, () => {
			const undocumented = sourceVars.filter((v) => !docVars.includes(v) && !crossVars.has(v));
			expect(
				undocumented,
				`${dir} has undocumented CSS vars in source: ${undocumented.join(', ')}. ` +
					`Add them to ${pascalCase(dir)}.doc.mjs theming.vars[] and add a derived[] ` +
					`entry mapping the standard CSS property to the internal var.`
			).toEqual([]);
		});

		it(`${dir}: documented vars have derived entries for theming`, () => {
			// Every var that maps to a standard CSS property should have a
			// derived entry so theme authors can write standard CSS.
			const derivedVarNames = new Set(docDerived.flatMap((d) => d.vars || []));
			const derivedExpands = docDerived.filter((d) => d.expand).map((d) => d.expand);
			const hasContainerExpand = derivedExpands.includes('container');

			const missingDerived = docVars.filter((varName) => {
				// Cross-component vars are handled by the owning component
				if (crossVars.has(varName)) return false;
				// Check if this var is covered by a derived entry
				if (derivedVarNames.has(varName)) return false;
				// Container expansion covers padding-related vars
				if (hasContainerExpand && varName.includes('padding')) return false;
				return true;
			});

			// Everything that is not explicitly classified as unmappable must have
			// a derived[] entry.
			const themeableVars = missingDerived.filter((v) => !VARS_WITHOUT_DERIVED_MAPPING.has(v));

			expect(
				themeableVars,
				`${dir} has vars that should be themeable via derived[]: ${themeableVars.join(', ')}. ` +
					`Add derived[] entries in ${pascalCase(dir)}.doc.mjs mapping standard CSS ` +
					`properties (borderRadius, padding) to these internal vars — or, if ` +
					`no standard property maps onto them, add them to ` +
					`VARS_WITHOUT_DERIVED_MAPPING with the reason.`
			).toEqual([]);
		});
	}
});

describe('derivedVarRegistry ↔ doc file consistency', () => {
	for (const { dir, docDerived } of components) {
		const key = DIR_TO_REGISTRY_KEY[dir];
		if (!key || docDerived.length === 0) continue;

		it(`${dir} (${key}): registry matches doc derived`, () => {
			const registryEntries = derivedVarRegistry[key];
			expect(registryEntries).toBeDefined();
			expect(registryEntries).toEqual(docDerived);
		});
	}

	// Catch new doc files with derived that have no registry key mapping
	it('every doc with theming.derived has a registry mapping', () => {
		const missing: string[] = [];
		for (const { dir, docDerived } of components) {
			if (docDerived.length === 0) continue;
			const key = DIR_TO_REGISTRY_KEY[dir];
			if (!key) {
				missing.push(
					`${dir}: has theming.derived but no DIR_TO_REGISTRY_KEY mapping. ` +
						`Add the mapping and a derivedVarRegistry entry.`
				);
			} else if (!derivedVarRegistry[key]) {
				missing.push(`${dir} (${key}): has theming.derived but no derivedVarRegistry entry.`);
			}
		}
		expect(missing).toEqual([]);
	});

	it('registry has no orphan entries', () => {
		const validKeys = new Set(Object.values(DIR_TO_REGISTRY_KEY));
		const orphans = Object.keys(derivedVarRegistry).filter((k) => !validKeys.has(k));
		expect(orphans).toEqual([]);
	});
});

describe('getDerivedVars', () => {
	it('returns matching entries for card borderRadius', () => {
		const result = getDerivedVars('card', 'borderRadius');
		expect(result).toHaveLength(1);
		expect(result[0].vars).toEqual(['--_card-radius']);
	});

	it('returns empty for unknown component', () => {
		expect(getDerivedVars('unknown', 'borderRadius')).toEqual([]);
	});

	it('returns empty for unregistered property', () => {
		expect(getDerivedVars('card', 'color')).toEqual([]);
	});

	it('marks textarea paddingInline as replacing the source property', () => {
		const result = getDerivedVars('textarea', 'paddingInline');
		expect(result).toHaveLength(1);
		expect(result[0].vars).toEqual(['--_textarea-inline-padding']);
		expect(result[0].replaces).toBe(true);
	});

	it('marks progressbar-mark width and height as replacing the source property', () => {
		for (const [property, varName] of [
			['width', '--_progressbar-mark-width'],
			['height', '--_progressbar-mark-height']
		]) {
			const result = getDerivedVars('progressbar-mark', property);
			expect(result).toHaveLength(1);
			expect(result[0].vars).toEqual([varName]);
			expect(result[0].replaces).toBe(true);
		}
	});
});
