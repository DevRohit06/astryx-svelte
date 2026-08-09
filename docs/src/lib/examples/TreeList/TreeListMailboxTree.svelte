<!--
	Ported from upstream's `templates/blocks/components/TreeList/TreeListMailboxTree.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, TreeList } from '@astryx-svelte/core';

	const noop = () => {};
</script>

{#snippet badgeThree()}<Badge label="3" />{/snippet}
{#snippet badgeOne()}<Badge label="1" />{/snippet}

<TreeList
	items={[
		{
			id: 'inbox',
			label: 'Inbox',
			isExpanded: true,
			endContent: badgeThree,
			children: [
				{ id: 'unread', label: 'Unread', onClick: noop, endContent: badgeThree },
				{ id: 'starred', label: 'Starred', onClick: noop }
			]
		},
		{ id: 'sent', label: 'Sent', onClick: noop },
		{ id: 'drafts', label: 'Drafts', onClick: noop, endContent: badgeOne }
	]}
/>
