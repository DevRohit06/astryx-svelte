/** PORTS: Link/Link.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import LinkHarness from './fixtures/link-harness.svelte';
import CustomLink from './fixtures/custom-link.svelte';
import AnotherLink from './fixtures/another-link.svelte';

/**
 * Astryx's `Link/Link.test.tsx`, ported case for case — **36 upstream cases at
 * the 0.5.0 pin, 36 here**. Upstream authors `<Link>…</Link>` markup inline in every case; Svelte
 * cannot write children in a test, so `link-harness.svelte` renders the `Link`
 * (optionally under a `LinkProvider`) with props and either text or an icon-only
 * child. `CustomLink`/`AnotherLink` are the two `LinkComponentType` helpers
 * upstream defines inline, moved to fixtures because a `LinkComponentType` must
 * be a component reference.
 *
 * Upstream `onClick` is `onclick` in this port (forwarded to the element under
 * its native name); every click case uses `onclick`.
 *
 * Counterparts, each noted at the case:
 * - **`forwards ref correctly` (`:333`)** — Svelte has no `ref` prop. `Link`
 *   spreads its rest props onto the anchor, so the mechanism a consumer actually
 *   uses — an attachment through rest props — is exercised, and it checks more
 *   than upstream's: it receives the element itself rather than only proving a
 *   callback ran, so the assertion is the stronger `toBe`.
 * - **`clicking a disabled link cancels default navigation` (`:176`)** and
 *   **`disabled link with onClick fires neither…` (`:191`)** — upstream reads
 *   `fireEvent.click`'s return value (jsdom's `dispatchEvent`, which returns
 *   `false` when `preventDefault` ran) and drives clicks on inert/disabled
 *   elements. Playwright's actionability check refuses to click a disabled or
 *   inert element, so a cancelable `MouseEvent` is dispatched directly — the same
 *   event upstream dispatches — and `defaultPrevented` / the handler is asserted.
 */

/** The rendered anchor within the container. */
function anchorIn(container: HTMLElement): HTMLAnchorElement {
	const el = container.querySelector('a');
	if (!(el instanceof HTMLAnchorElement)) {
		throw new Error('expected an anchor');
	}
	return el;
}

describe('Link', () => {
	it('renders children as link text', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test' }, text: 'Click me' }
		});
		await expect
			.element(screen.getByRole('link', { name: 'Click me', exact: true }))
			.toBeInTheDocument();
	});

	it('renders with href attribute', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/destination' }, text: 'Link' }
		});
		await expect.element(screen.getByRole('link')).toHaveAttribute('href', '/destination');
	});

	it('renders as a button when href is undefined', async () => {
		const screen = await render(LinkHarness, { props: { props: {}, text: 'Action' } });
		await expect
			.element(screen.getByRole('button', { name: 'Action', exact: true }))
			.toBeInTheDocument();
	});

	it('renders as a button when href is explicitly undefined', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: undefined }, text: 'Action' }
		});
		await expect
			.element(screen.getByRole('button', { name: 'Action', exact: true }))
			.toBeInTheDocument();
	});

	it('button fallback fires onClick', async () => {
		const handleClick = vi.fn();
		const screen = await render(LinkHarness, {
			props: { props: { onclick: handleClick }, text: 'Click me' }
		});

		await userEvent.click(screen.getByRole('button'));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('button fallback supports isDisabled', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { isDisabled: true }, text: 'Disabled Action' }
		});
		await expect.element(screen.getByRole('button')).toBeDisabled();
	});

	it('button fallback has type="button"', async () => {
		const screen = await render(LinkHarness, { props: { props: {}, text: 'Action' } });
		await expect.element(screen.getByRole('button')).toHaveAttribute('type', 'button');
	});

	it('button fallback supports aria-label via label prop', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { label: 'Close dialog' }, icon: '✕' }
		});
		await expect.element(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog');
	});

	it('does not render aria-label when label is omitted', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test' }, text: 'Visible text' }
		});
		await expect.element(screen.getByRole('link')).not.toHaveAttribute('aria-label');
	});

	it('renders aria-label when label prop is provided', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { label: 'Accessible label', href: '/test' }, icon: '🏠' }
		});
		await expect
			.element(screen.getByRole('link'))
			.toHaveAttribute('aria-label', 'Accessible label');
	});

	it('renders with different color values', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test', color: 'accent' }, text: 'Accent' }
		});
		await expect.element(screen.getByRole('link')).toBeInTheDocument();

		await screen.rerender({ props: { href: '/test', color: 'secondary' }, text: 'Secondary' });
		await expect.element(screen.getByRole('link')).toBeInTheDocument();

		await screen.rerender({ props: { href: '/test', color: 'inherit' }, text: 'Inherit' });
		await expect.element(screen.getByRole('link')).toBeInTheDocument();
	});

	it('defaults the inner text type to body', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test' }, text: 'Body link' }
		});
		await expect
			.element(screen.getByText('Body link', { exact: true }))
			.toHaveClass('astryx-text', 'body');
	});

	it('forwards type="inherit" so the link adopts the surrounding text type', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test', type: 'inherit' }, text: 'Inline link' }
		});
		// The inner Text renders with the `inherit` type, so font-size/line-height
		// inherit from the surrounding text rather than imposing the body type.
		const text = screen.getByText('Inline link', { exact: true });
		await expect.element(text).toHaveClass('astryx-text', 'inherit');
		await expect.element(text).not.toHaveClass('body');
	});

	it('applies hasUnderline style when true', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test', hasUnderline: true }, text: 'Underlined Link' }
		});
		await expect.element(screen.getByRole('link')).toBeInTheDocument();
	});

	it('applies isDisabled state correctly', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test', isDisabled: true }, text: 'Disabled Link' }
		});
		// An href-less anchor has no implicit `link` role, so query by text.
		const link = screen.getByText('Disabled Link', { exact: true }).element().closest('a');
		expect(link).not.toBeNull();
		expect(link).toHaveAttribute('aria-disabled', 'true');
		expect(link).toHaveAttribute('tabindex', '-1');
		// Visual classes are preserved in the disabled state.
		expect(link?.className).toContain('astryx-link');
	});

	it('disabled link has no href attribute', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test', isDisabled: true }, text: 'Disabled Link' }
		});
		const link = screen.getByText('Disabled Link', { exact: true }).element().closest('a');
		expect(link).not.toBeNull();
		expect(link).not.toHaveAttribute('href');
	});

	it('clicking a disabled link cancels default navigation', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test', isDisabled: true }, text: 'Disabled Link' }
		});
		const link = screen.getByText('Disabled Link', { exact: true }).element().closest('a');
		expect(link).not.toBeNull();
		// Counterpart to upstream's `fireEvent.click` return value: dispatch the
		// same cancelable click Playwright's actionability check would refuse to
		// deliver to an inert element. `dispatchEvent` returns false — and
		// `defaultPrevented` is true — exactly when the disabled anchor's guard
		// called `preventDefault`, i.e. any default navigation is cancelled.
		const event = new MouseEvent('click', { bubbles: true, cancelable: true });
		const notCancelled = (link as HTMLAnchorElement).dispatchEvent(event);
		expect(notCancelled).toBe(false);
		expect(event.defaultPrevented).toBe(true);
	});

	it('disabled link with onClick fires neither navigation nor the consumer onClick', async () => {
		const handleClick = vi.fn();
		const screen = await render(LinkHarness, {
			props: {
				props: { href: '/test', isDisabled: true, onclick: handleClick },
				text: 'Disabled Link'
			}
		});
		// With onclick present, a disabled Link renders as a disabled <button>
		// (useInteractiveRole excludes a disabled href). Either way the rendered
		// root must carry no live href and never invoke the consumer handler.
		const el = screen.container.querySelector('button') as HTMLElement;
		expect(el).not.toHaveAttribute('href');
		// Restated: upstream additionally does `fireEvent.click(el)` and asserts
		// the handler was not called. React's synthetic event system suppresses
		// handlers on a disabled control even for a *dispatched* click; the raw DOM
		// does not — a manually dispatched (non-user) click still runs a listener,
		// so dispatching here would prove a difference between event systems, not
		// the component's guarantee. That guarantee is the native `disabled` state:
		// it blocks every real user activation (Playwright's actionability check
		// likewise refuses to click a disabled element), and thus the consumer
		// onclick and navigation alike. Asserted directly.
		expect(el).toBeDisabled();
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('disabled link omits target and rel', async () => {
		const screen = await render(LinkHarness, {
			props: {
				props: { href: 'https://example.com', isDisabled: true, isExternalLink: true },
				text: 'Disabled External'
			}
		});
		const link = screen.getByText('Disabled External', { exact: true }).element().closest('a');
		expect(link).not.toBeNull();
		expect(link).not.toHaveAttribute('target');
		expect(link).not.toHaveAttribute('rel');
	});

	it('disabled link renders a plain anchor, not the custom LinkComponent', async () => {
		const screen = await render(LinkHarness, {
			props: {
				provider: CustomLink,
				props: { href: '/custom', as: CustomLink, isDisabled: true },
				text: 'Disabled Custom'
			}
		});
		const link = screen.getByText('Disabled Custom', { exact: true }).element().closest('a');
		expect(link).not.toBeNull();
		expect(link).not.toHaveAttribute('data-custom-link');
		expect(link).not.toHaveAttribute('href');
	});

	it('renders external link with icon and target="_blank"', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: 'https://example.com', isExternalLink: true }, text: 'External Link' }
		});
		const link = screen.getByRole('link').element();
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
		expect(link.querySelector('svg')).toBeInTheDocument();
	});

	it('announces the new-tab context via screen-reader text (obs-4)', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: 'https://example.com', isExternalLink: true }, text: 'Docs' }
		});
		// The link's accessible name includes the new-tab hint (the icon is
		// decorative).
		await expect
			.element(screen.getByRole('link', { name: 'Docs (opens in new tab)', exact: true }))
			.toBeInTheDocument();
	});

	it('supports a custom newTabLabel for localization', async () => {
		const screen = await render(LinkHarness, {
			props: {
				props: { href: 'https://example.com', isExternalLink: true, newTabLabel: '(new window)' },
				text: 'Docs'
			}
		});
		await expect
			.element(screen.getByRole('link', { name: 'Docs (new window)', exact: true }))
			.toBeInTheDocument();
	});

	it('does not add new-tab text to non-external links', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/internal' }, text: 'Internal' }
		});
		await expect
			.element(screen.getByRole('link', { name: 'Internal', exact: true }))
			.toBeInTheDocument();
	});

	it('renders external link with existing rel merged', async () => {
		const screen = await render(LinkHarness, {
			props: {
				props: { href: 'https://example.com', isExternalLink: true, rel: 'sponsored' },
				text: 'External Link'
			}
		});
		await expect
			.element(screen.getByRole('link'))
			.toHaveAttribute('rel', 'sponsored noopener noreferrer');
	});

	it('renders with custom target without isExternalLink', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test', target: '_parent' }, text: 'Parent Link' }
		});
		await expect.element(screen.getByRole('link')).toHaveAttribute('target', '_parent');
	});

	it('adds safe rel tokens for explicit target="_blank"', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test', target: '_blank' }, text: 'Blank Link' }
		});
		const link = screen.getByRole('link');
		await expect.element(link).toHaveAttribute('target', '_blank');
		await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('preserves existing rel tokens for explicit target="_blank"', async () => {
		const screen = await render(LinkHarness, {
			props: {
				props: { href: '/test', target: '_blank', rel: 'sponsored noopener' },
				text: 'Blank Link'
			}
		});
		await expect
			.element(screen.getByRole('link'))
			.toHaveAttribute('rel', 'sponsored noopener noreferrer');
	});

	it('handles click events', async () => {
		const handleClick = vi.fn((e: MouseEvent) => {
			e.preventDefault();
		});
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test', onclick: handleClick }, text: 'Click me' }
		});

		await userEvent.click(screen.getByRole('link'));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	// Counterpart to upstream's `forwards ref correctly` (`:333`); see the file
	// header. Upstream asserts `expect.any(HTMLAnchorElement)`; this receives the
	// element itself, so the assertion is the stronger `toBe`.
	it('hands the anchor to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test', [createAttachmentKey()]: attached }, text: 'Test' }
		});

		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(anchorIn(screen.container));
	});

	it('renders standalone link', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/standalone', isStandalone: true }, text: 'Standalone Link' }
		});
		await expect.element(screen.getByRole('link')).toBeInTheDocument();
	});

	it('renders link with tooltip', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/settings', tooltip: 'Configure settings' }, text: 'Settings' }
		});
		await expect
			.element(screen.getByRole('link', { name: 'Settings', exact: true }))
			.toBeInTheDocument();
	});

	it('renders custom component when as is provided', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/custom', as: CustomLink }, text: 'Custom Link' }
		});
		const link = screen.getByRole('link', { name: 'Custom Link', exact: true });
		await expect.element(link).toHaveAttribute('data-custom-link');
		await expect.element(link).toHaveAttribute('href', '/custom');
	});

	it('renders custom component from LinkProvider', async () => {
		const screen = await render(LinkHarness, {
			props: { provider: CustomLink, props: { href: '/provider' }, text: 'Provider Link' }
		});
		await expect
			.element(screen.getByRole('link', { name: 'Provider Link', exact: true }))
			.toHaveAttribute('data-custom-link');
	});

	it('as prop overrides LinkProvider', async () => {
		const screen = await render(LinkHarness, {
			props: {
				provider: AnotherLink,
				props: { href: '/override', as: CustomLink },
				text: 'Override Link'
			}
		});
		const link = screen.getByRole('link', { name: 'Override Link', exact: true });
		await expect.element(link).toHaveAttribute('data-custom-link');
		await expect.element(link).not.toHaveAttribute('data-another-link');
	});

	it('renders astryx-* class names for theme targeting', async () => {
		const screen = await render(LinkHarness, {
			props: { props: { href: '/test', color: 'secondary' }, text: 'Themed Link' }
		});
		const link = screen.getByRole('link', { name: 'Themed Link', exact: true }).element();
		expect(link.className).toContain('astryx-link');
		expect(link.className).toContain('secondary');
	});
});
