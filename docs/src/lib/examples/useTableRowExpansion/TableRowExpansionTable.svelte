<!--
	Ported from upstream's `templates/blocks/components/Table/TableRowExpansionTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The file tree, the columns and the initially-expanded `src` are upstream's,
	unchanged — including leaving `columns` *unannotated*, as upstream does.
	Four translations:

	- **`useState` → `$state`.** `useState<Set<string>>(new Set(['src']))` becomes
	  `$state(new Set(['src']))`; the `Set` is a plain one and reassignment is the
	  reactive boundary.
	- **`setExpandedKeys` is a plain setter.** Upstream hands React's
	  `Dispatch<SetStateAction<Set<string>>>` straight to the hook; the ported
	  config takes `(next: Set<string>) => void`, because the updater form exists
	  only to guard against a batched React setter reading stale state and a
	  `$state` read never is.
	- **Both hooks take a getter**, where upstream passes the config object.
	- **The state result is *not* destructured.** Upstream writes
	  `const {data, expansionConfig} = useTableRowExpansionState(…)`, which is safe
	  because React returns a fresh object every render. Here the hook returns one
	  object for the component's lifetime and exposes `data` as a **getter** over a
	  `$derived`, so destructuring would snapshot the first flattening and the tree
	  would never expand. The result is held as `expansionState` and read through —
	  `expansionState`, not `state`, because a local named `state` shadows the
	  `$state` rune.

	No icon substitutions: the expand/collapse chevron is the plugin's own chrome.
-->
<script lang="ts">
	import {
		Table,
		pixel,
		proportional,
		useTableRowExpansion,
		useTableRowExpansionState
	} from '@astryx-svelte/core';

	interface FileNode extends Record<string, unknown> {
		id: string;
		name: string;
		type: 'folder' | 'file';
		size: string;
		children?: FileNode[];
	}

	const fileTree: FileNode[] = [
		{
			id: 'src',
			name: 'src',
			type: 'folder',
			size: '—',
			children: [
				{
					id: 'src/components',
					name: 'components',
					type: 'folder',
					size: '—',
					children: [
						{
							id: 'src/components/Button.tsx',
							name: 'Button.tsx',
							type: 'file',
							size: '4.2 KB',
							children: []
						},
						{
							id: 'src/components/Table.tsx',
							name: 'Table.tsx',
							type: 'file',
							size: '12.8 KB',
							children: []
						}
					]
				},
				{
					id: 'src/index.ts',
					name: 'index.ts',
					type: 'file',
					size: '0.4 KB',
					children: []
				}
			]
		},
		{
			id: 'package.json',
			name: 'package.json',
			type: 'file',
			size: '1.8 KB',
			children: []
		}
	];

	const columns = [
		{ key: 'name', header: 'Name', width: proportional(2) },
		{ key: 'type', header: 'Type', width: pixel(80) },
		{ key: 'size', header: 'Size', width: pixel(90) }
	];

	let expandedKeys = $state(new Set(['src']));

	// Held, not destructured — see the header comment.
	const expansionState = useTableRowExpansionState<FileNode>(() => ({
		baseData: fileTree,
		getChildren: (item) => item.children ?? [],
		getRowKey: (item) => item.id,
		expandedKeys,
		setExpandedKeys: (next) => (expandedKeys = next)
	}));

	const expansion = useTableRowExpansion(() => expansionState.expansionConfig);
</script>

<Table data={expansionState.data} {columns} idKey="id" hasHover plugins={{ expansion }} />
