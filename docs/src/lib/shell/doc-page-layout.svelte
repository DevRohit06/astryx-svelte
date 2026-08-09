<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		Divider,
		Heading,
		Section,
		Selector,
		Text,
		VStack,
		useMediaQuery
	} from '@astryx-svelte/core';
	import Outline, { type OutlineEntry } from './outline.svelte';

	/**
	 * Upstream's `DocPageLayout`: title, dek, divider, body, and the on-this-page
	 * navigation — a sticky `Outline` aside above 1024px, a sticky `Selector` jump
	 * menu below it.
	 *
	 * Three things here are upstream's exact treatment rather than a lookalike:
	 * the title is `Heading level={1} type="display-1"` (not a bare `h1`), the dek
	 * is `Text type="large" weight="normal" color="secondary"` (not body), and the
	 * prose column is capped at upstream's `proseMaxWidth` of **800px** — narrower
	 * than the 960px this used to use, which is the difference between a reading
	 * column and a page of text.
	 *
	 * The article also re-declares the body type scale at 17px / 1.647, upstream's
	 * `sectionCentered`. Those are the theme's own `--text-body-*` custom
	 * properties, so setting them on a wrapper around the article is the same
	 * mechanism upstream's StyleX override uses — and scoping them to that wrapper
	 * keeps the larger reading size out of the outline aside, exactly as upstream
	 * scopes them to the `Section`.
	 *
	 * **Only one side of the breakpoint is mounted**, as upstream mounts it: both
	 * are *also* styled for their side in CSS, so the server's HTML is right at
	 * every width, and `useMediaQuery` then swaps in the side the viewport
	 * actually needs so the other's `IntersectionObserver` never runs.
	 *
	 * The server emits the `serverDefault` (desktop) side. Note that this port's
	 * `useMediaQuery` does *not* hold that value through hydration the way
	 * upstream's `getServerSnapshot` does — its `$effect.pre` has already taken
	 * the live reading by the time these `{#if}`s are evaluated, so on a narrow
	 * viewport Svelte discards the server's aside and builds the mobile branch
	 * client-side. The rendered result is correct either way; see the hook's own
	 * note for why the pre-effect is still the right trade.
	 */
	interface Props {
		title: string;
		description?: string | null;
		outline?: OutlineEntry[];
		children: Snippet;
	}

	const { title, description = null, outline = [], children }: Props = $props();

	const hasOutline = $derived(outline.length > 0);

	const isNarrow = useMediaQuery(() => '(max-width: 1024px)');
	const showAside = $derived(hasOutline && !isNarrow.matches);
	const showSelector = $derived(hasOutline && isNarrow.matches);

	let activeId = $state<string | undefined>(undefined);
	// Upstream seeds `useState(outline?.[0]?.id)`. Read as a `$derived` fallback
	// rather than an initialiser so a page whose outline arrives with the data
	// (every page here — `outline` is `$derived` in the route) still starts on
	// its first section.
	const selectedId = $derived(activeId ?? outline[0]?.id);

	// Upstream measures the sticky selector with a callback ref plus a
	// `ResizeObserver`, purely to publish its height; `bind:offsetHeight` is the
	// same measurement (border box, so the 1px bottom border counts) through
	// Svelte's own observer. It keeps its last value when the element is
	// destroyed, so the unmounted case is handled where upstream handles it — by
	// reporting 0 when the selector is not shown.
	let selectorHeight = $state(0);
	const anchorOffset = $derived(showSelector ? selectorHeight : 0);

	function scrollToId(id: string): void {
		activeId = id;
		const target = document.getElementById(id);
		if (target == null) return;
		target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		history.pushState(null, '', `#${id}`);
	}

	const selectorOptions = $derived(
		outline.map((entry) => ({ value: entry.id, label: entry.label }))
	);
</script>

{#snippet article()}
	<Section maxWidth={800} padding={6} width="100%">
		<VStack gap={10}>
			<VStack gap={4}>
				<Heading level={1} type="display-1">{title}</Heading>
				{#if description}
					<Text type="large" weight="normal" color="secondary">{description}</Text>
				{/if}
				<!-- On outline pages the mobile selector carries its own bottom border,
				     so the divider is hidden below the breakpoint to avoid a doubled
				     separator. Upstream puts this on the `Divider`'s `xstyle`; the
				     hand-built shell styles with plain CSS, so it is a wrapper — one
				     flex child either way, so the `VStack` gap is unchanged. -->
				<div class="title-divider" class:outline-page={hasOutline}>
					<Divider />
				</div>
			</VStack>
			{#if showSelector}
				<div class="mobile-outline" bind:offsetHeight={selectorHeight}>
					<Selector
						label="On this page"
						isLabelHidden
						options={selectorOptions}
						value={selectedId}
						onChange={scrollToId}
						width="100%"
					/>
				</div>
			{/if}
			{@render children()}
		</VStack>
	</Section>
{/snippet}

<!-- `--docs-anchor-offset` is consumed by anchored section headings, so a section
     scrolled to clears the sticky selector as well as the header. Upstream drops
     the row wrapper entirely when there is no outline; here it stays, because
     `.doc-article` is where this port declares the article type scale that
     upstream declares on the `Section`'s `xstyle` in both branches. -->
<div class="doc-row" style="--docs-anchor-offset: {anchorOffset}px">
	<div class="doc-article">
		{@render article()}
	</div>

	{#if showAside}
		<aside class="doc-aside">
			<Outline entries={outline} onActiveIdChange={(id) => (activeId = id)} />
		</aside>
	{/if}
</div>

<style>
	/*
	 * Upstream's `styles.row`. Centring the article is this flex rule's job, which
	 * is why the article itself carries no `margin-inline` — a capped block inside
	 * a full-width parent would otherwise sit hard against the left edge.
	 */
	.doc-row {
		display: flex;
		flex-direction: row;
		gap: 32px;
		align-items: flex-start;
		justify-content: center;
		width: 100%;
	}

	.doc-article {
		flex-shrink: 1;
		min-width: 0;
		max-width: 800px;

		/* Upstream's article type scale: 17px on a 28px line box (28 ÷ 17). */
		--text-body-size: 1.0625rem;
		--text-body-leading: 1.6470588235;
	}

	/* Upstream tops the aside at `--appshell-header-height + 24px`, and since
	   batch 10 so does this port: `AppShell` measures its own header with a
	   ResizeObserver and publishes the variable on the shell root. The `56px`
	   fallback is only for the first paint before the observer reports. */
	.doc-aside {
		position: sticky;
		top: calc(var(--appshell-header-height, 56px) + 24px);
		flex-shrink: 0;
		align-self: flex-start;
		width: 232px;
	}

	/* Pinned below the app header while scrolling. It lives in the article column
	   so its sticky range spans the article; the opaque background and bottom
	   border keep content readable as it scrolls underneath. */
	.mobile-outline {
		position: sticky;
		top: var(--appshell-header-height, 56px);
		z-index: 1;
		background-color: var(--color-background-surface);
		padding-block: var(--spacing-3);
		border-block-end: 1px solid var(--color-border);
	}

	/*
	 * Both sides are styled for their side of the breakpoint even though only one
	 * is mounted, so a viewport that has not yet been measured — the server
	 * render, and the hydration pass — is never briefly wrong.
	 */
	@media (max-width: 1024px) {
		.doc-aside {
			display: none;
		}

		.title-divider.outline-page {
			display: none;
		}
	}

	@media (min-width: 1025px) {
		.mobile-outline {
			display: none;
		}
	}
</style>
