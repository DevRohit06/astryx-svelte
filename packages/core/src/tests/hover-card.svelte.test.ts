import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import HoverCard from './fixtures/hover-card-fixture.svelte';
import HoverCardParagraph from './fixtures/hover-card-paragraph.svelte';
import HoverCardInLink from './fixtures/hover-card-in-link.svelte';
import HoverCardSafeHost from './fixtures/hover-card-safe-host.svelte';
import HoverCardNestedTheme from './fixtures/hover-card-nested-theme.svelte';
import { TIMER_BUDGET } from './timer-budget.js';
import { whenWired } from './trigger-wiring.js';

/**
 * Ported from Astryx's `HoverCard/HoverCard.test.tsx` at **v0.4.5**, which
 * declares twenty-eight cases. Twenty-four of them live here. (The count is
 * re-derived at the 0.4.5 pin, where this header last read v0.4.2; upstream's
 * file has not moved since.)
 *
 * Three of the remaining four are server-side and live in `hover-card.test.ts`,
 * which runs in the node project against `svelte/server` — the repo rule that
 * decides the project by filename. The fourth is dropped; both facts are
 * accounted for in the `SSR / hydration` note at the bottom of this file.
 *
 * Upstream's `beforeAll`/`afterAll` block is gone, exactly as it is in
 * `tooltip.svelte.test.ts` and for the same reason: it exists only to give jsdom
 * a Popover API — `showPopover`/`hidePopover` backed by a `WeakMap`, plus a
 * `matches` override so `:popover-open` answers from that map. These cases run
 * in a real Chromium, which implements all of it natively, and keeping the stub
 * would substitute a model of the thing under test for the thing itself. The
 * four cases that genuinely assert *that showPopover/hidePopover was called*
 * install the spy for that case alone, as `useLayer`'s own suite does.
 *
 * The recurring translations, each following a pattern the earlier suites set:
 *
 * - `waitFor` around a spy becomes `vi.waitFor`, which retries identically.
 * - The layer is located with a `querySelector` on the render container rather
 *   than `getByRole('dialog', {hidden: true})` / `getByText`. A closed popover
 *   is `display: none` in a real browser, and the container query is what
 *   `useLayer`'s and `Tooltip`'s suites already use for the same element.
 * - `fireEvent.focus(trigger)` becomes `trigger.focus()`. React's synthetic
 *   `focus` is the delegated `focusin`, which is what the hook listens for; a
 *   real browser only emits it from real focus.
 */

/**
 * The compiled StyleX sheet is loaded for every browser-project page by
 * `src/tests/setup-stylex.ts`, wired as the client project's `setupFiles`.
 * This suite used to carry its own `beforeAll` for it — the `applies the theme
 * body font` case below failed and passed alternately without one — and that
 * block is what the shared setup was generalised from.
 */

const originalShowPopover = HTMLElement.prototype.showPopover;
const originalHidePopover = HTMLElement.prototype.hidePopover;

afterEach(() => {
	HTMLElement.prototype.showPopover = originalShowPopover;
	HTMLElement.prototype.hidePopover = originalHidePopover;
});

/** The popover container the hover card renders its content into. */
function layerIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[popover]');
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a hover card layer');
	}
	return el;
}

/**
 * The layer, or null. `HoverCard` opts into `lazyMount` as of upstream 0.4.2, so
 * a *closed* card has no container at all — only the inert marker — and the
 * cases that assert its absence need a lookup that does not throw.
 */
function maybeLayerIn(container: HTMLElement): HTMLElement | null {
	const el = container.querySelector('[popover]');
	return el instanceof HTMLElement ? el : null;
}

/** Open the card and wait for its container to mount. */
async function open(container: HTMLElement, selector?: string): Promise<HTMLElement> {
	mouse(await triggerIn(container, selector), 'mouseenter');
	await vi.waitFor(() => {
		expect(maybeLayerIn(container)).not.toBeNull();
	});
	return layerIn(container);
}

/**
 * Async because it waits for the trigger to be *wired*, not merely present —
 * see `trigger-wiring.ts`. Every interaction below goes through here so the
 * precondition cannot be forgotten at a call site.
 */
async function triggerIn(container: HTMLElement, selector?: string): Promise<HTMLElement> {
	// `selector` narrows for the trees that wrap the card in another interactive
	// element — in `hover-card-in-link.svelte` the outer `<a>` would win the
	// default query, and hovering it opens nothing.
	const el = container.querySelector(selector ?? 'button, a, span[tabindex]');
	if (!(el instanceof HTMLElement)) {
		throw new Error('expected a trigger');
	}
	await whenWired(el);
	return el;
}

/** `mouseenter`/`mouseleave` do not bubble; the listeners sit on the element. */
function mouse(element: HTMLElement, type: 'mouseenter' | 'mouseleave'): void {
	element.dispatchEvent(new MouseEvent(type));
}

function escape(element: HTMLElement): void {
	element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

describe('HoverCard', () => {
	it('renders trigger element', async () => {
		const screen = await render(HoverCard);
		await expect.element(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
	});

	it('exposes the floating layer as role="group" when no label is provided', async () => {
		const screen = await render(HoverCard, { props: { delay: 0 } });
		// A group may validly be unnamed; an unnamed dialog may not. Without a
		// label the layer must not claim the dialog role.
		// `getByRole(…, {hidden: true})` → a container query; see the header.
		// Nothing is mounted until the card opens (`lazyMount`, upstream 0.4.2).
		expect(screen.container.querySelector('[role="group"]')).toBeNull();
		expect(screen.container.querySelector('[role="dialog"]')).toBeNull();

		await open(screen.container);

		expect(screen.container.querySelector('[role="group"]')).toHaveTextContent('Card content');
	});

	it('exposes the floating layer as a named dialog when label is provided', async () => {
		const screen = await render(HoverCard, {
			props: { label: 'Profile preview', delay: 0 }
		});
		expect(screen.container.querySelector('[role="dialog"]')).toBeNull();

		await open(screen.container);

		// Assert the accessible name via the aria-label attribute on the
		// role-carrying element — accname computation returns '' for a hidden one.
		const dialog = screen.container.querySelector('[role="dialog"]')!;
		expect(dialog).toHaveAttribute('aria-label', 'Profile preview');
		expect(dialog).toHaveTextContent('Card content');
		expect(screen.container.querySelector('[role="group"]')).toBeNull();
	});

	it('wraps element children in an inline-safe span', async () => {
		const screen = await render(HoverCardParagraph);

		const trigger = screen.getByRole('link', { name: 'Trigger' }).element();
		const paragraph = screen.container.querySelector('p');

		expect(trigger.parentElement?.tagName).toBe('SPAN');
		expect(paragraph?.querySelector('div')).toBeNull();
	});

	it('portals block content before showing and restores the marker after hiding', async () => {
		// Restated at upstream 0.4.2 (#5039), which inverted the fact this case
		// asserts. It used to be "the layer is a <span> and stays inside the <p>",
		// because the layer rendered inline and had to be phrasing content. A
		// paragraph is now an *unsafe* host: the layer mounts as a <div> outside
		// it, and only the inert <template> marker is left at the render position.
		const screen = await render(HoverCardParagraph, { props: { delay: 0, hideDelay: 0 } });

		const paragraph = screen.container.querySelector('p');
		expect(maybeLayerIn(screen.container)).toBeNull();
		expect(paragraph?.querySelector('template')).not.toBeNull();
		expect(paragraph?.querySelector('div')).toBeNull();

		const layer = await open(screen.container);

		expect(layer.tagName).toBe('DIV');
		expect(paragraph?.contains(layer)).toBe(false);
		expect(layer).toHaveTextContent('Card content');

		mouse(await triggerIn(screen.container), 'mouseleave');

		await vi.waitFor(() => {
			expect(maybeLayerIn(screen.container)).toBeNull();
			expect(paragraph?.querySelector('template')).not.toBeNull();
		});
	});

	it('hosts the floating layer outside a wrapping link', async () => {
		// Interactive ancestors capture the layer's own interactions: a card left
		// inside an <a> puts its links and buttons inside that link, so clicking
		// one navigates.
		const screen = await render(HoverCardInLink, { props: { delay: 0 } });

		const link = screen.container.querySelector('a[href="#profile"]')!;
		expect(maybeLayerIn(screen.container)).toBeNull();

		const layer = await open(screen.container, 'span[tabindex]');

		expect(link.contains(layer)).toBe(false);
	});

	it('keeps a safe layer inline at its render position', async () => {
		const screen = await render(HoverCardSafeHost, { props: { delay: 0 } });

		const layer = await open(screen.container);
		const following = screen.getByRole('button', { name: 'Following control' }).element();

		// The marker's parent is safe, so nothing moves: the container mounts where
		// the layer was written, immediately before the next control.
		expect(layer.nextElementSibling).toBe(following);
	});

	it('does not render content initially', async () => {
		const screen = await render(HoverCard);
		// `lazyMount`: only the inert marker exists until the card is asked to open.
		expect(maybeLayerIn(screen.container)).toBeNull();
		expect(screen.container.querySelector('template')).not.toBeNull();
	});

	it('keeps a paragraph portal inside the nearest nested theme scope', async () => {
		const screen = await render(HoverCardNestedTheme, { props: { delay: 0 } });

		const layer = await open(screen.container);
		const innerThemeScope = screen.container.querySelector(
			'[data-astryx-theme="hovercard-inner-test"]'
		);

		expect(innerThemeScope).not.toBeNull();
		expect(layer.querySelector('button')).not.toBeNull();
		expect(layer.parentElement).toBe(innerThemeScope);
		expect(innerThemeScope?.contains(layer)).toBe(true);
		expect(screen.container.querySelector('p')?.contains(layer)).toBe(false);
	});

	/**
	 * Counterpart to upstream's `does not freeze computed CSS variables on a
	 * paragraph portal`. Upstream stubs `window.getComputedStyle` to answer with a
	 * fixed map of custom properties, because jsdom resolves none — so its version
	 * can only check that nothing was written *onto* the element.
	 *
	 * A real browser resolves them, so the stronger half is available and is the
	 * one that matters: a property set on the corrective host *after* the layer
	 * moved there still reaches it. A snapshot taken at portal time would not
	 * update, and an absent-inline-property check alone cannot tell the two apart.
	 */
	it('does not freeze computed CSS variables on a paragraph portal', async () => {
		const screen = await render(HoverCardParagraph, { props: { delay: 0 } });

		const layer = await open(screen.container);
		expect(screen.container.querySelector('p')?.contains(layer)).toBe(false);

		// Nothing about the theme is snapshotted onto the element…
		const inline = Array.from({ length: layer.style.length }, (_, i) => layer.style.item(i));
		expect(inline.some((property) => property.startsWith('--'))).toBe(false);

		// …so a custom property set on the corrective host still reaches it live.
		const host = layer.parentElement as HTMLElement;
		host.style.setProperty('--test-hovercard-color', 'rgb(1, 2, 3)');
		expect(getComputedStyle(layer).getPropertyValue('--test-hovercard-color').trim()).toBe(
			'rgb(1, 2, 3)'
		);
		host.style.removeProperty('--test-hovercard-color');
	});

	/**
	 * Restated. Upstream asserts the computed `fontFamily` is the literal string
	 * `'var(--font-family-body)'`, which only holds in jsdom — it does not resolve
	 * custom properties, so the declaration comes back verbatim. A real browser
	 * resolves it, so the same fact has to be asked the way `leaves.svelte.test.ts`
	 * asks it: compare the layer's computed font against the value
	 * `--font-family-body` resolves to on the page, through a probe so both sides
	 * are serialised identically. That is the fact upstream's assertion is a proxy
	 * for — the layer opts out of the popover's default font and takes the theme's
	 * — and it holds under any theme rather than only the default one.
	 */
	it('applies the theme body font to the floating layer', async () => {
		// The card has to be open for the container to exist at all (`lazyMount`).
		const screen = await render(HoverCard, { props: { delay: 0 } });

		const layer = await open(screen.container);
		const bodyFont = getComputedStyle(document.documentElement)
			.getPropertyValue('--font-family-body')
			.trim();
		const probe = document.createElement('span');
		probe.style.fontFamily = bodyFont;
		document.body.append(probe);
		const expected = getComputedStyle(probe).fontFamily;
		probe.remove();

		expect(expected).not.toBe('');
		expect(getComputedStyle(layer).fontFamily).toBe(expected);
	});

	it('injects aria-describedby on trigger', async () => {
		const screen = await render(HoverCard);
		const trigger = screen.getByRole('button', { name: 'Trigger' }).element();
		expect(trigger).toHaveAttribute('aria-describedby');
	});

	it('merges existing aria-describedby', async () => {
		const screen = await render(HoverCard, { props: { triggerDescribedBy: 'existing-id' } });
		const trigger = screen.getByRole('button', { name: 'Trigger' }).element();
		const describedBy = trigger.getAttribute('aria-describedby');
		expect(describedBy).toContain('existing-id');
	});

	it('calls onOpenChange(true) when shown', async () => {
		const onOpenChange = vi.fn();
		const screen = await render(HoverCard, { props: { onOpenChange, delay: 0 } });

		mouse(await triggerIn(screen.container), 'mouseenter');

		await vi.waitFor(() => {
			expect(onOpenChange).toHaveBeenCalledWith(true);
		});
	});

	it('respects isEnabled prop', async () => {
		const onOpenChange = vi.fn();
		const screen = await render(HoverCard, {
			props: { onOpenChange, isEnabled: false, delay: 0 }
		});

		mouse(await triggerIn(screen.container), 'mouseenter');

		// Wait a bit and verify onOpenChange was not called
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('supports text-only children with inline wrapper', async () => {
		// `children` as a prop, not component content: Svelte wraps content in a
		// snippet whatever it holds, so this is the only form that reaches the
		// text branch. Recorded with `Tooltip`'s identical constraint.
		const screen = await render(HoverCard, { props: { children: 'Just text, no element' } });
		// Text should be rendered
		const wrapper = screen.getByText('Just text, no element').element();
		expect(wrapper).toBeInTheDocument();
		// Should have aria-describedby on the wrapper span
		expect(wrapper.tagName).toBe('SPAN');
		expect(wrapper).toHaveAttribute('aria-describedby');
	});

	describe('isDefaultOpen', () => {
		it('shows hover card on mount when isDefaultOpen is true', async () => {
			const showPopover = vi.fn(originalShowPopover);
			HTMLElement.prototype.showPopover = showPopover;

			await render(HoverCard, { props: { contentText: 'Default open card', isDefaultOpen: true } });

			await vi.waitFor(() => {
				expect(showPopover).toHaveBeenCalled();
			});
		});

		it('calls onOpenChange(true) on mount when isDefaultOpen is true', async () => {
			const onOpenChange = vi.fn();
			await render(HoverCard, {
				props: { contentText: 'Default open card', isDefaultOpen: true, onOpenChange }
			});

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});
		});

		it('does not show hover card on mount when isDefaultOpen is not set', async () => {
			const showPopover = vi.fn(originalShowPopover);
			HTMLElement.prototype.showPopover = showPopover;

			await render(HoverCard, { props: { contentText: 'Not default open' } });

			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(showPopover).not.toHaveBeenCalled();
		});

		it('hover card is still dismissible after isDefaultOpen', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(HoverCard, {
				props: {
					contentText: 'Dismissible card',
					isDefaultOpen: true,
					onOpenChange,
					hideDelay: 0
				}
			});

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(true);
			});

			// Gated on the hide timer, so it gets the timer budget — see
			// `timer-budget.ts`.
			mouse(await triggerIn(screen.container), 'mouseleave');

			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledWith(false);
			}, TIMER_BUDGET);
		});
	});

	describe('Escape key behavior', () => {
		it('hides hover card when Escape is pressed on trigger', async () => {
			const onOpenChange = vi.fn();
			const showPopover = vi.fn(originalShowPopover);
			const hidePopover = vi.fn(originalHidePopover);
			HTMLElement.prototype.showPopover = showPopover;
			HTMLElement.prototype.hidePopover = hidePopover;

			const screen = await render(HoverCard, {
				props: { onOpenChange, delay: 0, hideDelay: 0 }
			});

			const trigger = await triggerIn(screen.container);

			// Show the hover card
			mouse(trigger, 'mouseenter');
			await vi.waitFor(() => {
				expect(showPopover).toHaveBeenCalled();
			});

			// Press Escape on trigger
			escape(trigger);

			// hidePopover should be called
			await vi.waitFor(() => {
				expect(hidePopover).toHaveBeenCalled();
			});
		});

		it('hides hover card when Escape is pressed inside content', async () => {
			const showPopover = vi.fn(originalShowPopover);
			const hidePopover = vi.fn(originalHidePopover);
			HTMLElement.prototype.showPopover = showPopover;
			HTMLElement.prototype.hidePopover = hidePopover;

			const screen = await render(HoverCard, {
				props: { contentAs: 'button', contentText: 'Interactive button', delay: 0, hideDelay: 0 }
			});

			const trigger = await triggerIn(screen.container);

			// Show the hover card
			mouse(trigger, 'mouseenter');
			await vi.waitFor(() => {
				expect(showPopover).toHaveBeenCalled();
			});

			// Find the interactive content inside the popover
			const contentButton = layerIn(screen.container).querySelector('button')!;
			escape(contentButton);

			// hidePopover should be called
			await vi.waitFor(() => {
				expect(hidePopover).toHaveBeenCalled();
			});
		});

		it('refocuses trigger after Escape from content', async () => {
			const screen = await render(HoverCard, {
				props: { contentAs: 'button', contentText: 'Interactive button', delay: 0, hideDelay: 0 }
			});

			const trigger = await triggerIn(screen.container);

			// Show the hover card via focus. Upstream waits on the `showPopover` spy
			// its `beforeAll` left installed; the case's own assertion is the refocus
			// below, so the wait asks the browser directly instead of adding a spy.
			trigger.focus();
			await vi.waitFor(() => {
				expect(layerIn(screen.container).matches(':popover-open')).toBe(true);
			});

			// Focus the content button
			const contentButton = layerIn(screen.container).querySelector('button')!;
			contentButton.focus();

			// Press Escape - should refocus trigger
			escape(contentButton);

			await vi.waitFor(() => {
				expect(document.activeElement).toBe(trigger);
			});
		});

		it('does not re-show hover card after Escape dismiss and refocus', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(HoverCard, {
				props: {
					contentAs: 'button',
					contentText: 'Interactive button',
					onOpenChange,
					delay: 0,
					hideDelay: 0
				}
			});

			const trigger = await triggerIn(screen.container);

			// Show the hover card via focus
			trigger.focus();
			await vi.waitFor(() => {
				expect(onOpenChange).toHaveBeenCalledTimes(1);
			});

			// Focus the content button
			const contentButton = layerIn(screen.container).querySelector('button')!;
			contentButton.focus();

			// Clear the mock to track new calls
			onOpenChange.mockClear();

			// Press Escape - this refocuses trigger but shouldn't re-show
			escape(contentButton);

			// Wait a bit and verify onOpenChange was not called with true (re-show)
			// It may be called with false (dismiss), which is expected
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(onOpenChange).not.toHaveBeenCalledWith(true);
		});
	});

	/*
	 * `SSR / hydration` — upstream's fourth describe block, four cases.
	 *
	 * Regression coverage for the hydration mismatch (#3107). The floating layer
	 * used to be portaled into document.body behind a
	 * `typeof document !== 'undefined'` gate: the server rendered nothing while
	 * the first client render emitted the portal, so the two trees disagreed. The
	 * layer is now rendered inline as inline-safe phrasing markup (a
	 * `<span popover>`), identically on the server and the client, so there is
	 * nothing for hydration to mismatch.
	 *
	 * Its first two cases assert on `renderToString` output only, and are ported
	 * verbatim in `hover-card.test.ts` (node project). Of the remaining two:
	 *
	 * - `hydrates a default-open hover card without a mismatch` is **restated**
	 *   there as `keeps a default-open hover card closed in server markup`. Its
	 *   server-side half — `isDefaultOpen` must not leak the open state into SSR
	 *   markup, because the open call happens in an effect after hydration —
	 *   survives, and is asserted more strictly than upstream's
	 *   `toContain('popover="manual"')` by diffing the whole string against the
	 *   markup rendered without the prop.
	 *
	 * - `server markup matches the first client render (no hydration mismatch)`
	 *   is **dropped**. Not for want of a Svelte counterpart to the assertion —
	 *   `StrictMode` and `onRecoverableError` have none, but Svelte reports a
	 *   hydration disagreement as the dev-only `hydration_mismatch` console
	 *   warning, so upstream's console filter would translate directly. It is
	 *   dropped because no project here can run the case at all: a `.svelte`
	 *   module is compiled for exactly one target per Vite transform, so the
	 *   client project (where a DOM exists to hydrate into) holds only the DOM
	 *   build and cannot produce server markup, and the node project holds only
	 *   the server build and cannot hydrate. Verified, not assumed — calling
	 *   `svelte/server`'s `render` on a fixture inside this file throws
	 *   `Cannot read properties of null (reading 'nodes')` out of the *client*
	 *   template runtime. Closing this needs a third vitest project that
	 *   transforms components twice; recorded under "Known debts" in port/debts.md.
	 *   The property it protects is not unguarded in the meantime: the two node
	 *   cases pin the server markup as inline-safe phrasing content with no
	 *   `<div>`, which is the shape the mismatch came from.
	 */
});
