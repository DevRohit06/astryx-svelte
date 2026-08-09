<!--
	Ported from upstream's `templates/blocks/components/RadioList/RadioListPricingTier.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { RadioList, RadioListItem, Text } from '@astryx-svelte/core';

	let value = $state('');
</script>

{#snippet freePrice()}<Text type="body" color="secondary">$0/mo</Text>{/snippet}
{#snippet proPrice()}<Text type="body" color="secondary">$9/mo</Text>{/snippet}
{#snippet enterprisePrice()}<Text type="body" color="secondary">Custom</Text>{/snippet}

<RadioList label="Plan" {value} onChange={(next) => (value = next)}>
	<RadioListItem label="Free" value="free" endContent={freePrice} />
	<RadioListItem label="Pro" value="pro" endContent={proPrice} />
	<RadioListItem label="Enterprise" value="enterprise" endContent={enterprisePrice} />
</RadioList>
