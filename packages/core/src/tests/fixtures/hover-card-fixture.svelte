<script lang="ts">
	import HoverCard from '$lib/components/hover-card/hover-card.svelte';
	import type { ComponentProps } from 'svelte';

	/**
	 * Upstream's test tree — `<HoverCard content={<span>Card content</span>}>
	 * <button type="button">Trigger</button></HoverCard>` — as a fixture, because
	 * both `children` and `content` are snippets here and neither can be written
	 * inline in a `render()` props object.
	 *
	 * The three switches cover every shape the suite needs: the trigger element,
	 * the content element, and the text-only trigger — which has to arrive as the
	 * `children` *prop*, since Svelte wraps component content in a snippet
	 * whatever it holds and only a string can take `HoverCard`'s text branch.
	 */
	interface Props extends Omit<ComponentProps<typeof HoverCard>, 'children' | 'content'> {
		/** Text rendered inside the card. */
		contentText?: string;
		/**
		 * `'button'` gives upstream's interactive content
		 * (`content={<button>Interactive button</button>}`); `'span'` its plain
		 * `<span>Card content</span>`.
		 */
		contentAs?: 'span' | 'button';
		/** Element trigger rendered as component content. Ignored when `children` is set. */
		trigger?: 'button' | 'link';
		/** `aria-describedby` already present on the trigger, for the merge case. */
		triggerDescribedBy?: string;
		/** A text-only trigger, passed as the prop — the only form `HoverCard` can tell apart. */
		children?: string;
	}

	const {
		contentText = 'Card content',
		contentAs = 'span',
		trigger = 'button',
		triggerDescribedBy,
		children,
		...rest
	}: Props = $props();
</script>

{#snippet content()}{#if contentAs === 'button'}<button type="button">{contentText}</button
		>{:else}<span>{contentText}</span>{/if}{/snippet}

{#if children !== undefined}
	<HoverCard {...rest} {content} {children} />
{:else if trigger === 'link'}
	<HoverCard {...rest} {content}
		><a href="#trigger" aria-describedby={triggerDescribedBy}>Trigger</a></HoverCard
	>
{:else}
	<HoverCard {...rest} {content}
		><button type="button" aria-describedby={triggerDescribedBy}>Trigger</button></HoverCard
	>
{/if}
