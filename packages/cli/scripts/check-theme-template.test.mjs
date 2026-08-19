/**
 * @file Drift guard for the shipped theme template.
 *
 * `packages/cli/assets/theme.template.ts` is the annotated map of the theme
 * surface: every `defineTheme` field, the token families, the component
 * override syntax. `astryx-svelte theme template` copies it into a consumer's
 * project, so a claim that has rotted is not a stale comment in this repo — it
 * is wrong instruction sitting in someone else's.
 *
 * Documentation rots silently, and this kind especially: upstream's theme docs
 * shipped `--button-press-scale` (#5012) for long enough that a generated theme
 * carried a declaration no component could ever read. SYNC comments in the
 * theme sources point here; this file is what makes them more than a wish.
 *
 * What is checked — all of it derived from live sources, never hardcoded:
 *   1. Every `ThemeConfig` field is documented (and nothing invented).
 *   2. Every settable token family appears in the inventory.
 *   3. Every `--token` the template names is a real token.
 *   4. Every component key is a real theming target, and every public
 *      `--var` it sets is one that component declares.
 *   5. Every `astryx-svelte docs <topic>` it cites exists.
 *   6. Every theme source carrying a SYNC reference here still exists.
 *
 * Ported from Astryx's root `scripts/check-theme-template.test.mjs`. Four
 * things differ, all of them this port's shape rather than a change of intent:
 *
 * - It lives under `packages/cli`, because this repo has no root-level test
 *   runner — the CLI's vitest picks up `**\/*.test.mjs`, and the template it
 *   guards is a CLI asset.
 * - The interface is `ThemeConfig`, not `DefineThemeInput`.
 * - The token families are read from `styles/tokens.stylex.ts` and the settable
 *   set from `theme/tokens.ts`'s `tokenDefaults` spread. This port has no
 *   `CoreTokenName` union; that spread is the same fact in the shape it takes
 *   here, and reading it keeps the guard honest about what a theme may set.
 * - Sources are kebab-case, and the template is tab-indented.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const TEMPLATE = path.join(REPO_ROOT, 'packages/cli/assets/theme.template.ts');
const THEME_SRC = path.join(REPO_ROOT, 'packages/core/src/lib/theme');
const STYLES_SRC = path.join(REPO_ROOT, 'packages/core/src/lib/styles');
const CORE_SRC = path.join(REPO_ROOT, 'packages/core/src/lib');
const DOCS_DIR = path.join(REPO_ROOT, 'packages/cli/assets/docs');

const template = fs.readFileSync(TEMPLATE, 'utf-8');

/** Theme sources whose SYNC comments name the template. */
const SYNC_SOURCES = [
	{ dir: THEME_SRC, file: 'define-theme.ts' },
	{ dir: STYLES_SRC, file: 'tokens.stylex.ts' },
	{ dir: THEME_SRC, file: 'expand-color-scale.ts' },
	{ dir: THEME_SRC, file: 'expand-type-scale.ts' },
	{ dir: THEME_SRC, file: 'expand-radius-scale.ts' },
	{ dir: THEME_SRC, file: 'expand-motion-scale.ts' }
];

// ---------------------------------------------------------------------------
// Live facts
// ---------------------------------------------------------------------------

const defineThemeSrc = fs.readFileSync(path.join(THEME_SRC, 'define-theme.ts'), 'utf-8');
const tokensStylexSrc = fs.readFileSync(path.join(STYLES_SRC, 'tokens.stylex.ts'), 'utf-8');
const tokenDefaultsSrc = fs.readFileSync(path.join(THEME_SRC, 'tokens.ts'), 'utf-8');

/** Field names declared on `ThemeConfig`. */
function themeConfigFields() {
	const body = defineThemeSrc.match(/export interface ThemeConfig \{([\s\S]*?)\n\}/);
	if (!body) throw new Error('ThemeConfig not found in define-theme.ts');
	return [...body[1].matchAll(/^\t(\w+)\??:/gm)].map((m) => m[1]);
}

/** Every `*Defaults` group in tokens.stylex.ts, with its token names. */
function tokenGroups() {
	/** @type {Record<string, string[]>} */
	const groups = {};
	for (const chunk of tokensStylexSrc.split('export const ').slice(1)) {
		const name = chunk.split(/[\s:=]/)[0];
		if (!name.endsWith('Defaults')) continue;
		const body = chunk.split('export const')[0];
		groups[name] = [...body.matchAll(/'(--[a-zA-Z0-9-]+)'\s*:/g)].map((m) => m[1]);
	}
	return groups;
}

/**
 * The token groups a theme can actually set. Upstream reads the `CoreTokenName`
 * union; this port's counterpart is the `tokenDefaults` spread in
 * `theme/tokens.ts`, which is the same list expressed as values rather than
 * types — and is what `defineTheme` actually resolves against.
 */
function settableTokenGroups() {
	const body = tokenDefaultsSrc.match(
		/export const tokenDefaults: Record<string, string> = \{([\s\S]*?)\n\};/
	);
	if (!body) throw new Error('tokenDefaults not found in theme/tokens.ts');
	return [...body[1].matchAll(/\.\.\.(\w+Defaults)/g)].map((m) => m[1]);
}

/** Every documented theming target, and the public vars it declares. */
function themingTargets() {
	/** @type {Record<string, Set<string>>} */
	const targets = {};
	/** @type {Set<string>} */
	const publicVars = new Set();
	const walk = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const p = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(p);
				continue;
			}
			if (!entry.name.endsWith('.doc.mjs')) continue;
			const src = fs.readFileSync(p, 'utf-8');
			for (const m of src.matchAll(/className:\s*'astryx-([a-z0-9-]+)'/g)) {
				targets[m[1]] ??= new Set();
			}
			// `vars: [{name: '--button-focus-offset', ...}]` — private `--_` vars are
			// not a theme's to set, so they are not collected.
			for (const m of src.matchAll(/name:\s*'(--[a-z0-9-]+)'/g)) {
				publicVars.add(m[1]);
			}
		}
	};
	walk(CORE_SRC);
	return { targets, publicVars };
}

/** Doc topics `astryx-svelte docs <topic>` can print. */
function docTopics() {
	return fs
		.readdirSync(DOCS_DIR)
		.map((f) => f.match(/^([\w-]+)\.doc\.mjs$/))
		.filter(Boolean)
		.map((m) => m[1]);
}

// ---------------------------------------------------------------------------
// Template claims
// ---------------------------------------------------------------------------

/**
 * Top-level keys the template sets, plus the optional ones it shows commented
 * out (`// syntax: dracula,`). A commented field must carry a value, so an
 * ordinary prose comment is not mistaken for one.
 */
function templateFields() {
	const set = [...template.matchAll(/^\t(\w+):/gm)].map((m) => m[1]);
	const commented = [...template.matchAll(/^\t\/\/ (\w+): .+,$/gm)].map((m) => m[1]);
	return [...new Set([...set, ...commented])];
}

/**
 * Every CSS variable the template uses in a code position — set as a property
 * (`'--x': …`) or read (`var(--x)`). Prose mentions of a family (`--spacing-*`)
 * and CLI flags (`--list`) are not claims about a variable's existence.
 */
function templateVars() {
	const set = [...template.matchAll(/'(--[a-z][a-z0-9-]*)':/g)].map((m) => m[1]);
	const read = [...template.matchAll(/var\((--[a-z][a-z0-9-]*)\)/g)].map((m) => m[1]);
	return [...new Set([...set, ...read])];
}

/**
 * The inventory block — the comment listing what token families exist. Scoped
 * deliberately: a family named only in a passing example (`var(--spacing-6)`)
 * is not an inventory an author can read to learn what the system has.
 */
function templateInventory() {
	const marker = '// The families, so you know what exists:';
	const start = template.indexOf(marker);
	if (start === -1) {
		throw new Error(
			`The token inventory marker ("${marker}") is gone from the template. ` +
				`If the inventory moved, point this guard at its new home.`
		);
	}
	return template.slice(start, template.indexOf('\n\ttokens: {', start));
}

/**
 * The prefix a family shares — `--spacing-`, `--font-weight-`, `--ease-standard`.
 * A family is only "covered" when the template names this, which keeps the
 * three `--font-*` families (family, size, weight) distinguishable instead of
 * collapsing them into one prefix that any of them satisfies.
 *
 * @param {string[]} names
 */
function commonPrefix(names) {
	return names.reduce((prefix, name) => {
		let i = 0;
		while (i < prefix.length && i < name.length && prefix[i] === name[i]) i++;
		return prefix.slice(0, i);
	});
}

/** Component keys in the template's `components` block. */
function templateComponentKeys() {
	const block = template.match(/\n\tcomponents: \{([\s\S]*?)\n\t\}/);
	if (!block) throw new Error('components block not found in the template');
	return [...block[1].matchAll(/^\t\t'?([a-z][a-z0-9-]*)'?: \{/gm)].map((m) => m[1]);
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

describe('theme template stays in sync with the theme system', () => {
	it('documents every defineTheme field', () => {
		const documented = new Set(templateFields());
		const missing = themeConfigFields().filter((f) => !documented.has(f));
		expect(
			missing,
			`packages/cli/assets/theme.template.ts documents no ${missing.join(', ')} — ` +
				`ThemeConfig gained a field the template never mentions, so every ` +
				`author who reads the template will not know it exists.`
		).toEqual([]);
	});

	it('invents no field that defineTheme does not accept', () => {
		const real = new Set([...themeConfigFields(), 'name']);
		const invented = templateFields().filter((f) => !real.has(f));
		expect(
			invented,
			`The template shows ${invented.join(', ')}, which ThemeConfig does ` +
				`not accept — a field was renamed or removed and the template kept teaching it.`
		).toEqual([]);
	});

	it('lists every settable token family in its inventory', () => {
		const groups = tokenGroups();
		const inventory = templateInventory();
		const missing = settableTokenGroups().filter((group) => {
			const tokens = groups[group] ?? [];
			if (tokens.length === 0) return false;
			return !inventory.includes(commonPrefix(tokens));
		});
		expect(
			missing,
			`The template's token inventory covers no ${missing.join(', ')}. A whole ` +
				`token family exists that an author reading the template cannot discover.`
		).toEqual([]);
	});

	it('names only tokens and public vars that exist', () => {
		const known = new Set(Object.values(tokenGroups()).flat());
		const { publicVars } = themingTargets();
		// Domain tokens (syntax highlighting) live outside tokens.stylex.ts and are
		// referenced by prefix in the inventory, not by full name.
		const domainPrefixes = ['--color-syntax-'];
		const bogus = templateVars().filter(
			(v) =>
				!known.has(v) &&
				!publicVars.has(v) &&
				!domainPrefixes.some((p) => v.startsWith(p) || p.startsWith(v))
		);
		expect(
			bogus,
			`The template names ${bogus.join(', ')}, which no token group and no ` +
				`component declares. A CSS variable nothing defines compiles to a ` +
				`declaration that never applies (#5012).`
		).toEqual([]);
	});

	it('overrides only real theming targets', () => {
		const { targets } = themingTargets();
		const unknown = templateComponentKeys().filter((k) => !(k in targets));
		expect(
			unknown,
			`The template themes ${unknown.join(', ')}, which is not a documented ` +
				`theming target — the component was renamed or its class changed.`
		).toEqual([]);
	});

	it('cites only doc topics that exist', () => {
		const topics = new Set(docTopics());
		const cited = [
			...new Set([...template.matchAll(/astryx-svelte docs ([a-z-]+)/g)].map((m) => m[1]))
		];
		const dead = cited.filter((t) => !topics.has(t));
		expect(
			dead,
			`The template tells authors to run \`astryx-svelte docs ${dead.join('`, `astryx-svelte docs ')}\`, ` +
				`which prints nothing — the topic was renamed or removed.`
		).toEqual([]);
	});

	it('is still named by the SYNC comment in every theme source that points here', () => {
		const relTemplate = 'packages/cli/assets/theme.template.ts';
		const orphaned = SYNC_SOURCES.filter(
			({ dir, file }) => !fs.readFileSync(path.join(dir, file), 'utf-8').includes(relTemplate)
		).map(({ file }) => file);
		expect(
			orphaned,
			`${orphaned.join(', ')} lost the SYNC reference to the template. The ` +
				`reference is how the next person editing the theme system learns the ` +
				`template mirrors it.`
		).toEqual([]);
	});
});
