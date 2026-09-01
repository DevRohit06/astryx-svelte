/** PORTS: hooks/useFocusTrapEscapeShim.test.tsx */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { hasActiveFocusTrapEscape } from '$lib/hooks/use-focus-trap.svelte.js';
import Lightbox from '$lib/components/lightbox/lightbox.svelte';
import DialogProbe from './fixtures/dialog-probe.svelte';
import MobileNavProbe from './fixtures/mobile-nav-probe.svelte';
import NestedTraps from './fixtures/escape-shim-nested-traps.svelte';
import Popover from './fixtures/popover-fixture.svelte';
import PopoverInDialog from './fixtures/escape-shim-popover-in-dialog.svelte';
import TooltipFixture from './fixtures/tooltip-fixture.svelte';
import Trap from './fixtures/escape-shim-trap.svelte';

/**
 * Ported from Astryx's `hooks/useFocusTrapEscapeShim.test.tsx` — **all 11 of
 * its cases at the 0.5.0 pin**. Nothing is dropped.
 *
 * The suite guards a deprecated public predicate, and what it guards is the
 * *answer*, not the implementation: `hasActiveFocusTrapEscape()` must keep
 * meaning "an Escape-dismissible FOCUS TRAP is active" rather than "a layer is
 * open". Upstream needs the guard because 0.5.0 moved Escape onto a shared
 * dismissal stack that also carries families which never trap focus — tooltips,
 * hover cards, dialogs — and a shim that counted those would tell
 * `BottomSheetSwitcher` a trap sits above it when none does, so the sheet would
 * stop closing. `bottom-sheet-switcher.svelte` gates its dismissal on the same
 * call here, so the hazard is this port's too.
 *
 * **The shared stack landed in batch 035, and the shim was re-based onto a
 * trap-only count in the same change** — which is what these four "is false"
 * cases existed to force. `useFocusTrap` now registers on
 * `Layer/useLayerDismissal` like every other family and its sixty lines of
 * private registry are gone; what remains beside it is `activeEscapeTrapCount`,
 * driven by the same `isActive && onEscape != null` expression that does the
 * registering, so the count and the registration cannot disagree. Reading the
 * shared stack instead would break exactly the four cases below, because that
 * stack carries families which never trap focus.
 *
 * This header previously said the four cases "will start failing" when the
 * stack landed. They did not, and the claim was imprecise rather than wrong:
 * adding a separate registry changes nothing on its own. The failure is real
 * but conditional on pointing the shim at the shared stack.
 *
 * Upstream's `afterEach(resetLayerStackForTests)` has no counterpart for the
 * same reason: there is no second stack for these components to leave entries
 * in, and the trap's own stack is unwound by effect teardown at cleanup.
 *
 * Its `beforeEach` — stubbing `HTMLDialogElement.prototype.showModal`/`close` —
 * is dropped with it, as `popover.svelte.test.ts` already drops the identical
 * block: a real Chromium implements both natively, and keeping the stub would
 * substitute a model of the thing under test for the thing itself.
 *
 * The other translations:
 *
 * - Upstream's local `Trap` component becomes `fixtures/escape-shim-trap.svelte`
 *   — a trap arrives here as an **attachment** on a real element, which can only
 *   be written in a template. Its `<Trap><Trap /></Trap>` nesting is component
 *   content, so it needs a second fixture.
 * - Every family is rendered through the fixture the suite for that component
 *   already uses, because `children` (and `Popover.content`) are snippets and a
 *   snippet cannot be authored in a `render()` props object. `Lightbox` takes no
 *   children and is rendered directly.
 * - Each family case first waits for the layer to actually be showing before
 *   reading the shim. React's `render` flushes effects synchronously, so
 *   upstream's bare assertion is already made against a mounted, open layer; an
 *   unguarded synchronous read here could pass by arriving early instead. The
 *   wait is what makes the ported assertion as strong as the one it ports, not
 *   an addition to it.
 * - `rerender` maps straight across, and `unmount` is `screen.unmount()`.
 */

const noop = () => {};

describe('hasActiveFocusTrapEscape', () => {
	it('is false with nothing mounted', () => {
		expect(hasActiveFocusTrapEscape()).toBe(false);
	});

	it('is true for an active trap with an Escape handler', async () => {
		await render(Trap);
		expect(hasActiveFocusTrapEscape()).toBe(true);
	});

	it('is false for a trap with no Escape handler', async () => {
		await render(Trap, { props: { hasEscape: false } });
		expect(hasActiveFocusTrapEscape()).toBe(false);
	});

	it('is false for an inactive trap', async () => {
		await render(Trap, { props: { isActive: false } });
		expect(hasActiveFocusTrapEscape()).toBe(false);
	});

	it('is true for nested traps, and false again once both unmount', async () => {
		const screen = await render(NestedTraps);
		expect(hasActiveFocusTrapEscape()).toBe(true);
		screen.unmount();
		expect(hasActiveFocusTrapEscape()).toBe(false);
	});

	it('is true for an open Popover, which traps focus', async () => {
		const screen = await render(Popover, {
			props: {
				isOpen: true,
				onOpenChange: noop,
				label: 'Popover',
				contentText: 'Popover body'
			}
		});
		await expect.element(screen.getByText('Popover body', { exact: true })).toBeVisible();
		expect(hasActiveFocusTrapEscape()).toBe(true);
	});

	// The families below are all Escape-dismissible and none of them traps
	// focus. Answering `true` for these is what broke the bottom sheet.
	it('is false for an open Dialog', async () => {
		const screen = await render(DialogProbe, {
			props: {
				props: { isOpen: true, onOpenChange: noop, 'aria-label': 'Dialog' },
				text: 'Body'
			}
		});
		await expect.element(screen.getByText('Body', { exact: true })).toBeVisible();
		expect(hasActiveFocusTrapEscape()).toBe(false);
	});

	it('is false for an open Lightbox', async () => {
		const screen = await render(Lightbox, {
			props: {
				isOpen: true,
				onOpenChange: noop,
				media: { src: '/photo.jpg', alt: 'A photo' }
			}
		});
		await expect.element(screen.getByAltText('A photo')).toBeInTheDocument();
		expect(hasActiveFocusTrapEscape()).toBe(false);
	});

	it('is false for an open MobileNav', async () => {
		const screen = await render(MobileNavProbe, {
			props: {
				navProps: { isOpen: true, onOpenChange: noop, label: 'Drawer' },
				text: 'Nav'
			}
		});
		await expect.element(screen.getByText('Nav', { exact: true })).toBeVisible();
		expect(hasActiveFocusTrapEscape()).toBe(false);
	});

	it('is false for a showing Tooltip', async () => {
		const screen = await render(TooltipFixture, {
			props: { content: 'Tip', isDefaultOpen: true }
		});
		await expect.element(screen.getByText('Tip', { exact: true })).toBeVisible();
		expect(hasActiveFocusTrapEscape()).toBe(false);
	});

	it('is true for a Popover inside a Dialog, and false once the Popover closes', async () => {
		const screen = await render(PopoverInDialog, { props: { isPopoverOpen: true } });
		await expect.element(screen.getByText('Popover body', { exact: true })).toBeVisible();
		expect(hasActiveFocusTrapEscape()).toBe(true);

		await screen.rerender({ isPopoverOpen: false });
		await expect.element(screen.getByText('Popover body', { exact: true })).not.toBeVisible();
		expect(hasActiveFocusTrapEscape()).toBe(false);
	});
});
