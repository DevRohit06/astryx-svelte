<!--
	Ported from upstream's `templates/blocks/components/TreeList/TreeListVariants.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { TreeList, Stack, Text } from '@astryx-svelte/core';
	import type { TreeListItemData } from '@astryx-svelte/core';

	const noop = () => {};

	const items: TreeListItemData[] = [
		{
			id: 'src',
			label: 'src',
			isExpanded: true,
			children: [
				{
					id: 'components',
					label: 'components',
					isExpanded: true,
					children: [
						{ id: 'button', label: 'Button.tsx', onClick: noop },
						{ id: 'card', label: 'Card.tsx', onClick: noop }
					]
				},
				{ id: 'app', label: 'App.tsx', onClick: noop }
			]
		},
		{ id: 'readme', label: 'README.md', onClick: noop }
	];
</script>

<Stack direction="horizontal" gap={6} hAlign="start" vAlign="start" wrap="wrap">
	<Stack direction="vertical" gap={2}>
		<Text type="supporting" color="secondary" weight="bold">lineGuides (default)</Text>
		<TreeList {items} variant="lineGuides" />
	</Stack>
	<Stack direction="vertical" gap={2}>
		<Text type="supporting" color="secondary" weight="bold">noGuides</Text>
		<TreeList {items} variant="noGuides" />
	</Stack>
</Stack>
