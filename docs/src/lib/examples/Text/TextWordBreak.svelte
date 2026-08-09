<!--
	Ported from upstream's `templates/blocks/components/Text/TextWordBreak.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Text } from '@astryx-svelte/core';
</script>

<div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px">
	<div>
		<Text type="label" display="block">Break-word (default for multi-line)</Text>
		<div style="width: 200px; border: 1px solid #ccc; padding: 8px">
			<Text type="body" maxLines={2} wordBreak="break-word">
				This is a verylongunbreakableword for a break-word example
			</Text>
		</div>
	</div>
	<div>
		<Text type="label" display="block">Break-all (default for single-line)</Text>
		<div style="width: 200px; border: 1px solid #ccc; padding: 8px">
			<Text type="body" maxLines={2} wordBreak="break-all">
				Breaks anywhere: abcdefghijklmnopqrstuvwxyz0123456789
			</Text>
		</div>
	</div>
</div>
