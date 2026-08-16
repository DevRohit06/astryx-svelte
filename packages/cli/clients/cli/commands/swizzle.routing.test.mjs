/**
 * @file Integration-routing tests for `astryx-svelte swizzle`. Ported
 * case-for-case from upstream's `clients/cli/commands/swizzle.routing.test.mjs`
 * — 9 cases, 9 here.
 *
 * `rewriteImports` is unit-tested in api/swizzle/swizzle.test.mjs. These tests
 * exercise the end-to-end command behavior by running the CLI in-process against
 * hermetic fixtures: a fake `@astryx-svelte/core` under node_modules plus, for
 * the integration cases, a configured integration package
 * (astryx-svelte.config.mjs + astryx-svelte.integration.mjs + a `components`
 * dir) — all under node_modules so the config/manifest loaders resolve normally.
 *
 * The fake core carries **no `exports` map**, which is deliberate: it puts the
 * fixtures on upstream's textual-collapse branch, so these cases assert exactly
 * the routing upstream asserts. The resolving branch, which needs a real export
 * surface, is covered against the real core in api/swizzle/.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runCli } from '../../../test-utils/run-cli.mjs';
import { __resetDiscoveryCache } from '../../../foundation/discovery/component-discovery.mjs';
import { __resetSwizzleSurfaceCache } from '../../../api/swizzle/swizzle.mjs';

/**
 * Build a fake `@astryx-svelte/core` under <project>/node_modules with a single
 * swizzleable button directory (bare `button.svelte`, no doc).
 * @param {string} project
 */
function buildFakeCore(project) {
	const core = path.join(project, 'node_modules', '@astryx-svelte', 'core');
	const buttonDir = path.join(core, 'src', 'lib', 'components', 'button');
	fs.mkdirSync(buttonDir, { recursive: true });
	fs.writeFileSync(
		path.join(core, 'package.json'),
		'{"name":"@astryx-svelte/core","version":"0.0.13"}'
	);
	fs.writeFileSync(
		path.join(buttonDir, 'button.svelte'),
		[
			`<script lang="ts">`,
			`	import { tokens } from '../../styles/tokens.stylex.js';`,
			`	import { helper } from './helper.js';`,
			`</script>`,
			''
		].join('\n')
	);
	fs.writeFileSync(path.join(buttonDir, 'helper.ts'), `export const helper = 1;\n`);
	return core;
}

/**
 * Build a configured integration package `@test/meta` under
 * <project>/node_modules with a same-stem component (source + doc) and an
 * escaping import, plus a colocated test file. Writes astryx-svelte.config.mjs
 * at the project root listing the integration.
 *
 * @param {string} project
 * @param {{issuesUrl?: string|null, componentName?: string}} [opts]
 */
function buildIntegration(project, { issuesUrl, componentName = 'MetaAppShell' } = {}) {
	const intDir = path.join(project, 'node_modules', '@test', 'meta');
	const compRoot = path.join(intDir, 'components');
	const compDir = path.join(compRoot, componentName);
	fs.mkdirSync(compDir, { recursive: true });
	fs.writeFileSync(
		path.join(intDir, 'package.json'),
		JSON.stringify({ name: '@test/meta', version: '1.2.3' })
	);
	/** @type {Record<string, string>} */
	const manifest = { components: './components' };
	if (issuesUrl) manifest.issuesUrl = issuesUrl;
	fs.writeFileSync(
		path.join(intDir, 'astryx-svelte.integration.mjs'),
		`export default ${JSON.stringify(manifest)};\n`
	);
	fs.writeFileSync(
		path.join(compDir, `${componentName}.svelte`),
		[
			`<script lang="ts">`,
			`	import x from '../utils/foo';`,
			`	import { sib } from './sibling.js';`,
			`</script>`,
			''
		].join('\n')
	);
	fs.writeFileSync(path.join(compDir, 'sibling.ts'), `export const sib = 1;\n`);
	fs.writeFileSync(
		path.join(compDir, `${componentName}.doc.mjs`),
		`export const docs = {name: '${componentName}', usage: {description: 'x'}};\n`
	);
	fs.writeFileSync(path.join(compDir, `${componentName}.test.ts`), `it('noop', () => {});\n`);
	fs.writeFileSync(
		path.join(project, 'astryx-svelte.config.mjs'),
		`export default {integrations: ['@test/meta']};\n`
	);
	return { intDir, compDir };
}

/**
 * @param {string} project
 * @param {Record<string, unknown>} [extra]
 */
function writeProjectPackageJson(project, extra = {}) {
	fs.writeFileSync(
		path.join(project, 'package.json'),
		JSON.stringify({ name: 'consumer', version: '1.0.0', ...extra })
	);
}

/** @type {string} */
let tmpDir;
/** @type {string} */
let project;
beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-swizzle-routing-'));
	project = path.join(tmpDir, 'project');
	fs.mkdirSync(project, { recursive: true });
	// Both indexes memoize per directory; a fresh fixture in a fresh temp dir is
	// a fresh key, but the caches are process-wide and cheap to clear.
	__resetDiscoveryCache();
	__resetSwizzleSurfaceCache();
});
afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('swizzle — core feedback routing via config', () => {
	it('routes core feedback to config.issuesUrl when set', async () => {
		buildFakeCore(project);
		writeProjectPackageJson(project);
		fs.writeFileSync(
			path.join(project, 'astryx-svelte.config.mjs'),
			`export default {issuesUrl: 'https://github.com/acme/ds/issues'};\n`
		);

		const result = await runCli(['--json', 'swizzle', 'button', '-f'], project);
		expect(result.code).toBe(0);
		const env = JSON.parse(result.stdout);
		expect(env.type).toBe('swizzle.copy');
		expect(env.data.package).toBe('@astryx-svelte/core');
		expect(env.data.feedback.issuesUrl).toBe('https://github.com/acme/ds/issues');
		// Escaping import rewritten to core; sibling import preserved.
		const out = fs.readFileSync(
			path.join(project, 'components', 'astryx', 'button', 'button.svelte'),
			'utf-8'
		);
		// The fixture core declares no `exports`, so the collapse branch runs and
		// `../../styles/x` becomes `<pkg>/styles` — Node's own rule for a package
		// with no export map. Against the real core the same specifier resolves to
		// `<pkg>/theme`; api/swizzle/swizzle.test.mjs pins that.
		expect(out).toContain(`from '@astryx-svelte/core/styles'`);
		expect(out).toContain(`from './helper.js'`);
	});

	it('falls back to the default issues URL when config has none', async () => {
		buildFakeCore(project);
		writeProjectPackageJson(project);

		const result = await runCli(['--json', 'swizzle', 'button', '-f'], project);
		expect(result.code).toBe(0);
		const env = JSON.parse(result.stdout);
		// Upstream's literal is `https://github.com/facebook/astryx/issues/new`,
		// which must not be inherited — it would route a *port* bug to Meta's
		// tracker. `DEFAULT_ISSUES_URL` reads this package's own `bugs` field, and
		// this repo declares none yet (port/todo.md, slice 3), so the assertion is
		// against the exported constant rather than a literal.
		const { DEFAULT_ISSUES_URL } = await import('../../../foundation/config/project.mjs');
		expect(env.data.feedback?.issuesUrl).toBe(DEFAULT_ISSUES_URL);
	});
});

describe('swizzle — integration-owned components', () => {
	it('copies the component dir (excluding test/doc), rewrites escaping imports to the owner package, routes feedback to the integration issuesUrl', async () => {
		buildFakeCore(project);
		writeProjectPackageJson(project);
		buildIntegration(project, { issuesUrl: 'https://example.com/meta/issues' });

		const result = await runCli(['--json', 'swizzle', 'MetaAppShell', '-f'], project);
		expect(result.code).toBe(0);
		const env = JSON.parse(result.stdout);
		expect(env.type).toBe('swizzle.copy');
		expect(env.data.package).toBe('@test/meta');
		// Doc + test excluded from the copy.
		expect(env.data.files).toContain('MetaAppShell.svelte');
		expect(env.data.files).toContain('sibling.ts');
		expect(env.data.files).not.toContain('MetaAppShell.doc.mjs');
		expect(env.data.files.some((/** @type {string} */ f) => f.includes('.test.'))).toBe(false);
		// Feedback routed to the integration's issues URL.
		expect(env.data.feedback.issuesUrl).toBe('https://example.com/meta/issues');

		const outDir = path.join(project, 'components', 'astryx', 'MetaAppShell');
		expect(fs.existsSync(path.join(outDir, 'MetaAppShell.doc.mjs'))).toBe(false);
		const out = fs.readFileSync(path.join(outDir, 'MetaAppShell.svelte'), 'utf-8');
		expect(out).toContain(`from '@test/meta/utils'`);
		expect(out).toContain(`from './sibling.js'`);
	});

	it('omits the feedback note when the integration ships no issuesUrl', async () => {
		buildFakeCore(project);
		writeProjectPackageJson(project);
		buildIntegration(project, { issuesUrl: null });

		const result = await runCli(['--json', 'swizzle', 'MetaAppShell', '-f'], project);
		expect(result.code).toBe(0);
		const env = JSON.parse(result.stdout);
		expect(env.type).toBe('swizzle.copy');
		expect(env.data.package).toBe('@test/meta');
		expect(env.data.feedback).toBeUndefined();
	});
});

describe('swizzle — ambiguous ownership', () => {
	it('errors when a name is owned by core + an integration and no --package is given', async () => {
		buildFakeCore(project);
		writeProjectPackageJson(project);
		// Integration also provides "button" (collides with core's directory name).
		buildIntegration(project, {
			issuesUrl: 'https://example.com/meta/issues',
			componentName: 'button'
		});

		const result = await runCli(['--json', 'swizzle', 'button', '-f'], project);
		expect(result.code).not.toBe(0);
		const env = JSON.parse(result.stdout);
		expect(env.code).toBe('ERR_AMBIGUOUS_COMPONENT');
		const pkgs = (env.suggestions ?? []).map((/** @type {{name: string}} */ s) => s.name);
		expect(pkgs).toContain('@astryx-svelte/core');
		expect(pkgs).toContain('@test/meta');
	});

	it('--package resolves an ambiguous name to the integration', async () => {
		buildFakeCore(project);
		writeProjectPackageJson(project);
		buildIntegration(project, {
			issuesUrl: 'https://example.com/meta/issues',
			componentName: 'button'
		});

		const result = await runCli(
			['--json', 'swizzle', 'button', '--package', '@test/meta', '-f'],
			project
		);
		expect(result.code).toBe(0);
		const env = JSON.parse(result.stdout);
		expect(env.data.package).toBe('@test/meta');
		const out = fs.readFileSync(
			path.join(project, 'components', 'astryx', 'button', 'button.svelte'),
			'utf-8'
		);
		expect(out).toContain(`from '@test/meta/utils'`);
	});

	it('--package resolves an ambiguous name to core', async () => {
		buildFakeCore(project);
		writeProjectPackageJson(project);
		buildIntegration(project, {
			issuesUrl: 'https://example.com/meta/issues',
			componentName: 'button'
		});

		const result = await runCli(
			['--json', 'swizzle', 'button', '--package', '@astryx-svelte/core', '-f'],
			project
		);
		expect(result.code).toBe(0);
		const env = JSON.parse(result.stdout);
		expect(env.data.package).toBe('@astryx-svelte/core');
		const out = fs.readFileSync(
			path.join(project, 'components', 'astryx', 'button', 'button.svelte'),
			'utf-8'
		);
		expect(out).toContain(`from '@astryx-svelte/core/styles'`);
	});
});

/**
 * Build a fake core with a component whose `.stylex.ts` imports StyleX (so the
 * swizzle StyleX-build note should fire) and one that doesn't.
 *
 * Upstream's fixture puts the StyleX import in the component file itself. Here
 * it cannot be there: StyleX may only be imported from a `.ts` module, never
 * from a `.svelte` file. The detection therefore scans `.ts`, and the fixture
 * mirrors the real layout — a `.svelte` beside its `.stylex.ts`.
 * @param {string} project
 */
function buildStyleXCore(project) {
	const core = path.join(project, 'node_modules', '@astryx-svelte', 'core');
	const componentsRoot = path.join(core, 'src', 'lib', 'components');
	fs.mkdirSync(componentsRoot, { recursive: true });
	fs.writeFileSync(
		path.join(core, 'package.json'),
		'{"name":"@astryx-svelte/core","version":"0.0.13"}'
	);
	// StyleX component.
	const styledDir = path.join(componentsRoot, 'styled');
	fs.mkdirSync(styledDir, { recursive: true });
	fs.writeFileSync(
		path.join(styledDir, 'styled.stylex.ts'),
		[
			`import * as stylex from '@stylexjs/stylex';`,
			`export const styles = stylex.create({base: {color: 'red'}});`,
			''
		].join('\n')
	);
	fs.writeFileSync(
		path.join(styledDir, 'styled.svelte'),
		`<script lang="ts">\n\timport { styles } from './styled.stylex.js';\n</script>\n`
	);
	// Plain component (no StyleX).
	const plainDir = path.join(componentsRoot, 'plain');
	fs.mkdirSync(plainDir, { recursive: true });
	fs.writeFileSync(path.join(plainDir, 'plain.svelte'), `<span>plain</span>\n`);
	return core;
}

describe('swizzle — StyleX build setup note', () => {
	it('reports usesStyleX and prints a setup note for StyleX components', async () => {
		buildStyleXCore(project);
		writeProjectPackageJson(project);

		// JSON payload carries the machine-readable flag.
		const jsonResult = await runCli(['--json', 'swizzle', 'styled', '-f'], project);
		expect(jsonResult.code).toBe(0);
		const env = JSON.parse(jsonResult.stdout);
		expect(env.data.usesStyleX).toBe(true);

		// Human output surfaces the compiler requirement. Upstream also asserts a
		// `next/font` caveat; there is no Next.js here, and the Svelte answer
		// (`@stylexjs/unplugin`) lives in the styling doc the note points at.
		const humanResult = await runCli(['swizzle', 'styled', '-f'], project);
		expect(humanResult.code).toBe(0);
		expect(humanResult.stdout).toMatch(/StyleX compiler/i);
		expect(humanResult.stdout).toMatch(/unstyled/i);
		expect(humanResult.stdout).toMatch(/docs styling/);
	});

	it('does not print the StyleX note for components without StyleX', async () => {
		buildStyleXCore(project);
		writeProjectPackageJson(project);

		const jsonResult = await runCli(['--json', 'swizzle', 'plain', '-f'], project);
		expect(jsonResult.code).toBe(0);
		const env = JSON.parse(jsonResult.stdout);
		expect(env.data.usesStyleX).toBe(false);

		const humanResult = await runCli(['swizzle', 'plain', '-f'], project);
		expect(humanResult.code).toBe(0);
		expect(humanResult.stdout).not.toMatch(/StyleX compiler/i);
	});
});
