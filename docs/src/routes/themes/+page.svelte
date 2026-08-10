<script lang="ts">
	import Seo from '$lib/seo/seo.svelte';
	import {
		Card,
		CodeBlock,
		Divider,
		Heading,
		Section,
		SelectableCard,
		Selector,
		Text,
		Theme,
		ToggleButton,
		ToggleButtonGroup,
		VStack
	} from '@astryx-svelte/core';
	import ThemeTokenGrid, { tokenValue } from '$lib/shell/theme-token-grid.svelte';
	import ThemePreviewBlocks from '$lib/shell/theme-preview-blocks.svelte';
	import {
		DEFAULT_THEME_SLUG,
		THEME_LISTINGS,
		themeLabel,
		type ThemeListing
	} from '$lib/shell/theme-packages.js';

	/**
	 * The themes browser — upstream's `/themes`, which is a single explorer page
	 * rather than one route per theme: a picker down the left, a live preview and
	 * the theme's own data on the right.
	 *
	 * **What is upstream's, and what is not.** The shape is upstream's
	 * `ThemePackagePage`: the 260px sticky rail of `SelectableCard`s in
	 * `THEME_ORDER`, the `Selector` that replaces it below 900px, the light/dark
	 * toggle over the preview, and the install block. What upstream puts *in* the
	 * preview is `ThemeShowcaseStore` — a page template out of
	 * `packages/cli/assets/templates/pages/theme-showcase/`, whose source is
	 * `page.tsx`. No page template is ported (TODO.md → Phase 5), so there is
	 * nothing to render there and inventing a storefront would be exactly the
	 * hand-drawn demo content the parity rule forbids. The preview shows upstream's
	 * own **showcase blocks** instead — the same files the component pages render,
	 * restyled by the selected theme. It returns to the store when the template
	 * does.
	 *
	 * Upstream's per-theme banner artwork is also absent: it is served from Meta's
	 * CDN (`lookaside.facebook.com/assets/astryx`), and a port has no claim on it.
	 * The rail shows each theme's own declared colours instead, which is data the
	 * package ships.
	 *
	 * **The mode toggle is per-preview, not the site's.** Upstream's is too (its
	 * own Sun/Moon pair over the preview pane), and here it carries a second job:
	 * `gothic` declares no `[light, dark]` pair at all — it is a dark-only theme,
	 * and upstream emits no `html[data-theme=…]` block for it — so the toggle
	 * disables itself rather than offering a light mode the theme does not have.
	 */
	let slug = $state(DEFAULT_THEME_SLUG);
	let previewMode = $state<'light' | 'dark'>('light');

	const selected = $derived(
		THEME_LISTINGS.find((listing) => listing.slug === slug) ?? THEME_LISTINGS[0]
	);

	/** A single-mode theme has one appearance; the toggle would be a lie. */
	const hasBothModes = $derived(selected.lightDarkPairs > 0);
	const mode = $derived<'light' | 'dark'>(hasBothModes ? previewMode : 'dark');

	const options = $derived(
		THEME_LISTINGS.map((listing) => ({ value: listing.slug, label: themeLabel(listing.slug) }))
	);

	/** The four colours the rail swatch shows, in the order it shows them. */
	const SWATCH_TOKENS = [
		'--color-accent',
		'--color-background-body',
		'--color-background-card',
		'--color-text-primary'
	];

	/**
	 * The rail always previews its swatches in **light**, except for a theme that
	 * has no light side. Reading `mode` here would repaint every card whenever the
	 * preview toggled, which makes the picker look like it is switching too.
	 */
	function swatchMode(listing: ThemeListing): 'light' | 'dark' {
		return listing.lightDarkPairs > 0 ? 'light' : 'dark';
	}

	const installSnippet = $derived(`npm install ${selected.package}`);
	const usageSnippet = $derived(
		`import { Theme } from '@astryx-svelte/core';\n` +
			`import { ${camelName(selected.slug)}Theme } from '${selected.package}';\n` +
			`import '${selected.package}/theme.css';`
	);

	/** `liquid-glass` → `liquidGlass`, the export each package publishes. */
	function camelName(value: string): string {
		return value.replace(/-(.)/g, (_match, character: string) => character.toUpperCase());
	}
</script>

<Seo
	title="Themes"
	description="Eight installable themes for Svelte 5 — swap one import and 184 design tokens restyle every component. Preview each one live before you install."
/>

<Section maxWidth={1200} padding={6} style="margin-inline: auto;">
	<VStack gap={10}>
		<VStack gap={2}>
			<Heading level={1} type="display-1" justify="center">Themes</Heading>
			<Text type="large" weight="normal" color="secondary" justify="center">
				Browse and preview every theme and see how design tokens, type, and components restyle
				across the library.
			</Text>
		</VStack>

		<div class="themes-row">
			<!-- Upstream's sidebar. Below 900px it is display:none and the Selector
			     below takes over; both are always rendered, so the server's HTML is
			     right at every width rather than right at one. -->
			<aside class="theme-rail" aria-label="Themes">
				<VStack gap={2}>
					{#each THEME_LISTINGS as listing (listing.slug)}
						<SelectableCard
							label={themeLabel(listing.slug)}
							isSelected={listing.slug === slug}
							onChange={() => (slug = listing.slug)}
							padding={3}
						>
							<VStack gap={2}>
								<Text type="body" weight="medium">{themeLabel(listing.slug)}</Text>
								<span class="rail-swatches">
									{#each SWATCH_TOKENS as token (token)}
										<span
											class="rail-swatch"
											style="background: {tokenValue(listing.theme, token, swatchMode(listing))}"
										></span>
									{/each}
								</span>
							</VStack>
						</SelectableCard>
					{/each}
				</VStack>
			</aside>

			<div class="theme-pane">
				<VStack gap={6}>
					<div class="theme-selector">
						<Selector
							label="Theme"
							{options}
							value={slug}
							onChange={(value: string | null) => (slug = value ?? DEFAULT_THEME_SLUG)}
							width="100%"
						/>
					</div>

					<VStack gap={2}>
						<Heading level={2} type="display-3">{themeLabel(selected.slug)}</Heading>
						<Text type="body" color="secondary">{selected.description}</Text>
						<Text type="supporting" color="secondary">
							{selected.package} · {selected.tokenCount} tokens ·
							{selected.componentCount} component override{selected.componentCount === 1 ? '' : 's'} ·
							{#if selected.lightDarkPairs > 0}
								{selected.lightDarkPairs} light/dark pairs
							{:else}
								single mode
							{/if}
						</Text>
						{#if selected.upstreamPackage}
							<Text type="supporting" color="secondary">
								Ported from {selected.upstreamPackage}; every declaration is diffed against it by
								the theme oracle.
							</Text>
						{:else}
							<!-- The one package in the set that ports nothing. Saying so is the
							     whole reason `upstreamPackage` is generated rather than assumed —
							     see TODO.md → Known debts. -->
							<Text type="supporting" color="secondary">
								This theme has no upstream Astryx counterpart. It is this port's own, built on the
								published <code>defineTheme</code> extension point, and adds no component, prop or variant
								to the library.
							</Text>
						{/if}
					</VStack>

					<VStack gap={2}>
						<Text type="body" weight="medium">Install</Text>
						<CodeBlock
							code={installSnippet}
							language="bash"
							width="100%"
							container="section"
							hasCopyButton
						/>
						<CodeBlock
							code={usageSnippet}
							language="typescript"
							width="100%"
							container="section"
							hasCopyButton
						/>
					</VStack>

					<Divider />

					<VStack gap={3}>
						<div class="preview-header">
							<Heading level={3}>Preview</Heading>
							<ToggleButtonGroup
								label="Preview colour mode"
								value={mode}
								size="sm"
								isDisabled={!hasBothModes}
								onChange={(value: string | null) => {
									if (value === 'light' || value === 'dark') previewMode = value;
								}}
							>
								<ToggleButton value="light" label="Light" />
								<ToggleButton value="dark" label="Dark" />
							</ToggleButtonGroup>
						</div>
						{#if !hasBothModes}
							<Text type="supporting" color="secondary">
								{themeLabel(selected.slug)} declares no light/dark pairs — it is a single-mode theme,
								so the toggle has nothing to switch.
							</Text>
						{/if}
						<!-- A nested `<Theme>`: the root layout themes the page in the docs
						     brand, and this re-themes only the preview. Every package is
						     `__built`, so nothing is injected here — the CSS comes from the
						     `theme.css` imports in `routes/+layout.svelte`. -->
						<Card variant="muted" padding={0}>
							<Theme theme={selected.theme} {mode}>
								<div class="preview-surface">
									<ThemePreviewBlocks />
								</div>
							</Theme>
						</Card>
					</VStack>

					<Divider />

					<VStack gap={3}>
						<VStack gap={1}>
							<Heading level={3}>Declared tokens</Heading>
							<Text type="supporting" color="secondary">
								The {selected.tokenCount} token names this package overrides, of core's vocabulary. Values
								are the ones declared for {mode} mode.
							</Text>
						</VStack>
						<ThemeTokenGrid theme={selected.theme} {mode} />
					</VStack>
				</VStack>
			</div>
		</div>
	</VStack>
</Section>

<style>
	/* Upstream's two-column container: fixed rail, flexible pane,
	   `align-items: flex-start` so the sticky rail measures from the row top. */
	.themes-row {
		display: flex;
		flex-direction: row;
		gap: var(--spacing-6);
		align-items: flex-start;
		width: 100%;
	}

	.theme-rail {
		position: sticky;
		top: calc(var(--appshell-header-height, 56px) + var(--spacing-4));
		flex-shrink: 0;
		width: 260px;
	}

	.theme-pane {
		flex: 1;
		/* Without this the pane refuses to shrink below its widest child and the
		   token grid pushes the whole page into horizontal scroll. */
		min-width: 0;
	}

	.theme-selector {
		display: none;
	}

	/* Upstream's `SIDEBAR_QUERY`. */
	@media (max-width: 900px) {
		.theme-rail {
			display: none;
		}

		.theme-selector {
			display: block;
		}
	}

	.rail-swatches {
		display: flex;
		gap: 4px;
	}

	.rail-swatch {
		width: 20px;
		height: 20px;
		border: 1px solid var(--color-border-emphasized);
		border-radius: var(--radius-sm, 4px);
	}

	.preview-header {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-3);
		align-items: center;
		justify-content: space-between;
	}

	/* The themed surface itself. `Theme` renders a `display: contents` wrapper, so
	   the background has to be painted by something inside it — this element —
	   rather than by the `Card` outside, which is in the docs brand. */
	.preview-surface {
		padding: var(--spacing-5);
		background-color: var(--color-background-body);
		border-radius: var(--radius-container);
		/* Several themes carry a display face; without this the preview inherits
		   the docs brand's body font and the type half of the theme is invisible. */
		font-family: var(--font-family-base);
		color: var(--color-text-primary);
	}
</style>
