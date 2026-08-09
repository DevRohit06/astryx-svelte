<!--
	Ported from upstream's `templates/blocks/components/Card/SelectableCardMulti.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Grid, SelectableCard, Text } from '@astryx-svelte/core';
	import { SvelteSet } from 'svelte/reactivity';

	const tags = [
		{ id: 'react', name: 'React', variant: 'blue' },
		{ id: 'typescript', name: 'TypeScript', variant: 'cyan' },
		{ id: 'node', name: 'Node.js', variant: 'green' },
		{ id: 'python', name: 'Python', variant: 'yellow' },
		{ id: 'rust', name: 'Rust', variant: 'orange' },
		{ id: 'go', name: 'Go', variant: 'teal' }
	] as const;

	/**
	 * Upstream keeps a `Set` in `useState` and clones it on every change, because
	 * React needs a new reference to re-render. A `SvelteSet` is reactive in
	 * place, so the clone goes and the mutation is direct.
	 */
	let selected = new SvelteSet(['react', 'typescript']);
</script>

<Grid columns={3} gap={2} width={400}>
	{#each tags as tag (tag.id)}
		<SelectableCard
			label={tag.name}
			isSelected={selected.has(tag.id)}
			variant={tag.variant}
			onChange={(isNow) => {
				if (isNow) {
					selected.add(tag.id);
				} else {
					selected.delete(tag.id);
				}
			}}
		>
			<Text type="body" weight="bold">{tag.name}</Text>
		</SelectableCard>
	{/each}
</Grid>
