<!--
	Ported from upstream's `templates/blocks/components/Markdown/MarkdownCompactAIResponse.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, Markdown } from '@astryx-svelte/core';

	const content = [
		'## Design Tokens',
		'',
		'Tokens are the **shared language** between design and code.',
		'',
		'```typescript',
		'const tokens = {',
		"  primary: '#0066FF',",
		"  spacing: '8px',",
		'};',
		'```',
		'',
		'- **Composable** — small pieces',
		'- **Accessible** — built-in a11y',
		'',
		'> Opinionated enough for consistency, *flexible* enough for edge cases.'
	].join('\n');
</script>

<Center style="max-width:450px">
	<Markdown density="compact" headingLevelStart={3} children={content} />
</Center>
