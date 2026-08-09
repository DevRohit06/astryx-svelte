<script lang="ts">
	import { Theme } from '@astryx-svelte/core';
	import { getColorModeContext } from '$lib/shell/color-mode.svelte.js';
	import { THEME_LISTINGS, themeLabel } from '$lib/shell/theme-packages.js';

	/**
	 * The Themes bento tile's preview — a rail of every published theme, each
	 * showing its own declared colours and its own display face.
	 *
	 * **Not upstream's composition, and the reason is a missing template rather
	 * than a preference.** Upstream's `ThemesPreview` is a live `ThemeShowcaseStore`
	 * — the `theme-showcase` page template — scaled into a cropped window, beside a
	 * three-swatch rail and a cursive "Aa" in Butter's display face. The store is
	 * `page.tsx` and no page template is ported (TODO.md → Phase 5), so two thirds
	 * of that tile has no source here. Faking a storefront would be the invented
	 * demo content the parity rule forbids.
	 *
	 * What is left is the half upstream also shows — swatches and an "Aa" — turned
	 * from one theme into all eight, which is the fact this tile is for: the port
	 * ships eight theme packages and this is what each one looks like. Every value
	 * is read off the package's own `DefinedTheme`, so a theme's colours cannot
	 * drift from what it declares, and adding a ninth needs no edit here.
	 *
	 * Each row is wrapped in its own `<Theme>` so both the "Aa" and the swatches
	 * resolve from the theme layer — the swatch colours are `var(--color-…)` and
	 * not values read in JavaScript, which is what makes a row follow the reader's
	 * light/dark choice with no mode plumbing of its own. All eight packages are
	 * `__built`, so none of them injects a stylesheet.
	 *
	 * `themeMode` (not `mode`) is what `<Theme>` wants: it stays `'system'` until
	 * the preference resolves, so a first paint keeps `color-scheme: light dark`
	 * and every `light-dark()` token follows the OS. Reading the shared context
	 * rather than calling `useColorMode()` again is the standing rule here — the
	 * factory returns a new `$state` per caller.
	 */
	const colorMode = getColorModeContext();

	/** The swatch colours, in the order the rail shows them. */
	const SWATCH_TOKENS = ['--color-accent', '--color-background-body', '--color-background-card'];
</script>

<div class="root" inert>
	<ul class="rail">
		{#each THEME_LISTINGS as listing (listing.slug)}
			<li>
				<Theme theme={listing.theme} mode={colorMode.themeMode}>
					<span class="row">
						<span class="aa">Aa</span>
						<span class="name">{themeLabel(listing.slug)}</span>
						<span class="swatches">
							{#each SWATCH_TOKENS as token (token)}
								<span class="swatch" style="background: var({token})"></span>
							{/each}
						</span>
					</span>
				</Theme>
			</li>
		{/each}
	</ul>
</div>

<style>
	.root {
		width: 100%;
		max-width: 360px;
		margin-inline: auto;
		/* Decorative preview — never interactive, as every bento preview is. */
		pointer-events: none;
	}

	.rail {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/*
	 * `Theme` renders a `display: contents` wrapper, so the row inside it is the
	 * box that has to carry the layout and the paint — a rule on the `li` would
	 * be outside the theme scope and would resolve against the page's brand.
	 */
	.row {
		display: flex;
		gap: var(--spacing-2);
		align-items: center;
		padding: var(--spacing-2) var(--spacing-3);
		background-color: var(--color-background-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-container);
		color: var(--color-text-primary);
	}

	/* Upstream's "Aa" sets the family explicitly for the same reason: a theme
	   applies its display face to display-role text only. */
	.aa {
		flex-shrink: 0;
		width: 2ch;
		font-family: var(--font-family-display, var(--font-family-heading, inherit));
		font-size: var(--font-size-lg);
		line-height: 1;
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		font-size: var(--font-size-sm);
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.swatches {
		display: flex;
		flex-shrink: 0;
		gap: 3px;
	}

	.swatch {
		width: 14px;
		height: 14px;
		border: 1px solid var(--color-border-emphasized);
		border-radius: 3px;
	}
</style>
