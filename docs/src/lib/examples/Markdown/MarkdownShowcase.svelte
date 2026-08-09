<!--
	Ported from upstream's `templates/blocks/components/Markdown/MarkdownShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, Markdown } from '@astryx-svelte/core';

	const content = [
		'# Markdown Demo',
		'',
		'Renders **markdown** with *design-system-consistent* styling.',
		'',
		'## Features',
		'',
		'- Headings mapped to the Astryx type scale',
		'- **Bold**, *italic*, and ~~strikethrough~~ text',
		'- [Links](https://example.com) with external detection',
		'',
		'> Block quote indented text'
	].join('\n');
</script>

<Center width={400}>
	<Markdown children={content} />
</Center>
