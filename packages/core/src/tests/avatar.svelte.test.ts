import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import Avatar from '$lib/components/avatar/avatar.svelte';
import AvatarStatusFixture from './fixtures/avatar-status-fixture.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Astryx's `Avatar/Avatar.test.tsx`, ported case for case at the **0.5.0** pin.
 *
 * The count is the contract: upstream declares **70** cases at this pin — 50 in
 * `describe('Avatar')` (13 direct, 8 in `status in the accessible name (WCAG
 * 4.1.2)`, 10 in `status label through a consumer wrapper (P14)`, 4 in `a
 * whitespace-only name carries no identity`, 15 in `name tooltip`), 16 in
 * `describe('Avatar — interactivity (Button trichotomy)')` and 4 in
 * `describe('Avatar — consumer ARIA overrides win (Icon labelling pattern)')` —
 * and **48** are here. The file has no `displayName` case, no snapshot and no
 * no-JSX construction form, so `ref` is the only React-only surface and it gets
 * a counterpart.
 *
 * **Two cases sit under a different parent here than upstream, and neither is a
 * dropped case.** Upstream declares `puts the avatar box on the element that
 * carries the theme target` and `keeps the box on the root for an interactive
 * avatar too` directly under `describe('Avatar')`; they are in the
 * interactivity block here, because the second needs the interactive root the
 * block already sets up. Upstream's `a whitespace-only name carries no
 * identity` block is likewise nested under `Avatar` upstream and under
 * interactivity here. All six cases are present with upstream's titles and
 * assertions.
 *
 * ## The 22 that are not here
 *
 * Named so none of them can be mistaken for accounted-for work:
 *
 * - **The whole 10-case `status label through a consumer wrapper (P14)`
 *   block** — a label reported from inside a wrapper component, reported at any
 *   nesting depth, changing after mount, dropped when the status element
 *   unmounts, announced on an otherwise decorative avatar, a reported label
 *   winning over introspection, costing no extra render and not looping, a
 *   directly-passed dot named on the first render before any report, a label
 *   changing without re-rendering the avatar, and a consumer `aria-label` left
 *   alone when a wrapped status reports. This is the block that exercises the
 *   *upward* half of the context sink described below, which is precisely the
 *   mechanism this port had to invent — so it is the costliest of the four gaps.
 * - **The whole 4-case `Avatar — consumer ARIA overrides win (Icon labelling
 *   pattern)` block** — a consumer `aria-label` overriding the derived name on
 *   the static root and on an interactive root, a consumer `role` overriding
 *   the derived role, and a consumer hiding a named avatar with `aria-hidden`.
 * - **4 of the 13 `describe('Avatar')` direct cases** — `marks the fallback
 *   surface with the stable theming class (initials and icon)`, and the three
 *   grapheme cases (`does not split an emoji surrogate pair`, `preserves a
 *   complete character`, `keeps a ZWJ family emoji intact`) that guard initials
 *   generation against splitting a code point.
 * - **3 of the 16 interactivity cases** — `warns when the only accessible name
 *   is a status label`, `warns when interactive with an empty-string name and
 *   alt`, and `does not warn when the consumer names the control with
 *   aria-label`.
 * - **1 of the 15 `name tooltip` cases** — `keeps its merged ref attached
 *   across unrelated rerenders`.
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
		await expect
			.element(screen.getByRole('img', { name: 'Ada Lovelace', exact: true }))
			.toBeInTheDocument();
	});

	it('uses alt over name for the accessible name', async () => {
		const screen = await render(Avatar, {
			props: { name: 'Ada', alt: 'Ada Lovelace, profile photo' }
		});
		await expect
			.element(screen.getByRole('img', { name: 'Ada Lovelace, profile photo', exact: true }))
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
		const wrapper = screen.getByRole('img', { name: 'Ada', exact: true }).element();
		const innerImg = wrapper.querySelector('img');
		expect(innerImg).not.toBeNull();
		// The inner <img> carries an empty alt so it isn't announced separately.
		expect(innerImg).toHaveAttribute('alt', '');
	});

	it('renders fallback initials at the proportional size via a StyleX class, not an inline property', async () => {
		const screen = await render(Avatar, {
			props: { name: 'Ada Lovelace', size: 'sm', 'data-testid': 'a' }
		});
		const initials = screen.getByText('AL').element();
		// The default proportional size (sm = 24 × 0.4 = 9.6px) is fed to StyleX as
		// a dynamic value: StyleX applies `font-size` through a class and sets only
		// the computed value inline (as a custom property). Because the property
		// lands via a class, a theme's `.astryx-avatar-fallback.<size>` rule in the
		// theme layer overrides it per size tier — no internal var seam needed.
		const style = initials.getAttribute('style') ?? '';
		expect(style).toMatch(/9\.6\d*px/);
		// Regression guard: the seam must NOT reintroduce the removed internal var.
		expect(style).not.toContain('--_avatar-fallback-font-size');
	});

	it('retries a new src after a previous src failed to load', async () => {
		const screen = await render(Avatar, {
			props: { name: 'Ada', src: 'https://example.com/broken.jpg' }
		});
		const wrapper = screen.getByRole('img', { name: 'Ada', exact: true }).element();
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
				.element(screen.getByRole('img', { name: 'Ada Lovelace, Online', exact: true }))
				.toBeInTheDocument();
		});

		it('composes the status label into the accessible name for initials avatars', async () => {
			const screen = await render(AvatarStatusFixture, {
				props: {
					avatar: { name: 'Ada Lovelace' },
					dot: { variant: 'error', label: 'Busy' }
				}
			});
			const avatar = screen.getByRole('img', { name: 'Ada Lovelace, Busy', exact: true });
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
				.element(
					screen.getByRole('img', { name: 'Ada Lovelace, profile photo, Online', exact: true })
				)
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
		const wrapper = screen.getByRole('img', { name: 'Ada', exact: true }).element();
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
			await expect
				.element(screen.getByRole('img', { name: 'Profile photo', exact: true }))
				.toBeInTheDocument();
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
			await expect
				.element(screen.getByRole('img', { name: 'Ada Lovelace', exact: true }))
				.toBeInTheDocument();

			await screen.rerender({ name: 'Ada Lovelace', tooltip: false });
			await expect
				.element(screen.getByRole('img', { name: 'Ada Lovelace', exact: true }))
				.toBeInTheDocument();

			await screen.rerender({ name: 'alovelace', tooltip: 'Ada Lovelace, Eng' });
			// alt||name still drives the accessible name — not the custom tooltip.
			await expect
				.element(screen.getByRole('img', { name: 'alovelace', exact: true }))
				.toBeInTheDocument();

			// `rerender` merges props rather than replacing them, so `tooltip` is
			// reset to its default here to reproduce upstream's fourth prop set.
			await screen.rerender({
				name: 'alovelace',
				alt: "Ada's profile photo",
				tooltip: true
			});
			await expect
				.element(screen.getByRole('img', { name: "Ada's profile photo", exact: true }))
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
		const link = screen.getByRole('link', { name: 'Ada Lovelace', exact: true }).element();
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
		const link = screen.getByRole('link', { name: 'Ada', exact: true }).element();
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('renders a <button type="button"> when `onClick` is set (no href)', async () => {
		const handleClick = vi.fn();
		const screen = await render(Avatar, { props: { name: 'Ada', onclick: handleClick } });
		const button = screen.getByRole('button', { name: 'Ada', exact: true });
		expect(button.element().tagName).toBe('BUTTON');
		expect(button.element()).toHaveAttribute('type', 'button');
		await userEvent.click(button);
		expect(handleClick).toHaveBeenCalledOnce();
	});

	it('href wins over onClick (link, not button)', async () => {
		const screen = await render(Avatar, {
			props: { name: 'Ada', href: '/ada', onclick: () => {} }
		});
		await expect
			.element(screen.getByRole('link', { name: 'Ada', exact: true }))
			.toBeInTheDocument();
		expect(screen.getByRole('button').query()).toBeNull();
	});

	it('stays a static element (no href, no onClick) — non-breaking default', async () => {
		const screen = await render(Avatar, { props: { name: 'Ada' } });
		await expect.element(screen.getByRole('img', { name: 'Ada', exact: true })).toBeInTheDocument();
		expect(screen.getByRole('link').query()).toBeNull();
		expect(screen.getByRole('button').query()).toBeNull();
	});

	it('stamps the data-avatar-item marker on the interactive link', async () => {
		const screen = await render(Avatar, { props: { name: 'Ada', href: '/ada' } });
		expect(screen.getByRole('link', { name: 'Ada', exact: true }).element()).toHaveAttribute(
			'data-avatar-item'
		);
	});

	it('stamps the data-avatar-item marker on the interactive button', async () => {
		const screen = await render(Avatar, { props: { name: 'Ada', onclick: () => {} } });
		expect(screen.getByRole('button', { name: 'Ada', exact: true }).element()).toHaveAttribute(
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
		const button = screen
			.getByRole('button', { name: 'Ada', exact: true })
			.element() as HTMLElement;
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

	// -- 0.4.2: the box moves to the theme target, and a blank name is no name --

	it('puts the avatar box on the element that carries the theme target', async () => {
		// T7: `.astryx-avatar` documents a `size` visual prop, so the width and
		// height that prop selects on must live on the targeted element — a theme
		// rule that resizes the target has to resize the whole avatar, not leave a
		// fixed-size circle inside a grown box.
		const screen = await render(Avatar, {
			props: { name: 'Ada Lovelace', size: 'lg', 'data-testid': 'a' }
		});
		const root = screen.container.querySelector('[data-testid="a"]') as HTMLElement;
		expect(root.className).toContain('astryx-avatar');
		expect(root.getAttribute('style') ?? '').toContain('48px');

		const content = root.firstElementChild as HTMLElement;
		expect(content.getAttribute('style') ?? '').not.toContain('48px');
	});

	it('keeps the box on the root for an interactive avatar too', async () => {
		const screen = await render(Avatar, { props: { name: 'Ada', size: 'lg', href: '/ada' } });
		const link = screen.getByRole('link', { name: 'Ada', exact: true }).element();
		expect(link.getAttribute('style') ?? '').toContain('48px');
	});

	describe('a whitespace-only name carries no identity', () => {
		it('falls through to the default icon instead of an empty plate', async () => {
			const screen = await render(Avatar, { props: { name: '   ', 'data-testid': 'a' } });
			const el = screen.container.querySelector('[data-testid="a"]') as HTMLElement;
			expect(el.querySelector('svg')).not.toBeNull();
			expect(el.textContent?.trim()).toBe('');
		});

		it('is decorative rather than a role="img" with a blank name', async () => {
			const screen = await render(Avatar, { props: { name: '   ', 'data-testid': 'a' } });
			const el = screen.container.querySelector('[data-testid="a"]') as HTMLElement;
			expect(el).toHaveAttribute('aria-hidden', 'true');
			expect(el).not.toHaveAttribute('aria-label');
		});

		it('keeps a meaningful alt as the accessible name and still shows the icon', async () => {
			const screen = await render(Avatar, {
				props: { name: '   ', alt: 'Profile photo', 'data-testid': 'a' }
			});
			const el = screen.getByRole('img', { name: 'Profile photo', exact: true }).element();
			expect(el).toBe(screen.container.querySelector('[data-testid="a"]'));
			expect(el.querySelector('svg')).not.toBeNull();
		});

		it('treats a whitespace-only alt the same way', async () => {
			const screen = await render(Avatar, {
				props: { alt: '  ', name: 'Ada Lovelace', 'data-testid': 'a' }
			});
			await expect
				.element(screen.getByRole('img', { name: 'Ada Lovelace', exact: true }))
				.toBeInTheDocument();
		});
	});
});
