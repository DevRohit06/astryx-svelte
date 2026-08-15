/**
 * @file theme build API — compile a defineTheme file to CSS + JS + .d.ts.
 *
 * `themeBuild(file, options, ctx)` is the programmatic surface behind
 * `astryx-svelte theme build`. It reads a theme file that uses defineTheme()
 * and, via @astryx-svelte/core's shared generator (the SINGLE source of truth
 * so the build emits the exact CSS the `<Theme>` runtime does), writes:
 * - A CSS file with token overrides and component styles
 * - A JS module that re-exports the built theme (+ icon registry)
 * - A .d.ts (plus an optional .variants.d.ts for custom prop values)
 *
 * It performs the writes and returns a `theme.build` receipt, or `null` when
 * the theme produced no CSS (nothing to build). Errors throw AstryxError (with
 * a stable code). Human progress is emitted through the shared `logger`
 * (silent by default), so the CLI keeps its exact output while a programmatic
 * caller stays quiet.
 *
 * With `{check: true}`, it compiles the same outputs in memory but writes
 * nothing: it compares each generated file against what is on disk (ignoring
 * only the volatile `@generated` `Command:` line) and returns a
 * `theme.build.check` receipt listing any stale or missing outputs. This is
 * the CI guard for committed, generated theme CSS: the source of truth is
 * `<theme>.ts`, and `theme build --check` fails when the committed
 * `<theme>.css`/`.js`/`.d.ts` no longer match it.
 *
 * ## The five places this diverges from upstream, and why
 *
 * 1. **It imports `@astryx-svelte/core/theme/define`, not `./theme`.** `./theme`
 *    re-exports `Theme`/`MediaTheme`/`SyntaxTheme`, so its first statement
 *    reaches a `.svelte` module and plain Node fails the whole graph with
 *    `ERR_UNKNOWN_FILE_EXTENSION` before any generator is reachable. The
 *    `./theme/define` subpath is the component-free half of the same barrel and
 *    exists for exactly this call; see its header.
 * 2. **Component docs are found by scanning, not by guessing a directory.**
 *    Upstream maps a theme key to `<core>/src/<Pascal>/<Pascal>.doc.mjs`. Here
 *    the docs are `<core>/src/lib/**\/<Export>.doc.mjs` and the directories are
 *    kebab-case families (`avatar/` backs `AvatarStatusDot`), so name → path is
 *    not a function — TODO.md's slice-2 note. All three doc readers below go
 *    through one cached index keyed by the rendered class token, which is what
 *    the theme key actually is. Upstream already scans for two of the three.
 * 3. **A custom-variant augmentation targets the root barrel**, because this
 *    port publishes no per-component subpaths (`@astryx-svelte/core/Button`
 *    does not exist — a standing debt in TODO.md, owed to `swizzle`). Verified,
 *    and mutation-checked, that TypeScript merges an augmentation of a
 *    re-exported interface into the original declaration: augmenting
 *    `ButtonVariantMap` on `@astryx-svelte/core` really does widen
 *    `ButtonProps['variant']`, and removing the augmentation makes the same
 *    probe fail. The "is this an extension point?" check still requires a real
 *    `interface` declaration in the module the barrel re-exports it *from* —
 *    upstream's rule, applied one level down.
 * 4. **`isAlreadyResolved` asks whether the object carries `resolvedTokens`.**
 *    Upstream infers it from the *absence* of `typography`/`motion`/`radius`,
 *    which works there because its `defineTheme` returns a narrowed object.
 *    This port's `DefinedTheme` spreads its input, so those keys survive and
 *    upstream's heuristic would answer "raw" for every resolved theme and
 *    re-run `defineTheme` on it — dropping `color`, `syntax` and the on-media
 *    overrides on the way through. `resolvedTokens` is the unambiguous marker
 *    and is also the field the generator needs.
 * 5. **The generated `.d.ts` names `@astryx-svelte/core/theme` and
 *    `@astryx-svelte/core`** for `DefinedTheme` and `IconRegistry` — the same
 *    two specifiers `packages/themes/*` already emit, since these are types and
 *    never execute.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import { getCliInvocation } from '../../../foundation/env/package-manager.mjs';
import { CLI_ROOT, findCoreDir } from '../../../foundation/fs/paths.mjs';
import {
	assertWithin,
	sanitizeName,
	PathSafetyError
} from '../../../foundation/fs/path-safety.mjs';
import { ERROR_CODES } from '../../../foundation/response/error-codes.mjs';
import { AstryxError } from '../../error.mjs';
import { logger } from '../../logger.mjs';
import { CORE_PACKAGE } from '../../../foundation/discovery/component-discovery.mjs';
import { loadComponentDoc } from '../../../foundation/discovery/component-loader.mjs';

// Import shared theme processing from core. `astryx-svelte theme build` MUST
// produce the exact same CSS as the `<Theme>` runtime, so it has exactly one
// generation path: core's generator. There is no in-CLI fallback implementation
// — if this import fails, the build fails (see the ERR_CORE_NOT_FOUND guard in
// the theme action). A built, resolvable `@astryx-svelte/core` is a hard
// requirement. These are populated from a dynamic import (a runtime boundary),
// so `any` is intentional.
/** @type {any} */ let _defineTheme = null;
/** @type {any} */ let _generateThemeRulesSplit = null;
/** @type {any} */ let _generateOnMediaCss = null;
/** @type {any} */ let _coreImportError = null;
try {
	const coreTheme = await import('@astryx-svelte/core/theme/define');
	_defineTheme = coreTheme.defineTheme;
	_generateThemeRulesSplit = coreTheme.generateThemeRulesSplit;
	_generateOnMediaCss = coreTheme.generateOnMediaCss;
} catch (e) {
	// Capture the reason so the theme action can surface a precise, actionable
	// error. We don't throw here: this module is imported eagerly by the CLI
	// entrypoint for every command, and a throw at load time would break
	// unrelated commands (the entry wraps loads in try/catch and degrades the
	// command to a stub). The hard failure happens when `theme build` runs.
	_coreImportError = e;
}

/**
 * Read a package's `version` from a resolved directory. Returns `'unknown'`
 * when it can't be read so the header always has a value.
 * @param {string|null} dir
 * @returns {string}
 */
function readPkgVersion(dir) {
	if (!dir) return 'unknown';
	try {
		const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
		return pkg?.version ?? 'unknown';
	} catch {
		return 'unknown';
	}
}

/**
 * Resolve the CLI and core package versions recorded in generated headers.
 * These are stable (unlike a timestamp): identical inputs produce byte-identical
 * output, so rebuilds don't churn git and `theme build --check` stays a pure
 * content-drift signal.
 * @param {string} cwd - Consumer cwd, used to locate the installed core.
 * @returns {{cli: string, core: string}}
 */
function resolveToolVersions(cwd) {
	return {
		cli: readPkgVersion(CLI_ROOT),
		core: readPkgVersion(findCoreDir(cwd))
	};
}

/**
 * Build a @generated attribution header for generated files.
 * @param {string} sourceFile - Relative path to the source theme file
 * @param {'css'|'js'|'ts'} lang - File language (determines comment syntax)
 * @param {string} [command] - The full CLI command used to generate this file
 * @param {{cli: string, core: string}} [versions] - CLI/core versions used to build
 */
function generatedHeader(sourceFile, lang = 'js', command, versions) {
	const body = [
		`@generated by \`astryx-svelte theme build\` — do not edit manually.`,
		`Source: ${sourceFile}`
	];
	if (command) {
		body.push(`Command: ${command}`);
	}
	if (versions) {
		body.push(`CLI: @astryx-svelte/cli@${versions.cli}`);
		body.push(`Core: ${CORE_PACKAGE}@${versions.core}`);
	}
	if (lang === 'css') {
		return `/*\n * ${body.join('\n * ')}\n */\n\n`;
	}
	return `/**\n * ${body.join('\n * ')}\n */\n\n`;
}

/**
 * Normalize generated file content for staleness comparison by dropping the
 * volatile `Command:` line of the `@generated` header (it embeds the
 * invocation, e.g. an explicit --out). Everything else — including the rest of
 * the header and all real content — is compared verbatim. Used only by
 * `--check`: a differing command must NOT report a file as stale, but any real
 * content drift must. The `CLI:`/`Core:` provenance lines are deterministic
 * for a given toolchain, so they compare verbatim like real content.
 * @param {string} content
 * @returns {string}
 */
function normalizeForCompare(content) {
	return content
		.split('\n')
		.filter((line) => {
			const t = line.replace(/^\s*\*?\s?/, '');
			return !t.startsWith('Command:');
		})
		.join('\n');
}

/**
 * Convert a theme name to a valid JS identifier.
 * e.g. 'default-minimal' → 'defaultMinimal', 'ocean' → 'ocean'
 * @param {string} name
 * @returns {string}
 */
function toIdentifier(name) {
	return name.replace(/-([a-z])/g, (/** @type {string} */ _, /** @type {string} */ c) =>
		c.toUpperCase()
	);
}

/**
 * Import specifier for install/scaffold instructions. Drops a leading `src/`
 * from the cwd-relative dir (most consumers import from a file under src/) but
 * keeps the rest of the path (e.g. `themes/gothic`). Callers note the path is
 * relative to the consumer's file.
 * Exported (not just used by `themeBuild`'s install instructions) because the
 * thin CLI's `theme add` action reuses it for its own scaffold instructions.
 *
 * Both callers pass a `path.relative()` result, which is backslash-separated on
 * Windows, and an import specifier never is — so separators are normalised
 * first. Upstream does not, and the bug it leaves is not cosmetic: `src\themes\
 * ocean` does not match its `^src\/?`, so the `src/` strip silently no-ops and
 * the printed instruction is `from './\themes\ocean/ocean'` — an import that
 * cannot resolve. Only the *instructions* are affected (nothing on disk), and
 * only on Windows, which is why upstream's own suite never sees it.
 *
 * @param {string} relDir
 * @param {string} base
 * @returns {string}
 */
export function importSpecifier(relDir, base) {
	const posix = String(relDir).replace(/\\/g, '/');
	const normalized = posix === '.' ? '' : posix;
	const withinSrc = normalized.replace(/^src\/?/, '').replace(/\/+$/, '');
	return withinSrc ? `./${withinSrc}/${base}` : `./${base}`;
}

/**
 * Convert a kebab-case component name to PascalCase.
 * e.g. 'button' → 'Button', 'progress-bar' → 'ProgressBar', 'avatar-status-dot' → 'AvatarStatusDot'
 * @param {string} name
 * @returns {string}
 */
function toPascalCase(name) {
	return name
		.split('-')
		.map((/** @type {string} */ part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
}

/**
 * Resolve `@astryx-svelte/core`'s package root relative to the CLI package.
 * Core and the CLI ship as siblings (`@astryx-svelte/core`,
 * `@astryx-svelte/cli`), so `../../../../core` from `api/theme/build/` reaches
 * core whether installed from npm or run inside the monorepo. Falls back to
 * `findCoreDir()` (the CLI's own walker, which also knows `node_modules`) and
 * returns null if neither finds it.
 */
function resolveCoreRoot() {
	const cliDir = path.dirname(fileURLToPath(import.meta.url));
	const coreRoot = path.resolve(cliDir, '../../../../core');
	if (fs.existsSync(coreRoot)) return coreRoot;
	return findCoreDir(process.cwd());
}

/**
 * Core's documented theming targets, indexed once.
 *
 * One recursive pass over `<core>/src/lib` collects every `.doc.mjs` whose
 * `theming.targets[].className` names a rendered class token, keyed by that
 * token with the `astryx-` prefix stripped — which is exactly the shape of a
 * theme's `components` key. Each entry carries the visual prop names the target
 * declares, the prop records those props' types can be read from, and the doc's
 * own `name` plus any sub-component names, for the augmentation lookup.
 *
 * Upstream runs this scan twice (`loadKnownComponents`,
 * `resolveAugmentationTargetCandidates`) and guesses a directory for the third
 * reader (`loadKnownValues`). One index serves all three here, because a
 * directory guess cannot work in this port: `<core>/src/lib/components/avatar/`
 * holds `AvatarStatusDot.doc.mjs`, so name → path is not a function.
 *
 * @typedef {object} ThemeTargetEntry
 * @property {string[]} visualProps
 * @property {Array<{name?: string, type?: string}>} props
 * @property {string[]} componentNames doc `name` + `components[].name`
 */

/**
 * The index itself — `undefined` until the first scan, `null` when core's
 * sources could not be found.
 * @type {Record<string, ThemeTargetEntry> | null | undefined}
 */
let _themeTargetIndex;

/**
 * Build (once) the class-token → doc-metadata index described above. Returns
 * null when core's sources are unavailable, so validation can skip
 * unknown-key warnings rather than guessing from a second registry.
 * @returns {Promise<Record<string, ThemeTargetEntry> | null>}
 */
async function getThemeTargetIndex() {
	if (_themeTargetIndex !== undefined) return _themeTargetIndex;

	const coreRoot = resolveCoreRoot();
	// `<core>/src/lib` rather than upstream's `<core>/src`: this port's package
	// root also holds `src/routes`, the SvelteKit demo app, which has no docs in
	// it and would double the walk.
	const coreSrc = coreRoot ? path.join(coreRoot, 'src', 'lib') : null;
	if (!coreSrc || !fs.existsSync(coreSrc)) {
		_themeTargetIndex = null;
		return null;
	}

	/** @type {Record<string, ThemeTargetEntry>} */
	const index = {};

	/** @param {string} dir */
	async function scan(dir) {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
				await scan(full);
				continue;
			}
			if (!entry.name.endsWith('.doc.mjs')) continue;

			/** @type {any} */
			let doc;
			try {
				doc = await loadComponentDoc(full);
			} catch {
				continue;
			}

			const targets = doc?.theming?.targets || [];
			if (targets.length === 0) continue;

			// Every prop the doc declares, from `props` and from each documented
			// sub-component — upstream's `loadKnownValues` collects the same union.
			/** @type {Array<{name?: string, type?: string}>} */
			const props = [];
			if (Array.isArray(doc.props)) props.push(...doc.props);
			if (Array.isArray(doc.components)) {
				for (const comp of doc.components) {
					if (Array.isArray(comp?.props)) props.push(...comp.props);
				}
			}

			/** @type {string[]} */
			const componentNames = [];
			if (typeof doc?.name === 'string' && doc.name) componentNames.push(doc.name);
			else componentNames.push(path.basename(path.dirname(full)));
			if (Array.isArray(doc?.components)) {
				for (const comp of doc.components) {
					if (typeof comp?.name === 'string') componentNames.push(comp.name);
				}
			}

			for (const target of targets) {
				const className = target?.className;
				if (typeof className !== 'string') continue;
				const key = className.replace(/^astryx-/, '');
				if (!key) continue;
				// Target STATES count as selectable names alongside visual props
				// (#4778). Reading only `visualProps` made a legitimate selector like
				// `radio: {checked}` warn as unknown, because `checked` is state-driven
				// rather than prop-driven and lives in the other array.
				const visualProps = [target.visualProps, target.states]
					.filter((list) => Array.isArray(list))
					.flat()
					.filter((/** @type {unknown} */ p) => typeof p === 'string');
				const existing = index[key];
				index[key] = {
					visualProps: [...new Set([...(existing?.visualProps || []), ...visualProps])],
					props: [...(existing?.props || []), ...props],
					componentNames: [...new Set([...(existing?.componentNames || []), ...componentNames])]
				};
			}
		}
	}

	await scan(coreSrc);
	_themeTargetIndex = Object.keys(index).length > 0 ? index : null;
	return _themeTargetIndex;
}

/**
 * Load known built-in values for a component's visual props from core's docs.
 * Parses the type string (e.g. "'info' | 'warning' | 'error' | 'success'") to extract values.
 * Returns a map of { propName: string[] } for props that are visual (listed in theming targets).
 * @param {string} componentName
 * @returns {Promise<Record<string, string[]>>}
 */
async function getKnownValues(componentName) {
	const index = await getThemeTargetIndex();
	const entry = index?.[componentName];
	if (!entry || entry.props.length === 0) return {};

	const visualProps = new Set(entry.visualProps);

	// Extract values from prop type strings
	/** @type {Record<string, string[]>} */
	const result = {};
	for (const prop of entry.props) {
		if (!prop?.name || !visualProps.has(prop.name)) continue;
		if (!prop.type || typeof prop.type !== 'string') continue;

		// Parse union type: "'info' | 'warning' | 'error' | 'success'" → ['info', 'warning', 'error', 'success']
		const matches = prop.type.match(/'([^']+)'/g);
		if (matches) {
			result[prop.name] = matches.map((/** @type {string} */ m) => m.replace(/'/g, ''));
		}
	}
	return result;
}

/**
 * The root barrel's `export { … } from './relative/module.js'` lines, parsed
 * once into `exported name → declaring module path`.
 *
 * This is the port's answer to upstream's `readComponentDeclarations`. Upstream
 * reads `<core>/dist/<Pascal>/index.d.ts` — the public subpath a consumer
 * imports — and requires the interface to be *declared* there rather than
 * re-exported, because augmenting a barrel that merely re-exports a type is
 * dead code. This port has one public entry, so the equivalent question is:
 * does the barrel export this name, and is the module it comes from a real
 * `interface` declaration? Both halves are answered here.
 *
 * @type {Map<string, string> | undefined}
 */
let _barrelExports;

/**
 * @returns {Map<string, string>} exported name → absolute path of the module it
 *   is declared in ('' when the barrel could not be read)
 */
function getBarrelExports() {
	if (_barrelExports) return _barrelExports;
	/** @type {Map<string, string>} */
	const map = new Map();
	_barrelExports = map;

	const coreRoot = resolveCoreRoot();
	if (!coreRoot) return map;
	// The shipped declarations first (what a consumer's TypeScript actually
	// sees), then the monorepo source.
	const candidates = [
		path.join(coreRoot, 'dist', 'index.d.ts'),
		path.join(coreRoot, 'src', 'lib', 'index.ts')
	];
	/** @type {string | null} */
	let barrelFile = null;
	for (const file of candidates) {
		if (fs.existsSync(file)) {
			barrelFile = file;
			break;
		}
	}
	if (!barrelFile) return map;

	let source;
	try {
		source = fs.readFileSync(barrelFile, 'utf-8');
	} catch {
		return map;
	}

	const barrelDir = path.dirname(barrelFile);
	// `export [type] { A, type B as C } from './x.js';` — the only re-export form
	// the barrel uses. Multi-line lists are covered by the `[\s\S]` class.
	const re = /export\s+(?:type\s+)?\{([\s\S]*?)\}\s*from\s*'([^']+)'/g;
	let match;
	while ((match = re.exec(source)) !== null) {
		const [, names, specifier] = match;
		if (!specifier.startsWith('.')) continue;
		const resolved = resolveDeclarationFile(barrelDir, specifier);
		if (!resolved) continue;
		for (const raw of names.split(',')) {
			// `type Foo`, `Foo as Bar` → the *local* name is what a `declare module`
			// block has to spell, so take the alias when there is one.
			const name = raw
				.replace(/^\s*type\s+/, '')
				.split(/\s+as\s+/)
				.pop()
				?.trim();
			if (name) map.set(name, resolved);
		}
	}
	return map;
}

/**
 * Resolve a barrel re-export specifier (`./components/button/button.stylex.js`)
 * to the declaration file that really holds it — `.d.ts` beside the `.js` in
 * `dist/`, or the `.ts`/`.svelte` source in `src/`.
 * @param {string} fromDir
 * @param {string} specifier
 * @returns {string | null}
 */
function resolveDeclarationFile(fromDir, specifier) {
	const base = path.resolve(fromDir, specifier);
	const withoutJs = base.replace(/\.js$/, '');
	for (const candidate of [
		`${withoutJs}.d.ts`,
		`${withoutJs}.ts`,
		withoutJs,
		`${withoutJs}.svelte`
	]) {
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
	}
	return null;
}

/**
 * Determine whether `@astryx-svelte/core` exports an interface named
 * `interfaceName` that can be augmented via module augmentation.
 *
 * Only interfaces are extension points — closed literal-union types (e.g.
 * `HeadingType`, `ButtonSize`) are NOT augmentable, so a generated augmentation
 * against them is dead code. So both halves are required: the barrel must
 * export the name, and the module it re-exports it from must really declare it
 * with `interface`.
 * @param {string} interfaceName
 * @returns {boolean}
 */
function coreHasAugmentableInterface(interfaceName) {
	const declaringFile = getBarrelExports().get(interfaceName);
	if (!declaringFile) return false;
	let decl;
	try {
		decl = fs.readFileSync(declaringFile, 'utf-8');
	} catch {
		return false;
	}
	const re = new RegExp(String.raw`\binterface\s+${interfaceName}\b`);
	return re.test(decl);
}

/**
 * Resolve a rendered theme class token (the key without `astryx-`) to candidate
 * interface prefixes that may own its augmentable prop maps. Some tokens are
 * subtargets documented by a parent component (`avatar-status-dot` is
 * documented on Avatar), and some stable class tokens intentionally omit word
 * separators (`progressbar`, `statusdot`) while the public API keeps
 * `ProgressBar`/`StatusDot` casing. Component docs are the source of truth for
 * the target token → owning component relationship.
 *
 * The module half of upstream's `{moduleName, interfacePrefix}` pair is
 * constant here — this port publishes one entry — so only the prefix varies.
 *
 * @param {string} componentName
 * @returns {Promise<string[]>}
 */
async function resolveAugmentationPrefixes(componentName) {
	const fallback = [toPascalCase(componentName)];
	const index = await getThemeTargetIndex();
	const entry = index?.[componentName];
	if (!entry) return fallback;

	// Try the exact rendered token first for documented subtargets such as
	// avatar-status-dot → AvatarStatusDotVariantMap, then the owning public
	// component names for unhyphenated public casings such as progressbar →
	// ProgressBarVariantMap / statusdot → StatusDotVariantMap.
	return [...new Set([toPascalCase(componentName), ...entry.componentNames])];
}

/**
 * Generate TypeScript declaration content with module augmentation for custom
 * component prop values found in the theme's `components` keys. Reads known
 * values from doc files to filter out base prop values.
 *
 * Interface naming convention: PascalCase(component) + PascalCase(prop) + Map
 *   banner + status → BannerStatusMap
 *   button + variant → ButtonVariantMap
 *
 * An augmentation is only emitted when `@astryx-svelte/core` actually exports a
 * matching interface. Props backed by closed literal-union types (e.g. Button
 * `size`, Heading `type`/`level`) have no augmentation point, so generating a
 * `declare module` block for them would be dead code — those are skipped.
 *
 * @param {{components?: Record<string, Record<string, Record<string, unknown>>>}} themeDef - Theme definition (resolved by defineTheme)
 * @returns {Promise<string|null>} TypeScript declaration content, or null if no augmentations needed
 */
async function generateVariantDeclarationsAsync(themeDef) {
	if (!themeDef.components || Object.keys(themeDef.components).length === 0) {
		return null;
	}

	// Collect custom values: { component: { prop: [value, ...] } }
	/** @type {Record<string, Record<string, Set<string>>>} */
	const customValues = {};

	for (const [component, rules] of Object.entries(themeDef.components)) {
		const knownForComponent = await getKnownValues(component);

		for (const key of Object.keys(rules)) {
			if (key === 'base') continue;

			const pairs = key.split('+');
			for (const pair of pairs) {
				const colonIdx = pair.indexOf(':');
				if (colonIdx === -1) continue;
				const prop = pair.slice(0, colonIdx);
				const value = pair.slice(colonIdx + 1);

				// Skip known built-in values
				const knownForProp = knownForComponent[prop];
				if (knownForProp && knownForProp.includes(value)) continue;

				if (!customValues[component]) customValues[component] = {};
				if (!customValues[component][prop]) customValues[component][prop] = new Set();
				customValues[component][prop].add(value);
			}
		}
	}

	// Check if we found any custom values
	const hasCustom = Object.values(customValues).some((props) =>
		Object.values(props).some((values) => values.size > 0)
	);
	if (!hasCustom) return null;

	const sections = ['// Generated by astryx-svelte theme build', 'export {};', ''];

	for (const [component, props] of Object.entries(customValues)) {
		for (const [prop, values] of Object.entries(props)) {
			if (values.size === 0) continue;

			const propPascal = prop.charAt(0).toUpperCase() + prop.slice(1);
			const interfaceName = (await resolveAugmentationPrefixes(component))
				.map((prefix) => `${prefix}${propPascal}Map`)
				.find((candidate) => coreHasAugmentableInterface(candidate));

			// Only augment interfaces that actually exist as an extension point in
			// core. Props backed by closed literal-union types (e.g. Button `size`,
			// Heading `type`/`level`) have no `*Map` interface — a `declare module`
			// block against a non-existent interface just creates a new, unused
			// interface and never extends the component's prop union, so skip it.
			if (!interfaceName) continue;

			sections.push(`declare module '${CORE_PACKAGE}' {`);
			sections.push(`  interface ${interfaceName} {`);
			for (const v of values) {
				sections.push(`    '${v}': true;`);
			}
			sections.push('  }');
			sections.push('}');
			sections.push('');
		}
	}

	// If every custom value targeted a non-augmentable prop, there's nothing to
	// emit beyond the header — return null so no `.variants.d.ts` is written.
	const hasEmittedAugmentation = sections.some((line) => line.startsWith('declare module'));
	if (!hasEmittedAugmentation) return null;

	return sections.join('\n');
}

/**
 * Resolve a token value — [light, dark] tuple becomes light-dark()
 * @param {unknown} value
 * @returns {unknown}
 */
function resolveTokenValue(value) {
	if (Array.isArray(value)) {
		return `light-dark(${value[0]}, ${value[1]})`;
	}
	return value;
}

// Theme @scope selector helpers. Keep the `astryx` literal in sync with
// packages/core/src/lib/internal/naming.ts (NAMESPACE) and
// generate-theme-rules.ts. Theme scopes to data-astryx-theme; the static build
// path must match.
const themeScopeStart = (/** @type {string} */ name) => `[data-astryx-theme="${name}"]`;
const THEME_SCOPE_TO = `[data-astryx-theme]`;

/**
 * Import a theme module using jiti and find the defineTheme() result.
 * Returns the resolved DefinedTheme object.
 * @param {string} filePath
 * @returns {Promise<any>}
 */
async function importThemeModule(filePath) {
	const jiti = createJiti(import.meta.url, {
		moduleCache: false,
		jsx: true
	});

	const mod = await jiti.import(filePath, { default: true });

	if (isThemeObject(mod)) return mod;

	if (mod && typeof mod === 'object') {
		for (const value of Object.values(mod)) {
			if (isThemeObject(value)) return value;
		}
	}

	throw new Error(
		`Could not find a defineTheme() result in ${filePath}.\n` +
			`Expected an export like: export const myTheme = defineTheme({ name: '...', tokens: {...} })`
	);
}

/**
 * Does this look like a theme? Upstream tests `name` + `tokens`, because its
 * `DefinedTheme.tokens` is the resolved map and so is always present. Here
 * `tokens` is the author's own input and a theme built entirely from
 * `typography`/`color` has none, so `resolvedTokens` counts too.
 * @param {any} value
 * @returns {boolean}
 */
function isThemeObject(value) {
	return (
		value &&
		typeof value === 'object' &&
		typeof value.name === 'string' &&
		((value.tokens && typeof value.tokens === 'object') ||
			(value.resolvedTokens && typeof value.resolvedTokens === 'object'))
	);
}

/**
 * Extract the theme definition from a JS/TS file.
 * Tries jiti first (full TS support), falls back to regex+eval.
 * @param {string} filePath
 * @returns {Promise<any>}
 */
async function extractThemeDefinition(filePath) {
	try {
		return await importThemeModule(filePath);
	} catch (jitiError) {
		try {
			return extractThemeDefinitionLegacy(filePath);
		} catch {
			const je = /** @type {Error} */ (jitiError);
			throw new Error(
				`Failed to load theme from ${filePath}: ${je.message}\n` +
					`Make sure all imports in the theme file are resolvable.`
			);
		}
	}
}

/**
 * Fallback extraction via regex + eval.
 * Only works for plain object literals — can't follow imports or variables.
 *
 * The `eval` is upstream's and is kept deliberately. It grants no capability
 * the surrounding code does not already have: `importThemeModule` above
 * *executes* the same file through jiti a few lines earlier, and this path only
 * runs when that failed. The input is the file the user named on the command
 * line, so the trust boundary is the argument, not the parser. `JSON.parse` is
 * not a substitute — the literal is JavaScript (unquoted keys, trailing commas,
 * `as const`), which is exactly why the regex strips `as const` and blanks the
 * `icons:` binding before evaluating.
 *
 * @param {string} filePath
 * @returns {any}
 */
function extractThemeDefinitionLegacy(filePath) {
	const content = fs.readFileSync(filePath, 'utf8');

	const defineMatch = content.match(/defineTheme\s*\(\s*({[\s\S]*?})\s*\)/);
	if (!defineMatch) {
		const defaultMatch = content.match(/export\s+default\s+({[\s\S]*?});/);
		if (!defaultMatch) {
			throw new Error(
				`Could not find defineTheme() call or default export in ${filePath}.\n` +
					`Expected: defineTheme({ name: '...', tokens: {...} })`
			);
		}

		return eval(`(${defaultMatch[1]})`);
	}

	let objStr = defineMatch[1];
	objStr = objStr.replace(/\s+as\s+const/g, '');
	objStr = objStr.replace(/icons:\s*[a-zA-Z_][a-zA-Z0-9_]*/g, 'icons: undefined');

	try {
		return eval(`(${objStr})`);
	} catch (e) {
		const err = /** @type {Error} */ (e);
		throw new Error(
			`Failed to parse theme definition in ${filePath}: ${err.message}\n` +
				`Make sure the defineTheme() argument is a plain object literal.`,
			{ cause: e }
		);
	}
}

/**
 * Extract icon import info from a theme source file.
 * Returns { importPath, exportName } or null if no icons.
 *
 * Looks for patterns like:
 *   import { defaultIconRegistry } from './icons.svelte';
 *   icons: defaultIconRegistry,
 * @param {string} filePath
 * @returns {{exportName: string, importPath: string} | null}
 */
function extractIconInfo(filePath) {
	const content = fs.readFileSync(filePath, 'utf8');

	// Find the icons field in defineTheme
	const iconsMatch = content.match(/icons:\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
	if (!iconsMatch) return null;

	const varName = /** @type {string} */ (iconsMatch[1]);

	// Find the import for that variable
	const importRegex = new RegExp(
		`import\\s*{[^}]*\\b${varName}\\b[^}]*}\\s*from\\s*['"]([^'"]+)['"]`
	);
	const importMatch = content.match(importRegex);
	if (!importMatch) return null;

	return {
		exportName: varName,
		importPath: /** @type {string} */ (importMatch[1])
	};
}

/**
 * Generate a minimal JS module for a built theme.
 * Includes the theme name, marker, and re-exports the icon registry.
 * All styling is in the CSS file.
 *
 * The icon registry is imported rather than inlined because it holds component
 * references, which cannot be serialized. `extractIconInfo` lifts the specifier
 * out of the TypeScript source, where an extensionless `./icons` is resolved by
 * the TypeScript resolver — but the artifact here is ESM JavaScript, which
 * requires a fully specified path. Only the caller knows what its own build
 * will emit and under what name, so `iconsSpecifier` lets it say. When it is
 * not given, the scraped specifier is emitted unchanged.
 *
 * @param {any} themeDef
 * @param {{exportName: string, importPath: string} | null} iconInfo
 * @param {string} [iconsSpecifier] - Overrides the scraped icon import specifier.
 * @returns {string}
 */
function generateBuiltModule(themeDef, iconInfo, iconsSpecifier) {
	// Preserve the historical generated bytes when no override is supplied.
	// User-provided specifiers need string-literal encoding so quotes and
	// backslashes cannot produce invalid JavaScript.
	const renderedSpecifier =
		iconsSpecifier === undefined ? `'${iconInfo?.importPath}'` : JSON.stringify(iconsSpecifier);
	const iconImport = iconInfo
		? `import { ${iconInfo.exportName} } from ${renderedSpecifier};\n`
		: '';
	const iconsField = iconInfo ? `  icons: ${iconInfo.exportName},` : '';
	const iconReExport = iconInfo ? `\nexport { ${iconInfo.exportName} };\n` : '';

	// Resolve token values — tuples become light-dark() strings
	/** @type {Record<string, unknown>} */
	const resolvedTokens = {};
	const sourceTokens = themeDef.resolvedTokens ?? themeDef.tokens;
	if (sourceTokens) {
		for (const [key, value] of Object.entries(sourceTokens)) {
			resolvedTokens[key] = resolveTokenValue(value);
		}
	}

	const tokensStr = JSON.stringify(resolvedTokens, null, 2)
		.split('\n')
		.map((line, i) => (i === 0 ? line : '  ' + line))
		.join('\n');

	return `${iconImport}/**
 * ${themeDef.name} theme — built by \`${getCliInvocation()} theme build\`
 * Import the CSS file alongside this module:
 *
 *   import { ${toIdentifier(themeDef.name)}Theme } from './${themeDef.name}';
 *   import './${themeDef.name}.css';
 */
export const ${toIdentifier(themeDef.name)}Theme = {
  name: '${themeDef.name}',
  __built: true,
  tokens: ${tokensStr},
${iconsField}
};
${iconReExport}`;
}

/**
 * Generate TypeScript declarations for a built theme module.
 * @param {any} themeDef
 * @param {{exportName: string, importPath: string} | null} iconInfo
 * @param {string | null} variantsFileName
 * @returns {string}
 */
function generateBuiltTypes(themeDef, iconInfo, variantsFileName) {
	const iconType = iconInfo
		? `import type { IconRegistry } from '${CORE_PACKAGE}';
export declare const ${iconInfo.exportName}: IconRegistry;
`
		: '';
	// Pull in the generated custom-variant augmentations so that importing the
	// theme's types also loads the module augmentations (otherwise the
	// `.variants.d.ts` is emitted but never referenced, and the custom variants
	// never widen the component prop unions for consumers).
	const variantsRef = variantsFileName
		? `/// <reference path="./${variantsFileName}" />
`
		: '';
	return `${variantsRef}import type { DefinedTheme } from '${CORE_PACKAGE}/theme';
${iconType}export declare const ${toIdentifier(themeDef.name)}Theme: DefinedTheme;
`;
}

// =============================================================================
// Component validation
// =============================================================================

/**
 * Validate component overrides in a theme definition.
 * Warns on unknown component names and unknown prop names.
 * Returns array of warning strings.
 * @param {{components?: Record<string, Record<string, unknown>>}} themeDef
 * @returns {Promise<string[]>}
 */
async function validateComponentOverrides(themeDef) {
	/** @type {string[]} */
	const warnings = [];
	if (!themeDef.components) return warnings;

	const index = await getThemeTargetIndex();
	if (index == null) return warnings;
	const knownComponents = Object.fromEntries(
		Object.entries(index).map(([key, entry]) => [key, entry.visualProps])
	);

	for (const [component, rules] of Object.entries(themeDef.components)) {
		// Check component name
		if (!(component in knownComponents)) {
			const similar = Object.keys(knownComponents)
				.filter((k) => {
					if (k.includes(component) || component.includes(k)) return true;
					// Levenshtein distance 1-2 for short names
					if (Math.abs(k.length - component.length) <= 2) {
						let diff = 0;
						const longer = k.length >= component.length ? k : component;
						const shorter = k.length < component.length ? k : component;
						let j = 0;
						for (let i = 0; i < longer.length && diff <= 2; i++) {
							if (longer[i] !== shorter[j]) diff++;
							else j++;
						}
						diff += shorter.length - j;
						return diff <= 2;
					}
					return false;
				})
				.slice(0, 3);
			const hint = similar.length > 0 ? ` Did you mean: ${similar.join(', ')}?` : '';
			warnings.push(`Unknown component "${component}".${hint}`);
			continue;
		}

		// Check prop names in prop:value keys
		const knownProps = knownComponents[component];
		for (const key of Object.keys(rules)) {
			if (key === 'base') continue;

			// Parse prop:value pairs (e.g. 'variant:secondary' or 'variant:destructive+size:sm')
			const pairs = key.split('+');
			for (const pair of pairs) {
				const [prop, value] = pair.split(':');
				// A colonless segment is a *bare state name* — `checked`, `disabled`,
				// `primary` — which `parseStyleKey` documents as its own style-key
				// form and turns straight into a class. It names no prop, so reading
				// it as one always warns. Upstream reads it as a prop and never
				// notices, because none of its generated keys are bare; this port's
				// `defineTheme` folds `generateTextColorComponents()` into
				// `theme.components` as `heading: {primary: …, secondary: …}`, so
				// every real theme built here produced ten false "Unknown prop"
				// warnings. `generateVariantDeclarationsAsync` above already skips
				// the same shape (`if (colonIdx === -1) continue`) — this makes the
				// two readers of `components` keys agree.
				if (value === undefined) continue;
				if (prop && !knownProps.includes(prop)) {
					const hint =
						knownProps.length > 0
							? ` Known props: ${knownProps.join(', ')}`
							: ' This component has no variant props.';
					warnings.push(`Unknown prop "${prop}" on component "${component}".${hint}`);
				}
			}
		}
	}

	return warnings;
}

/**
 * Validate that themes don't set private (--_*) CSS custom properties directly.
 * Private vars are internal implementation details managed by the derived var
 * expansion pipeline. Theme authors should write standard CSS properties
 * (e.g. borderRadius, padding) instead.
 *
 * Returns array of error strings.
 * @param {{components?: Record<string, Record<string, Record<string, unknown>>>}} themeDef
 * @returns {string[]}
 */
function validatePrivateVars(themeDef) {
	/** @type {string[]} */
	const errors = [];
	if (!themeDef.components) return errors;

	for (const [component, rules] of Object.entries(themeDef.components)) {
		for (const [key, styles] of Object.entries(rules)) {
			for (const prop of Object.keys(styles)) {
				if (typeof prop === 'string' && prop.startsWith('--_')) {
					errors.push(
						`Component "${component}" (${key}) sets private var "${prop}". ` +
							`Private vars (--_*) are internal — use standard CSS properties ` +
							`(e.g. borderRadius, padding) instead. The pipeline expands them automatically.`
					);
				}
			}
		}
	}

	return errors;
}

/**
 * Compile a defineTheme file to CSS + JS + .d.ts (and an optional
 * `.variants.d.ts`). Performs the writes and returns a `theme.build` receipt,
 * or `null` when the theme produced no CSS (nothing to build). Throws
 * AstryxError (stable code) on failure. Progress is emitted through the shared
 * `logger` (silent by default).
 *
 * @param {string} file - Theme file path, resolved against `cwd`.
 * @param {{out?: string, check?: boolean, iconsSpecifier?: string}} [options] - `out` overrides the output CSS path; `check` compares against on-disk outputs instead of writing. `iconsSpecifier` overrides the icon registry import specifier in the generated module.
 * @param {{cwd?: string}} [ctx]
 * @returns {Promise<import('../theme.type.mjs').ThemeBuildResponse | import('../theme.type.mjs').ThemeBuildCheckResponse | null>}
 */
export async function themeBuild(file, options = {}, { cwd = process.cwd() } = {}) {
	const filePath = path.resolve(cwd, file);

	if (!fs.existsSync(filePath)) {
		throw new AstryxError(`File not found: ${filePath}`, undefined, ERROR_CODES.ERR_FILE_NOT_FOUND);
	}

	logger.log(`\nBuilding theme from ${path.relative(cwd, filePath)}...`);

	// Extract theme definition
	let themeDef;
	try {
		themeDef = await extractThemeDefinition(filePath);
	} catch (e) {
		const err = /** @type {Error} */ (e);
		throw new AstryxError(err.message, undefined, ERROR_CODES.ERR_THEME_LOAD);
	}

	if (!themeDef.name) {
		throw new AstryxError(
			'Theme must have a name property.',
			undefined,
			ERROR_CODES.ERR_THEME_INVALID
		);
	}

	// Path-safety: the theme name is used to derive output filenames
	// (e.g. `${name}.css`, `${name}.js`). Reject names containing path
	// separators or traversal markers — `../../escaped` would otherwise
	// write JS modules outside the input directory.
	try {
		sanitizeName(themeDef.name, { label: 'theme name' });
	} catch (err) {
		if (err instanceof PathSafetyError) {
			throw new AstryxError(err.message, undefined, ERROR_CODES.ERR_PATH_TRAVERSAL);
		}
		throw err;
	}

	// Validate component overrides
	const warnings = await validateComponentOverrides(themeDef);
	const warningMessages = [];
	for (const w of warnings) {
		warningMessages.push(w);
		logger.warn(`  ⚠ ${w}`);
	}

	// Validate no private vars are set directly
	const privateVarErrors = validatePrivateVars(themeDef);
	for (const e of privateVarErrors) {
		warningMessages.push(e);
		logger.error(`  ✗ ${e}`);
	}
	if (privateVarErrors.length > 0) {
		logger.error(
			`\n  ${privateVarErrors.length} private var error(s). Use standard CSS properties instead.`
		);
	}

	// Generate CSS via core's shared generator — the SINGLE source of truth.
	// `astryx-svelte theme build` and the `<Theme>` runtime MUST emit identical
	// CSS, so there is exactly one generation path:
	// @astryx-svelte/core/theme/define. If core could not be imported, fail hard
	// rather than silently producing divergent output.
	if (!_defineTheme || !_generateThemeRulesSplit) {
		throw new AstryxError(
			`Could not load ${CORE_PACKAGE}/theme/define — \`astryx-svelte theme build\` requires a ` +
				`built, resolvable ${CORE_PACKAGE} so it emits the same CSS as the ` +
				`runtime <Theme>. Build ${CORE_PACKAGE} first (e.g. \`pnpm -F ${CORE_PACKAGE} ` +
				'build`)' +
				(_coreImportError ? `.\n  Import error: ${_coreImportError.message}` : '.'),
			undefined,
			ERROR_CODES.ERR_CORE_NOT_FOUND
		);
	}

	let css;
	let resolvedTheme;
	{
		// jiti returns an already-resolved theme; legacy eval returns raw input.
		// `resolvedTokens` is what `defineTheme` adds and the generator reads, so
		// its presence is the unambiguous test — see divergence 4 in the header.
		const isAlreadyResolved =
			themeDef.resolvedTokens != null && typeof themeDef.resolvedTokens === 'object';
		if (isAlreadyResolved) {
			resolvedTheme = themeDef;
		} else {
			resolvedTheme = _defineTheme({
				name: themeDef.name,
				typography: themeDef.typography,
				motion: themeDef.motion,
				radius: themeDef.radius,
				color: themeDef.color,
				syntax: themeDef.syntax,
				tokens: themeDef.tokens,
				components: themeDef.components,
				onDark: themeDef.onDark,
				onLight: themeDef.onLight
			});
		}
		const scopeSelector = themeScopeStart(themeDef.name);
		const scopeTo = THEME_SCOPE_TO;

		const { component, prose } = _generateThemeRulesSplit(resolvedTheme);
		const cssParts = [];
		// Prose element defaults always ship — the `<Theme>` runtime
		// (generateThemeCss) always emits them, so the build must too, or the
		// CLI output would diverge from runtime. They go in @layer reset
		// (zero-specificity :where()) so component/Markdown StyleX always wins.
		if (prose.length > 0) {
			const proseInner = prose.join('\n\n');
			cssParts.push(
				`@layer reset {\n@scope (${scopeSelector}) to (${scopeTo}) {\n${proseInner}\n}\n}`
			);
		}
		if (component.length > 0) {
			const componentInner = component.join('\n\n');
			const componentScope = `@scope (${scopeSelector}) to (${scopeTo}) {\n${componentInner}\n}`;
			// #3658: also emit attribute-specific rules so <Theme mode> can override color-scheme
			const colorSchemeDecl = componentScope.includes('light-dark(')
				? '  :root { color-scheme: light dark; }\n  html[data-theme="light"] { color-scheme: light; }\n  html[data-theme="dark"] { color-scheme: dark; }\n\n'
				: '';
			cssParts.push(`@layer astryx-theme {\n${colorSchemeDecl}${componentScope}\n}`);
		}
		// On-media rules (MediaTheme dark/light surface overrides)
		if (_generateOnMediaCss) {
			const onMediaCss = _generateOnMediaCss(resolvedTheme);
			if (onMediaCss) {
				cssParts.push(`@layer astryx-theme {\n${onMediaCss}\n}`);
			}
		}
		if (cssParts.length === 0) {
			logger.log('No overrides found — nothing to build.');
			return null;
		}
		css = cssParts.join('\n\n') + '\n';
	}

	// Source path relative to cwd — used in @generated headers
	const sourceRelative = path.relative(cwd, filePath);
	const buildCommand = `astryx-svelte theme build ${sourceRelative}${options.out ? ' --out ' + path.relative(cwd, path.resolve(cwd, options.out)) : ''}`;
	// Stable provenance recorded in @generated headers — versions, not a
	// timestamp, so identical inputs produce byte-identical output.
	const versions = resolveToolVersions(cwd);

	// Derive the default CSS name from the theme name so .css/.js/.d.ts
	// share one scheme; an explicit --out still wins.
	const baseName = themeDef.name;
	let outPath;
	if (options.out) {
		outPath = path.resolve(cwd, options.out);
		// Guard: relative paths must not escape cwd via `../`. Absolute paths are
		// trusted (the user explicitly controls where output goes, like gcc -o).
		if (!path.isAbsolute(options.out)) {
			assertWithin(options.out, cwd, { label: 'output path' });
		}
	} else {
		outPath = path.join(path.dirname(filePath), `${baseName}.css`);
	}

	const displayTheme = resolvedTheme || themeDef;
	// This port's `DefinedTheme` keeps the author's `tokens` and puts the
	// expanded map on `resolvedTokens`; upstream's single `tokens` field IS the
	// expanded map, so that is the field to count.
	const displayTokens = displayTheme.resolvedTokens ?? displayTheme.tokens;
	const tokenCount = displayTokens ? Object.keys(displayTokens).length : 0;
	const componentCount = displayTheme.components ? Object.keys(displayTheme.components).length : 0;
	const size = (Buffer.byteLength(css) / 1024).toFixed(1);

	// Compute all output paths up front so we can validate them as a
	// group BEFORE writing anything. Previously the CSS would be written
	// first; if the JS write failed (e.g. ENOENT, permission), the CSS
	// was left as orphaned half-built output. Stage-then-commit avoids
	// that.
	const outDir = path.dirname(outPath);
	const jsPath = path.join(outDir, `${baseName}.js`);
	const dtsPath = path.join(outDir, `${baseName}.d.ts`);

	const iconInfo = extractIconInfo(filePath);

	// Type augmentation .d.ts if theme has custom prop values. Computed
	// before the main .d.ts so the latter can reference it (see below).
	const augmentationSource = resolvedTheme || themeDef;
	const variantDecl = await generateVariantDeclarationsAsync(augmentationSource);
	const variantsFileName = variantDecl ? `${baseName}.variants.d.ts` : null;
	const variantDtsPath =
		variantDecl && variantsFileName ? path.join(outDir, variantsFileName) : null;
	const variantContent = variantDecl
		? generatedHeader(sourceRelative, 'ts', buildCommand, versions) + variantDecl
		: null;

	// Generate all file contents in memory first. The main .d.ts references
	// the variants file (when present) via a triple-slash directive so
	// importing the theme also loads the custom-variant augmentations.
	const cssContent = generatedHeader(sourceRelative, 'css', buildCommand, versions) + css;
	const jsContent =
		generatedHeader(sourceRelative, 'js', buildCommand, versions) +
		generateBuiltModule(resolvedTheme || themeDef, iconInfo, options.iconsSpecifier);
	const dtsContent =
		generatedHeader(sourceRelative, 'ts', buildCommand, versions) +
		generateBuiltTypes(themeDef, iconInfo, variantsFileName);

	// Atomic-ish write: stage every file as `<dest>.tmp`, then rename
	// each into place. If any stage step fails we clean up partials and
	// exit; if a rename fails mid-way we still have the originals (or
	// nothing) — never a half-built output set.
	const writes = [
		{ dest: outPath, content: cssContent },
		{ dest: jsPath, content: jsContent },
		{ dest: dtsPath, content: dtsContent }
	];
	if (variantDtsPath && variantContent) {
		writes.push({ dest: variantDtsPath, content: variantContent });
	}

	// Check mode: compare generated content against what's on disk instead of
	// writing. A file is "stale" if it's missing or its content differs once the
	// volatile @generated `Command:` line is ignored. Returns a
	// receipt listing stale/missing outputs so callers (CI) can fail on drift.
	if (options.check) {
		/** @type {Array<{path: string, reason: 'missing' | 'outdated'}>} */
		const stale = [];
		for (const w of writes) {
			const rel = path.relative(cwd, w.dest);
			if (!fs.existsSync(w.dest)) {
				stale.push({ path: rel, reason: 'missing' });
				continue;
			}
			const onDisk = fs.readFileSync(w.dest, 'utf8');
			if (normalizeForCompare(onDisk) !== normalizeForCompare(w.content)) {
				stale.push({ path: rel, reason: 'outdated' });
			}
		}
		const upToDate = stale.length === 0;
		if (upToDate) {
			logger.log(`\n✓ Theme outputs are up to date with ${sourceRelative}.`);
		} else {
			logger.error(`\n✗ ${stale.length} theme output(s) are out of date with ${sourceRelative}:`);
			for (const s of stale) {
				logger.error(`  ${s.reason === 'missing' ? 'missing' : 'stale'}: ${s.path}`);
			}
			logger.error(`\n  Rebuild with: ${buildCommand}`);
		}
		return {
			type: 'theme.build.check',
			data: {
				name: themeDef.name,
				upToDate,
				stale,
				checked: writes.map((w) => path.relative(cwd, w.dest))
			}
		};
	}

	fs.mkdirSync(outDir, { recursive: true });
	/** @type {Array<{tmp: string, dest: string}>} */
	const staged = [];
	try {
		for (const w of writes) {
			const tmp = `${w.dest}.${process.pid}.tmp`;
			fs.writeFileSync(tmp, w.content);
			staged.push({ tmp, dest: w.dest });
		}
		for (const s of staged) {
			fs.renameSync(s.tmp, s.dest);
		}
	} catch (err) {
		// Roll back any temp files we managed to create.
		for (const s of staged) {
			try {
				fs.rmSync(s.tmp, { force: true });
			} catch {
				/* best-effort */
			}
		}
		const msg = `Failed to write theme outputs: ${/** @type {Error} */ (err).message}`;
		throw new AstryxError(msg, undefined, ERROR_CODES.ERR_WRITE_FAILED);
	}

	logger.log(`\n✓ ${path.relative(cwd, outPath)}`);
	logger.log(`  ${tokenCount} token overrides, ${componentCount} component overrides`);
	logger.log(`  ${size} KB`);
	logger.log(`✓ ${path.relative(cwd, jsPath)}`);
	logger.log(`✓ ${path.relative(cwd, dtsPath)}`);
	if (variantDtsPath && variantDecl) {
		const augCount = (variantDecl.match(/': true;/g) || []).length;
		logger.log(`✓ ${path.relative(cwd, variantDtsPath)} (${augCount} type augmentations)`);
	}

	const relOutDir = path.relative(cwd, outDir) || '.';
	const cssBase = path.basename(outPath, '.css');
	const jsImport = importSpecifier(relOutDir, baseName);
	const cssImport = importSpecifier(relOutDir, cssBase) + '.css';
	const exportName = `${toIdentifier(baseName)}Theme`;
	logger.log(`
Install in your app (paths are relative to a file in src/ — adjust if yours lives elsewhere):

  import { ${exportName} } from '${jsImport}';
  import '${cssImport}';

  <Theme theme={${exportName}}>
    <App />
  </Theme>

Or with a <link> tag:

  import { ${exportName} } from '${jsImport}';

  <link rel="stylesheet" href="${cssImport}" />
  <Theme theme={${exportName}}>
    <App />
  </Theme>
`);

	// Print font declaration warnings (derived from typography roles). Inert in
	// both codebases today: neither `defineTheme` puts a `fonts` array on the
	// theme it returns. Kept verbatim rather than pruned — it is upstream's
	// output for a theme that carries one, and dropping it would be silent drift.
	if (resolvedTheme && resolvedTheme.fonts && resolvedTheme.fonts.length > 0) {
		logger.log(`\n⚠ Theme "${themeDef.name}" requires fonts not included in the build:`);
		for (const font of resolvedTheme.fonts) {
			logger.log(`  ${font.family} — add to your document <head>:`);
			logger.log(`  <link rel="stylesheet" href="${font.url}" />`);
		}
		logger.log('');
	}

	return {
		type: 'theme.build',
		data: {
			name: themeDef.name,
			tokenCount,
			componentCount,
			sizeKB: parseFloat(size),
			outputs: {
				css: path.relative(cwd, outPath),
				js: path.relative(cwd, jsPath),
				dts: path.relative(cwd, dtsPath),
				...(variantDecl && variantDtsPath
					? { variantsDts: path.relative(cwd, variantDtsPath) }
					: {})
			},
			warnings: warningMessages
		}
	};
}
