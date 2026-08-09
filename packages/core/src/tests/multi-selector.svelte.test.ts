import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import MultiSelector from '$lib/components/multi-selector/multi-selector.svelte';
import Icon from '$lib/components/icon/icon.svelte';
import Fixture from './fixtures/multi-selector-fixture.svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import { defineTheme } from '$lib/theme/define-theme.js';
import { generateThemeCss } from '$lib/theme/generate-theme-rules.js';

/**
 * Astryx's `MultiSelector/MultiSelector.test.tsx`, ported case for case — 88
 * upstream cases across its eleven describe blocks (the top-level
 * `MultiSelector` and its nested `grouped search`, `result announcements`,
 * `keyboard accessibility`, `announcements`, `disabledMessage` and `form
 * participation`, then the four top-level `MultiSelector statusVariant
 * forwarding`, `MultiSelector clear icon theme target`, `MultiSelector indicator
 * (chevron) icon theme target` and `MultiSelector search affordances`), 87 here,
 * 1 dropped and named below.
 *
 * DROPPED (1): `has displayName` — `MultiSelector.displayName` is a React
 * component surface with no Svelte counterpart, the same case
 * `collapsible.svelte.test.ts` and `more-menu.svelte.test.ts` drop. There is no
 * ref-callback case in the file, so nothing else is React-only.
 *
 * Runs in the **client (real Chromium)** project, for the reason
 * `selector.svelte.test.ts` does: the popup opens through the native Popover API
 * and the keyboard model needs real focus. Upstream's `beforeEach` stubbing
 * `showPopover`/`hidePopover`/`:popover-open` is therefore GONE — Chromium
 * implements all three natively, and keeping the stub would substitute a model
 * of the thing under test for the thing itself. Its `h = {hidden: true}`
 * companion survives as a container `querySelector` where the queried node
 * really is inside a closed (`display: none`) popover.
 *
 * Mechanical translations, each following a pattern an earlier suite set:
 *
 * - `render` is async — always awaited.
 * - `userEvent` comes from `vitest/browser`; `fireEvent.mouseEnter/mouseLeave`
 *   become dispatched `MouseEvent`s, as the tooltip cases in
 *   `selector.svelte.test.ts` do.
 * - The three JSX-children cases (two `<form>` wrappers and a sibling Tab
 *   target) and the `renderOption` render prop go through
 *   `multi-selector-fixture.svelte`. A Svelte case cannot author markup children.
 * - `act()` has no counterpart — a `$state` write flushes on its own and
 *   `expect.element`/`vi.waitFor` retry.
 * - `user.click(option)` becomes a native `.click()` on the row and
 *   `user.type(searchInput, …)` becomes `userEvent.fill`, both as
 *   `selector.svelte.test.ts` does: the rows and the trigger carry `onclick`, and
 *   the search field filters off `input`, so neither the pointer sequence nor the
 *   per-keystroke events are what is under test here.
 *
 * RESTATED cases carry an inline comment: the four `tabIndex` assertions
 * (Svelte renders the attribute lowercase), the one `not.toBeDisabled`
 * assertion on the focusable-disabled trigger (vitest-browser's is Playwright's
 * ARIA computation, which counts `aria-disabled`, not jest-dom's
 * native-attribute one), and the `blocks activation` case (Playwright refuses to
 * click an `aria-disabled` element, so the click is dispatched natively onto the
 * `onclick` handler the trigger actually carries).
 */

const defaultOptions = ['Apple', 'Banana', 'Orange'];

// Upstream's module-level constants, kept so the two announcement cases read the
// same. The eslint rule they satisfy is React-only; the values are the point.
const ANNOUNCE_OPTIONS = ['Apple', 'Banana', 'Orange'];
const EMPTY_VALUE: string[] = [];

function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}

function optionsIn(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="option"]'));
}

/**
 * Upstream's `screen.getByRole('group', {name})` / `queryByRole(...)` pair. A
 * `querySelector` rather than a locator so the negative form has something to
 * assert `not.toBeInTheDocument()` on, and because the section wrappers live
 * inside the popover, where the accessibility tree would have to opt in.
 */
function groupNamed(container: HTMLElement, name: string): HTMLElement | null {
	return container.querySelector<HTMLElement>(`[role="group"][aria-label="${name}"]`);
}

function listboxIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="listbox"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a role="listbox" element');
	return el;
}

function tooltipIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="tooltip"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a role="tooltip" element');
	return el;
}

/** The row whose visible text is `text` — upstream's `getByText(...)` target. */
function rowWithText(container: HTMLElement, text: string): HTMLElement {
	const el = optionsIn(container).find((row) => row.textContent?.trim() === text);
	if (!el) throw new Error(`no role="option" row with text ${JSON.stringify(text)}`);
	return el;
}

function isOpen(el: Element): boolean {
	return el.matches(':popover-open');
}

afterEach(() => {
	__resetLiveRegionsForTest();
	vi.restoreAllMocks();
});

describe('MultiSelector', () => {
	it('renders with label', async () => {
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: defaultOptions, value: [], onChange: () => {} }
		});
		await expect.element(screen.getByLabelText('Fruit')).toBeInTheDocument();
	});

	it('renders custom option content with renderOption', async () => {
		const screen = await render(Fixture, {
			props: {
				variant: 'render-option',
				selector: {
					label: 'Fruit',
					options: [{ value: 'apple', label: 'Apple' }],
					value: [],
					onChange: () => {}
				}
			}
		});

		await userEvent.click(screen.getByRole('combobox'));
		await expect.element(screen.getByTestId('custom-option')).toHaveTextContent('Apple');
	});

	it('renders placeholder when no value selected', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				placeholder: 'Pick fruits...'
			}
		});
		await expect.element(screen.getByText('Pick fruits...')).toBeInTheDocument();
	});

	it('shows count display by default', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: ['Apple', 'Banana'],
				onChange: () => {}
			}
		});
		await expect.element(screen.getByText('2 selected')).toBeInTheDocument();
	});

	it('shows labels display', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: ['Apple', 'Banana'],
				onChange: () => {},
				triggerDisplay: 'labels'
			}
		});
		await expect.element(screen.getByText('Apple, Banana')).toBeInTheDocument();
	});

	it('shows labels display with overflow', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana', 'Orange', 'Mango', 'Pineapple'],
				value: ['Apple', 'Banana', 'Orange', 'Mango', 'Pineapple'],
				onChange: () => {},
				triggerDisplay: 'labels'
			}
		});
		await expect.element(screen.getByText('Apple, Banana, Orange, +2')).toBeInTheDocument();
	});

	it('opens dropdown on click', async () => {
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: defaultOptions, value: [], onChange: () => {} }
		});
		const trigger = screen.getByRole('combobox');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('toggles item on click without closing dropdown', async () => {
		const onChange = vi.fn();
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: defaultOptions, value: [], onChange }
		});

		await userEvent.click(screen.getByRole('combobox'));
		optionsIn(screen.container)[0].click();

		expect(onChange).toHaveBeenCalledWith(['Apple']);
		// Dropdown should still be open
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
	});

	it('deselects item when clicking selected item', async () => {
		const onChange = vi.fn();
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: defaultOptions, value: ['Apple', 'Banana'], onChange }
		});

		await userEvent.click(screen.getByRole('combobox'));
		// Apple and Banana are selected at open, so they sort first; Apple is row 0.
		optionsIn(screen.container)[0].click();

		expect(onChange).toHaveBeenCalledWith(['Banana']);
	});

	it('does not toggle disabled items', async () => {
		const onChange = vi.fn();
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: [
					{ value: 'apple', label: 'Apple', disabled: true },
					{ value: 'banana', label: 'Banana' }
				],
				value: [],
				onChange
			}
		});

		await userEvent.click(screen.getByRole('combobox'));
		optionsIn(screen.container)[0].click(); // Click disabled Apple

		expect(onChange).not.toHaveBeenCalled();
	});

	it('renders disabled state', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				isDisabled: true
			}
		});
		await expect.element(screen.getByRole('combobox')).toBeDisabled();
	});

	it('has correct ARIA attributes', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				isRequired: true
			}
		});
		const trigger = screen.getByRole('combobox');
		await expect.element(trigger).toHaveAttribute('aria-haspopup', 'listbox');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect.element(trigger).toHaveAttribute('aria-required', 'true');
	});

	it('renders listbox with aria-multiselectable', async () => {
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: defaultOptions, value: [], onChange: () => {} }
		});

		await userEvent.click(screen.getByRole('combobox'));
		expect(listboxIn(screen.container)).toHaveAttribute('aria-multiselectable', 'true');
	});

	it('marks selected options with aria-selected', async () => {
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: defaultOptions, value: ['Apple'], onChange: () => {} }
		});

		await userEvent.click(screen.getByRole('combobox'));
		const options = optionsIn(screen.container);
		expect(options[0]).toHaveAttribute('aria-selected', 'true');
		expect(options[1]).toHaveAttribute('aria-selected', 'false');
	});

	it('shows error status with aria-invalid', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				status: { type: 'error', message: 'Required' }
			}
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
		await expect.element(screen.getByText('Required')).toBeInTheDocument();
	});

	it('closes on Escape', async () => {
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: defaultOptions, value: [], onChange: () => {} }
		});

		const trigger = screen.getByRole('combobox');
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

		await userEvent.keyboard('{Escape}');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('closes combobox on Tab and moves focus to next element', async () => {
		const screen = await render(Fixture, {
			props: {
				variant: 'next',
				selector: { label: 'Fruit', options: defaultOptions, value: [], onChange: () => {} }
			}
		});

		const trigger = screen.getByRole('combobox');
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

		await userEvent.keyboard('{Tab}');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('supports keyboard navigation with ArrowDown/ArrowUp', async () => {
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: defaultOptions, value: [], onChange: () => {} }
		});

		const trigger = screen.getByRole('combobox');
		await userEvent.click(trigger);

		await userEvent.keyboard('{ArrowDown}');
		await vi.waitFor(() => {
			expect((trigger.element() as HTMLElement).getAttribute('aria-activedescendant')).toBeTruthy();
		});
	});

	it('End/Home jump the highlight to the last/first option (non-search)', async () => {
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: defaultOptions, value: [], onChange: () => {} }
		});

		const trigger = screen.getByRole('combobox');
		await userEvent.click(trigger);
		const options = optionsIn(screen.container);

		await userEvent.keyboard('{End}');
		await expect
			.element(trigger)
			.toHaveAttribute('aria-activedescendant', options[options.length - 1].id);
		await userEvent.keyboard('{Home}');
		await expect.element(trigger).toHaveAttribute('aria-activedescendant', options[0].id);
	});

	it('toggles item with Enter key', async () => {
		const onChange = vi.fn();
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: defaultOptions, value: [], onChange }
		});

		await userEvent.click(screen.getByRole('combobox'));
		await userEvent.keyboard('{Enter}');
		expect(onChange).toHaveBeenCalledWith(['Apple']);
	});

	it('toggles the correct item when selected items are sorted to top', async () => {
		const onChange = vi.fn();
		// Orange is selected, so sorted order is: Orange, Apple, Banana
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: defaultOptions, value: ['Orange'], onChange }
		});

		await userEvent.click(screen.getByRole('combobox'));
		// highlightedIndex starts at 0 which is Orange (sorted first)
		await userEvent.keyboard('{ArrowDown}');
		// Now at index 1 which should be Apple
		await userEvent.keyboard('{Enter}');
		expect(onChange).toHaveBeenCalledWith(['Orange', 'Apple']);
	});

	it('renders select-all checkbox when hasSelectAll', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				hasSelectAll: true
			}
		});

		await userEvent.click(screen.getByRole('combobox'));
		await expect.element(screen.getByText('Select all')).toBeInTheDocument();
	});

	it('select-all selects all enabled items', async () => {
		const onChange = vi.fn();
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: [
					{ value: 'apple', label: 'Apple' },
					{ value: 'banana', label: 'Banana', disabled: true },
					{ value: 'orange', label: 'Orange' }
				],
				value: [],
				onChange,
				hasSelectAll: true
			}
		});

		await userEvent.click(screen.getByRole('combobox'));
		rowWithText(screen.container, 'Select all').click();

		expect(onChange).toHaveBeenCalledWith(['apple', 'orange']);
	});

	it('select-all deselects all when all are selected', async () => {
		const onChange = vi.fn();
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: ['Apple', 'Banana', 'Orange'],
				onChange,
				hasSelectAll: true
			}
		});

		await userEvent.click(screen.getByRole('combobox'));
		rowWithText(screen.container, 'Select all').click();

		expect(onChange).toHaveBeenCalledWith([]);
	});

	it('select-all is a role="option" in the listbox', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				hasSelectAll: true
			}
		});

		await userEvent.click(screen.getByRole('combobox'));
		expect(optionsIn(screen.container)[0]).toHaveTextContent('Select all');
	});

	it('select-all accessible name reflects none/partial/all selection', async () => {
		const options = [
			{ value: 'apple', label: 'Apple' },
			{ value: 'banana', label: 'Banana' }
		];
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options, value: [], onChange: () => {}, hasSelectAll: true }
		});

		await userEvent.click(screen.getByRole('combobox'));

		// None selected: plain name, not selected
		let selectAll = optionsIn(screen.container)[0];
		expect(selectAll).not.toHaveAccessibleName(/partially selected/);
		expect(selectAll).toHaveAttribute('aria-selected', 'false');

		// Partial: aria-selected="mixed" is invalid on role="option", so the
		// indeterminate state must be conveyed through the accessible name.
		await screen.rerender({
			label: 'Fruit',
			options,
			value: ['apple'],
			onChange: () => {},
			hasSelectAll: true
		});
		selectAll = optionsIn(screen.container)[0];
		expect(selectAll).toHaveAccessibleName('Select all, partially selected');
		expect(selectAll).toHaveAttribute('aria-selected', 'false');

		// All selected: plain name again, selected
		await screen.rerender({
			label: 'Fruit',
			options,
			value: ['apple', 'banana'],
			onChange: () => {},
			hasSelectAll: true
		});
		selectAll = optionsIn(screen.container)[0];
		expect(selectAll).not.toHaveAccessibleName(/partially selected/);
		expect(selectAll).toHaveAttribute('aria-selected', 'true');
	});

	it('select-all toggles via keyboard Enter', async () => {
		const onChange = vi.fn();
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange,
				hasSelectAll: true
			}
		});

		await userEvent.click(screen.getByRole('combobox'));
		// highlightedIndex starts at 0 which is select-all
		await userEvent.keyboard('{Enter}');
		expect(onChange).toHaveBeenCalledWith(['Apple', 'Banana', 'Orange']);
	});

	it('renders search input when hasSearch', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				hasSearch: true
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		const searchInput = screen.getByRole('combobox');
		await expect.element(searchInput).toBeInTheDocument();
		await expect.element(searchInput).toHaveAttribute('aria-autocomplete', 'list');
	});

	it('filters options when searching', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				hasSearch: true
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		await userEvent.fill(screen.getByRole('combobox'), 'app');

		await vi.waitFor(() => {
			expect(optionsIn(screen.container)).toHaveLength(1);
		});
	});

	describe('grouped search', () => {
		const GROUPED = [
			{
				type: 'section' as const,
				title: 'Citrus',
				options: [
					{ value: 'orange', label: 'Orange' },
					{ value: 'lemon', label: 'Lemon' }
				]
			},
			{
				type: 'section' as const,
				title: 'Berries',
				options: [
					{ value: 'strawberry', label: 'Strawberry' },
					{ value: 'blueberry', label: 'Blueberry' }
				]
			}
		];

		it('keeps the group header above matching items while searching', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: GROUPED,
					value: [],
					onChange: () => {},
					hasSearch: true
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			await userEvent.fill(screen.getByRole('combobox'), 'orange');

			await vi.waitFor(() => {
				expect(groupNamed(screen.container, 'Citrus')).toBeInTheDocument();
				const options = optionsIn(screen.container);
				expect(options).toHaveLength(1);
				expect(options[0]).toHaveTextContent('Orange');
			});
		});

		it('hides a group whose items have no match', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: GROUPED,
					value: [],
					onChange: () => {},
					hasSearch: true
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			await userEvent.fill(screen.getByRole('combobox'), 'berry');

			await vi.waitFor(() => {
				expect(groupNamed(screen.container, 'Berries')).toBeInTheDocument();
				expect(groupNamed(screen.container, 'Citrus')).not.toBeInTheDocument();
				expect(optionsIn(screen.container)).toHaveLength(2);
			});
		});
	});

	it('PageDown/PageUp jump the highlight to the last/first filtered option', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				hasSearch: true
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		const searchInput = screen.getByRole('combobox');
		// Filter to Banana and Orange so "last" means last *visible* option.
		await userEvent.fill(searchInput, 'an');
		let options: HTMLElement[] = [];
		await vi.waitFor(() => {
			options = optionsIn(screen.container);
			expect(options).toHaveLength(2);
		});

		await userEvent.keyboard('{PageDown}');
		await expect
			.element(searchInput)
			.toHaveAttribute('aria-activedescendant', options[options.length - 1].id);
		await userEvent.keyboard('{PageUp}');
		await expect.element(searchInput).toHaveAttribute('aria-activedescendant', options[0].id);
	});

	it('Home/End move the search caret, not the option highlight', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				hasSearch: true
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		// `userEvent.type`, not `fill`: this case is about the caret, and only a
		// real per-character keystroke sequence leaves it where typing would.
		const searchInput = screen.getByRole('combobox').element() as HTMLInputElement;
		await userEvent.type(screen.getByRole('combobox'), 'an');
		await vi.waitFor(() => {
			expect(searchInput.selectionStart).toBe(2);
		});
		const activeBefore = searchInput.getAttribute('aria-activedescendant');
		// Home/End stay on the input for caret movement (APG editable combobox);
		// the option highlight must not move.
		await userEvent.keyboard('{Home}');
		expect(searchInput.selectionStart).toBe(0);
		expect(searchInput.getAttribute('aria-activedescendant')).toBe(activeBefore);
		await userEvent.keyboard('{End}');
		expect(searchInput.selectionStart).toBe(2);
		expect(searchInput.getAttribute('aria-activedescendant')).toBe(activeBefore);
	});

	it('shows empty state when search has no results', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				hasSearch: true
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		await userEvent.fill(screen.getByRole('combobox'), 'xyz');

		// Scoped to the listbox, exactly as upstream now scopes it: the polite live
		// region announces the same "No results found" string, so an unscoped query
		// matches both the visible empty state and the announcement.
		await vi.waitFor(() => {
			expect(listboxIn(screen.container)).toHaveTextContent('No results found');
		});
	});

	it('empty-state message is not exposed as a listbox child', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				hasSearch: true
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		await userEvent.fill(screen.getByRole('combobox'), 'xyz');

		// role="listbox" only permits option/group children — the visual
		// empty-state message must be presentational (it is announced through
		// the result-count live region instead).
		await vi.waitFor(() => {
			const empty = listboxIn(screen.container).querySelector('[role="presentation"]');
			expect(empty).toHaveTextContent('No results found');
		});
	});

	describe('result announcements', () => {
		it('announces the match count politely while searching', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: EMPTY_VALUE,
					onChange: () => {},
					hasSearch: true
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			// "an" matches Banana and Orange.
			await userEvent.fill(screen.getByRole('combobox'), 'an');
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('2 results');
			});
		});

		it('announces the singular form when one option matches', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: EMPTY_VALUE,
					onChange: () => {},
					hasSearch: true
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			// "app" matches only Apple. Anchored so it cannot pass on "1 results".
			await userEvent.fill(screen.getByRole('combobox'), 'app');
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent(/^1 result$/);
			});
		});

		it('announces "No results found" when nothing matches', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: EMPTY_VALUE,
					onChange: () => {},
					hasSearch: true
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			await userEvent.fill(screen.getByRole('combobox'), 'xyz');
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('No results found');
			});
		});

		it('does not announce results until the user searches', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: EMPTY_VALUE,
					onChange: () => {},
					hasSearch: true
				}
			});
			// Popover closed: nothing announced.
			expect(politeRegion()?.textContent ?? '').toBe('');
			// Open with an empty query: still nothing announced.
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			expect(politeRegion()?.textContent ?? '').toBe('');
		});
	});

	it('renders with description', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				description: 'Choose your fruits',
				options: defaultOptions,
				value: [],
				onChange: () => {}
			}
		});
		await expect.element(screen.getByText('Choose your fruits')).toBeInTheDocument();
	});

	it('supports data-testid', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				'data-testid': 'fruit-selector'
			}
		});
		await expect.element(screen.getByTestId('fruit-selector')).toBeInTheDocument();
	});

	it('renders sections with dividers', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: [
					{ value: 'apple', label: 'Apple' },
					{
						type: 'section',
						title: 'Citrus',
						options: [
							{ value: 'orange', label: 'Orange' },
							{ value: 'lemon', label: 'Lemon' }
						]
					}
				],
				value: [],
				onChange: () => {}
			}
		});

		await userEvent.click(screen.getByRole('combobox'));
		expect(optionsIn(screen.container)).toHaveLength(3);
		const group = screen.container.querySelector('[role="group"]');
		expect(group).toHaveAttribute('aria-label', 'Citrus');
	});

	it('shows loading state with aria-busy', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				isLoading: true
			}
		});
		await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-busy', 'true');
	});

	it('renders with custom selectAllLabel', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: defaultOptions,
				value: [],
				onChange: () => {},
				hasSelectAll: true,
				selectAllLabel: 'Check all'
			}
		});

		await userEvent.click(screen.getByRole('combobox'));
		await expect.element(screen.getByText('Check all')).toBeInTheDocument();
	});

	it('sorts selected items to top', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana', 'Orange'],
				value: ['Orange'],
				onChange: () => {}
			}
		});

		await userEvent.click(screen.getByRole('combobox'));
		const options = optionsIn(screen.container);
		// Orange is selected so it should appear first
		expect(options[0]).toHaveAttribute('aria-selected', 'true');
		expect(options[0]).toHaveTextContent('Orange');
		expect(options[1]).toHaveTextContent('Apple');
		expect(options[2]).toHaveTextContent('Banana');
	});

	it('sorts selected items to top within sections', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: [
					{
						type: 'section',
						title: 'Citrus',
						options: [
							{ value: 'orange', label: 'Orange' },
							{ value: 'lemon', label: 'Lemon' },
							{ value: 'lime', label: 'Lime' }
						]
					}
				],
				value: ['lime'],
				onChange: () => {}
			}
		});

		await userEvent.click(screen.getByRole('combobox'));
		const options = optionsIn(screen.container);
		// Lime is selected so it should appear first within the section
		expect(options[0]).toHaveTextContent('Lime');
		expect(options[1]).toHaveTextContent('Orange');
		expect(options[2]).toHaveTextContent('Lemon');
	});

	describe('keyboard accessibility', () => {
		it('trigger is focusable via Tab when enabled', async () => {
			const screen = await render(MultiSelector, {
				props: { label: 'Fruit', options: defaultOptions, value: [], onChange: () => {} }
			});
			await userEvent.tab();
			expect(document.activeElement).toBe(screen.getByRole('combobox').element());
		});

		it('trigger is not focusable when disabled', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: [],
					onChange: () => {},
					isDisabled: true
				}
			});
			// RESTATED: Svelte renders the attribute lowercase (`tabindex`), where
			// React's `tabIndex` prop serialises the same way but jest-dom's matcher
			// is case-insensitive about it.
			await expect.element(screen.getByRole('combobox')).toHaveAttribute('tabindex', '-1');
		});

		it('opens the listbox with ArrowDown from a focused trigger', async () => {
			const screen = await render(MultiSelector, {
				props: { label: 'Fruit', options: defaultOptions, value: [], onChange: () => {} }
			});
			const trigger = screen.getByRole('combobox');
			await userEvent.tab();
			expect(document.activeElement).toBe(trigger.element());
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		});

		it('clear button is reachable by keyboard', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: ['Apple', 'Banana'],
					onChange: () => {},
					hasClear: true
				}
			});
			const clear = screen.getByRole('button', { name: 'Clear all Fruit' });
			// RESTATED as above — lowercase attribute name.
			await expect.element(clear).not.toHaveAttribute('tabindex', '-1');
		});

		it('scrolls the highlighted option into view during arrow navigation', async () => {
			const scrollIntoView = vi
				.spyOn(HTMLElement.prototype, 'scrollIntoView')
				.mockImplementation(() => {});
			const longOptions = Array.from({ length: 20 }, (_, i) => `Option ${i + 1}`);
			const screen = await render(MultiSelector, {
				props: { label: 'Fruit', options: longOptions, value: [], onChange: () => {} }
			});

			await userEvent.click(screen.getByRole('combobox'));
			scrollIntoView.mockClear();
			await userEvent.keyboard('{ArrowDown}');
			await userEvent.keyboard('{ArrowDown}');

			await vi.waitFor(() => {
				expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
			});
		});

		it('clears all values via Delete on the focused trigger', async () => {
			const onChange = vi.fn();
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: ['Apple', 'Banana'],
					onChange,
					hasClear: true
				}
			});
			(screen.getByRole('combobox').element() as HTMLElement).focus();
			await userEvent.keyboard('{Delete}');
			expect(onChange).toHaveBeenCalledWith([]);
		});

		it('clears all values via Backspace on the focused trigger', async () => {
			const onChange = vi.fn();
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: ['Apple', 'Banana'],
					onChange,
					hasClear: true
				}
			});
			(screen.getByRole('combobox').element() as HTMLElement).focus();
			await userEvent.keyboard('{Backspace}');
			expect(onChange).toHaveBeenCalledWith([]);
		});

		it('does not clear via Delete when nothing is selected', async () => {
			const onChange = vi.fn();
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: [],
					onChange,
					hasClear: true
				}
			});
			(screen.getByRole('combobox').element() as HTMLElement).focus();
			await userEvent.keyboard('{Delete}');
			expect(onChange).not.toHaveBeenCalled();
		});
	});

	describe('announcements', () => {
		it('announces the selection count politely when toggling an option', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: [...ANNOUNCE_OPTIONS],
					value: EMPTY_VALUE,
					onChange: () => {}
				}
			});
			await userEvent.click(screen.getByRole('combobox'));
			optionsIn(screen.container)[0].click();
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('1 of 3 selected');
			});
		});

		it('announces "All selected" when select-all selects everything', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: [...ANNOUNCE_OPTIONS],
					value: EMPTY_VALUE,
					onChange: () => {},
					hasSelectAll: true
				}
			});
			await userEvent.click(screen.getByRole('combobox'));
			rowWithText(screen.container, 'Select all').click();
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('All selected');
			});
		});

		it('announces "Selection cleared" when clearing', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: [...ANNOUNCE_OPTIONS],
					value: ['Apple', 'Banana'],
					onChange: () => {},
					hasClear: true
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Clear all Fruit' }));
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Selection cleared');
			});
		});
	});

	describe('disabledMessage', () => {
		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: [],
					onChange: () => {},
					isDisabled: true,
					disabledMessage: 'Select a table first',
					'data-testid': 'fruit-multi-selector'
				}
			});

			const container = screen.getByTestId('fruit-multi-selector').element() as HTMLElement;
			const tooltip = tooltipIn(screen.container);
			expect(tooltip).toHaveTextContent('Select a table first');

			container.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
			await vi.waitFor(() => {
				expect(isOpen(tooltip)).toBe(true);
			});

			container.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
			await vi.waitFor(() => {
				expect(isOpen(tooltip)).toBe(false);
			});
		});

		it('shows the reason tooltip on keyboard focus', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: [],
					onChange: () => {},
					isDisabled: true,
					disabledMessage: 'Select a table first'
				}
			});

			const tooltip = tooltipIn(screen.container);
			await userEvent.tab();
			expect(document.activeElement).toBe(screen.getByRole('combobox').element());
			await vi.waitFor(() => {
				expect(isOpen(tooltip)).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: [],
					onChange: () => {},
					disabledMessage: 'Select a table first'
				}
			});
			expect(screen.container.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: [],
					onChange: () => {},
					isDisabled: true
				}
			});
			expect(screen.container.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
		});

		it('keeps the trigger focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: [],
					onChange: () => {},
					isDisabled: true,
					disabledMessage: 'Select a table first'
				}
			});
			const trigger = screen.getByRole('combobox');
			// RESTATED: `not.toBeDisabled()` here is Playwright's ARIA computation,
			// which counts `aria-disabled` and would therefore report this trigger as
			// disabled. The native attribute is what upstream is actually asserting
			// the absence of.
			await expect.element(trigger).not.toHaveAttribute('disabled');
			await expect.element(trigger).toHaveAttribute('aria-disabled', 'true');
			// RESTATED: lowercase attribute name.
			await expect.element(trigger).toHaveAttribute('tabindex', '0');
		});

		it('links the reason tooltip from the trigger via aria-describedby', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: [],
					onChange: () => {},
					isDisabled: true,
					disabledMessage: 'Select a table first'
				}
			});
			const trigger = screen.getByRole('combobox').element() as HTMLElement;
			const tooltip = tooltipIn(screen.container);
			expect(trigger.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks activation while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: [],
					onChange,
					isDisabled: true,
					disabledMessage: 'Select a table first'
				}
			});

			const trigger = screen.getByRole('combobox');
			// RESTATED: Playwright refuses to click an `aria-disabled` element, so
			// the click is dispatched natively — the component's own guard is what
			// this case is about, not the driver's actionability heuristic. Same
			// restatement `selector.svelte.test.ts` makes.
			(trigger.element() as HTMLElement).click();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

			(trigger.element() as HTMLElement).focus();
			await userEvent.keyboard('{Enter}');
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
			expect(onChange).not.toHaveBeenCalled();
		});

		it('remains non-focusable when disabled without a reason', async () => {
			const screen = await render(MultiSelector, {
				props: {
					label: 'Fruit',
					options: defaultOptions,
					value: [],
					onChange: () => {},
					isDisabled: true
				}
			});
			const trigger = screen.getByRole('combobox');
			await expect.element(trigger).toBeDisabled();
			// RESTATED: lowercase attribute name.
			await expect.element(trigger).toHaveAttribute('tabindex', '-1');
		});
	});

	describe('form participation', () => {
		it('submits one entry per selected value under htmlName', async () => {
			const screen = await render(Fixture, {
				props: {
					variant: 'form',
					selector: {
						label: 'Fruit',
						htmlName: 'fruit',
						options: ['Apple', 'Banana', 'Orange'],
						value: ['Apple', 'Orange'],
						onChange: () => {}
					}
				}
			});
			const form = screen.container.querySelector('form');
			expect(form).not.toBeNull();
			const data = new FormData(form as HTMLFormElement);
			expect(data.getAll('fruit')).toEqual(['Apple', 'Orange']);
		});

		it('is excluded from form data when disabled', async () => {
			const screen = await render(Fixture, {
				props: {
					variant: 'form',
					selector: {
						label: 'Fruit',
						htmlName: 'fruit',
						options: ['Apple'],
						value: ['Apple'],
						onChange: () => {},
						isDisabled: true
					}
				}
			});
			const form = screen.container.querySelector('form');
			expect([...new FormData(form as HTMLFormElement).keys()]).toEqual([]);
		});
	});
});

describe('MultiSelector statusVariant forwarding', () => {
	it('defaults to attached (status renders with data-variant="attached")', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
				value: [],
				onChange: () => {},
				status: { type: 'error' as const, message: 'Required' }
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'attached'
		);
	});

	it('forwards statusVariant="detached" to the underlying Field status', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
				value: [],
				onChange: () => {},
				status: { type: 'error' as const, message: 'Required' },
				statusVariant: 'detached' as const
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'detached'
		);
	});

	it('keeps the on-field status icon for the attached variant', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
				value: [],
				onChange: () => {},
				status: { type: 'error' as const, message: 'Required' }
			}
		});
		// Attached: the status glyph replaces the chevron indicator on the field.
		expect(screen.container.querySelector('.astryx-multi-selector-indicator-icon')).toBeNull();
	});

	it('suppresses the on-field status icon for the detached variant', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
				value: [],
				onChange: () => {},
				status: { type: 'error' as const, message: 'Required' },
				statusVariant: 'detached' as const
			}
		});
		// Detached: the message box below carries its own leading icon, so the
		// field keeps its chevron indicator rather than duplicating the glyph.
		expect(screen.container.querySelector('.astryx-multi-selector-indicator-icon')).not.toBeNull();
	});

	it('detaches attached status by default for the ghost variant', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
				value: [],
				onChange: () => {},
				variant: 'ghost' as const,
				status: { type: 'error' as const, message: 'Required' }
			}
		});
		expect(screen.container.querySelector('.astryx-multi-selector')).toHaveAttribute(
			'data-variant',
			'ghost'
		);
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'detached'
		);
	});

	it('uses a status tooltip for ghost multi-selectors when requested', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
				value: [],
				onChange: () => {},
				variant: 'ghost' as const,
				status: { type: 'warning' as const, message: 'Some rows are hidden' },
				statusVariant: 'tooltip' as const
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toBeNull();
		const statusButton = screen
			.getByRole('button', { name: 'Warning details' })
			.element() as HTMLElement;
		const tooltip = tooltipIn(screen.container);
		expect(tooltip).toHaveTextContent('Some rows are hidden');
		expect(statusButton.getAttribute('aria-describedby')).toContain(tooltip.id);
		const trigger = screen.getByRole('combobox').element() as HTMLElement;
		expect(trigger.getAttribute('aria-describedby')).toContain(tooltip.id);
	});
});

describe('MultiSelector clear icon theme target', () => {
	const ICON_OPTIONS = ['Apple', 'Banana', 'Orange'];

	// Resolve the clear glyph span (the astryx-icon element inside the clear
	// button), independent of the theme target class. Scoped to the render
	// container rather than upstream's global `screen`, because the byte-identical
	// case below mounts a second, reference `Icon` into the same document.
	const getClearIcon = (container: HTMLElement): HTMLElement => {
		const button = container.querySelector('[aria-label="Clear all Fruit"]');
		const icon = button?.querySelector('.astryx-icon');
		if (icon == null) {
			throw new Error('clear icon not found');
		}
		return icon as HTMLElement;
	};

	it('renders the astryx-multi-selector-clear-icon target on the clear glyph', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ICON_OPTIONS,
				value: ['Banana'],
				onChange: () => {},
				hasClear: true
			}
		});
		// The stable theme target lands on the icon element itself (not the
		// button), so a theme can restyle just this glyph (color, size, hover)
		// via `defineTheme` — a button-level target could not reach the icon's
		// own color/size.
		const icon = getClearIcon(screen.container);
		expect(icon).toHaveClass('astryx-multi-selector-clear-icon');
		expect(icon).toHaveClass('astryx-icon');
	});

	it('keeps the clear button functional alongside the target', async () => {
		const onChange = vi.fn();
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ICON_OPTIONS,
				value: ['Banana'],
				onChange,
				hasClear: true
			}
		});
		const clear = screen.getByRole('button', { name: 'Clear all Fruit' }).element() as HTMLElement;
		expect(clear.tagName).toBe('BUTTON');
		// RESTATED only in mechanism: upstream's `fireEvent.click` is a dispatched
		// click with no pointer sequence, which a native `.click()` is here.
		clear.click();
		expect(onChange).toHaveBeenCalledWith([]);
	});

	it('renders the default icon (secondary color, sm size) byte-identically', async () => {
		// Pixel-identical default guard: the clear glyph must carry the exact same
		// StyleX color/size classes as a standalone secondary/sm icon. The added
		// target class is purely additive — it changes nothing until a theme
		// targets it.
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ICON_OPTIONS,
				value: ['Banana'],
				onChange: () => {},
				hasClear: true
			}
		});
		const icon = getClearIcon(screen.container);

		const refScreen = await render(Icon, {
			props: { icon: 'close', size: 'sm', color: 'secondary' }
		});
		const refIcon = refScreen.container.querySelector('.astryx-icon') as HTMLElement;

		const styleClasses = (el: HTMLElement) =>
			el.className
				.split(' ')
				.filter((c) => c !== 'astryx-multi-selector-clear-icon')
				.sort();

		expect(styleClasses(icon)).toEqual(styleClasses(refIcon));
	});

	it('exposes multi-selector-clear-icon so a theme reaches the icon color, size, and hover', () => {
		// The DOM-class assertion above (target lands on the icon element) plus
		// this generation assertion (the theme emits same-element icon rules in
		// `@layer astryx-theme`) together prove the seam: a same-element theme rule
		// wins over the icon's own base-layer color/size. `generateThemeCss` is
		// this port's counterpart to upstream's `generateThemeCSSFlat` — both
		// return the flat stylesheet string.
		const theme = defineTheme({
			name: 'multi-selector-clear-icon-test',
			components: {
				'multi-selector-clear-icon': {
					base: {
						width: '12px',
						height: '12px',
						fontSize: '12px',
						color: 'var(--color-icon-secondary)',
						':hover': { color: 'var(--color-icon-primary)' }
					}
				}
			}
		});
		const css = generateThemeCss(theme);
		expect(css).toContain('.astryx-multi-selector-clear-icon {');
		expect(css).toContain('width: 12px');
		expect(css).toContain('height: 12px');
		expect(css).toContain('.astryx-multi-selector-clear-icon:hover {');
		expect(css).toContain('color: var(--color-icon-primary)');
	});
});

describe('MultiSelector indicator (chevron) icon theme target', () => {
	const ICON_OPTIONS = ['Apple', 'Banana', 'Orange'];

	const getIndicatorIcon = (container: HTMLElement): HTMLElement => {
		// The chevron is the only glyph carrying the indicator target class.
		const icon = container.querySelector('.astryx-multi-selector-indicator-icon');
		if (icon == null) {
			throw new Error('indicator icon not found');
		}
		return icon as HTMLElement;
	};

	it('renders the astryx-multi-selector-indicator-icon target on the chevron glyph', async () => {
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: ICON_OPTIONS, value: [], onChange: () => {} }
		});
		// The stable theme target lands on the icon element itself (not the trigger
		// button), so a theme can restyle just this glyph (color, size, hover) —
		// and each open/closed state — via `defineTheme`. A button-level target
		// could not reach the icon's own color/size.
		const icon = getIndicatorIcon(screen.container);
		expect(icon).toHaveClass('astryx-multi-selector-indicator-icon');
		expect(icon).toHaveClass('astryx-icon');
		// Open/closed state is reflected so a theme can target each state alone.
		expect(icon).toHaveAttribute('data-state', 'collapsed');
	});

	it('reflects the expanded state on the chevron when the popover is open', async () => {
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: ICON_OPTIONS, value: [], onChange: () => {} }
		});
		await userEvent.click(screen.getByRole('combobox'));
		await vi.waitFor(() => {
			expect(getIndicatorIcon(screen.container)).toHaveAttribute('data-state', 'expanded');
		});
	});

	it('renders the default icon (inherit color, sm size) byte-identically', async () => {
		// Pixel-identical default guard: the chevron glyph must carry the exact
		// same StyleX color/size classes as a standalone inherit/sm icon. The added
		// target class + data-state are purely additive — they change nothing until
		// a theme targets them.
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: ICON_OPTIONS, value: [], onChange: () => {} }
		});
		const icon = getIndicatorIcon(screen.container);

		const refScreen = await render(Icon, {
			props: { icon: 'chevronDown', size: 'sm', color: 'inherit' }
		});
		const refIcon = refScreen.container.querySelector('.astryx-icon') as HTMLElement;

		// Exclude the additive theme-target classes (the stable target + its
		// reflected state class) so only the StyleX color/size classes remain.
		const themeTargetClasses = new Set([
			'astryx-multi-selector-indicator-icon',
			'collapsed',
			'expanded'
		]);
		const styleClasses = (el: HTMLElement) =>
			el.className
				.split(' ')
				.filter((c) => !themeTargetClasses.has(c))
				.sort();

		expect(styleClasses(icon)).toEqual(styleClasses(refIcon));
	});

	it('exposes multi-selector-indicator-icon so a theme reaches the icon size and per-state color', () => {
		// As the clear-icon generation case above: the DOM-class assertions prove
		// the target lands on the icon element, and this proves the theme emits
		// same-element rules for it — including the per-state selector.
		const theme = defineTheme({
			name: 'multi-selector-indicator-icon-test',
			components: {
				'multi-selector-indicator-icon': {
					base: { width: '14px', height: '14px', fontSize: '14px' },
					'state:expanded': { color: 'var(--color-icon-primary)' }
				}
			}
		});
		const css = generateThemeCss(theme);
		expect(css).toContain('.astryx-multi-selector-indicator-icon {');
		expect(css).toContain('width: 14px');
		expect(css).toContain('height: 14px');
		expect(css).toContain('.astryx-multi-selector-indicator-icon.expanded');
		expect(css).toContain('color: var(--color-icon-primary)');
	});
});

describe('MultiSelector search affordances', () => {
	it('renders a decorative (aria-hidden) magnifier icon whenever hasSearch is on', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana', 'Orange'],
				value: [],
				onChange: () => {},
				hasSearch: true
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		const search = screen.getByRole('combobox').element() as HTMLElement;
		// The search field is a TextInput; the magnifier is its startIcon, so it
		// sits inside the input container as a sibling of the <input>.
		const wrapper = search.parentElement;
		const magnifier = wrapper?.querySelector('.astryx-icon');
		expect(magnifier).toBeTruthy();
		expect(magnifier?.getAttribute('aria-hidden')).toBe('true');
		expect(magnifier?.getAttribute('aria-label')).toBeNull();
	});

	it('renders the clear button once a query is typed and clears + refocuses on click', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana', 'Orange'],
				value: [],
				onChange: () => {},
				hasSearch: true
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		const search = screen.getByRole('combobox');
		await userEvent.fill(search, 'ap');
		await expect.element(search).toHaveValue('ap');

		// The clear button is TextInput's built-in hasClear affordance; its name is
		// derived from the field label ("Search options").
		const clear = screen.getByRole('button', { name: 'Clear Search options' });
		await userEvent.click(clear);
		await expect.element(search).toHaveValue('');
		await expect.element(search).toHaveFocus();
	});

	it('does not render the clear button when the query is empty', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana', 'Orange'],
				value: [],
				onChange: () => {},
				hasSearch: true
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		expect(
			screen.container.querySelector('[aria-label="Clear Search options"]')
		).not.toBeInTheDocument();
	});

	it('keeps the combobox contract on the input, not the affordances', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana', 'Orange'],
				value: [],
				onChange: () => {},
				hasSearch: true
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		const search = screen.getByRole('combobox').element() as HTMLElement;
		expect(search.tagName).toBe('INPUT');
		expect(search).toHaveAttribute('aria-autocomplete', 'list');
	});

	it('tabs from the search input to the clear button (keeping the popup open) when a query is showing it', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana', 'Orange'],
				value: [],
				onChange: () => {},
				hasSearch: true
			}
		});
		const trigger = screen.getByRole('button', { name: 'Fruit' });
		await userEvent.click(trigger);
		const search = screen.getByRole('combobox');
		await userEvent.fill(search, 'ap');
		await expect.element(search).toHaveFocus();

		// Forward-tab lands on the clear (✕) button and the popup stays open, so
		// the affordance is keyboard-reachable rather than being skipped when the
		// input's Tab dismisses the popup.
		await userEvent.keyboard('{Tab}');
		await expect
			.element(screen.getByRole('button', { name: 'Clear Search options' }))
			.toHaveFocus();
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('dismisses on Tab from the search input when there is no query (no clear button)', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana', 'Orange'],
				value: [],
				onChange: () => {},
				hasSearch: true
			}
		});
		const trigger = screen.getByRole('button', { name: 'Fruit' });
		await userEvent.click(trigger);
		const search = screen.getByRole('combobox');
		// Focus moves into the search input on open (via rAF).
		await expect.element(search).toHaveFocus();

		// With no query there is no clear button, so Tab dismisses the popup as a
		// plain combobox does.
		await userEvent.keyboard('{Tab}');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});
});
