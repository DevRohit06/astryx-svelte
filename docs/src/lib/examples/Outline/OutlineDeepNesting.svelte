<!--
	Ported from upstream's `templates/blocks/components/Outline/OutlineDeepNesting.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Outline } from '@astryx-svelte/core';
	import type { OutlineItem } from '@astryx-svelte/core';

	const items: OutlineItem[] = [
		{ id: 'deep-introduction', label: 'Introduction', level: 1 },
		{ id: 'deep-concepts', label: 'Core concepts', level: 2 },
		{ id: 'deep-tokens', label: 'Tokens', level: 3 },
		{ id: 'deep-color', label: 'Color', level: 4 },
		{ id: 'deep-spacing', label: 'Spacing', level: 4 },
		{ id: 'deep-components', label: 'Components', level: 2 },
		{ id: 'deep-primitives', label: 'Primitives', level: 3 },
		{ id: 'deep-patterns', label: 'Patterns', level: 3 },
		{ id: 'deep-resources', label: 'Resources', level: 1 }
	];
</script>

<div style="width: 240px">
	<Outline {items} activeId="deep-color" />
</div>
