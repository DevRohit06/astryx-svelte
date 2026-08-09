<!--
	Ported from upstream's `templates/blocks/components/ChatToolCalls/ChatToolCallsToolCallsWithNodes.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream's default export is named `ChatToolCallsSimple` while the file and
	the block are `ChatToolCallsWithNodes` — kept as-is, since the block name is
	what the registry keys on and a Svelte component takes its name from the file.
-->
<script lang="ts">
	import type { ChatToolCallItem } from '@astryx-svelte/core';
	import { ChatToolCalls, Stack } from '@astryx-svelte/core';

	const singleCall: ChatToolCallItem[] = [
		{ name: 'bash', target: 'git status', status: 'complete', duration: '1.2s' }
	];

	const groupedCalls: ChatToolCallItem[] = [
		{ name: 'read', target: 'src/components/DataGrid.tsx', status: 'complete', duration: '30ms' },
		{
			name: 'edit',
			target: 'src/components/DataGrid.tsx',
			status: 'complete',
			duration: '85ms',
			additions: 24,
			deletions: 8
		},
		{
			name: 'edit',
			target: 'src/components/DataGrid.test.tsx',
			status: 'complete',
			duration: '60ms',
			additions: 45
		}
	];
</script>

<Stack direction="vertical" gap={4}>
	<ChatToolCalls calls={singleCall} />
	<ChatToolCalls defaultIsExpanded calls={groupedCalls} />
</Stack>
