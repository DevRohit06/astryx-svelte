/**
 * @file Integration-provided template discovery (same-stem + type-driven).
 *
 * These tests stand up a temp consumer project with an astryx-svelte.config and
 * an installed integration package that contributes templates, then exercise the
 * public `template()` API to verify discovery, package/type scoping, ambiguity
 * errors, and copy-to-dir naming.
 *
 * ## Ported case count
 *
 * 10, matching upstream one for one. Three mechanical renames run through the
 * fixtures — `astryx.config` → `astryx-svelte.config`, `astryx.integration` →
 * `astryx-svelte.integration`, and a template's same-stem source is a `.svelte`
 * — plus the one that is not mechanical: a scaffolded page is `+page.svelte`,
 * SvelteKit's route component, where upstream writes Next.js' `page.tsx`.
 *
 * "always reports core templates under @astryx-svelte/core" carried an
 * **inverted** assertion until the page-template assets landed: this port
 * shipped none, so the case asserted a count of zero specifically so it would
 * fail the day they arrived. It did. Upstream's `toBeGreaterThan(0)` is now
 * restored and all 10 cases match upstream one for one.
 *
 * The bound stays `> 0` rather than a literal count, which is upstream's own
 * shape: the transcription lands in batches, so an exact number would have to
 * be edited with each one and would assert the batch schedule rather than the
 * behaviour under test — that core contributes its bundled templates at all.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { template } from './template.mjs';

let tmpDir;
let originalCwd;

function makeConsumer() {
	const dir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-template-it-'));
	fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'consumer' }));
	fs.writeFileSync(
		path.join(dir, 'astryx-svelte.config.mjs'),
		`export default { integrations: ['@acme/widgets'] };\n`
	);
	return dir;
}

/**
 * Install an @acme/widgets integration package that declares a templates root.
 * @returns the package dir.
 */
function installWidgets(consumerDir) {
	const pkgDir = path.join(consumerDir, 'node_modules', '@acme', 'widgets');
	fs.mkdirSync(pkgDir, { recursive: true });
	fs.writeFileSync(
		path.join(pkgDir, 'package.json'),
		JSON.stringify({ name: '@acme/widgets', version: '2.0.0' })
	);
	fs.writeFileSync(
		path.join(pkgDir, 'astryx-svelte.integration.mjs'),
		`export default { templates: './templates' };\n`
	);
	fs.mkdirSync(path.join(pkgDir, 'templates'));
	return pkgDir;
}

/** Write a template doc + same-stem source under the templates root. */
function writeTemplate(pkgDir, id, { kind, body, withSource = true }) {
	const docPath = path.join(pkgDir, 'templates', `${id}.doc.mjs`);
	fs.mkdirSync(path.dirname(docPath), { recursive: true });
	fs.writeFileSync(
		docPath,
		body ?? `export default {type: '${kind}', name: '${id} name', description: '${id} desc'};\n`
	);
	if (withSource) {
		fs.writeFileSync(
			path.join(pkgDir, 'templates', `${id}.svelte`),
			`<p>${id.replace(/[^a-zA-Z0-9]/g, ' ')}</p>\n`
		);
	}
}

beforeEach(() => {
	originalCwd = process.cwd();
	tmpDir = makeConsumer();
	process.chdir(tmpDir);
});

afterEach(() => {
	process.chdir(originalCwd);
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('integration template discovery', () => {
	it('discovers and lists an integration template with package + type', async () => {
		const pkgDir = installWidgets(tmpDir);
		writeTemplate(pkgDir, 'pricing', { kind: 'page' });

		const result = await template(undefined, { list: true, cwd: tmpDir });
		expect(result.type).toBe('template.list');
		const entry = result.data.find((t) => t.id === 'pricing');
		expect(entry).toBeTruthy();
		expect(entry.type).toBe('page');
		expect(entry.package).toBe('@acme/widgets');
		expect(entry.name).toBe('pricing name');
		expect(entry.description).toBe('pricing desc');
	});

	it('lists nested-id templates (kebab path under root)', async () => {
		const pkgDir = installWidgets(tmpDir);
		writeTemplate(pkgDir, 'marketing/hero', { kind: 'block' });

		const result = await template(undefined, { list: true, cwd: tmpDir });
		const entry = result.data.find((t) => t.id === 'marketing/hero');
		expect(entry).toBeTruthy();
		expect(entry.type).toBe('block');
		expect(entry.package).toBe('@acme/widgets');
	});

	it('always reports core templates under @astryx-svelte/core', async () => {
		// Upstream's assertion, restored: `assets/templates/pages/` now carries
		// the transcribed page templates, so core contributes discoverable
		// templates and the inverted form this case used to hold has retired.
		const result = await template(undefined, { list: true, cwd: tmpDir });
		const core = result.data.filter((t) => t.package === '@astryx-svelte/core');
		expect(core.length).toBeGreaterThan(0);
	});

	it('--package narrows the listing', async () => {
		const pkgDir = installWidgets(tmpDir);
		writeTemplate(pkgDir, 'pricing', { kind: 'page' });

		const result = await template(undefined, {
			list: true,
			package: '@acme/widgets',
			cwd: tmpDir
		});
		expect(result.data.length).toBe(1);
		expect(result.data[0].id).toBe('pricing');
	});

	it('skips a template whose same-stem source is missing', async () => {
		const pkgDir = installWidgets(tmpDir);
		writeTemplate(pkgDir, 'orphan', { kind: 'page', withSource: false });

		const result = await template(undefined, { list: true, cwd: tmpDir });
		expect(result.data.find((t) => t.id === 'orphan')).toBeUndefined();
	});

	it('skips a raw doc that is missing a type', async () => {
		const pkgDir = installWidgets(tmpDir);
		writeTemplate(pkgDir, 'untyped', {
			kind: 'page',
			body: `export default {name: 'Untyped', description: 'no type'};\n`
		});

		const result = await template(undefined, { list: true, cwd: tmpDir });
		expect(result.data.find((t) => t.id === 'untyped')).toBeUndefined();
	});

	it('errors with candidates when an id is ambiguous across type/package', async () => {
		const pkgDir = installWidgets(tmpDir);
		// Same id "hero" as both a page and a block within the integration.
		writeTemplate(pkgDir, 'hero', { kind: 'page' });
		// Add a sibling block doc with the same stem in a different file is not
		// possible (same file). Instead install a second package with a "hero".
		const pkg2 = path.join(tmpDir, 'node_modules', '@acme', 'extra');
		fs.mkdirSync(path.join(pkg2, 'templates'), { recursive: true });
		fs.writeFileSync(
			path.join(pkg2, 'package.json'),
			JSON.stringify({ name: '@acme/extra', version: '1.0.0' })
		);
		fs.writeFileSync(
			path.join(pkg2, 'astryx-svelte.integration.mjs'),
			`export default { templates: './templates' };\n`
		);
		fs.writeFileSync(
			path.join(pkg2, 'templates', 'hero.doc.mjs'),
			`export default {type: 'block', name: 'Hero block', description: 'b'};\n`
		);
		fs.writeFileSync(path.join(pkg2, 'templates', 'hero.svelte'), `<p>Hero</p>\n`);
		fs.writeFileSync(
			path.join(tmpDir, 'astryx-svelte.config.mjs'),
			`export default { integrations: ['@acme/widgets', '@acme/extra'] };\n`
		);

		await expect(template('hero', { targetPath: './out', cwd: tmpDir })).rejects.toMatchObject({
			code: 'ERR_AMBIGUOUS_TEMPLATE'
		});
	});

	it('--type and --package narrow an ambiguous id to a single match', async () => {
		const pkgDir = installWidgets(tmpDir);
		writeTemplate(pkgDir, 'pricing', { kind: 'page' });

		const result = await template('pricing', {
			type: 'page',
			package: '@acme/widgets',
			show: true,
			cwd: tmpDir
		});
		expect(result.type).toBe('template.show');
		expect(result.data.type).toBe('page');
	});

	it('copies a page template into a directory as +page.svelte', async () => {
		const pkgDir = installWidgets(tmpDir);
		writeTemplate(pkgDir, 'pricing', { kind: 'page' });

		const result = await template('pricing', {
			targetPath: './dest',
			cwd: tmpDir
		});
		expect(result.type).toBe('template.copy');
		expect(result.data.fileName).toBe('+page.svelte');
		expect(fs.existsSync(path.join(tmpDir, 'dest', '+page.svelte'))).toBe(true);
	});

	it('copies a block template into a directory as <id-basename>.svelte', async () => {
		const pkgDir = installWidgets(tmpDir);
		writeTemplate(pkgDir, 'marketing/hero', { kind: 'block' });

		const result = await template('marketing/hero', {
			targetPath: './dest',
			cwd: tmpDir
		});
		expect(result.type).toBe('template.copy');
		expect(result.data.fileName).toBe('hero.svelte');
		expect(fs.existsSync(path.join(tmpDir, 'dest', 'hero.svelte'))).toBe(true);
	});
});
