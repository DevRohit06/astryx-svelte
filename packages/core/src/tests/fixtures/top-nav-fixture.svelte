<script lang="ts" module>
	import type { TopNavItemProps } from '$lib/components/top-nav/top-nav-item.svelte';
	import type { TopNavRenderMode } from '$lib/components/top-nav/top-nav-render-context.svelte.js';

	/** One `TopNav` slot: a tagged `<span>`, or a row of `TopNavItem`s. */
	export interface TopNavSlotSpec {
		/** Text of the `<span>` the slot renders. */
		text?: string;
		/** `data-testid` on that span. */
		testid?: string;
		/** Renders one `<TopNavItem>` per entry instead of the span. */
		items?: TopNavItemProps[];
	}
</script>

<script lang="ts">
	import TopNav from '$lib/components/top-nav/top-nav.svelte';
	import TopNavItem from '$lib/components/top-nav/top-nav-item.svelte';
	import TopNavRenderScope from '$lib/components/top-nav/top-nav-render-scope.svelte';

	/**
	 * `<TopNav>` with its five slots driven by data.
	 *
	 * Upstream writes each slot inline as JSX (`heading={<span
	 * data-testid="title">Title</span>}`). A Svelte snippet can only be authored in
	 * a template, so the slots become specs and this fixture is the template that
	 * turns each one back into markup — the same move `tab-list-fixture` makes.
	 *
	 * `mode` stands in for upstream's `<TopNavRenderContext value="mobile-bar">`
	 * wrapper: the context object is public on both sides, but React scopes it with
	 * an element and Svelte needs a component boundary, which `TopNavRenderScope`
	 * is.
	 *
	 * `body` fills `children` — `TopNav`'s alias for `startContent` — because
	 * `children` on the *fixture* would be a snippet from the caller, and a test
	 * cannot author one.
	 */
	interface Props {
		/** Publishes `TopNavRenderContext` above the bar. */
		mode?: TopNavRenderMode;
		/** Props for `<TopNav>` itself — `label`, `data-testid`, an attachment. */
		nav?: Record<string, unknown>;
		heading?: TopNavSlotSpec;
		startContent?: TopNavSlotSpec;
		/** Fills `children`, the `startContent` alias. */
		body?: TopNavSlotSpec;
		centerContent?: TopNavSlotSpec;
		endContent?: TopNavSlotSpec;
	}

	const {
		mode,
		nav = {},
		heading,
		startContent,
		body,
		centerContent,
		endContent
	}: Props = $props();
</script>

{#snippet slotContent(entry: TopNavSlotSpec)}
	{#if entry.items}
		{#each entry.items as item, i (i)}
			<TopNavItem {...item} />
		{/each}
	{:else}
		<span data-testid={entry.testid}>{entry.text}</span>
	{/if}
{/snippet}

{#snippet headingSlot()}
	{#if heading}{@render slotContent(heading)}{/if}
{/snippet}

{#snippet startSlot()}
	{#if startContent}{@render slotContent(startContent)}{/if}
{/snippet}

{#snippet bodySlot()}
	{#if body}{@render slotContent(body)}{/if}
{/snippet}

{#snippet centerSlot()}
	{#if centerContent}{@render slotContent(centerContent)}{/if}
{/snippet}

{#snippet endSlot()}
	{#if endContent}{@render slotContent(endContent)}{/if}
{/snippet}

{#snippet bar()}
	<TopNav
		{...nav}
		heading={heading ? headingSlot : undefined}
		startContent={startContent ? startSlot : undefined}
		children={body ? bodySlot : undefined}
		centerContent={centerContent ? centerSlot : undefined}
		endContent={endContent ? endSlot : undefined}
	/>
{/snippet}

{#if mode}
	<TopNavRenderScope {mode}>{@render bar()}</TopNavRenderScope>
{:else}
	{@render bar()}
{/if}
