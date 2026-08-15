<script lang="ts">
	import {
		AspectRatio,
		Avatar,
		Badge,
		Button,
		Card,
		Heading,
		HStack,
		Icon,
		ProgressBar,
		RadioList,
		RadioListItem,
		Text,
		VStack
	} from '@astryx-svelte/core';
	import type { HeroThemeContent } from './hero-theme-content.js';

	/**
	 * @input HeroThemeContent for the active theme + a `mounted` flag for entrance
	 * @output The decorative themed UI cards that flank the hero wordmark
	 * @position Home hero — themed "mini storefront" surfaces that re-skin per theme.
	 *
	 * Ported from upstream's `hero/HeroFloatingCards.tsx`.
	 *
	 * Cards are real `@astryx-svelte/core` components, so wrapping the set in
	 * `<Theme>` re-skins them per theme. The whole layer is decorative:
	 * `aria-hidden` + `inert` + no pointer events. `layout="overlap"` is the
	 * desktop art composition; `layout="stack"` is the narrow-screen grid collage.
	 *
	 * **Not ported: the chat composer.** Upstream renders a `ChatComposer` +
	 * `ChatSendButton` here — breaking out over the product photo in the overlap
	 * layout, and as its own side-column item in the collage. `Chat` is unported
	 * (TODO.md → batch 13, 7,336 LOC), so both placements are omitted. The
	 * `chatPrompt` field stays in `HeroThemeContent` because it is upstream's data
	 * shape and the composer returns with the component. The `Plus` icon upstream
	 * puts on the composer's attachment button goes with it, which is why no
	 * substitution is needed for that one.
	 */
	interface Props {
		content: HeroThemeContent;
		mounted: boolean;
		/** `'overlap'` = desktop fixed art layout; `'stack'` = mobile flow column. */
		layout?: 'overlap' | 'stack';
	}

	const { content, mounted, layout = 'overlap' }: Props = $props();

	const stack = $derived(layout === 'stack');
	// In the stacked layout cards render full-size in flow (no entrance pose).
	const poseClass = $derived(stack ? 'stack-card' : mounted ? 'shown-pose' : 'hidden-pose');

	// One recurring member across every theme slide (the per-theme `member` copy
	// is intentionally not used here).
	const CDN = 'https://lookaside.facebook.com/assets/astryx';
	const REWARD_MEMBER_NAME = 'Ami Pena';
	const REWARD_MEMBER_AVATAR = `${CDN}/DATA-Ami-Pena.png`;
</script>

<!--
	Upstream's badge icon is lucide's `Sparkles`. Registry substitution: this
	port's built-in set is the 26 the components themselves need, and `info` is
	the same stand-in the rest of the site makes. Retires with the icon registry
	(TODO.md → Phase 3).
-->
{#snippet sparklesIcon()}<Icon icon="info" size="sm" />{/snippet}

{#snippet badgeEl()}
	<Badge variant="green" label={content.pills.leading} icon={sparklesIcon} />
{/snippet}

{#snippet radioEl()}
	<Card padding={2} class="radio-pill-card">
		<RadioList
			label={content.pills.trailing}
			isLabelHidden
			value="selected"
			onChange={() => {}}
			size="sm"
		>
			<RadioListItem label={content.pills.trailing} value="selected" />
		</RadioList>
	</Card>
{/snippet}

<!--
	Product card body. In overlap mode upstream breaks the composer out over the
	image; that placement is where the omitted ChatComposer sat.
-->
{#snippet productCardEl()}
	<Card padding={4} class="product-card {stack ? 'stack-card' : `floater ${poseClass}`}">
		<VStack gap={4}>
			<div class={stack ? 'collage-product-body' : undefined}>
				<VStack gap={4}>
					<VStack gap={1}>
						<Heading level={2}>{content.product.title}</Heading>
						<Text type="body" color="secondary">
							<span class="product-description">{content.product.description}</span>
						</Text>
					</VStack>
					{#if stack}
						<!-- Collage: image grows to fill the card's stretched height. -->
						<div class="collage-image-fill">
							<img src={content.product.image} alt="" class="collage-image-abs" />
						</div>
					{:else}
						<div class="product-image-wrap">
							<div class="image-frame">
								<AspectRatio ratio={1}>
									<img src={content.product.image} alt="" class="image" />
								</AspectRatio>
							</div>
						</div>
					{/if}
				</VStack>
			</div>
		</VStack>
	</Card>
{/snippet}

{#snippet rewardCardEl()}
	<Card
		padding={0}
		class="feature-card {stack ? 'stack-card collage-reward-card' : `floater ${poseClass}`}"
	>
		{#if stack}
			<!-- Collage: image grows to fill the card's stretched height. -->
			<div class="collage-reward-image">
				<img src={content.feature.image} alt="" class="collage-image-abs" />
			</div>
		{:else}
			<AspectRatio ratio={1}>
				<img src={content.feature.image} alt="" class="image" />
			</AspectRatio>
		{/if}
		<div class="reward-footer">
			<VStack gap={2}>
				<HStack gap={2} hAlign="between" vAlign="center">
					<Text type="body" weight="semibold">{content.reward.label}</Text>
					<Text type="supporting" color="secondary">
						{content.reward.value}/{content.reward.total}
					</Text>
				</HStack>
				<ProgressBar
					label={content.reward.label}
					isLabelHidden
					value={content.reward.value}
					max={content.reward.total}
					variant="accent"
				/>
				<div class="profile-row">
					<HStack gap={2} vAlign="center">
						<Avatar src={REWARD_MEMBER_AVATAR} name={REWARD_MEMBER_NAME} size="sm" />
						<Text type="supporting" color="secondary">{REWARD_MEMBER_NAME}</Text>
					</HStack>
				</div>
			</VStack>
		</div>
	</Card>
{/snippet}

{#snippet buyCardEl()}
	<Card padding={3} class="buy-card {stack ? 'stack-card' : `floater ${poseClass}`}">
		<VStack gap={3}>
			<HStack gap={3} vAlign="center">
				<div class="buy-thumb-frame">
					<img src={content.mini.image} alt="" class="image" />
				</div>
				<div class="full-width">
					<VStack gap={1}>
						<Heading level={3}>{content.mini.title}</Heading>
						<Text type="supporting" color="secondary">
							<span class="buy-description">{content.mini.description}</span>
						</Text>
					</VStack>
				</div>
			</HStack>
			<Button variant="secondary" size="md" label="Add to cart" class="full-width" />
		</VStack>
	</Card>
{/snippet}

{#if stack}
	<!--
		Collage layout (narrow screens): CSS grid. Three areas reflow per tier:
		768–1023px → product | reward | side (the small items stacked in col 3);
		<768px → product | reward on top, side full width below. The side group is
		one flex column so its items keep a uniform gap (separate grid rows would
		stretch to the tall cards and look uneven).
	-->
	<div class="collage-bleed" aria-hidden="true" inert>
		<div class="collage">
			<div class="ga-product">{@render productCardEl()}</div>
			<div class="ga-reward">{@render rewardCardEl()}</div>
			<div class="ga-side">
				{@render buyCardEl()}
				<div class="collage-pill-row">
					{@render radioEl()}
					{@render badgeEl()}
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- Overlap layout (desktop): fixed art composition. -->
	<div class="stage" aria-hidden="true" inert>
		<!-- Leading pill -->
		<div class="floater pill-leading {poseClass}">{@render badgeEl()}</div>
		<!-- Trailing pill — a selected radio option wrapped in a pill card -->
		<div class="floater pill-trailing {poseClass}">{@render radioEl()}</div>
		{@render productCardEl()}
		{@render rewardCardEl()}
		{@render buyCardEl()}
	</div>
{/if}

<style>
	/* Desktop overlap stage: fixed, viewport-centred 1200px box (shared with the
	   aurora blobs) so cards track the blobs on resize. Capped to 100vw to avoid
	   horizontal scroll. Hidden <1024px, where the collage takes over. */
	.stage {
		position: fixed;
		top: var(--_app-shell-header-height, 0px);
		left: 50%;
		transform: translateX(-50%);
		width: min(1200px, 100vw);
		height: 1050px;
		pointer-events: none;
		display: none;
	}

	@media (min-width: 1024px) {
		.stage {
			display: block;
		}
	}

	/* Full-bleed wrapper so the inner grid can centre at 1200px. Its top gap is
	   set on a non-themed wrapper in the page (hero-collage-gap). */
	.collage-bleed {
		display: block;
		width: 100vw;
		margin-inline: calc(50% - 50vw);
	}

	@media (min-width: 1024px) {
		.collage-bleed {
			display: none;
		}
	}

	/* Narrow-screen collage grid. <768px: 2 cols (product|reward, side below);
	   768–1023px: 3 cols. Fixed-size box (see height) so a swap can't reflow the
	   page. */
	.collage {
		display: grid;
		/* Scale the collage down on mobile. `zoom` (not transform:scale) so the
		   laid-out box shrinks too — no reserved empty space below. */
		zoom: 0.8;
		grid-template-columns: 1fr 1fr;
		grid-template-areas: 'product reward' 'side side';
		/* Stretch so product/reward match the (taller) side column's height. */
		align-items: stretch;
		justify-content: center;
		text-align: start;
		/* Literal, not var(--spacing-4): the collage renders inside <Theme> where
		   other themes scale --spacing ~1.5×, so a token would differ per theme. */
		column-gap: 16px;
		row-gap: 16px;
		/* Fixed height so a swap can't reflow the page (image cells absorb
		   per-theme differences). */
		height: 665px;
		/* 2-col: side row is content-sized (`auto`), top cards take the rest
		   (`1fr`); the fixed height means `auto` can't grow the box. */
		grid-template-rows: minmax(0, 1fr) auto;
		width: 100%;
		max-width: 520px;
		margin-inline: auto;
		/* Literal, like the gaps above — a themed value would make column widths
		   differ per theme. */
		padding-inline: 24px;
		box-sizing: border-box;
		z-index: 0;
		pointer-events: none;
	}

	@media (min-width: 768px) {
		.collage {
			zoom: 0.9;
			grid-template-columns: 1fr 1fr 1fr;
			grid-template-areas: 'product reward side';
			/* 420px at 768–1023px fits the tallest theme's side column. */
			height: 420px;
			grid-template-rows: minmax(0, 1fr);
			max-width: 1200px;
		}
	}

	@media (min-width: 1024px) {
		.collage {
			zoom: 1;
			height: auto;
			grid-template-rows: none;
		}
	}

	.ga-product {
		grid-area: product;
		display: flex;
		min-width: 0;
		min-height: 0;
		text-align: start;
	}

	.ga-reward {
		grid-area: reward;
		display: flex;
		min-width: 0;
		min-height: 0;
		text-align: start;
	}

	/* Side column (buy card, pills). 3-col: stretch + space-between so it fills
	   the fixed-height row. 2-col: content-sized row, so it keeps the 16px gap. */
	.ga-side {
		grid-area: side;
		display: flex;
		flex-direction: column;
		align-self: stretch;
		justify-content: space-between;
		gap: 16px;
		min-width: 0;
		min-height: 0;
		text-align: start;
	}

	/* Radio + badge pills. 3-col: display:contents hoists them into the side
	   column's space-between distribution so their gap matches the cards. 2-col:
	   one centred row. */
	.collage-pill-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	@media (min-width: 768px) {
		.collage-pill-row {
			display: contents;
		}
	}

	/* Per-card reset in the collage: drop the overlap positioning + scaled pose. */
	.collage :global(.stack-card) {
		position: static;
		width: 100%;
		transform: none;
		opacity: 1;
	}

	.collage-product-body {
		height: 100%;
	}

	/* Image fills the card height (flex-basis:0 + absolutely-filled img,
	   min-height:0) so it's the flexible element that absorbs each theme's
	   text-height differences. */
	.collage-image-fill {
		position: relative;
		flex-grow: 1;
		flex-basis: 0;
		min-height: 0;
		overflow: hidden;
		border-radius: var(--radius-container);
	}

	.collage-image-abs {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.collage :global(.collage-reward-card) {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	/* See .collage-image-fill. */
	.collage-reward-image {
		position: relative;
		flex-grow: 1;
		flex-basis: 0;
		min-height: 0;
		overflow: hidden;
	}

	/* Shared base for the overlap-layout floating cards. */
	.stage :global(.floater) {
		position: absolute;
		transition-property: transform, opacity;
		transition-duration: var(--duration-slow, 600ms);
		transition-timing-function: var(--ease-standard, ease);
		will-change: transform, opacity;
		/* Cards scale from their top-left anchor so they don't drift on scale. */
		transform-origin: top left;
	}

	/* Overlap cards render at 0.85x (baked into the pose transforms). */
	.stage :global(.hidden-pose) {
		opacity: 0;
		transform: translateY(14px) scale(0.82);
	}

	.stage :global(.shown-pose) {
		opacity: 1;
		transform: translateY(0) scale(0.85);
	}

	/* Shared image helpers. */
	.image-frame {
		overflow: hidden;
		border-radius: var(--radius-container);
	}

	.image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* Description capped at two lines (truncates with an ellipsis). */
	.product-description {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}

	/* ── Overlap-layout positions (desktop). left % sits each card over its aurora
	   blob; the px tops/widths are art-directed. ────────────────────────────── */
	.stage :global(.product-card) {
		left: -8%;
		top: 340px;
		width: 312px;
		box-shadow: var(--shadow-high);
		border-width: 0;
		/* overflow visible so a breakout child can pass the card edge. */
		overflow: visible;
	}

	/* Relative so a breakout child can anchor to the image. */
	.product-image-wrap {
		position: relative;
	}

	.stage :global(.feature-card) {
		left: 88%;
		top: 380px;
		width: 304px;
		box-shadow: var(--shadow-high);
		border-width: 0;
		overflow: hidden;
	}

	/* Padding for the reward footer (the feature card is padding={0}). */
	.reward-footer {
		padding: var(--spacing-4);
	}

	.profile-row {
		margin-block-start: var(--spacing-2);
	}

	.stage :global(.pill-leading) {
		left: -11%;
		top: 304px;
	}

	.stage :global(.pill-trailing) {
		left: 104%;
		top: 326px;
	}

	/* Bare radio + label — no surface. Scoped under both layout roots rather than
	   left bare: an unanchored :global() would leak these declarations to every
	   page on the site. */
	.stage :global(.radio-pill-card),
	.collage :global(.radio-pill-card) {
		background-color: transparent;
		border-width: 0;
		box-shadow: none;
		white-space: nowrap;
		align-self: center;
	}

	@media (min-width: 768px) {
		.stage :global(.radio-pill-card),
		.collage :global(.radio-pill-card) {
			align-self: flex-start;
		}
	}

	.stage :global(.buy-card) {
		left: 80%;
		top: 480px;
		width: 248px;
		box-shadow: var(--shadow-high);
		border-width: 0;
	}

	.buy-thumb-frame {
		width: var(--spacing-12);
		height: var(--spacing-12);
		flex-shrink: 0;
		overflow: hidden;
		border-radius: var(--radius-container);
	}

	.full-width {
		width: 100%;
	}

	/* Same scoping reason as .radio-pill-card above — `full-width` is a name
	   generic enough that a bare :global() would be a site-wide hazard. */
	.stage :global(.full-width),
	.collage :global(.full-width) {
		width: 100%;
	}

	.buy-description {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		overflow: hidden;
	}
</style>
