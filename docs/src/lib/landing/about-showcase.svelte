<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Heading, Link, Text, VStack } from '@astryx-svelte/core';
	import coverage from '$lib/generated/coverage.js';
	import docsRegistry from '$lib/generated/docs-registry.js';
	import themeRegistry from '$lib/generated/theme-registry.js';
	import { REPO_URL } from '../shell/nav-items.js';
	import { topicHref } from '../shell/links.js';

	/**
	 * Editorial "about" section, ported from upstream's `_landing/AboutShowcase.tsx`.
	 *
	 * A left-anchored heading block sits alongside three feature columns. Each
	 * column leads with a small pastel decorative shape, then a bold title, body
	 * copy, and a "→" CTA link. The four blocks share a single CSS grid so they
	 * snap to a clean layout at ≥1024px and reflow into a single stacked column
	 * below that. Upstream skips an intermediate 2-col breakpoint on purpose —
	 * with 1 heading + 3 features, a 2-col grid produces an awkward orphan column
	 * on the last row.
	 *
	 * **The heading block is not upstream's copy, and that is deliberate.**
	 * Upstream reads "Astryx powers over 13,000 apps" over "Astryx has grown
	 * inside Meta over the last eight years, shaped by the engineers, designers,
	 * and product teams who depend on it every day." That is Meta making an
	 * institutional claim about its own system, and this port is unofficial and
	 * not affiliated with Meta — printing it here would assert Meta's adoption
	 * numbers and history in this project's voice. `site-footer.svelte` already
	 * made exactly this call for Meta's social and legal blocks (TODO.md →
	 * Release & governance); this is the same rule applied to the same kind of
	 * content. The three columns below are transcribed verbatim, because they are
	 * product copy about the design system rather than claims about its owner.
	 *
	 * Two CTAs are also repointed: upstream's `/community` and `/changelog` are
	 * outside the v1 cut, and `nav-items.ts` records why a link to a 404 is worse
	 * than a link that resolves. They point at this port's repository and its
	 * releases — the real destinations for the same intent.
	 */

	// Decorative shape fills — pulled from the categorical (non-semantic)
	// background tokens so the shapes pick up each theme's pink / purple / yellow
	// ramp automatically and invert for dark mode without hand-rolled palettes.
	// These tokens are 33% alpha pastel washes by default, which read perfectly as
	// soft decorative blobs on the white showcase surface, and any theme can
	// retint them centrally without touching this file.
	const PINK_PASTEL = 'var(--color-background-pink)';
	const LAVENDER_PASTEL = 'var(--color-background-purple)';
	const YELLOW_PASTEL = 'var(--color-background-yellow)';

	const SHAPE_SIZE = 40;

	const RELEASES_URL = `${REPO_URL}/releases`;

	/**
	 * What this port has, counted by the build.
	 *
	 * Every figure comes out of `src/lib/generated/` — `coverage.js` is written by
	 * the same reconciliation that types the props tables, `docs-registry.js` is
	 * the reference topics it read, and `theme-registry.js` is a scan of
	 * `packages/themes/*`. Nothing here is a literal, which is the point: a number
	 * typed into marketing copy is a number that is wrong by the next batch.
	 *
	 * "documented components" is the whole registry — 26 of the entries are hooks,
	 * which the gallery excludes and this count does not, because upstream's
	 * `upstreamComponents` denominator counts them too and a ratio has to compare
	 * like with like.
	 */
	const COVERAGE_STATS = [
		{
			value: `${coverage.documentedComponents}/${coverage.upstreamComponents}`,
			label: 'documented components'
		},
		{ value: `${coverage.examplesPorted}`, label: 'example blocks' },
		{ value: `${themeRegistry.length}`, label: 'theme packages' },
		{ value: `${docsRegistry.length}`, label: 'reference topics' }
	];
</script>

<!--
	All three decorative shapes are upstream's, verbatim: a 16-bump rounded
	flower/blob, a pillow-shaped rounded square with concave sides, and a
	rounded-corner diamond, each at SHAPE_SIZE on the viewBox the path math
	assumes.

	Mapping (shape -> categorical token):
	  blob    (pink)     "Design for speed"
	  cloud   (lavender) "Built by the people who use it"
	  diamond (yellow)   "Ready for what's next"
-->
{#snippet pinkBlobShape()}
	<svg width={SHAPE_SIZE} height={SHAPE_SIZE} viewBox="0 0 40 40" fill="none" aria-hidden="true">
		<path
			fill={PINK_PASTEL}
			d="M17.081 1.19166C18.7027 -0.397219 21.2973 -0.397219 22.919 1.19166C23.9616 2.21324 25.4625 2.61539 26.8763 2.25201C29.0751 1.68683 31.3221 2.98415 31.9321 5.17099C32.3243 6.57703 33.423 7.67574 34.829 8.06792C37.0159 8.67788 38.3132 10.9249 37.748 13.1237C37.3846 14.5375 37.7868 16.0384 38.8083 17.081C40.3972 18.7027 40.3972 21.2973 38.8083 22.919C37.7868 23.9616 37.3846 25.4625 37.748 26.8763C38.3132 29.0751 37.0159 31.3221 34.829 31.9321C33.423 32.3243 32.3243 33.423 31.9321 34.829C31.3221 37.0159 29.0751 38.3132 26.8763 37.748C25.4625 37.3846 23.9616 37.7868 22.919 38.8083C21.2973 40.3972 18.7027 40.3972 17.081 38.8083C16.0384 37.7868 14.5375 37.3846 13.1237 37.748C10.9249 38.3132 8.67788 37.0159 8.06792 34.829C7.67574 33.423 6.57703 32.3243 5.17099 31.9321C2.98415 31.3221 1.68683 29.0751 2.25201 26.8763C2.61539 25.4625 2.21324 23.9616 1.19166 22.919C-0.397219 21.2973 -0.397219 18.7027 1.19166 17.081C2.21324 16.0384 2.61539 14.5375 2.25201 13.1237C1.68683 10.9249 2.98415 8.67788 5.17099 8.06792C6.57703 7.67574 7.67574 6.57703 8.06792 5.17099C8.67788 2.98415 10.9249 1.68683 13.1237 2.25201C14.5375 2.61539 16.0384 2.21324 17.081 1.19166Z"
		></path>
	</svg>
{/snippet}

{#snippet lavenderCloudShape()}
	<svg width={SHAPE_SIZE} height={SHAPE_SIZE} viewBox="0 0 40 40" fill="none" aria-hidden="true">
		<path
			fill={LAVENDER_PASTEL}
			d="M33.0469 0C36.8869 0.00014921 39.9999 3.11308 40 6.95312C40 9.9458 38.109 12.4963 35.457 13.4766C38.109 14.4568 39.9999 17.0074 40 20C40 22.9927 38.109 25.5431 35.457 26.5234C38.109 27.5037 39.9999 30.0542 40 33.0469C40 36.887 36.887 39.9998 33.0469 40H6.95312C3.113 39.9999 0 36.887 0 33.0469C9.21712e-05 30.0545 1.89042 27.5039 4.54199 26.5234C1.89043 25.5429 0 22.9924 0 20C9.21712e-05 17.0077 1.89042 14.457 4.54199 13.4766C1.89043 12.496 0 9.94549 0 6.95312C0.000107288 3.11307 3.11307 0.000125546 6.95312 0H33.0469Z"
		></path>
	</svg>
{/snippet}

{#snippet yellowDiamondShape()}
	<svg width={SHAPE_SIZE} height={SHAPE_SIZE} viewBox="0 0 40 40" aria-hidden="true">
		<rect
			x={6}
			y={6}
			width={28}
			height={28}
			rx={6}
			fill={YELLOW_PASTEL}
			transform="rotate(45 20 20)"
		></rect>
	</svg>
{/snippet}

{#snippet aboutColumn(
	title: string,
	description: string,
	ctaLabel: string,
	ctaHref: string,
	shape: Snippet,
	isExternal: boolean
)}
	<!--
		Upstream's `VStack gap={3} xstyle={styles.column}`: the alignment and the
		width are one box. Wrapping the Stack in a styled div leaves `align-items`
		on the Stack and the sizing outside it, so the column stops being
		flush-left. Plain flex element instead — see the component docstring.
	-->
	<div class="column">
		<span class="shape-slot">{@render shape()}</span>
		<VStack gap={2}>
			<Heading level={2} color="primary">{title}</Heading>
			<Text type="body" color="primary">{description}</Text>
		</VStack>
		<div class="cta">
			<Link
				type="body"
				color="primary"
				href={ctaHref}
				hasUnderline={false}
				target={isExternal ? '_blank' : undefined}
			>
				{ctaLabel}
			</Link>
		</div>
	</div>
{/snippet}

<section class="about-section">
	<!--
		sectionLayout / grid / columnsGrid are kept as plain <div>s because each is
		a CSS-grid container with responsive grid-template-columns. `Grid` hardcodes
		a single integer column count and a single gap, so it can't express the
		1fr-stack → 1fr/2fr → repeat(3, 1fr) responsive patterns this section needs.
	-->
	<div class="section-layout">
		<div class="grid">
			<div class="heading-block">
				<Heading level={2} type="display-2" color="primary">
					A faithful port, checked by machine
				</Heading>
				<Text type="large" weight="normal" color="secondary">
					Every component is authored against the same StyleX token references Astryx uses, so the
					compiler emits byte-identical CSS — fidelity is proven by two oracles rather than by
					review.
				</Text>
				<!--
					Upstream's slot for "Astryx powers over 13,000 apps". That claim is
					Meta's and cannot be reused (see the docstring); what belongs in its
					place is what a *port* can state about itself — its coverage. Every
					figure is read from a generated registry rather than written down, so
					none of them can go stale: the build is what counts them.
				-->
				<dl class="coverage">
					{#each COVERAGE_STATS as stat (stat.label)}
						<div class="stat">
							<dt><Text type="display-3" weight="bold" color="primary">{stat.value}</Text></dt>
							<dd><Text type="supporting" color="secondary">{stat.label}</Text></dd>
						</div>
					{/each}
				</dl>
			</div>
			<div class="columns-grid">
				{@render aboutColumn(
					'Design for speed',
					'Foundations you can trust, speed you can feel. The system is built so teams stop reinventing the basics and start shipping the ideas that matter.',
					'Get started in minutes →',
					topicHref('getting-started'),
					pinkBlobShape,
					false
				)}
				{@render aboutColumn(
					'Built by the people who use it',
					'The system gets sharper when we put it to work in the real world. Using it in context strengthens the whole system for everyone.',
					'Learn how to contribute →',
					REPO_URL,
					lavenderCloudShape,
					true
				)}
				{@render aboutColumn(
					"Ready for what's next",
					'The quality bar is accelerating. Astryx pairs opinionated foundations with flexible patterns so your system keeps pace, no matter how the craft evolves.',
					"See what's new →",
					RELEASES_URL,
					yellowDiamondShape,
					true
				)}
			</div>
		</div>
	</div>
</section>

<style>
	/* Upstream's `VStack as="section" align="center" width="100%"`. Declared here
	   rather than left on a Stack: see the component docstring — where upstream
	   hangs `xstyle` on a Stack, wrapping it in a styled div splits the alignment
	   from the sizing and the layout drifts. */
	.about-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}

	/* Cap the section so all the home showcases line up vertically inside the
	   showcase overlay container. */
	.section-layout {
		width: 100%;
		max-width: var(--docs-content-max-width);
	}

	/*
	 * Responsive grid for the heading + 3 feature columns.
	 *
	 *   < 1024px  -> 1 column (everything stacks vertically)
	 *   >= 1024px -> heading 1fr | 3-feature-grid 2fr side-by-side
	 *
	 * The intermediate 2-col arrangement is skipped because at 720–1023 the
	 * 1fr / 2fr split squishes each sub-column to ~150px, which makes the body
	 * copy unreadable. Going straight from 1-col stack to the full desktop layout
	 * keeps the design legible at every width.
	 */
	.grid {
		width: 100%;
		display: grid;
		gap: var(--spacing-8);
		grid-template-columns: 1fr;
	}

	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: 1fr 2fr;
		}
	}

	/* Inner sub-grid for the three feature columns — split evenly inside the 2/3
	   cell on the right of the parent grid. Same breakpoint as the outer grid so
	   the stack/3-col switch happens together. */
	.columns-grid {
		display: grid;
		gap: var(--spacing-8);
		grid-template-columns: 1fr;
	}

	@media (min-width: 1024px) {
		.columns-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* Each feature column: shape on top, then a small gap, then title, body, and
	   link. Always flush-left at every viewport — at desktop it reads as a
	   side-by-side editorial layout; at mobile the columns stack vertically but
	   stay left-aligned for consistency. `gap` and the flex are upstream's
	   `VStack gap={3}`; `align-items` is its `xstyle`. */
	.column {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3);
		width: 100%;
		align-items: flex-start;
		text-align: start;
	}

	/* Mobile centring for the section heading + description block. Same breakpoint
	   as the column stack — when everything is in a single vertical column, the
	   eye expects centred content; the start-aligned look only makes sense in the
	   side-by-side grid. Upstream's `VStack gap={4}` + `styles.headingBlock`. */
	.heading-block {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4);
		width: 100%;
		align-items: center;
		text-align: center;
	}

	@media (min-width: 1024px) {
		.heading-block {
			align-items: flex-start;
			text-align: start;
		}
	}

	/*
	 * The coverage figures. A `<dl>` because each one is a value with its label —
	 * `auto-fit` so it is four across beside a wide column and two across when the
	 * heading block goes full width below 1024px.
	 */
	.coverage {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: var(--spacing-4);
		width: 100%;
		margin: var(--spacing-2) 0 0;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stat dd {
		margin: 0;
	}

	/* Decorative shape slot — fixed 40x40 box so the SVG renders at the expected
	   size and the column header sits at a consistent baseline across all three
	   feature columns. A raw <span> because core has no primitive for "fixed-size
	   inline-block decorative SVG wrapper" (Icon is glyph-only and bound to its
	   registry; Thumbnail is attachment chrome). The wrapper exists purely to
	   reserve space and clip the shape — there is no semantic content here. */
	.shape-slot {
		width: 40px;
		height: 40px;
		display: block;
		flex-shrink: 0;
	}

	/* Bump the CTA away from the body text. The VStack gap holds title↔body at
	   8px; the CTA wants more breathing room (16px) so the link reads as a
	   separate action zone rather than part of the paragraph. */
	.cta {
		margin-top: var(--spacing-2);
	}
</style>
