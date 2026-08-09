<!--
	Ported from upstream's `templates/blocks/components/MetadataList/MetadataListCollapsibleMetadata.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { MetadataList, MetadataListItem } from '@astryx-svelte/core';
</script>

<MetadataList maxNumOfItems={3}>
	<MetadataListItem label="Name">MetadataList</MetadataListItem>
	<MetadataListItem label="Status">Active</MetadataListItem>
	<MetadataListItem label="Owner">Joey</MetadataListItem>
	<MetadataListItem label="Created">Jan 15, 2026</MetadataListItem>
	<MetadataListItem label="Updated">Mar 26, 2026</MetadataListItem>
	<MetadataListItem label="Priority">Tier 1</MetadataListItem>
</MetadataList>
