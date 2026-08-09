<!--
	Ported from upstream's `templates/blocks/components/ToggleButton/ToggleButtonIconSwap.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, Stack, Text, ToggleButton } from '@astryx-svelte/core';

	/**
	 * Upstream swaps each outline Heroicon for its solid twin (`Star`, `Bookmark`)
	 * and `Bell` for `BellSlash`. The registry ships no outline/solid pairs, so
	 * this substitutes built-ins that still *differ* between states — which is the
	 * point the block makes. Retires with the icon registry (TODO.md).
	 */

	let isFavorited = $state(false);
	let isBookmarked = $state(true);
	let isMuted = $state(false);
</script>

<Stack direction="vertical" gap={4}>
	<Text type="supporting" color="secondary">Outline → solid icon swap on press</Text>
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
			label={isMuted ? 'Unmute notifications' : 'Mute notifications'}
			isPressed={isMuted}
			onPressedChange={(pressed) => (isMuted = pressed)}
			isIconOnly
		>
			{#snippet icon()}<Icon icon="info" />{/snippet}
			{#snippet pressedIcon()}<Icon icon="eyeSlash" />{/snippet}
		</ToggleButton>
	</Stack>
</Stack>
