<!--
	Ported from upstream's `templates/blocks/components/Markdown/MarkdownDataTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, Markdown } from '@astryx-svelte/core';

	const content = [
		'## Comparison Table',
		'',
		'| Feature | React | Vue | Svelte |',
		'|:--------|:-----:|:---:|-------:|',
		'| Virtual DOM | Yes | Yes | No |',
		'| Bundle Size | ~40KB | ~30KB | ~2KB |',
		'| TypeScript | Native | Plugin | Native |',
		'| Learning Curve | Medium | Easy | Easy |'
	].join('\n');
</script>

<Center width="100%" style="max-width:450px">
	<Markdown children={content} />
</Center>
