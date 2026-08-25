import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createAttachmentKey } from 'svelte/attachments';
import Item from '$lib/components/item/item.svelte';
import SlotProbe from './fixtures/slot-probe.svelte';
import ItemProbe from './fixtures/item-probe.svelte';
import ItemDelegating from './fixtures/item-delegating.svelte';

/**
 * Astryx's `Item/Item.test.tsx` at the **0.5.0** pin — **48 upstream cases, 45
 * here**, ported case for case. (This header read "**45** upstream cases, 45
 * here … nothing dropped" at the v0.3.0 pin, where 45 was the whole suite. It
 * said "37" before that, which was wrong on 0.2.0 too, where both sides had 40.)
 *
 * **The 3 that are not here all arrived at 0.5.0**, and all three cover the
 * `layout="inline"` branch: `puts the label and description in one row when
 * layout is inline`, `ellipsizes a ReactNode description when layout is
 * inline`, and `ignores inline layout when there is no description`. This is a
 * test gap only — `item.svelte` implements the branch (`layout` defaults to
 * `'stacked'`, and `isInline` requires a `description`), and its StyleX trio is
 * wired through, so all three transcribe from upstream unchanged.
 *
 * Upstream's `marker`/`startContent`/`endContent` are `ReactNode` props and its
 * `label`/`description` are `ReactNode` too; here they are Svelte snippets (and
 * `label`/`description` are `string | Snippet`). A case that passes an inline
 * element goes through a snippet: single-slot cases reuse the shared
 * `slot-probe`, and the multi-slot / interactive-inner / rich-label cases go
 * through `item-probe.svelte`.
 *
 * One case is a *counterpart* rather than a translation, commented at the case:
 *
 * - **`forwards ref to the root element`.** Svelte has no `ref`; a consumer
 *   reaches the root element with an attachment travelling through the rest
 *   props, which the port spreads onto its `<svelte:element>` root. That is what
 *   is asserted — and it checks more than upstream's does, since it receives the
 *   element rather than only proving a callback ran.
 *
 * The five `interactiveRef` (delegation) cases upstream added in 0.3.0 go
 * through `fixtures/item-delegating.svelte`, which is upstream's `DelegatingItem`
 * helper: it holds the nested checkbox with `bind:this` and hands it over as a
 * getter, since `interactiveRef` is a getter here rather than a `RefObject`.
 */

describe('Item', () => {
	// ===========================================================================
	// Basic rendering
	// ===========================================================================

	it('renders label text', async () => {
		const screen = await render(Item, { props: { label: 'Contact Name' } });
		await expect.element(screen.getByText('Contact Name', { exact: true })).toBeInTheDocument();
	});

	it('renders label and description', async () => {
		const screen = await render(Item, {
			props: { label: 'Settings', description: 'Manage your preferences' }
		});
		await expect.element(screen.getByText('Settings', { exact: true })).toBeInTheDocument();
		await expect
			.element(screen.getByText('Manage your preferences', { exact: true }))
			.toBeInTheDocument();
	});

	it('renders marker', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: Item,
				slot: 'marker',
				text: '•',
				testid: 'marker',
				rest: { label: 'Item' }
			}
		});
		await expect.element(screen.getByTestId('marker')).toBeInTheDocument();
	});

	it('renders startContent', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: Item,
				slot: 'startContent',
				text: 'A',
				testid: 'avatar',
				rest: { label: 'Item' }
			}
		});
		await expect.element(screen.getByTestId('avatar')).toBeInTheDocument();
	});

	it('renders endContent', async () => {
		const screen = await render(SlotProbe, {
			props: {
				component: Item,
				slot: 'endContent',
				text: '3',
				testid: 'badge',
				rest: { label: 'Item' }
			}
		});
		await expect.element(screen.getByTestId('badge')).toBeInTheDocument();
	});

	it('renders all slots together', async () => {
		const screen = await render(ItemProbe, {
			props: {
				markerId: 'marker',
				startId: 'start',
				endId: 'end',
				rest: { label: 'Label', description: 'Description' }
			}
		});
		await expect.element(screen.getByTestId('marker')).toBeInTheDocument();
		await expect.element(screen.getByTestId('start')).toBeInTheDocument();
		await expect.element(screen.getByText('Label', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Description', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();
	});

	it('supports data-testid', async () => {
		const screen = await render(Item, { props: { label: 'Item', 'data-testid': 'my-item' } });
		await expect.element(screen.getByTestId('my-item')).toBeInTheDocument();
	});

	it('renders as a div element', async () => {
		const screen = await render(Item, { props: { label: 'Item' } });
		// `firstElementChild` rather than upstream's `firstChild`: identical when
		// the root is an element, and skips any Svelte anchor comment nodes.
		expect(screen.container.firstElementChild?.nodeName).toBe('DIV');
	});

	// ===========================================================================
	// Ref forwarding
	// ===========================================================================

	it('forwards ref to the root element', async () => {
		// Counterpart: Svelte has no `ref`. The root element reaches a consumer
		// through an attachment passed in rest props, which the port spreads onto
		// its `<svelte:element>` root. Asserting on the element itself (that it is
		// an `HTMLDivElement`) checks more than upstream's callback-ran assertion.
		const attached = vi.fn();
		const screen = await render(Item, {
			props: { label: 'Item', [createAttachmentKey()]: attached }
		});
		expect(attached).toHaveBeenCalledOnce();
		expect(attached.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
		expect(attached.mock.calls[0][0]).toBe(screen.container.firstElementChild);
	});

	// ===========================================================================
	// Interactive — onClick (invisible button pattern)
	// ===========================================================================

	it('renders an invisible button when onClick is provided', async () => {
		const onclick = vi.fn();
		const screen = await render(Item, { props: { label: 'Clickable', onclick } });
		const button = screen.container.querySelector('button');
		expect(button).toBeInTheDocument();
		expect(button?.textContent).toContain('Clickable');
	});

	it('fires onClick when invisible button is clicked', async () => {
		const onclick = vi.fn();
		const screen = await render(Item, { props: { label: 'Clickable', onclick } });
		await userEvent.click(screen.getByRole('button'));
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('fires onClick when container area is clicked', async () => {
		const onclick = vi.fn();
		const screen = await render(SlotProbe, {
			props: {
				component: Item,
				slot: 'startContent',
				text: 'S',
				testid: 'start',
				rest: { label: 'Clickable', onclick, 'data-testid': 'item' }
			}
		});
		await userEvent.click(screen.getByTestId('start'));
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('does not fire item onClick when endContent interactive element is clicked', async () => {
		const itemClick = vi.fn();
		const buttonClick = vi.fn();
		const screen = await render(ItemProbe, {
			props: {
				endButton: { text: 'Action', onclick: buttonClick },
				rest: { label: 'Item', onclick: itemClick }
			}
		});
		await userEvent.click(screen.getByText('Action', { exact: true }));
		expect(buttonClick).toHaveBeenCalledTimes(1);
		expect(itemClick).not.toHaveBeenCalled();
	});

	it('does not fire item onClick when startContent interactive element is clicked', async () => {
		const itemClick = vi.fn();
		const buttonClick = vi.fn();
		const screen = await render(ItemProbe, {
			props: {
				startButton: { text: 'Open', onclick: buttonClick },
				rest: { label: 'Item', onclick: itemClick }
			}
		});
		await userEvent.click(screen.getByText('Open', { exact: true }));
		expect(buttonClick).toHaveBeenCalledTimes(1);
		expect(itemClick).not.toHaveBeenCalled();
	});

	it('invisible button is focusable via keyboard', async () => {
		const screen = await render(Item, { props: { label: 'Focusable', onclick: () => {} } });
		await userEvent.tab();
		await expect.element(screen.getByRole('button')).toHaveFocus();
	});

	it('invisible button can be activated via keyboard', async () => {
		const onclick = vi.fn();
		await render(Item, { props: { label: 'Pressable', onclick } });
		await userEvent.tab();
		await userEvent.keyboard('{Enter}');
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('does not render nested buttons — only one invisible button', async () => {
		const screen = await render(Item, { props: { label: 'Item', onclick: () => {} } });
		const buttons = screen.container.querySelectorAll('div button');
		expect(buttons).toHaveLength(1);
	});

	// ===========================================================================
	// Interactive — interactiveRef (delegation to a nested control)
	// ===========================================================================

	it('renders no invisible button in interactiveRef (delegation) mode', async () => {
		const screen = await render(ItemDelegating, {});
		// The nested control provides keyboard access — the row must not add a
		// second focusable control for the same action (WCAG 4.1.2).
		expect(screen.container.querySelector('button')).not.toBeInTheDocument();
	});

	it('keeps the nested control as the only tab stop in interactiveRef mode', async () => {
		const screen = await render(ItemDelegating, {});
		await userEvent.tab();
		await expect.element(screen.getByRole('checkbox')).toHaveFocus();
		// Next tab leaves the item entirely — the row itself is not focusable.
		await userEvent.tab();
		expect(screen.getByRole('checkbox').element()).not.toBe(document.activeElement);
		expect(document.activeElement).toBe(document.body);
	});

	it('delegates a row-surface click to the interactive control', async () => {
		const onToggle = vi.fn();
		const screen = await render(ItemDelegating, { props: { onToggle } });
		// Clicking the label (row surface) is forwarded to the checkbox.
		await userEvent.click(screen.getByText('Row', { exact: true }));
		expect(onToggle).toHaveBeenCalledTimes(1);
	});

	it('does not double-fire when the interactive control itself is clicked', async () => {
		const onToggle = vi.fn();
		const screen = await render(ItemDelegating, { props: { onToggle } });
		await userEvent.click(screen.getByRole('checkbox'));
		// The row must not re-forward the control's own click back to it.
		expect(onToggle).toHaveBeenCalledTimes(1);
	});

	it('ignores onclick when interactiveRef is set (delegation wins, single tab stop)', async () => {
		const onclick = vi.fn();
		const screen = await render(ItemDelegating, { props: { onclick } });
		// No invisible button (`onclick` is ignored in delegation mode)...
		expect(screen.container.querySelector('button')).not.toBeInTheDocument();
		// ...and the checkbox is still the sole tab stop.
		await userEvent.tab();
		await expect.element(screen.getByRole('checkbox')).toHaveFocus();
	});

	// ===========================================================================
	// Interactive — href (invisible anchor pattern)
	// ===========================================================================

	it('renders an invisible anchor when href is provided', async () => {
		const screen = await render(Item, { props: { label: 'Link', href: '/docs' } });
		const anchor = screen.container.querySelector('a');
		expect(anchor).toBeInTheDocument();
		expect(anchor).toHaveAttribute('href', '/docs');
		expect(anchor?.textContent).toContain('Link');
	});

	it('sets target on anchor when provided', async () => {
		const screen = await render(Item, {
			props: { label: 'External', href: 'https://example.com', target: '_blank' }
		});
		const anchor = screen.container.querySelector('a');
		expect(anchor).toHaveAttribute('target', '_blank');
		expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('preserves existing rel tokens when target is blank', async () => {
		const screen = await render(Item, {
			props: {
				label: 'External',
				href: 'https://example.com',
				target: '_blank',
				rel: 'sponsored noopener'
			}
		});
		const anchor = screen.container.querySelector('a');
		expect(anchor).toHaveAttribute('rel', 'sponsored noopener noreferrer');
	});

	it('does not render button or anchor for static items', async () => {
		const screen = await render(Item, { props: { label: 'Static' } });
		expect(screen.container.querySelector('button')).not.toBeInTheDocument();
		expect(screen.container.querySelector('a')).not.toBeInTheDocument();
	});

	// ===========================================================================
	// Disabled state
	// ===========================================================================

	it('applies aria-disabled when isDisabled', async () => {
		const screen = await render(Item, {
			props: { label: 'Disabled', isDisabled: true, 'data-testid': 'item' }
		});
		await expect.element(screen.getByTestId('item')).toHaveAttribute('aria-disabled', 'true');
	});

	it('disables the invisible button when isDisabled', async () => {
		const screen = await render(Item, {
			props: { label: 'Disabled', onclick: () => {}, isDisabled: true }
		});
		const button = screen.container.querySelector('button');
		expect(button).toBeDisabled();
	});

	it('does not fire onClick when disabled item is clicked', async () => {
		const onclick = vi.fn();
		const screen = await render(Item, {
			props: { label: 'Disabled', onclick, isDisabled: true, 'data-testid': 'item' }
		});
		const item = screen.container.querySelector('[data-testid="item"]')!;
		item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(onclick).not.toHaveBeenCalled();
	});

	it('does not set aria-disabled when not disabled', async () => {
		const screen = await render(Item, { props: { label: 'Item', 'data-testid': 'item' } });
		await expect.element(screen.getByTestId('item')).not.toHaveAttribute('aria-disabled');
	});

	// ===========================================================================
	// Selected state
	// ===========================================================================

	it('conveys selection via aria-current on the default div root', async () => {
		// aria-selected is invalid ARIA on a generic div (axe: aria-allowed-attr),
		// so selection is exposed via aria-current, which is valid on any element.
		const screen = await render(Item, {
			props: { label: 'Selected', isSelected: true, 'data-testid': 'item' }
		});
		const item = screen.getByTestId('item');
		await expect.element(item).not.toHaveAttribute('aria-selected');
		await expect.element(item).toHaveAttribute('aria-current', 'true');
	});

	it('applies aria-selected (not aria-current) when the role permits it', async () => {
		const screen = await render(Item, {
			props: { label: 'Selected', isSelected: true, role: 'option', 'data-testid': 'item' }
		});
		const item = screen.getByTestId('item');
		await expect.element(item).toHaveAttribute('aria-selected', 'true');
		// A permitted role uses aria-selected; aria-current would be redundant.
		await expect.element(item).not.toHaveAttribute('aria-current');
	});

	it('falls back to aria-current when the role does not permit aria-selected', async () => {
		const screen = await render(Item, {
			props: { label: 'Selected', isSelected: true, role: 'menuitem', 'data-testid': 'item' }
		});
		const item = screen.getByTestId('item');
		await expect.element(item).not.toHaveAttribute('aria-selected');
		await expect.element(item).toHaveAttribute('aria-current', 'true');
	});

	it('applies neither aria-selected nor aria-current when not selected', async () => {
		const screen = await render(Item, {
			props: { label: 'Not Selected', role: 'option', 'data-testid': 'item' }
		});
		const item = screen.getByTestId('item');
		await expect.element(item).not.toHaveAttribute('aria-selected');
		await expect.element(item).not.toHaveAttribute('aria-current');
	});

	it('lets a consumer-provided aria-current win over the selection default', async () => {
		const screen = await render(Item, {
			props: { label: 'Step', isSelected: true, 'aria-current': 'step', 'data-testid': 'item' }
		});
		await expect.element(screen.getByTestId('item')).toHaveAttribute('aria-current', 'step');
	});

	// ===========================================================================
	// Highlighted state
	// ===========================================================================

	it('renders with isHighlighted without errors', async () => {
		const screen = await render(Item, {
			props: { label: 'Highlighted', isHighlighted: true, 'data-testid': 'item' }
		});
		await expect.element(screen.getByTestId('item')).toBeInTheDocument();
	});

	// ===========================================================================
	// Marker, start, and end slot positions
	// ===========================================================================

	it('marker, startContent, and endContent are siblings to invisible button', async () => {
		const screen = await render(ItemProbe, {
			props: {
				markerId: 'marker',
				startId: 'start',
				endId: 'end',
				rest: { label: 'Item', onclick: () => {} }
			}
		});
		const button = screen.container.querySelector('button');
		const root = screen.container.firstElementChild!;
		expect(root.querySelector('[data-testid="marker"]')).toBeInTheDocument();
		expect(root.querySelector('[data-testid="start"]')).toBeInTheDocument();
		expect(root.querySelector('[data-testid="end"]')).toBeInTheDocument();
		expect(button?.querySelector('[data-testid="marker"]')).not.toBeInTheDocument();
		expect(button?.querySelector('[data-testid="start"]')).not.toBeInTheDocument();
		expect(button?.querySelector('[data-testid="end"]')).not.toBeInTheDocument();
	});

	// ===========================================================================
	// Density variants
	// ===========================================================================

	it('renders with balanced density by default', async () => {
		const screen = await render(Item, { props: { label: 'Item', 'data-testid': 'item' } });
		const item = screen.container.querySelector('[data-testid="item"]')!;
		expect(item).toBeInTheDocument();
		expect(item.className).toContain('balanced');
	});

	it('renders with compact density', async () => {
		const screen = await render(Item, {
			props: { label: 'Item', density: 'compact', 'data-testid': 'item' }
		});
		await expect.element(screen.getByTestId('item')).toBeInTheDocument();
	});

	it('renders with spacious density', async () => {
		const screen = await render(Item, {
			props: { label: 'Item', density: 'spacious', 'data-testid': 'item' }
		});
		const item = screen.container.querySelector('[data-testid="item"]')!;
		expect(item).toBeInTheDocument();
		expect(item.className).toContain('spacious');
	});

	// ===========================================================================
	// Alignment
	// ===========================================================================

	it('renders with center alignment by default', async () => {
		const screen = await render(Item, { props: { label: 'Item', 'data-testid': 'item' } });
		await expect.element(screen.getByTestId('item')).toBeInTheDocument();
	});

	it('renders with start alignment', async () => {
		const screen = await render(Item, {
			props: { label: 'Item', align: 'start', 'data-testid': 'item' }
		});
		await expect.element(screen.getByTestId('item')).toBeInTheDocument();
	});

	// ===========================================================================
	// Description rendering
	// ===========================================================================

	it('does not render description when not provided', async () => {
		const screen = await render(Item, { props: { label: 'Label Only' } });
		await expect.element(screen.getByText('Label Only', { exact: true })).toBeInTheDocument();
		expect(screen.getByText('undefined', { exact: true }).query()).toBeNull();
	});

	it('accepts ReactNode as description', async () => {
		const screen = await render(ItemProbe, {
			props: { richDescription: true, rest: { label: 'Item' } }
		});
		await expect.element(screen.getByText('Rich', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('description', { exact: true })).toBeInTheDocument();
	});

	it('accepts ReactNode as label', async () => {
		const screen = await render(ItemProbe, { props: { richLabel: true } });
		await expect.element(screen.getByText('Alice', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText(/commented/)).toBeInTheDocument();
	});
});
