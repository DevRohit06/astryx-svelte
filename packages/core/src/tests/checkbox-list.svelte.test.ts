import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import CheckboxListFixture from './fixtures/checkbox-list-fixture.svelte';

/**
 * Astryx's `CheckboxList/CheckboxList.test.tsx` at the 0.5.0 pin, ported case for case
 * — **51 upstream cases, 51 here**. Nothing dropped, nothing added.
 *
 * By block: `CheckboxList` 25 (20, plus the nested five-case
 * `single tab stop per option` block 0.3.0 added), `CheckboxListItem standalone
 * mode` 6, `CheckboxListItem accessible name` 3, `CheckboxListItem ARIA props`
 * 17 (the last nine a nested `disabledMessage` block).
 *
 * **The previous header was wrong.** It claimed "43 upstream cases … 43 here"
 * against 0.2.0, where upstream in fact had 46: the whole
 * `CheckboxListItem accessible name` block was missing here, undocumented. It is
 * restored below (re-derived by enumerating both tags' sources, not from the
 * header).
 *
 * Because `<CheckboxList>` takes its `<CheckboxListItem>` children as a snippet,
 * every case renders through `checkbox-list-fixture.svelte`, which describes the
 * items as an array and forwards every group prop; `standalone: true` swaps the
 * group for the plain `<List>` upstream's standalone cases wrap the items in.
 * See that file for why `value` is *not* committed on change.
 *
 * Upstream's `beforeEach` (`:27-50`) shims `showPopover`/`hidePopover` and
 * overrides `matches(':popover-open')` because jsdom implements none of the
 * Popover API, reflecting the open state as an invented `popover-open`
 * *attribute* the assertions then read. The browser project needs none of it:
 * Chromium has the real Popover API, so the open state is read with
 * `matches(':popover-open')` — the same drop `dropdown-menu`, `Switch` and
 * `RadioList` already recorded. Upstream's `h = {hidden: true}` survives as a
 * container query for the tooltip (a closed popover is genuinely `display:none`
 * here) and as `{ includeHidden: true }` for the decorative spinner, which lives
 * inside the checkbox's `aria-hidden` visual box.
 *
 * Restated, each noted at the case:
 * - `throws when item has no value prop inside collection-mode CheckboxList` —
 *   `render` is async in vitest-browser-svelte v3, so the synchronous
 *   `expect(() => …).toThrow(msg)` becomes `rejects.toThrow(msg)`. The message is
 *   upstream's, verbatim.
 * - `does not call onChange when group is disabled`, `does not toggle when
 *   item-level isLoading is set`, `blocks toggling while focusable-disabled` and
 *   the pending-`changeAction` case use a native `.click()` where upstream uses
 *   `fireEvent.click` — the same untrusted dispatch, which Playwright's
 *   actionability check would refuse for a disabled or `aria-disabled` control.
 * - `keeps checkboxes focusable via aria-disabled when a reason is provided` —
 *   vitest-browser's `toBeDisabled` is Playwright's ARIA computation, which
 *   counts `aria-disabled="true"` as disabled; upstream's `not.toBeDisabled()` is
 *   jest-dom's native-only reading. The native question is asked directly.
 * - `shows the reason tooltip on keyboard focus` — Playwright's synthetic Tab
 *   does not settle onto a `<input type="checkbox">` in this environment, so a
 *   Tab enters keyboard modality and focus is then placed on the first checkbox,
 *   which `:focus-visible` treats as keyboard-originated — the `focusin` gate the
 *   component reads. Same finding as the `Switch` and `RadioList` ports.
 * - upstream's `within(item)` becomes a scoped DOM query on the same row.
 */

const noop = (): void => {};

/** The native checkboxes of the list, in document order. */
function checkboxesIn(container: HTMLElement): HTMLInputElement[] {
	return Array.from(container.querySelectorAll('input[type="checkbox"]'));
}

/** The list rows — `<li>` inside the `<ul>`, i.e. `role="listitem"`. */
function itemsIn(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll('li'));
}

/** The tooltip layer, present (but `display:none`) whenever a reason renders. */
function tooltipIn(container: HTMLElement): HTMLElement | null {
	const el = container.querySelector('[role="tooltip"]');
	return el instanceof HTMLElement ? el : null;
}

/**
 * The row's own label `<span>` — the pointer-only click surface outside the
 * checkbox. Upstream writes `screen.getByText(text, {selector: 'span'})`;
 * vitest-browser's `getByText` has no selector option, and the same text also
 * lives in the checkbox's visually hidden `<label>`, so the row's leaf span is
 * picked out directly.
 */
function labelSpanIn(container: HTMLElement, text: string): HTMLElement {
	const span = Array.from(container.querySelectorAll('span')).find(
		(el) => el.textContent === text && el.querySelector('span') == null
	);
	if (!span) {
		throw new Error(`No row label <span> with text "${text}"`);
	}
	return span;
}

describe('CheckboxList', () => {
	it('renders with label', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: [],
				onChange: noop,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect.element(screen.getByText('Preferences')).toBeInTheDocument();
	});

	it('wraps items in a group named by the label (forms audit: group role)', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: [],
				onChange: noop,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		// The checkboxes are wrapped in a role="group" whose accessible name comes
		// from the field label (via aria-labelledby). The label is rendered as a
		// <span> (not a literal <label>, which can't name a group) with no
		// orphaned htmlFor.
		const group = screen.getByRole('group', { name: 'Preferences' });
		await expect.element(group).toBeInTheDocument();
		const label = screen.getByText('Preferences').element();
		expect(label.tagName).toBe('SPAN');
		expect(label.closest('label')).toBeNull();
		expect(label).not.toHaveAttribute('for');
		expect(group.element().getAttribute('aria-labelledby')).toBe(label.id);
	});

	it('renders checkbox items', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: [],
				onChange: noop,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' },
					{ label: 'Option C', value: 'c' }
				]
			}
		});
		expect(checkboxesIn(screen.container)).toHaveLength(3);
	});

	it('checks the correct items based on value prop', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: ['a', 'c'],
				onChange: noop,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' },
					{ label: 'Option C', value: 'c' }
				]
			}
		});
		const checkboxes = checkboxesIn(screen.container);
		expect(checkboxes[0]).toBeChecked();
		expect(checkboxes[1]).not.toBeChecked();
		expect(checkboxes[2]).toBeChecked();
	});

	it('calls onChange with added value when checking an item', async () => {
		const handleChange = vi.fn();
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: ['a'],
				onChange: handleChange,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' }
				]
			}
		});

		await userEvent.click(screen.getByRole('checkbox', { name: 'Option B' }));
		expect(handleChange).toHaveBeenCalledTimes(1);
		// Appended, never sorted.
		expect(handleChange).toHaveBeenCalledWith(['a', 'b']);
	});

	it('calls onChange with removed value when unchecking an item', async () => {
		const handleChange = vi.fn();
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: ['a', 'b'],
				onChange: handleChange,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' }
				]
			}
		});

		await userEvent.click(screen.getByRole('checkbox', { name: 'Option A' }));
		expect(handleChange).toHaveBeenCalledWith(['b']);
	});

	it('fires a consumer onClick on an item in addition to toggling', async () => {
		const handleChange = vi.fn();
		const handleClick = vi.fn();
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: ['a'],
				onChange: handleChange,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b', onclick: handleClick }
				]
			}
		});

		// The row is a pointer-only click surface (no invisible row button — the
		// checkbox is the option's only tab stop). Click the row's label area,
		// where the composed onClick fires — not the inner checkbox.
		expect(screen.getByRole('button', { name: 'Option B' }).query()).toBeNull();
		// The text also exists in the checkbox's visually hidden <label>; target
		// the row's label <span> to click the row surface.
		await userEvent.click(labelSpanIn(screen.container, 'Option B'));

		expect(handleClick).toHaveBeenCalledTimes(1);
		expect(handleChange).toHaveBeenCalledWith(['a', 'b']);
	});

	describe('single tab stop per option (WCAG 4.1.2 / APG checkbox pattern)', () => {
		it('renders exactly one focusable control per option — the checkbox, no row button', async () => {
			const screen = await render(CheckboxListFixture, {
				props: {
					label: 'Preferences',
					value: ['a'],
					onChange: noop,
					items: [
						{ label: 'Option A', value: 'a' },
						{ label: 'Option B', value: 'b' }
					]
				}
			});
			// No invisible whole-row button duplicating the checkbox's action.
			expect(screen.container.querySelector('button')).toBeNull();
			for (const item of itemsIn(screen.container)) {
				const focusables = item.querySelectorAll(
					'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				);
				expect(focusables).toHaveLength(1);
				expect(focusables[0]).toBe(item.querySelector('input[type="checkbox"]'));
			}
		});

		it('Tab moves directly from one option checkbox to the next', async () => {
			const screen = await render(CheckboxListFixture, {
				props: {
					label: 'Preferences',
					value: [],
					onChange: noop,
					items: [
						{ label: 'Option A', value: 'a' },
						{ label: 'Option B', value: 'b' }
					]
				}
			});
			const [first, second] = checkboxesIn(screen.container);
			await userEvent.tab();
			expect(document.activeElement).toBe(first);
			await userEvent.tab();
			expect(document.activeElement).toBe(second);
			// No further tab stop inside the list (the row itself is not focusable).
			await userEvent.tab();
			expect(document.activeElement).toBe(document.body);
		});

		it('clicking the row surface (outside the checkbox) still toggles', async () => {
			const handleChange = vi.fn();
			const screen = await render(CheckboxListFixture, {
				props: {
					label: 'Preferences',
					value: ['a'],
					onChange: handleChange,
					items: [
						{ label: 'Option A', value: 'a' },
						{ label: 'Option B', value: 'b' }
					]
				}
			});
			// The text also exists in the checkbox's visually hidden <label>;
			// target the row's label <span> to click the row surface.
			await userEvent.click(labelSpanIn(screen.container, 'Option B'));
			expect(handleChange).toHaveBeenCalledTimes(1);
			expect(handleChange).toHaveBeenCalledWith(['a', 'b']);
		});

		it('toggles with Space on the focused checkbox, which reports checked state', async () => {
			const handleChange = vi.fn();
			const screen = await render(CheckboxListFixture, {
				props: {
					label: 'Preferences',
					value: ['a'],
					onChange: handleChange,
					items: [
						{ label: 'Option A', value: 'a' },
						{ label: 'Option B', value: 'b' }
					]
				}
			});
			await userEvent.tab();
			// The focused control is the checkbox itself, so its accessible name
			// and checked state are what assistive tech announces on focus.
			const checkboxA = screen.getByRole('checkbox', { name: 'Option A' });
			await expect.element(checkboxA).toHaveFocus();
			await expect.element(checkboxA).toBeChecked();
			await userEvent.keyboard(' ');
			expect(handleChange).toHaveBeenCalledTimes(1);
			expect(handleChange).toHaveBeenCalledWith([]);
		});

		it('the row itself is not focusable', async () => {
			const screen = await render(CheckboxListFixture, {
				props: {
					label: 'Preferences',
					value: [],
					onChange: noop,
					items: [{ label: 'Option A', value: 'a' }]
				}
			});
			const item = itemsIn(screen.container)[0];
			expect(item).not.toHaveAttribute('tabindex');
			item.focus();
			expect(document.activeElement).not.toBe(item);
		});
	});

	it('disables all checkboxes when group isDisabled is true', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: [],
				onChange: noop,
				isDisabled: true,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' }
				]
			}
		});
		const checkboxes = checkboxesIn(screen.container);
		expect(checkboxes[0]).toBeDisabled();
		expect(checkboxes[1]).toBeDisabled();
	});

	it('does not call onChange when group is disabled', async () => {
		const handleChange = vi.fn();
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: [],
				onChange: handleChange,
				isDisabled: true,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});

		// Upstream uses fireEvent since userEvent correctly blocks a disabled
		// control; the native `.click()` is that same untrusted dispatch.
		checkboxesIn(screen.container)[0].click();
		expect(handleChange).not.toHaveBeenCalled();
	});

	it('disables individual item when item isDisabled is true', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: [],
				onChange: noop,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b', isDisabled: true }
				]
			}
		});
		const checkboxes = checkboxesIn(screen.container);
		expect(checkboxes[0]).not.toBeDisabled();
		expect(checkboxes[1]).toBeDisabled();
	});

	it('throws when item has no value prop inside collection-mode CheckboxList', async () => {
		// Restated shape only (see the file header): `render` is async here, so the
		// synchronous `expect(() => …).toThrow()` becomes `rejects.toThrow()`. The
		// message is upstream's, verbatim.
		await expect(
			render(CheckboxListFixture, {
				props: {
					label: 'Preferences',
					value: [],
					onChange: noop,
					items: [{ label: 'No value' }]
				}
			})
		).rejects.toThrow(
			'CheckboxListItem requires a `value` prop when used inside CheckboxList with a value array.'
		);
	});

	it('renders error status message', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: [],
				onChange: noop,
				status: { type: 'error', message: 'Select at least one' },
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect.element(screen.getByText('Select at least one')).toBeInTheDocument();
	});

	it('renders description on items', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: [],
				onChange: noop,
				items: [{ label: 'Option A', value: 'a', description: 'This is option A' }]
			}
		});
		await expect.element(screen.getByText('This is option A')).toBeInTheDocument();
	});

	it('renders description on the checkbox list group', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				description: 'Choose your preferences',
				value: [],
				onChange: noop,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect.element(screen.getByText('Choose your preferences')).toBeInTheDocument();
	});

	it('supports data-testid on CheckboxList', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: [],
				onChange: noop,
				'data-testid': 'my-checkbox-list',
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect.element(screen.getByTestId('my-checkbox-list')).toBeInTheDocument();
	});

	it('passes spacious density through to checkbox list items', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				density: 'spacious',
				value: [],
				onChange: noop,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		expect(itemsIn(screen.container)[0].className).toContain('spacious');
	});

	it('supports data-testid on CheckboxListItem', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: [],
				onChange: noop,
				items: [{ label: 'Option A', value: 'a', 'data-testid': 'my-checkbox-item' }]
			}
		});
		await expect.element(screen.getByTestId('my-checkbox-item')).toBeInTheDocument();
	});

	it('renders endContent', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: [],
				onChange: noop,
				items: [{ label: 'Option A', value: 'a', end: true }]
			}
		});
		await expect.element(screen.getByTestId('end')).toBeInTheDocument();
	});

	it('does not toggle when clicking interactive endContent', async () => {
		const handleChange = vi.fn();
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: [],
				onChange: handleChange,
				items: [{ label: 'Option A', value: 'a', endButton: true }]
			}
		});

		await userEvent.click(screen.getByTestId('end-btn'));
		expect(handleChange).not.toHaveBeenCalled();
	});

	it('allows standalone items inside CheckboxList without parent value (select-all pattern)', async () => {
		const handleSelectAll = vi.fn();
		const handleCheck = vi.fn();
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Columns',
				hasDividers: true,
				items: [
					{ label: 'Select all', isChecked: false, onCheck: handleSelectAll },
					{ label: 'Name', isChecked: true, onCheck: handleCheck },
					{ label: 'Email', isChecked: false, onCheck: handleCheck }
				]
			}
		});

		// All items render without throwing
		expect(checkboxesIn(screen.container)).toHaveLength(3);

		// Select all triggers its own handler
		await userEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
		expect(handleSelectAll).toHaveBeenCalledWith(true);
		expect(handleCheck).not.toHaveBeenCalled();
	});
});

describe('CheckboxListItem standalone mode', () => {
	it('uses isChecked/onCheck for standalone control', async () => {
		const handleCheck = vi.fn();
		const screen = await render(CheckboxListFixture, {
			props: {
				standalone: true,
				items: [{ label: 'Accept terms', isChecked: false, onCheck: handleCheck }]
			}
		});

		await userEvent.click(screen.getByRole('checkbox', { name: 'Accept terms' }));
		expect(handleCheck).toHaveBeenCalledWith(true);
	});

	it('renders checked state from isChecked prop', async () => {
		const screen = await render(CheckboxListFixture, {
			props: { standalone: true, items: [{ label: 'Checked item', isChecked: true }] }
		});
		await expect.element(screen.getByRole('checkbox')).toBeChecked();
	});

	it('renders unchecked when no isChecked provided', async () => {
		const screen = await render(CheckboxListFixture, {
			props: { standalone: true, items: [{ label: 'Default item' }] }
		});
		await expect.element(screen.getByRole('checkbox')).not.toBeChecked();
	});

	it('does not throw without value prop in standalone mode', async () => {
		// Restated shape only (as in the collection-mode throw case above): `render`
		// is async here, so upstream's synchronous `expect(() => …).not.toThrow()`
		// becomes `resolves`. The question asked is unchanged — rendering a
		// value-less item outside collection mode must not raise.
		await expect(
			render(CheckboxListFixture, {
				props: { standalone: true, items: [{ label: 'No value needed' }] }
			})
		).resolves.toBeDefined();
	});

	it('renders indeterminate state', async () => {
		const screen = await render(CheckboxListFixture, {
			props: { standalone: true, items: [{ label: 'Partial', isChecked: 'indeterminate' }] }
		});
		// The inner native checkbox exposes mixed state via the indeterminate DOM
		// property (not a redundant aria-checked, forms-16). The list row is a
		// plain listitem and must not carry aria-checked (aria-allowed-attr).
		const checkbox = checkboxesIn(screen.container)[0];
		expect(checkbox).toBeInstanceOf(HTMLInputElement);
		expect(checkbox.indeterminate).toBe(true);
		expect(checkbox).not.toHaveAttribute('aria-checked');
	});

	it('calls onCheck with true when clicking indeterminate item', async () => {
		const handleCheck = vi.fn();
		const screen = await render(CheckboxListFixture, {
			props: {
				standalone: true,
				items: [{ label: 'Partial', isChecked: 'indeterminate', onCheck: handleCheck }]
			}
		});

		await userEvent.click(screen.getByRole('checkbox', { name: 'Partial' }));
		expect(handleCheck).toHaveBeenCalledWith(true);
	});
});

describe('CheckboxListItem accessible name', () => {
	it('names the checkbox from a string label', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Preferences',
				value: [],
				onChange: noop,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		await expect.element(screen.getByRole('checkbox', { name: 'Option A' })).toBeInTheDocument();
	});

	it('names the checkbox from aria-label when the label is a snippet', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
		try {
			const screen = await render(CheckboxListFixture, {
				props: {
					label: 'Plans',
					value: [],
					onChange: noop,
					items: [{ label: '', richLabel: true, 'aria-label': 'Pro plan', value: 'pro' }]
				}
			});
			await expect.element(screen.getByRole('checkbox', { name: 'Pro plan' })).toBeInTheDocument();
			// A named checkbox needs no dev guidance.
			expect(warnSpy).not.toHaveBeenCalled();
		} finally {
			warnSpy.mockRestore();
		}
	});

	it('warns once when a snippet label has no aria-label', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
		try {
			const screen = await render(CheckboxListFixture, {
				props: {
					label: 'Plans',
					value: [],
					onChange: noop,
					items: [{ label: '', richLabel: true, value: 'pro' }]
				}
			});
			// Falls back to the generic name, and tells the developer how to fix it.
			await expect.element(screen.getByRole('checkbox', { name: 'Checkbox' })).toBeInTheDocument();
			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(String(warnSpy.mock.calls[0]?.[0])).toContain('aria-label');

			// Warn once per item instance — re-renders don't repeat it. Upstream's
			// `rerender(<CheckboxList value={['pro']}>…)` is the render result's
			// `rerender({ value: ['pro'] })` on the same fixture.
			await screen.rerender({ value: ['pro'] });
			expect(warnSpy).toHaveBeenCalledTimes(1);
		} finally {
			warnSpy.mockRestore();
		}
	});
});

describe('CheckboxListItem ARIA props', () => {
	it('conveys checked state via the inner checkbox, not aria-checked on the listitem', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Prefs',
				value: ['a'],
				onChange: noop,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' }
				]
			}
		});
		// The listitem row must not carry aria-checked (not a valid attribute on
		// role="listitem" — axe: aria-allowed-attr). Checked state is exposed by
		// the inner native checkbox instead.
		const items = itemsIn(screen.container);
		expect(items[0]).not.toHaveAttribute('aria-checked');
		expect(items[1]).not.toHaveAttribute('aria-checked');

		const checkboxes = checkboxesIn(screen.container);
		expect(checkboxes[0]).toBeChecked();
		expect(checkboxes[1]).not.toBeChecked();
	});

	it('does not put aria-checked on the listitem in standalone mode', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				standalone: true,
				items: [
					{ label: 'Done', isChecked: true },
					{ label: 'Todo', isChecked: false }
				]
			}
		});
		const items = itemsIn(screen.container);
		expect(items[0]).not.toHaveAttribute('aria-checked');
		expect(items[1]).not.toHaveAttribute('aria-checked');

		const checkboxes = checkboxesIn(screen.container);
		expect(checkboxes[0]).toBeChecked();
		expect(checkboxes[1]).not.toBeChecked();
	});

	it('exposes indeterminate state via the checkbox, not aria-checked on the listitem', async () => {
		const screen = await render(CheckboxListFixture, {
			props: { standalone: true, items: [{ label: 'Partial', isChecked: 'indeterminate' }] }
		});
		const item = itemsIn(screen.container)[0];
		expect(item).not.toHaveAttribute('aria-checked');
		const checkbox = checkboxesIn(screen.container)[0];
		expect(checkbox.indeterminate).toBe(true);
	});

	it('does not mark items aria-busy when idle', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Prefs',
				value: ['a'],
				onChange: noop,
				items: [{ label: 'Option A', value: 'a' }]
			}
		});
		expect(itemsIn(screen.container)[0]).not.toHaveAttribute('aria-busy');
	});

	it('marks the item aria-busy when item-level isLoading is set', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Prefs',
				value: ['a'],
				onChange: noop,
				items: [
					{ label: 'Option A', value: 'a', isLoading: true },
					{ label: 'Option B', value: 'b' }
				]
			}
		});
		const [itemA, itemB] = itemsIn(screen.container);
		expect(itemA).toHaveAttribute('aria-busy', 'true');
		// Loading is per-item — sibling items are unaffected.
		expect(itemB).not.toHaveAttribute('aria-busy');
	});

	it('renders a spinner inside the checkbox when item isLoading is set', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Prefs',
				value: ['a'],
				onChange: noop,
				items: [{ label: 'Option A', value: 'a', isLoading: true }]
			}
		});
		// The spinner is decorative — it lives inside the checkbox's
		// aria-hidden visual box, so query with includeHidden (upstream's
		// `hidden: true`). The accessible loading signal is `aria-busy` on the item
		// (asserted above). Scoped to the component's own container: `useAnnounce`
		// mounts a `role="status"` polite region on `document.body`, which would
		// otherwise make a body-wide query ambiguous — the same reason
		// `date-input.svelte.test.ts` scopes its alert queries.
		await expect
			.element(screen.locator.getByRole('status', { includeHidden: true }))
			.toBeInTheDocument();
	});

	it('does not toggle when item-level isLoading is set', async () => {
		const onChange = vi.fn();
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Prefs',
				value: [],
				onChange,
				items: [{ label: 'Option A', value: 'a', isLoading: true }]
			}
		});
		// Upstream's `fireEvent.click`, as a native untrusted dispatch.
		checkboxesIn(screen.container)[0].click();
		expect(onChange).not.toHaveBeenCalled();
	});

	it('shows a spinner only on the toggled item while changeAction is pending', async () => {
		// changeAction returns a promise that never resolves, so the pending
		// (loading) state persists for assertions.
		const changeAction = vi.fn(async () => {
			await new Promise<void>(() => {});
		});
		const screen = await render(CheckboxListFixture, {
			props: {
				label: 'Prefs',
				value: [],
				onChange: noop,
				changeAction,
				items: [
					{ label: 'Option A', value: 'a' },
					{ label: 'Option B', value: 'b' }
				]
			}
		});

		const [itemA, itemB] = itemsIn(screen.container);
		// Toggle Option A.
		itemA.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();

		// The toggled item becomes busy and shows a spinner; the sibling stays idle.
		// The spinner is decorative (inside the aria-hidden box), so it is found by
		// a scoped DOM query — upstream's `within(itemA).findByRole('status',
		// {hidden: true})`.
		await vi.waitFor(() => {
			expect(itemA.querySelector('[role="status"]')).not.toBeNull();
		});
		expect(itemA).toHaveAttribute('aria-busy', 'true');
		expect(itemB).not.toHaveAttribute('aria-busy');
		expect(itemB.querySelector('[role="status"]')).toBeNull();
		expect(changeAction).toHaveBeenCalledWith(['a']);
	});

	it('forwards arbitrary aria attributes to the list item, but aria-label names the checkbox', async () => {
		const screen = await render(CheckboxListFixture, {
			props: {
				standalone: true,
				items: [
					{
						label: 'Custom aria',
						'aria-describedby': 'help-text',
						'aria-label': 'custom label'
					}
				]
			}
		});
		const item = itemsIn(screen.container)[0];
		// Arbitrary aria-* still forward to the row...
		expect(item).toHaveAttribute('aria-describedby', 'help-text');
		// ...but aria-label names the checkbox control, not the row.
		expect(item).not.toHaveAttribute('aria-label');
		await expect
			.element(screen.getByRole('checkbox', { name: 'custom label' }))
			.toBeInTheDocument();
	});

	describe('disabledMessage', () => {
		async function renderGroup(onChange: (values: string[]) => void = noop) {
			return render(CheckboxListFixture, {
				props: {
					label: 'Notifications',
					value: ['email'],
					onChange,
					isDisabled: true,
					disabledMessage: 'Notifications are managed by your administrator',
					items: [
						{ label: 'Email', value: 'email' },
						{ label: 'SMS', value: 'sms' }
					]
				}
			});
		}

		it('shows the reason tooltip on hover when the group is disabled with a reason', async () => {
			const screen = await renderGroup();
			const tooltip = tooltipIn(screen.container)!;
			expect(tooltip).toHaveTextContent('Notifications are managed by your administrator');
			const group = screen.getByRole('group').element();
			// `mouseenter`/`mouseleave` do not bubble; the listeners sit on the group.
			// Dispatched as upstream's `fireEvent.mouseEnter(group)` dispatches them.
			group.dispatchEvent(new MouseEvent('mouseenter'));
			await vi.waitFor(() => {
				// `:popover-open` rather than upstream's invented `popover-open`
				// attribute; Chromium has the real Popover API.
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
			group.dispatchEvent(new MouseEvent('mouseleave'));
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(false);
			});
		});

		it('shows the reason tooltip on keyboard focus', async () => {
			const screen = await renderGroup();
			const tooltip = tooltipIn(screen.container)!;
			// Restated in delivery (see the file header): a Tab enters keyboard
			// modality, then focus is placed on the first checkbox so `:focus-visible`
			// — the component's `focusin` gate — treats it as keyboard-originated.
			await userEvent.tab();
			checkboxesIn(screen.container)[0].focus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(CheckboxListFixture, {
				props: {
					label: 'Notifications',
					value: ['email'],
					onChange: noop,
					disabledMessage: 'Notifications are managed by your administrator',
					items: [{ label: 'Email', value: 'email' }]
				}
			});
			expect(tooltipIn(screen.container)).toBeNull();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(CheckboxListFixture, {
				props: {
					label: 'Notifications',
					value: ['email'],
					onChange: noop,
					isDisabled: true,
					items: [{ label: 'Email', value: 'email' }]
				}
			});
			expect(tooltipIn(screen.container)).toBeNull();
		});

		it('keeps checkboxes focusable via aria-disabled when a reason is provided', async () => {
			const screen = await renderGroup();
			// Restated matcher (see the file header): the native question is asked
			// directly — no native `disabled` (what keeps the checkbox in the tab
			// order), plus the `aria-disabled` flag upstream reads.
			for (const checkbox of checkboxesIn(screen.container)) {
				expect(checkbox).not.toHaveAttribute('disabled');
				expect(checkbox.disabled).toBe(false);
				expect(checkbox).toHaveAttribute('aria-disabled', 'true');
			}
		});

		it('links the reason tooltip from the group via aria-describedby', async () => {
			const screen = await renderGroup();
			const group = screen.getByRole('group').element();
			const tooltip = tooltipIn(screen.container)!;
			expect(group.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks toggling while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await renderGroup(onChange);
			const sms = checkboxesIn(screen.container)[1];
			expect(sms).toHaveAccessibleName('SMS');
			// Upstream's `fireEvent.click`, as a native untrusted dispatch — the
			// control is focusable-disabled (`aria-disabled`, not native), so
			// Playwright would refuse to click it.
			sms.click();
			expect(onChange).not.toHaveBeenCalled();
			// The port re-asserts `.checked` from `value` in the blocked path
			// (`syncNativeState`), standing in for React's controlled-input restore.
			expect(sms).not.toBeChecked();
		});

		it('keeps checkboxes natively disabled when disabled without a reason', async () => {
			const screen = await render(CheckboxListFixture, {
				props: {
					label: 'Notifications',
					value: ['email'],
					onChange: noop,
					isDisabled: true,
					items: [
						{ label: 'Email', value: 'email' },
						{ label: 'SMS', value: 'sms' }
					]
				}
			});
			for (const checkbox of checkboxesIn(screen.container)) {
				expect(checkbox).toBeDisabled();
			}
		});
	});
});
