import type { DefinedTheme } from '@astryx-svelte/core/theme';
import { butterTheme } from '@astryx-svelte/theme-butter';
import { chocolateTheme } from '@astryx-svelte/theme-chocolate';
import { gothicTheme } from '@astryx-svelte/theme-gothic';
import { liquidGlassTheme } from '@astryx-svelte/theme-liquid-glass';
import { matchaTheme } from '@astryx-svelte/theme-matcha';
import { neutralTheme } from '@astryx-svelte/theme-neutral';
import { stoneTheme } from '@astryx-svelte/theme-stone';
import { y2kTheme } from '@astryx-svelte/theme-y2k';
import themeRegistry from '$lib/generated/theme-registry.js';
import type { ThemePackage } from '$lib/generated/types.js';

/**
 * The eight published theme packages, resolved from slug to the theme object
 * itself — upstream's generated `themeRegistry`, keyed the way this port's
 * packages are named.
 *
 * **Imported from each package's root, not its `./tokens` subpath**, and that is
 * a size decision rather than a stylistic one. `hero-theme-content.ts` already
 * imports all eight roots for the landing hero, so `/themes` reuses the chunk
 * Rollup has already emitted instead of adding a second, near-identical copy of
 * the same data. The root export also carries `icons`, so a preview rendered
 * under one of these gets that theme's own glyphs — which the `./tokens` export
 * deliberately drops so plain Node can read it.
 *
 * Every one of them is `__built`, so `<Theme>` injects no stylesheet: the CSS
 * comes from the `theme.css` imports in `routes/+layout.svelte`, and a theme
 * missing from that list would render as an unstyled `data-astryx-theme`
 * attribute with no error. The list here and the list there are the same eight.
 */
const THEMES_BY_SLUG: Record<string, DefinedTheme> = {
	butter: butterTheme,
	chocolate: chocolateTheme,
	gothic: gothicTheme,
	'liquid-glass': liquidGlassTheme,
	matcha: matchaTheme,
	neutral: neutralTheme,
	stone: stoneTheme,
	y2k: y2kTheme
};

/**
 * Upstream's `THEME_ORDER` — "most restrained → most expressive", as its own
 * comment puts it — with the two packages it has no row for appended
 * alphabetically, which is upstream's stated fallback rule ("any theme not in
 * this list falls to the end alphabetically").
 *
 * `chocolate` is one of those two upstream as well: its docsite depends on six
 * packages and orders six. `liquid-glass` is this port's own (TODO.md → Known
 * debts), so no upstream order could have covered it.
 */
const THEME_ORDER = ['neutral', 'stone', 'gothic', 'matcha', 'y2k', 'butter'];

function rank(slug: string): number {
	const index = THEME_ORDER.indexOf(slug);
	return index === -1 ? THEME_ORDER.length : index;
}

/** A registry row with its theme object attached. */
export interface ThemeListing extends ThemePackage {
	theme: DefinedTheme;
	/**
	 * How many of the theme's own token declarations carry a `[light, dark]`
	 * pair. **Zero means the theme is single-mode** — `gothic` is dark-only, and
	 * upstream emits no `html[data-theme=…]` block for it at all. Read off the
	 * object rather than tabulated, so it cannot go stale.
	 */
	lightDarkPairs: number;
	/** Token declarations the theme sets, of core's 184-name vocabulary. */
	tokenCount: number;
	/** Components the theme restyles through `themeProps()`. */
	componentCount: number;
}

/** Every listing, in upstream's gallery order. */
export const THEME_LISTINGS: ThemeListing[] = themeRegistry
	.map((entry) => {
		const theme = THEMES_BY_SLUG[entry.slug];
		if (!theme) {
			// The generated registry scans `packages/themes/*`; this map is written by
			// hand because a static import cannot be built from a runtime string. A
			// new package therefore lands in the registry first and here second, and
			// silently rendering it as "missing" would hide that — so it throws, on
			// `requireDocModules`' rule.
			throw new Error(
				`[docs] theme package "${entry.slug}" is in the generated registry but has no ` +
					`import in theme-packages.ts. Add it there and to the theme.css list in ` +
					`routes/+layout.svelte — without the stylesheet it renders unthemed with no error.`
			);
		}

		const tokens = Object.values(theme.tokens ?? {});
		return {
			...entry,
			theme,
			lightDarkPairs: tokens.filter((value) => Array.isArray(value)).length,
			tokenCount: tokens.length,
			componentCount: Object.keys(theme.components ?? {}).length
		};
	})
	.sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug));

/** `neutral` — upstream's `DEFAULT_THEME_PACKAGE`, and the first listing. */
export const DEFAULT_THEME_SLUG = 'neutral';

/**
 * Upstream strips "Theme: " / " Theme" off the registered display name so the
 * picker reads as the wordmark. This port's registry has no display name, so the
 * label is derived from the slug the same way the CLI prints it.
 */
export function themeLabel(slug: string): string {
	return slug
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}
