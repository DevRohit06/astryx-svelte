<script lang="ts">
	import type { Component } from 'svelte';

	/**
	 * Renders a component whose children are a **bare text node**, plus one
	 * optional extra snippet slot.
	 *
	 * `slot-probe.svelte` wraps its text in a `<span>`, which is right for the
	 * cases asking "did the slot render" and wrong for the cases asking which
	 * element *holds* the text: a text query matches the innermost element with
	 * that text, so the span becomes the match and upstream's
	 * `expect(el.tagName).toBe('CODE')` reads `SPAN`. Here the text is a direct
	 * child of the target's root, exactly as `<Code>const x = 1</Code>` is.
	 *
	 * `childTestid` switches to the element-child form (`<p data-testid=…>`), and
	 * `slot`/`slotText`/`slotTestid` fill one further snippet prop — `Blockquote`'s
	 * `cite`, which React writes inline as a second `ReactNode`.
	 */
	interface Props {
		// `any` rather than a concrete props type: assignability for a component
		// is contravariant in its props, so the only type that accepts *every*
		// component is the one that is assignable to all of them.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>;
		/** The target's own props, including any attachment key. */
		rest?: Record<string | symbol, unknown>;
		/** The text child — bare, or inside `<p data-testid={childTestid}>`. */
		text?: string;
		childTestid?: string;
		/** Prop name of a second snippet slot to fill, e.g. `cite`. */
		slot?: string;
		slotText?: string;
		slotTestid?: string;
	}

	const {
		component: Target,
		rest = {},
		text,
		childTestid,
		slot,
		slotText,
		slotTestid
	}: Props = $props();
</script>

{#snippet slotContent()}
	{#if slotTestid}
		<span data-testid={slotTestid}>{slotText}</span>
	{:else}
		{slotText}
	{/if}
{/snippet}

<Target {...rest} {...slot ? { [slot]: slotContent } : {}}>
	{#if childTestid}
		<p data-testid={childTestid}>{text}</p>
	{:else}
		{text}
	{/if}
</Target>
