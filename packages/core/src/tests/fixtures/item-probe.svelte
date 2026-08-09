<script lang="ts">
	import Item, { type ItemProps } from '$lib/components/item/item.svelte';

	/**
	 * Item with configurable snippet slots.
	 *
	 * Upstream authors its `marker`/`startContent`/`endContent`/`label`/
	 * `description` slots as inline JSX elements; here those are Svelte snippets,
	 * which can only be written in a template. The shared `slot-probe` fills a
	 * single slot with a plain `<span>`; this fixture covers the cases that need
	 * *several* slots at once, an *interactive* control inside a slot, or a rich
	 * (element) `label`/`description` — none of which `slot-probe` can express.
	 */
	interface Props {
		/** `data-testid` for a marker `<span>`, when the case renders a marker. */
		markerId?: string;
		/** `data-testid` for a start-content `<span>`. */
		startId?: string;
		/** `data-testid` for an end-content `<span>`. */
		endId?: string;
		/** Renders an interactive `<button>` in start content with this handler. */
		startButton?: { text: string; onclick: () => void };
		/** Renders an interactive `<button>` in end content with this handler. */
		endButton?: { text: string; onclick: () => void };
		/** Render an element (snippet) `label` instead of the `rest.label` string. */
		richLabel?: boolean;
		/** Render an element (snippet) `description`. */
		richDescription?: boolean;
		/** The Item's own props (`label`, `onclick`, `data-testid`, …). */
		rest?: Record<string, unknown>;
	}

	const {
		markerId,
		startId,
		endId,
		startButton,
		endButton,
		richLabel,
		richDescription,
		rest = {}
	}: Props = $props();

	// `rest.label` is `unknown` (the `rest` bag) and `richLabel` supplies a snippet
	// label; narrow to the required `string | Snippet` so the spread satisfies
	// `ItemProps` (its `label` is non-optional). Every case supplies exactly one.
	const itemProps: ItemProps = $derived({
		...rest,
		label: (richLabel ? richLabelSnip : rest.label) as ItemProps['label'],
		...(markerId != null ? { marker } : {}),
		...(startId != null ? { startContent: startEl } : {}),
		...(startButton != null ? { startContent: startBtn } : {}),
		...(endId != null ? { endContent: endEl } : {}),
		...(endButton != null ? { endContent: endBtn } : {}),
		...(richDescription ? { description: richDescSnip } : {})
	});
</script>

{#snippet marker()}<span data-testid={markerId}>•</span>{/snippet}
{#snippet startEl()}<span data-testid={startId}>S</span>{/snippet}
{#snippet endEl()}<span data-testid={endId}>E</span>{/snippet}
{#snippet startBtn()}<button type="button" onclick={startButton?.onclick}
		>{startButton?.text}</button
	>{/snippet}
{#snippet endBtn()}<button type="button" onclick={endButton?.onclick}>{endButton?.text}</button
	>{/snippet}
{#snippet richLabelSnip()}<span><b>Alice</b> commented</span>{/snippet}
{#snippet richDescSnip()}<div><span>Rich</span> <span>description</span></div>{/snippet}

<Item {...itemProps} />
