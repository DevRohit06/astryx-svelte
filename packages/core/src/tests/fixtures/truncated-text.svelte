<script lang="ts">
	import Heading from '$lib/components/heading/heading.svelte';
	import Text from '$lib/components/text/text.svelte';

	/**
	 * `Text` and `Heading` take their content as a snippet, so upstream's inline
	 * children need a fixture. `as` picks which of the two is under test — their
	 * truncation-tooltip code is the same shape in both files.
	 */
	const {
		as = 'text',
		maxLines,
		hasTruncateTooltip,
		content
	}: {
		as?: 'text' | 'heading';
		maxLines?: number;
		hasTruncateTooltip?: boolean;
		content: string;
	} = $props();
</script>

{#if as === 'heading'}
	<Heading level={1} {maxLines} {hasTruncateTooltip}>{content}</Heading>
{:else}
	<Text type="body" {maxLines} {hasTruncateTooltip}>{content}</Text>
{/if}
