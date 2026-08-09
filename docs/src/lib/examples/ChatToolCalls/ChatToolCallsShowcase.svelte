<!--
	Ported from upstream's `templates/blocks/components/ChatToolCalls/ChatToolCallsShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import type { ChatToolCallItem } from '@astryx-svelte/core';
	import { ChatToolCalls } from '@astryx-svelte/core';

	const calls: ChatToolCallItem[] = [
		{ name: 'bash', target: 'git diff --stat', status: 'complete', duration: '340ms' },
		{ name: 'read', target: 'src/utils/formatDate.ts', status: 'complete', duration: '45ms' },
		{
			name: 'edit',
			target: 'src/utils/formatDate.ts',
			status: 'complete',
			duration: '120ms',
			additions: 12,
			deletions: 3
		}
	];
</script>

<ChatToolCalls defaultIsExpanded {calls} />
