// Guards the neutral preview boundary — upstream's
// `apps/docsite/src/__tests__/component-preview-theme.test.ts`, ported.
//
// **Why this is a script and not a vitest file.** `docs/` has no test runner:
// its `test` script is a node assertion script (`emit-core-docs.mjs --check`),
// and CLAUDE.md puts the repo's vitest suites under `packages/core/src/tests/`,
// where they run against core rather than the docs site. Adding a second runner
// to carry two assertions is the larger change; this keeps upstream's *check* in
// the same shape as the check `docs` already runs. It is otherwise a faithful
// port — both of upstream's cases, in order, asserting the same two properties.
//
// Upstream's suite is itself source-text assertions rather than a render test,
// and that is deliberate on its part: the property being guarded is *where the
// boundary sits in the tree*, which a render assertion would not distinguish
// from a boundary drawn inside the preview content. The regexes below are
// retargeted at this port's file names and markup, which is the only
// translation.
//
// The two cases:
//
//   1. Each preview container is wrapped in `ComponentPreviewTheme`.
//   2. None of those files draws `<Theme theme={neutralTheme}>` itself — the
//      boundary stays at the container instead of leaking into content.
//
// A third check has no upstream counterpart and is named here as an addition,
// not a port: upstream's suite covers only `component-detail/`, because that is
// the directory its regexes read. This port's `showcase-thumbnail.svelte` stands
// in for *two* upstream files (`ShowcaseThumbnail` and `TemplateThumbnail`, which
// differ only by `renderWidth`), and the template dialog inlines a third
// (`TemplatePreviewSurface`). Those three surfaces were dropped by the same
// mistaken reasoning as the component-detail ones, so leaving them unguarded
// would let exactly the regression this script exists for come back through the
// door it actually came through the first time.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shellDir = join(dirname(fileURLToPath(import.meta.url)), '../src/lib/shell');
const routesDir = join(dirname(fileURLToPath(import.meta.url)), '../src/routes');

/** @param {string} path @returns {string} */
function read(path) {
	return readFileSync(path, 'utf8');
}

const failures = [];
let checked = 0;

/**
 * @param {string} label
 * @param {string} source
 * @param {RegExp} pattern
 * @param {boolean} shouldMatch
 */
function assertMatch(label, source, pattern, shouldMatch) {
	checked += 1;
	if (pattern.test(source) === shouldMatch) return;
	failures.push(
		shouldMatch
			? `${label}: expected to match ${pattern}`
			: `${label}: expected NOT to match ${pattern}`
	);
}

// Case 1 — upstream's "applies the neutral preview theme around preview
// containers". Upstream asserts the wrapper sits immediately outside the `Card`;
// the same three containers exist here, one of them in the route rather than a
// `ComponentDetailClient` component because SvelteKit has no such split.
const detailPage = read(join(routesDir, 'components/[name]/+page.svelte'));
const stage = read(join(shellDir, 'playground-stage.svelte'));
const exampleBlock = read(join(shellDir, 'example-block.svelte'));

assertMatch(
	'components/[name]/+page.svelte',
	detailPage,
	/<ComponentPreviewTheme>\s*<Card variant="muted" padding=\{0\}>/,
	true
);
assertMatch('playground-stage.svelte', stage, /<ComponentPreviewTheme>\s*<Card[\s>]/, true);
assertMatch(
	'example-block.svelte',
	exampleBlock,
	/<ComponentPreviewTheme>\s*<Card padding=\{3\}>/,
	true
);

// Case 2 — upstream's "keeps the theme boundary at the container instead of
// inside content". `showcase-preview.svelte` is upstream's `ShowcasePreview`.
const showcasePreview = read(join(shellDir, 'showcase-preview.svelte'));

for (const [label, source] of [
	['showcase-preview.svelte', showcasePreview],
	['playground-stage.svelte', stage],
	['example-block.svelte', exampleBlock]
]) {
	assertMatch(label, source, /<Theme\s+theme=\{neutralTheme\}/, false);
}

// Beyond upstream — the three surfaces its directory-scoped regexes never see.
const thumbnail = read(join(shellDir, 'showcase-thumbnail.svelte'));
const templateDialog = read(join(shellDir, 'template-preview-dialog.svelte'));

assertMatch(
	'showcase-thumbnail.svelte',
	thumbnail,
	/<ComponentPreviewTheme><Block \/><\/ComponentPreviewTheme>/,
	true
);
assertMatch(
	'template-preview-dialog.svelte',
	templateDialog,
	/<ComponentPreviewTheme><Template \/><\/ComponentPreviewTheme>/,
	true
);

// The boundary itself must actually be neutral. Without this the checks above
// pass against a `ComponentPreviewTheme` that had been quietly repointed at the
// brand theme, which is the exact end state they exist to prevent.
const boundary = read(join(shellDir, 'component-preview-theme.svelte'));
assertMatch(
	'component-preview-theme.svelte',
	boundary,
	/<Theme theme=\{neutralTheme\} mode=\{colorMode\.themeMode\}>/,
	true
);

if (failures.length > 0) {
	console.error('Preview theme boundary check failed:\n');
	for (const failure of failures) console.error(`  - ${failure}`);
	console.error(
		'\nEvery live preview renders under neutralTheme, not the docsite brand theme.' +
			'\nSee src/lib/shell/component-preview-theme.svelte.'
	);
	process.exit(1);
}

console.log(`preview theme boundary: ${checked} assertions, all held`);
