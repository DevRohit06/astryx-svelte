import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import AvatarGroupFixture from './fixtures/avatar-group-fixture.svelte';
import AvatarGroupI18nFixture from './fixtures/avatar-group-i18n.svelte';

/**
 * Astryx's `AvatarGroup/AvatarGroup.test.tsx`, ported case for case — **33
 * upstream cases at the 0.5.2 pin** (7 in `describe('AvatarGroup')`, 6 in
 * `describe('AvatarGroupOverflow')`, 9 in `describe('AvatarGroupOverflow —
 * hardening')`, 6 in `describe('AvatarGroup — roving focus + keyboard hint')`
 * and 3 in `describe('AvatarGroup — size cascade')`), **25 here**. There is no
 * `displayName` case, no snapshot and no no-JSX construction form, so `ref` is
 * the only React-only surface and it gets a counterpart.
 *
 * **8 are not here.** Six arrived at 0.5.0 and two more at 0.5.1; none is
 * droppable:
 *
 * - **The whole 3-case `AvatarGroup — size cascade` block** — the group's
 *   explicit size overriding a child's own `size` prop, the group's *default*
 *   size doing the same, and an avatar outside a group keeping its own size.
 * - **2 of the 9 `AvatarGroupOverflow — hardening` cases** — `clamps a negative
 *   count rather than rendering "+-3"` and `renders outside an AvatarGroup at
 *   the md fallback size`.
 * - **1 of the 6 `AvatarGroupOverflow` cases** — `applies the group size class
 *   to the overflow chip`.
 *
 * All six are the same subject: the size a chip or an avatar resolves to,
 * inside a group and outside one.
 *
 * **The 2 added at 0.5.1** come with the group's new `shape` prop, and both
 * would pass against this port today — the prop, the context field and the
 * chip's `data-shape` all landed in the 0.5.2 batch:
 *
 * - `applies the group shape to the overflow chip, matching its avatars`
 * - `defaults the overflow chip to circle shape with no explicit AvatarGroup
 *   shape`
 *
 * (This header read "**31** upstream cases at the 0.5.0 pin … 25 here", true at
 * that pin. The pin move to 0.5.2 is what invalidated it: a stated count is a
 * contract against upstream's file at the *current* pin.)
 *
 * (This header read "**25** upstream cases at v0.3.0 … 25 here, none dropped",
 * true at that pin.)
 *
 * What translated, each commented where it appears:
 *
 * - **Every case goes through `avatar-group-fixture.svelte`.** `children` is a
 *   `Snippet` here — for the group, for each avatar's `status`, and for the
 *   overflow's custom content — and a snippet can only be authored in a template.
 *   The per-avatar status arrives as a `'dot'`/`'button'` discriminator for the
 *   same reason.
 *
 * - **The two `forwards ref to the span/button element` cases are counterparts.**
 *   Svelte has no `ref`; a consumer reaches the element through an attachment
 *   travelling in the rest props, which `AvatarGroupOverflow` spreads onto
 *   whichever element it renders. It asks upstream's question — *which element
 *   did the consumer get?* — and answers it with the same `instanceof`.
 *
 * - **`onClick` is `onclick` and `className` is `class`**, Svelte's spellings of
 *   the same props. Neither changes what is asserted.
 *
 * - **`getByLabelText` carries `{exact: true}`.** RTL's string queries are exact
 *   by default and vitest's are substring, so the option is what preserves
 *   upstream's semantics rather than loosening them. Same for the `+N` text
 *   queries, where `'+4'` would otherwise match `'+44'`.
 *
 * - **The composed-status case uses a retrying assertion.** `AvatarStatusDot`
 *   registers its label upward through a context sink in an `$effect` (a
 *   `Snippet` has no props to read, where upstream reads `status.props.label` off
 *   the React node), so the composed accessible name appears one flush after
 *   mount. The observable contract — the name, never the mechanism — is
 *   unchanged.
 */

describe('AvatarGroup', () => {
	it('renders all avatar children', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: { avatars: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }] }
		});

		await expect.element(screen.getByLabelText('Alice', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByLabelText('Bob', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByLabelText('Charlie', { exact: true })).toBeInTheDocument();
	});

	it('composes a labelled status into a grouped avatar accessible name (WCAG 4.1.2)', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: {
				avatars: [
					{ name: 'Alice', status: 'dot', statusDot: { variant: 'success', label: 'Online' } },
					{ name: 'Bob' }
				]
			}
		});

		// Retrying: the dot registers its label in an `$effect`, so the composed
		// name lands one flush after mount.
		await expect
			.element(screen.getByLabelText('Alice, Online', { exact: true }))
			.toBeInTheDocument();
		await expect.element(screen.getByLabelText('Bob', { exact: true })).toBeInTheDocument();
	});

	it('renders with role="group" and default aria-label', async () => {
		const screen = await render(AvatarGroupFixture, { props: { avatars: [{ name: 'Alice' }] } });

		expect(screen.getByRole('group').element()).toHaveAttribute('aria-label', 'Avatars');
	});

	it('accepts a custom aria-label', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: { group: { 'aria-label': 'Team members' }, avatars: [{ name: 'Alice' }] }
		});

		expect(screen.getByRole('group').element()).toHaveAttribute('aria-label', 'Team members');
	});

	it('applies data-testid', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: { group: { 'data-testid': 'avatar-group' }, avatars: [{ name: 'Alice' }] }
		});

		await expect.element(screen.getByTestId('avatar-group')).toBeInTheDocument();
	});

	it('applies size class to the group', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: { group: { size: 'lg' }, avatars: [{ name: 'Alice' }] }
		});

		const group = screen.getByRole('group').element();
		expect(group.className).toContain('astryx-avatar-group');
		expect(group.className).toContain('lg');
	});

	it('renders empty group when no children', async () => {
		// Upstream's `{[]}`: a group with no avatars at all.
		const screen = await render(AvatarGroupFixture, {
			props: { group: { 'data-testid': 'empty' }, avatars: [] }
		});

		await expect.element(screen.getByTestId('empty')).toBeInTheDocument();
		expect(screen.getByRole('img').query()).toBeNull();
	});
});

describe('AvatarGroupOverflow', () => {
	it('renders overflow count as span by default', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: { avatars: [{ name: 'Alice' }], overflow: { count: 5 } }
		});

		const overflow = screen.getByLabelText('5 more', { exact: true }).element();
		expect(overflow.tagName).toBe('SPAN');
		expect(overflow).toHaveTextContent('+5');
	});

	it('renders as button when onClick is provided', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: { avatars: [{ name: 'Alice' }], overflow: { count: 3, onclick: () => {} } }
		});

		const overflow = screen.getByLabelText('3 more', { exact: true }).element();
		expect(overflow.tagName).toBe('BUTTON');
	});

	it('calls onClick when clicked', async () => {
		const handleClick = vi.fn();

		const screen = await render(AvatarGroupFixture, {
			props: { avatars: [{ name: 'Alice' }], overflow: { count: 3, onclick: handleClick } }
		});

		await userEvent.click(screen.getByLabelText('3 more', { exact: true }));
		expect(handleClick).toHaveBeenCalledOnce();
	});

	it('renders custom children instead of default label', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: { avatars: [{ name: 'Alice' }], overflow: { count: 5 }, overflowChild: true }
		});

		await expect.element(screen.getByTestId('custom')).toBeInTheDocument();
	});

	it('works with sliced avatar list and server-side count', async () => {
		const users = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
		const serverTotal = 47;
		const visibleCount = 3;

		const screen = await render(AvatarGroupFixture, {
			props: {
				group: { size: 'lg' },
				avatars: users.slice(0, visibleCount).map((name) => ({ name })),
				overflow: { count: serverTotal - visibleCount }
			}
		});

		await expect.element(screen.getByLabelText('Alice', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByLabelText('Bob', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByLabelText('Charlie', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByLabelText('44 more', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('+44', { exact: true })).toBeInTheDocument();
	});
});

describe('AvatarGroupOverflow — hardening', () => {
	it('forwards ref to the span element', async () => {
		// Counterpart to upstream's `ref`: an attachment in the rest props, which
		// the overflow spreads onto the element it renders. It receives the element
		// rather than only proving a callback ran, so the `instanceof` is upstream's
		// unchanged.
		let node: Element | undefined;

		await render(AvatarGroupFixture, {
			props: {
				avatars: [{ name: 'Alice' }],
				overflow: {
					count: 3,
					[createAttachmentKey()]: (element: Element) => {
						node = element;
					}
				}
			}
		});

		expect(node).toBeInstanceOf(HTMLSpanElement);
	});

	it('forwards ref to the button element when onClick provided', async () => {
		let node: Element | undefined;

		await render(AvatarGroupFixture, {
			props: {
				avatars: [{ name: 'Alice' }],
				overflow: {
					count: 3,
					onclick: () => {},
					[createAttachmentKey()]: (element: Element) => {
						node = element;
					}
				}
			}
		});

		expect(node).toBeInstanceOf(HTMLButtonElement);
	});

	it('applies className prop', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: { avatars: [{ name: 'Alice' }], overflow: { count: 3, class: 'custom-class' } }
		});

		const overflow = screen.getByLabelText('3 more', { exact: true }).element();
		expect(overflow.className).toContain('custom-class');
	});

	it('handles count of zero gracefully', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: { avatars: [{ name: 'Alice' }], overflow: { count: 0 } }
		});

		await expect.element(screen.getByText('+0', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByLabelText('0 more', { exact: true })).toBeInTheDocument();
	});

	it('handles very large count', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: { avatars: [{ name: 'Alice' }], overflow: { count: 999 } }
		});

		await expect.element(screen.getByText('+999', { exact: true })).toBeInTheDocument();
	});

	it('renders the full "+N" text for wide multi-digit counts', async () => {
		// The indicator grows into a pill for long counts, so the entire number
		// must remain present (nothing clipped away in the DOM).
		const screen = await render(AvatarGroupFixture, {
			props: { avatars: [{ name: 'Alice' }], overflow: { count: 4912 } }
		});

		await expect.element(screen.getByText('+4912', { exact: true })).toBeInTheDocument();
		// The aria-label routes through the catalog's `{count, number}` ICU
		// argument, so the en locale adds a grouping separator.
		await expect.element(screen.getByLabelText('4,912 more', { exact: true })).toBeInTheDocument();
	});

	it('localizes the overflow label through the i18n catalog', async () => {
		const screen = await render(AvatarGroupI18nFixture, {
			props: {
				locale: 'fr',
				overrides: { fr: { '@astryx.avatarGroup.overflow': '{count, number} de plus' } },
				avatars: [{ name: 'Alice' }],
				overflow: { count: 3 }
			}
		});

		await expect.element(screen.getByLabelText('3 de plus', { exact: true })).toBeInTheDocument();
	});
});

describe('AvatarGroup — roving focus + keyboard hint', () => {
	it('is a single tab stop over interactive avatars (one tabindex=0, rest -1)', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: {
				avatars: [
					{ name: 'Alice', href: '/alice' },
					{ name: 'Bob', href: '/bob' },
					{ name: 'Charlie', href: '/charlie' }
				]
			}
		});

		const alice = screen.getByRole('link', { name: 'Alice', exact: true }).element();
		const bob = screen.getByRole('link', { name: 'Bob', exact: true }).element();
		const charlie = screen.getByRole('link', { name: 'Charlie', exact: true }).element();

		expect(alice).toHaveAttribute('tabindex', '0');
		expect(bob).toHaveAttribute('tabindex', '-1');
		expect(charlie).toHaveAttribute('tabindex', '-1');
	});

	it('roves focus with ArrowRight/ArrowLeft across interactive avatars', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: {
				avatars: [
					{ name: 'Alice', href: '/alice' },
					{ name: 'Bob', onclick: () => {} },
					{ name: 'Charlie', href: '/charlie' }
				]
			}
		});

		const alice = screen.getByRole('link', { name: 'Alice', exact: true }).element() as HTMLElement;
		const bob = screen.getByRole('button', { name: 'Bob', exact: true }).element();
		const charlie = screen.getByRole('link', { name: 'Charlie', exact: true }).element();

		alice.focus();
		expect(alice).toHaveFocus();

		await userEvent.keyboard('{ArrowRight}');
		expect(bob).toHaveFocus();
		expect(bob).toHaveAttribute('tabindex', '0');
		expect(alice).toHaveAttribute('tabindex', '-1');

		await userEvent.keyboard('{ArrowRight}');
		expect(charlie).toHaveFocus();

		await userEvent.keyboard('{ArrowLeft}');
		expect(bob).toHaveFocus();
	});

	it('includes the overflow button as the last roving item', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: {
				avatars: [{ name: 'Alice', href: '/alice' }],
				overflow: { count: 3, onclick: () => {} }
			}
		});

		const alice = screen.getByRole('link', { name: 'Alice', exact: true }).element() as HTMLElement;
		const overflow = screen.getByRole('button', { name: '3 more', exact: true }).element();
		expect(overflow).toHaveAttribute('data-avatar-item');

		alice.focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(overflow).toHaveFocus();
	});

	it('does NOT rove over a non-avatar button in a status slot', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: {
				avatars: [
					{ name: 'Alice', href: '/alice', status: 'button' },
					{ name: 'Bob', href: '/bob' }
				]
			}
		});

		const alice = screen.getByRole('link', { name: 'Alice', exact: true }).element() as HTMLElement;
		const bob = screen.getByRole('link', { name: 'Bob', exact: true }).element();
		const statusButton = screen.getByRole('button', { name: 'badge', exact: true }).element();

		// The status button carries no data-avatar-item marker.
		expect(statusButton).not.toHaveAttribute('data-avatar-item');

		alice.focus();
		await userEvent.keyboard('{ArrowRight}');
		// Arrow moves to the next avatar, skipping the nested status button.
		expect(bob).toHaveFocus();
		expect(statusButton).not.toHaveFocus();
	});

	it('attaches an aria-describedby keyboard hint when interactive children exist', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: {
				avatars: [
					{ name: 'Alice', href: '/alice' },
					{ name: 'Bob', href: '/bob' }
				]
			}
		});

		const group = screen.getByRole('group').element();
		const describedBy = group.getAttribute('aria-describedby');
		expect(describedBy).toBeTruthy();
		const hint = document.getElementById(describedBy!);
		expect(hint).not.toBeNull();
		expect(hint).toHaveTextContent('Use arrow keys to move between avatars');
	});

	it('a purely static group has no tab stop and no keyboard hint', async () => {
		const screen = await render(AvatarGroupFixture, {
			props: {
				avatars: [
					{ name: 'Alice', 'data-testid': 'alice' },
					{ name: 'Bob', 'data-testid': 'bob' }
				]
			}
		});

		const group = screen.getByRole('group').element();
		expect(group).not.toHaveAttribute('aria-describedby');
		// Static avatars are not focusable — no roving tabindex stamped.
		expect(screen.getByTestId('alice').element()).not.toHaveAttribute('tabindex');
		expect(screen.getByTestId('bob').element()).not.toHaveAttribute('tabindex');
	});
});
