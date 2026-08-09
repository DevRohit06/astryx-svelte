/**
 * @file Keeps the documented framework version in sync with the peer
 * dependency range declared by `@astryx-svelte/core` (upstream issue #4575:
 * users must be able to discover the framework requirement without reading
 * package.json).
 *
 * Runs against the real packages/core package.json, not mocks.
 *
 * Ported from upstream's `react-version-sync.test.mjs`, 4/4 cases, with the
 * subject changed from React to Svelte. **All four now run.** Two of them stood
 * as `it.todo` for several slices because the surface they assert on did not
 * exist: this repository had no root `README.md`, and `packages/core/README.md`
 * was the stock `sv` scaffold ("Everything you need to build a Svelte library")
 * which names no version at all. Both were written when `/docs/core` and
 * `/docs/cli` landed — the docs site renders those two files as pages, so they
 * became content the site publishes rather than files nobody reads — and the
 * cases were restored with them.
 *
 * The first case is adapted rather than deferred. Upstream asserts that the
 * `react` and `react-dom` peer ranges agree, which is a consistency check
 * between two framework peers; core declares exactly one. The property with the
 * same purpose here is that it stays exactly one — a second framework peer
 * appearing is precisely the situation upstream's case exists to catch.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findCoreDir } from '../../foundation/fs/paths.mjs';
import { docs as gettingStarted } from '../../assets/docs/getting-started.doc.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');

// Every place that names the supported Svelte version.
const SURFACES =
	'update every surface that names the supported Svelte version: ' +
	'packages/cli/assets/docs/getting-started.doc.mjs, packages/core/README.md, ' +
	'and README.md at the repo root';

describe('documented Svelte version matches the core peer dependency', () => {
	const coreDir = findCoreDir(REPO_ROOT);
	const pkg = JSON.parse(fs.readFileSync(path.join(coreDir, 'package.json'), 'utf-8'));
	const svelteRange = pkg.peerDependencies?.svelte;
	if (typeof svelteRange !== 'string') {
		throw new Error(
			'@astryx-svelte/core no longer declares a svelte peer dependency; ' +
				`${SURFACES}, then teach this test the new contract`
		);
	}
	const match = /\d+/.exec(svelteRange);
	if (!match) {
		throw new Error(
			`cannot read a major version from the svelte peer range "${svelteRange}"; ` +
				`${SURFACES}, then teach this test the new contract`
		);
	}
	const major = match[0];
	// "Svelte 5" but not "Svelte 50"; also matches "Svelte 5+".
	const namesTheMajor = new RegExp(`Svelte ${major}(?!\\d)`);

	it('core declares exactly one framework peer dependency', () => {
		// Upstream's counterpart checks that its `react` and `react-dom` peer
		// ranges agree. Core has one framework peer rather than two, so the
		// equivalent guard is that it stays one — a second would mean every
		// surface naming the supported version has a second version to name.
		//
		// `@stylexjs/stylex` is excluded because it is not a framework peer and
		// not this port's addition: upstream declares it as a peer too
		// (`@astryxdesign/core`'s peers are `@stylexjs/stylex`, `react`,
		// `react-dom`). It is a peer rather than a dependency on purpose — the
		// consumer's own bundler runs the StyleX compiler over core, so a second
		// copy resolving at a different version renders unstyled with no error.
		const BUILD_TOOL_PEERS = new Set(['@stylexjs/stylex']);
		const frameworkPeers = Object.keys(pkg.peerDependencies).filter(
			(name) => !BUILD_TOOL_PEERS.has(name)
		);
		expect(
			frameworkPeers,
			`core acquired a second framework peer dependency; if that is intentional, ${SURFACES}`
		).toEqual(['svelte']);
	});

	it(`root README names Svelte ${major}`, () => {
		const readme = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf-8');
		expect(readme, SURFACES).toMatch(namesTheMajor);
	});

	it(`@astryx-svelte/core README names Svelte ${major}`, () => {
		const readme = fs.readFileSync(path.join(coreDir, 'README.md'), 'utf-8');
		expect(readme, SURFACES).toMatch(namesTheMajor);
	});

	it(`getting-started guide names Svelte ${major} in prose`, () => {
		const prose = gettingStarted.sections
			.flatMap((section) => section.content)
			.filter((block) => block.type === 'prose')
			.map((block) => block.text)
			.join('\n');
		expect(prose, SURFACES).toMatch(namesTheMajor);
	});
});
