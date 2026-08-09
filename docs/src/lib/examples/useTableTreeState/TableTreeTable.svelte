<!--
	Ported from upstream's `templates/blocks/components/Table/TableTreeTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Two translations, both the settled ones for this plugin family:

	- **Both hooks take a getter**, where upstream passes the config object.
	- **The `*State` result is held, not destructured.** Its members are getters,
	  so `const {visibleData} = useTableTreeState(...)` would snapshot the first
	  flatten and the tree would never expand.
-->
<script lang="ts">
	import {
		Table,
		useTableTreeData,
		useTableTreeState,
		proportional,
		pixel
	} from '@astryx-svelte/core';

	interface FileNode extends Record<string, unknown> {
		id: string;
		name: string;
		kind: 'folder' | 'file';
		size: string;
		children?: FileNode[];
	}

	const fileTree: FileNode[] = [
		{
			id: 'src',
			name: 'src',
			kind: 'folder',
			size: '',
			children: [
				{
					id: 'src/components',
					name: 'components',
					kind: 'folder',
					size: '',
					children: [
						{ id: 'src/components/Button.tsx', name: 'Button.tsx', kind: 'file', size: '4.2 KB' },
						{ id: 'src/components/Table.tsx', name: 'Table.tsx', kind: 'file', size: '12.8 KB' }
					]
				},
				{ id: 'src/index.ts', name: 'index.ts', kind: 'file', size: '0.4 KB' }
			]
		},
		{ id: 'package.json', name: 'package.json', kind: 'file', size: '1.8 KB' }
	];

	const columns = [
		{ key: 'name', header: 'Name', width: proportional(2) },
		{ key: 'kind', header: 'Kind', width: pixel(90) },
		{ key: 'size', header: 'Size', width: pixel(90) }
	];

	// useTableTreeState owns the expanded set and flattens the nested data into
	// the visible rows; useTableTreeData draws the indent + expander in the tree
	// column. hasExpandAllControl adds the expand-all toggle to the header.
	const tree = useTableTreeState<FileNode>(() => ({
		data: fileTree,
		idKey: 'id',
		defaultExpandedIds: ['src']
	}));

	const treePlugin = useTableTreeData<FileNode>(() => ({
		...tree.treeConfig,
		hasExpandAllControl: true
	}));
</script>

<Table data={tree.visibleData} {columns} idKey="id" hasHover plugins={{ tree: treePlugin }} />
