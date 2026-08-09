/**
 * @file Ownership-aware component discovery, end to end: the record shape
 * `discoverIntegrationComponents` / `discoverOwnedComponents` produce, and the
 * `component()` behaviours that read them (integration detail, `--package`
 * scoping, `--source`, the ambiguity refusal, and the package-qualified list).
 *
 * ## Ported case count
 *
 * 13, matching upstream one for one. Two fixture adaptations:
 *
 *   - the integration's same-stem source is `MetaAppShell.svelte`, not
 *     `MetaAppShell.tsx`;
 *   - **there is no `packages/core` symlink.** Upstream builds one so
 *     `findCoreDir` resolves from an OS-temp root. This port's temp roots are
 *     repo-local (the `.astryx-*` convention every other suite here uses), and
 *     `findCoreDir`'s upward walk finds the real `packages/core` on its own —
 *     which is what the symlink was emulating, and which needs no elevated
 *     privileges on Windows.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
	discoverIntegrationComponents,
	discoverOwnedComponents,
	findIntegrationComponentDoc,
	findIntegrationComponentSource,
	CORE_PACKAGE
} from '../../../foundation/discovery/component-discovery.mjs';

// The api `component()` reads integrations via Project.load(). Mock it to
// return a project whose `loadedIntegrations` are already resolved (exactly the
// shape foundation/integrations/integrations.mjs produces) while keeping the
// integration's `components` dir on disk so its `.doc.mjs` files load normally.
const projectLoadMock = vi.fn();
vi.mock('../../../foundation/config/project.mjs', () => ({
	Project: { load: (...args) => projectLoadMock(...args) }
}));

// Import the api AFTER the mock is registered.
const { component } = await import('../../../api/component/component.mjs');

// These are real-filesystem integration tests: each `component()` call scans
// the entire core library (recursive readdir + hundreds of probes). Under
// saturated parallel workers that I/O can exceed the 5s default and surface as
// a spurious timeout. Size the budget to the work.
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

const CLI_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const REAL_CORE = path.resolve(CLI_ROOT, '..', 'core');

let tmpDir;

const INTEGRATION_NAME = '@test/meta';
const INTEGRATION_ISSUES = 'https://example.com/meta/issues';

/**
 * Build a consumer fixture: `node_modules/@test/meta` with a `components` dir
 * using the same-stem source/doc convention (MetaAppShell.svelte +
 * MetaAppShell.doc.mjs). Returns the absolute paths plus the resolved
 * integration entry the Project.load mock hands back.
 */
function createFixture({ withSource = true, extraComponent = null } = {}) {
	const intDir = path.join(tmpDir, 'node_modules', '@test', 'meta');
	const compDir = path.join(intDir, 'components');
	fs.mkdirSync(compDir, { recursive: true });
	fs.writeFileSync(
		path.join(intDir, 'package.json'),
		JSON.stringify({ name: INTEGRATION_NAME, version: '1.2.3' })
	);
	fs.writeFileSync(
		path.join(compDir, 'MetaAppShell.doc.mjs'),
		`export const docs = {\n  name: 'MetaAppShell',\n  usage: { description: 'Meta-flavored app shell.' },\n  props: [{ name: 'title', type: 'string', description: 'Header title' }],\n};\n`
	);
	if (withSource) {
		fs.writeFileSync(
			path.join(compDir, 'MetaAppShell.svelte'),
			'<script>\n\tlet {title} = $props();\n</script>\n\n<div class="MetaAppShell">{title}</div>\n'
		);
	}
	if (extraComponent) {
		fs.writeFileSync(
			path.join(compDir, `${extraComponent}.doc.mjs`),
			`export const docs = {\n  name: '${extraComponent}',\n  usage: { description: '${extraComponent} from meta.' },\n};\n`
		);
		fs.writeFileSync(
			path.join(compDir, `${extraComponent}.svelte`),
			`<div>${extraComponent}</div>\n`
		);
	}

	const integration = {
		name: INTEGRATION_NAME,
		version: '1.2.3',
		components: compDir,
		templates: undefined,
		codemods: undefined,
		issuesUrl: INTEGRATION_ISSUES
	};
	projectLoadMock.mockResolvedValue({
		integrations: [INTEGRATION_NAME],
		loadedIntegrations: [integration]
	});
	return { coreDir: REAL_CORE, intDir, compDir, integration };
}

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(CLI_ROOT, '.astryx-ownership-'));
	projectLoadMock.mockReset();
	// Default: no integrations (core only).
	projectLoadMock.mockResolvedValue({ integrations: [], loadedIntegrations: [] });
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('discoverIntegrationComponents (ownership records)', () => {
	it('records name, package, sourcePath, and issuesUrl for same-stem components', () => {
		const { integration, compDir } = createFixture();
		const records = discoverIntegrationComponents(integration);
		expect(records).toHaveLength(1);
		const rec = records[0];
		expect(rec.name).toBe('MetaAppShell');
		expect(rec.package).toBe(INTEGRATION_NAME);
		expect(rec.issuesUrl).toBe(INTEGRATION_ISSUES);
		expect(rec.sourcePath).toBe(path.join(compDir, 'MetaAppShell.svelte'));
		expect(fs.existsSync(rec.sourcePath)).toBe(true);
	});

	it('records sourcePath: null when the integration ships docs without source', () => {
		const { integration } = createFixture({ withSource: false });
		const [rec] = discoverIntegrationComponents(integration);
		expect(rec.sourcePath).toBeNull();
	});
});

describe('discoverOwnedComponents (core + integrations)', () => {
	it('marks core components with the core package and integration components with their owner', () => {
		const { coreDir, integration } = createFixture();
		const records = discoverOwnedComponents(coreDir, [integration]);
		const core = records.find((r) => r.package === CORE_PACKAGE);
		expect(core).toBeTruthy();
		expect(core.issuesUrl).toBeUndefined();
		const meta = records.find((r) => r.name === 'MetaAppShell');
		expect(meta.package).toBe(INTEGRATION_NAME);
		expect(meta.issuesUrl).toBe(INTEGRATION_ISSUES);
		expect(meta.sourcePath).toContain('MetaAppShell.svelte');
	});
});

describe('findIntegrationComponentDoc / Source', () => {
	it('finds doc + source by name', () => {
		const { integration } = createFixture();
		expect(findIntegrationComponentDoc(integration, 'MetaAppShell')).toContain(
			'MetaAppShell.doc.mjs'
		);
		expect(findIntegrationComponentSource(integration, 'MetaAppShell')).toContain(
			'MetaAppShell.svelte'
		);
	});

	it('returns null source when none present', () => {
		const { integration } = createFixture({ withSource: false });
		expect(findIntegrationComponentSource(integration, 'MetaAppShell')).toBeNull();
	});
});

describe('component() — integration ownership via config', () => {
	it('discovers a config integration component by package ownership (detail)', async () => {
		createFixture();
		const result = await component('MetaAppShell', { cwd: tmpDir });
		expect(result.type).toBe('component.detail');
		expect(result.data.name).toBe('MetaAppShell');
		expect(result.data.package).toBe(INTEGRATION_NAME);
		expect(result.data.sourceAvailable).toBe(true);
		expect(result.data.import).toBe(`${INTEGRATION_NAME}/MetaAppShell`);
	});

	it('--package resolves the integration component', async () => {
		createFixture();
		const result = await component('MetaAppShell', { cwd: tmpDir, package: INTEGRATION_NAME });
		expect(result.type).toBe('component.detail');
		expect(result.data.package).toBe(INTEGRATION_NAME);
	});

	it('--source returns the integration source when available', async () => {
		createFixture();
		const result = await component('MetaAppShell', { cwd: tmpDir, source: true });
		expect(result.type).toBe('component.detail.source');
		expect(result.data.component).toBe('MetaAppShell');
		expect(result.data.source).toContain('MetaAppShell');
	});

	it('--source throws ERR_NO_SOURCE when the integration ships no source', async () => {
		createFixture({ withSource: false });
		await expect(component('MetaAppShell', { cwd: tmpDir, source: true })).rejects.toMatchObject({
			code: 'ERR_NO_SOURCE'
		});
	});

	it('errors with candidate packages when a name is ambiguous (core + integration)', async () => {
		// 'AppShell' exists in core; add a same-named integration component.
		createFixture({ extraComponent: 'AppShell' });
		let caught;
		try {
			await component('AppShell', { cwd: tmpDir });
		} catch (e) {
			caught = e;
		}
		expect(caught).toBeTruthy();
		expect(caught.code).toBe('ERR_UNKNOWN_COMPONENT');
		const pkgs = (caught.suggestions ?? []).map((s) => s.name);
		expect(pkgs).toContain(CORE_PACKAGE);
		expect(pkgs).toContain(INTEGRATION_NAME);
	});

	it('--package disambiguates an ambiguous name to core', async () => {
		createFixture({ extraComponent: 'AppShell' });
		const result = await component('AppShell', { cwd: tmpDir, package: CORE_PACKAGE });
		expect(result.type).toBe('component.detail');
		expect(result.data.package).toBe(CORE_PACKAGE);
	});

	it('--package disambiguates an ambiguous name to the integration', async () => {
		createFixture({ extraComponent: 'AppShell' });
		const result = await component('AppShell', { cwd: tmpDir, package: INTEGRATION_NAME });
		expect(result.type).toBe('component.detail');
		expect(result.data.package).toBe(INTEGRATION_NAME);
	});

	it('JSON list includes integration components as {name, package} objects', async () => {
		createFixture();
		const result = await component(undefined, { cwd: tmpDir, list: true });
		expect(result.type).toBe('component.list');
		expect(result.data.detail).toBe('names');
		const allEntries = Object.values(result.data.components).flat();
		for (const entry of allEntries) {
			expect(typeof entry.name).toBe('string');
			expect(typeof entry.package).toBe('string');
		}
		const meta = allEntries.find((e) => e.name === 'MetaAppShell');
		expect(meta).toBeTruthy();
		expect(meta.package).toBe(INTEGRATION_NAME);
		expect(allEntries.some((e) => e.package === CORE_PACKAGE)).toBe(true);
	});
});
