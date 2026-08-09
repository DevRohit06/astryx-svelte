<script lang="ts">
	import InputGroup, { type InputGroupProps } from '$lib/components/input-group/input-group.svelte';
	import InputGroupText from '$lib/components/input-group/input-group-text.svelte';
	import Selector, { type SelectorProps } from '$lib/components/selector/selector.svelte';

	/**
	 * Upstream's two `InputGroup integration` cases, whose JSX children a Svelte
	 * case cannot author: `<InputGroupText>#</InputGroupText>` followed by a
	 * hidden-label `Selector label="Channel">`. Group props arrive through
	 * `group`; the selector's own through `selector` — both under their own key
	 * rather than a rest spread, since `SelectorProps` is a discriminated union
	 * that TypeScript will not flatten (see `selector-fixture.svelte`).
	 */
	interface Props {
		group: Omit<InputGroupProps, 'children'>;
		selector: SelectorProps;
	}

	const { group, selector }: Props = $props();
</script>

<InputGroup {...group}>
	<InputGroupText>#</InputGroupText>
	<Selector {...selector} />
</InputGroup>
