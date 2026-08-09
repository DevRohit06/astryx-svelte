<script lang="ts" module>
	export interface OutlineEntry {
		id: string;
		label: string;
		/**
		 * Heading level, as `Outline` means it. Omitted for a top-level section,
		 * which is the common case; a `heading` content block passes its own 3–6 so
		 * it nests under the section it sits in.
		 */
		level?: number;
	}
</script>

<script lang="ts">
	import { Outline } from '@astryx-svelte/core';

	/**
	 * The on-this-page outline — **now the real `Outline`**, swapped on when it
	 * landed in batch 9. The seam kept the change local: `doc-page-layout.svelte`
	 * still passes `entries` and `onActiveIdChange`, and no page changed.
	 *
	 * Three things the hand-built version approximated are now the component's:
	 * the scroll-spy resolves the active heading from each heading's own
	 * `scroll-margin-top` (where it *lands* when navigated to) rather than an
	 * `IntersectionObserver` band; a click pins the indicator and suppresses the
	 * spy until the smooth scroll settles, instead of letting it chase through
	 * intervening sections; and the active bar is CSS anchor positioning, so it
	 * slides without measurement.
	 *
	 * `OutlineEntry` stays declared here rather than re-exporting the component's
	 * `OutlineItem`: `level` is *optional* here and required there, so a page that
	 * only has sections still passes `{id, label}`. The mapping is the one line
	 * below.
	 */
	interface Props {
		entries: OutlineEntry[];
		/** Reports the scroll-spy's current section, upstream's `onActiveIdChange`. */
		onActiveIdChange?: (id: string) => void;
	}

	const { entries, onActiveIdChange }: Props = $props();

	// A section defaults to level 2. `Outline` maps heading level → indent as
	// `max(1, min(4, level - 1 || 1))`, so level 2 is the first indent step — the
	// flat look the aside had while every entry was a section. A `heading` block
	// carries its own 3–6 and therefore nests one or more steps deeper.
	const items = $derived(entries.map((entry) => ({ ...entry, level: entry.level ?? 2 })));
</script>

{#if entries.length > 0}
	<Outline {items} label="On this page" density="compact" {onActiveIdChange} />
{/if}
