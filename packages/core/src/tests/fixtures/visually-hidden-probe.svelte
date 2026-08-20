<script lang="ts">
	import VisuallyHidden from '$lib/components/visually-hidden/visually-hidden.svelte';

	/**
	 * Renders a `VisuallyHidden` with text children, optionally inside the
	 * icon-only `<button>` upstream's last case builds around it.
	 *
	 * `children` is a `Snippet` here, so upstream's inline
	 * `<VisuallyHidden>Delete incident</VisuallyHidden>` cannot be handed over as
	 * a value — a snippet can only be authored in a template, which makes a
	 * component the smallest thing that can supply one.
	 *
	 * The shared `slot-probe` cannot stand in: it always wraps its text in a
	 * `<span data-testid>`, and four of these cases assert on the tag name and
	 * attributes of the element `getByText` resolves to. A nested span would make
	 * `getByText(...).tagName` report the wrapper rather than the
	 * `VisuallyHidden` root, and the `as="div"` case would read `SPAN`.
	 *
	 * `text-child-probe` gets the bare-text child right and would serve six of
	 * the seven cases — but not the seventh, which needs the surrounding
	 * `<button>`. One fixture covering the whole suite beats two covering it
	 * between them.
	 */
	interface Props {
		/** Text content, rendered as the bare children upstream writes inline. */
		text: string;
		/** The `VisuallyHidden`'s own props, including any attachment key. */
		rest?: Record<string | symbol, unknown>;
		/** Wrap it in the `<button>` + `aria-hidden` icon of the last case. */
		inButton?: boolean;
	}

	const { text, rest = {}, inButton = false }: Props = $props();
</script>

{#if inButton}
	<button type="button">
		<span aria-hidden="true">🗑️</span>
		<VisuallyHidden {...rest}>{text}</VisuallyHidden>
	</button>
{:else}
	<VisuallyHidden {...rest}>{text}</VisuallyHidden>
{/if}
