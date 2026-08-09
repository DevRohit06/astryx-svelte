<!--
	Ported from upstream's `templates/blocks/components/HoverCard/HoverCardHookUsage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Center, HoverCardLayer, Text, useHoverCard, VStack } from '@astryx-svelte/core';

	/**
	 * The same three translations `TooltipHookUsage` records, for the same
	 * reasons: options arrive as a getter, upstream's `renderHoverCard(…)` is a
	 * `<HoverCardLayer>` component (a Svelte hook cannot return markup), and its
	 * `ref` is `attachTrigger`. `id` is required here and absent upstream —
	 * `useLayer` cannot mint an SSR-stable id from inside a hook.
	 */
	const id = $props.id();

	const hoverCard = useHoverCard(() => ({
		id,
		placement: 'below',
		delay: 100,
		isDefaultOpen: true
	}));
</script>

<Center height={220}>
	<Button
		label="Hover profile"
		aria-describedby={hoverCard.describedBy}
		{@attach hoverCard.attachTrigger}
	/>
	<HoverCardLayer {hoverCard} placement="below" alignment="center">
		<VStack gap={1}>
			<Text type="body" weight="bold">Alex Morgan</Text>
			<Text type="body" color="secondary">Staff designer · Product systems</Text>
			<Text type="body" color="secondary">
				Owns interaction patterns for overlays and navigation.
			</Text>
		</VStack>
	</HoverCardLayer>
</Center>
