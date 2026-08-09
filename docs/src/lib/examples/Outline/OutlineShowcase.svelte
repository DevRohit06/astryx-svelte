<!--
	Ported from upstream's `templates/blocks/components/Outline/OutlineShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Outline } from '@astryx-svelte/core';
	import type { OutlineItem } from '@astryx-svelte/core';

	const items: OutlineItem[] = [
		{ id: 'showcase-overview', label: 'Overview', level: 2 },
		{ id: 'showcase-installation', label: 'Installation', level: 2 },
		{ id: 'showcase-theming', label: 'Theming', level: 2 },
		{ id: 'showcase-tokens', label: 'Tokens', level: 3 },
		{ id: 'showcase-accessibility', label: 'Accessibility', level: 2 }
	];
</script>

<div style="width: 240px">
	<Outline {items} activeId="showcase-theming" />
</div>
