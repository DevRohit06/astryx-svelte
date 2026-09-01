/** PORTS: MobileNav/MobileNavScrollbarGutter.test.tsx */

import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MobileNavProbe from './fixtures/mobile-nav-probe.svelte';

/**
 * Ported from Astryx's `MobileNav/MobileNavScrollbarGutter.test.tsx`, all **3**
 * cases at the 0.5.0 pin. Nothing is dropped.
 *
 * `MobileNav` clips the document to lock background scroll, which hides a
 * classic scrollbar and widens the layout viewport by its width — the page
 * behind the drawer jumps sideways. The clip has to be paired with holding that
 * gutter open, which is what `holdScrollbarGutter` does and what these three
 * cases pin. The drawer holds the gutter on `document.documentElement`, not on
 * the body: `overflow: clip` is set there, so that is the element whose box the
 * clip can grow.
 *
 * Runs in the **client** project. The whole subject is document-level layout —
 * a `<dialog>` that has to be `showModal()`-ed for the clip to mean anything,
 * and a `scrollbar-gutter` declaration read back off `documentElement.style` —
 * none of which the node project has.
 *
 * ## Two translations
 *
 * - Upstream installs a `beforeAll` that replaces
 *   `HTMLDialogElement.prototype.showModal`/`close` with attribute toggles,
 *   because jsdom implements neither. Chromium implements both, and unlike
 *   `mobile-nav.svelte.test.ts` — which keeps the mock so it can observe the
 *   call and strip the top-layer side effects its click assertions would
 *   otherwise fight — nothing here asserts on the dialog at all. The real
 *   implementations run, which makes the clip and the gutter a real one. Same
 *   choice `mobile-nav-close-visibility.svelte.test.ts` already makes.
 * - React's `rerender` is `screen.rerender`, which merges new props into the
 *   existing instance. The probe's prop bag is `navProps` — see the fixture for
 *   why it cannot be called `props`.
 *
 * The viewport stub is upstream's and is load-bearing for the same reason it is
 * in `scrollbar-gutter.svelte.test.ts`: `window.innerWidth` against
 * `documentElement.clientWidth` is how a classic scrollbar is told from an
 * overlay one, and pinning the pair makes each case's scrollbar an *input*
 * rather than a property of the machine running the suite.
 */

/** jsdom does no layout, so both halves of the measurement are stubbed. */
function stubViewport(innerWidth: number, clientWidth: number) {
	Object.defineProperty(window, 'innerWidth', {
		value: innerWidth,
		configurable: true,
		writable: true
	});
	Object.defineProperty(document.documentElement, 'clientWidth', {
		value: clientWidth,
		configurable: true
	});
}

const rootGutter = () => document.documentElement.style.scrollbarGutter;

const drawerProps = (isOpen: boolean) => ({
	navProps: { isOpen, onOpenChange: () => {} },
	text: 'Nav content'
});

describe('MobileNav scrollbar gutter', () => {
	afterEach(() => {
		document.documentElement.style.cssText = '';
		// @ts-expect-error -- drop the viewport stub so the browser's own value comes back
		delete document.documentElement.clientWidth;
		// @ts-expect-error -- the iframe's window outlives the case; upstream's jsdom does not
		delete window.innerWidth;
	});

	it('holds the gutter open while the drawer is open', async () => {
		stubViewport(1024, 1009);

		const view = await render(MobileNavProbe, { props: drawerProps(true) });

		expect(document.documentElement.style.overflow).toBe('clip');
		expect(rootGutter()).toBe('stable');

		await view.unmount();

		expect(document.documentElement.style.overflow).toBe('');
		expect(rootGutter()).toBe('');
	});

	it('gives the gutter back when the drawer closes', async () => {
		stubViewport(1024, 1009);

		const view = await render(MobileNavProbe, { props: drawerProps(true) });

		expect(rootGutter()).toBe('stable');

		await view.rerender(drawerProps(false));

		expect(rootGutter()).toBe('');
	});

	it('holds nothing when the scrollbar is an overlay one', async () => {
		stubViewport(1024, 1024);

		await render(MobileNavProbe, { props: drawerProps(true) });

		expect(document.documentElement.style.overflow).toBe('clip');
		expect(rootGutter()).toBe('');
		expect(document.documentElement.style.paddingRight).toBe('');
	});
});
