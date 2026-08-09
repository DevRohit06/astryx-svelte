<!--
	Ported from upstream's `templates/blocks/components/CheckboxList/CheckboxListWithEndContent.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, CheckboxList, CheckboxListItem } from '@astryx-svelte/core';

	let value = $state<string[]>(['free']);
</script>

{#snippet freeBadge()}<Badge variant="success" label="$0/mo" />{/snippet}
{#snippet proBadge()}<Badge variant="info" label="$9/mo" />{/snippet}
{#snippet enterpriseBadge()}<Badge variant="purple" label="Custom" />{/snippet}

<CheckboxList label="Add-on packages" {value} onChange={(next) => (value = next)} hasDividers>
	<CheckboxListItem
		label="Free tier"
		value="free"
		description="Basic features included"
		endContent={freeBadge}
	/>
	<CheckboxListItem
		label="Pro tier"
		value="pro"
		description="Advanced analytics and integrations"
		endContent={proBadge}
	/>
	<CheckboxListItem
		label="Enterprise"
		value="enterprise"
		description="Custom solutions and dedicated support"
		endContent={enterpriseBadge}
	/>
</CheckboxList>
