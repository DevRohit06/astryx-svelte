<script lang="ts">
	import Tooltip from '$lib/components/tooltip/tooltip.svelte';
	import type { ComponentProps } from 'svelte';

	/**
	 * The trees upstream's `Tooltip.test.tsx` `touch` describe renders, as a
	 * fixture — `children` is a snippet here and cannot be written inline in a
	 * `render()` props object, and the text-only trigger has to arrive as the
	 * *prop*, since Svelte wraps component content in a snippet whatever it holds
	 * and only a string can take `Tooltip`'s text branch.
	 *
	 * `hasOutsideButton` is the sibling `<button>Elsewhere</button>` the
	 * outside-tap case taps; upstream writes it as a fragment beside the tooltip.
	 */
	interface Props extends Omit<ComponentProps<typeof Tooltip>, 'children'> {
		/**
		 * `'text'` gives the inert `<span tabindex=0>` wrapper (upstream's
		 * `Abbreviation`), `'button'` an action trigger, `'input'` the
		 * `aria-label="Amount"` text field the focus cases need.
		 */
		trigger?: 'text' | 'button' | 'input';
		/** Label for the `'text'` and `'button'` triggers. */
		triggerText?: string;
		/** Render a sibling button outside the tooltip, to tap. */
		hasOutsideButton?: boolean;
	}

	const {
		trigger = 'text',
		triggerText = 'Abbreviation',
		hasOutsideButton = false,
		...rest
	}: Props = $props();
</script>

{#if trigger === 'input'}
	<Tooltip {...rest}><input type="text" aria-label="Amount" /></Tooltip>
{:else if trigger === 'button'}
	<Tooltip {...rest}><button type="button">{triggerText}</button></Tooltip>
{:else}
	<Tooltip {...rest} children={triggerText} />
{/if}
{#if hasOutsideButton}
	<button type="button">Elsewhere</button>
{/if}
