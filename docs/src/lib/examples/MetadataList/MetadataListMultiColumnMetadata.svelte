<!--
	Ported from upstream's `templates/blocks/components/MetadataList/MetadataListMultiColumnMetadata.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, MetadataList, MetadataListItem, Token } from '@astryx-svelte/core';
</script>

<MetadataList columns="multi">
	<MetadataListItem label="Name">MetadataList</MetadataListItem>
	<MetadataListItem label="Status">Active</MetadataListItem>
	<MetadataListItem label="Owner">Joey</MetadataListItem>
	<MetadataListItem label="Created">Jan 15, 2026</MetadataListItem>
	<MetadataListItem label="Tags">
		<HStack gap={1}>
			<Token label="component" />
			<Token label="xds" />
		</HStack>
	</MetadataListItem>
	<MetadataListItem label="Priority">Tier 1</MetadataListItem>
</MetadataList>
