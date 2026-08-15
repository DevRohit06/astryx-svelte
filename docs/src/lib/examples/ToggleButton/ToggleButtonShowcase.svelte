<!--
	Ported from upstream's `templates/blocks/components/ToggleButton/ToggleButtonShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, Stack, ToggleButton } from '@astryx-svelte/core';

	/**
	 * Upstream pairs each button's outline Heroicon with its solid counterpart
	 * (`Star`, `Bookmark`, `Bell`/`BellSlash`). The registry ships none of those
	 * pairs, so this substitutes built-ins that still differ between states — the
	 * point the block makes. Retires with the icon registry (port/todo.md).
	 */
	let isFavorited = $state(false);
	let isBookmarked = $state(true);
	let isMuted = $state(false);
</script>

<Stack direction="horizontal" gap={3} vAlign="center">
	<ToggleButton
		label="Favorite"
		isPressed={isFavorited}
		onPressedChange={(pressed) => (isFavorited = pressed)}
		isIconOnly
	>
		{#snippet icon()}<Icon icon="check" />{/snippet}
		{#snippet pressedIcon()}<Icon icon="checkDouble" />{/snippet}
	</ToggleButton>
	<ToggleButton
		label="Bookmark"
		isPressed={isBookmarked}
		onPressedChange={(pressed) => (isBookmarked = pressed)}
		isIconOnly
	>
		{#snippet icon()}<Icon icon="arrowDown" />{/snippet}
		{#snippet pressedIcon()}<Icon icon="arrowUp" />{/snippet}
	</ToggleButton>
	<ToggleButton
		label="Notifications"
		isPressed={isMuted}
		onPressedChange={(pressed) => (isMuted = pressed)}
	>
		{#snippet icon()}<Icon icon="info" />{/snippet}
		{#snippet pressedIcon()}<Icon icon="eyeSlash" />{/snippet}
		Notifications
	</ToggleButton>
</Stack>
