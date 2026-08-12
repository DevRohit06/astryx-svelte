/**
 * Google Analytics 4, loaded off the main thread by Partytown.
 *
 * ## Why Partytown
 *
 * `gtag.js` is ~90kB of script that runs on the main thread, and every
 * millisecond of it competes with hydration on a site whose whole pitch is that
 * it renders fast. Partytown moves it into a web worker: the page inlines a
 * small loader, the loader spins up a worker with a synthetic DOM, and the
 * analytics script runs there. Nothing in it blocks paint or interaction.
 *
 * ## How the pieces line up
 *
 * Three scripts go into `<head>`, in this order, and each is doing something the
 * others cannot:
 *
 *  1. **The Partytown snippet.** Inlined (see `vite-plugin-partytown.mjs`). It
 *     patches `window.dataLayer.push` on the main thread so calls made *here*
 *     are queued and replayed into the worker, then — on `DOMContentLoaded` —
 *     starts the worker and hands it every `text/partytown` script it finds.
 *  2. **`gtag.js`, as `type="text/partytown"`.** That type is not a script type
 *     any browser executes, which is exactly the point: the main thread skips
 *     it and Partytown claims it.
 *  3. **The bootstrap, also `text/partytown`.** Google's usual four lines. They
 *     have to run *in the worker* rather than on the page, because the
 *     `dataLayer` array `gtag.js` actually reads is the worker's. The
 *     main-thread array is a forwarding stub, which is why `trackPageView`
 *     below pushes to it instead of calling `gtag()` — there is no real `gtag`
 *     on this side of the boundary.
 *
 * `www.googletagmanager.com` reflects the requesting origin in
 * `Access-Control-Allow-Origin`, so the worker can fetch it directly and this
 * needs none of the `resolveUrl` reverse-proxying Partytown's docs describe for
 * third parties that omit CORS headers.
 *
 * ## Single-page navigation
 *
 * `gtag('config', …)` sends one `page_view` and then nothing: it fires on script
 * load, and after that this site never loads a document again — SvelteKit swaps
 * the DOM. Without `trackPageView` every session would report exactly one page.
 *
 * ## What this costs, measured against a preview build
 *
 * - **~6s from click to beacon** on a client-side navigation, against ~1.5s for
 *   the initial `page_view`. The difference is the main-thread → worker hop plus
 *   gtag's own batching. Analytics is not a real-time surface, so this is a fine
 *   trade for the main thread it gives back — but it is why a hit looks missing
 *   if you only watch the network panel for a second or two.
 * - **The worker's `location` drops the port.** A local run reports
 *   `http://localhost/docs/tokens?x=1` for a page served on `:4173`; scheme,
 *   path and query all survive. Production has no explicit port, so `dl` is
 *   correct there — but it makes local verification look wrong.
 * - **No service worker means no analytics.** Partytown's snippet returns early
 *   unless `navigator.serviceWorker` or `crossOriginIsolated` is available, and
 *   its 10s fallback re-runs only *inline* `text/partytown` scripts on the main
 *   thread — a `src` one, which `gtag.js` is, is not recovered. So a browser
 *   with service workers disabled silently reports nothing. Accepted: the
 *   alternative is loading gtag on the main thread for everyone.
 *
 * ## Turning it on
 *
 * Set `PUBLIC_GA_MEASUREMENT_ID`. Unset — which is the committed default in
 * `.env`, and so the state of every local checkout — none of this renders and
 * the snippet is dead-code-eliminated out of the bundle. That is deliberate:
 * a contributor running the docs site should not be posting to production
 * analytics, and CI should not need a secret to build.
 */

import { PUBLIC_GA_MEASUREMENT_ID } from '$env/static/public';
import PARTYTOWN_SNIPPET from 'virtual:partytown-snippet';

/**
 * The measurement id, or `''` when it is unset or malformed.
 *
 * The shape check is not paranoia about the environment so much as about the
 * splice below: this value is interpolated into a JavaScript string literal
 * inside an inline `<script>`, and a quote in it would close that literal early.
 * A typo failing closed (no analytics) is also better than a typo shipping a
 * `<script>` that throws on every page.
 */
export const GA_MEASUREMENT_ID = /^G-[A-Z0-9]+$/i.test(PUBLIC_GA_MEASUREMENT_ID)
	? PUBLIC_GA_MEASUREMENT_ID
	: '';

/** Google's standard bootstrap, verbatim, run inside the worker. */
const BOOTSTRAP = [
	'window.dataLayer = window.dataLayer || [];',
	'function gtag(){dataLayer.push(arguments);}',
	"gtag('js', new Date());",
	`gtag('config', '${GA_MEASUREMENT_ID}');`
].join('\n');

/**
 * The whole `<head>` block, as markup, or `''` when analytics is off.
 *
 * Assembled here rather than in `analytics.svelte` because a `<script>` element
 * written in Svelte markup has its *contents* parsed as a template — see
 * `seo.svelte`, which has to spell its closing tag `<${'/'}script>` for that
 * reason. In a `.ts` module the same strings are just strings.
 */
export const GA_HEAD = GA_MEASUREMENT_ID
	? [
			`<script>${PARTYTOWN_SNIPPET}</script>`,
			`<script type="text/partytown" src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>`,
			`<script type="text/partytown">${BOOTSTRAP}</script>`
		].join('\n')
	: '';

/**
 * Report a client-side navigation as a `page_view`.
 *
 * Pushed as a plain array rather than through a `gtag()` wrapper, which would
 * push an `arguments` object. **This was measured, not assumed:** pushing
 * `arguments` through the forwarding stub produces no hit at all, because it has
 * to survive Partytown's serialisation and a structured clone on the way to the
 * worker and does not arrive as anything `gtag.js` recognises. An array does —
 * gtag's command queue only wants something indexable with a `length`.
 *
 * Reads `document`/`location` at call time instead of taking the SvelteKit
 * `page` state, because `page.url.origin` is a placeholder in prerendered
 * output and the title is set by `svelte:head` on the real DOM.
 */
export function trackPageView(): void {
	if (!GA_MEASUREMENT_ID) return;

	// The stub the Partytown snippet patched; `??=` covers the window before it
	// has run, where the push is a no-op into an array nobody drains.
	const dataLayer = (window.dataLayer ??= []);

	dataLayer.push([
		'event',
		'page_view',
		{
			page_location: location.href,
			page_title: document.title
		}
	]);
}
