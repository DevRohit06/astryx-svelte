<!--
	Ported from upstream's `templates/blocks/components/ToggleButton/ToggleButtonStates.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, Stack, Text, ToggleButton } from '@astryx-svelte/core';

	/**
	 * Upstream pairs Heroicons' outline `Star` with its solid twin. The registry
	 * ships no such pair, so this substitutes built-ins that still differ between
	 * states. Retires with the icon registry (TODO.md).
	 */
</script>

{#snippet starOutline()}<Icon icon="check" />{/snippet}
{#snippet starSolid()}<Icon icon="checkDouble" />{/snippet}

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Default</Text>
		<Stack direction="horizontal" gap={3} vAlign="center">
			<ToggleButton
				label="Favorite"
				icon={starOutline}
				pressedIcon={starSolid}
				isPressed={false}
				onPressedChange={() => {}}
			/>
			<ToggleButton
				label="Favorite"
				icon={starOutline}
				pressedIcon={starSolid}
				isPressed={false}
				onPressedChange={() => {}}
				isIconOnly
			/>
		</Stack>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Pressed</Text>
		<Stack direction="horizontal" gap={3} vAlign="center">
			<ToggleButton
				label="Favorite"
				icon={starOutline}
				pressedIcon={starSolid}
				isPressed={true}
				onPressedChange={() => {}}
			/>
			<ToggleButton
				label="Favorite"
				icon={starOutline}
				pressedIcon={starSolid}
				isPressed={true}
				onPressedChange={() => {}}
				isIconOnly
			/>
		</Stack>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Disabled</Text>
		<Stack direction="horizontal" gap={3} vAlign="center">
			<ToggleButton
				label="Favorite"
				icon={starOutline}
				isPressed={false}
				onPressedChange={() => {}}
				isDisabled
			/>
			<ToggleButton
				label="Favorite"
				icon={starOutline}
				isPressed={false}
				onPressedChange={() => {}}
				isIconOnly
				isDisabled
			/>
		</Stack>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Loading</Text>
		<Stack direction="horizontal" gap={3} vAlign="center">
			<ToggleButton
				label="Favorite"
				icon={starOutline}
				isPressed={false}
				onPressedChange={() => {}}
				isLoading
			/>
			<ToggleButton
				label="Favorite"
				icon={starOutline}
				isPressed={false}
				onPressedChange={() => {}}
				isIconOnly
				isLoading
			/>
		</Stack>
	</Stack>
</Stack>
