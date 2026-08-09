/**
 * @file Colocated tests for integration codemod discovery + the integration
 * runner.
 *
 * ## Ported case count
 *
 * Upstream has 7; 7 here, all live. Discovery itself is near-verbatim — it walks
 * `<codemodsRoot>/<version>/<id>.<ext>` and validates each default export
 * through `parseCodemod`, none of which is parser-dependent — so the only
 * adaptations are identity strings (`astryx.config.mjs` →
 * `astryx-svelte.config.mjs`, `astryx.integration.mjs` →
 * `astryx-svelte.integration.mjs`) and the runner's `jscodeshift` argument
 * becoming `parse`.
 *
 * Two fixture changes worth naming, both in the first two cases:
 *
 *   - the code codemod is exercised against a **`.svelte`** source rather than
 *     `a.ts`, because `.svelte` is the file this port's runner exists for and
 *     the one jscodeshift could not have read at all;
 *   - the transform edits through `magic-string` + `parseSvelte` rather than
 *     returning a `String.replace`, so the api the runner hands over is proven
 *     to be the pair the authoring contract advertises, not just present.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Project } from '../../foundation/config/project.mjs';
import {
	discoverIntegrationCodemods,
	selectIntegrationCodemods
} from './integration-discovery.mjs';
import { runIntegrationCodemods } from './integration-runner.mjs';
import { tryLoadSvelteParse } from './svelte-parser.mjs';

let tmpDir;
let originalCwd;

/**
 * Build a consumer project with an astryx-svelte.config.mjs that loads a single
 * integration package, and the integration package itself (manifest +
 * codemods dir). `codemodFiles` maps "<version>/<id>.mjs" -> file body.
 */
function scaffold(codemodFiles) {
	fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'consumer' }));
	fs.writeFileSync(
		path.join(tmpDir, 'astryx-svelte.config.mjs'),
		`export default { integrations: ['@acme/widgets'] };\n`
	);

	const pkgDir = path.join(tmpDir, 'node_modules', '@acme', 'widgets');
	fs.mkdirSync(pkgDir, { recursive: true });
	fs.writeFileSync(
		path.join(pkgDir, 'package.json'),
		JSON.stringify({ name: '@acme/widgets', version: '1.0.0' })
	);
	fs.writeFileSync(
		path.join(pkgDir, 'astryx-svelte.integration.mjs'),
		`export default { codemods: './codemods' };\n`
	);

	for (const [rel, body] of Object.entries(codemodFiles)) {
		const full = path.join(pkgDir, 'codemods', rel);
		fs.mkdirSync(path.dirname(full), { recursive: true });
		fs.writeFileSync(full, body);
	}
	return pkgDir;
}

/** A codemod that renames `<Widget wash>` to `<Widget muted>` via the real api. */
const RENAME_WASH_CODEMOD = `
	export default {
		type: 'code',
		title: 'Rename wash to muted',
		fileExtensions: ['.svelte'],
		transform(file, api) {
			const ast = api.parseSvelte(file.source, {modern: true});
			const s = new api.magicString(file.source);
			let changed = false;
			const walk = (nodes) => {
				for (const node of nodes ?? []) {
					if (node.type === 'Component') {
						for (const attr of node.attributes ?? []) {
							if (attr.type === 'Attribute' && attr.name === 'wash') {
								s.overwrite(attr.start, attr.start + 4, 'muted');
								changed = true;
							}
						}
					}
					walk(node.fragment?.nodes);
				}
			};
			walk(ast.fragment?.nodes);
			return changed ? s.toString() : null;
		}
	};
`;

beforeEach(() => {
	originalCwd = process.cwd();
	tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-codemod-test-'));
	process.chdir(tmpDir);
});

afterEach(() => {
	process.chdir(originalCwd);
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('integration codemod discovery', () => {
	it('discovers a code codemod and runs it for an applicable --from', async () => {
		scaffold({ '0.2.0/rename-wash.mjs': RENAME_WASH_CODEMOD });

		const project = await Project.load(tmpDir);
		expect(project.loadedIntegrations).toHaveLength(1);

		const byVersion = await discoverIntegrationCodemods(project.loadedIntegrations);
		expect([...byVersion.keys()]).toEqual(['0.2.0']);
		const entry = byVersion.get('0.2.0')[0];
		expect(entry.id).toBe('rename-wash');
		expect(entry.type).toBe('code');
		expect(entry.package).toBe('@acme/widgets');

		// Selection: applies upgrading from 0.1.0 -> 0.2.0, not from 0.2.0 -> 0.2.0
		expect(selectIntegrationCodemods(byVersion, '0.1.0', '0.2.0')).toHaveLength(1);
		expect(selectIntegrationCodemods(byVersion, '0.2.0', '0.2.0')).toHaveLength(0);

		// Run it against a source file.
		const srcDir = path.join(tmpDir, 'src');
		fs.mkdirSync(srcDir);
		fs.writeFileSync(path.join(srcDir, 'Page.svelte'), '<Widget wash label="hi" />\n');

		const parse = await tryLoadSvelteParse();
		const groups = selectIntegrationCodemods(byVersion, '0.1.0', '0.2.0');
		const result = runIntegrationCodemods(groups, {
			apply: true,
			path: './src',
			parse,
			silent: true
		});
		expect(result.errors).toHaveLength(0);
		expect(result.totalFilesChanged).toBe(1);
		expect(fs.readFileSync(path.join(srcDir, 'Page.svelte'), 'utf-8')).toBe(
			'<Widget muted label="hi" />\n'
		);
	});

	it('discovers and runs a config codemod against astryx-svelte.config.*', async () => {
		scaffold({
			'0.2.0/bump-config.mjs': `
				export default {
					type: 'config',
					title: 'Bump config',
					transform: (file) => file.source.replace('consumer-old', 'consumer-new'),
				};
			`
		});
		// Make the config file a transform target. (Project.load only needs a valid
		// default export; the marker string lives in a comment.)
		fs.writeFileSync(
			path.join(tmpDir, 'astryx-svelte.config.mjs'),
			`// consumer-old\nexport default { integrations: ['@acme/widgets'] };\n`
		);

		const project = await Project.load(tmpDir);
		const byVersion = await discoverIntegrationCodemods(project.loadedIntegrations);
		expect(byVersion.get('0.2.0')[0].type).toBe('config');

		const parse = await tryLoadSvelteParse();
		const groups = selectIntegrationCodemods(byVersion, '0.1.0', '0.2.0');
		const result = runIntegrationCodemods(groups, {
			apply: true,
			path: './src',
			parse,
			silent: true
		});
		expect(result.errors).toHaveLength(0);
		expect(result.totalFilesChanged).toBe(1);
		expect(fs.readFileSync(path.join(tmpDir, 'astryx-svelte.config.mjs'), 'utf-8')).toContain(
			'consumer-new'
		);
	});

	it('fails discovery when a codemod has no default export', async () => {
		scaffold({ '0.2.0/broken.mjs': `export const notDefault = 1;\n` });
		const project = await Project.load(tmpDir);
		// Validation happens at the LOAD boundary (loadModuleWithParser +
		// parseCodemod); a missing default export is a schema-invalid failure
		// rather than a bespoke "must default-export" message.
		await expect(discoverIntegrationCodemods(project.loadedIntegrations)).rejects.toThrow(
			/is invalid/i
		);
	});

	it('fails discovery when default export is not a codemod envelope', async () => {
		scaffold({ '0.2.0/bad.mjs': `export default { title: 'x', transform: () => null };\n` });
		const project = await Project.load(tmpDir);
		// No `type` discriminator -> fails the envelope schema at load.
		await expect(discoverIntegrationCodemods(project.loadedIntegrations)).rejects.toThrow(
			/is invalid/i
		);
	});

	it('accepts a PLAIN OBJECT codemod envelope (no factory required)', async () => {
		// Proves we dropped factory-identity coupling: a hand-written object that
		// matches the envelope schema is accepted by discovery.
		scaffold({
			'0.2.0/hand-written.mjs': `
				export default {
					type: 'code',
					title: 'Hand written',
					transform: (file) => file.source,
				};
			`
		});
		const project = await Project.load(tmpDir);
		const byVersion = await discoverIntegrationCodemods(project.loadedIntegrations);
		const entry = byVersion.get('0.2.0')[0];
		expect(entry.id).toBe('hand-written');
		expect(entry.type).toBe('code');
		expect(entry.codemod.isOptional).toBe(false); // schema default applied
	});

	it('rejects a malformed codemod envelope at load (missing transform)', async () => {
		scaffold({ '0.2.0/no-transform.mjs': `export default { type: 'code', title: 'x' };\n` });
		const project = await Project.load(tmpDir);
		await expect(discoverIntegrationCodemods(project.loadedIntegrations)).rejects.toThrow(
			/transform/i
		);
	});

	it('fails discovery on a duplicate id across versions within a package', async () => {
		scaffold({
			'0.2.0/dup.mjs': `
				export default {type: 'code', title: 'a', transform: () => null};
			`,
			'0.3.0/dup.mjs': `
				export default {type: 'code', title: 'b', transform: () => null};
			`
		});
		const project = await Project.load(tmpDir);
		await expect(discoverIntegrationCodemods(project.loadedIntegrations)).rejects.toThrow(
			/across versions/i
		);
	});
});
