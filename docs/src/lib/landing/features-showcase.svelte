<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Card, Heading, HStack, Link, Text, VStack } from '@astryx-svelte/core';
	import componentRegistry from '$lib/generated/component-registry.js';
	import { componentsHref, templatesHref, themesHref, topicHref } from '../shell/links.js';
	import ComponentsPreview from './components-preview.svelte';
	import CliPreview from './cli-preview.svelte';
	import ThemesPreview from './themes-preview.svelte';
	import TemplatesPreview from './templates-preview.svelte';

	/**
	 * The bento feature grid, ported from upstream's `_landing/FeaturesShowcase.tsx`.
	 *
	 * **All four tiles and all three columns are upstream's**, in upstream's slots:
	 *
	 *   col 1: HeadingBlock + Themes (flex)
	 *   col 2: Components (flex) + CLI (natural height)
	 *   col 3: Templates (tall, flex)
	 *
	 * The Themes and Templates tiles were dropped for several batches — their
	 * previews are a live theme-showcase store and seven live page templates, and
	 * both are page templates this port has not transcribed. That forced a
	 * two-column rebalance which TODO.md recorded as explicitly temporary; this is
	 * the revert. What changed is that both tiles now have *something real* to
	 * show: eight published theme packages, and 619 block templates with a
	 * `/templates` gallery behind them. Each preview's own docstring says exactly
	 * which half of upstream's composition it is and what it is still missing.
	 *
	 * Everything else is upstream's: the heading block on the page background
	 * rather than in a card, `Card variant="transparent"` with the padding owned
	 * by the inner stack, and the marketing token behind all the cards.
	 *
	 * **Two hrefs differ from upstream's, both because the target does not exist
	 * here.** The CLI tile points at `/docs/working-with-ai` rather than
	 * `/docs/cli` (a package README rendered through `PackageStubPage`, unported —
	 * TODO.md → After launch); `working-with-ai` is upstream's own topic on the
	 * same subject. Everything else resolves to upstream's own path.
	 */

	// Count of public components (excluding hooks and hidden entries), sourced
	// from the generated registry so the number stays accurate as the library
	// grows. Rounded down to the nearest 10 for marketing copy — "Over X
	// components" reads better than "Over 87 components" and avoids the displayed
	// number going stale every time a single component lands.
	const CORE_COMPONENT_COUNT = componentRegistry.filter((entry) => !entry.isHook).length;
	const CORE_COMPONENT_COUNT_ROUNDED = Math.floor(CORE_COMPONENT_COUNT / 10) * 10;
</script>

<!--
	Upstream's `FeatureCard`. All cards use `Card padding={0}` and apply their own
	padding via the inner stack. This is intentional: Card's `padding={N}` prop
	wires its padding-bottom through a (0,5,0)-specificity selector which beats
	any override, and the CSS-variable indirection doesn't work either because the
	card sets `padding-bottom: var(--spacing-N)` directly. Owning the padding via
	the inner stack is the only reliable way to get 0 bottom padding for media
	cards while leaving full padding on the text-only card.

	`variant="transparent"` suppresses Card's default border + background so the
	marketing token painted by the card class is the sole surface colour (no blend
	with --color-background-card).
-->
{#snippet featureCard(
	title: string,
	description: string,
	href: string,
	preview: Snippet,
	cardClass: string
)}
	<Card variant="transparent" padding={0} class="feature-card {cardClass}">
		<!--
			Upstream's `VStack gap={1} align="start" height="100%" xstyle={padding}` —
			one box carrying the padding, the full height and the alignment. Splitting
			it into a padded wrapper around a Stack puts the height on the wrapper and
			the alignment inside it, so the card's content stops filling it.
		-->
		<div class="card-body">
			<Heading level={2} color="primary">{title}</Heading>
			<Text type="body" color="primary">{description}</Text>
			<div class="explore-link">
				<Link type="body" color="primary" {href} hasUnderline={false}>Explore →</Link>
			</div>
			<!--
				hAlign/vAlign centre the preview in the card's leftover horizontal
				space; the fixed top gap keeps the space under "Explore" consistent
				across preview cards, so any extra card height falls below the framed
				preview rather than above it.
			-->
			<div class="preview-wrap">
				<HStack hAlign="center" vAlign="center">
					{@render preview()}
				</HStack>
			</div>
		</div>
	</Card>
{/snippet}

{#snippet componentsPreview()}<ComponentsPreview />{/snippet}
{#snippet cliPreview()}<CliPreview />{/snippet}
{#snippet themesPreview()}<ThemesPreview />{/snippet}
{#snippet templatesPreview()}<TemplatesPreview />{/snippet}

<VStack as="section" align="center" gap={10} width="100%">
	<!--
		CSS-grid container with responsive column count. Kept as a plain <div>
		rather than `Grid` because we depend on grid's align-items:stretch +
		min-height behaviour to drive equal column heights, and we need to control
		gap/min-height via @media at the wrapper level. `Grid` is optimised for
		fixed column counts + a single gap and doesn't expose the responsive
		min-height pattern this needs.
	-->
	<div class="grid-layout">
		<!--
			Column wrappers use VStack at desktop and dissolve via `display: contents`
			at mobile, so the cards become direct children of the grid and the
			single-column template lays them out in source order.
		-->
		<div class="column">
			<!--
				Plain heading block — sits in the top-left grid slot on the page
				background (no card wrapper) per the bento reference. The text is
				flush-left to the grid column edge (no inline padding) so the display
				heading has the full column width to break onto natural lines. Its
				padding-block-start matches the cards' internal top padding so the
				heading and the adjacent card titles sit on roughly the same vertical
				baseline at the top of the row.
			-->
			<div class="heading-cell">
				<Heading level={2} type="display-2" color="primary">
					Start anywhere.
					<br />
					Change anything.
					<br />
					Ship faster.
				</Heading>
				<Text display="block" type="large" weight="normal" color="secondary">
					A design system that adapts to your workflow, not the other way around. Built for speed,
					clarity, and creative freedom.
				</Text>
			</div>
			{@render featureCard(
				'Themes that fit your brand',
				'Fully customizable themes ready for use. Make it yours without starting from scratch.',
				themesHref(),
				themesPreview,
				'card-flex'
			)}
		</div>
		<div class="column">
			{@render featureCard(
				`Over ${CORE_COMPONENT_COUNT_ROUNDED} components`,
				'Accessible and themeable Svelte components with built-in spacing, dark mode, and flexible styling.',
				componentsHref(),
				componentsPreview,
				'card-flex'
			)}
			<!--
				Upstream's "Explore" here points at `/docs/cli`, which renders a package
				README through `PackageStubPage` and is unported (TODO.md → After
				launch). `working-with-ai` is upstream's own topic on the same subject —
				agent-readable docs — so the link resolves rather than 404ing. It returns
				to `/docs/cli` when that page is built.
			-->
			{@render featureCard(
				'A design system that your agent can use',
				'Scaffold projects, browse templates, generate themes, and get agent-ready docs from the command line or MCP.',
				topicHref('working-with-ai'),
				cliPreview,
				''
			)}
		</div>
		<div class="column">
			{@render featureCard(
				'Ready to ship templates',
				'Production-ready templates for common pages, just plug in your content.',
				templatesHref(),
				templatesPreview,
				'card-flex'
			)}
		</div>
	</div>
</VStack>

<style>
	/*
	 * Bento CSS-grid layout. Each grid cell holds a full-height column wrapper
	 * rather than a single card, so the grid auto-stretches the columns to the
	 * tallest column's natural content height — which is what gives visually
	 * balanced column heights even when one column has one tall card and another
	 * has a tall card plus a short card stacked.
	 *
	 *   <1024px: single column — every card stacks vertically.
	 *   ≥1024px: fixed columns; cards with flex:1 grow to fill leftover space.
	 *
	 * min-height 720 keeps the bento tall enough on desktop that the cards have
	 * room for their compositions.
	 */
	.grid-layout {
		width: 100%;
		max-width: var(--docs-content-max-width);
		display: grid;
		/* Tighter stacking gap on mobile; roomier --spacing-8 at the ≥1024px bento. */
		gap: var(--spacing-5);
		grid-template-columns: 1fr;
		min-height: 0;
	}

	@media (min-width: 1024px) {
		.grid-layout {
			gap: var(--spacing-8);
			/* Upstream's three tracks. `minmax(0, 1fr)` (not `1fr`) so a card with
			   wide content cannot blow out its column; all three stay equal. */
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
			min-height: 720px;
		}
	}

	/*
	 * Column wrapper. At desktop it's a flex column that takes the full grid-cell
	 * height and stacks its cards. At mobile the display flips to `contents`,
	 * which dissolves the wrapper so its children become direct grid children —
	 * combined with the parent's single-column template, every card gets its own
	 * row at full width.
	 */
	.column {
		display: contents;
	}

	@media (min-width: 1024px) {
		.column {
			display: flex;
			flex-direction: column;
			/* Upstream's `VStack gap={8} width="100%" height="100%"` — on the *same*
			   element as the display switch, not a Stack nested inside it. Nested,
			   the mobile `display: contents` dissolves only the outer box and the
			   Stack still groups the column's cards into one grid item, so the
			   single-column stack never happens. */
			gap: var(--spacing-8);
			width: 100%;
			height: 100%;
		}
	}

	/*
	 * Heading cell — the top-left column starts with plain text on the page
	 * background (no card wrapper) per the bento reference. padding-block-start
	 * matches the cards' internal padding so the heading baseline visually aligns
	 * with the heading inside the adjacent card. NO inline padding: the reference
	 * shows the heading text starting flush at the column's left edge.
	 */
	.heading-cell {
		/* Upstream's `VStack gap={4}` + `styles.headingCell` on one box. Split
		   across a wrapper and a Stack, the alignment stays inside while the width
		   and padding move out, and the block stops centring on mobile. */
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
		align-items: center;
		padding-block-start: var(--spacing-5);
		width: 100%;
		/* Under 1024px (single-column stack) the heading is standalone above the
		   cards and centring reads better; on desktop flush-left reads as an
		   editorial section header. */
		text-align: center;
	}

	@media (min-width: 1024px) {
		.heading-cell {
			align-items: flex-start;
			text-align: start;
		}
	}

	/* All card variants share the same pastel backdrop, pulled from a
	   marketing-only token (defined in landing.css). We do NOT use Card's
	   `variant="blue"` here because that token is a 20%-alpha saturated wash that
	   prints too vivid against the showcase's white surface; the marketing token
	   is a soft pastel band hand-tuned for this section. */
	.grid-layout :global(.feature-card) {
		background-color: var(--astryx-marketing-feature-card-bg);
		overflow: hidden;
	}

	/* Regular media card — natural (content) height. Used for a card that shares
	   its column with a grow-to-fill sibling: the flex sibling absorbs the
	   column's leftover height while this card stays at its content height. */
	.grid-layout :global(.card) {
		height: auto;
	}

	/* Flex variant — grows to fill its column's leftover height so a column with
	   a short sibling can still match the height of an adjacent column. */
	.grid-layout :global(.card-flex) {
		flex: 1;
	}

	/* Upstream's inner VStack: gap={1}, align="start", height="100%", plus the
	   inset padding — 40px on all four sides, so the preview keeps
	   left/right/bottom breathing room inside the card instead of touching the
	   edges. box-sizing so the 100% height includes that padding rather than
	   overflowing the card by 80px. */
	.card-body {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--spacing-1);
		padding: var(--spacing-10);
		height: 100%;
		box-sizing: border-box;
	}

	/* Explore link spacing — the VStack gap holds heading↔description at 4px, but
	   the link below the description wants more breathing room (16px). */
	.explore-link {
		margin-top: var(--spacing-3);
	}

	/* Inset wrapper for a live preview node. A fixed top gap (not margin-top:auto)
	   keeps the space under "Explore" consistent across preview cards. */
	.preview-wrap {
		padding-top: var(--spacing-10);
		align-self: stretch;
		width: 100%;
		min-width: 0;
		max-width: 100%;
	}
</style>
