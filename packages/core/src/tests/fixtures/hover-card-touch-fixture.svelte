<script lang="ts">
	import HoverCard from '$lib/components/hover-card/hover-card.svelte';
	import type { ComponentProps } from 'svelte';

	/**
	 * The trees upstream's `HoverCard.test.tsx` `touch` describe renders, as a
	 * fixture — both `children` and `content` are snippets here and neither can be
	 * written inline in a `render()` props object, and the text-only trigger has
	 * to arrive as the *prop*, since Svelte wraps component content in a snippet
	 * whatever it holds and only a string can take `HoverCard`'s text branch.
	 *
	 * `hasOutsideButton` is the sibling `<button>Elsewhere</button>` the
	 * outside-tap case taps; upstream writes it as a fragment beside the card.
	 */
	interface Props extends Omit<ComponentProps<typeof HoverCard>, 'children' | 'content'> {
		/** `'text'` gives the inert inline wrapper, `'button'` an action trigger. */
		trigger?: 'text' | 'button';
		/** Label for the trigger. */
		triggerText?: string;
		/** Text rendered inside the card. */
		contentText?: string;
		/** `'button'` makes the card's own content interactive, to tap. */
		contentAs?: 'span' | 'button';
		/** Render a sibling button outside the card, to tap. */
		hasOutsideButton?: boolean;
	}

	const {
		trigger = 'text',
		triggerText = 'Ruby Cheung',
		contentText = 'Card content',
		contentAs = 'span',
		hasOutsideButton = false,
		...rest
	}: Props = $props();
</script>

{#snippet content()}{#if contentAs === 'button'}<button type="button">{contentText}</button
		>{:else}<span>{contentText}</span>{/if}{/snippet}

{#if trigger === 'button'}
	<HoverCard {...rest} {content}><button type="button">{triggerText}</button></HoverCard>
{:else}
	<HoverCard {...rest} {content} children={triggerText} />
{/if}
{#if hasOutsideButton}
	<button type="button">Elsewhere</button>
{/if}
