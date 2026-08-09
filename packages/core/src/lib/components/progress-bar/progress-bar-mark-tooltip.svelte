<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/**
	 * Upstream exports this type from `ProgressBarMarkTooltip.tsx` but publishes it
	 * from neither `ProgressBar/index.ts` nor the package barrel — the wrapper is
	 * an implementation detail of `ProgressBar`, loaded lazily by it and by nothing
	 * else. It stays module-public and off `src/lib/index.ts` for the same reason
	 * `TimestampHoverCardProps` does.
	 */
	export interface ProgressBarMarkTooltipProps {
		/** The mark's accessible name / visible tooltip text. */
		content: string;
		/** The bare mark element the tooltip anchors to (also the pending fallback). */
		children: Snippet;
	}
</script>

<script lang="ts">
	import Tooltip from '../tooltip/tooltip.svelte';

	/**
	 * The tooltip wrapper for a labelled ProgressBar mark, ported from Astryx's
	 * `src/ProgressBar/ProgressBarMarkTooltip.tsx`.
	 *
	 * Wraps a labelled mark in a `Tooltip` that reveals its label on hover and
	 * keyboard focus. Placement and focus behaviour match the inline usage this
	 * split replaced (`placement="above"`, `focusTrigger="always"`), so the
	 * rendered result is identical — only the load timing changes.
	 *
	 * Split out of `progress-bar.svelte` exactly as upstream splits it out of
	 * `ProgressBar.tsx`: `Tooltip` (and its `Layer`/overlay machinery) loads only
	 * when a mark is actually rendered, so a ProgressBar with no marks never pulls
	 * it in. `progress-bar.svelte`'s `{#await import(…)}` is the `lazy()` +
	 * `Suspense` wrapper.
	 */
	const { content, children }: ProgressBarMarkTooltipProps = $props();
</script>

<Tooltip {content} placement="above" focusTrigger="always">
	{@render children()}
</Tooltip>
