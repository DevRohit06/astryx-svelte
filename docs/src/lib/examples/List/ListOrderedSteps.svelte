<!--
	Ported from upstream's `templates/blocks/components/List/ListOrderedSteps.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { List, ListItem } from '@astryx-svelte/core';
</script>

<!--
	The import line's braces are HTML entities: Svelte treats a bare `{` in an
	attribute as the start of an expression, and `{'{'}` — the other escape — is
	a mustache wrapping a literal, which `svelte/no-useless-mustaches` rejects.
	The rendered text is upstream's, character for character.
-->
<List listStyle="decimal">
	<ListItem label="Install the package" description="npm install @astryxdesign/core" />
	<ListItem
		label="Import components"
		description="import &#123; List &#125; from '@astryxdesign/core'"
	/>
	<ListItem label="Start building" description="Use components in your app" />
</List>
