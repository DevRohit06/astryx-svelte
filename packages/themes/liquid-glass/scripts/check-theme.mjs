// The Liquid Glass theme's oracle.
//
// Every other `packages/themes/*` package ships `scripts/compare-upstream.mjs`,
// which diffs its compiled `theme.css` against the `@astryxdesign/theme-*` it
// ports. That check is what makes those ports trustworthy, and it is also what
// silently catches the two mistakes a theme author actually makes: a token name
// that does not exist, and a component name that does not exist. Neither fails
// loudly on its own — `defineTheme` takes any string, `generateThemeRules` emits
// a rule for any string, and the result is CSS that parses, loads, and styles
// nothing.
//
// This theme has no upstream counterpart to diff against, so those two checks
// are made directly instead:
//
//   1. every token it declares is a real Astryx token (or in this theme's own
//      documented `--glass-*` namespace);
//   2. every component it overrides is a real `themeProps()` component;
//   3. every override it wrote reached the stylesheet;
//   4. the `-webkit-` half of every `backdrop-filter` is present;
//   5. no `backdrop-filter` value contains a `var()`;
//   6. the reduced-transparency block switches off every glass surface.
//
// (4) and (5) are here because they are the two defects in this theme that no
// reviewer on a Chromium machine can see. A dropped prefix loses the material on
// Safari below 18; a `var()` loses it on **every** Safari, because
// `backdrop-filter` there ignores any value containing one whatever it resolves
// to (mdn/browser-compat-data#25914). Both fail silently, in the one browser a
// macOS theme most needs to be right on. Retire (5) when WebKit fixes the bug.
//
// Ground truth for (1) and (2) is core's **built `dist/`**, the same artifact
// consumers resolve — not its `src/`, which would let this pass against code
// that was never shipped.

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { liquidGlassTheme } from '../src/liquid-glass-theme.ts';

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const coreDist = join(packageDir, '..', '..', 'core', 'dist');

/** This theme's own custom properties, documented in the source's header. */
const OWN_NAMESPACE = '--glass-';

/** Recursively lists files under `dir` whose name ends with `suffix`. */
async function filesUnder(dir, suffix, out = []) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) await filesUnder(path, suffix, out);
		else if (entry.name.endsWith(suffix)) out.push(path);
	}
	return out;
}

function fail(message) {
	console.error(message);
	process.exitCode = 1;
}

// -----------------------------------------------------------------------------
// Ground truth
// -----------------------------------------------------------------------------

// Token names come out of the module that mints them. Read as text rather than
// imported: `tokens.stylex.js` ships uncompiled for the consumer's StyleX
// plugin, so importing it under plain Node hits a live `stylex.defineVars` and
// throws — the same constraint that keeps `tokenDefaults` out of
// `define-theme.ts`.
const tokensSource = await readFile(join(coreDist, 'styles', 'tokens.stylex.js'), 'utf8');
const knownTokens = new Set([...tokensSource.matchAll(/'(--[a-z0-9-]+)':/g)].map((m) => m[1]));
if (knownTokens.size === 0) {
	fail('no token names found in core/dist/styles/tokens.stylex.js — has its shape changed?');
}

// Component names come out of every `themeProps('name')` call site in the
// shipped components.
const knownComponents = new Set();
for (const path of await filesUnder(join(coreDist, 'components'), '.svelte')) {
	const source = await readFile(path, 'utf8');
	for (const m of source.matchAll(/themeProps\(\s*'([a-z0-9-]+)'/g)) {
		knownComponents.add(m[1]);
	}
}
if (knownComponents.size === 0) {
	fail('no themeProps() component names found in core/dist/components — has its shape changed?');
}

const css = await readFile(join(packageDir, 'dist', 'theme.css'), 'utf8').catch(() => {
	fail('dist/theme.css does not exist — run `pnpm build` in this package first.');
	return '';
});

// -----------------------------------------------------------------------------
// 1. Token names
// -----------------------------------------------------------------------------

const declaredTokens = Object.keys(liquidGlassTheme.tokens ?? {});
const unknownTokens = declaredTokens.filter(
	(name) => !knownTokens.has(name) && !name.startsWith(OWN_NAMESPACE)
);

// -----------------------------------------------------------------------------
// 2. Component names
//
// `theme.components` is the merged map, so it also holds the `heading` and
// `text` entries `defineTheme` generates from the type scale. Both are real
// components, so checking the merged map is strictly stronger than checking the
// authored one.
// -----------------------------------------------------------------------------

const declaredComponents = Object.keys(liquidGlassTheme.components ?? {});
const unknownComponents = declaredComponents.filter((name) => !knownComponents.has(name));

// -----------------------------------------------------------------------------
// 3. Every override reached the stylesheet
// -----------------------------------------------------------------------------

const missingRules = declaredComponents.filter((name) => !css.includes(`.astryx-${name}`));

// -----------------------------------------------------------------------------
// 4. Vendor-prefix parity
// -----------------------------------------------------------------------------

const backdropDecls = [...css.matchAll(/(-webkit-)?backdrop-filter:\s*([^;]+);/g)];
const unprefixed = backdropDecls.filter((m) => !m[1]).length;
const prefixed = backdropDecls.filter((m) => m[1]).length;

// -----------------------------------------------------------------------------
// 5. No var() inside a backdrop-filter — the Safari bug above
// -----------------------------------------------------------------------------

const varInBackdrop = [
	...new Set(backdropDecls.filter((m) => m[2].includes('var(')).map((m) => m[2].trim()))
];

// -----------------------------------------------------------------------------
// 6. Reduced transparency switches off every glass surface
//
// The block is appended by `scripts/build-theme.mjs` from the theme object, so
// this asserts the two ends agree rather than re-deriving the list: every
// selector that got a material must appear in the block, and the block must
// exist at all.
// -----------------------------------------------------------------------------

const reduceIndex = css.indexOf('prefers-reduced-transparency');
const reduceBlock = reduceIndex === -1 ? '' : css.slice(reduceIndex);
const glassSelectors = [];
for (const [component, styleKeys] of Object.entries(liquidGlassTheme.components ?? {})) {
	for (const [styleKey, styles] of Object.entries(styleKeys)) {
		if ('backdropFilter' in styles) glassSelectors.push({ component, styleKey });
	}
}
const unreduced =
	reduceIndex === -1
		? ['(the whole @media block is missing)']
		: glassSelectors
				.filter(({ component }) => !reduceBlock.includes(`.astryx-${component}`))
				.map(({ component, styleKey }) => `${component} / ${styleKey}`);

// -----------------------------------------------------------------------------
// Report
// -----------------------------------------------------------------------------

console.log(`tokens declared:     ${declaredTokens.length} (${unknownTokens.length} unknown)`);
console.log(
	`components overridden: ${declaredComponents.length} (${unknownComponents.length} unknown)`
);
console.log(`backdrop-filter:     ${unprefixed} unprefixed / ${prefixed} -webkit-`);
console.log(`glass surfaces:      ${glassSelectors.length} (${unreduced.length} not reduced)`);
console.log(`known token names:   ${knownTokens.size}`);
console.log(`known components:    ${knownComponents.size}`);

if (unknownTokens.length) {
	fail(
		`\n--- unknown token names (not an Astryx token, not ${OWN_NAMESPACE}*) ---\n` +
			unknownTokens.map((n) => `  ${n}`).join('\n')
	);
}
if (unknownComponents.length) {
	fail(
		'\n--- unknown component names (no themeProps() call renders this class) ---\n' +
			unknownComponents.map((n) => `  ${n}`).join('\n')
	);
}
if (missingRules.length) {
	fail(
		'\n--- overridden but absent from theme.css ---\n' +
			missingRules.map((n) => `  ${n}`).join('\n')
	);
}
if (unprefixed !== prefixed) {
	fail(
		`\n--- vendor-prefix mismatch ---\n  ${unprefixed} \`backdrop-filter\` vs ` +
			`${prefixed} \`-webkit-backdrop-filter\`; Safari below 18 knows only the prefixed name.`
	);
}
if (unprefixed === 0) {
	fail('\n--- no backdrop-filter in the output ---\n  this theme is named for the material.');
}
if (varInBackdrop.length) {
	fail(
		'\n--- var() inside a backdrop-filter ---\n' +
			'  Safari ignores these entirely, whatever they resolve to, so the material\n' +
			'  disappears on the browser this theme most needs. Inline the literal value.\n' +
			varInBackdrop.map((v) => `  ${v}`).join('\n')
	);
}
if (unreduced.length) {
	fail(
		'\n--- glass surfaces not switched off under prefers-reduced-transparency ---\n' +
			unreduced.map((n) => `  ${n}`).join('\n')
	);
}

if (process.exitCode) {
	console.error('\nFAILED');
} else {
	console.log('\nOK');
}
