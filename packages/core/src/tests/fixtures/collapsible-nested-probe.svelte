<script lang="ts">
	import CollapsibleGroup from '$lib/components/collapsible/collapsible-group.svelte';
	import Collapsible from '$lib/components/collapsible/collapsible.svelte';

	/**
	 * A divider group whose single item nests a plain `Collapsible` in its content,
	 * for upstream's "does not leak divider chrome into nested collapsibles" case.
	 * The outer item draws the group's row chrome; the nested one must not — its
	 * parent resets the presentation context to null for its children.
	 */
	let { ...rest }: Record<string, unknown> = $props();
</script>

<CollapsibleGroup hasDividers {...rest}>
	<Collapsible trigger="Outer" value="outer">
		<Collapsible trigger="Nested">
			<p>Nested content</p>
		</Collapsible>
	</Collapsible>
</CollapsibleGroup>
