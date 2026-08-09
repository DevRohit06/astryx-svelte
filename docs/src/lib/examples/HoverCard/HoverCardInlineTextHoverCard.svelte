<!--
	Ported from upstream's `templates/blocks/components/HoverCard/HoverCardInlineTextHoverCard.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HoverCard, Text, VStack } from '@astryx-svelte/core';

	/** Upstream's `content` `CSSProperties` object, as a style string. */
	const content = 'max-width: 200px';
</script>

{#snippet focusTrap()}
	<VStack gap={1} style={content}>
		<Text type="label">Focus trap</Text>
		<Text type="body" color="secondary">
			A pattern that keeps keyboard focus inside a container, preventing it from moving to elements
			outside. Used in dialogs and modals to ensure accessibility.
		</Text>
	</VStack>
{/snippet}

{#snippet modalDialog()}
	<VStack gap={1} style={content}>
		<Text type="label">Modal dialog</Text>
		<Text type="body" color="secondary">
			An overlay that blocks interaction with the rest of the page until the user responds. Uses the
			native HTML dialog element for built-in accessibility and backdrop support.
		</Text>
	</VStack>
{/snippet}

<Text type="body">
	The component uses a <HoverCard content={focusTrap} placement="above">focus trap</HoverCard> to keep
	keyboard navigation inside the
	<HoverCard content={modalDialog} placement="above">modal dialog</HoverCard>.
</Text>
