/**
 * Neutral Theme — ported from Astryx's `packages/themes/neutral/src/neutralTheme.ts`.
 *
 * A pure grayscale spine with a from-scratch OKLCH-derived categorical palette.
 * Hues sit at evenly-spaced positions on the OKLCH wheel, chosen to stay
 * recognisable at every tone (no red drift for orange, no blue drift for purple)
 * and well separated from their neighbours.
 *
 * Core neutral palette: #fafafa, #f5f5f5, #e5e5e5, #737373, #262626, #0a0a0a
 *
 * Categorical hues (OKLCH; chroma = max-in-gamut at the saturated stop):
 *   Red H=25    Orange H=65    Yellow H=90    Green H=145
 *   Teal H=180  Cyan H=215     Blue H=250     Purple H=320  Pink H=355
 *
 * Token tonal stops:
 *   bg = T90 (light) / T20 (dark)   border = T80 / T30
 *   icon = T30 / T80                text   = T30 / T80
 *
 * All nine saturated badge values pass WCAG AA against their own label (>= 4.5:1).
 *
 * Only tokens that differ from the defaults are overridden.
 *
 * ## Where `icons` went
 *
 * Upstream's `neutralTheme.ts` ends with `icons: neutralIconRegistry`. This file
 * cannot: the registry's values are snippets, snippets only exist in markup, and
 * this module is imported by `scripts/build-theme.mjs` under plain Node, which
 * cannot parse a `.svelte` import. The registry lives in `src/icons.svelte` and
 * the build attaches it to the theme object it emits, so the *published* shape
 * matches upstream — `neutralTheme.icons` is the registry, and the package
 * exports `neutralIconRegistry` alongside it. See `buildThemePackage`'s `icons`
 * parameter for the full reasoning.
 */

import { defineSyntaxTheme, defineTheme } from '@astryx-svelte/core/theme/define';

/**
 * Neutral syntax palette — the OKLCH T30 (light) / T80 (dark) stops of the
 * categorical ramps, i.e. the same colours the `--color-icon-*` tokens use.
 */
const neutralSyntax = defineSyntaxTheme({
	name: 'xds-neutral',
	tokens: {
		keyword: ['#700084', '#efa8ff'], // purple T30/T80
		string: ['#005600', '#a6d2a2'], // green (sat T30 / pastel T80)
		comment: ['#737373', '#a3a3a3'], // neutral
		number: ['#6e3500', '#ffb37f'], // orange
		function: ['#00458c', '#a0caff'], // blue T30/T80 H=255
		type: ['#700084', '#efa8ff'], // purple
		variable: ['#171717', '#e5e5e5'], // near-black / near-white
		operator: ['#737373', '#a3a3a3'], // neutral
		constant: ['#6e3500', '#ffb37f'], // orange
		tag: ['#89001a', '#ffaeaa'], // red
		attribute: ['#584400', '#eec12f'], // yellow
		property: ['#005348', '#83dac9'], // teal
		punctuation: ['#a3a3a3', '#525252'], // neutral
		background: ['#fafafa', '#0a0a0a']
	}
});

export const neutralTheme = defineTheme({
	name: 'neutral',

	// Figtree across body, heading and display (display inherits heading.family);
	// monospace stays the platform default for code. Scale base=14, ratio=1.2,
	// with bold h3/h4 for subsection hierarchy.
	typography: {
		scale: { base: 14, ratio: 1.2 },
		body: {
			family: 'Figtree',
			fallbacks:
				'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
		},
		heading: {
			family: 'Figtree',
			fallbacks:
				'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
			weights: { 3: 'bold', 4: 'bold' }
		},
		code: {
			family: 'ui-monospace',
			fallbacks: '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
		}
	},

	// Snappier than default, matching shadcn/Tailwind conventions. Produces
	// fast 95/125/165ms and medium 225/300/400ms.
	motion: { fast: 125, medium: 300, slow: 700, ratio: 0.75 },

	syntax: neutralSyntax,

	tokens: {
		// ====================================================================
		// Backgrounds — Figma-style flat with a single lifted surface.
		//
		// Dark mode collapses card/popover/muted to body T10; they lift purely
		// via shadow and inset highlight. Surface is the exception, tonally
		// lighter than body (T15) so interactive components sitting on the
		// canvas have a differentiated foreground.
		//
		//   surface T15 #262626   body T10 #1b1b1b   card/popover/muted T10
		//
		// Light mode keeps the standard ladder — white surfaces float on a
		// tinted body and shadows do most of the lifting.
		// ====================================================================
		'--color-background-surface': ['#ffffff', '#262626'],
		'--color-background-body': ['#f1f1f1', '#1b1b1b'],
		'--color-background-card': ['#ffffff', '#1b1b1b'],
		'--color-background-popover': ['#ffffff', '#1b1b1b'],
		'--color-background-muted': ['#f1f1f1', '#1b1b1b'],

		// Accent + neutral surface tints
		'--color-accent': ['#262626', '#ebebeb'],
		'--color-accent-muted': ['#f1f1f1', '#262626'],
		'--color-neutral': ['#0000000F', '#FFFFFF1A'],

		// Overlays (modal scrims, hover/pressed tints)
		'--color-overlay': ['#00000080', '#000000CC'],
		'--color-overlay-hover': ['#0000000D', '#FFFFFF0D'],
		'--color-overlay-pressed': ['#0000001A', '#FFFFFF1A'],

		// Text
		'--color-text-primary': ['#171717', '#fafafa'],
		// #737373 on the light surface is ~4.4:1 — below WCAG 1.4.3's 4.5:1 for body
		// text. Upstream tone-bumped it at 0.3.0 when it started asserting generated
		// text-on-surface pairs at >= 4.5:1. Dark is unchanged and already passed.
		'--color-text-secondary': ['#525252', '#a3a3a3'],
		'--color-text-disabled': ['#a3a3a3', '#525252'],
		'--color-text-accent': ['#262626', '#ebebeb'],
		'--color-on-dark': '#ffffff',
		'--color-on-light': '#171717',
		// The neutral accent is near-black in light, near-white in dark.
		'--color-on-accent': ['#ffffff', '#171717'],
		'--color-on-success': ['#ffffff', '#171717'],
		'--color-on-error': ['#ffffff', '#171717'],
		'--color-on-warning': '#171717',

		// Icon
		'--color-icon-accent': ['#262626', '#ebebeb'],
		'--color-icon-primary': ['#171717', '#fafafa'],
		'--color-icon-secondary': ['#737373', '#a3a3a3'],
		'--color-icon-disabled': ['#a3a3a3', '#525252'],

		// ====================================================================
		// Status / sentiment.
		//
		//   Light: pastel T90 banner background + dark T30/T40 text and icon.
		//   Dark : tinted T20 background + light pastel T80 text — inverted
		//          from light, avoiding locked pastels glowing on a dark body.
		//
		//   --color-X       saturated text/icon stop
		//   --color-X-muted muted background stop; dark mode uses a hue-tinted
		//                   alpha overlay (24% = '3D' suffix) so the surface
		//                   composites onto whatever sits behind it rather than
		//                   reading as a hard coloured panel.
		// ====================================================================
		'--color-success': ['#007004', '#9fe59b'],
		'--color-error': ['#a50c25', '#ffc6c1'],
		'--color-warning': ['#745b00', '#fdcf4f'],
		'--color-success-muted': ['#c5e5c0', '#84c9803D'],
		'--color-error-muted': ['#facecb', '#ff9e973D'],
		'--color-warning-muted': ['#f8da9d', '#deb4333D'],

		// Border
		'--color-border': ['#00000014', '#FFFFFF1A'],
		'--color-border-emphasized': ['#d4d4d4', '#525252'],

		// Effects
		'--color-skeleton': ['#ebebeb', '#525252'],
		'--color-shadow': ['#0000001A', '#0000004D'],
		'--color-tint-hover': ['black', 'white'],

		// ====================================================================
		// Categorical hues.
		//
		// Light mode uses pastel surfaces with dark coloured text; dark mode
		// inverts to a hue-tinted alpha overlay surface with light pastel text.
		// Per-token tone: bg light T87–T90 / dark T70 @ 24% alpha; border
		// light T80 / dark T60; icon light T30 / dark T70; text light T30 /
		// dark T80.
		//
		// Dark slots are HCT-derived from each source hex via the canonical
		// dark-ramp transform (chroma × 0.85, +5 tone-lift taper).
		// ====================================================================

		// Red H=22 — source #eb183a
		'--color-background-red': ['#facecb', '#ff9e973D'],
		'--color-border-red': ['#e6bab8', '#ff6f6c'],
		'--color-icon-red': ['#89001a', '#ff9e97'],
		'--color-text-red': ['#89001a', '#ffc6c1'],

		// Orange H=55 — source #d57113
		'--color-background-orange': ['#fad0b5', '#ffa2583D'],
		'--color-border-orange': ['#e6bda2', '#e2883e'],
		'--color-icon-orange': ['#6e3500', '#ffa258'],
		'--color-text-orange': ['#6e3500', '#ffc9a2'],

		// Yellow H=90 — source #f8c723.
		// Light mode pulls L down one step and C to its identity floor, because
		// yellow sits at the green-cyan luminance peak and otherwise reads
		// louder than the other status hues at the same canonical L.
		'--color-background-yellow': ['#f8da9d', '#deb4333D'],
		'--color-border-yellow': ['#e4c279', '#c0990e'],
		'--color-icon-yellow': ['#584400', '#deb433'],
		'--color-text-yellow': ['#584400', '#fdcf4f'],

		// Green H=144 — source #358a3a
		'--color-background-green': ['#c5e5c0', '#84c9803D'],
		'--color-border-green': ['#b2d1ac', '#69ad67'],
		'--color-icon-green': ['#0c5700', '#84c980'],
		'--color-text-green': ['#0c5700', '#9fe59b'],

		// Teal H=180 — source #0c7365.
		// Light pastel sits a step darker with less chroma than the other hues
		// to compensate for the green-cyan luminance overshoot.
		'--color-background-teal': ['#a5e3d6', '#7ec6b83D'],
		'--color-border-teal': ['#94d6c8', '#63ab9d'],
		'--color-icon-teal': ['#005348', '#7ec6b8'],
		'--color-text-teal': ['#005348', '#99e2d3'],

		// Cyan H=215 — source #0c6f82. Same overshoot compensation as teal.
		'--color-background-cyan': ['#a3e0ef', '#83c2d43D'],
		'--color-border-cyan': ['#91d3e3', '#67a7b8'],
		'--color-icon-cyan': ['#00505f', '#83c2d4'],
		'--color-text-cyan': ['#00505f', '#9edef0'],

		// Blue H=255 — source #0074e2.
		// T50 #0074e2 is reserved for the filled info badge, progress bar and
		// inset hover.
		'--color-background-blue': ['#c4ddfb', '#9eb7ff3D'],
		'--color-border-blue': ['#b1c9e7', '#6d9cfe'],
		'--color-icon-blue': ['#00458c', '#9eb7ff'],
		'--color-text-blue': ['#00458c', '#c7d3ff'],

		// Purple H=320 — source #980fb2
		'--color-background-purple': ['#eccef3', '#f297ff3D'],
		'--color-border-purple': ['#d8bbdf', '#dd74f0'],
		'--color-icon-purple': ['#700084', '#f297ff'],
		'--color-text-purple': ['#700084', '#fac1ff'],

		// Pink H=355 — source #b10e69
		'--color-background-pink': ['#fccadc', '#ff99c33D'],
		'--color-border-pink': ['#e7b7c8', '#f273aa'],
		'--color-icon-pink': ['#83004b', '#ff99c3'],
		'--color-text-pink': ['#83004b', '#ffc3da'],

		// Gray (categorical neutral, chroma 0).
		// Dark mode reuses --color-neutral, a 10% white wash, rather than a
		// solid T15 which was indistinguishable from --color-background-muted.
		'--color-background-gray': ['#e5e5e5', 'var(--color-neutral)'],
		'--color-border-gray': ['#d4d4d4', '#262626'],
		'--color-icon-gray': ['#525252', '#a3a3a3'],
		'--color-text-gray': ['#262626', '#e5e5e5'],

		// ====================================================================
		// Radius — slightly larger than the defaults.
		//
		// `--radius-none` and `--radius-full` are always fixed and must never be
		// scaled by a theme (see `defineTheme`'s radius config docs) — 0 and
		// 9999px respectively, matching core's own defaults. Upstream shipped
		// `0.25rem` here through 0.3.0 and corrected it at 0.4.1.
		// ====================================================================
		'--radius-none': '0px',
		'--radius-inner': '0.375rem',
		'--radius-element': '0.625rem',
		'--radius-container': '0.75rem',
		'--radius-page': '1.75rem',
		'--radius-full': '9999px',

		// ====================================================================
		// Shadows.
		//
		// Light mode keeps subtle drops — light surfaces need no rim highlight.
		// Dark mode deepens the drops and adds an all-round 1px white inset
		// ("Figma-style bezel") mimicking ambient light catching the surface
		// rim, which drop shadows alone cannot achieve against a dark canvas.
		// The inset uses light-dark(transparent, …) so light mode is untouched.
		// ====================================================================
		'--shadow-low':
			'0 2px 4px light-dark(oklch(0 0 0 / 5%), oklch(0 0 0 / 25%)), ' +
			'0 4px 8px light-dark(oklch(0 0 0 / 10%), oklch(0 0 0 / 40%)), ' +
			'inset 0 0 0 1px light-dark(transparent, oklch(1 0 0 / 8%))',
		'--shadow-med':
			'0 2px 4px light-dark(oklch(0 0 0 / 5%), oklch(0 0 0 / 35%)), ' +
			'0 4px 12px light-dark(oklch(0 0 0 / 10%), oklch(0 0 0 / 50%)), ' +
			'inset 0 0 0 1px light-dark(transparent, oklch(1 0 0 / 12%))',
		'--shadow-high':
			'0 4px 6px light-dark(oklch(0 0 0 / 10%), oklch(0 0 0 / 50%)), ' +
			'0 12px 24px light-dark(oklch(0 0 0 / 15%), oklch(0 0 0 / 70%)), ' +
			'inset 0 0 0 1px light-dark(transparent, oklch(1 0 0 / 15%))',
		'--shadow-inset-hover': 'inset 0px 0px 0px 2px #0074e24D',
		'--shadow-inset-selected': 'inset 0px 0px 0px 2px #0074e280',
		'--shadow-inset-success': 'inset 0px 0px 0px 2px #1981004D',
		'--shadow-inset-warning': 'inset 0px 0px 0px 2px #ffce2f4D',
		'--shadow-inset-error': 'inset 0px 0px 0px 2px #e33f4a4D'
	},

	components: {
		// Destructive uses the OKLCH red filled treatment.
		button: {
			'variant:destructive': {
				backgroundColor: 'var(--color-error-muted)', // locked pastel red bg
				color: 'var(--color-error)' // locked T30 red, matching banner/input error text
			}
		},

		// ================================================================
		// Badge.
		//
		// Semantic variants are filled at the saturated stop with contrasting
		// text; text contrast locks the background tone, so these stay put in
		// both modes rather than inverting like pastel surfaces. Dark mode
		// uses the T60 stop with DARK text — T60 with white fails AA-large
		// (~2.7:1), while T60 with dark hits 6.6–7:1 and tames vibration.
		//
		// Categorical variants reference the per-hue tokens, so they track the
		// palette automatically.
		// ================================================================
		badge: {
			'variant:info': {
				backgroundColor: 'light-dark(#0074e2, #6d9cfe)',
				color: 'light-dark(#ffffff, #171717)'
			},
			'variant:neutral': {
				// Mirrors the gray categorical badge, sourced from the gray hue
				// tokens so one token change updates both variants.
				backgroundColor: 'var(--color-background-gray)',
				color: 'var(--color-text-gray)'
			},
			'variant:success': {
				backgroundColor: 'light-dark(#198100, #64af4c)',
				color: 'light-dark(#ffffff, #171717)'
			},
			'variant:warning': {
				// Yellow keeps the same hex in both modes — chroma reduction is
				// barely visible at T85, and dark-on-yellow does not vibrate.
				backgroundColor: '#ffce2f',
				color: '#171717'
			},
			'variant:error': {
				// Light is the T58 stop, not the saturated T55 #e33f4a: that one
				// pairs with white at 4.14:1, and a 12px/500 label wants AA's
				// 4.5 rather than the 3:1 large-text allowance. One step down
				// holds the hue and reaches 5.29:1. Dark is unchanged at 6.60:1.
				backgroundColor: 'light-dark(#c9303a, #ff705d)',
				color: 'light-dark(#ffffff, #171717)'
			},

			'variant:red': {
				backgroundColor: 'var(--color-background-red)',
				color: 'var(--color-text-red)'
			},
			'variant:orange': {
				backgroundColor: 'var(--color-background-orange)',
				color: 'var(--color-text-orange)'
			},
			'variant:yellow': {
				backgroundColor: 'var(--color-background-yellow)',
				color: 'var(--color-text-yellow)'
			},
			'variant:green': {
				backgroundColor: 'var(--color-background-green)',
				color: 'var(--color-text-green)'
			},
			'variant:teal': {
				backgroundColor: 'var(--color-background-teal)',
				color: 'var(--color-text-teal)'
			},
			'variant:cyan': {
				backgroundColor: 'var(--color-background-cyan)',
				color: 'var(--color-text-cyan)'
			},
			'variant:blue': {
				backgroundColor: 'var(--color-background-blue)',
				color: 'var(--color-text-blue)'
			},
			'variant:purple': {
				backgroundColor: 'var(--color-background-purple)',
				color: 'var(--color-text-purple)'
			},
			'variant:pink': {
				backgroundColor: 'var(--color-background-pink)',
				color: 'var(--color-text-pink)'
			},
			'variant:gray': {
				backgroundColor: 'var(--color-background-gray)',
				color: 'var(--color-text-gray)'
			}
		},

		// ================================================================
		// StatusDot — fills reuse the filled semantic badge stops so a dot and
		// its badge read as one status language. The component defaults map to
		// raw semantic tokens, which in light mode are dark T30/T40 stops meant
		// to sit as text on a pastel surface; as a solid dot they read muddy.
		//
		// `neutral` is deliberately not overridden: the neutral badge background
		// is a near-invisible light gray, fine as a large pill but unreadable as
		// an 8px dot, so it keeps the component default's visible mid-gray.
		// ================================================================
		statusdot: {
			'variant:success': { backgroundColor: 'light-dark(#198100, #64af4c)' },
			'variant:warning': { backgroundColor: '#ffce2f' },
			'variant:error': { backgroundColor: 'light-dark(#c9303a, #ff705d)' },
			// StatusDot "accent" is the info/attention colour, so it pairs with
			// the info badge rather than --color-accent (near-black #262626).
			'variant:accent': { backgroundColor: 'light-dark(#0074e2, #6d9cfe)' }
		},

		// ================================================================
		// Banner — a hue-tinted surface with coloured text and icon. `info`
		// retints by *redirecting* --color-accent-muted, which is what the
		// header already paints with; the older shape painted the background
		// directly and then forced the token transparent so the two would not
		// stack, which is two declarations doing one declaration's work.
		// Status overrides reference --color-text-{hue} so text stays in sync
		// with the palette anchors.
		// ================================================================
		banner: {
			'status:info': {
				'--color-accent-muted': 'var(--color-background-blue)',
				'--color-text-primary': 'var(--color-text-blue)',
				'--color-text-secondary': 'var(--color-text-blue)',
				'--color-accent': 'var(--color-text-blue)'
			},
			// success/warning/error backgrounds already come from
			// --color-{X}-muted, which carries the right light and dark values;
			// only the text and icon need redirecting to the coloured stop.
			'status:success': {
				'--color-text-primary': 'var(--color-text-green)',
				'--color-text-secondary': 'var(--color-text-green)',
				'--color-success': 'var(--color-text-green)'
			},
			'status:warning': {
				'--color-text-primary': 'var(--color-text-yellow)',
				'--color-text-secondary': 'var(--color-text-yellow)',
				'--color-warning': 'var(--color-text-yellow)'
			},
			'status:error': {
				'--color-text-primary': 'var(--color-text-red)',
				'--color-text-secondary': 'var(--color-text-red)',
				'--color-error': 'var(--color-text-red)'
			}
		},

		// TextInput needs no per-status overrides: the global
		// --color-{success,error,warning} tokens already clear AA non-text 3:1
		// against both surfaces they touch (the input surface and the status
		// message bubble) in both modes.

		// ================================================================
		// Switch — the off-state track uses the same lifted neutral surface as
		// the progress bar track, so both "channel-on-body" components share
		// one visual language: a defined channel rather than a wash.
		// ================================================================
		switch: {
			base: {
				'--color-background-gray': 'var(--color-border-emphasized)'
			}
		},

		progressbar: {
			base: {
				// The default track uses --color-background-muted; redirect it so
				// the track reads clearly darker than the body rather than
				// blending in.
				'--color-background-muted': 'var(--color-border-emphasized)'
			},
			// Vivid stops match the filled semantic badge colours.
			'variant:accent': { '--color-accent': '#0074e2' },
			'variant:success': { '--color-success': '#198100' },
			'variant:warning': { '--color-warning': '#ffce2f' },
			'variant:error': { '--color-error': '#c9303a' }
		},

		// Tighter padding via the public container padding tokens.
		card: {
			base: { padding: 'var(--spacing-3)' }
		},
		section: {
			base: { padding: 'var(--spacing-3)' }
		}

		// Heading and text overrides are generated by typography.scale; the
		// bold h3/h4 weights come from typography.heading.weights above.
	}
});
