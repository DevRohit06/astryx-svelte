<!--
	Ported from upstream's `templates/blocks/components/ChatToolCalls/ChatToolCallsStatuses.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import type { ChatToolCallItem } from '@astryx-svelte/core';
	import { ChatToolCalls } from '@astryx-svelte/core';

	const calls: ChatToolCallItem[] = [
		{ key: 'pending', name: 'bash', target: 'yarn build', status: 'pending' },
		{ key: 'running', name: 'bash', target: 'yarn test', status: 'running' },
		{
			key: 'complete',
			name: 'edit',
			target: 'src/App.tsx',
			status: 'complete',
			duration: '120ms',
			additions: 8,
			deletions: 2
		},
		{
			key: 'error',
			name: 'bash',
			target: 'yarn lint',
			status: 'error',
			duration: '0.8s',
			errorMessage: '3 lint errors found'
		}
	];
</script>

<ChatToolCalls defaultIsExpanded {calls} />
