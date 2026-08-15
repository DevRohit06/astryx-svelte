/**
 * @file Regression guard: a registered core codemod must be REACHABLE through
 * `astryx-svelte upgrade`, not just correct in isolation.
 *
 * `upgrade` targets the installed core version — it runs every codemod in
 * `(from, installedCore]`. Upstream's authoring codemods sit at the registry's
 * top version, so they only run once the installed core has reached it; because
 * core ships in the same fixed-version release group as the CLI a released core
 * does reach it, but nothing pinned that invariant. A registry entry above the
 * shipped core version would silently strand the migration.
 *
 * ## Ported case count
 *
 * Upstream has 2; **2 here, both live.** Both were `it.todo` for as long as this
 * port's codemod registry was empty (a codemod migrates *between* two releases,
 * and only one had shipped) — with `latestVersion` and `versions.at(-1)` both
 * `undefined`, the second case was `undefined === undefined` and would have
 * passed without the invariant holding. The 0.4.0 entry
 * (`migrate-table-rowexpansion-to-tree`, for the breaking `useTableRowExpansion`
 * rewrite) is the release that unblocked them, exactly as the previous version
 * of this header said it would.
 *
 * The first case uses the **real** registry transform rather than a stub: the
 * property under test is that the shipped codemod reaches a consumer's file
 * through `upgrade`, and a stub would prove the plumbing while leaving the
 * shipped transform unexercised through it.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { upgrade } from '../upgrade.mjs';
import { logger } from '../../logger.mjs';
import { versions, latestVersion } from '../../../assets/codemods/registry.mjs';

vi.setConfig({ testTimeout: 30000 });

let tmpDir;
let originalCwd;

beforeEach(() => {
	originalCwd = process.cwd();
	tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-codemod-reach-'));
});

afterEach(() => {
	process.chdir(originalCwd);
	fs.rmSync(tmpDir, { recursive: true, force: true });
	vi.restoreAllMocks();
	logger.setSilent(true);
});

/** A consumer project with `version` of core installed. */
function writeProject(version) {
	fs.writeFileSync(
		path.join(tmpDir, 'package.json'),
		JSON.stringify({ name: 'fixture', dependencies: { '@astryx-svelte/core': version } }, null, 2)
	);
	const coreDir = path.join(tmpDir, 'node_modules', '@astryx-svelte', 'core');
	fs.mkdirSync(coreDir, { recursive: true });
	fs.writeFileSync(
		path.join(coreDir, 'package.json'),
		JSON.stringify({ name: '@astryx-svelte/core', version }, null, 2)
	);
	fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
}

/** The pre-migration authoring surface: tree-mode `useTableRowExpansion`. */
const OLD_SURFACE = `<script lang="ts">
	import { Table, useTableRowExpansion, useTableRowExpansionState } from '@astryx-svelte/core';

	const expansionState = useTableRowExpansionState(() => ({
		baseData: tree,
		getChildren: (item) => item.children ?? [],
		getRowKey: (item) => item.id,
		expandedKeys,
		setExpandedKeys: (next) => (expandedKeys = next)
	}));

	const expansion = useTableRowExpansion(() => expansionState.expansionConfig);
</script>

<Table data={expansionState.data} columns={cols} idKey="id" plugins={{ expansion }} />
`;

describe('upgrade — core codemods are reachable', () => {
	it('rewrites an old-surface file when installed core is at the registry latest', async () => {
		writeProject(latestVersion);
		const file = path.join(tmpDir, 'src', 'Tree.svelte');
		fs.writeFileSync(file, OLD_SURFACE);
		process.chdir(tmpDir);

		const res = await upgrade({ from: '0.3.1', apply: true, path: 'src' }, { cwd: tmpDir });

		expect(res.type).toBe('upgrade.run');
		const rewritten = fs.readFileSync(file, 'utf-8');
		expect(rewritten).not.toContain('useTableRowExpansionState');
		expect(rewritten).toContain('useTableTreeState');
		expect(rewritten).toContain('useTableTreeData');
	});

	it('does NOT strand the migration: latestVersion is the top registry tier', () => {
		expect(versions.length).toBeGreaterThan(0);
		expect(latestVersion).toBe(versions[versions.length - 1]);
	});
});
