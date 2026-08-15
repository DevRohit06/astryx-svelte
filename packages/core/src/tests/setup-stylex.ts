import { beforeAll } from 'vitest';
import { userEvent } from '@vitest/browser/context';
// Imported for its side effect on the module graph, not for any binding: see below.
import '$lib/index.js';

/**
 * Load the compiled StyleX CSS into every browser-project test page.
 *
 * Nothing else does. The demo's `+layout.svelte` links `/virtual:stylex.css` in
 * dev, but a test page has no layout — so what reaches it is whatever the
 * StyleX plugin happened to have collected when Vite served its virtual sheet,
 * which is a different subset on every run. Suites asserting computed styles
 * therefore failed and passed alternately against identical code.
 *
 * The barrel import at the top is the load-bearing half, and it is why this
 * cannot simply be the `beforeAll` each suite was carrying. A `setupFiles` entry
 * runs *before* the test file's own imports, so fetching the sheet here would
 * collect even less than the per-suite version did. Importing the barrel pulls
 * every component — and therefore every `.stylex.ts` module — through the
 * plugin's transform, so the sheet is complete no matter which suite is running
 * and no matter what that suite imports.
 *
 * It has to be a *static* import. `await import(…)` here makes SvelteKit's Vite
 * plugin throw `Cannot read properties of undefined (reading 'wrapDynamicImport')`
 * — non-fatal, so the suite still passes, but the barrel never loads and the
 * sheet is quietly as incomplete as it was before. A static import is hoisted
 * and transformed normally.
 *
 * This is the CSS the package ships, served by the same plugin the package
 * builds with. It is not a stub, and it deliberately does not stand in for the
 * theme: a suite that needs theme tokens must still set `data-astryx-theme`
 * itself, as the demo does.
 */
beforeAll(async () => {
	const style = document.createElement('style');
	style.textContent = await fetch('/virtual:stylex.css').then((res) => res.text());
	document.head.append(style);
});

/**
 * Park the real mouse pointer in the bottom-right corner before each suite.
 *
 * The pointer's position is **page-global and survives across test files** —
 * it is the one piece of state `isolate: true` does not reset, because it lives
 * in the browser, not the iframe. So a suite that hovers something leaves the
 * cursor sitting there for whichever file runs next, and any component that
 * reacts to hover inherits it.
 *
 * That is not hypothetical. It is what made `hover-card`'s *does not re-show
 * hover card after Escape dismiss and refocus* fail on roughly half of the runs
 * where `layer` preceded it, and pass every time in isolation. The trace:
 *
 * ```
 * beforetoggle->closed | onOpenChange(false) | TRIGGER focusin |
 *   afterEscape active=TRIGGER | TRIGGER mouseenter | beforetoggle->open |
 *   onOpenChange(true)
 * ```
 *
 * The cursor was resting over the open card. Dismissing it uncovered the
 * trigger *underneath the stationary pointer*, so Chromium fired a boundary
 * `mouseenter` on the trigger, `scheduleShow()` ran, and the card reopened. The
 * hover card is behaving correctly — a pointer over the trigger **should**
 * reopen it — and the suite's Escape-suppression flag was never involved, which
 * is why reading the component explained nothing. Upstream never meets this:
 * jsdom has no hit-testing and fires no boundary events at all.
 *
 * `beforeAll`, not `beforeEach`: cross-*file* inheritance is the isolation
 * violation, and a file's own pointer position is its own business. That keeps
 * this to one round-trip per file rather than one per test.
 *
 * The corner is deliberate. `userEvent.unhover()` parks on `document.body`,
 * whose centre — for a short page with a small fixture — is frequently *on* the
 * fixture, which is the situation being escaped. Hovering a throwaway element
 * moves the real cursor to it, and removing the element leaves the cursor at
 * that coordinate.
 *
 * **Top**-right rather than bottom-right, which is not cosmetic: the test iframe
 * is often taller than the browser window, so a `position: fixed` element at
 * `bottom: 0` resolves to a page coordinate *below* the viewport and Playwright
 * refuses to hover it — `element is outside of the viewport`, retried until the
 * 30 s actionability timeout, which fails every file's `beforeAll` and reports
 * as every test *skipped*. Fixtures flow from the top-left, so the top-right
 * corner is both reachable and clear of them.
 */
beforeAll(async () => {
	// A `position: fixed` box is fixed to the *frame's* viewport, and Playwright
	// checks actionability against the top-level one. A scrolled frame maps this
	// corner to a page coordinate the browser viewport does not contain, which is
	// the same `element is outside of the viewport` the note above describes —
	// reached by scroll offset rather than by frame height.
	window.scrollTo(0, 0);

	const corner = document.createElement('div');
	corner.style.cssText = 'position:fixed;top:0;right:0;width:4px;height:4px;z-index:2147483647';
	document.body.append(corner);
	try {
		// **Best effort, and bounded.** Parking the pointer is hygiene, not an
		// assertion: the cost of failing is that one cross-file hover-inheritance
		// bug can resurface, and the cost of *waiting* to fail is Playwright's 30 s
		// actionability timeout — in `beforeAll`, so it takes the whole file, and
		// once per file, so it takes the whole chunk. That is not a trade worth
		// making. On CI this deterministically killed all 12 files of chunk 1 while
		// passing locally, and reported them as failures with nothing named but the
		// setup file.
		//
		// The race leaves the hover pending rather than cancelling it; the `catch`
		// is attached first so removing the corner underneath it cannot surface as
		// an unhandled rejection.
		let failure: unknown;
		const parked = userEvent.hover(corner).catch((error: unknown) => {
			failure = error;
		});
		await Promise.race([parked, new Promise((resolve) => setTimeout(resolve, 2000))]);
		if (failure) {
			console.warn('[setup] could not park the pointer; hover state may leak in:', failure);
		}
	} finally {
		corner.remove();
	}
});

/**
 * Stop a link click from navigating the test page out from under the runner.
 *
 * ## The failure this removes
 *
 * Clicking an `<a href>` in a real browser **navigates**, and the test page's
 * identity is in its *query string*:
 * `http://localhost:PORT/?sessionId=…&iframeId=…`. A click on `href="/"`
 * resolves to `http://localhost:PORT/` — same path, query gone — so the runner
 * can no longer find the frame and the whole **file** dies with
 * *"Cannot connect to the iframe. Did you change the location or submitted a
 * form? If so, don't forget to call `event.preventDefault()`…"*. vitest's
 * message says exactly what happened; it just cannot say *which* click did it.
 *
 * That is the whole of the long-standing "iframe-drop flake" — first recorded at
 * batch 11's close and misfiled as load/starvation for three batches, twice with
 * a confident wrong mechanism written into `TODO.md`. It is not load. It is four
 * cases across `breadcrumbs` and `side-nav` that click a real link.
 *
 * It *looked* like load because it is a **race**: the navigation is asynchronous,
 * so whether it lands before the file finishes — and therefore whether the
 * casualty is the clicking file or some innocent file after it — depends on
 * timing. Hence a symptom that moved between runs, aborted runs at different
 * points, and pointed at everything except its cause.
 *
 * ## Why this is in the harness and not at the four call sites
 *
 * Because two of the four have nowhere to put a `preventDefault`. Upstream's
 * cases are `<SideNavItem label="Home" href="/" data-testid="item" />` with **no
 * handler at all**, and this port transcribes them. Fixing those at the site
 * would mean inventing an `onclick` upstream does not pass or editing its
 * `href` — drift, to work around a browser the upstream suite never runs in.
 * The tax belongs where the other browser-environment taxes already live.
 *
 * ## Why suppressing it cannot hide anything
 *
 * The listener is on `window` in the **bubble** phase, so it runs after every
 * component handler, and it returns early when the event was already prevented.
 * A component that is supposed to call `preventDefault` can still be tested for
 * exactly that, because nothing here runs before it. What is suppressed is only
 * the browser's final navigation — and no test can assert *that* happened,
 * since navigating is what destroys the runner.
 *
 * Fragment links (`href="#x"`) are left alone: they keep the query string and
 * navigate nothing. So are `target`ed and `download` links, which do not move
 * this frame.
 */
beforeAll(() => {
	window.addEventListener('click', (event) => {
		const anchor = (event.target as HTMLElement | null)?.closest?.('a');
		if (!anchor || event.defaultPrevented || anchor.hasAttribute('download')) {
			return;
		}
		if (anchor.getAttribute('href') === null) {
			return;
		}
		const target = anchor.getAttribute('target');
		if (target !== null && target !== '_self') {
			return;
		}
		// Same document but for the fragment? Then nothing navigates.
		const destination = new URL(anchor.href, window.location.href);
		const here = new URL(window.location.href);
		destination.hash = '';
		here.hash = '';
		if (destination.href !== here.href) {
			event.preventDefault();
		}
	});
});
