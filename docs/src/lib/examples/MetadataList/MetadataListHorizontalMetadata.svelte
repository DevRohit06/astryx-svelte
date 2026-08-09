<!--
	Ported from upstream's `templates/blocks/components/MetadataList/MetadataListHorizontalMetadata.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { MetadataList, MetadataListItem } from '@astryx-svelte/core';
</script>

<MetadataList orientation="horizontal">
	<MetadataListItem label="Status">Active</MetadataListItem>
	<MetadataListItem label="Type">Premium</MetadataListItem>
	<MetadataListItem label="Owner">Joey</MetadataListItem>
	<MetadataListItem label="Created">Jan 15, 2026</MetadataListItem>
</MetadataList>
