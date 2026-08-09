<!--
	Ported from upstream's `templates/blocks/components/Code/CodeInlineInParagraph.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Code, Text } from '@astryx-svelte/core';

	/**
	 * Upstream's JSX omits the space after two of the three `</Code>` tags, so it
	 * renders "`useState`for local state". Not replicated — an upstream typo is a
	 * defect to document, not to copy (TODO.md records it).
	 */
</script>

<Text type="body" style="max-width: 400px">
	Use <Code>useState</Code> for local state and <Code>useEffect</Code> for side effects. If you need shared
	state across components, consider <Code>useContext</Code> or a state management library.
</Text>
