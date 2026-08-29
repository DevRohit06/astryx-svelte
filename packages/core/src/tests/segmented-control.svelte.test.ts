import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import SegmentedControlProbe from './fixtures/segmented-control-probe.svelte';
import { cssIn, forcedColorsCssIn } from './forced-colors.js';

/**
 * Astryx's `SegmentedControl/SegmentedControl.test.tsx`, ported case for case.
 *
 * The file recount is the contract: upstream has **43** `it` cases at the
 * **0.5.0** pin, spread over nine describe blocks — 12 `SegmentedControl`, 9
 * `keyboard navigation` (a nested "#3597 pure focus move" block of 3 plus 6),
 * 14 `disabled state` (6 direct plus a nested `disabledMessage` of 8), 3
 * `data-testid forwarding`, 2 `onClick composition`, 2 `container handler
 * forwarding`, 1 `forced colors`. **42 are ported here.**
 *
 * **The one that is not here arrived at 0.5.0**: `fill items can shrink and
 * truncate long labels`, in the top-level `SegmentedControl` block. It
 * transcribes unchanged. (This header read "**42** … at 0.3.0 … All 42 are
 * ported here; none dropped", true at that pin.)
 *
 * Because `<SegmentedControl>` takes its `SegmentedControlItem` children as a snippet,
 * every case renders through `segmented-control-probe.svelte`, which describes the
 * items as an array and forwards every group prop; see that file. Selection is
 * controlled exactly as upstream's: `value` is a plain prop and the test's `onChange`
 * is a spy that does not commit, so a click fires `onChange` while `value` stays put.
 *
 * Upstream's `beforeEach` (`:20-43`) shims `showPopover`/`hidePopover` and
 * `matches(':popover-open')` because jsdom implements none of the Popover API, and
 * reflects the open state as an invented `popover-open` *attribute* its assertions
 * read. The browser project needs none of it: Chromium has the real Popover API, so
 * open state is read with the real `matches(':popover-open')` — the same drop the
 * Tooltip / RadioList ports recorded.
 *
 * Restated deliveries (each noted at its case), assertions unchanged:
 * - `does not call onChange when group is disabled` / `disables individual items` /
 *   `blocks selection while focusable-disabled` — the segment is aria-disabled (and,
 *   for the whole-group case, the container carries `pointer-events: none`). Playwright's
 *   actionability refuses to `userEvent.click` such an element, which would assert the
 *   heuristic rather than the component. The click is delivered as a native `.click()`
 *   — upstream's `fireEvent.click`, a plain trusted-free DOM dispatch that still runs
 *   `handleClick` and hits the component's guard.
 * - the two `#3597` tab-through cases — a synthetic Tab into a roving-tabindex group does
 *   not reliably settle onto a radio in Playwright, so focus is moved from the outside
 *   button onto the group's tab stop, giving `focusin` the outside `relatedTarget` the
 *   pure-focus-move branch reads. onChange must stay silent — the property upstream asserts.
 * - `shows the reason tooltip on keyboard focus` — as the RadioList port: a Tab enters
 *   keyboard modality, then focus is placed on the still-focusable selected segment so
 *   the container's `focusin` gate treats it as keyboard-originated.
 */

const noop = (): void => {};

/** The tooltip layer, present (but `display:none`) whenever a reason renders. */
function tooltipIn(container: HTMLElement): HTMLElement | null {
	const el = container.querySelector('[role="tooltip"]');
	return el instanceof HTMLElement ? el : null;
}

describe('SegmentedControl', () => {
	it('renders a radiogroup with radio buttons', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: noop,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' }
				]
			}
		});

		await expect.element(screen.getByRole('radiogroup')).toBeInTheDocument();
		await expect.element(screen.getByRole('radiogroup')).toHaveAttribute('aria-label', 'View mode');
		await expect
			.element(screen.getByRole('radio', { name: 'Grid', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('radio', { name: 'List', exact: true }))
			.toBeInTheDocument();
	});

	it('marks selected item with aria-checked', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: noop,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' }
				]
			}
		});

		await expect
			.element(screen.getByRole('radio', { name: 'Grid', exact: true }))
			.toHaveAttribute('aria-checked', 'true');
		await expect
			.element(screen.getByRole('radio', { name: 'List', exact: true }))
			.toHaveAttribute('aria-checked', 'false');
	});

	it('calls onChange when an item is clicked', async () => {
		const handleChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: handleChange,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' }
				]
			}
		});

		await userEvent.click(screen.getByRole('radio', { name: 'List', exact: true }));
		expect(handleChange).toHaveBeenCalledWith('list');
	});

	it('does not call onChange when clicking the already-selected item', async () => {
		const handleChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: handleChange,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' }
				]
			}
		});

		await userEvent.click(screen.getByRole('radio', { name: 'Grid', exact: true }));
		expect(handleChange).not.toHaveBeenCalled();
	});

	it('updates aria-checked when value changes', async () => {
		const items = [
			{ value: 'grid', label: 'Grid' },
			{ value: 'list', label: 'List' }
		];
		const screen = await render(SegmentedControlProbe, {
			props: { label: 'View mode', value: 'grid', onChange: noop, items }
		});

		await expect
			.element(screen.getByRole('radio', { name: 'Grid', exact: true }))
			.toHaveAttribute('aria-checked', 'true');

		// Upstream's `rerender` with a new controlled `value`.
		await screen.rerender({ label: 'View mode', value: 'list', onChange: noop, items });

		await expect
			.element(screen.getByRole('radio', { name: 'Grid', exact: true }))
			.toHaveAttribute('aria-checked', 'false');
		await expect
			.element(screen.getByRole('radio', { name: 'List', exact: true }))
			.toHaveAttribute('aria-checked', 'true');
	});

	it('renders with different sizes', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: noop,
				size: 'sm',
				items: [{ value: 'grid', label: 'Grid' }]
			}
		});
		await expect
			.element(screen.getByRole('radio', { name: 'Grid', exact: true }))
			.toBeInTheDocument();

		await screen.rerender({
			label: 'View mode',
			value: 'grid',
			onChange: noop,
			size: 'lg',
			items: [{ value: 'grid', label: 'Grid' }]
		});
		await expect
			.element(screen.getByRole('radio', { name: 'Grid', exact: true }))
			.toBeInTheDocument();
	});

	it('renders item with icon', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: noop,
				items: [{ value: 'grid', label: 'Grid', icon: true }]
			}
		});

		await expect.element(screen.getByTestId('icon')).toBeInTheDocument();
	});

	it('renders icon-only item with aria-label from label prop', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: noop,
				items: [{ value: 'grid', label: 'Grid view', isLabelHidden: true, icon: true }]
			}
		});

		const radio = screen.getByRole('radio', { name: 'Grid view', exact: true });
		await expect.element(radio).toBeInTheDocument();
		await expect.element(radio).toHaveAttribute('aria-label', 'Grid view');
		// Label text should not be visible.
		expect(screen.container.textContent).not.toContain('Grid view');
	});

	it('uses roving tabindex — selected item has tabIndex 0, others -1', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'list',
				onChange: noop,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' },
					{ value: 'table', label: 'Table' }
				]
			}
		});

		await expect
			.element(screen.getByRole('radio', { name: 'Grid', exact: true }))
			.toHaveAttribute('tabindex', '-1');
		await expect
			.element(screen.getByRole('radio', { name: 'List', exact: true }))
			.toHaveAttribute('tabindex', '0');
		await expect
			.element(screen.getByRole('radio', { name: 'Table', exact: true }))
			.toHaveAttribute('tabindex', '-1');
	});

	it('keeps a tab stop when the value matches no item (tab-stop repair)', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'nonexistent',
				onChange: noop,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' },
					{ value: 'table', label: 'Table' }
				]
			}
		});

		// No item is selected, but the group must remain Tab-reachable: the first
		// enabled radio is promoted to tabIndex=0 (by `useListFocus`'s repair).
		await expect
			.element(screen.getByRole('radio', { name: 'Grid', exact: true }))
			.toHaveAttribute('tabindex', '0');
	});

	it('promotes the first enabled item when the value matches no item and the first is disabled', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'nonexistent',
				onChange: noop,
				items: [
					{ value: 'grid', label: 'Grid', isDisabled: true },
					{ value: 'list', label: 'List' },
					{ value: 'table', label: 'Table' }
				]
			}
		});

		// The disabled first item is skipped; the first ENABLED radio is tabbable.
		await expect
			.element(screen.getByRole('radio', { name: 'List', exact: true }))
			.toHaveAttribute('tabindex', '0');
	});
});

describe('SegmentedControl keyboard navigation', () => {
	describe('tab-through is a pure focus move (#3597)', () => {
		it('does not fire onChange when tabbing in with an unmatched value', async () => {
			const onChange = vi.fn();
			const screen = await render(SegmentedControlProbe, {
				props: {
					label: 'View',
					value: 'archived',
					onChange,
					before: true,
					items: [
						{ value: 'grid', label: 'Grid' },
						{ value: 'list', label: 'List' }
					]
				}
			});
			const before = screen.getByText('before', { exact: true }).element() as HTMLElement;
			// Restated delivery (see file header): the tab stop is the promoted first
			// enabled radio; moving focus onto it from the outside button gives `focusin`
			// the outside `relatedTarget` a Tab entry would, exercising the pure-focus-move
			// branch. onChange must stay silent.
			before.focus();
			(screen.getByRole('radio', { name: 'Grid', exact: true }).element() as HTMLElement).focus();
			expect(onChange).not.toHaveBeenCalled();
		});

		it('does not fire onChange when tabbing in while the selected item is disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(SegmentedControlProbe, {
				props: {
					label: 'View',
					value: 'list',
					onChange,
					before: true,
					items: [
						{ value: 'grid', label: 'Grid' },
						{ value: 'list', label: 'List', isDisabled: true }
					]
				}
			});
			const before = screen.getByText('before', { exact: true }).element() as HTMLElement;
			// The selected 'list' is disabled, so the tab stop is the first enabled radio
			// (Grid); entering it from outside stays a pure focus move.
			before.focus();
			(screen.getByRole('radio', { name: 'Grid', exact: true }).element() as HTMLElement).focus();
			expect(onChange).not.toHaveBeenCalled();
		});

		it('still selects on arrow-key navigation within the group', async () => {
			const onChange = vi.fn();
			const screen = await render(SegmentedControlProbe, {
				props: {
					label: 'View',
					value: 'grid',
					onChange,
					items: [
						{ value: 'grid', label: 'Grid' },
						{ value: 'list', label: 'List' }
					]
				}
			});
			(screen.getByRole('radio', { name: 'Grid', exact: true }).element() as HTMLElement).focus();
			await userEvent.keyboard('{ArrowRight}');
			expect(onChange).toHaveBeenCalledWith('list');
		});
	});

	it('navigates with ArrowRight and selects', async () => {
		const handleChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: handleChange,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' },
					{ value: 'table', label: 'Table' }
				]
			}
		});

		(screen.getByRole('radio', { name: 'Grid', exact: true }).element() as HTMLElement).focus();
		await userEvent.keyboard('{ArrowRight}');

		expect(handleChange).toHaveBeenCalledWith('list');
		await expect.element(screen.getByRole('radio', { name: 'List', exact: true })).toHaveFocus();
	});

	it('navigates with ArrowLeft and selects', async () => {
		const handleChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'list',
				onChange: handleChange,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' },
					{ value: 'table', label: 'Table' }
				]
			}
		});

		(screen.getByRole('radio', { name: 'List', exact: true }).element() as HTMLElement).focus();
		await userEvent.keyboard('{ArrowLeft}');

		expect(handleChange).toHaveBeenCalledWith('grid');
		await expect.element(screen.getByRole('radio', { name: 'Grid', exact: true })).toHaveFocus();
	});

	it('wraps around from last to first with ArrowRight', async () => {
		const handleChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'table',
				onChange: handleChange,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' },
					{ value: 'table', label: 'Table' }
				]
			}
		});

		(screen.getByRole('radio', { name: 'Table', exact: true }).element() as HTMLElement).focus();
		await userEvent.keyboard('{ArrowRight}');

		expect(handleChange).toHaveBeenCalledWith('grid');
		await expect.element(screen.getByRole('radio', { name: 'Grid', exact: true })).toHaveFocus();
	});

	it('wraps around from first to last with ArrowLeft', async () => {
		const handleChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: handleChange,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' },
					{ value: 'table', label: 'Table' }
				]
			}
		});

		(screen.getByRole('radio', { name: 'Grid', exact: true }).element() as HTMLElement).focus();
		await userEvent.keyboard('{ArrowLeft}');

		expect(handleChange).toHaveBeenCalledWith('table');
		await expect.element(screen.getByRole('radio', { name: 'Table', exact: true })).toHaveFocus();
	});

	it('Home key focuses first item', async () => {
		const handleChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'table',
				onChange: handleChange,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' },
					{ value: 'table', label: 'Table' }
				]
			}
		});

		(screen.getByRole('radio', { name: 'Table', exact: true }).element() as HTMLElement).focus();
		await userEvent.keyboard('{Home}');

		expect(handleChange).toHaveBeenCalledWith('grid');
		await expect.element(screen.getByRole('radio', { name: 'Grid', exact: true })).toHaveFocus();
	});

	it('End key focuses last item', async () => {
		const handleChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: handleChange,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' },
					{ value: 'table', label: 'Table' }
				]
			}
		});

		(screen.getByRole('radio', { name: 'Grid', exact: true }).element() as HTMLElement).focus();
		await userEvent.keyboard('{End}');

		expect(handleChange).toHaveBeenCalledWith('table');
		await expect.element(screen.getByRole('radio', { name: 'Table', exact: true })).toHaveFocus();
	});
});

describe('SegmentedControl disabled state', () => {
	it('marks entire group as disabled', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: noop,
				isDisabled: true,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' }
				]
			}
		});

		await expect.element(screen.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true');
	});

	it('removes the tab stop from the selected item when the group is disabled (navigation-13)', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: noop,
				isDisabled: true,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' }
				]
			}
		});
		// Selected segment must not be a focusable-but-dead tab stop when disabled.
		const selected = screen.getByRole('radio', { name: 'Grid', exact: true });
		await expect.element(selected).toHaveAttribute('tabindex', '-1');
		await expect.element(selected).toHaveAttribute('aria-disabled', 'true');
		// No enabled segment is tabbable either.
		await expect
			.element(screen.getByRole('radio', { name: 'List', exact: true }))
			.toHaveAttribute('tabindex', '-1');
	});

	it('removes the tab stop from an individually disabled selected item', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: noop,
				items: [
					{ value: 'grid', label: 'Grid', isDisabled: true },
					{ value: 'list', label: 'List' }
				]
			}
		});
		await expect
			.element(screen.getByRole('radio', { name: 'Grid', exact: true }))
			.toHaveAttribute('tabindex', '-1');
	});

	it('does not call onChange when group is disabled', async () => {
		const handleChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: handleChange,
				isDisabled: true,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' }
				]
			}
		});

		// Restated delivery (see file header): the disabled group carries
		// `pointer-events: none`, so a native `.click()` stands in for
		// `userEvent.click` — the component's guard blocks selection all the same.
		(screen.getByRole('radio', { name: 'List', exact: true }).element() as HTMLElement).click();
		expect(handleChange).not.toHaveBeenCalled();
	});

	it('disables individual items', async () => {
		const handleChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: handleChange,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List', isDisabled: true }
				]
			}
		});

		await expect
			.element(screen.getByRole('radio', { name: 'List', exact: true }))
			.toHaveAttribute('aria-disabled', 'true');

		// Restated delivery (see file header): the aria-disabled segment is not
		// actionable to Playwright; a native `.click()` reaches the blocked guard.
		(screen.getByRole('radio', { name: 'List', exact: true }).element() as HTMLElement).click();
		expect(handleChange).not.toHaveBeenCalled();
	});

	it('skips disabled items during keyboard navigation', async () => {
		const handleChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: handleChange,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List', isDisabled: true },
					{ value: 'table', label: 'Table' }
				]
			}
		});

		(screen.getByRole('radio', { name: 'Grid', exact: true }).element() as HTMLElement).focus();
		await userEvent.keyboard('{ArrowRight}');

		// Should skip disabled "List" and go to "Table".
		expect(handleChange).toHaveBeenCalledWith('table');
		await expect.element(screen.getByRole('radio', { name: 'Table', exact: true })).toHaveFocus();
	});

	describe('disabledMessage', () => {
		async function renderControl(onChange: (v: string) => void = noop) {
			return render(SegmentedControlProbe, {
				props: {
					label: 'View mode',
					value: 'grid',
					onChange,
					isDisabled: true,
					disabledMessage: 'Choose a project to switch views',
					items: [
						{ value: 'grid', label: 'Grid' },
						{ value: 'list', label: 'List' }
					]
				}
			});
		}

		it('shows the reason tooltip on hover when the control is disabled with a reason', async () => {
			const screen = await renderControl();
			const tooltip = tooltipIn(screen.container)!;
			expect(tooltip).toHaveTextContent('Choose a project to switch views');
			const group = screen.getByRole('radiogroup').element();
			// `mouseenter`/`mouseleave` do not bubble; the listener sits on the group.
			group.dispatchEvent(new MouseEvent('mouseenter'));
			await vi.waitFor(() => {
				// `:popover-open` rather than upstream's invented `popover-open` attribute.
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
			group.dispatchEvent(new MouseEvent('mouseleave'));
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(false);
			});
		});

		it('shows the reason tooltip on keyboard focus', async () => {
			const screen = await renderControl();
			const tooltip = tooltipIn(screen.container)!;
			// Restated delivery (see file header): a Tab enters keyboard modality, then
			// focus is placed on the still-focusable selected segment.
			await userEvent.tab();
			(screen.getByRole('radio', { name: 'Grid', exact: true }).element() as HTMLElement).focus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(SegmentedControlProbe, {
				props: {
					label: 'View mode',
					value: 'grid',
					onChange: noop,
					disabledMessage: 'Choose a project to switch views',
					items: [{ value: 'grid', label: 'Grid' }]
				}
			});
			expect(tooltipIn(screen.container)).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(SegmentedControlProbe, {
				props: {
					label: 'View mode',
					value: 'grid',
					onChange: noop,
					isDisabled: true,
					items: [{ value: 'grid', label: 'Grid' }]
				}
			});
			expect(tooltipIn(screen.container)).toBeNull();
		});

		it('keeps the selected segment focusable when a reason is provided', async () => {
			const screen = await renderControl();
			const selected = screen.getByRole('radio', { name: 'Grid', exact: true });
			await expect.element(selected).toHaveAttribute('aria-disabled', 'true');
			await expect.element(selected).toHaveAttribute('tabindex', '0');
		});

		it('links the reason tooltip from the group via aria-describedby', async () => {
			const screen = await renderControl();
			const group = screen.getByRole('radiogroup').element();
			const tooltip = tooltipIn(screen.container)!;
			expect(group.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks selection while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await renderControl(onChange);
			// Restated delivery (see file header): the segment is focusable-disabled
			// (aria-disabled, not native); a native `.click()` is upstream's
			// `fireEvent.click`, running the component's blocked guard.
			(screen.getByRole('radio', { name: 'List', exact: true }).element() as HTMLElement).click();
			expect(onChange).not.toHaveBeenCalled();
		});

		it('drops all segments from the tab order when disabled without a reason', async () => {
			const screen = await render(SegmentedControlProbe, {
				props: {
					label: 'View mode',
					value: 'grid',
					onChange: noop,
					isDisabled: true,
					items: [
						{ value: 'grid', label: 'Grid' },
						{ value: 'list', label: 'List' }
					]
				}
			});
			for (const radio of screen.container.querySelectorAll('[role="radio"]')) {
				expect(radio).toHaveAttribute('tabindex', '-1');
			}
		});
	});
});

describe('SegmentedControl data-testid forwarding', () => {
	it('forwards data-testid to the radiogroup', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: noop,
				'data-testid': 'view-toggle',
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' }
				]
			}
		});

		expect(screen.getByTestId('view-toggle').element()).toBe(
			screen.getByRole('radiogroup').element()
		);
	});

	it('forwards data-testid to an individual item button', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: noop,
				items: [
					{ value: 'grid', label: 'Grid', 'data-testid': 'opt-grid' },
					{ value: 'list', label: 'List', 'data-testid': 'opt-list' }
				]
			}
		});

		expect(screen.getByTestId('opt-grid').element()).toBe(
			screen.getByRole('radio', { name: 'Grid', exact: true }).element()
		);
		expect(screen.getByTestId('opt-list').element()).toBe(
			screen.getByRole('radio', { name: 'List', exact: true }).element()
		);
	});

	it('does not let a forwarded prop override the computed role', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				// A consumer-supplied role must not clobber the component's own
				// radiogroup role (the computed role is applied after {...rest}).
				label: 'View mode',
				value: 'grid',
				onChange: noop,
				role: 'tablist',
				'data-testid': 'view-toggle',
				items: [{ value: 'grid', label: 'Grid' }]
			}
		});

		await expect.element(screen.getByTestId('view-toggle')).toHaveAttribute('role', 'radiogroup');
	});
});

describe('SegmentedControlItem onClick composition', () => {
	it('calls a consumer onClick in addition to selecting the item', async () => {
		const onChange = vi.fn();
		const onClick = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange,
				items: [{ value: 'list', label: 'List', onclick: onClick }]
			}
		});

		// Upstream's `fireEvent.click`, a plain DOM dispatch.
		(screen.getByRole('radio', { name: 'List', exact: true }).element() as HTMLElement).click();

		expect(onClick).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith('list');
	});

	it('lets a consumer onClick opt out of selection via preventDefault', async () => {
		const onChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange,
				items: [{ value: 'list', label: 'List', onclick: (e: MouseEvent) => e.preventDefault() }]
			}
		});

		(screen.getByRole('radio', { name: 'List', exact: true }).element() as HTMLElement).click();

		expect(onChange).not.toHaveBeenCalled();
	});
});

describe('SegmentedControl container handler forwarding', () => {
	it('forwards a consumer onKeyDown while keeping arrow-key navigation', async () => {
		const onKeyDown = vi.fn();
		const onChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange,
				onkeydown: onKeyDown,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' }
				]
			}
		});

		(screen.getByRole('radio', { name: 'Grid', exact: true }).element() as HTMLElement).focus();
		await userEvent.keyboard('{ArrowRight}');

		expect(onKeyDown).toHaveBeenCalled();
		// Built-in navigation still ran.
		expect(onChange).toHaveBeenCalledWith('list');
	});

	it('lets a consumer onKeyDown opt out of built-in navigation via preventDefault', async () => {
		const onChange = vi.fn();
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange,
				onkeydown: (e: KeyboardEvent) => e.preventDefault(),
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' }
				]
			}
		});

		(screen.getByRole('radio', { name: 'Grid', exact: true }).element() as HTMLElement).focus();
		await userEvent.keyboard('{ArrowRight}');

		expect(onChange).not.toHaveBeenCalled();
	});
});

// Neither jsdom nor a Chromium test page can emulate forced-colors rendering, so
// this asserts that the compiled output includes the forced-colors rules; visual
// behavior needs manual verification under Windows High Contrast. See
// `forced-colors.ts` for why the scan is scoped to the rendered subtree here and
// global upstream.
describe('forced colors (WCAG 1.4.11)', () => {
	it('compiles forced-colors overrides so the selected segment survives Windows High Contrast', async () => {
		const screen = await render(SegmentedControlProbe, {
			props: {
				label: 'View mode',
				value: 'grid',
				onChange: noop,
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' }
				]
			}
		});
		const css = forcedColorsCssIn(screen.container);
		// The painted surface fill and shadow are stripped; Highlight/
		// HighlightText marks the selected segment.
		expect(css).toContain('background-color: highlight;');
		expect(css).toContain('color: highlighttext;');
		// The segment is a <button>; without opting out of UA remapping it keeps
		// the native ButtonFace surface and ignores the Highlight fill, leaving
		// HighlightText text on a white surface. forced-color-adjust: none makes
		// both render as authored.
		expect(cssIn(screen.container)).toContain('forced-color-adjust: none;');
	});
});
