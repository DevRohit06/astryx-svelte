<!--
	Ported from upstream's `templates/blocks/components/SelectableCard/SelectableCardShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Heading, SelectableCard, Stack, Text } from '@astryx-svelte/core';

	const plans = [
		{ id: 'basic', name: 'Basic', price: '$9/mo', desc: 'For individuals' },
		{ id: 'pro', name: 'Pro', price: '$29/mo', desc: 'For small teams' },
		{ id: 'enterprise', name: 'Enterprise', price: '$99/mo', desc: 'For organizations' }
	];

	let selected = $state<string | null>('pro');
</script>

<Stack direction="horizontal" gap={3}>
	{#each plans as plan (plan.id)}
		<SelectableCard
			label={plan.name}
			isSelected={selected === plan.id}
			onChange={() => (selected = plan.id)}
			width={180}
		>
			<Stack direction="vertical" gap={1}>
				<Heading level={4}>{plan.name}</Heading>
				<Text type="large" weight="bold">{plan.price}</Text>
				<Text type="supporting" color="secondary">{plan.desc}</Text>
			</Stack>
		</SelectableCard>
	{/each}
</Stack>
