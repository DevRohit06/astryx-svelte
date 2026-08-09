<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { TimestampTooltipLine } from './tooltip-entries.js';

	/**
	 * Upstream exports this type from `TimestampHoverCard.tsx` but publishes it
	 * from neither `Timestamp/index.ts` nor the package barrel — the card is an
	 * implementation detail of `Timestamp`, loaded lazily by it and by nothing
	 * else. It stays module-public and off `src/lib/index.ts` for the same
	 * reason `TimestampTooltipLine` does.
	 */
	export interface TimestampHoverCardProps {
		/** The rows to render, each a labelled instant, optionally copyable. */
		lines: ReadonlyArray<TimestampTooltipLine>;
		/** Accessible name for the card. */
		label: string;
		/** The anchor the card is attached to (the `<time>` element). */
		children: Snippet;
	}
</script>

<script lang="ts">
	import HoverCard from '../hover-card/hover-card.svelte';
	import TimestampCopyButton from './timestamp-copy-button.svelte';
	import {
		timestampHoverCardActionAttrs,
		timestampHoverCardLabelAttrs,
		timestampHoverCardListAttrs,
		timestampHoverCardRowAttrs,
		timestampHoverCardValueAttrs
	} from './timestamp-hover-card.stylex.js';

	/**
	 * The copyable hover card for Timestamp, ported from Astryx's
	 * `src/Timestamp/TimestampHoverCard.tsx`.
	 *
	 * Renders a semantic `<dl>` as a grid: an optional label column, the value,
	 * and — when any row is copyable — a trailing action column carrying that
	 * row's copy button, so buttons align down one column. With a single default
	 * line this is a one-row card carrying the full absolute time, copyable.
	 * Opens on hover and on keyboard focus (the anchor's tab stop), with a
	 * dashed-underline affordance signalling it is interactive.
	 *
	 * Split out of `timestamp.svelte` exactly as upstream splits it out of
	 * `Timestamp.tsx`: the overlay (`HoverCard`) and the copy affordance's
	 * `Icon`/`IconButton` load only when a card is actually shown, so the
	 * default, card-less Timestamp never pulls them in. `timestamp.svelte`'s
	 * `{#await import(…)}` is the `lazy()` + `Suspense` wrapper.
	 *
	 * Upstream's `EntryRow` is inlined into the `{#each}` below rather than given
	 * a file of its own: it is pure presentation with no state (the copy state
	 * lives in `TimestampCopyButton`, which only copyable rows render), and
	 * inlining emits byte-identical markup.
	 */
	const { lines, label, children }: TimestampHoverCardProps = $props();

	// A label column is only reserved when some row is labelled; otherwise the
	// value sits flush at the card's leading edge. An action column is only
	// reserved when some row is copyable, so a fully read-only card has no
	// trailing gutter.
	const hasLabelColumn = $derived(lines.some((line) => line.label != null && line.label !== ''));
	const hasActionColumn = $derived(lines.some((line) => line.isCopyable));

	const list = $derived(timestampHoverCardListAttrs(hasLabelColumn, hasActionColumn));
	const row = timestampHoverCardRowAttrs();
	const labelCell = timestampHoverCardLabelAttrs();
	const valueCell = timestampHoverCardValueAttrs();
	const action = timestampHoverCardActionAttrs();
</script>

{#snippet content()}
	<dl class={list.class} style={list.style}>
		<!--
			Rows are fixed positional slots and two entries may legitimately be
			identical, so the index is the key — upstream keys on it for the same
			reason.
		-->
		{#each lines as line, index (index)}
			<div class={row.class} style={row.style}>
				{#if hasLabelColumn}
					<dt class={labelCell.class} style={labelCell.style}>{line.label ?? ''}</dt>
				{/if}
				<dd class={valueCell.class} style={valueCell.style}>{line.value}</dd>
				{#if hasActionColumn}
					<div class={action.class} style={action.style}>
						{#if line.isCopyable}
							<TimestampCopyButton value={line.value} />
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</dl>
{/snippet}

<HoverCard {content} placement="above" focusTrigger="always" hasHoverIndication {label}>
	{@render children()}
</HoverCard>
