<!--
	Ported from upstream's `templates/blocks/components/ToggleButton/ToggleButtonGroup.tsx`
	(the block is filed under `ToggleButton/` upstream and reaches this page through
	`alsoExampleFor`).
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, Stack, Text, ToggleButton, ToggleButtonGroup } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `ListBullet`/`Squares2X2`/`TableCells` and
	 * `Bold`/`Italic`/`Underline`/`Strikethrough`. The registry ships none of
	 * those, so each substitutes a built-in that still differs from its siblings —
	 * the group is about selection, and the icons only have to stay
	 * distinguishable. Retires with the icon registry (TODO.md).
	 */

	let view = $state<string | null>('list');
	let formats = $state<string[]>(['bold']);
</script>

{#snippet listIcon()}<Icon icon="menu" />{/snippet}
{#snippet gridIcon()}<Icon icon="viewColumns" />{/snippet}
{#snippet tableIcon()}<Icon icon="copy" />{/snippet}
{#snippet boldIcon()}<Icon icon="check" />{/snippet}
{#snippet italicIcon()}<Icon icon="info" />{/snippet}
{#snippet underlineIcon()}<Icon icon="arrowDown" />{/snippet}
{#snippet strikethroughIcon()}<Icon icon="close" />{/snippet}

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Single selection</Text>
		<ToggleButtonGroup
			value={view}
			onChange={(next: string | null) => (view = next)}
			label="View mode"
		>
			<ToggleButton value="list" label="List view" icon={listIcon} isIconOnly />
			<ToggleButton value="grid" label="Grid view" icon={gridIcon} isIconOnly />
			<ToggleButton value="table" label="Table view" icon={tableIcon} isIconOnly />
		</ToggleButtonGroup>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Multiple selections</Text>
		<ToggleButtonGroup
			type="multiple"
			value={formats}
			onChange={(next) => (formats = next)}
			label="Text formatting"
		>
			<ToggleButton value="bold" label="Bold" icon={boldIcon} isIconOnly />
			<ToggleButton value="italic" label="Italic" icon={italicIcon} isIconOnly />
			<ToggleButton value="underline" label="Underline" icon={underlineIcon} isIconOnly />
			<ToggleButton
				value="strikethrough"
				label="Strikethrough"
				icon={strikethroughIcon}
				isIconOnly
			/>
		</ToggleButtonGroup>
	</Stack>
</Stack>
