<!--
	Ported from upstream's `assets/templates/pages/blank/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.
-->
<script lang="ts">
	import { Layout, LayoutContent, Text } from '@astryx-svelte/core';
</script>

{#snippet content()}
	<LayoutContent>
		<Text type="large">New Page</Text>
	</LayoutContent>
{/snippet}

<Layout {content} />
