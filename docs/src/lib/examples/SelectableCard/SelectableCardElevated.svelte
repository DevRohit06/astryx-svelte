<!--
	Ported from upstream's `templates/blocks/components/Card/SelectableCardElevated.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { SelectableCard, Grid, Text } from '@astryx-svelte/core';

	const PLANS = [
		{ id: 'starter', name: 'Starter' },
		{ id: 'pro', name: 'Pro' }
	];

	let selected = $state('pro');
</script>

<Grid columns={2} gap={3} width={420}>
	{#each PLANS as plan (plan.id)}
		<SelectableCard
			label={plan.name}
			isSelected={selected === plan.id}
			onChange={() => (selected = plan.id)}
			elevation="low"
		>
			<Text type="body" weight="bold">{plan.name}</Text>
			<Text type="supporting" color="secondary">
				The resting shadow stays put — the selection ring layers on top.
			</Text>
		</SelectableCard>
	{/each}
</Grid>
