/**
 * @file Colocated tests for the v0.4.0 row-expansion → tree codemod.
 *
 * ## Ported case count
 *
 * Upstream has 10; **9 here, all live**. The dropped one is
 * `supports the @xds/core import source alias`: upstream publishes the same
 * package under two scopes and its `IMPORT_SOURCES` lists four specifiers, where
 * this port ships one package with one root entry point. There is no second
 * source to support, and asserting the single one twice would pass without
 * testing anything.
 *
 * Every fixture is translated from TSX to the shape a Svelte consumer actually
 * writes — the hooks take a **getter**, the state result is held rather than
 * destructured, and the table is markup rather than a returned element. Two
 * upstream cases assert against a destructuring pattern (`visibleData: data`,
 * `treeConfig` shorthand); those keep upstream's destructured fixture, because
 * the property they check only exists in that shape and the codemod still
 * handles it.
 */

import { describe, it, expect } from 'vitest';
import MagicString from 'magic-string';
import { walk } from 'zimmerframe';
import transform from '../migrate-table-rowexpansion-to-tree.mjs';

/** The api the runner builds (`assets/codemods/run-codemod.mjs`), minus the logging no-ops. */
async function makeApi() {
	const { parse } = await import('svelte/compiler');
	return {
		magicString: MagicString,
		parseSvelte: parse,
		walk,
		jscodeshift: undefined,
		stats: () => {},
		report: () => {}
	};
}

async function applyTransform(source, path = 'Demo.svelte') {
	const api = await makeApi();
	const result = transform({ source, path }, api);
	return result ?? source;
}

function normalize(str) {
	return str.replace(/\s+/g, ' ').replace(/\{\s+/g, '{').replace(/\s+\}/g, '}').trim();
}

/** The held-result shape this port documents. */
const HELD = `<script lang="ts">
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

/** Upstream's destructured shape, which a consumer may still have written. */
const DESTRUCTURED = `<script lang="ts">
	import { Table, useTableRowExpansion, useTableRowExpansionState } from '@astryx-svelte/core';

	const { data, expansionConfig } = useTableRowExpansionState(() => ({
		baseData: tree,
		getChildren: (item) => item.children ?? [],
		getRowKey: (item) => item.id,
		expandedKeys,
		setExpandedKeys: (next) => (expandedKeys = next)
	}));

	const expansion = useTableRowExpansion(() => expansionConfig);
</script>

<Table {data} columns={cols} idKey="id" plugins={{ expansion }} />
`;

describe('migrate-table-rowexpansion-to-tree', () => {
	it('rewrites the useTableRowExpansionState import to useTableTreeState', async () => {
		const output = await applyTransform(HELD);
		expect(output).not.toContain('useTableRowExpansionState');
		expect(output).toContain('useTableTreeState');
		expect(output).toContain('useTableTreeData');
	});

	it('maps baseData to data and getChildren to childrenKey', async () => {
		const output = await applyTransform(HELD);
		const n = normalize(output);
		expect(n).toContain('data: tree');
		expect(n).toContain("childrenKey: 'children'");
		expect(output).not.toContain('baseData');
		expect(output).not.toContain('getChildren');
	});

	it('maps getRowKey to idKey preserving the accessor function', async () => {
		const output = await applyTransform(HELD);
		expect(normalize(output)).toContain('idKey: (item) => item.id');
		expect(output).not.toContain('getRowKey');
	});

	it('swaps the useTableRowExpansion plugin call for useTableTreeData', async () => {
		const output = await applyTransform(HELD);
		// The state hook now exposes treeConfig; the plugin consumes it.
		expect(output).toContain('treeConfig');
		expect(output).toContain('useTableTreeData(() => expansionState.treeConfig)');
		expect(output).not.toMatch(/useTableRowExpansion\(/);
	});

	it('maps getIsItemExpandable to isItemExpandable', async () => {
		const input = HELD.replace(
			'getRowKey: (item) => item.id,',
			"getRowKey: (item) => item.id,\n\t\tgetIsItemExpandable: (item) => item.type === 'folder',"
		);
		const output = await applyTransform(input);
		expect(output).toContain('isItemExpandable');
		expect(output).not.toContain('getIsItemExpandable');
	});

	it('leaves the new detail-panel usage (renderExpanded) untouched', async () => {
		const input = `<script lang="ts">
	import { Table, useTableRowExpansion } from '@astryx-svelte/core';

	const expansion = useTableRowExpansion(() => ({
		expandedKeys,
		onToggle,
		getRowKey: (item) => item.id,
		renderExpanded: details
	}));
</script>

{#snippet details(item)}<Details {item} />{/snippet}

<Table data={rows} columns={cols} idKey="id" plugins={{ expansion }} />
`;
		// No useTableRowExpansionState import here, and renderExpanded present:
		// this is the new detail-panel API. The codemod must not touch it.
		expect(await applyTransform(input)).toBe(input);
	});

	it('does not touch files that never imported the row-expansion hooks', async () => {
		const input = `<script lang="ts">
	import { Table, useTableSelection } from '@astryx-svelte/core';
</script>

<Table data={rows} columns={cols} idKey="id" />
`;
		expect(await applyTransform(input)).toBe(input);
	});

	it('emits treeConfig as a shorthand (not treeConfig: treeConfig)', async () => {
		const output = await applyTransform(DESTRUCTURED);
		expect(output).not.toContain('treeConfig: treeConfig');
		expect(normalize(output)).toContain('visibleData: data');
	});

	it('leaves a migration guidance comment about expansion state', async () => {
		const output = await applyTransform(HELD);
		expect(output).toContain('astryx-migration');
		expect(output).toContain('defaultExpandedIds');
	});
});

/**
 * Beyond upstream, and both cases exist because the *input language* changed:
 * upstream's transform only ever sees one file shape, and this one sees two.
 */
describe('migrate-table-rowexpansion-to-tree — Svelte-specific', () => {
	it('rewrites `state.data` reads in the markup, not only in the script', async () => {
		const output = await applyTransform(HELD);
		expect(output).toContain('data={expansionState.visibleData}');
		expect(output).not.toContain('data={expansionState.data}');
	});

	it('rewrites a plain .ts module through the synthetic script wrapper', async () => {
		const input = `import { useTableRowExpansion, useTableRowExpansionState } from '@astryx-svelte/core';

export function makeTree(tree: Node[]) {
	const expansionState = useTableRowExpansionState(() => ({
		baseData: tree,
		getChildren: (item) => item.children ?? [],
		getRowKey: (item) => item.id
	}));
	return useTableRowExpansion(() => expansionState.expansionConfig);
}
`;
		const output = await applyTransform(input, 'tree.ts');
		expect(output).toContain('useTableTreeState');
		expect(output).toContain('useTableTreeData(() => expansionState.treeConfig)');
		expect(output).toContain("childrenKey: 'children'");
		// The wrapper's offset must be subtracted back off: a leaked offset splices
		// 19 characters early and corrupts the import line.
		expect(output.startsWith('import {')).toBe(true);
	});

	it('produces output the runner can still parse', async () => {
		const { parse } = await import('svelte/compiler');
		const output = await applyTransform(HELD);
		expect(() => parse(output, { modern: true })).not.toThrow();
	});
});
