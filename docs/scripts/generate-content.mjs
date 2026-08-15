// Content generator for the docs site.
//
// Upstream's `apps/docsite/scripts/generate-data.mjs` discovers every `.doc.mjs`
// in the monorepo and emits typed registries. This is the same idea against the
// same files, with three deliberate differences:
//
// 1. Content is read from `node_modules/@astryxdesign/{core,cli}`, both pinned
//    to the exact version packages/core targets — not from the gitignored
//    upstream clone. The published tarballs ship `src/`, so the `.doc.mjs` files
//    are all there, and a CI checkout generates byte-identical output.
// 2. Component entries are filtered to what `@astryx-svelte/core` actually
//    exports. The docs describe this library; documenting an unported component
//    would document nothing shippable.
// 3. Prop types are mapped React → Svelte (see lib/prop-types.mjs).
//
// **Two content roots are this workspace's own, not upstream's**, and both are
// cases where upstream's file describes React and no rewrite of a *specifier*
// could fix it:
//
// - the **reference topics** come from `packages/cli/assets/docs` — see
//   `buildDocsRegistry`;
// - the **theme list** is a scan of `packages/themes/*` — see
//   `buildThemeRegistry`.
//
// `.doc.mjs` files are executable ES modules, so they are `import()`-ed rather
// than parsed — exactly as upstream does.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readCoreExports } from './lib/export-surface.mjs';
import { mapProp } from './lib/prop-types.mjs';
import { createPropsTypeIndex, propsTypeNamesFor, returnTypeNamesFor } from './lib/props-types.mjs';

const DOCS_ROOT = fileURLToPath(new URL('..', import.meta.url));
const WORKSPACE_ROOT = path.join(DOCS_ROOT, '..');

const UPSTREAM_CORE = path.join(DOCS_ROOT, 'node_modules', '@astryxdesign', 'core');
const UPSTREAM_CLI = path.join(DOCS_ROOT, 'node_modules', '@astryxdesign', 'cli');
const CORE_ROOT = path.join(WORKSPACE_ROOT, 'packages', 'core');
const CORE_DIST = path.join(CORE_ROOT, 'dist');
const OUT_DIR = path.join(DOCS_ROOT, 'src', 'lib', 'generated');

/** Upstream's own gallery buckets. Anything outside this list is a doc bug. */
const CATEGORIES = new Set([
	'Action',
	'Chat',
	'Container',
	'Content',
	'Data Input',
	'Data Visualization',
	'Feedback & Status',
	'Layout',
	'Navigation',
	'Overlay',
	'Table & List',
	'Utility'
]);

// ---------------------------------------------------------------------------
// discovery
// ---------------------------------------------------------------------------

/**
 * Every `*.doc.mjs` under a directory, recursively.
 *
 * @param {string} dir
 * @param {(name: string) => boolean} [accept]
 * @returns {string[]}
 */
function findDocModules(dir, accept = (name) => name.endsWith('.doc.mjs')) {
	if (!fs.existsSync(dir)) return [];
	/** @type {string[]} */
	const found = [];

	// Sorted for the reason `collectDeclarations` in lib/props-types.mjs is:
	// `readdirSync` returns filesystem order, which differs between platforms,
	// and a generated artefact that is committed and checked cannot depend on
	// which machine ran the generator.
	const entries = fs
		.readdirSync(dir, { withFileTypes: true })
		.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			found.push(...findDocModules(full, accept));
		} else if (entry.isFile() && accept(entry.name)) {
			found.push(full);
		}
	}

	return found;
}

/**
 * A **content root** — a directory upstream is expected to ship docs in. Unlike
 * `findDocModules`, an empty result here is a failure, not a result.
 *
 * Upstream restructures these paths between releases (`@astryxdesign/cli` moved
 * `docs/` → `assets/docs/` and `templates/blocks/` → `assets/templates/blocks/`
 * at 0.3.0). When it does, the old path resolves to nothing, every downstream
 * count silently becomes zero, and the generator writes **empty registries over
 * real ones** while exiting 0 — which is what happened on the 0.3.0 bump, and
 * `pnpm -r build` reported success throughout because it runs this script.
 *
 * So a root that does not exist, or exists and yields no modules, throws. The
 * pipeline must fail *closed*: a wrong path is a diagnosable error, never a
 * plausible-looking "0 pending".
 *
 * @param {string} dir
 * @param {string} label      what this root supplies, for the error message
 * @param {(name: string) => boolean} [accept]
 * @returns {string[]}
 */
function requireDocModules(dir, label, accept) {
	if (!fs.existsSync(dir)) {
		throw new Error(
			`content root for ${label} does not exist: ${dir}\n` +
				`  Upstream most likely moved it in a release. Find the new location under\n` +
				`  the installed package and repoint this path — do not let it resolve to nothing.`
		);
	}

	const files = findDocModules(dir, accept);
	if (files.length === 0) {
		throw new Error(
			`content root for ${label} exists but ships no *.doc.mjs: ${dir}\n` +
				`  Either the layout changed under this directory or the package is incomplete.`
		);
	}

	return files;
}

/**
 * `docsZh` / `docsDense` are prose-only overlays the CLI merges at read time;
 * only `docs` reaches the site.
 *
 * @param {string} name
 */
const isPrimaryDoc = (name) =>
	name.endsWith('.doc.mjs') && !name.includes('.doc.zh.') && !name.includes('.doc.dense.');

/**
 * @param {string} file
 * @param {string} exportName
 */
async function importDoc(file, exportName) {
	const module = await import(pathToFileURL(file).href);
	return rewriteUpstreamSpecifiers(module[exportName]);
}

/**
 * Upstream's package names, rewritten out of upstream's prose.
 *
 * Reusing upstream's words is the whole design, but some of those words are
 * **import statements** — `Button`'s guidance says "use IconButton from
 * '@astryxdesign/core/IconButton'", and that reached real `astryx-svelte
 * component Button` output, telling a reader to import from a package they do
 * not have installed. 16 occurrences across 8 docs, on both surfaces (the CLI's
 * `.doc.mjs` and the site's registry), because both read this reconciliation.
 *
 * A scope-only rename would be wrong. Upstream publishes a subpath **per
 * component** (`/Button`, `/IconButton`, `/Table`, `/Calendar`,
 * `/DateRangeInput`) and this port publishes none of them — everything comes
 * off the root barrel. So the rule reads core's own `exports` and keeps a
 * mapped subpath only when core really has it (`./theme`, `./theme/syntax`,
 * `./locales/*`), collapsing the rest to `@astryx-svelte/core`. Reading the
 * export map rather than listing the survivors is what keeps this correct when
 * core's subpaths change.
 *
 * Applied at load, so every consumer of `reconcile()` gets it and no field has
 * to be enumerated. `assertNoUpstreamSpecifiers` then fails the run if anything
 * slips through, which is what makes the list above unnecessary to maintain.
 */
const CORE_SUBPATHS = new Set(
	Object.keys(JSON.parse(fs.readFileSync(path.join(CORE_ROOT, 'package.json'), 'utf8')).exports)
);

/** @param {string} subpath e.g. `/theme/syntax`, `''` */
function corePathExists(subpath) {
	if (subpath === '') return true;
	if (CORE_SUBPATHS.has(`.${subpath}`)) return true;
	// `./locales/*.json` and friends — one wildcard segment, as Node resolves it.
	return [...CORE_SUBPATHS].some((key) => {
		if (!key.includes('*')) return false;
		const [head, tail] = key.slice(1).split('*');
		return subpath.startsWith(head) && subpath.endsWith(tail);
	});
}

/** @param {string} text */
function rewriteSpecifiersIn(text) {
	return text
		.replace(/@astryxdesign\/core((?:\/[A-Za-z0-9._*-]+)*\/?)/g, (_match, subpath) => {
			const trailingSlash = subpath.endsWith('/');
			const clean = trailingSlash ? subpath.slice(0, -1) : subpath;
			if (corePathExists(clean)) return `@astryx-svelte/core${clean}${trailingSlash ? '/' : ''}`;
			return '@astryx-svelte/core';
		})
		.replace(/@astryxdesign\/theme-/g, '@astryx-svelte/theme-');
}

/**
 * Deep-rewrite every string in a loaded doc. Object keys are prop names and are
 * left alone; only values are prose.
 *
 * @param {unknown} value
 * @returns {any}
 */
function rewriteUpstreamSpecifiers(value) {
	if (typeof value === 'string') return rewriteSpecifiersIn(value);
	if (Array.isArray(value)) return value.map(rewriteUpstreamSpecifiers);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, inner]) => [key, rewriteUpstreamSpecifiers(inner)])
		);
	}
	return value;
}

/**
 * Fail the run if upstream's package name survived anywhere in the reconciled
 * entries. The rewrite above is only trustworthy if this is checked, and it is
 * cheaper to check exhaustively than to reason about which fields carry prose.
 *
 * @param {Array<Record<string, any>>} entries
 */
function assertNoUpstreamSpecifiers(entries) {
	const offenders = entries
		.filter((entry) => JSON.stringify(entry).includes('@astryxdesign'))
		.map((entry) => entry.name);
	if (offenders.length === 0) return;
	throw new Error(
		`[docs] upstream package name survived reconciliation in: ${offenders.join(', ')}\n` +
			`  Upstream's prose is reused verbatim, but its *import specifiers* are not this\n` +
			`  port's. Extend rewriteSpecifiersIn() to cover the new spelling.`
	);
}

// ---------------------------------------------------------------------------
// component registry
// ---------------------------------------------------------------------------

/**
 * Upstream's hard build gate: an entry with no explicit `displayName` produces
 * a blank sidebar label, so the build fails loudly instead.
 *
 * @param {Record<string, any>} entry
 * @param {string} file
 */
function requireDisplayName(entry, file) {
	if (typeof entry.displayName === 'string' && entry.displayName.length > 0) return;
	throw new Error(
		`Doc entry "${entry.name ?? '(unnamed)'}" in ${path.relative(WORKSPACE_ROOT, file)} ` +
			`has no displayName. Upstream's requireDisplayName() fails the build for this; ` +
			`so does ours.`
	);
}

/**
 * Flatten one `.doc.mjs` into the entries it describes.
 *
 * Three authored shapes have to be told apart, and getting this wrong silently
 * drops prose from the Overview tab:
 *
 * - **Single** (`props` at top level) — the doc *is* the entry.
 * - **Multi** (`components[]`) — each member is an entry. The member named after
 *   the doc itself is the primary one, and the doc's own `usage` / `theming` /
 *   `playground` belong to it: `Tooltip.doc.mjs` carries `usage` at top level
 *   and the props under `components[{name: 'Tooltip'}]`.
 * - **Both** — `Breadcrumbs.doc.mjs` has top-level `props` *and* a
 *   `components[]` listing `BreadcrumbItem`. 27 of the 42 multi-docs do this.
 *
 * A `ComponentRef` member (a bare `{name}` pointer to a sibling file) carries no
 * content and is dropped; the sibling contributes its own entry, and
 * `mergeEntries` reconciles the two.
 *
 * @param {Record<string, any>} doc
 * @param {string} file
 * @returns {Array<Record<string, any>>}
 */
function flattenDoc(doc, file) {
	const moduleName = path.basename(path.dirname(file));

	/** Fields a `components[]` member inherits from its parent when unset. */
	const inherited = {
		group: doc.group,
		category: doc.category,
		keywords: doc.keywords
	};

	/** Prose the primary member inherits, because it is authored on the parent. */
	const primaryOnly = {
		usage: doc.usage,
		theming: doc.theming,
		playground: doc.playground,
		examples: doc.examples
	};

	/** @type {Array<Record<string, any>>} */
	const entries = [];

	// The doc is itself an entry when it declares its own surface. `params`
	// covers HookDoc, which never uses `components[]`.
	if (doc.props || doc.params) {
		entries.push({ ...doc, moduleName, sourceFile: file });
	} else if (Array.isArray(doc.components) && !doc.components.some((m) => m?.name === doc.name)) {
		// A parent that documents only its family — no props of its own, and no
		// member carrying its name — was dropped entirely, taking its name with
		// it. 16 upstream docs have no own props; 12 of them name themselves in
		// `components[]` and are already covered by the primary-member branch
		// below. The other four are `Chat`, `Layer`, `Resizable` and `Stack`, and
		// **two of those are real exports** — `Stack` (`components/stack/
		// stack.svelte`) and `Layer` (`components/layer/layer.svelte`) — so the
		// gallery, the sidebar and `astryx-svelte component Stack` were all
		// missing a component core genuinely ships. `Chat` and `Resizable` are
		// group labels core does not export, and the surface filter drops them
		// without needing a special case here.
		//
		// It carries the parent's prose and no props, which is exactly what it
		// is: an overview page for a family whose members have their own.
		entries.push({ ...doc, ...primaryOnly, moduleName, sourceFile: file });
	}

	if (Array.isArray(doc.components)) {
		for (const member of doc.components) {
			if (!member || !(member.props || member.usage || member.params)) continue;

			const isPrimary = member.name === doc.name;
			// Only the primary member inherits the parent's prose; a sibling
			// sub-component listed alongside it must not claim the parent's usage.
			entries.push({
				...inherited,
				...(isPrimary ? primaryOnly : {}),
				// Which doc this member belongs to. Upstream states it explicitly on
				// the 80 sub-components extracted into their own files
				// (`SubComponentDoc.subComponentOf`) and leaves it implicit for the
				// ones still inline in a parent's `components[]`; recording it here
				// makes the two shapes agree. It is what lets `emit-core-docs.mjs`
				// emit a sub-component as a `SubComponentDoc` — the one member of the
				// `ComponentDoc` union whose `usage` is optional, which is exactly the
				// 81 entries that carry a one-line `description` instead. A member
				// that declares its own parent keeps it, hence the position.
				subComponentOf: isPrimary ? doc.subComponentOf : doc.name,
				...member,
				moduleName,
				sourceFile: file
			});
		}
	}

	// Neither shape matched: a doc with only prose (a provider, say). Still an
	// entry — it has a name and a displayName to render.
	if (entries.length === 0) {
		entries.push({ ...doc, moduleName, sourceFile: file });
	}

	for (const entry of entries) requireDisplayName(entry, file);
	return entries;
}

/**
 * Reconcile entries that several files describe.
 *
 * A sub-component extracted into its own sibling `.doc.mjs` is also listed in
 * its parent's `components[]`, so `BreadcrumbItem` arrives twice. Neither copy
 * is reliably the richer one, so they are merged field by field: the first
 * non-empty value wins, which keeps whichever file actually authored each field.
 *
 * @param {Array<Record<string, any>>} entries
 * @returns {Array<Record<string, any>>}
 */
function mergeEntries(entries) {
	/** @type {Map<string, Record<string, any>>} */
	const byName = new Map();

	/** @param {unknown} value */
	const isEmpty = (value) =>
		value == null || (Array.isArray(value) && value.length === 0) || value === '';

	for (const entry of entries) {
		const existing = byName.get(entry.name);
		if (!existing) {
			byName.set(entry.name, { ...entry });
			continue;
		}

		for (const [key, value] of Object.entries(entry)) {
			if (isEmpty(existing[key]) && !isEmpty(value)) existing[key] = value;
		}
	}

	return [...byName.values()];
}

/**
 * Upstream doc-table values this port deliberately corrects.
 *
 * The pipeline reuses upstream's prose verbatim, and that is right almost
 * everywhere — but a `.doc.mjs` can disagree with the source it documents, and
 * publishing the doc's version would mean shipping a *wrong* default for a prop
 * whose behaviour we ported correctly. CLAUDE.md's rule is that upstream bugs
 * are documented rather than replicated; this list is where that happens for
 * prose, exactly as the class oracle's `skip` list is for styles.
 *
 * Each entry names the upstream value it expects to find. If upstream changes
 * it — including fixing it — generation **throws**, so an entry cannot silently
 * rot into a correction of something that no longer says what it did.
 */
const DOC_CORRECTIONS = [
	{
		entry: 'useTableSortable',
		field: 'allowUnsortedState',
		key: 'default',
		upstream: 'false',
		corrected: 'true',
		reason:
			"upstream's doc table says `false`, but its own source is " +
			'`cfg.allowUnsortedState ?? true` and its TSDoc says `@default true`; ' +
			'this port follows the source, so the table must too'
	}
];

/**
 * Sentences the specifier rewrite turns into nonsense, and their replacements.
 *
 * `rewriteSpecifiersIn` collapses upstream's per-component subpaths onto the
 * root barrel, because this port publishes none of them. That is right for a
 * lone specifier and wrong for a sentence built on the *contrast* between two
 * of them: upstream's Button guidance reads "use IconButton from
 * `@astryxdesign/core/IconButton`. It is a separate component, not exported
 * from `@astryxdesign/core/Button`", and collapsing both sides leaves it
 * asserting that a package both does and does not export IconButton.
 *
 * The fact underneath also differs. Upstream splits the two across subpaths;
 * here `IconButton` and `Button` are both on the root barrel
 * (`dist/index.d.ts`), so the honest sentence is not upstream's with the names
 * swapped — it is a different sentence.
 *
 * Matched **after** the rewrite, so `find` is written in this port's spelling.
 * A replacement that stops matching fails the run, on {@link DOC_CORRECTIONS}'
 * rule: a correction nobody can find is a correction of something that no
 * longer says what it did.
 */
const PROSE_CORRECTIONS = [
	{
		entry: 'Button',
		find:
			"use IconButton from '@astryx-svelte/core'. It is a separate component, " +
			"not exported from '@astryx-svelte/core'.",
		replace:
			'use IconButton. It is a separate component from Button, exported from ' +
			"'@astryx-svelte/core' alongside it."
	},
	{
		entry: 'Button',
		find:
			'Tip: for a dedicated icon-only button component, use IconButton from ' +
			"'@astryx-svelte/core' instead.",
		replace: 'Tip: for a dedicated icon-only button component, use IconButton instead.'
	}
];

/**
 * Apply {@link PROSE_CORRECTIONS} to one entry, in place of the sentences the
 * specifier rewrite mangled.
 *
 * @param {Record<string, any>} entry
 */
function applyProseCorrections(entry) {
	const fixes = PROSE_CORRECTIONS.filter((c) => c.entry === entry.name);
	if (fixes.length === 0) return entry;

	let json = JSON.stringify(entry);
	for (const fix of fixes) {
		// Through JSON so the needle is escaped exactly as the haystack is.
		const needle = JSON.stringify(fix.find).slice(1, -1);
		if (!json.includes(needle)) {
			throw new Error(
				`[docs] stale prose correction for ${fix.entry}: the sentence it rewrites is no ` +
					`longer present.\n    looking for: ${fix.find}\n` +
					`  Upstream has reworded it, or the specifier rewrite has changed. Re-read the ` +
					`doc and delete or update the entry.`
			);
		}
		json = json.split(needle).join(JSON.stringify(fix.replace).slice(1, -1));
	}
	return JSON.parse(json);
}

/**
 * Apply {@link DOC_CORRECTIONS} to one entry's props or params.
 *
 * @param {string} entryName
 * @param {any[] | null} fields
 */
function applyDocCorrections(entryName, fields) {
	if (!Array.isArray(fields)) return fields;
	return fields.map((field) => {
		const fix = DOC_CORRECTIONS.find((c) => c.entry === entryName && c.field === field.name);
		if (!fix) return field;
		if (field[fix.key] !== fix.upstream) {
			throw new Error(
				`[docs] stale correction: ${fix.entry}.${fix.field}.${fix.key} is ` +
					`${JSON.stringify(field[fix.key])} upstream, not the ` +
					`${JSON.stringify(fix.upstream)} this entry was written against. ` +
					'Upstream has changed it — re-check the source and delete or update the entry.'
			);
		}
		return { ...field, [fix.key]: fix.corrected, correctedFromUpstream: fix.reason };
	});
}

/**
 * Reduce a reconciled row to the fields `PropEntry` declares and the site
 * renders.
 *
 * `mapProp` spreads the authored `PropDoc` through, so every field a `.doc.mjs`
 * happens to carry used to reach the registry whether or not anything read it.
 * That is how ~112 KB — 16% of the emitted bytes — came to be generated and
 * discarded, and two of those fields were worse than dead weight:
 *
 * - **`typeNotes`** described a React → Svelte rewrite on 244 rows whose type
 *   came from the compiler and therefore never went through that rewrite. The
 *   note on `AppShell.children` read "Renderable slots accept a string or a
 *   snippet" beside a declared type of `Snippet` — precisely the wrong claim
 *   CLAUDE.md names with `Button.icon`. On the 43 rows where the mapping *was*
 *   what got rendered, all 43 already carried a per-case `unsupported` note
 *   saying the same thing more specifically. Right on none of them.
 * - **`slotElements`** is upstream's serialised `createElement` argument for the
 *   playground's slot control (`parsePropType`, `PlaygroundPropsTable`), which
 *   this port does not have and could not drive from a React prop bag.
 *
 * `upstreamType` survives only where the row is `unverified`, because there the
 * displayed type *is* the mapping and naming what it was mapped from is the
 * whole provenance. On a compiler-typed row it is a React type sitting under a
 * heading that promises not to show one.
 *
 * @param {Record<string, any>} row
 * @returns {Record<string, any>}
 */
function finaliseRow(row) {
	/** @type {Record<string, any>} */
	const out = { name: row.name, type: row.type, description: row.description ?? '' };
	if (row.default != null) out.default = row.default;
	// Only the true case is read (`{#if row.required}`), and `required: false` is
	// the majority spelling upstream.
	if (row.required === true) out.required = true;
	if (row.renamedFrom) out.renamedFrom = row.renamedFrom;
	if (row.unverified) {
		out.unverified = true;
		if (typeof row.upstreamType === 'string' && row.upstreamType !== row.type) {
			out.upstreamType = row.upstreamType;
		}
	}
	if (row.unsupported) out.unsupported = row.unsupported;
	return out;
}

/**
 * Reconcile one documented prop against the type this library really declares.
 *
 * The doc supplies the prose and the default; the compiler supplies the type.
 * When core declares no such prop the doc's own (React-shaped) type is mapped
 * as a fallback and the prop is flagged — either the port is missing something
 * upstream has, or the prop is inherited through a spread the declarations do
 * not name. Both are worth seeing rather than papering over.
 *
 * @param {Record<string, any>} prop
 * @param {Map<string, string> | null} realTypes
 * @param {{name: string, missing: string[]}} report
 */
function reconcileProp(prop, realTypes, report) {
	const mapped = mapProp(prop);

	// Try every spelling the prop could carry here and use whichever core
	// actually declares, rather than asserting a rename that may not have
	// happened. `onClick` is `onclick`, `className` is `class`, and a prop the
	// port kept unchanged still resolves under its original name.
	//
	// **The authored spelling is tried first, and the order is load-bearing.** A
	// props interface that extends Svelte's HTML attributes inherits `onchange`,
	// `onclick` and every other DOM handler, so a lowercase-first order let the
	// inherited DOM handler shadow the component's own camelCase prop wherever
	// both existed. Four components documented the wrong callback because of it,
	// and `PowerSearch` was the worst: its real `onChange` is
	// `(filters, changeType, index) => void`, the page showed
	// `FormEventHandler<T> | null`, and it marked that row **Required** — so the
	// wrong signature read as the primary API. Preferring the authored name
	// picks the component's own prop where it has one and still falls through to
	// the DOM handler where it does not, which is what the other 33 collisions
	// were relying on all along.
	const candidates = [
		prop.name,
		mapped.name,
		typeof prop.name === 'string' && /^on[A-Z]/.test(prop.name) ? prop.name.toLowerCase() : null,
		prop.name === 'className' ? 'class' : null
	].filter(Boolean);

	for (const candidate of candidates) {
		const realType = realTypes?.get(candidate);
		if (!realType) continue;
		// `mapped` carries a `renamedFrom` from `EVENT_PROP_RENAMES`, which
		// renames unconditionally — before anyone knows whether core declares the
		// renamed spelling. Spreading it through meant a prop that resolved under
		// its *original* name still rendered "upstream: onChange" underneath a row
		// called `onChange`, on 33 rows across 30 entries. Drop it and re-add it
		// only when a rename actually happened.
		/** @type {Record<string, any>} */
		const resolved = { ...mapped, name: candidate, type: realType, upstreamType: prop.type };
		if (candidate === prop.name) delete resolved.renamedFrom;
		else resolved.renamedFrom = prop.name;
		return finaliseRow(resolved);
	}

	// Not declared by core. Most of these are expected and have a specific
	// reason the page should state, rather than showing a React type with no
	// explanation. Anything that matches none of them is real drift.
	// `realTypes` is null when core publishes *no* interface for the entry at
	// all. Guarding on it meant the report could see a component that declares
	// 22 of 23 props and not a hook that declares none of 11 — precisely
	// inverted, since the second is the larger gap. It reported zero while 85
	// rows across 15 pages rendered "not declared by core".
	const reason = classifyUndeclaredProp(prop.name, report.name);
	if (!reason) report.missing.push(prop.name);

	return finaliseRow({
		...mapped,
		upstreamType: prop.type,
		unverified: true,
		...(reason ? { unsupported: reason } : {})
	});
}

/**
 * Reconcile one documented **param** against the hook's real parameter list.
 *
 * Props are reconciled against one named interface; a hook's params are
 * positional arguments, so the signature's parameter list is the declaration
 * and `parameterTypesForFunction` is the reader for it. Three authored shapes
 * resolve — a positional parameter by name, a dotted `options.field`, and the
 * fields of a sole options object listed flat — and the note on that function
 * says which upstream doc uses which.
 *
 * The port's getter convention is exactly what this surfaces: `useMediaQuery`'s
 * `query` is `() => string` here and the doc says `string`, so every one of
 * these rows was documenting the React signature until now.
 *
 * @param {Record<string, any>} param
 * @param {import('./lib/props-types.mjs').ParameterTypes | null} paramTypes
 * @param {{name: string, missing: string[]}} report
 */
function reconcileParam(param, paramTypes, report) {
	const mapped = mapProp(param);
	const authored = typeof param.name === 'string' ? param.name : '';

	// `options.speed` — a field of a named parameter — versus a positional
	// parameter or a field of the sole options object.
	const dot = authored.indexOf('.');
	const prefix = dot > 0 ? authored.slice(0, dot + 1) : '';
	const leaf = dot > 0 ? authored.slice(dot + 1) : authored;

	/** @param {string} candidate */
	const lookUp = (candidate) =>
		dot > 0
			? paramTypes?.membersByParam.get(authored.slice(0, dot))?.get(candidate)
			: (paramTypes?.byName.get(candidate) ?? paramTypes?.sole?.get(candidate));

	// Two renames the port makes on *option fields*, both of which the
	// declaration confirms before they are asserted — a candidate that resolves
	// to nothing is simply skipped, so neither rule can invent a spelling.
	//
	// - `onClick` is `onclick`. Handlers on an options object follow the DOM
	//   casing here exactly as they do on a component's props.
	// - `containerRef` is `container`. Upstream's clickable/input-container hooks
	//   take React ref *objects*; this port takes the element itself, straight
	//   from `bind:this` — so the name loses its `Ref` suffix and the type
	//   becomes `HTMLElement | null`. The generic `Ref$` note is about a hook's
	//   *return* being an attachment and would be wrong here, which is why the
	//   rename has to be tried before the classifier is consulted.
	const candidates = [
		leaf,
		/^on[A-Z]/.test(leaf) ? leaf.toLowerCase() : null,
		/.Ref$/.test(leaf) ? leaf.slice(0, -3) : null
	].filter((candidate) => typeof candidate === 'string');

	for (const candidate of candidates) {
		const realType = lookUp(candidate);
		if (!realType) continue;
		return finaliseRow({
			...mapped,
			name: prefix + candidate,
			// `EVENT_PROP_RENAMES` renames on the *doc's* say-so; here the rename
			// is only recorded once the declaration has confirmed it.
			renamedFrom: candidate === leaf ? undefined : authored,
			type: realType,
			upstreamType: param.type
		});
	}

	const reason = classifyUndeclaredProp(authored, report.name);
	if (!reason) report.missing.push(authored);

	return finaliseRow({
		...mapped,
		name: authored,
		renamedFrom: undefined,
		upstreamType: param.type,
		unverified: true,
		...(reason ? { unsupported: reason } : {})
	});
}

/**
 * Rows a single named entry declares differently, keyed `<entry>.<row>`.
 *
 * These are scoped to one entry because their names are ordinary words —
 * `value`, `showToast`, `initialState` — that mean something else on every other
 * page. A name-only rule would explain the wrong row somewhere else.
 *
 * Four of the five are **one shape**, and it is not the one it looks like from
 * the flag alone. Upstream's `HookDoc.returns` is a table, so a hook that
 * returns a bare value still needs a name in the Field column, and `.doc.mjs`
 * invents one: `useToast` returns `ShowToastFn` upstream (`useToast.tsx:170`),
 * `useTranslator` returns `TranslatorFn` (`useTranslator.ts:43`) and
 * `useEntryAnimation` returns `StyleXStyles | null`
 * (`useEntryAnimation.ts:119`) — no wrapper object exists on either side. The
 * row is a label, and the port matches upstream exactly.
 *
 * `useStreamingText` is the one real divergence, and it runs the *other* way:
 * upstream returns a bare `string` (`useStreamingText.ts:94`) and this port
 * returns `StreamingTextState`, because a string cannot stay live across a
 * Svelte component's lifetime. So the port added the wrapper rather than
 * removing one.
 */
const ENTRY_ROW_NOTES = new Map([
	[
		'useToast.showToast',
		'`useToast()` returns this function itself — `ShowToastFn`, i.e. `(options: ToastOptions) => ToastDismissFn`. Upstream returns it the same way; the name is its doc table’s label for the single return value, not a member to read off an object.'
	],
	[
		'useTranslator.value',
		'`useTranslator()` returns the translator itself — `TranslatorFn`, i.e. `(key: string, values?: Record<string, unknown>) => string`. Upstream returns it the same way; the name labels the single return value rather than a member.'
	],
	[
		'useEntryAnimation.entryStyle',
		'`useEntryAnimation()` returns the style itself — `StyleArg | null`, this port’s spelling of upstream’s `StyleXStyles | null`. Spread it with `sx(...)`; the name labels the single return value rather than a member.'
	],
	[
		'useStreamingText.displayedText',
		'Called `current` here: the hook returns a live `StreamingTextState`, so read `displayed.current`. Upstream returns a bare `string`, which cannot stay reactive across a Svelte component’s lifetime — this is the one row where the port wraps a value upstream returns plain.'
	],
	[
		'useTableFilterState.initialState',
		'This is the hook’s argument, not a field it returns: `useTableFilterState(initialState?: TableFilterState)`. Upstream documents it in a props table because the entry is authored as a component doc. The result is `UseTableFilterStateResult` — `filters`, `onFilterChange` and `clearAll`.'
	]
]);

/**
 * Keys of {@link ENTRY_ROW_NOTES} that actually explained a row this run.
 *
 * A note whose row stops being undeclared — because the port grows the member,
 * or upstream renames the row — would otherwise go quiet and leave a paragraph
 * of prose in this file describing a state of affairs that has ended. Same rule
 * the class oracle's `skip` list runs on: a deferral that stops matching fails
 * the run rather than rotting.
 *
 * @type {Set<string>}
 */
const usedEntryRowNotes = new Set();

/**
 * Why a documented prop has no declaration in this port.
 *
 * Each of these is a translation the port makes deliberately and records in
 * port/todo.md; naming them here keeps the props table honest instead of printing a
 * React type as though it were the Svelte API.
 *
 * @param {string} name
 * @param {string} [entryName]
 * @returns {string | null}
 */
function classifyUndeclaredProp(name, entryName) {
	const key = `${entryName}.${name}`;
	const scoped = entryName ? ENTRY_ROW_NOTES.get(key) : undefined;
	if (scoped) {
		usedEntryRowNotes.add(key);
		return scoped;
	}
	// Three different translations used to share one note, and it described none
	// of them correctly.
	//
	// `handleRef` is an imperative *handle*, not an element reference: upstream
	// hands back an object of operations, and this port publishes those same
	// operations as instance exports — `Calendar.navigateTo`, `Tokenizer.focus`
	// / `blur`, `PowerSearch.focusTypeahead` / `blurTypeahead`,
	// `SideNav.getCollapseState`. Eight rows were being told to use `bind:this`
	// on an element, which is not where any of those live.
	if (name === 'handleRef') {
		return 'Upstream exposes an imperative handle here. This port publishes those operations as instance exports — reach them with `bind:this` on the component.';
	}
	// A hook's `*Ref` return is an attachment, and it is renamed: `containerRef`
	// is `attachContainer`, `listRef` is `attachList`, and so on.
	if (/Ref$/.test(name)) {
		return 'Element references are attachments here. The port returns an `Attachment<HTMLElement>` named `attach…`; spread it onto the element instead of assigning a ref.';
	}
	// A plain `ref` prop on a component. `bind:this` is only half an answer —
	// on a *component* it yields the component instance, not its element — so
	// the note leads with the part that always works.
	if (name === 'ref') {
		return 'Svelte has no ref prop. Reach the element with an attachment through the spread props; `bind:this` on a component yields the instance rather than its element.';
	}
	if (name.startsWith('data-') || name.startsWith('aria-')) {
		return 'Forwarded through the rest props rather than declared, so it is not in the interface.';
	}
	if (name === 'children') {
		return 'This component takes its content as data (`items`) plus an `item` snippet, because the list is sliced rather than rendered whole.';
	}
	// `element` is documented only by the two imperative-dialog hooks, whose
	// upstream return is a rendered `ReactNode`. A Svelte hook cannot return
	// markup, so the rendering half is a component instead — the same split
	// `useLayer`/`useTooltip`/`useLightbox` already take. Without this case the
	// type mapper turns `ReactNode` into `string | Snippet` and the page
	// advertises a member the port does not ship, described as a slot it is not.
	if (name === 'element') {
		return 'A Svelte hook cannot return markup. Render the companion component instead — `<ImperativeDialogLayer {dialog} />` or `<ImperativeAlertDialogLayer {alert} />`.';
	}
	// The same divergence as `element`, in its other spelling. `useLayer`,
	// `usePopover`, `useHoverCard`, `useTooltip` and `useKeyboardHint` each
	// return a render function upstream; a Svelte hook has no way to, so every
	// one of them ships a companion component and the hook returns only state.
	// Without this branch the type mapper turns `ReactNode` into
	// `string | Snippet` and the page advertises a member the port does not have.
	if (/^render[A-Z]?/.test(name) || name === 'hintElement') {
		return 'A Svelte hook cannot return markup. This hook returns state only; render its companion component and pass the hook’s value to it.';
	}
	return null;
}

/**
 * Reduce an authored `playground` block to the fields the stage reads.
 *
 * An allowlist for the same reason `finaliseRow` is one: the audit that closed
 * `typeNotes` and `slotElements` established that a field carried into the
 * registry and never rendered is a field the next reader will try to use. Three
 * fields are read here, and each drives visible behaviour — `defaults` seeds the
 * knobs, `wrapper` supplies the parent a sub-component needs to render at all,
 * and `overlay` is why two entries show a placeholder instead of hijacking the
 * page.
 *
 * **A default whose value is an upstream `ElementDescriptor` is dropped.** A
 * descriptor is a serialised React `createElement` argument (`{__element: 'Text',
 * props, children}`) — the same shape `slotElements` carried, and dropped for the
 * same reason: this port's slots are `Snippet`s, and there is no honest way to
 * turn a serialised React element into one. 36 of upstream's 149 defaults are
 * descriptors, all of them on slot props, so those slots seed empty and the text
 * control fills them instead.
 *
 * @param {unknown} playground
 * @returns {Record<string, any> | null}
 */
function normalisePlayground(playground) {
	if (playground == null || typeof playground !== 'object') return null;
	const authored = /** @type {Record<string, any>} */ (playground);

	/**
	 * A serialised React element — see the note above.
	 * @param {unknown} value
	 */
	const isDescriptor = (value) =>
		value != null && typeof value === 'object' && '__element' in value;

	/**
	 * Descriptors nest, and `EmptyState.actions` is an array of them.
	 * @param {unknown} value
	 * @returns {boolean}
	 */
	const carriesDescriptor = (value) =>
		isDescriptor(value) || (Array.isArray(value) && value.some(carriesDescriptor));

	/** @type {Record<string, any>} */
	const out = {};

	if (authored.defaults != null && typeof authored.defaults === 'object') {
		/** @type {Record<string, any>} */
		const defaults = {};
		for (const [key, value] of Object.entries(authored.defaults)) {
			// `undefined` is authored deliberately (`AlertDialog.onOpenChange`) and
			// means "leave unset"; a function would vanish in `JSON.stringify`
			// anyway, so drop both rather than emit a key whose value disappears.
			if (value === undefined || typeof value === 'function') continue;
			if (carriesDescriptor(value)) continue;
			defaults[key] = value;
		}
		if (Object.keys(defaults).length > 0) out.defaults = defaults;
	}

	if (authored.overlay === true) out.overlay = true;

	if (authored.wrapper != null && typeof authored.wrapper.component === 'string') {
		out.wrapper = { component: authored.wrapper.component };
		if (authored.wrapper.props != null && typeof authored.wrapper.props === 'object') {
			out.wrapper.props = authored.wrapper.props;
		}
	}

	return Object.keys(out).length > 0 ? out : null;
}

/**
 * Normalise one flattened entry into the shape the site renders.
 *
 * @param {Record<string, any>} entry
 * @param {Map<string, string>} importPathByName
 * @param {ReturnType<typeof createPropsTypeIndex>} propsIndex
 * @param {Array<{name: string, missing: string[]}>} reports
 */
function normaliseEntry(entry, importPathByName, propsIndex, reports) {
	const isHook = Array.isArray(entry.params);

	// Hooks publish no `<Name>Props` interface; their params and returns keep
	// the doc's own types, mapped.
	const realTypes = isHook ? null : propsIndex.typesForAny(propsTypeNamesFor(entry.name));
	// Signature first, named types only as a fallback — see `returnTypesForFunction`.
	const returnTypes =
		propsIndex.returnTypesForFunction(entry.name) ??
		propsIndex.typesForAny(returnTypeNamesFor(entry.name));
	// A hook's params have no named type to check against; the signature's
	// parameter list is the declaration. See `reconcileParam`.
	const paramTypes = isHook ? propsIndex.parameterTypesForFunction(entry.name) : null;
	const report = { name: entry.name, missing: [] };

	// Hooks carry their own category vocabulary (`focus`, `interaction`, `layout`
	// …) and never appear in the component gallery, so the gallery buckets do
	// not apply to them.
	if (!isHook && entry.category && !CATEGORIES.has(entry.category)) {
		console.warn(
			`  ! ${entry.name}: unknown category "${entry.category}" — rendered, but not a known gallery bucket`
		);
	}

	const normalised = {
		name: entry.name,
		displayName: entry.displayName,
		// Sub-components and `components[]` members carry a one-line
		// `description` instead of a full `usage` block; it is the only prose
		// their page has, so it must survive normalisation.
		description: entry.description ?? null,
		moduleName: entry.moduleName,
		importPath: importPathByName.get(entry.name) ?? '@astryx-svelte/core',
		group: entry.group ?? null,
		category: entry.category ?? null,
		keywords: entry.keywords ?? [],
		isHook,
		hidden: entry.hidden === true,
		isHiddenFromOverview: entry.isHiddenFromOverview === true,
		usage: entry.usage ?? null,
		// `propsTypeName` is null when core publishes no interface for this
		// entry — the page uses it to say the types are unverified. When there
		// *is* one, it must be the candidate that actually matched rather than a
		// synthesised `<Name>Props`: the page prints "types are read from core's
		// own `<X>` declaration", and citing a declaration the reader cannot find
		// is worse than citing none.
		propsTypeName: realTypes ? propsIndex.firstMatchingName(propsTypeNamesFor(entry.name)) : null,
		// `params != null` is upstream's discriminator for "this is a hook", and a
		// hook's surface is its signature, not a props table. `useResizable` is
		// described by both its own `useResizable.doc.mjs` (params) and a
		// `components[]` member in `Resizable.doc.mjs` (props); merging keeps
		// both, so the hook branch has to win or the page would render a props
		// table of config fields the hook does not take as props.
		props:
			!isHook && Array.isArray(entry.props)
				? applyDocCorrections(
						entry.name,
						entry.props.map((prop) => reconcileProp(prop, realTypes, report))
					)
				: null,
		// Reconciled against the signature's **parameter list** — the counterpart
		// of `returnTypesForFunction` for arguments, and the thing that finally
		// puts the port's getter convention on the page. See `reconcileParam`.
		// `Array.isArray(entry.params)` rather than `isHook` — they are the same
		// predicate, but only the array check narrows the type for the callback.
		params: Array.isArray(entry.params)
			? applyDocCorrections(
					entry.name,
					entry.params.map((param) => reconcileParam(param, paramTypes, report))
				)
			: null,
		// Reconciled against `<Name>Return` for the same reason props are
		// reconciled against `<Name>Props`: the compiler decides what the port
		// really returns. See `returnTypeNamesFor`.
		returns: Array.isArray(entry.returns)
			? entry.returns.map((member) => reconcileProp(member, returnTypes, report))
			: null,
		// Upstream renders a Theming section on the component detail Overview
		// (`component-detail/Theming.tsx`: a targets table, a copyable
		// `defineTheme` example and a themeable-vars table). This port has not
		// built it — it needs `Table` and upstream's `themingHelpers` — so the
		// data is carried unrendered *on purpose*, unlike `slotElements` and the
		// rest, which were carried by accident and are gone. Tracked in port/todo.md.
		theming: entry.theming ?? null,
		// The knobs' seed. `flattenDoc` already treats this as prose the primary
		// member inherits, so a multi-doc's playground reaches the entry it was
		// authored for; it just never got past normalisation until there was a
		// stage to read it. Most entries have none, and the stage works from the
		// compiler's prop types alone in that case.
		playground: normalisePlayground(entry.playground),
		// ── Below here: reconciled, but not part of the site's registry. ──
		//
		// The props-page audit dropped these because the site renders none of
		// them, and that reasoning still holds *for the site* — `projectForSite`
		// strips them before `component-registry.js` is written, so the emitted
		// bytes are unchanged. They survive normalisation because a second
		// consumer reads the same reconciliation: `emit-core-docs.mjs` writes
		// core's own `.doc.mjs` files, and the CLI's doc contract declares all four
		// (`SubComponentDoc.subComponentOf`, `ComponentBaseDoc.hiddenComponents`,
		// `HookDoc.relatedComponents` / `relatedHooks`). Dropping them here would
		// mean re-deriving the reconciliation somewhere else, which is the one
		// thing that must not happen twice.
		subComponentOf: entry.subComponentOf ?? null,
		hiddenComponents: entry.hiddenComponents ?? null,
		relatedComponents: entry.relatedComponents ?? null,
		relatedHooks: entry.relatedHooks ?? null,
		// Carried in order to be *refused*, which is why it is last and separate.
		// `ComponentBaseDoc.examples` exists and the CLI renders it, but upstream's
		// `code` is JSX — `<Field status={{type: 'success'}}>`, `defaultValue`, a
		// React function component — and this port's own `ComponentExampleDoc.code`
		// says "Svelte source for the example". Emitting it verbatim would put
		// React in a Svelte CLI's output, the `Button.icon` mistake CLAUDE.md
		// names. `emit-core-docs.mjs` drops these and asserts the set has not
		// changed, so the deferral cannot rot into a silent omission.
		upstreamExamples: entry.examples ?? null
	};

	if (report.missing.length > 0) reports.push(report);
	return normalised;
}

/**
 * The site's view of a reconciled entry.
 *
 * An explicit allowlist, for the same reason `finaliseRow` is one — and the key
 * order is load-bearing in the same way: it is what `JSON.stringify` writes, so
 * reordering it is a whole-file diff on a 700 KB generated module.
 *
 * @param {Record<string, any>} entry
 * @returns {Record<string, any>}
 */
function projectForSite(entry) {
	return {
		name: entry.name,
		displayName: entry.displayName,
		description: entry.description,
		moduleName: entry.moduleName,
		importPath: entry.importPath,
		group: entry.group,
		category: entry.category,
		keywords: entry.keywords,
		isHook: entry.isHook,
		hidden: entry.hidden,
		isHiddenFromOverview: entry.isHiddenFromOverview,
		usage: entry.usage,
		propsTypeName: entry.propsTypeName,
		props: entry.props,
		params: entry.params,
		returns: entry.returns,
		theming: entry.theming,
		playground: entry.playground
	};
}

/**
 * Give every sub-component the family fields its parent declares.
 *
 * `SubComponentDoc` says this in as many words — "Family-level fields (`group`,
 * `category`, `keywords`, `theming`, `playground`) are inherited from the
 * directory's primary doc unless overridden here" — and upstream's
 * sub-component files rely on it: `AvatarGroupOverflow.doc.mjs` declares
 * `subComponentOf: 'AvatarGroup'` and leaves `group` and `category`
 * **undefined**.
 *
 * `flattenDoc` already does this for members written *inline* in a parent's
 * `components[]`, where the parent is in scope. It could not do it for the ~80
 * sub-components upstream extracted into their own files, because the parent is
 * a different file that may not be loaded yet — so those arrived ungrouped and
 * uncategorised, and two visible surfaces broke:
 *
 * - **the sidebar**, where 115 entries sat flat at top level instead of under
 *   their family. `AvatarGroupOverflow` and `AvatarStatusDot` rendered as
 *   siblings of `Avatar` rather than inside it; all 14 Chat sub-components, 7
 *   Command Palette, 6 Dropdown Menu and 4 Table entries did the same;
 * - **the overview gallery**, which buckets by `category` and so silently
 *   omitted the 79 entries that had none.
 *
 * Only unset fields are filled — a sub-component that declares its own wins,
 * which is what "unless overridden here" means. `theming` and `playground` are
 * named in that sentence too but are deliberately *not* inherited here:
 * `flattenDoc` treats them as the primary member's own prose, and a sibling
 * inheriting the parent's playground seed would render the parent's props.
 *
 * @param {Array<Record<string, any>>} entries
 * @param {Map<string, {group?: string, category?: string, keywords?: string[]}>} familyByName
 */
function inheritFamilyFields(entries, familyByName) {
	for (const entry of entries) {
		if (!entry.subComponentOf) continue;
		const family = familyByName.get(entry.subComponentOf);
		if (!family) continue;
		if (entry.group == null && family.group != null) entry.group = family.group;
		if (entry.category == null && family.category != null) entry.category = family.category;
		if (entry.keywords == null && family.keywords != null) entry.keywords = family.keywords;
	}
}

/**
 * Build the component registry, filtered to core's published surface.
 *
 * @param {ReturnType<typeof readCoreExports>} surface
 * @param {ReturnType<typeof createPropsTypeIndex>} propsIndex
 */
async function buildComponentRegistry(surface, propsIndex) {
	const files = requireDocModules(path.join(UPSTREAM_CORE, 'src'), 'component docs', isPrimaryDoc);

	/** @type {Array<Record<string, any>>} */
	const all = [];
	/**
	 * Family fields, keyed by the doc that owns them. Collected across *all*
	 * files because the owner is usually a different file from the member — see
	 * `inheritFamilyFields`.
	 *
	 * @type {Map<string, {group?: string, category?: string, keywords?: string[]}>}
	 */
	const familyByName = new Map();
	for (const file of files) {
		const doc = await importDoc(file, 'docs');
		if (!doc) continue;
		if (doc.name && !doc.subComponentOf) {
			familyByName.set(doc.name, {
				group: doc.group,
				category: doc.category,
				keywords: doc.keywords
			});
		}
		all.push(...flattenDoc(doc, file));
	}

	inheritFamilyFields(all, familyByName);

	// Props a doc names but core does not declare, collected while normalising
	// so the run can report them in one place.
	/** @type {Array<{name: string, missing: string[]}>} */
	const reports = [];

	const normalised = mergeEntries(all).map((entry) =>
		applyProseCorrections(normaliseEntry(entry, surface.importPathByName, propsIndex, reports))
	);

	const ported = normalised.filter((entry) => surface.names.has(entry.name));
	const unported = normalised
		.filter((entry) => !surface.names.has(entry.name))
		.map((entry) => entry.name)
		.sort();

	// Sorted so the emitted file is stable across runs and diffs cleanly.
	ported.sort((a, b) => a.name.localeCompare(b.name));

	// Only report drift for components we actually document.
	const portedNames = new Set(ported.map((entry) => entry.name));
	const drift = reports.filter((report) => portedNames.has(report.name));

	// A note that explained nothing is a note describing a state of affairs that
	// has ended. Fail rather than let the prose rot — see `usedEntryRowNotes`.
	const stale = [...ENTRY_ROW_NOTES.keys()].filter((key) => !usedEntryRowNotes.has(key));
	if (stale.length > 0) {
		throw new Error(
			`[docs] stale ENTRY_ROW_NOTES: ${stale.join(', ')}\n` +
				`  Each of these explains a documented row core does not declare, and this run\n` +
				`  found the row declared (or gone). Re-check the hook and delete or rewrite the note.`
		);
	}

	return { entries: ported, unported, totalUpstream: normalised.length, drift };
}

// ---------------------------------------------------------------------------
// sidebar grouping — upstream's generateGroupedComponentRegistry rules
// ---------------------------------------------------------------------------

/**
 * The sidebar's view of an entry: the label it renders and the name it links to.
 *
 * The grouped registry used to re-serialise the whole `ComponentEntry` — props,
 * usage prose, theming, all of it — and `side-nav.svelte` imports it into the
 * **client** bundle, where it landed as a second full copy of a registry the
 * bundle already had. Rollup cannot dedupe them: they are two modules with two
 * object literals, identical in content and unrelated by identity, so the client
 * shipped both. Two fields is what the nav reads; two fields is what it gets.
 *
 * @param {Record<string, any>} entry
 */
const sidebarEntry = (entry) => ({ name: entry.name, displayName: entry.displayName });

/**
 * @param {Array<Record<string, any>>} entries
 */
function buildGroupedRegistry(entries) {
	const visible = entries.filter((entry) => !entry.hidden);

	/** @type {Map<string, Array<Record<string, any>>>} */
	const groups = new Map();
	/** @type {Array<Record<string, any>>} */
	const utilities = [];

	for (const entry of visible) {
		// A hook with no parent group, or anything explicitly grouped as
		// Utilities, goes to the collapsed-by-default bucket rendered last.
		if (entry.group === 'Utilities' || (entry.isHook && !entry.group)) {
			utilities.push(entry);
			continue;
		}

		const key = entry.group ?? entry.name;
		const bucket = groups.get(key) ?? [];
		bucket.push(entry);
		groups.set(key, bucket);
	}

	/** @type {Array<Record<string, any>>} */
	const items = [];

	for (const [label, members] of groups) {
		members.sort((a, b) => a.name.localeCompare(b.name));

		// A group with one member renders as a plain link, not an expander.
		if (members.length === 1) {
			items.push({ kind: 'item', sortKey: members[0].name, entry: sidebarEntry(members[0]) });
			continue;
		}

		items.push({ kind: 'group', sortKey: label, label, entries: members.map(sidebarEntry) });
	}

	items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
	utilities.sort((a, b) => a.name.localeCompare(b.name));

	return { items, utilities: utilities.map(sidebarEntry) };
}

// ---------------------------------------------------------------------------
// reference docs
// ---------------------------------------------------------------------------

/**
 * The reference topics, read from **this port's own CLI**.
 *
 * They used to come from `@astryxdesign/cli`'s `assets/docs/`, and every page was
 * therefore React-shaped: `npm install @astryxdesign/core`, per-component
 * subpaths, `colorVars` imports, `astryx.config.ts`, a Next.js `app/layout.tsx`
 * and a CSS-file-per-component import list none of which describe this library.
 * `rewriteSpecifiersIn` could fix the package *name* in a specifier and nothing
 * else — a rename cannot turn a `.tsx` snippet into a `.svelte` one, and it
 * cannot turn a claim that is false here into one that is true.
 *
 * `packages/cli/assets/docs/` now carries all 27 files rewritten for this port,
 * so the site reads them instead. This is the same two-source rule the component
 * registry already runs on, applied to the prose: upstream supplies the topics,
 * the *port* supplies what is true of the port.
 *
 * `importDoc` still runs the specifier rewrite over these — not because they are
 * expected to need it, but because {@link assertNoUpstreamSpecifiers} is the
 * thing that proves they do not, and it can only prove it if the rewrite has
 * already had its chance. A topic that reintroduces `@astryxdesign` fails the
 * run exactly as a component entry does.
 */
async function buildDocsRegistry() {
	const dir = path.join(WORKSPACE_ROOT, 'packages', 'cli', 'assets', 'docs');
	const files = requireDocModules(dir, 'reference topics', isPrimaryDoc).sort();

	/** @type {Array<Record<string, any>>} */
	const topics = [];

	for (const file of files) {
		const doc = await importDoc(file, 'docs');
		if (!doc) continue;

		topics.push({
			name: doc.name,
			title: doc.title,
			description: doc.description ?? '',
			category: doc.category ?? null,
			tokenCategory: doc.tokenCategory ?? null,
			sections: Array.isArray(doc.sections) ? doc.sections : []
		});
	}

	assertNoUpstreamSpecifiers(topics);
	return topics;
}

// ---------------------------------------------------------------------------
// library packages
// ---------------------------------------------------------------------------

/**
 * The non-theme packages, which `/docs/<slug>` serves as README reference pages
 * and the sidebar lists under **Libraries**.
 *
 * Upstream's `generatePackageRegistry` expands its `pnpm-workspace.yaml` globs
 * and emits one entry per `packages/*`, carrying the README and CHANGELOG text.
 * `/docs/[topic]` then branches: a slug that is not a doc topic is looked up
 * here, and a non-theme hit renders `PackageStubPage`. Theme packages are
 * excluded because `/themes/<slug>` owns them — the same split
 * {@link buildThemeRegistry} is the other half of.
 *
 * Three differences, each forced by a fact about this repo rather than chosen:
 *
 * 1. **A `private` package is kept, not skipped.** Upstream drops
 *    `private: true` entries because a package it does not publish is a package
 *    it does not document. `@astryx-svelte/cli` is private at `0.0.0` and is
 *    nonetheless the CLI this whole port is driven by, so dropping it would
 *    remove the one page that explains how to run it. The flag is carried
 *    instead, and the install block says plainly that npm will not resolve it —
 *    an honest page beats a missing one, and beats a page whose install command
 *    silently fails.
 * 2. **"Installed in the docsite" is not the filter.** Upstream skips packages
 *    the docsite does not depend on; `docs/` depends on core and the eight
 *    themes but not on the CLI, while the reference topics it renders already
 *    come out of `packages/cli/assets/docs`. Membership of `packages/*` is the
 *    honest test here.
 * 3. **No CHANGELOG.** Upstream's registry carries one for `/changelog`, which
 *    is out of the cut and has no data (port/todo.md, Phase 5). Generating a field
 *    nothing renders is the `typeNotes` mistake, so it is not generated.
 *
 * The README text is the port's own prose — these are this repository's files,
 * not upstream's — but it still goes through `rewriteSpecifiersIn` before
 * {@link assertNoUpstreamSpecifiers} sees it, for the reason
 * {@link buildDocsRegistry} states: the assertion can only prove the rewrite was
 * unnecessary if the rewrite has already had its chance.
 */
/**
 * Discover, validate and sort the blog — upstream's `generateBlogRegistry()`.
 *
 * The work is not done here. `src/lib/blog/posts.mjs` is upstream's own module,
 * ported verbatim, and it owns the frontmatter parser, the schema validation,
 * the reading-time estimate and the latest-first ordering. This function is the
 * thin caller upstream's is, so the two cannot drift: a post that builds here
 * would build there.
 *
 * **Drafts follow `NODE_ENV`, as upstream's do** — included in dev, excluded
 * from production output. That is the one line worth reading twice, because it
 * means `pnpm dev` and `pnpm build` legitimately disagree about the post count,
 * and a `draft: true` post that renders locally is *supposed* to vanish from the
 * deploy.
 *
 * Validation failures throw, and nothing catches them: `generate()` runs before
 * every dev server and every build, so a malformed post fails the build with a
 * slug-prefixed message rather than shipping a broken page. That is what
 * replaces upstream's `blog.test.ts`, which this port has no runner for.
 */
async function buildBlogRegistry() {
	const postsDir = path.join(DOCS_ROOT, 'src', 'content', 'blog', 'posts');
	const { discoverPosts, collectTypes, collectTags } = await import(
		pathToFileURL(path.join(DOCS_ROOT, 'src', 'lib', 'blog', 'posts.mjs')).href
	);

	const includeDrafts = process.env.NODE_ENV !== 'production';
	const posts = discoverPosts(postsDir, { includeDrafts });

	return { posts, types: collectTypes(posts), tags: collectTags(posts) };
}

function buildLibraryPackages() {
	const dir = path.join(WORKSPACE_ROOT, 'packages');
	if (!fs.existsSync(dir)) {
		throw new Error(`content root for library packages does not exist: ${dir}`);
	}

	/** @type {Array<Record<string, any>>} */
	const packages = [];

	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const manifestPath = path.join(dir, entry.name, 'package.json');
		if (!fs.existsSync(manifestPath)) continue;

		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		const name = /** @type {string} */ (manifest.name);
		const slug = name.replace(/^@astryx-svelte\//, '');
		if (slug === name) continue;
		// `/themes/<slug>` serves these; upstream's route excludes them too.
		if (slug.startsWith('theme-')) continue;

		const readmePath = path.join(dir, entry.name, 'README.md');
		const readme = fs.existsSync(readmePath)
			? rewriteSpecifiersIn(fs.readFileSync(readmePath, 'utf8'))
			: null;

		packages.push({
			slug,
			name,
			// Upstream's rule, verbatim: the manifest's own `displayName` if it
			// declares one, else the scope stripped and the first letter
			// capitalised. Both manifests declare one, because the derivation
			// gives "Cli" where the page should say "CLI" — which is exactly why
			// upstream's core and cli manifests carry the field too. It reaches
			// only the document title.
			displayName: manifest.displayName || slug.replace(/^\w/, (c) => c.toUpperCase()),
			version: manifest.version,
			description: manifest.description ?? '',
			isPrivate: manifest.private === true,
			readme
		});
	}

	if (packages.length === 0) {
		throw new Error(`no library packages found under ${dir} — the layout must have changed.`);
	}

	packages.sort((a, b) => a.name.localeCompare(b.name));
	assertNoUpstreamSpecifiers(packages);
	return packages;
}

// ---------------------------------------------------------------------------
// theme packages
// ---------------------------------------------------------------------------

/**
 * Every theme package this port publishes, read from `packages/themes/*`.
 *
 * Upstream generates the equivalent (`themeRegistry.ts` + `packageRegistry.ts`)
 * by scanning its own workspace, and `/themes` reads it. Same idea here, with
 * the one difference that matters for this repo: a package's **upstream
 * counterpart is recorded, not assumed**. Seven of the eight declare
 * `@astryxdesign/theme-<slug>` as a devDependency because their oracle diffs
 * against it; `liquid-glass` declares none, because it ports nothing (port/todo.md →
 * Known debts). Reading the devDependency rather than listing the survivors is
 * what keeps that claim true after the next theme lands.
 *
 * `shared` is not a theme package — it is the build tooling the eight import —
 * and is skipped by the `theme-` name test rather than by name, so a second
 * non-theme directory needs no edit here.
 *
 * Everything else the page shows (token counts, light/dark pairs, component
 * overrides, the heading family) is read off the imported theme object at
 * render time. It is derived data, and generating a stale copy of it here would
 * be the `typeNotes` mistake again.
 */
function buildThemeRegistry() {
	const dir = path.join(WORKSPACE_ROOT, 'packages', 'themes');
	if (!fs.existsSync(dir)) {
		throw new Error(`content root for theme packages does not exist: ${dir}`);
	}

	/** @type {Array<Record<string, any>>} */
	const themes = [];

	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const manifestPath = path.join(dir, entry.name, 'package.json');
		if (!fs.existsSync(manifestPath)) continue;

		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		const slug = /** @type {string} */ (manifest.name).replace(/^@astryx-svelte\/theme-/, '');
		if (slug === manifest.name) continue;

		const upstream = Object.keys(manifest.devDependencies ?? {}).find(
			(name) => name === `@astryxdesign/theme-${slug}`
		);

		themes.push({
			slug,
			package: manifest.name,
			version: manifest.version,
			description: manifest.description ?? '',
			upstreamPackage: upstream ?? null
		});
	}

	if (themes.length === 0) {
		throw new Error(`no theme packages found under ${dir} — the layout must have changed.`);
	}

	themes.sort((a, b) => a.slug.localeCompare(b.slug));
	return themes;
}

// ---------------------------------------------------------------------------
// example blocks
// ---------------------------------------------------------------------------

/**
 * Upstream's block docs, scoped to components this library exports. The Svelte
 * rewrite of each block's `.tsx` lands incrementally under
 * `src/lib/examples/<Name>/`; a block with no rewrite yet is still recorded so
 * the gap is visible and countable rather than silent.
 *
 * @param {Set<string>} portedNames
 */
async function buildExampleRegistry(portedNames) {
	// 0.3.0 moved this from `templates/blocks/` to `assets/templates/blocks/`.
	const dir = path.join(UPSTREAM_CLI, 'assets', 'templates', 'blocks');
	const files = requireDocModules(dir, 'example blocks', isPrimaryDoc).sort();

	const examplesDir = path.join(DOCS_ROOT, 'src', 'lib', 'examples');

	/** @type {Map<string, Array<Record<string, any>>>} */
	const byComponent = new Map();
	let portedCount = 0;
	let pendingCount = 0;

	for (const file of files) {
		const doc = await importDoc(file, 'doc');
		if (!doc || doc.type !== 'block') continue;

		const blockName = path.basename(file, '.doc.mjs');
		const targets = [doc.exampleFor, ...(doc.alsoExampleFor ?? [])].filter(Boolean);

		for (const target of targets) {
			if (!portedNames.has(target)) continue;

			// Is there a Svelte rewrite of this block yet?
			const sveltePath = path.join(examplesDir, target, `${blockName}.svelte`);
			const hasSvelte = fs.existsSync(sveltePath);
			if (hasSvelte) portedCount++;
			else pendingCount++;

			const bucket = byComponent.get(target) ?? [];
			byComponent.set(target, bucket);
			bucket.push({
				id: `${target}/${blockName}`,
				block: blockName,
				name: doc.name,
				displayName: doc.displayName,
				description: doc.description ?? '',
				isShowcase: doc.isShowcase === true,
				aspectRatio: typeof doc.aspectRatio === 'number' ? doc.aspectRatio : null,
				componentsUsed: doc.componentsUsed ?? [],
				hasSvelte
			});
		}
	}

	for (const list of byComponent.values()) {
		// Showcase first — it is the hero preview — then alphabetical.
		list.sort((a, b) => {
			if (a.isShowcase !== b.isShowcase) return a.isShowcase ? -1 : 1;
			return a.block.localeCompare(b.block);
		});
	}

	return {
		byComponent: Object.fromEntries([...byComponent].sort(([a], [b]) => a.localeCompare(b))),
		portedCount,
		pendingCount
	};
}

// ---------------------------------------------------------------------------
// page templates
// ---------------------------------------------------------------------------

/** Upstream's `OTHER_GROUP` — where a template with no category lands. */
const TEMPLATE_OTHER_GROUP = 'Other';

/**
 * Upstream's `groupOf`, from `app/(site)/templates/page.tsx`: the group is the
 * text before the first ` - ` separator (`Dashboard - Analytics` →
 * `Dashboard`), a category with no separator is its own group, and an empty
 * category falls to `Other`.
 *
 * Derived **here** rather than in the page, because the group is a property of
 * the metadata and three separate things want it — the gallery's sort, its
 * filter chips, and the preview dialog's caption. One of them deriving it a
 * second time is exactly the drift a generated registry exists to prevent. The
 * *order* of the groups stays in the page, where upstream keeps `GROUP_ORDER`:
 * that is a display decision, and nothing but the gallery reads it.
 *
 * @param {string} category
 * @returns {string}
 */
function groupOf(category) {
	if (!category) return TEMPLATE_OTHER_GROUP;
	const index = category.indexOf(' - ');
	return index === -1 ? category : category.slice(0, index);
}

/**
 * Upstream's page templates — the whole-page scaffolds `astryx-svelte template
 * <slug>` copies into a project, and the set upstream's `/templates` gallery is
 * built from.
 *
 * **Metadata is upstream's**, read from the installed `@astryxdesign/cli` at the
 * pinned exact version, for the reason `buildExampleRegistry` reads blocks from
 * there: the prose is reused verbatim, and a CI checkout with no upstream clone
 * has to generate byte-identical output. The **transcription** is this repo's
 * and lands incrementally at
 * `packages/cli/assets/templates/pages/<slug>/+page.svelte`, so `hasSvelte` is
 * the same gap-is-countable device it is on a block: a template with no Svelte
 * page yet is recorded and counted, and the gallery lists only the ones that
 * have one.
 *
 * The one deliberate difference from upstream's `generateTemplateRegistry`:
 * **`source` is not carried.** Upstream bakes each `page.tsx` into its registry
 * so the tile's "Open in Playground" button can hand the playground a file. This
 * port has no playground (port/todo.md), and the bytes it would carry are React —
 * 20,339 lines of it, in a module the gallery imports eagerly.
 *
 * Everything else is upstream's shape, **including the scaffold skip below**, so
 * the counts are upstream's: 43 templates ship, 42 are recorded here, and 31 are
 * listed. `port/research/10-page-templates-and-community.md` §B7/§B8 says 43 and 32;
 * those were written before the skip was found and are off by the one template
 * it drops.
 *
 * @returns {Promise<Array<Record<string, any>>>}
 */
async function buildTemplateRegistry() {
	const dir = path.join(UPSTREAM_CLI, 'assets', 'templates', 'pages');
	// Not `isPrimaryDoc`: a page template's spec is always this one filename, and
	// naming it means a stray `*.doc.mjs` beside a page cannot become a template.
	const files = requireDocModules(dir, 'page templates', (name) => name === 'template.doc.mjs');

	const pagesDir = path.join(WORKSPACE_ROOT, 'packages', 'cli', 'assets', 'templates', 'pages');

	/** @type {Array<Record<string, any>>} */
	const templates = [];

	for (const file of files) {
		const doc = await importDoc(file, 'doc');
		// Upstream ships blocks and pages under one `assets/templates/` root and
		// discriminates on `type`, so this guard is the pages half of the pair
		// `buildExampleRegistry` makes for blocks.
		if (!doc || doc.type !== 'page') continue;

		// Skip scaffolds — these are starter templates, not showcases.
		//
		// Upstream's line, verbatim from `generate-data.mjs`, and it is worth being
		// clear about how narrow it is: this excludes `blank` from the **docsite
		// registry only**. `astryx-svelte template blank` still ships it, still
		// scaffolds it, and `packages/cli/assets/templates/pages/blank/` is still
		// transcribed — the CLI reads that directory, not this file. A gallery of
		// finished pages is the wrong place to advertise an empty one; a scaffolding
		// command is exactly the right place. Hence 43 shipped, 42 recorded here.
		if (doc.scaffold) continue;

		const slug = path.basename(path.dirname(file));
		const category = doc.category ?? '';

		templates.push({
			slug,
			name: doc.name || slug,
			// Upstream's template registry carries no `displayName` at all, so
			// there is no `requireDisplayName` gate to mirror here — the fallback
			// chain is the honest translation of a field its own consumer treats
			// as optional. All 43 shipped templates declare one today, and all 43
			// declare it equal to `name`.
			displayName: doc.displayName || doc.name || slug,
			description: doc.description ?? '',
			category,
			isReady: doc.isReady ?? true,
			isHiddenFromOverview: doc.isHiddenFromOverview ?? false,
			group: groupOf(category),
			hasSvelte: fs.existsSync(path.join(pagesDir, slug, '+page.svelte'))
		});
	}

	// Upstream's order. The gallery re-sorts by group rank before rendering, so
	// this only fixes the order of the emitted file — which is what keeps its
	// diffs readable as templates land.
	templates.sort((a, b) => a.name.localeCompare(b.name));
	assertNoUpstreamSpecifiers(templates);
	return templates;
}

// ---------------------------------------------------------------------------
// emit
// ---------------------------------------------------------------------------

/**
 * Name and version of the package the docs describe.
 *
 * Upstream's component pages caption the title with `{pkg} v{version} ·
 * {moduleName}`, read from its generated `packageRegistry`. That registry exists
 * upstream because its docsite documents several packages at once; this one
 * documents `@astryx-svelte/core`, so the same caption needs only this pair.
 *
 * @returns {{ name: string, version: string }}
 */
function readCorePackage() {
	const manifest = JSON.parse(
		fs.readFileSync(path.join(WORKSPACE_ROOT, 'packages', 'core', 'package.json'), 'utf8')
	);
	return { name: manifest.name, version: manifest.version };
}

/**
 * @param {string} file
 * @param {string} contents
 */
function writeIfChanged(file, contents) {
	if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === contents) return false;
	fs.writeFileSync(file, contents, 'utf8');
	return true;
}

/**
 * @param {string} name
 * @param {unknown} value
 */
function moduleSource(name, value) {
	return (
		`// @generated by scripts/generate-content.mjs — do not edit.\n` +
		`/** @type {import('./types.d.ts').${name}} */\n` +
		`export default ${JSON.stringify(value, null, '\t')};\n`
	);
}

/**
 * Upstream's prose reconciled against this port's compiler-derived types — the
 * step both consumers of this pipeline share.
 *
 * The docs site projects the result through {@link projectForSite} and writes
 * `component-registry.js`; `emit-core-docs.mjs` reshapes the same entries into
 * the `.doc.mjs` files `packages/core` publishes for the CLI. Neither may
 * re-derive it: the reconciliation is where the two-source rule lives (every
 * prose field is upstream's, every type is ours), and a second implementation
 * would be a second place for it to go wrong.
 *
 * @param {{quiet?: boolean}} [options]
 */
export async function reconcile({ quiet = false } = {}) {
	/** @type {(...args: unknown[]) => void} */
	const log = quiet ? () => {} : (...args) => console.log(...args);

	if (!fs.existsSync(path.join(CORE_DIST, 'index.d.ts'))) {
		throw new Error(
			`packages/core/dist is missing. Run \`pnpm -F @astryx-svelte/core build\` first — ` +
				`the docs generator reads the published export surface from it.`
		);
	}

	const surface = readCoreExports(CORE_DIST);
	log(`  core exports ${surface.names.size} values`);

	const propsIndex = createPropsTypeIndex(CORE_DIST);
	log(`  props types ${propsIndex.propsTypeNames.size} interfaces`);

	const { entries, unported, totalUpstream, drift } = await buildComponentRegistry(
		surface,
		propsIndex
	);
	log(`  components  ${entries.length} documented / ${totalUpstream} upstream`);

	assertNoUpstreamSpecifiers(entries);

	// Deliberately `console.warn`, not `log`. `quiet` exists to keep the progress
	// lines out of `pnpm dev:docs` and `pnpm -F docs build`, which regenerate on
	// every `.doc.mjs` change — but `vite-plugin-content.mjs` passes it on *both*
	// paths, so the drift report was suppressed in exactly the two runs a person
	// is watching, and printed only on a direct `pnpm -F docs generate`. A drift
	// report is a warning about the output's fidelity, not a progress line;
	// it survives `quiet` and is short enough that being seen costs nothing.
	if (drift.length > 0) {
		const total = drift.reduce((sum, report) => sum + report.missing.length, 0);
		console.warn(
			`  ! ${total} documented row(s) across ${drift.length} entr${drift.length === 1 ? 'y' : 'ies'} ` +
				`not declared by core (props, hook params and hook returns are all checked):`
		);
		for (const report of drift) console.warn(`      ${report.name}: ${report.missing.join(', ')}`);
	}

	return { surface, propsIndex, entries, unported, totalUpstream, drift };
}

export async function generate({ quiet = false } = {}) {
	/** @type {(...args: unknown[]) => void} */
	const log = quiet ? () => {} : (...args) => console.log(...args);

	const { entries, unported, totalUpstream } = await reconcile({ quiet });

	const grouped = buildGroupedRegistry(entries);
	log(`  sidebar     ${grouped.items.length} entries + ${grouped.utilities.length} utilities`);

	const topics = await buildDocsRegistry();
	log(`  topics      ${topics.length}`);

	const examples = await buildExampleRegistry(new Set(entries.map((e) => e.name)));
	log(`  examples    ${examples.portedCount} ported / ${examples.pendingCount} pending`);

	const templates = await buildTemplateRegistry();
	// Counted over the whole set, not over the gallery-visible subset: the
	// backlog `port/todo.md` tracks is every page still to transcribe, and a template
	// upstream hides from its own overview is still one of them.
	const templatesPorted = templates.filter((entry) => entry.hasSvelte).length;
	const templatesPending = templates.length - templatesPorted;
	log(`  templates   ${templatesPorted} ported / ${templatesPending} pending`);

	const themes = buildThemeRegistry();
	log(`  themes      ${themes.length} packages`);

	const libraries = buildLibraryPackages();
	log(
		`  libraries   ${libraries.length} packages, ` +
			`${libraries.filter((pkg) => pkg.readme != null).length} with a README`
	);

	const blog = await buildBlogRegistry();
	log(`  blog        ${blog.posts.length} posts, ${blog.types.length} type(s)`);

	fs.mkdirSync(OUT_DIR, { recursive: true });

	// The README text is split out of the registry on purpose. `package-registry`
	// is imported by the **root layout**, through the sidebar's Libraries group,
	// and the bundler does not dedupe a second copy of a string — the mistake
	// `component-groups.js` cost 93% of the root-layout chunk (port/todo.md, Phase 5).
	// So the sidebar gets names and slugs, and the ~20 KB of markdown is a
	// separate module the package page's `load` imports dynamically.
	const outputs = [
		['component-registry.js', moduleSource('ComponentEntry[]', entries.map(projectForSite))],
		['component-groups.js', moduleSource('GroupedRegistry', grouped)],
		['docs-registry.js', moduleSource('ReferenceTopic[]', topics)],
		['example-registry.js', moduleSource('ExampleRegistry', examples)],
		['template-registry.js', moduleSource('TemplateEntry[]', templates)],
		['theme-registry.js', moduleSource('ThemePackage[]', themes)],
		[
			'package-registry.js',
			moduleSource(
				'LibraryPackage[]',
				libraries.map(({ readme, ...rest }) => ({ ...rest, hasReadme: readme != null }))
			)
		],
		[
			'package-readmes.js',
			moduleSource(
				'PackageReadmes',
				Object.fromEntries(
					libraries.filter((pkg) => pkg.readme).map((pkg) => [pkg.slug, pkg.readme])
				)
			)
		],
		['blog-registry.js', moduleSource('BlogRegistry', blog)],
		[
			'coverage.js',
			moduleSource('Coverage', {
				corePackage: readCorePackage(),
				documentedComponents: entries.length,
				upstreamComponents: totalUpstream,
				unported,
				examplesPorted: examples.portedCount,
				examplesPending: examples.pendingCount,
				templatesPorted,
				templatesPending
			})
		]
	];

	let changed = 0;
	for (const [file, contents] of outputs) {
		if (writeIfChanged(path.join(OUT_DIR, file), contents)) changed++;
	}

	log(`  wrote       ${changed}/${outputs.length} file(s) changed`);

	return { entries, grouped, topics, examples, templates, themes, libraries, unported };
}

// Run directly (`node scripts/generate-content.mjs`) as well as via the plugin.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
	console.log('generating docs content…');
	generate().catch((error) => {
		console.error(`\ngenerate-content failed: ${error.message}\n`);
		process.exit(1);
	});
}
