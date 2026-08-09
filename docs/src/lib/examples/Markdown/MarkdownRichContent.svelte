<!--
	Ported from upstream's `templates/blocks/components/Markdown/MarkdownRichContent.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, Markdown } from '@astryx-svelte/core';

	const content = [
		'# Markdown Demo',
		'',
		'Renders **markdown** with *Astryx* styling.',
		'',
		'## Features',
		'',
		'- **Bold**, *italic*, `code`',
		'- [Links](https://example.com)',
		'',
		'```typescript',
		'interface User {name: string;}',
		'```',
		'',
		'- [x] Parser',
		'- [ ] Stories'
	].join('\n');
</script>

<Center width="100%" style="max-width:450px">
	<Markdown children={content} />
</Center>
