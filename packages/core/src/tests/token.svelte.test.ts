/** PORTS: Token/Token.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Token from '$lib/components/token/token.svelte';
import type { TokenColor } from '$lib/components/token/token.stylex.js';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Astryx's `Token/Token.test.tsx` at the 0.5.0 pin — **42 upstream cases, 42 here**,
 * ported case for case across 6 describe blocks: `Token` 18,
 * `Token accessibility` 11, `Token link with remove button` 9 (new in 0.3.0),
 * `Token text overflow` 2, `Token size` 1, `Token focus outline` 1.
 *
 * **The previous header was wrong.** It claimed "32 cases … `Token` 17" against
 * 0.2.0, where upstream's `Token` block already had 18 and the file 33: the
 * `reflects a custom (theme-augmented) color` case was missing here,
 * undocumented — it was presumably dropped while `TokenColorMap` was still a
 * closed union, and not restored when 0.2.0 opened the augmentation seam. It is
 * restored below. Counts re-derived by enumerating both tags' sources.
 *
 * `icon` and `endContent` are `ReactNode` props upstream and Svelte `Snippet`s
 * here, so the two cases that pass an inline element go through the shared
 * `slot-probe`, which fills a named slot with a `<span data-testid>{text}</span>`.
 *
 * The remove button's accessible name comes from the i18n key
 * `@astryx.token.remove` → "Remove {label}", resolved against the shipped `en`
 * catalog with no provider (its `createContext` default upstream).
 *
 * Three cases are *counterparts* rather than translations, commented at each:
 * the `forwards ref` trio. `Token` is a closed-prop-list root — it spreads no
 * rest props and exposes no `ref`, so there is no attachment seam a consumer
 * could thread through props (unlike `Item`/`Link`, which spread rest). The
 * mechanism a consumer actually has is the rendered root element itself, so the
 * counterpart asserts `container.firstElementChild instanceof <the right
 * element>` — keeping upstream's `instanceof` assertion form, and checking the
 * concrete element type rather than only proving a callback ran.
 *
 * The `Token link with remove button` block covers 0.3.0's change: with both
 * `href` and `onRemove`, the remove `<button>` becomes a *sibling* of the link
 * inside a `<span>` container that delegates to it (`token-link.svelte`).
 * Upstream's `fireEvent.click`/`fireEvent.mouseUp` become the equivalent
 * synchronous `dispatchEvent(new MouseEvent(…))` — an untrusted click still runs
 * a link's activation behaviour, which is exactly what the delegation relies on,
 * and the browser driver's real mouse would move focus and interleave frames.
 */

describe('Token', () => {
	it('renders with label', async () => {
		const screen = await render(Token, { props: { label: 'Tag' } });
		await expect.element(screen.getByText('Tag', { exact: true })).toBeInTheDocument();
	});

	it('renders as a span by default', async () => {
		const screen = await render(Token, { props: { label: 'Tag' } });
		// `firstElementChild` rather than upstream's `firstChild`: identical when
		// the root is an element, and skips any Svelte anchor comment nodes.
		expect(screen.container.firstElementChild?.nodeName).toBe('SPAN');
	});

	it('renders each color variant', async () => {
		const colors = [
			'default',
			'red',
			'orange',
			'yellow',
			'green',
			'teal',
			'cyan',
			'blue',
			'purple',
			'pink',
			'gray'
		] as const;

		for (const color of colors) {
			const screen = await render(Token, {
				props: { label: color, color, 'data-testid': `token-${color}` }
			});
			await expect.element(screen.getByTestId(`token-${color}`)).toBeInTheDocument();
			await expect.element(screen.getByText(color, { exact: true })).toBeInTheDocument();
			screen.unmount();
		}
	});

	it('reflects a custom (theme-augmented) color as a class and data attribute', async () => {
		// Themes extend TokenColorMap via module augmentation and supply the styling
		// through generated theme CSS; the runtime just forwards the value as the
		// stable class + data-color reflection so the theme selector can match. The
		// cast simulates a consumer-augmented color.
		const screen = await render(Token, {
			props: {
				label: 'Brand',
				color: 'brand' as TokenColor,
				'data-testid': 'token-custom'
			}
		});
		const token = screen.getByTestId('token-custom');
		await expect.element(token).toHaveClass('astryx-token');
		await expect.element(token).toHaveClass('brand');
		await expect.element(token).toHaveAttribute('data-color', 'brand');
	});

	it('renders as a span with invisible button when onClick is provided', async () => {
		const handleClick = vi.fn();
		const screen = await render(Token, {
			props: { label: 'Clickable', onclick: handleClick, 'data-testid': 'token' }
		});
		const button = screen.getByRole('button', { name: 'Clickable', exact: true });
		await expect.element(button).toBeInTheDocument();
		expect(button.element().tagName).toBe('BUTTON');
		// Container is a span, not a button
		const container = screen.getByTestId('token');
		expect(container.element().tagName).toBe('SPAN');
		await userEvent.click(button);
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('fires onClick when clicking the container span', async () => {
		const handleClick = vi.fn();
		const screen = await render(Token, {
			props: { label: 'Clickable', onclick: handleClick, 'data-testid': 'token' }
		});
		// Direct dispatch on the container (target = the span itself), matching
		// upstream's `fireEvent.click(container)`: the delegate path is what fires,
		// since `event.target.closest('button, a')` is null for the bare span.
		const container = screen.getByTestId('token').element();
		container.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('renders as a link when href is provided', async () => {
		const screen = await render(Token, { props: { label: 'Link', href: '/test' } });
		const link = screen.getByRole('link', { name: 'Link', exact: true });
		await expect.element(link).toBeInTheDocument();
		expect(link.element().tagName).toBe('A');
		await expect.element(link).toHaveAttribute('href', '/test');
	});

	it('shows remove button when onRemove is provided', async () => {
		const handleRemove = vi.fn();
		const screen = await render(Token, { props: { label: 'Removable', onRemove: handleRemove } });
		const removeButton = screen.getByRole('button', { name: 'Remove Removable', exact: true });
		await expect.element(removeButton).toBeInTheDocument();
		await userEvent.click(removeButton);
		expect(handleRemove).toHaveBeenCalledTimes(1);
	});

	it('stops propagation when remove button is clicked', async () => {
		const handleRemove = vi.fn();
		const handleClick = vi.fn();
		const screen = await render(Token, {
			props: { label: 'Token', onclick: handleClick, onRemove: handleRemove }
		});
		const removeButton = screen.getByRole('button', { name: 'Remove Token', exact: true });
		await userEvent.click(removeButton);
		expect(handleRemove).toHaveBeenCalledTimes(1);
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('renders disabled state', async () => {
		const handleClick = vi.fn();
		const screen = await render(Token, {
			props: { label: 'Disabled', onclick: handleClick, isDisabled: true, 'data-testid': 'token' }
		});
		const button = screen.getByRole('button', { name: 'Disabled', exact: true });
		await expect.element(button).toBeDisabled();
		expect(button.element().tagName).toBe('BUTTON');
		// Container click is also disabled (the span's onclick is undefined)
		const container = screen.getByTestId('token').element();
		container.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('hides label visually when isLabelHidden is true', async () => {
		const screen = await render(Token, { props: { label: 'Hidden', isLabelHidden: true } });
		// Label text is still in the DOM for screen readers
		await expect.element(screen.getByText('Hidden', { exact: true })).toBeInTheDocument();
		// Root element should have aria-label
		const root = screen.getByText('Hidden', { exact: true }).element().closest('span[aria-label]');
		expect(root).toHaveAttribute('aria-label', 'Hidden');
	});

	it('renders endContent', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: Token,
				slot: 'endContent',
				text: 'End',
				testid: 'end',
				rest: { label: 'Token' }
			}
		});
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();
		await expect.element(screen.getByText('End', { exact: true })).toBeInTheDocument();
	});

	it('renders icon', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: Token,
				slot: 'icon',
				text: '★',
				testid: 'icon',
				rest: { label: 'Token' }
			}
		});
		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
	});

	it('supports data-testid', async () => {
		const screen = await render(Token, { props: { label: 'Test', 'data-testid': 'my-token' } });
		await expect.element(screen.getByTestId('my-token')).toBeInTheDocument();
	});

	it('renders description as aria-description', async () => {
		const screen = await render(Token, {
			props: {
				label: 'Token',
				description: 'A helpful description',
				'data-testid': 'described-token'
			}
		});
		await expect
			.element(screen.getByTestId('described-token'))
			.toHaveAttribute('aria-description', 'A helpful description');
	});

	it('forwards ref', async () => {
		// Counterpart: `Token` is a closed-prop root (no rest spread, no ref seam),
		// so a consumer's only handle on the root is the rendered element. Asserting
		// it is an `HTMLSpanElement` keeps upstream's `instanceof` form and pins the
		// concrete element type. Default branch → span.
		const screen = await render(Token, { props: { label: 'Ref test' } });
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLSpanElement);
	});

	it('forwards ref to span when onClick provided', async () => {
		// Counterpart (see `forwards ref`): onClick branch root is still a span.
		const screen = await render(Token, { props: { label: 'Ref test', onclick: () => {} } });
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLSpanElement);
	});

	it('forwards ref to anchor when href provided', async () => {
		// Counterpart (see `forwards ref`): href branch root is the anchor.
		const screen = await render(Token, { props: { label: 'Ref test', href: '/test' } });
		expect(screen.container.firstElementChild).toBeInstanceOf(HTMLAnchorElement);
	});
});

describe('Token accessibility', () => {
	it('does not nest buttons when both onClick and onRemove are provided', async () => {
		const screen = await render(Token, {
			props: { label: 'Token', onclick: () => {}, onRemove: () => {} }
		});
		const buttons = screen.container.querySelectorAll('button');
		// Should have exactly 2: invisible label button + remove button
		expect(buttons).toHaveLength(2);
		// No button should contain another button
		for (const button of buttons) {
			expect(button.querySelector('button')).toBeNull();
		}
	});

	it('allows independent focus on label button and remove button', async () => {
		const screen = await render(Token, {
			props: { label: 'Token', onclick: () => {}, onRemove: () => {} }
		});

		// Tab to first button (invisible label button)
		await userEvent.tab();
		// `exact: true`: Playwright's accessible-name matching is substring by
		// default, so a bare 'Token' would also match the 'Remove Token' button.
		// Upstream's testing-library string match is exact, which this restores.
		await expect.element(screen.getByRole('button', { name: 'Token', exact: true })).toHaveFocus();

		// Tab to second button (remove button)
		await userEvent.tab();
		await expect
			.element(screen.getByRole('button', { name: 'Remove Token', exact: true }))
			.toHaveFocus();
	});

	it('fires onClick when Enter is pressed on the invisible button', async () => {
		const handleClick = vi.fn();
		await render(Token, { props: { label: 'Token', onclick: handleClick } });

		await userEvent.tab();
		await userEvent.keyboard('{Enter}');
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('fires onClick when Space is pressed on the invisible button', async () => {
		const handleClick = vi.fn();
		await render(Token, { props: { label: 'Token', onclick: handleClick } });

		await userEvent.tab();
		await userEvent.keyboard(' ');
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('remove button has accessible name including the token label', async () => {
		const screen = await render(Token, { props: { label: 'JavaScript', onRemove: () => {} } });
		await expect
			.element(screen.getByRole('button', { name: 'Remove JavaScript', exact: true }))
			.toBeInTheDocument();
	});

	it('disables both buttons when isDisabled is true', async () => {
		const screen = await render(Token, {
			props: { label: 'Token', onclick: () => {}, onRemove: () => {}, isDisabled: true }
		});
		const buttons = screen.container.querySelectorAll('button');
		for (const button of buttons) {
			expect(button).toBeDisabled();
		}
	});

	it('does not fire onClick or onRemove when disabled', async () => {
		const handleClick = vi.fn();
		const handleRemove = vi.fn();
		const screen = await render(Token, {
			props: {
				label: 'Token',
				onclick: handleClick,
				onRemove: handleRemove,
				isDisabled: true,
				'data-testid': 'token'
			}
		});

		// Click on container (the span's onclick is undefined when disabled)
		const container = screen.getByTestId('token').element();
		container.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(handleClick).not.toHaveBeenCalled();

		// Try to click remove button (it's disabled). `.click()` respects the
		// disabled state and is a no-op — unlike a synthetic `dispatchEvent`, which
		// bypasses that check and would invoke the listener regardless.
		const removeBtn = screen
			.getByRole('button', { name: 'Remove Token', exact: true })
			.element() as HTMLElement;
		removeBtn.click();
		expect(handleRemove).not.toHaveBeenCalled();
	});

	it('container click handler does not fire when clicking the remove button', async () => {
		const handleClick = vi.fn();
		const handleRemove = vi.fn();
		const screen = await render(Token, {
			props: { label: 'Token', onclick: handleClick, onRemove: handleRemove }
		});

		const removeButton = screen.getByRole('button', { name: 'Remove Token', exact: true });
		await userEvent.click(removeButton);

		expect(handleRemove).toHaveBeenCalledTimes(1);
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('hidden label is accessible to screen readers', async () => {
		const screen = await render(Token, {
			props: { label: 'Hidden Tag', isLabelHidden: true, onclick: () => {} }
		});
		// The invisible button should still be findable by its accessible name
		await expect
			.element(screen.getByRole('button', { name: 'Hidden Tag', exact: true }))
			.toBeInTheDocument();
	});

	it('link token has correct role and is focusable', async () => {
		const screen = await render(Token, { props: { label: 'Link Token', href: '/test' } });

		const link = screen.getByRole('link', { name: 'Link Token', exact: true });
		await expect.element(link).toHaveAttribute('href', '/test');

		await userEvent.tab();
		await expect.element(link).toHaveFocus();
	});

	it('remove button element exists with correct aria-label', async () => {
		const screen = await render(Token, { props: { label: 'Token', onRemove: () => {} } });
		const removeButton = screen.container.querySelector('button[aria-label="Remove Token"]');
		expect(removeButton).toBeInTheDocument();
	});
});

describe('Token link with remove button', () => {
	/** Upstream's `fireEvent.click(el, init)` — an untrusted, bubbling click. */
	function click(el: Element, init: MouseEventInit = {}): void {
		el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
	}

	/** Upstream's `fireEvent.mouseUp(el, {button: 1})`. */
	function mouseUp(el: Element, init: MouseEventInit = {}): void {
		el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, ...init }));
	}

	/** A link+remove Token carrying an icon slot the cases click as "the surface". */
	function renderWithIcon(rest: Record<string, unknown>) {
		return render(SlotProbe, {
			props: { component: Token, slot: 'icon', text: '★', testid: 'icon', rest }
		});
	}

	it('does not nest the remove button inside the link', async () => {
		const screen = await render(Token, {
			props: { label: 'Tag', href: '/test', onRemove: () => {} }
		});
		const link = screen.getByRole('link', { name: 'Tag', exact: true }).element();
		const removeButton = screen.getByRole('button', { name: 'Remove Tag', exact: true }).element();
		expect(link.contains(removeButton)).toBe(false);
	});

	it('keeps the link keyboard-focusable and fires onRemove from the sibling button', async () => {
		const handleRemove = vi.fn();
		const screen = await render(Token, {
			props: { label: 'Tag', href: '/test', onRemove: handleRemove }
		});

		const link = screen.getByRole('link', { name: 'Tag', exact: true });
		expect(link.element().tagName).toBe('A');
		await expect.element(link).toHaveAttribute('href', '/test');

		// Tab reaches the link first, then the remove button.
		await userEvent.tab();
		await expect.element(link).toHaveFocus();
		await userEvent.tab();
		const removeButton = screen.getByRole('button', { name: 'Remove Tag', exact: true });
		await expect.element(removeButton).toHaveFocus();

		// Activating the remove button fires onRemove without involving the link.
		await userEvent.keyboard('{Enter}');
		expect(handleRemove).toHaveBeenCalledTimes(1);
	});

	it('wrapper structure matches the onClick branch pattern', async () => {
		const linkScreen = await render(Token, {
			props: { label: 'Tag', href: '/test', onRemove: () => {}, 'data-testid': 'link-token' }
		});
		const clickScreen = await render(Token, {
			props: { label: 'Tag', onclick: () => {}, onRemove: () => {}, 'data-testid': 'click-token' }
		});

		const linkRoot = linkScreen.getByTestId('link-token').element();
		const clickRoot = clickScreen.getByTestId('click-token').element();

		// Both render a <span> container with the same visual classes.
		expect(linkRoot.tagName).toBe('SPAN');
		expect(linkRoot.className).toBe(clickRoot.className);
	});

	it('clicking the container activates the link', async () => {
		const screen = await renderWithIcon({
			label: 'Tag',
			href: '/test',
			onRemove: () => {},
			'data-testid': 'link-token'
		});
		const link = screen.getByRole('link', { name: 'Tag', exact: true }).element();
		const handleLinkClick = vi.fn((e: Event) => e.preventDefault());
		link.addEventListener('click', handleLinkClick);

		// Clicking outside the anchor (e.g. the icon) still activates the link.
		click(screen.getByTestId('icon').element());
		expect(handleLinkClick).toHaveBeenCalledTimes(1);
	});

	it('clicking the remove button does not activate the link', async () => {
		const handleRemove = vi.fn();
		const screen = await render(Token, {
			props: { label: 'Tag', href: '/test', onRemove: handleRemove }
		});
		const link = screen.getByRole('link', { name: 'Tag', exact: true }).element();
		const handleLinkClick = vi.fn((e: Event) => e.preventDefault());
		link.addEventListener('click', handleLinkClick);

		click(screen.getByRole('button', { name: 'Remove Tag', exact: true }).element());
		expect(handleRemove).toHaveBeenCalledTimes(1);
		expect(handleLinkClick).not.toHaveBeenCalled();
	});

	it('cmd/ctrl+click on the container opens the link in a new tab', async () => {
		const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
		try {
			const screen = await renderWithIcon({ label: 'Tag', href: '/test', onRemove: () => {} });
			// Clicking the surface (not the anchor) with a modifier opens a new tab
			// rather than navigating in place — provided by useClickableContainer.
			click(screen.getByTestId('icon').element(), { metaKey: true });
			expect(openSpy).toHaveBeenCalledWith('/test', '_blank', 'noopener');
		} finally {
			openSpy.mockRestore();
		}
	});

	it('middle-click on the container opens the link in a new tab', async () => {
		const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
		try {
			const screen = await renderWithIcon({ label: 'Tag', href: '/test', onRemove: () => {} });
			mouseUp(screen.getByTestId('icon').element(), { button: 1 });
			expect(openSpy).toHaveBeenCalledWith('/test', '_blank', 'noopener');
		} finally {
			openSpy.mockRestore();
		}
	});

	it('a modified click that opens a new tab does not fire onRemove', async () => {
		const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
		const handleRemove = vi.fn();
		try {
			const screen = await renderWithIcon({ label: 'Tag', href: '/test', onRemove: handleRemove });
			const icon = screen.getByTestId('icon').element();
			click(icon, { metaKey: true });
			mouseUp(icon, { button: 1 });
			expect(handleRemove).not.toHaveBeenCalled();
			expect(openSpy).toHaveBeenCalledTimes(2);
		} finally {
			openSpy.mockRestore();
		}
	});

	it('link without onRemove still renders the anchor as the root', async () => {
		const screen = await render(Token, { props: { label: 'Link', href: '/test' } });
		expect(screen.container.firstElementChild?.tagName).toBe('A');
	});
});

describe('Token text overflow', () => {
	it('label element has overflow hidden and text-overflow ellipsis styles', async () => {
		const screen = await render(Token, { props: { label: 'A very long label text' } });
		const labelSpan = screen.container.querySelector('span > span');
		expect(labelSpan).toBeInTheDocument();
		// The label span should exist and contain the text
		expect(labelSpan?.textContent).toBe('A very long label text');
	});

	it('label element has overflow styles when onClick is provided', async () => {
		const screen = await render(Token, {
			props: { label: 'A very long clickable label', onclick: () => {} }
		});
		// In onClick mode, the label is inside the invisible button
		const button = screen
			.getByRole('button', { name: 'A very long clickable label', exact: true })
			.element();
		const labelSpan = button.querySelector('span');
		expect(labelSpan).toBeInTheDocument();
		expect(labelSpan?.textContent).toBe('A very long clickable label');
	});
});

describe('Token size', () => {
	it('renders with size="lg"', async () => {
		const screen = await render(Token, {
			props: { label: 'Tag', size: 'lg', 'data-testid': 'lg-token' }
		});
		await expect.element(screen.getByTestId('lg-token')).toBeInTheDocument();
		await expect.element(screen.getByText('Tag', { exact: true })).toBeInTheDocument();
	});
});

describe('Token focus outline', () => {
	it('invisible button does not show its own focus outline', async () => {
		const screen = await render(Token, {
			props: { label: 'Focusable', onclick: () => {}, 'data-testid': 'focus-token' }
		});
		const button = screen.getByRole('button', { name: 'Focusable', exact: true });
		await userEvent.tab();
		await expect.element(button).toHaveFocus();
		// The container should handle focus outline via :has(:focus-visible),
		// not the button itself
		const container = screen.getByTestId('focus-token');
		expect(container.element().tagName).toBe('SPAN');
	});
});
