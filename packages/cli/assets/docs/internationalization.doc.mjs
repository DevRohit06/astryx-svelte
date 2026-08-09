/**
 * @file Internationalization.
 *
 * Prose survives almost intact — locale chains, direction derivation, the
 * pseudo locale and the "two providers side by side" pattern are all
 * framework-neutral. What changes:
 *
 *   - Every example is Svelte. `<InternationalizationProvider>` takes a
 *     `children` snippet, and a runtime locale swap is a `$state` variable
 *     rather than `useState`.
 *   - The interop example uses `svelte-i18n` in place of `react-intl`, because
 *     the point of the section is that TWO providers coexist and the reader
 *     needs a real second library to see it.
 *   - `@astryxdesign/core/locales/fr.json` becomes `fr-FR.json`: this port
 *     ships `en`, `fr-FR` and `pseudo`, and naming a file that is not there
 *     would be the same defect as inventing a prop.
 *   - The contributor subsection's tool names are this repo's: the
 *     physical-property and hardcoded-string ESLint rules are upstream's own
 *     internal rules and have no counterpart here, so that paragraph names the
 *     convention rather than a rule that will not fire.
 */

/** @type {import('@astryx-svelte/cli/authoring').ReferenceDoc} */
export const docs = {
	name: 'internationalization',
	title: 'Internationalization',
	category: 'guide',
	description:
		'Set the active locale for astryx components, load locale catalogs, coexist with your own i18n library, swap languages at runtime, and test translations with the pseudo locale.',

	sections: [
		{
			title: 'Quick Start',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Internationalization ships with `@astryx-svelte/core`. There is nothing to install. Wrap your app in `<InternationalizationProvider>` and set the active `locale`; astryx components pick up localized strings from that provider.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Wrap your app',
					code: `<script lang="ts">
	import { InternationalizationProvider } from '@astryx-svelte/core/i18n';

	let { children } = $props();
</script>

<InternationalizationProvider locale="en">
	{@render children()}
</InternationalizationProvider>`
				},
				{
					type: 'prose',
					text: 'The provider always has the built-in English catalog. Pass additional catalogs through `messages` when you enable another locale.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Load an astryx locale catalog',
					code: `<script lang="ts">
	import { InternationalizationProvider } from '@astryx-svelte/core/i18n';
	import fr from '@astryx-svelte/core/locales/fr-FR.json';

	let { children } = $props();
</script>

<InternationalizationProvider locale="fr-FR" messages={{ 'fr-FR': fr }}>
	{@render children()}
</InternationalizationProvider>`
				},
				{
					type: 'prose',
					text: 'Astryx ships `en`, `fr-FR`, and a generated `pseudo` locale today, with more first-party translations on the roadmap. Until a locale is available from `@astryx-svelte/core/locales/*`, apps can pass a local catalog with the same shape. See `@astryx-svelte/core/locales/en.json` for the current key inventory. Missing keys fall back through the locale chain to English (for example, `pt-BR` walks to `pt`, then to shipped `en`).'
				},
				{
					type: 'prose',
					text: 'Locale catalogs only affect astryx strings. Your app can continue using its own i18n system for product copy.'
				}
			]
		},
		{
			title: 'Runtime language swap',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Change the `locale` prop on `<InternationalizationProvider>` and every astryx string updates live. No reload, no separate API call.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Toggle between locales',
					code: `<script lang="ts">
	import { Button, InternationalizationProvider } from '@astryx-svelte/core';
	import fr from '@astryx-svelte/core/locales/fr-FR.json';

	let locale = $state<'en' | 'fr-FR'>('en');
</script>

<InternationalizationProvider {locale} messages={{ 'fr-FR': fr }}>
	<Button
		label={locale === 'en' ? 'Français' : 'English'}
		onclick={() => (locale = locale === 'en' ? 'fr-FR' : 'en')}
	/>
	<App />
</InternationalizationProvider>`
				},
				{
					type: 'prose',
					text: "Persisting the user's choice (localStorage, cookie, URL segment, account setting) is up to the consumer. Astryx reads whatever `locale` you pass in."
				}
			]
		},
		{
			title: 'Text direction (RTL)',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: "Astryx tracks text direction (`'ltr'` or `'rtl'`) alongside the locale. By default the direction is derived from the `locale` you pass to `<InternationalizationProvider>` via [`Intl.Locale.getTextInfo()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getTextInfo), so RTL locales such as Arabic (`ar`), Hebrew (`he`), Farsi (`fa`), and Urdu (`ur`) resolve to `'rtl'` automatically."
				},
				{
					type: 'prose',
					text: "You don't wire anything per component. Once the direction is set, astryx components mirror on their own: layout and spacing flip via CSS logical properties, directional icons (chevrons, carets) flip in place, keyboard arrow keys swap left/right, and overlays position on the correct side. Set the direction once and the whole component tree follows."
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Direction derived from locale',
					code: `<!-- direction resolves to 'rtl' automatically from the Arabic locale -->
<InternationalizationProvider locale="ar">
	{@render children()}
</InternationalizationProvider>`
				},
				{
					type: 'prose',
					text: 'Pass the optional `dir` prop to force a direction. This overrides the locale-derived default; useful for RTL layout testing under an English catalog, or to skip derivation when you already know the direction.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Explicit direction override',
					code: `<!-- force RTL layout while keeping English strings -->
<InternationalizationProvider locale="en" dir="rtl">
	{@render children()}
</InternationalizationProvider>`
				},
				{
					type: 'prose',
					text: "There's one more step: tell the browser about the direction too. Add a `dir` attribute to your page; usually on the `<html>` tag. This is what makes text align to the correct side, punctuation and mixed-language text flow correctly, and layouts mirror. The provider handles astryx components; the `dir` attribute handles everything else on the page."
				},
				{
					type: 'prose',
					text: "Astryx doesn't set `dir` for you; you set it, alongside the same direction you pass to the provider. In SvelteKit the `<html>` tag lives in `src/app.html`, so the direction has to be substituted while the page renders — `handle` in `src/hooks.server.ts` is where to do it, and `getLocaleDirection()` computes the value from a locale:"
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'Set <html dir> in a SvelteKit server hook',
					code: `// src/app.html has: <html lang="%lang%" dir="%dir%">
import { getLocaleDirection } from '@astryx-svelte/core/i18n';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const locale = event.params.locale ?? 'en';
	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace('%lang%', locale).replace('%dir%', getLocaleDirection(locale))
	});
};`
				},
				{
					type: 'prose',
					text: "In a plain client app, set the same attribute on `<html>` whenever the locale changes. (`getLocaleDirection()` safely returns `'ltr'` for anything it doesn't recognize, so you can call it with any locale string.)"
				},
				{
					type: 'prose',
					text: 'To make just one part of a left-to-right page right-to-left; say an Arabic quote or a comment thread; wrap that part in its own `<InternationalizationProvider dir="rtl">` and add `dir="rtl"` to the element around it. Pop-up overlays; menus, dialogs, popovers, tooltips; opened from inside that region mirror too: they position with logical CSS anchor placement, so they land on the correct side and inherit the region\'s direction automatically.'
				}
			]
		},
		{
			title: "Overriding astryx's default text",
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Use `overrides` to change individual strings without shipping a full catalog. Overrides are keyed by locale and merged on top of the built-in and user-supplied catalogs.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Change one string in English',
					code: `<InternationalizationProvider
	locale="en"
	overrides={{ en: { '@astryx.pagination.next': 'Next →' } }}
>
	{@render children()}
</InternationalizationProvider>`
				},
				{
					type: 'prose',
					text: 'Overrides win over both bundled English and any `messages` catalog for the same key. Use them for brand voice tweaks or one-off wording changes.'
				}
			]
		},
		{
			title: 'Using astryx with your own i18n library',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: "Astryx components render astryx strings through astryx's provider. Consumer components render consumer strings through whatever i18n library you already use: svelte-i18n, Paraglide, typesafe-i18n, and so on. The two systems coexist and read from the same source of truth for the active locale."
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Astryx + svelte-i18n side by side',
					code: `<script lang="ts">
	import { Button, Selector } from '@astryx-svelte/core';
	import { InternationalizationProvider } from '@astryx-svelte/core/i18n';
	import { t } from 'svelte-i18n';
	import astryxFr from '@astryx-svelte/core/locales/fr-FR.json';

	// Consumer strings resolve through svelte-i18n's \`$t\` store.
	// The Selector's trigger placeholder, search-box placeholder and
	// clear-button aria-label resolve through InternationalizationProvider.
</script>

<InternationalizationProvider locale="fr-FR" messages={{ 'fr-FR': astryxFr }}>
	<section>
		<h1>{$t('pricing.heading')}</h1>

		<Selector
			label={$t('pricing.region.label')}
			options={[
				{ value: 'na', label: $t('pricing.region.na') },
				{ value: 'eu', label: $t('pricing.region.eu') }
			]}
			hasSearch
			hasClear
		/>

		<Button label={$t('pricing.cta.subscribe')} />
	</section>
</InternationalizationProvider>`
				},
				{
					type: 'prose',
					text: 'Keep the two systems in sync on locale, and each owns its own catalog. Astryx never sees your app strings, and your i18n library never sees astryx internals. Runtime locale swap works the same way: change both and the whole tree updates live.'
				},
				{
					type: 'prose',
					text: "Single-catalog usage (where an external i18n runtime resolves both your app strings AND astryx's strings through one provider) is on the roadmap via a `Translator` adapter. For now, run the two side by side as shown above."
				}
			]
		},
		{
			title: 'Using astryx as your i18n library',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: "For production apps with substantial localization needs, we recommend a dedicated i18n library such as svelte-i18n or Paraglide. If your app is small or you do not want another runtime, you can resolve your own strings through astryx too. Keep app keys in a separate namespace from `@astryx.*`, and include your own `en` catalog because astryx's built-in English fallback only contains astryx component strings."
				},
				{
					type: 'code',
					lang: 'ts',
					label: 'messages.ts — your catalogs',
					code: `import type { Catalog, MessagesByLocale } from '@astryx-svelte/core/i18n';

const en: Catalog = {
	'@myapp.actions.save': { defaultMessage: 'Save' }
};

const fr: Catalog = {
	'@myapp.actions.save': { defaultMessage: 'Enregistrer' }
};

export const messages: MessagesByLocale = { en, 'fr-FR': fr };`
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Translate app strings with astryx',
					code: `<script lang="ts">
	import { Button } from '@astryx-svelte/core';
	import { InternationalizationProvider, useTranslator } from '@astryx-svelte/core/i18n';
	import { messages } from './messages.js';

	const t = useTranslator();
</script>

<InternationalizationProvider locale="fr-FR" {messages}>
	<Button label={t('@myapp.actions.save')} />
</InternationalizationProvider>`
				},
				{
					type: 'prose',
					text: '`Catalog` types a single locale file; `MessagesByLocale` types the map passed to `messages`. A catalog entry uses the same `{defaultMessage, description?}` shape as `@astryx-svelte/core/locales/en.json`.'
				}
			]
		},
		{
			title: 'Testing your translations',
			category: 'guide',
			content: [
				{
					type: 'prose',
					text: 'Astryx generates a `pseudo` locale that wraps every string in `⟦…⟧` and replaces letters with accented look-alikes. Switch to it in development to catch hardcoded astryx strings and layout issues caused by longer text.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Turn on pseudo-localization',
					code: `<script lang="ts">
	import { InternationalizationProvider } from '@astryx-svelte/core/i18n';
	import pseudo from '@astryx-svelte/core/locales/pseudo.json';

	let { children } = $props();
</script>

<InternationalizationProvider locale="pseudo" messages={{ pseudo }}>
	{@render children()}
</InternationalizationProvider>`
				}
			]
		},
		{
			title: 'For contributors',
			category: 'guide',
			content: [
				{
					type: 'heading',
					level: 3,
					text: 'Developers'
				},
				{
					type: 'prose',
					text: 'Astryx component authors read strings with `useTranslator()` rather than hardcoding user-facing text.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Read an astryx string',
					code: `<script lang="ts">
	import { useTranslator } from '@astryx-svelte/core/i18n';

	const t = useTranslator();
</script>

<button>{t('@astryx.actions.save')}</button>`
				},
				{
					type: 'prose',
					text: "Astryx's own strings live in `packages/core/src/lib/locales/en.json`. New user-facing strings go through `useTranslator` rather than being written into markup."
				},
				{
					type: 'prose',
					text: 'When you author a component that needs to respond to direction, resolve it from the DOM, not from a render-time JavaScript read, and reach for the lightest tool that works. In priority order:'
				},
				{
					type: 'heading',
					level: 4,
					text: '1. CSS logical properties first'
				},
				{
					type: 'prose',
					text: 'Use `insetInlineStart`, `paddingInlineEnd`, `marginInline`, and friends instead of physical `left`/`right`. Most mirroring needs nothing more; the browser flips it from the ambient `dir`.'
				},
				{
					type: 'heading',
					level: 4,
					text: '2. Directional icons — mirror with CSS, not a name-swap'
				},
				{
					type: 'prose',
					text: 'Render one fixed glyph and wrap it in the shared `rtlStyles.mirror` from `@astryx-svelte/core/utils` (a `scaleX(-1)` that only applies under `[dir="rtl"]`). It flips from the ancestor `dir` through the cascade, so it works on the server with no hydration flash. Do not pick `chevronLeft` vs `chevronRight` in JS. This is how Pagination, Calendar, and Carousel handle their chevrons.'
				},
				{
					type: 'code',
					lang: 'svelte',
					label: 'Mirror a directional icon with CSS',
					code: `<script lang="ts">
	import { Icon } from '@astryx-svelte/core';
	import { rtlStyles } from '@astryx-svelte/core/utils';
	import { sx } from './internal/sx.js';
</script>

<!-- One glyph; CSS flips it under RTL. No direction read. -->
<span {...sx(rtlStyles.mirror)}>
	<Icon icon="chevronRight" />
</span>`
				},
				{
					type: 'heading',
					level: 4,
					text: '3. Behavioral logic — read the DOM lazily, on the event'
				},
				{
					type: 'prose',
					text: "For things CSS can't express; keyboard arrow-key mapping, drag/scroll math; read direction at interaction time from `getComputedStyle(el).direction`, never during render. The focus primitives (`useListFocus`, `useGridFocus`, `useTreeFocus`) already auto-detect direction from their container, so arrow keys flip for free; don't pass a direction flag to them."
				},
				{
					type: 'heading',
					level: 4,
					text: '4. useDirection() — the last resort'
				},
				{
					type: 'prose',
					text: "Reach for it only when you genuinely need the direction value during render and none of the above fit. It's SSR-safe and returns `'ltr'` outside a provider (matching `useTranslator`'s silent fallback), but it's the one path that can mismatch on hydration if the provider's direction disagrees with `<html dir>`; so prefer the options above, which resolve purely from the DOM."
				},
				{
					type: 'heading',
					level: 3,
					text: 'Translators'
				},
				{
					type: 'prose',
					text: 'Catalogs are plain JSON under `packages/core/src/lib/locales/`. Add or correct a locale by editing the file and opening a pull request; every entry is a `{defaultMessage, description?}` pair keyed by an `@astryx.*` string.'
				}
			]
		}
	]
};
