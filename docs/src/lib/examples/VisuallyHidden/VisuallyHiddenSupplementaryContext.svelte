<!--
	Ported from upstream's `templates/blocks/components/VisuallyHidden/VisuallyHiddenSupplementaryContext.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream passes Heroicons' solid `ArrowUp`/`ArrowDown`; the registry's
	`arrowUp`/`arrowDown` are the same glyphs, so these are true matches rather
	than stand-ins and nothing retires with the icon registry.
-->
<script lang="ts">
	import { Card, HStack, Icon, Text, VStack, VisuallyHidden } from '@astryx-svelte/core';

	const stats = [
		{ label: 'Revenue', value: '$48.2k', delta: '+12%', direction: 'up' },
		{ label: 'Churn', value: '2.1%', delta: '-4%', direction: 'down' }
	] as const;
</script>

<HStack gap={4} wrap="wrap">
	{#each stats as { label, value, delta, direction } (label)}
		<Card variant="muted">
			<VStack gap={1}>
				<Text type="supporting" color="secondary">{label}</Text>
				<Text type="display-3">{value}</Text>
				<HStack gap={1} vAlign="center">
					<Icon
						icon={direction === 'up' ? 'arrowUp' : 'arrowDown'}
						size="sm"
						color={direction === 'up' ? 'accent' : 'secondary'}
					/>
					<Text type="body">
						{delta}
						<!-- The arrow is decorative; spell out the trend for AT. -->
						<VisuallyHidden>
							{direction === 'up' ? ' increase' : ' decrease'} from last month
						</VisuallyHidden>
					</Text>
				</HStack>
			</VStack>
		</Card>
	{/each}
</HStack>
