/**
 * @file Integration tests for the --detail level contract on list views.
 *
 * Drives the real CLI against the monorepo core dir and asserts the documented
 * size ordering for both `component --list` and `util --list`:
 *
 *   brief  (names only)              <  smallest
 *   compact (name + 1-line desc)     <  middle
 *   full   (dense per-entry docs)       largest
 *
 * All three levels must produce DISTINCT output. This guards against the
 * historically-inverted behavior where `brief` was densest and `full`
 * duplicated `compact`.
 *
 * ## Ported case count
 *
 * 12, matching upstream one for one. The second block drives `util` instead of
 * `hook` (the command rename; `hook` remains a registered alias) and its
 * envelope is `util.list`. Upstream spawns a subprocess per assertion; this
 * port's `runCli` drives the same program in-process, which slice 1 landed for
 * exactly these suites.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'node:path';
import { runCli } from '../../../test-utils/run-cli.mjs';

// Repo root holds packages/core, which findCoreDir() walks up to locate.
const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');

async function listOutputs(cmd) {
	const brief = (await runCli([cmd, '--list', '--detail', 'brief'], REPO_ROOT)).stdout;
	const compact = (await runCli([cmd, '--list', '--detail', 'compact'], REPO_ROOT)).stdout;
	const full = (await runCli([cmd, '--list', '--detail', 'full'], REPO_ROOT)).stdout;
	return { brief, compact, full };
}

describe('--detail level ordering: component --list', () => {
	let brief, compact, full;
	beforeAll(async () => {
		({ brief, compact, full } = await listOutputs('component'));
	}, 60_000);

	it('produces strictly increasing output size: brief < compact < full', () => {
		expect(brief.length).toBeGreaterThan(0);
		expect(compact.length).toBeGreaterThan(brief.length);
		expect(full.length).toBeGreaterThan(compact.length);
	});

	it('produces three distinct outputs', () => {
		expect(brief).not.toEqual(compact);
		expect(compact).not.toEqual(full);
		expect(brief).not.toEqual(full);
	});

	it('brief is names-only (no targets, import hints, or prose descriptions)', () => {
		expect(brief).not.toMatch(/Targets:/);
		expect(brief).not.toMatch(/← from/);
		// Names only — should contain component names but no " — " desc separator.
		expect(brief).toMatch(/Button/);
		expect(brief).not.toMatch(/ — /);
	});

	it('compact has descriptions (records expose a description field)', () => {
		// The shared formatter kit renders one record per entry
		// (name/import/description) rather than a single em-dash-joined line.
		expect(compact).toMatch(/^description:/m);
	});

	it('full has dense per-entry docs (props, targets, and import hints)', () => {
		expect(full).toMatch(/Targets:/);
		expect(full).toMatch(/← from/);
		// Prop name lists appear in the dense brief-all rendering.
		expect(full).toMatch(/children/);
	});

	it('--json list emits one component.list type across all detail levels, tagged by data.detail', async () => {
		const names = JSON.parse((await runCli(['component', '--list', '--json'], REPO_ROOT)).stdout);
		expect(names.type).toBe('component.list');
		expect(names.apiVersion).toBe(1);
		expect(names.data.detail).toBe('names');
		expect(typeof names.data.components).toBe('object');

		const compact = JSON.parse(
			(await runCli(['component', '--list', '--detail', 'compact', '--json'], REPO_ROOT)).stdout
		);
		expect(compact.type).toBe('component.list');
		expect(compact.data.detail).toBe('compact');
		expect(typeof compact.data.components).toBe('object');

		const full = JSON.parse(
			(await runCli(['component', '--list', '--detail', 'full', '--json'], REPO_ROOT)).stdout
		);
		expect(full.type).toBe('component.list');
		expect(full.data.detail).toBe('full');
		expect(typeof full.data.components).toBe('object');
	}, 60_000);
});

describe('--detail level ordering: util --list', () => {
	let brief, compact, full;
	beforeAll(async () => {
		({ brief, compact, full } = await listOutputs('util'));
	}, 60_000);

	it('produces strictly increasing output size: brief < compact < full', () => {
		expect(brief.length).toBeGreaterThan(0);
		expect(compact.length).toBeGreaterThan(brief.length);
		expect(full.length).toBeGreaterThan(compact.length);
	});

	it('produces three distinct outputs', () => {
		expect(brief).not.toEqual(compact);
		expect(compact).not.toEqual(full);
		expect(brief).not.toEqual(full);
	});

	it('brief is names-only (no param tables or import blocks)', () => {
		expect(brief).not.toMatch(/\| Param \|/);
		expect(brief).not.toMatch(/## Parameters/);
		expect(brief).not.toMatch(/import \{/);
		expect(brief).toMatch(/use[A-Z]/);
		expect(brief).not.toMatch(/ — /);
	});

	it('compact has per-util descriptions (records with a description field)', () => {
		expect(compact).toMatch(/description:/);
	});

	it('full has dense docs (param tables and import statements)', () => {
		expect(full).toMatch(/\| Param \|/);
		expect(full).toMatch(/import \{/);
	});

	it('--json list emits one util.list type across all detail levels, tagged by data.detail', async () => {
		const names = JSON.parse((await runCli(['util', '--list', '--json'], REPO_ROOT)).stdout);
		expect(names.type).toBe('util.list');
		expect(names.apiVersion).toBe(1);
		expect(names.data.detail).toBe('names');
		expect(typeof names.data.components).toBe('object');

		const compact = JSON.parse(
			(await runCli(['util', '--list', '--detail', 'compact', '--json'], REPO_ROOT)).stdout
		);
		expect(compact.type).toBe('util.list');
		expect(compact.data.detail).toBe('compact');
		expect(typeof compact.data.components).toBe('object');

		const full = JSON.parse(
			(await runCli(['util', '--list', '--detail', 'full', '--json'], REPO_ROOT)).stdout
		);
		expect(full.type).toBe('util.list');
		expect(full.data.detail).toBe('full');
		expect(typeof full.data.components).toBe('object');
	}, 60_000);
});
