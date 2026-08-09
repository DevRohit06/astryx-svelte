<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { LinkComponentType } from './types.js';

	export interface LinkElementProps {
		/** The resolved link component — a string tag or a Svelte component. */
		component: LinkComponentType;
		/** Attributes/props to spread onto it (including a `to` alias when needed). */
		props: Record<string, unknown>;
		children: Snippet;
	}
</script>

<script lang="ts">
	/**
	 * Internal — renders a resolved {@link LinkComponentType} polymorphically.
	 *
	 * React folds this into a single `<LinkComponent {...} />` because JSX treats
	 * a string tag and a component reference identically. Svelte cannot: a string
	 * tag needs `<svelte:element>` and a component needs dynamic-component syntax,
	 * so the branch is explicit. Not exported — `Link` and `Item` compose it.
	 */
	let { component, props, children }: LinkElementProps = $props();
</script>

{#if typeof component === 'string'}
	<svelte:element this={component} {...props}>{@render children()}</svelte:element>
{:else}
	{@const Component = component}
	<Component {...props}>{@render children()}</Component>
{/if}
