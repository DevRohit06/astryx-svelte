<!--
	Ported from upstream's `templates/blocks/components/Citation/CitationInlineText.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Citation, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={4} style="max-width: 560px">
	<Text type="body">
		React uses a virtual DOM to minimize expensive DOM operations<Citation
			source={{ title: 'React Documentation', url: 'https://react.dev' }}
			number={1}
			variant="number"
		/>. This approach was inspired by earlier functional UI frameworks<Citation
			source={{ title: 'Elm Architecture', url: 'https://guide.elm-lang.org/architecture/' }}
			number={2}
			variant="number"
		/>.
	</Text>
	<Text type="body">
		TypeScript adds static types to JavaScript for safer refactoring<Citation
			source={{
				title: 'TypeScript Documentation',
				url: 'https://www.typescriptlang.org',
				icon: 'https://www.typescriptlang.org/favicon-32x32.png'
			}}
			number={3}
			variant="label"
		/>.
	</Text>
</Stack>
