<!--
	Ported from upstream's `templates/blocks/components/MetadataListItem/MetadataListItemShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Link, MetadataList, MetadataListItem } from '@astryx-svelte/core';
</script>

<!-- `title` is a snippet here, against upstream's `ReactNode`. -->
<MetadataList>
	{#snippet title()}Project Details{/snippet}
	<MetadataListItem label="Name">Design System v2</MetadataListItem>
	<MetadataListItem label="Status">
		<Badge label="Active" variant="green" />
	</MetadataListItem>
	<MetadataListItem label="Owner">
		<Link href="#">Alice Johnson</Link>
	</MetadataListItem>
	<MetadataListItem label="Created">January 15, 2025</MetadataListItem>
	<MetadataListItem label="Priority">
		<Badge label="High" variant="red" />
	</MetadataListItem>
	<MetadataListItem label="Repository">
		<Link href="#">github.com/org/design-system</Link>
	</MetadataListItem>
</MetadataList>
