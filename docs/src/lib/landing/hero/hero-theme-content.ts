/**
 * @file hero-theme-content.ts
 * @input the docsite theme registry + the local Astryx theme
 * @output an ordered list of {theme, label, content} slides the hero cycles
 * @position Home hero — single source of truth for the theming showcase reel.
 *
 * Per-theme content (copy + product photos) for the reel's cards, plus the
 * curated theme list/order (REEL_THEMES) and per-theme aurora/wordmark/mode.
 *
 * Ported from upstream's `app/(site)/_landing/hero/heroThemeContent.ts`.
 *
 * **The reel now resolves every slide upstream's does.** `themeFor()` returns
 * `null` for a theme package that is not installed and the reel skips it —
 * upstream wrote that branch, and this port used to exercise it while the theme
 * packages were unported. All five curated themes are installed now, so the
 * branch is dead code kept for parity, and the prediction that porting a package
 * would be a single line in `THEME_OBJECTS` held: the copy, photos and aurora
 * were already written.
 *
 * **`THEME_OBJECTS` is not the reel.** It mirrors upstream's *generated* theme
 * registry, which is built from every `@astryxdesign/theme-*` in the docsite's
 * dependencies; `REEL_THEMES` below is a separate, shorter, hand-curated list.
 * Neutral, Chocolate and Stone are installed and therefore in the registry, and
 * have no slide — which is Stone's standing upstream too. The tables under
 * `REEL_THEMES` are keyed to slides, so those three are absent from them by
 * design; upstream ships Stone the same way, with a registry entry and not one
 * row of card copy, aurora, label or font.
 *
 * **One slide is not upstream's: `liquid-glass`.** It rides the same
 * local-theme seam the `astryx` brand slide does — a sentinel name, an entry in
 * each table, a branch in `themeFor()` — rather than a fabricated
 * `@astryxdesign/*` key, so nothing in this file claims upstream publishes a
 * theme it does not. See port/todo.md, Known debts.
 */

import type { DefinedTheme } from '@astryx-svelte/core/theme';
import { butterTheme } from '@astryx-svelte/theme-butter';
import { chocolateTheme } from '@astryx-svelte/theme-chocolate';
import { gothicTheme } from '@astryx-svelte/theme-gothic';
import { liquidGlassTheme } from '@astryx-svelte/theme-liquid-glass';
import { matchaTheme } from '@astryx-svelte/theme-matcha';
import { neutralTheme } from '@astryx-svelte/theme-neutral';
import { stoneTheme } from '@astryx-svelte/theme-stone';
import { y2kTheme } from '@astryx-svelte/theme-y2k';
import { astryxTheme } from '../../themes/astryx-theme.js';
import { BRAND } from '../constants.js';

// Sentinel for the docsite's local brand theme (not a theme package).
const ASTRYX = 'astryx';

/**
 * Sentinel for `@astryx-svelte/theme-liquid-glass`, which has **no upstream
 * package name** to key on — it is this port's one deliberate non-upstream
 * theme (port/todo.md, Known debts).
 *
 * It rides the same seam `ASTRYX` does rather than being forced into
 * `THEME_OBJECTS`: that map is keyed by upstream's identifiers on purpose, so
 * that porting a theme package is one line and every table below already holds
 * its data. A local theme has no such key, and inventing one — a fictional
 * `@astryxdesign/theme-liquid-glass` — would make the map lie about what
 * upstream publishes.
 */
const LIQUID_GLASS = 'liquid-glass';

/**
 * Installed theme packages, keyed by **upstream's** package name.
 *
 * Upstream generates this registry from every `@astryxdesign/theme-*` in the
 * app's dependencies. This port keys its own packages under upstream's names
 * deliberately: every table in this file is upstream's data, indexed by
 * upstream's identifiers, so porting a theme package is one line here and the
 * reel picks it up with no other edit.
 *
 * That prediction held. The four curated reel themes landed together and this
 * map was the only change the reel needed — the content, aurora, wordmark,
 * dark-mode and label tables were already complete for all five.
 *
 * Chocolate and Stone are here for the same mechanical reason upstream's
 * generator would put them here — they are installed — and for no other. They
 * are **not** in `REEL_THEMES`, so `themeFor()` is never called with their
 * names and these two entries are inert. That is deliberate: upstream depends on
 * `@astryxdesign/theme-stone` and still gives it no slide, and the alternative
 * (a slide) would mean inventing card copy, product photos and an aurora palette
 * that upstream never wrote. Chocolate goes further than upstream's docsite,
 * which does not depend on it at all.
 */
const THEME_OBJECTS: Record<string, DefinedTheme> = {
	'@astryxdesign/theme-neutral': neutralTheme,
	'@astryxdesign/theme-matcha': matchaTheme,
	'@astryxdesign/theme-butter': butterTheme,
	'@astryxdesign/theme-gothic': gothicTheme,
	'@astryxdesign/theme-y2k': y2kTheme,
	'@astryxdesign/theme-chocolate': chocolateTheme,
	'@astryxdesign/theme-stone': stoneTheme
};

// Shared Astryx asset CDN. The per-theme reel cards pull the same product photos
// the /themes showcase uses so the hero and the gallery stay in sync. Referenced
// by URL rather than vendored, which is what this port already does for every
// transcribed example block that shows a photo.
const IMAGE_CDN = 'https://lookaside.facebook.com/assets/astryx';

export interface HeroThemeContent {
	/** Product card (image + title/description + price). */
	product: {
		image: string;
		title: string;
		description: string;
		price: string;
	};
	/** Feature/reward card image + title/price. */
	feature: {
		image: string;
		title: string;
		price: string;
	};
	/** The buy card (thumbnail + title/description + cart). */
	mini: {
		image: string;
		title: string;
		description: string;
	};
	/** Floating pill callouts (leading badge, trailing radio). */
	pills: {
		leading: string;
		trailing: string;
	};
	/** Chat composer placeholder. */
	chatPrompt: string;
	/** Reward-progress card copy. */
	reward: {
		label: string;
		value: number;
		total: number;
		member: string;
	};
}

/** The three aurora blob colors (left, center, right). */
export interface HeroAuroraPalette {
	left: string;
	center: string;
	right: string;
}

export interface HeroThemeSlide {
	/** Theme package name, e.g. '@astryxdesign/theme-matcha'. */
	name: string;
	/** Human-readable label, e.g. 'Matcha'. */
	label: string;
	/** Resolved theme object passed to `<Theme>`. */
	theme: DefinedTheme;
	/** Per-theme content for the floating cards. */
	content: HeroThemeContent;
	/** Soft pastel palette feeding the blurred aurora background blobs. */
	aurora: HeroAuroraPalette;
	/** CSS color the wordmark paints in (must read on the slide's hero fill). */
	wordmarkColor: string;
	/**
	 * Dark-first theme. On dark slides the hero text/links/nav switch to light,
	 * and the theme renders in dark mode (fill, cards, blobs use its dark palette).
	 */
	isDark: boolean;
	/** Color mode the slide's theme renders in. Dark-first themes use 'dark'. */
	mode: 'light' | 'dark';
}

// The curated reel — these themes, in this order. Edit here to add/remove.
const REEL_THEMES: ReadonlyArray<string> = [
	ASTRYX,
	'@astryxdesign/theme-matcha',
	'@astryxdesign/theme-butter',
	'@astryxdesign/theme-gothic',
	'@astryxdesign/theme-y2k',
	// Local, non-upstream. Last, so the reel opens on the ported themes and the
	// addition reads as an addition.
	LIQUID_GLASS
];

// Per-theme card content, keyed by theme name (or the ASTRYX sentinel).
const CONTENT_BY_THEME: Record<string, HeroThemeContent> = {
	[ASTRYX]: {
		// Product photos reuse the Neutral theme's image set (watch / headphones /
		// backpack) now that Neutral is no longer a standalone reel slide.
		product: {
			image: '/neutral/preview-watch.png',
			title: 'Minimalist watch',
			description: 'Clean design, everyday durability.',
			price: '$240'
		},
		feature: {
			image: '/neutral/preview-headphones.png',
			title: 'Wireless headphones',
			price: '$180'
		},
		mini: {
			image: '/neutral/preview-backpack.png',
			title: 'Canvas backpack',
			description: 'Water-resistant.'
		},
		pills: { leading: 'Limited time', trailing: 'Free shipping' },
		chatPrompt: 'How can I help?',
		reward: {
			label: 'Points',
			value: 7,
			total: 8,
			member: 'Astryx team'
		}
	},
	'@astryxdesign/theme-neutral': {
		product: {
			image: '/neutral/preview-watch.png',
			title: 'Minimalist watch',
			description: 'Clean design, everyday durability.',
			price: '$240'
		},
		feature: {
			image: '/neutral/preview-headphones.png',
			title: 'Wireless headphones',
			price: '$180'
		},
		mini: {
			image: '/neutral/preview-backpack.png',
			title: 'Canvas backpack',
			description: 'Water-resistant.'
		},
		pills: { leading: 'Limited time', trailing: 'Free shipping' },
		chatPrompt: 'How can I help?',
		reward: {
			label: 'Points',
			value: 6,
			total: 10,
			member: 'Alex Rivera'
		}
	},
	'@astryxdesign/theme-butter': {
		product: {
			image: `${IMAGE_CDN}/Butter-Croissant.png`,
			title: 'Butter croissant',
			description: 'Flaky, laminated layers baked golden each morning.',
			price: '$6'
		},
		feature: {
			image: `${IMAGE_CDN}/Butter-Waffle.png`,
			title: 'Belgian waffle',
			price: '$8'
		},
		mini: {
			image: `${IMAGE_CDN}/Butter-Pancake.png`,
			title: 'Pancakes',
			description: 'Stacked tall with melting butter.'
		},
		pills: { leading: 'Limited time', trailing: 'Free shipping' },
		chatPrompt: 'How can I help?',
		reward: { label: 'Points', value: 5, total: 9, member: 'Noa Bright' }
	},
	'@astryxdesign/theme-matcha': {
		product: {
			image: `${IMAGE_CDN}/matcha-product-1.png`,
			title: 'Matcha',
			description: 'Stone-ground ceremonial matcha over cold milk.',
			price: '$6'
		},
		feature: {
			image: `${IMAGE_CDN}/matcha-product-2.png`,
			title: 'Strawberry matcha',
			price: '$7'
		},
		mini: {
			image: `${IMAGE_CDN}/matcha-product-4.png`,
			title: 'Ube matcha',
			description: 'Ube and cream matcha.'
		},
		pills: { leading: 'Limited time', trailing: 'Free shipping' },
		chatPrompt: 'How can I help?',
		reward: {
			label: 'Points',
			value: 7,
			total: 8,
			member: 'Lottie Wang'
		}
	},
	'@astryxdesign/theme-gothic': {
		product: {
			image: `${IMAGE_CDN}/Gothic-1.png`,
			title: 'Sea holly',
			description: 'A single preserved thistle stem with a steely bloom.',
			price: '$24'
		},
		feature: {
			image: `${IMAGE_CDN}/Gothic-2.png`,
			title: 'Garden rose',
			price: '$18'
		},
		mini: {
			image: `${IMAGE_CDN}/Gothic-3.png`,
			title: 'Ranunculus',
			description: 'Layered petals in a soft mauve.'
		},
		pills: { leading: 'Limited time', trailing: 'Free shipping' },
		chatPrompt: 'How can I help?',
		reward: { label: 'Points', value: 7, total: 8, member: 'Mara Vale' }
	},
	'@astryxdesign/theme-y2k': {
		product: {
			image: `${IMAGE_CDN}/Y2K-Phone.png`,
			title: 'Phone',
			description: 'Iridescent clamshell with a rainbow screen.',
			price: '$18'
		},
		feature: {
			image: `${IMAGE_CDN}/Y2K-Star.png`,
			title: 'Glow star set',
			price: '$12'
		},
		mini: {
			image: `${IMAGE_CDN}/Y2K-Butterfly.png`,
			title: 'Butterfly',
			description: 'Sparkly stick-on in pastel chrome.'
		},
		pills: { leading: 'Limited time', trailing: 'Free shipping' },
		chatPrompt: 'How can I help?',
		reward: { label: 'Points', value: 6, total: 8, member: 'Bella Cruz' }
	},
	// Liquid Glass is local, so there is no upstream content to transcribe and
	// no CDN photo set to point at. It reuses the vendored Neutral image set,
	// exactly as the ASTRYX slide above does — the alternative is
	// `fallbackContent`, whose `/theme-liquid-glass-preview.png` is an asset
	// nobody shipped, and three broken images.
	[LIQUID_GLASS]: {
		product: {
			image: '/neutral/preview-watch.png',
			title: 'Minimalist watch',
			description: 'Clean design, everyday durability.',
			price: '$240'
		},
		feature: {
			image: '/neutral/preview-headphones.png',
			title: 'Wireless headphones',
			price: '$180'
		},
		mini: {
			image: '/neutral/preview-backpack.png',
			title: 'Canvas backpack',
			description: 'Water-resistant.'
		},
		pills: { leading: 'Limited time', trailing: 'Free shipping' },
		chatPrompt: 'How can I help?',
		reward: { label: 'Points', value: 6, total: 10, member: 'Robin Hale' }
	}
};

// Fallback content for any theme without a bespoke entry (uses its preview img).
function fallbackContent(name: string): HeroThemeContent {
	const slug = name.replace('@astryxdesign/theme-', '');
	const image = `/theme-${slug}-preview.png`;
	return {
		product: {
			image,
			title: 'Featured product',
			description: 'A polished surface, styled by this theme.',
			price: '$40'
		},
		feature: { image, title: 'Featured product', price: '$40' },
		mini: { image, title: 'Featured', description: 'In stock now.' },
		pills: { leading: 'Limited time', trailing: 'Free shipping' },
		chatPrompt: 'How can I help?',
		reward: { label: 'Points', value: 6, total: 10, member: 'Sam Lee' }
	};
}

// Properly-cased dot labels (package displayNames are sometimes lowercased).
const LABEL_BY_THEME: Record<string, string> = {
	[ASTRYX]: 'Astryx',
	'@astryxdesign/theme-neutral': 'Neutral',
	'@astryxdesign/theme-butter': 'Butter',
	'@astryxdesign/theme-matcha': 'Matcha',
	'@astryxdesign/theme-gothic': 'Gothic',
	'@astryxdesign/theme-y2k': 'Y2K',
	[LIQUID_GLASS]: 'Liquid Glass'
};

function labelFor(name: string): string {
	if (LABEL_BY_THEME[name]) {
		return LABEL_BY_THEME[name];
	}
	// Upstream falls back to the package registry's `displayName` here. This port
	// has no package registry for themes, so the slug is the whole fallback.
	return name.replace('@astryxdesign/theme-', '');
}

// Resolve a slide's theme object (Astryx is local; others from the registry).
// Returns null for an uninstalled package so the reel skips it.
function themeFor(name: string): DefinedTheme | null {
	if (name === ASTRYX) {
		return astryxTheme;
	}
	if (name === LIQUID_GLASS) {
		return liquidGlassTheme;
	}
	return THEME_OBJECTS[name] ?? null;
}

// Wordmark color — by default the theme's accent text token. Each theme's
// --color-text-accent is already mode-correct (a dark ink on light themes,
// a light ink on dark-only themes like Gothic where accent === #E8F1F6).
const WORDMARK_COLOR = 'var(--color-text-accent)';

// Per-theme wordmark overrides. Astryx is special: its theme repoints every
// accent token to the warm primary ink (the brand colour is reserved for the
// logo), so --color-text-accent is now near-black. The wordmark therefore
// uses the brand colour directly so the Astryx logo stays branded while the rest
// of the slide's UI reads as primary. Other themes fall back to WORDMARK_COLOR.
const WORDMARK_COLOR_BY_THEME: Record<string, string> = {
	[ASTRYX]: BRAND
};

function wordmarkColorFor(name: string): string {
	return WORDMARK_COLOR_BY_THEME[name] ?? WORDMARK_COLOR;
}

// Dark-first themes (rendered in dark mode; hero text/nav go light).
const DARK_THEMES: ReadonlySet<string> = new Set<string>(['@astryxdesign/theme-gothic']);

// Per-theme aurora blob palettes (categorical background tokens, on-brand hues).
const AURORA_BY_THEME: Record<string, HeroAuroraPalette> = {
	[ASTRYX]: {
		left: 'var(--color-background-yellow)',
		center: 'var(--color-background-yellow)',
		right: 'var(--color-background-pink)'
	},
	'@astryxdesign/theme-neutral': {
		left: 'var(--color-background-blue)',
		center: 'var(--color-background-gray)',
		right: 'var(--color-background-cyan)'
	},
	'@astryxdesign/theme-butter': {
		left: 'var(--color-background-yellow)',
		center: 'var(--color-background-yellow)',
		right: 'var(--color-background-orange)'
	},
	'@astryxdesign/theme-matcha': {
		left: 'var(--color-background-green)',
		center: 'var(--color-background-cyan)',
		right: 'var(--color-background-yellow)'
	},
	// Gothic (dark mode): use saturated --color-border-* tokens so the blobs glow
	// instead of washing out white (the 20%-alpha background tints would).
	'@astryxdesign/theme-gothic': {
		left: 'var(--color-border-purple)',
		center: 'var(--color-border-blue)',
		right: 'var(--color-border-teal)'
	},
	'@astryxdesign/theme-y2k': {
		left: 'var(--color-background-pink)',
		center: 'var(--color-background-purple)',
		right: 'var(--color-background-blue)'
	},
	// Liquid Glass uses the --color-border-* stops rather than the background
	// ones for the same reason Gothic does, arriving at it from the other side:
	// its categorical backgrounds are 15%-alpha system colours, so as aurora
	// blobs they are very nearly invisible. The border stops (35%) read as the
	// soft desktop-picture wash the material is meant to be blurring.
	[LIQUID_GLASS]: {
		left: 'var(--color-border-blue)',
		center: 'var(--color-border-purple)',
		right: 'var(--color-border-cyan)'
	}
};

// Fallback aurora for any theme without a bespoke palette above.
const DEFAULT_AURORA: HeroAuroraPalette = {
	left: 'var(--color-background-blue)',
	center: 'var(--color-background-purple)',
	right: 'var(--color-background-pink)'
};

// The custom (web) font families each reel theme paints with. Listed here so the
// hero can warm them before the first auto-advance: the @font-face rules ship in
// the docsite's Google Fonts <link>, but the browser only fetches a family's
// woff2 once a glyph using it first paints — i.e. when the reel swaps to that
// slide, which is the visible FOUT first-time visitors hit. System/fallback
// stacks (-apple-system, Georgia, …) are intentionally omitted: they need no
// fetch.
//
// Keep in sync with the typography.{body,heading} families + display overrides
// in each theme package (packages/themes/<name>/src/<name>-theme.ts).
//
// **Upstream's nine, verified against our built theme objects.** This list was
// cut to Figtree alone while the four theme packages were unported and only the
// Astryx slide resolved; all five upstream slides resolve now, so it is back to
// upstream's contents. Liquid Glass adds nothing: it names `-apple-system` and
// `ui-monospace`, and the rule above omits system stacks. Chocolate and Stone
// add nothing either — they have no slide, so the reel never paints a glyph in
// Albert Sans, Fraunces or Montserrat and warming them would fetch three faces
// the hero cannot show.
const REEL_FONT_FAMILIES: ReadonlyArray<string> = [
	// Astryx (docsite brand)
	'Figtree',
	// Matcha (DM Sans body + Playwrite US Trad heading)
	'DM Sans',
	'Playwrite US Trad',
	// Butter (Outfit body/heading + Sarina display)
	'Outfit',
	'Sarina',
	// Gothic (Fustat body/heading + Manufacturing Consent display)
	'Fustat',
	'Manufacturing Consent',
	// Y2K (Poppins body/heading + Crimson Text display)
	'Poppins',
	'Crimson Text'
];

/**
 * `document.fonts.load()` specifiers for the reel's custom families. A short
 * representative string is enough to pull the right woff2 — the API loads the
 * whole face that would render those glyphs. We warm a normal and a bold-ish
 * weight since the cards mix body and heading weights.
 */
export const REEL_FONT_SPECIFIERS: ReadonlyArray<string> = REEL_FONT_FAMILIES.flatMap((family) => [
	`400 1rem "${family}"`,
	`600 1rem "${family}"`
]);

// Ordered slides from REEL_THEMES; unresolved (uninstalled) themes are skipped.
export const HERO_THEME_SLIDES: ReadonlyArray<HeroThemeSlide> = REEL_THEMES.map((name) => {
	const theme = themeFor(name);
	return theme
		? {
				name,
				label: labelFor(name),
				theme,
				content: CONTENT_BY_THEME[name] ?? fallbackContent(name),
				aurora: AURORA_BY_THEME[name] ?? DEFAULT_AURORA,
				wordmarkColor: wordmarkColorFor(name),
				isDark: DARK_THEMES.has(name),
				mode: DARK_THEMES.has(name) ? ('dark' as const) : ('light' as const)
			}
		: null;
}).filter((slide): slide is HeroThemeSlide => slide !== null);

/**
 * Every product photo the reel cards reference, deduped and in slide order. The
 * cards use plain `<img>`, so on a fresh visit a slide's remote CDN photos aren't
 * fetched until that slide renders — they pop in as the reel advances. The hero
 * warms this list on mount so the images are in the browser cache before the
 * first auto-advance. Scoped to just the reel's photos (3 per slide) so it
 * doesn't bloat the rest of the landing page's initial load.
 */
export const REEL_IMAGE_SRCS: ReadonlyArray<string> = Array.from(
	new Set(
		HERO_THEME_SLIDES.flatMap((slide) => [
			slide.content.product.image,
			slide.content.feature.image,
			slide.content.mini.image
		])
	)
);
