import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import EmptyState from '$lib/components/empty-state/empty-state.svelte';
import IconButton from '$lib/components/icon-button/icon-button.svelte';
import NavIcon from '$lib/components/nav-icon/nav-icon.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';

/**
 * Three of the four L0 leaves ported together — `NavIcon`, `IconButton` and
 * `EmptyState` — with all three upstream suites ported case for case.
 *
 * They share a file because they share exactly one thing, which is what made
 * them a batch: none of them has state, an effect, or a React idiom needing
 * translation. Splitting them into three files would say more about the layout
 * than about the code.
 *
 * **`Citation` was the fourth and has moved to `citation.svelte.test.ts`.**
 * Upstream's suite grew from 7 cases to 16 at 0.2.0 (four pointer-cursor cases
 * and five source-icon cases), which is more than a shared file can carry
 * without burying the other three. The seven cases that were here are ported
 * there in upstream's order; they had been *restated* to read computed colours
 * out of the browser and are now back on upstream's own atomic-class probe.
 *
 * Two upstream cases have counterparts rather than translations, both for the
 * same reason as `Thumbnail`'s: `ref` forwarding becomes the attachment a
 * consumer passes through the rest props, which checks more than upstream's
 * does because it receives the element. `IconButton.displayName` is dropped —
 * Svelte has no such surface, the same reason `InteractiveRoleContext`'s
 * `displayName` case was dropped.
 */

describe('NavIcon', () => {
	it('renders icon content', async () => {
		const screen = await render(SlotProbe, {
			props: { component: NavIcon, slot: 'icon', text: 'Icon', testid: 'icon' }
		});
		expect(screen.container.querySelector('[data-testid="icon"]')).not.toBeNull();
	});

	it('hands the root element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(SlotProbe, {
			props: {
				component: NavIcon,
				slot: 'icon',
				text: 'Icon',
				rest: { [createAttachmentKey()]: attached }
			}
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(screen.container.querySelector('span'));
	});

	it('passes data-testid', async () => {
		const screen = await render(SlotProbe, {
			props: { component: NavIcon, slot: 'icon', text: 'Icon', rest: { 'data-testid': 'nav-icon' } }
		});
		expect(screen.container.querySelector('[data-testid="nav-icon"]')).not.toBeNull();
	});
});

describe('IconButton', () => {
	const iconOnly = (rest: Record<string, unknown> = {}) => ({
		component: IconButton,
		slot: 'icon',
		text: '⚙',
		testid: 'icon',
		rest: { label: 'Settings', ...rest }
	});

	it('renders as an icon-only button with aria-label', async () => {
		const screen = await render(SlotProbe, { props: iconOnly() });
		const button = screen.container.querySelector('button')!;
		expect(button).toHaveAttribute('aria-label', 'Settings');
		expect(screen.container.querySelector('[data-testid="icon"]')).not.toBeNull();
	});

	it('does not render label as visible text', async () => {
		const screen = await render(SlotProbe, { props: iconOnly() });
		expect(screen.container.querySelector('button')!.textContent).not.toContain('Settings');
	});

	it('forwards variant prop', async () => {
		const screen = await render(SlotProbe, {
			props: iconOnly({ label: 'Delete', variant: 'destructive' })
		});
		await expect.element(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
	});

	it('forwards size prop', async () => {
		const screen = await render(SlotProbe, { props: iconOnly({ label: 'Add', size: 'sm' }) });
		await expect.element(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
	});

	it('handles click events', async () => {
		const onclick = vi.fn();
		const screen = await render(SlotProbe, { props: iconOnly({ label: 'Close', onclick }) });
		await userEvent.click(screen.getByRole('button'));
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('is disabled when isDisabled is true', async () => {
		const onclick = vi.fn();
		const screen = await render(SlotProbe, {
			props: iconOnly({ label: 'Close', isDisabled: true, onclick })
		});
		const button = screen.container.querySelector('button')!;
		expect(button).toBeDisabled();
		button.click();
		expect(onclick).not.toHaveBeenCalled();
	});

	it('shows loading state', async () => {
		const screen = await render(SlotProbe, { props: iconOnly({ label: 'Save', isLoading: true }) });
		expect(screen.container.querySelector('button')).toBeDisabled();
	});

	it('hands the button element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(SlotProbe, {
			props: iconOnly({ label: 'Action', [createAttachmentKey()]: attached })
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(screen.container.querySelector('button'));
	});
});

describe('EmptyState', () => {
	it('renders with title', async () => {
		const screen = await render(EmptyState, { props: { title: 'No results found' } });
		await expect.element(screen.getByText('No results found')).toBeInTheDocument();
	});

	it('renders title as h3 by default', async () => {
		const screen = await render(EmptyState, { props: { title: 'No data' } });
		expect(screen.container.querySelector('h3')!.textContent).toContain('No data');
	});

	it('renders custom heading level', async () => {
		const screen = await render(EmptyState, { props: { title: 'No data', headingLevel: 2 } });
		expect(screen.container.querySelector('h2')!.textContent).toContain('No data');
	});

	it('renders all heading levels', async () => {
		for (const level of [1, 2, 3, 4, 5, 6] as const) {
			const screen = await render(EmptyState, {
				props: { title: `Level ${level}`, headingLevel: level }
			});
			const heading = screen.container.querySelector(`h${level}`)!;
			expect(heading.textContent).toContain(`Level ${level}`);
			screen.unmount();
		}
	});

	it('renders with description', async () => {
		const screen = await render(EmptyState, {
			props: { title: 'No results', description: 'Try adjusting your search.' }
		});
		const description = screen.getByText('Try adjusting your search.');
		await expect.element(description).toBeInTheDocument();
		// Renders as <div> (never <p>) so block content composes safely.
		expect((await description.element()).tagName).toBe('DIV');
	});

	it('does not render description when not provided', async () => {
		const screen = await render(EmptyState, { props: { title: 'No results' } });
		expect(screen.container.textContent).not.toContain('Try adjusting your search.');
	});

	it('renders with icon', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: EmptyState,
				slot: 'icon',
				text: '\u{1F4ED}',
				testid: 'empty-icon',
				rest: { title: 'No results' }
			}
		});
		expect(screen.container.querySelector('[data-testid="empty-icon"]')).not.toBeNull();
	});

	it('marks icon as decorative with aria-hidden', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: EmptyState,
				slot: 'icon',
				text: '\u{1F4ED}',
				testid: 'empty-icon',
				rest: { title: 'No results' }
			}
		});
		const wrapper = screen.container.querySelector('[data-testid="empty-icon"]')!.parentElement;
		expect(wrapper).toHaveAttribute('aria-hidden', 'true');
	});

	it('does not render icon wrapper when icon is not provided', async () => {
		const screen = await render(EmptyState, { props: { title: 'No results' } });
		expect(screen.container.querySelector('[aria-hidden="true"]')).toBeNull();
	});

	it('renders with actions', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: EmptyState,
				slot: 'actions',
				text: 'Retry',
				testid: 'action-btn',
				rest: { title: 'No results' }
			}
		});
		expect(screen.container.querySelector('[data-testid="action-btn"]')).not.toBeNull();
	});

	it('does not render actions wrapper when actions is not provided', async () => {
		const screen = await render(EmptyState, { props: { title: 'No results' } });
		// Container div + text group div, and no actions wrapper.
		expect(screen.container.querySelectorAll('div')).toHaveLength(2);
	});

	it('has role="status" on the container', async () => {
		const screen = await render(EmptyState, { props: { title: 'No results' } });
		await expect.element(screen.getByRole('status')).toBeInTheDocument();
	});

	it('renders compact variant', async () => {
		const screen = await render(EmptyState, { props: { title: 'No results', isCompact: true } });
		await expect.element(screen.getByRole('status')).toBeInTheDocument();
		await expect.element(screen.getByText('No results')).toBeInTheDocument();
	});

	it('hands the root element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(EmptyState, {
			props: { title: 'No results', [createAttachmentKey()]: attached }
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBe(screen.container.querySelector('[role="status"]'));
	});

	it('spreads data-testid', async () => {
		const screen = await render(EmptyState, {
			props: { title: 'No results', 'data-testid': 'empty-state' }
		});
		expect(screen.container.querySelector('[data-testid="empty-state"]')).not.toBeNull();
	});

	it('renders all slots together', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: EmptyState,
				slot: 'icon',
				text: '\u{1F50D}',
				testid: 'icon',
				rest: {
					title: 'No results found',
					description: 'Try a different search term.'
				}
			}
		});
		expect(screen.container.querySelector('[data-testid="icon"]')).not.toBeNull();
		expect(screen.container.textContent).toContain('No results found');
		expect(screen.container.textContent).toContain('Try a different search term.');
	});
});
