<script lang="ts">
	import CollapsibleGroup from '$lib/components/collapsible/collapsible-group.svelte';
	import Collapsible from '$lib/components/collapsible/collapsible.svelte';

	/**
	 * A divider group whose item contains two nested groups — one divided+compact,
	 * one plain — for upstream's "lets a nested group define its own chrome instead
	 * of inheriting" case. Each nested group establishes its own presentation
	 * context, so its items ignore the outer group's chrome.
	 */
</script>

<CollapsibleGroup hasDividers defaultValue="outer">
	<Collapsible trigger="Outer" value="outer">
		<CollapsibleGroup type="multiple" hasDividers density="compact">
			<Collapsible trigger="Inner divided" value="in-a">
				<p>Inner content</p>
			</Collapsible>
		</CollapsibleGroup>
		<CollapsibleGroup type="multiple">
			<Collapsible trigger="Inner plain" value="in-b">
				<p>Inner content</p>
			</Collapsible>
		</CollapsibleGroup>
	</Collapsible>
</CollapsibleGroup>
