<!--
	Ported from upstream's `templates/blocks/components/MultiSelector/MultiSelectorSectionedMultiSelector.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { MultiSelector } from '@astryx-svelte/core';

	let value = $state<string[]>([]);
</script>

<div style="width: 300px">
	<MultiSelector
		label="Permissions"
		options={[
			{
				type: 'section',
				title: 'Read',
				options: [
					{ value: 'read_posts', label: 'Read posts' },
					{ value: 'read_comments', label: 'Read comments' },
					{ value: 'read_users', label: 'Read users' }
				]
			},
			{
				type: 'section',
				title: 'Write',
				options: [
					{ value: 'write_posts', label: 'Write posts' },
					{ value: 'write_comments', label: 'Write comments' }
				]
			}
		]}
		{value}
		onChange={(next) => (value = next)}
		placeholder="Select permissions..."
	/>
</div>
