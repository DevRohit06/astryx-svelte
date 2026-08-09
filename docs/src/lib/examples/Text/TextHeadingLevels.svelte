<!--
	Ported from upstream's `templates/blocks/components/Text/TextHeadingLevels.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Heading, Stack } from '@astryx-svelte/core';

	const LEVELS = [1, 2, 3, 4, 5, 6] as const;
</script>

<Stack direction="vertical" gap={3}>
	{#each LEVELS as level (level)}
		<Heading {level}>Heading {level}</Heading>
	{/each}
</Stack>
