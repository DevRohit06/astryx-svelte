<!--
	Ported from upstream's `templates/blocks/components/HoverCard/HoverCardProfileHoverCard.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Avatar,
		Button,
		Heading,
		HoverCard,
		HStack,
		Icon,
		Text,
		VStack
	} from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `CalendarIcon`; the registry ships `calendar`, so
	 * this is a direct swap rather than an approximation.
	 */
</script>

<HoverCard placement="below">
	{#snippet content()}
		<HStack gap={3} vAlign="start" style="max-width: 280px">
			<Avatar name="Jane Doe" size={48} style="flex-shrink: 0" />
			<VStack gap={1}>
				<Heading level={3}>@janedoe</Heading>
				<Text type="body" color="secondary">
					Crafting accessible, scalable design systems for modern teams.
				</Text>
				<HStack gap={1} vAlign="center">
					<Icon icon="calendar" size="xsm" color="secondary" />
					<Text type="supporting" color="secondary">March 2024</Text>
				</HStack>
			</VStack>
		</HStack>
	{/snippet}
	<Button label="@janedoe" variant="ghost" />
</HoverCard>
