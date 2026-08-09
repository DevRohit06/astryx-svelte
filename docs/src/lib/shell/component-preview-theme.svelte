<script module lang="ts">
	import { registerIcons, Theme } from '@astryx-svelte/core';
	import { neutralTheme } from '@astryx-svelte/theme-neutral';

	/**
	 * Register the neutral registry's icons at **module load**, which is where
	 * upstream puts it and for upstream's reason: `globalIconRegistry` is module
	 * state, so a warm server process can already hold one theme's icons while a
	 * freshly-hydrating client starts from the bundled defaults. `Theme` registers
	 * at render time, which is too late to stop the first paint disagreeing — an
	 * `Icon` that renders before that call resolves to a different glyph, and
	 * upstream names the `strokeWidth` mismatch specifically. Doing it on import
	 * makes both sides start from the same registry.
	 */
	if (neutralTheme.icons) {
		registerIcons(neutralTheme.icons);
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getColorModeContext } from './color-mode.svelte.js';

	/**
	 * The neutral preview boundary — upstream's `ComponentPreviewTheme`.
	 *
	 * **Every live preview on this site renders under `neutralTheme`, not the
	 * site's own brand theme**, and that is the entire point of the component. The
	 * root layout themes the site with `astryxTheme` — pill buttons, a near-black
	 * accent, +4px radii, Figtree — but a reader looking at a `Button` example
	 * needs to see what `@astryx-svelte/core` ships under the theme they will
	 * actually install, not the docsite's brand skin. Upstream draws that line and
	 * reaches for it at every preview surface: `ComponentDetailClient`,
	 * `ExampleBlock`, `InteractivePreview` (three returns), `ShowcaseThumbnail`,
	 * `TemplateThumbnail` and `TemplatePreviewSurface`.
	 *
	 * This port had dropped all of them, and three files justified it in as many
	 * words — "a second identical boundary would be a no-op". The premise was
	 * false: the ambient theme is `astryxTheme` and this boundary is
	 * `neutralTheme`, so it *changes* the theme rather than repeating it. The
	 * effect was that every example, gallery tile and template on the site
	 * rendered in the brand skin.
	 *
	 * It carries a second, quieter job that upstream documents: the boundary
	 * re-declares the type-scale tokens, so `/components/[name]`'s Overview prose
	 * override (`--text-body-size` 16px, `--text-body-leading` 1.75) cannot leak
	 * into a preview.
	 *
	 * `<Theme>` renders a `display: contents` wrapper, which is what lets this sit
	 * inside `showcase-thumbnail`'s scaled box and the template dialog's frame
	 * without adding a layout box to either.
	 *
	 * `mode` is `themeMode`, not `mode`: the raw, system-aware value `<Theme>`
	 * wants, so a preview stays on `'system'` until the reader picks a side —
	 * exactly as the root layout's `<Theme>` does.
	 */
	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();

	const colorMode = getColorModeContext();
</script>

<Theme theme={neutralTheme} mode={colorMode.themeMode}>{@render children()}</Theme>
