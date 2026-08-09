import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import Avatar from '$lib/components/avatar/avatar.svelte';
import AvatarStatusFixture from './fixtures/avatar-status-fixture.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Astryx's `Avatar/Avatar.test.tsx`, ported case for case — **42 upstream cases
 * (29 in `describe('Avatar')`, of which 8 are in the nested `status in the
 * accessible name` block and 14 in the nested `name tooltip` block, plus 13 in
 * `describe('Avatar — interactivity (Button trichotomy)')`), 42 here, none
 * dropped**. The file has no `displayName` case, no snapshot and no no-JSX
 * construction form, so `ref` is the only React-only surface and it gets a
 * counterpart.
 *
 * What translated, each commented where it appears:
 *
 * - **`status={<AvatarStatusDot …/>}` goes through `avatar-status-fixture.svelte`,
 *   and `status={<span />}` through the shared `slot-probe`.** `status` is a
 *   `Snippet` here and a snippet can only be authored in a template.
 *
 * - **The status label reaches the avatar from below, not above.** Upstream reads
 *   `status.props.label` off the React node (`getStatusLabel`); a `Snippet` is an
 *   opaque render function with no props to inspect, so `AvatarStatusDot`
 *   registers its label upward through a context sink. The observable contract is
 *   unchanged and is what every case here asserts — the composed accessible name,
 *   never the mechanism. Registration happens in the dot's `$effect`, so the
 *   composed name appears one flush after mount; the cases that expect a
 *   composition use retrying assertions, and the cases that expect *no*
 *   composition `await tick()` first so they cannot pass merely by being early.
 *
 * - **`forwards the consumer ref to the root` is a counterpart.** Svelte has no
 *   `ref`; a consumer reaches the root through an attachment travelling in the
 *   rest props, which `Avatar` spreads onto its root `<div>`. It checks more than
 *   upstream's does — it receives the element rather than only proving a ref
 *   landed — and it still asks upstream's question, since the root also carries
 *   the tooltip's own attachment.
 *
 * - **`onClick` is `onclick`**, Svelte's spelling of the same prop.
 *
 * Upstream's `name tooltip` block shims `HTMLElement.prototype.showPopover` /
 * `hidePopover` because jsdom implements neither, and queries with
 * `{hidden: true}` because a jsdom popover is not visible to the accessibility
 * tree. The browser project needs no shim — Chromium has the real Popover API —
 * and `{hidden: true}` survives as `getByRole('tooltip', {includeHidden: true})`,
 * since a *closed* popover really is `display:none` here. Same arrangement as
 * `date-time-input.svelte.test.ts`.
 */

/**
 * Chromium really fetches `src`, which jsdom never does: `https://example.com/…`
 * fires a *trusted* `error` and would retire the image behind the test's back,
 * mid-assertion. Swallowing it in the window's capture phase — before it reaches
 * the element's own listener — restores the "no network" premise upstream's
 * suite is written against.
 *
 * Two conditions keep the guard from covering anything else. `isTrusted`
 * separates the browser's own error from the ones the two retry cases dispatch
 * (`dispatchEvent` produces `isTrusted === false`, and that is the only way to
 * tell them apart). The `HTMLImageElement` check keeps uncaught *script* errors
 * — which arrive on this same listener with `target === window` — visible to
 * vitest's unhandled-error reporting.
 */
function blockRealImageErrors(): () => void {
	const swallow = (event: Event) => {
		if (event.isTrusted && event.target instanceof HTMLImageElement) {
			event.stopImmediatePropagation();
		}
	};
	window.addEventListener('error', swallow, true);
	return () => window.removeEventListener('error', swallow, true);
}

let releaseErrorBlock: (() => void) | undefined;

beforeEach(() => {
	releaseErrorBlock = blockRealImageErrors();
});

afterEach(() => {
	releaseErrorBlock?.();
	releaseErrorBlock = undefined;
});

describe('Avatar', () => {
	it('exposes role="img" with the name as accessible name', async () => {
		const screen = await render(Avatar, { props: { name: 'Ada Lovelace', 'data-testid': 'a' } });
		await expect.element(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument();
	});

	it('uses alt over name for the accessible name', async () => {
		const screen = await render(Avatar, {
			props: { name: 'Ada', alt: 'Ada Lovelace, profile photo' }
		});
		await expect
			.element(screen.getByRole('img', { name: 'Ada Lovelace, profile photo' }))
			.toBeInTheDocument();
	});

	it('is decorative (presentation + aria-hidden) when it has no name or alt (obs-9)', async () => {
		const screen = await render(Avatar, { props: { 'data-testid': 'a' } });
		const el = screen.getByTestId('a').element();
		// No meaningful name → not announced as a generic "Avatar".
		expect(el).toHaveAttribute('aria-hidden', 'true');
		expect(el).not.toHaveAttribute('aria-label');
		expect(screen.getByRole('img').query()).toBeNull();
	});

	it('does not double-announce: the inner img is decorative when the wrapper is named', async () => {
		const screen = await render(Avatar, {
			props: { name: 'Ada', src: 'https://example.com/ada.jpg' }
		});
		const wrapper = screen.getByRole('img', { name: 'Ada' }).element();
		const innerImg = wrapper.querySelector('img');
		expect(innerImg).not.toBeNull();
		// The inner <img> carries an empty alt so it isn't announced separately.
		expect(innerImg).toHaveAttribute('alt', '');
	});

	it('renders fallback initials through the themeable font-size var, not a bare px literal', async () => {
		const screen = await render(Avatar, {
			props: { name: 'Ada Lovelace', size: 'sm', 'data-testid': 'a' }
		});
		const initials = screen.getByText('AL').element();
		// The seam: the dynamic font size resolves to the Avatar-scoped var (with
		// the proportional `size × 0.4` default baked in as the fallback), so a
		// theme can re-scope it per size. A regression to a bare px literal would
		// break theming.
		const style = initials.getAttribute('style') ?? '';
		expect(style).toContain('var(--_avatar-fallback-font-size,');
		// Default still reproduces the proportional scale (sm = 24 × 0.4 = 9.6px).
		expect(style).toMatch(/var\(--_avatar-fallback-font-size,\s*9\.6\d*px\)/);
	});

	it('retries a new src after a previous src failed to load', async () => {
		const screen = await render(Avatar, {
			props: { name: 'Ada', src: 'https://example.com/broken.jpg' }
		});
		const wrapper = screen.getByRole('img', { name: 'Ada' }).element();
		// Upstream's `fireEvent.error`. `act()` has no counterpart — the `$state`
		// write flushes on its own, which `tick()` waits for.
		wrapper.querySelector('img')!.dispatchEvent(new Event('error'));
		await tick();
		// Broken image falls back to initials.
		expect(wrapper.querySelector('img')).toBeNull();
		expect(wrapper).toHaveTextContent('A');

		// A different src must get a fresh load attempt, not the stale error.
		await screen.rerender({ name: 'Ada', src: 'https://example.com/ada.jpg' });
		const img = wrapper.querySelector('img');
		expect(img).not.toBeNull();
		expect(img).toHaveAttribute('src', 'https://example.com/ada.jpg');
	});

	describe('status in the accessible name (WCAG 4.1.2)', () => {
		// The avatar root is role="img", which prunes descendant semantics —
		// a label inside the status subtree is never announced on its own.
		// Avatar composes the status element's `label` into its own name.
		it('composes the status label into the accessible name for image avatars', async () => {
			const screen = await render(AvatarStatusFixture, {
				props: {
					avatar: { name: 'Ada Lovelace', src: 'https://example.com/ada.jpg' },
					dot: { variant: 'success', label: 'Online' }
				}
			});
			await expect
				.element(screen.getByRole('img', { name: 'Ada Lovelace, Online' }))
				.toBeInTheDocument();
		});

		it('composes the status label into the accessible name for initials avatars', async () => {
			const screen = await render(AvatarStatusFixture, {
				props: {
					avatar: { name: 'Ada Lovelace' },
					dot: { variant: 'error', label: 'Busy' }
				}
			});
			const avatar = screen.getByRole('img', { name: 'Ada Lovelace, Busy' });
			await expect.element(avatar).toBeInTheDocument();
			await expect.element(avatar).toHaveTextContent('AL');
		});

		it('composes the status label with alt when alt overrides name', async () => {
			const screen = await render(AvatarStatusFixture, {
				props: {
					avatar: { name: 'Ada', alt: 'Ada Lovelace, profile photo' },
					dot: { label: 'Online' }
				}
			});
			await expect
				.element(screen.getByRole('img', { name: 'Ada Lovelace, profile photo, Online' }))
				.toBeInTheDocument();
		});

		it('keeps the plain name when there is no status', async () => {
			const screen = await render(Avatar, { props: { name: 'Ada Lovelace', 'data-testid': 'a' } });
			await tick();
			expect(screen.getByTestId('a').element()).toHaveAttribute('aria-label', 'Ada Lovelace');
		});

		it('keeps the plain name when the status dot has no label', async () => {
			const screen = await render(AvatarStatusFixture, {
				props: {
					avatar: { name: 'Ada Lovelace', 'data-testid': 'a' },
					dot: { variant: 'success' }
				}
			});
			// `tick()` so the dot's registration effect has run: the case must fail
			// if an unlabelled dot ever registers something, not merely observe the
			// avatar before it could.
			await tick();
			expect(screen.getByTestId('a').element()).toHaveAttribute('aria-label', 'Ada Lovelace');
		});

		it('keeps the plain name for custom status nodes without a label prop', async () => {
			// Upstream's `status={<span />}`. A status subtree with no
			// `AvatarStatusDot` in it registers nothing, so the name stays plain.
			const screen = await render(SlotProbe, {
				props: {
					component: Avatar,
					slot: 'status',
					text: '',
					rest: { name: 'Ada Lovelace', 'data-testid': 'a' }
				}
			});
			await tick();
			expect(screen.getByTestId('a').element()).toHaveAttribute('aria-label', 'Ada Lovelace');
		});

		it('announces a labelled status even on an otherwise decorative avatar', async () => {
			// A labelled status is meaningful information on its own — the avatar
			// must not stay aria-hidden and swallow it.
			const screen = await render(AvatarStatusFixture, {
				props: { avatar: { 'data-testid': 'a' }, dot: { label: 'Online' } }
			});
			const el = screen.getByTestId('a');
			await expect.element(el).toHaveAttribute('role', 'img');
			await expect.element(el).toHaveAttribute('aria-label', 'Online');
			expect(el.element()).not.toHaveAttribute('aria-hidden');
		});

		it('stays decorative with an unlabelled status and no name', async () => {
			const screen = await render(AvatarStatusFixture, {
				props: { avatar: { 'data-testid': 'a' }, dot: {} }
			});
			await tick();
			const el = screen.getByTestId('a').element();
			expect(el).toHaveAttribute('aria-hidden', 'true');
			expect(el).not.toHaveAttribute('aria-label');
		});
	});

	it('retries a new fallbackSrc after a previous fallbackSrc failed to load', async () => {
		const screen = await render(Avatar, {
			props: { name: 'Ada', fallbackSrc: 'https://example.com/broken.jpg' }
		});
		const wrapper = screen.getByRole('img', { name: 'Ada' }).element();
		wrapper.querySelector('img')!.dispatchEvent(new Event('error'));
		await tick();
		expect(wrapper.querySelector('img')).toBeNull();

		await screen.rerender({ name: 'Ada', fallbackSrc: 'https://example.com/ada.jpg' });
		const img = wrapper.querySelector('img');
		expect(img).not.toBeNull();
		expect(img).toHaveAttribute('src', 'https://example.com/ada.jpg');
	});

	// --- Name tooltip (tooltip?: string | boolean) ---
	describe('name tooltip', () => {
		// Upstream's `beforeEach`/`afterEach` here stub
		// `HTMLElement.prototype.showPopover`/`hidePopover`, which jsdom does not
		// implement. Chromium does, so there is nothing to stand in for.

		it('shows the name in a tooltip by default', async () => {
			const screen = await render(Avatar, { props: { name: 'Ada Lovelace' } });
			const tooltip = screen.getByRole('tooltip', { includeHidden: true });
			await expect.element(tooltip).toHaveTextContent('Ada Lovelace');
		});

		it('shows a custom string tooltip instead of the name', async () => {
			const screen = await render(Avatar, {
				props: { name: 'alovelace', tooltip: 'Ada Lovelace, Mathematician' }
			});
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(tooltip).toHaveTextContent('Ada Lovelace, Mathematician');
			expect(tooltip).not.toHaveTextContent('alovelace');
		});

		it('renders no tooltip when tooltip={false}', async () => {
			const screen = await render(Avatar, { props: { name: 'Ada Lovelace', tooltip: false } });
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('renders no tooltip for a decorative avatar (no name/alt)', async () => {
			const screen = await render(Avatar, { props: { src: 'https://example.com/x.jpg' } });
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
		});

		it('renders no tooltip when tooltip is true/default but name is empty', async () => {
			const screen = await render(Avatar, {
				props: { name: '   ', alt: 'Profile photo', 'data-testid': 'a' }
			});
			// A whitespace-only name yields nothing to show, and the default tooltip
			// uses `name` (not `alt`), so there is no tooltip.
			expect(screen.getByRole('tooltip', { includeHidden: true }).query()).toBeNull();
			// The accessible name still comes from alt, unaffected.
			await expect.element(screen.getByRole('img', { name: 'Profile photo' })).toBeInTheDocument();
		});

		it('still shows a custom string tooltip when there is no name', async () => {
			const screen = await render(Avatar, {
				props: { tooltip: 'Anonymous user', 'data-testid': 'a' }
			});
			const tooltip = screen.getByRole('tooltip', { includeHidden: true });
			await expect.element(tooltip).toHaveTextContent('Anonymous user');
		});

		it('makes the root focusable while a tooltip is attached', async () => {
			const screen = await render(Avatar, { props: { name: 'Ada Lovelace', 'data-testid': 'a' } });
			expect(screen.getByTestId('a').element()).toHaveAttribute('tabindex', '0');
		});

		it('does not add a tab stop when the tooltip is disabled', async () => {
			const screen = await render(Avatar, {
				props: { name: 'Ada Lovelace', tooltip: false, 'data-testid': 'a' }
			});
			expect(screen.getByTestId('a').element()).not.toHaveAttribute('tabindex');
		});

		it('keeps the accessible name on the root regardless of the tooltip', async () => {
			const screen = await render(Avatar, { props: { name: 'Ada Lovelace' } });
			await expect.element(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument();

			await screen.rerender({ name: 'Ada Lovelace', tooltip: false });
			await expect.element(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument();

			await screen.rerender({ name: 'alovelace', tooltip: 'Ada Lovelace, Eng' });
			// alt||name still drives the accessible name — not the custom tooltip.
			await expect.element(screen.getByRole('img', { name: 'alovelace' })).toBeInTheDocument();

			// `rerender` merges props rather than replacing them, so `tooltip` is
			// reset to its default here to reproduce upstream's fourth prop set.
			await screen.rerender({
				name: 'alovelace',
				alt: "Ada's profile photo",
				tooltip: true
			});
			await expect
				.element(screen.getByRole('img', { name: "Ada's profile photo" }))
				.toBeInTheDocument();
		});

		it('does not describe the root with the default name tooltip (no double-announce)', async () => {
			const screen = await render(Avatar, { props: { name: 'Ada Lovelace', 'data-testid': 'a' } });
			// The default name tooltip is visual-only: its text duplicates the root
			// aria-label, so we deliberately do NOT wire aria-describedby (OQ-4).
			expect(screen.getByTestId('a').element()).not.toHaveAttribute('aria-describedby');
		});

		it('describes the root with a custom string tooltip (matches Button)', async () => {
			const screen = await render(Avatar, {
				props: {
					name: 'alovelace',
					tooltip: 'Ada Lovelace, Mathematician',
					'data-testid': 'a'
				}
			});
			const root = screen.getByTestId('a').element();
			const describedBy = root.getAttribute('aria-describedby');
			expect(describedBy).toBeTruthy();
			// aria-describedby points at the rendered tooltip layer.
			const tooltip = screen.getByRole('tooltip', { includeHidden: true }).element();
			expect(tooltip.id).toBeTruthy();
			expect(describedBy).toContain(tooltip.id);
		});

		it('composes a consumer aria-describedby with the custom tooltip description', async () => {
			// Upstream renders a sibling `<span id="extra-desc">` alongside the
			// avatar; it is scenery for the id reference, so it is created directly
			// rather than through another fixture.
			const extra = document.createElement('span');
			extra.id = 'extra-desc';
			extra.textContent = 'extra description';
			document.body.append(extra);
			try {
				const screen = await render(Avatar, {
					props: {
						name: 'alovelace',
						tooltip: 'Ada Lovelace, Eng',
						'aria-describedby': 'extra-desc',
						'data-testid': 'a'
					}
				});
				const describedBy = screen.getByTestId('a').element().getAttribute('aria-describedby');
				expect(describedBy).toContain('extra-desc');
			} finally {
				extra.remove();
			}
		});

		it('preserves a consumer aria-describedby with the default name tooltip', async () => {
			const extra = document.createElement('span');
			extra.id = 'extra-desc';
			extra.textContent = 'extra description';
			document.body.append(extra);
			try {
				const screen = await render(Avatar, {
					props: {
						name: 'Ada Lovelace',
						'aria-describedby': 'extra-desc',
						'data-testid': 'a'
					}
				});
				// Default name tooltip does not touch aria-describedby, so the consumer
				// value passes through untouched.
				expect(screen.getByTestId('a').element()).toHaveAttribute('aria-describedby', 'extra-desc');
			} finally {
				extra.remove();
			}
		});

		// COUNTERPART for upstream's `forwards the consumer ref to the root while a
		// tooltip is attached`. Svelte has no `ref`; the consumer's handle on the
		// root is an attachment travelling in the rest props, which `Avatar` spreads
		// onto the root `<div>` alongside the tooltip's own attachment — the
		// coexistence the upstream case is really about. It receives the element,
		// so it asserts identity exactly as `ref.current` does.
		it('forwards the consumer ref to the root while a tooltip is attached', async () => {
			const attached = vi.fn();
			const screen = await render(Avatar, {
				props: {
					name: 'Ada Lovelace',
					'data-testid': 'a',
					[createAttachmentKey()]: (node: Element) => attached(node)
				}
			});
			expect(attached).toHaveBeenCalledWith(screen.getByTestId('a').element());
			expect(screen.getByTestId('a').element()).toBeInstanceOf(HTMLDivElement);
		});
	});
});

describe('Avatar — interactivity (Button trichotomy)', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders a link when `href` is set (default LinkComponent is <a>)', async () => {
		const screen = await render(Avatar, { props: { name: 'Ada Lovelace', href: '/users/ada' } });
		const link = screen.getByRole('link', { name: 'Ada Lovelace' }).element();
		expect(link.tagName).toBe('A');
		expect(link).toHaveAttribute('href', '/users/ada');
		// The static img semantics are gone — it's a control now.
		expect(screen.getByRole('img').query()).toBeNull();
	});

	it('forwards target/rel on the link', async () => {
		const screen = await render(Avatar, {
			props: {
				name: 'Ada',
				href: 'https://example.com',
				target: '_blank',
				rel: 'noopener noreferrer'
			}
		});
		const link = screen.getByRole('link', { name: 'Ada' }).element();
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('renders a <button type="button"> when `onClick` is set (no href)', async () => {
		const handleClick = vi.fn();
		const screen = await render(Avatar, { props: { name: 'Ada', onclick: handleClick } });
		const button = screen.getByRole('button', { name: 'Ada' });
		expect(button.element().tagName).toBe('BUTTON');
		expect(button.element()).toHaveAttribute('type', 'button');
		await userEvent.click(button);
		expect(handleClick).toHaveBeenCalledOnce();
	});

	it('href wins over onClick (link, not button)', async () => {
		const screen = await render(Avatar, {
			props: { name: 'Ada', href: '/ada', onclick: () => {} }
		});
		await expect.element(screen.getByRole('link', { name: 'Ada' })).toBeInTheDocument();
		expect(screen.getByRole('button').query()).toBeNull();
	});

	it('stays a static element (no href, no onClick) — non-breaking default', async () => {
		const screen = await render(Avatar, { props: { name: 'Ada' } });
		await expect.element(screen.getByRole('img', { name: 'Ada' })).toBeInTheDocument();
		expect(screen.getByRole('link').query()).toBeNull();
		expect(screen.getByRole('button').query()).toBeNull();
	});

	it('stamps the data-avatar-item marker on the interactive link', async () => {
		const screen = await render(Avatar, { props: { name: 'Ada', href: '/ada' } });
		expect(screen.getByRole('link', { name: 'Ada' }).element()).toHaveAttribute('data-avatar-item');
	});

	it('stamps the data-avatar-item marker on the interactive button', async () => {
		const screen = await render(Avatar, { props: { name: 'Ada', onclick: () => {} } });
		expect(screen.getByRole('button', { name: 'Ada' }).element()).toHaveAttribute(
			'data-avatar-item'
		);
	});

	it('does not stamp data-avatar-item on a static avatar', async () => {
		const screen = await render(Avatar, { props: { name: 'Ada', 'data-testid': 'a' } });
		expect(screen.getByTestId('a').element()).not.toHaveAttribute('data-avatar-item');
	});

	it('carries a focus-visible ring class on the interactive element', async () => {
		// The interactive element applies the shared focus-visible accent ring via
		// its StyleX class. We assert the element is focusable and receives focus.
		const screen = await render(Avatar, { props: { name: 'Ada', onclick: () => {} } });
		const button = screen.getByRole('button', { name: 'Ada' }).element() as HTMLElement;
		button.focus();
		expect(button).toHaveFocus();
		// className carries the avatar theming target so themes can style it.
		expect(button.className).toContain('astryx-avatar');
	});

	it('warns in dev when interactive without an accessible name (href)', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await render(Avatar, { props: { href: '/somewhere' } });
		await tick();
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('interactive avatar'));
	});

	it('warns in dev when interactive without an accessible name (onClick)', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await render(Avatar, { props: { onclick: () => {} } });
		await tick();
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('interactive avatar'));
	});

	it('does not warn when interactive with a name', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await render(Avatar, { props: { name: 'Ada', href: '/ada' } });
		await tick();
		expect(warn).not.toHaveBeenCalled();
	});

	it('does not warn for a static avatar without a name (decorative is fine)', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await render(Avatar, { props: { 'data-testid': 'a' } });
		await tick();
		expect(warn).not.toHaveBeenCalled();
	});
});
