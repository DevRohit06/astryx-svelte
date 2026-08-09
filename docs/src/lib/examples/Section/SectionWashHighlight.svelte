<!--
	Ported from upstream's `templates/blocks/components/Section/SectionWashHighlight.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Icon, Section, Stack, Text } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' solid `CheckIcon`; the registry ships `check`, so
	 * this is a direct swap rather than an approximation.
	 */
	const FEATURES = [
		'10 team members',
		'Unlimited projects',
		'Priority support',
		'Advanced analytics'
	];
</script>

<Stack direction="vertical" gap={2}>
	<Section variant="section" padding={4}>
		<Stack direction="vertical" gap={3} hAlign="center">
			<Stack direction="vertical" gap={1} hAlign="center">
				<Text type="display-3">Pro Plan</Text>
				<Text type="body" color="secondary">Everything you need to scale your team.</Text>
			</Stack>
			<Stack direction="vertical" gap={2}>
				{#each FEATURES as feature (feature)}
					<Stack direction="horizontal" gap={2} vAlign="center">
						<Icon icon="check" size="sm" />
						<Text type="body">{feature}</Text>
					</Stack>
				{/each}
			</Stack>
		</Stack>
	</Section>
	<Section variant="muted" padding={6}>
		<Stack direction="vertical" gap={2} hAlign="center">
			<Stack direction="horizontal" gap={2} vAlign="center">
				<Text type="display-3">$49</Text>
				<Text type="supporting" color="secondary">/ month</Text>
			</Stack>
			<Button label="Upgrade" variant="primary" />
		</Stack>
	</Section>
</Stack>
