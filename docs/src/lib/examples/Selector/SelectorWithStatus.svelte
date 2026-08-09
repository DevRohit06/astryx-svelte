<!--
	Ported from upstream's `templates/blocks/components/Selector/SelectorWithStatus.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Selector, VStack } from '@astryx-svelte/core';

	let value1 = $state<string | undefined>();
	let value2 = $state<string | undefined>('viewer');
	let value3 = $state<string | undefined>('admin');
</script>

<div style="width: 300px">
	<VStack gap={6}>
		<Selector
			label="Role"
			options={[
				{ value: 'admin', label: 'Admin' },
				{ value: 'editor', label: 'Editor' },
				{ value: 'viewer', label: 'Viewer' }
			]}
			value={value1}
			onChange={(next: string) => (value1 = next)}
			placeholder="Choose a role..."
			status={{ type: 'error', message: 'Please select a role' }}
		/>
		<Selector
			label="Role"
			options={[
				{ value: 'admin', label: 'Admin' },
				{ value: 'editor', label: 'Editor' },
				{ value: 'viewer', label: 'Viewer' }
			]}
			value={value2}
			onChange={(next: string) => (value2 = next)}
			status={{ type: 'warning', message: 'Viewer has limited access' }}
		/>
		<Selector
			label="Role"
			options={[
				{ value: 'admin', label: 'Admin' },
				{ value: 'editor', label: 'Editor' },
				{ value: 'viewer', label: 'Viewer' }
			]}
			value={value3}
			onChange={(next: string) => (value3 = next)}
			status={{ type: 'success' }}
		/>
	</VStack>
</div>
