<!--
	Ported from upstream's `templates/blocks/components/MetadataListItem/MetadataListItemBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, MetadataList, MetadataListItem } from '@astryx-svelte/core';
</script>

<!-- `title` is a snippet here, against upstream's `ReactNode`. -->
<MetadataList>
	{#snippet title()}Deployment{/snippet}
	<MetadataListItem label="Environment">Production</MetadataListItem>
	<MetadataListItem label="Status">
		<Badge label="Healthy" variant="green" />
	</MetadataListItem>
	<MetadataListItem label="Version">v2.14.0</MetadataListItem>
	<MetadataListItem label="Last deployed">June 12, 2026</MetadataListItem>
</MetadataList>
