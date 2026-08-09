<script lang="ts">
	import type { Component } from 'svelte';
	import { Skeleton, Text } from '@astryx-svelte/core';

	/**
	 * A component's showcase block, shrunk to a gallery tile — upstream's
	 * `ShowcaseThumbnail`.
	 *
	 * It is a *live* render, not a screenshot: the block mounts at twice the tile's
	 * size and is scaled to half, so it lays out as it would at full width and
	 * then shrinks, rather than reflowing into a narrow column. `inert` and
	 * `pointer-events: none` keep it non-interactive — the whole tile is a link.
	 *
	 * Three things keep a page of these cheap:
	 *
	 * - The `IntersectionObserver` (upstream's 200px `rootMargin`) means a block
	 *   below the fold never imports at all.
	 * - `content-visibility: auto` with `contain-intrinsic-size` lets the browser
	 *   skip layout and paint for off-screen tiles while still reserving the right
	 *   box, so the scrollbar does not jump.
	 * - The width is measured rather than assumed, because the scaler is
	 *   absolutely positioned and so has no width of its own to inherit.
	 *
	 * Upstream additionally wraps the block in its own `<Theme>`; the root layout
	 * already establishes that exact theme and mode for this page, so a second
	 * identical boundary would be a no-op and is left out.
	 */
	interface Props {
		/**
		 * The block's importer, or null when it has no Svelte rewrite.
		 *
		 * **A function rather than a registry id, and the reason is bundle size.**
		 * Resolving an id means calling `importerFor()`, which means importing
		 * `example-modules.ts`, which is a 629-entry `import.meta.glob` — a **242 KB**
		 * eager chunk (the map plus Vite's `__vite__mapDeps` table). That is the
		 * right trade on `/components` and `/templates`, which render hundreds of
		 * arbitrary blocks and cannot know which ahead of time. It is the wrong
		 * trade on the landing page, whose Templates tile shows six blocks it names
		 * in source: six literal `import()` calls cost six code-split chunks and
		 * nothing eager. Taking the importer lets both callers be right.
		 */
		load: (() => Promise<{ default: Component }>) | null;
		/**
		 * Width the block lays out at before being scaled into the tile.
		 *
		 * Upstream's `ShowcaseThumbnail` has no such knob — it is always the tile
		 * at twice size — but its `TemplateThumbnail` does (`renderWidth`, 1100 on
		 * the landing tile), and for the same reason: a tile only ~150px wide gets
		 * a 300px layout under the fixed scale, which is a *narrow* render of the
		 * block rather than a small one, so a multi-column composition reflows into
		 * a column and the tile shows a fragment. Naming the width instead makes
		 * the tile a shrunk desktop render at any size.
		 *
		 * Defaults to upstream's behaviour: twice the measured tile.
		 */
		renderWidth?: number;
		/** The tile's box. Upstream's landing tiles are taller than the gallery's. */
		aspectRatio?: string;
	}

	const { load, renderWidth, aspectRatio = '16 / 10' }: Props = $props();

	/** Upstream's `FIXED_SCALE`, used when no explicit `renderWidth` is given. */
	const SCALE = 0.5;

	let tileWidth = $state(0);
	let isVisible = $state(false);

	const layoutWidth = $derived(renderWidth ?? tileWidth / SCALE);
	const scale = $derived(layoutWidth > 0 ? tileWidth / layoutWidth : SCALE);
	/** The scaler is scaled, so its own box has to be the inverse of the tile's. */
	const scalerHeight = $derived(scale > 0 ? 100 / scale : 200);

	/**
	 * Both observers, as one attachment.
	 *
	 * It writes `$state` but reads none, so it never re-runs itself; and the
	 * scaler it gates is absolutely positioned inside a fixed-aspect box, so
	 * mounting the block cannot resize the element being observed. That is what
	 * keeps the `ResizeObserver` from feeding itself.
	 */
	function observeTile(node: HTMLElement) {
		const measure = () => {
			tileWidth = node.offsetWidth;
		};

		const intersection = new IntersectionObserver(
			(entries) => {
				isVisible = entries[0]?.isIntersecting ?? false;
			},
			{ rootMargin: '200px' }
		);
		intersection.observe(node);

		const resize = new ResizeObserver(measure);
		resize.observe(node);
		measure();

		return () => {
			intersection.disconnect();
			resize.disconnect();
		};
	}
</script>

<div class="thumb" inert style="aspect-ratio: {aspectRatio};" {@attach observeTile}>
	{#if load && tileWidth > 0 && isVisible}
		<div
			class="thumb-scaler"
			style="width: {layoutWidth}px; height: {scalerHeight}%; transform: scale({scale});"
		>
			<svelte:boundary>
				{#await load()}
					<Skeleton width="100%" height="100%" />
				{:then module}
					{@const Block = module.default}
					<Block />
				{:catch}
					<div class="thumb-fallback">
						<Text type="supporting" color="secondary">Preview unavailable</Text>
					</div>
				{/await}

				{#snippet failed()}
					<div class="thumb-fallback">
						<Text type="supporting" color="secondary">Preview unavailable</Text>
					</div>
				{/snippet}
			</svelte:boundary>
		</div>
	{/if}
</div>

<style>
	/* `aspect-ratio` is set inline from the prop; the rest is fixed. */
	.thumb {
		position: relative;
		width: 100%;
		overflow: hidden;
		background-color: var(--color-background-muted);
		border-radius: var(--radius-container);
		content-visibility: auto;
		contain-intrinsic-size: auto 300px 187px;
	}

	/* `height` is set inline: it is the inverse of the scale, so the scaled box
	   covers exactly the tile. */
	.thumb-scaler {
		position: absolute;
		top: 0;
		left: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		pointer-events: none;
		transform-origin: top left;
	}

	.thumb-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}
</style>
