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
 * Astryx's `MultiSelector/MultiSelector.test.tsx`, ported case for case — **102
 * upstream cases** across its sixteen describe blocks (the top-level
 * `MultiSelector` and its nested `grouped search`, `result announcements`,
 * `keyboard accessibility`, `announcements`, `disabledMessage` and `form
 * participation`, then the nine top-level `MultiSelector statusVariant
 * forwarding`, `MultiSelector empty-state theme target`, `MultiSelector clear
 * icon theme target`, `MultiSelector indicator (chevron) icon theme target`,
 * `MultiSelector list structure`, `MultiSelector search affordances`,
 * `MultiSelector disabled state theme target`, `MultiSelector dropdown option
 * theme target` and `MultiSelector popup theme target`), 101 here, 1 dropped and
 * named below.
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
 * - `document.querySelector(All)` becomes `screen.container.querySelector(All)`.
 *   Nothing here portals, so the container is the tighter scope for the same
 *   node — and it keeps a stray live region or a sibling render out of a
 *   "there is exactly none of these" assertion.
 * - `generateThemeCss` is this port's counterpart to upstream's
 *   `generateThemeTestCSS` helper; both return the flat stylesheet string the
 *   `toContain` assertions read.
 *
 * RESTATED cases carry an inline comment: the four `tabIndex` assertions
 * (Svelte renders the attribute lowercase), the one `not.toBeDisabled`
 * assertion on the focusable-disabled trigger (vitest-browser's is Playwright's
 * ARIA computation, which counts `aria-disabled`, not jest-dom's
 * native-attribute one), the `blocks activation` case (Playwright refuses to
 * click an `aria-disabled` element, so the click is dispatched natively onto the
 * `onclick` handler the trigger actually carries), and the `renderOption` row
 * case (the fixture's test id is `custom-option`, not upstream's `custom-row`).
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

describe('MultiSelector empty-state theme target', () => {
	const OPTIONS = ['Apple', 'Banana', 'Cherry'];

	it('renders the astryx-multi-selector-empty-state target on the "No results found" element', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: [],
				onChange: () => {},
				hasSearch: true
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		await userEvent.fill(screen.getByRole('combobox'), 'xyz');

		await vi.waitFor(() => {
			const empty = screen.container.querySelector('.astryx-multi-selector-empty-state');
			expect(empty).not.toBeNull();
			expect(empty).toHaveTextContent('No results found');
		});
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

	it('renders the astryx-input-clear-icon target (plus the legacy alias) on the clear glyph', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ICON_OPTIONS,
				value: ['Banana'],
				onChange: () => {},
				hasClear: true
			}
		});
		// The canonical target lands on the icon element itself (not the button),
		// so a theme can restyle just this glyph (color, size, hover) via
		// `defineTheme` — a button-level target could not reach the icon's own
		// color/size. The original per-component name rides along for a
		// deprecation window.
		const icon = getClearIcon(screen.container);
		expect(icon).toHaveClass('astryx-input-clear-icon');
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

	it('routes the clear glyph through the shared clear button, keeping the legacy target', async () => {
		// The clear affordance now composes the shared InputClearButton (a ghost
		// Button with a secondary/sm glyph), so the icon carries the canonical
		// `astryx-input-clear-icon` target and — for a deprecation window — the
		// original `astryx-multi-selector-clear-icon`. Aside from those target
		// classes it matches the shared button's own `close`/`sm`/`secondary`
		// glyph exactly, so the default look is defined in one place.
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
		expect(icon).toHaveClass('astryx-input-clear-icon');
		expect(icon).toHaveClass('astryx-multi-selector-clear-icon');

		const refScreen = await render(Icon, {
			props: { icon: 'close', size: 'sm', color: 'secondary' }
		});
		const refIcon = refScreen.container.querySelector('.astryx-icon') as HTMLElement;

		const styleClasses = (el: HTMLElement) =>
			el.className
				.split(' ')
				.filter((c) => c !== 'astryx-input-clear-icon' && c !== 'astryx-multi-selector-clear-icon')
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
		expect(css).toContain('.astryx-multi-selector-clear-icon:hover');
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

	it('renders the default icon (secondary color, sm size) byte-identically', async () => {
		// Pixel-identical default guard: the chevron glyph must carry the exact
		// same StyleX color/size classes as a standalone secondary/sm icon. The
		// glyph now sets --color-icon-secondary itself rather than inheriting it
		// from a wrapper span that set the same token, so the rendered color is
		// unchanged. The added target class + data-state are purely additive —
		// they change nothing until a theme targets them.
		const screen = await render(MultiSelector, {
			props: { label: 'Fruit', options: ICON_OPTIONS, value: [], onChange: () => {} }
		});
		const icon = getIndicatorIcon(screen.container);

		const refScreen = await render(Icon, {
			props: { icon: 'chevronDown', size: 'sm', color: 'secondary' }
		});
		const refIcon = refScreen.container.querySelector('.astryx-icon') as HTMLElement;

		// Exclude the additive theme-target classes (the stable target + its
		// reflected state class) so only StyleX classes remain.
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

		// A superset, not an exact match: the chevron additionally carries the
		// rotation styles, which live on the glyph precisely so a theme can reach
		// the transform through the same selector as the color. The guard that
		// matters is that every color/size class of a standalone icon is still
		// present — i.e. the default look has not drifted.
		expect(styleClasses(icon)).toEqual(expect.arrayContaining(styleClasses(refIcon)));
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

describe('MultiSelector list structure', () => {
	it('does not draw a divider under select-all', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana', 'Orange'],
				value: [],
				onChange: () => {},
				hasSelectAll: true
			}
		});
		await userEvent.click(screen.getByRole('combobox'));
		// Select-all is the first row of the list, not a section of its own. No
		// option here declares a divider and there is no search row, so the panel
		// should contain no rule at all.
		expect(screen.container.querySelectorAll('[role="separator"]')).toHaveLength(0);
		const [first] = optionsIn(screen.container);
		expect(first).toHaveTextContent('Select all');
	});

	it('renders a section title as a plain heading inside the group, not a divider', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: [
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

		// A labeled Divider used to stand in for the heading; it rendered a
		// role="separator" as a direct child of the listbox and stacked a second
		// rule under the search row's own.
		expect(screen.container.querySelectorAll('[role="separator"]')).toHaveLength(0);

		const group = groupNamed(screen.container, 'Citrus');
		expect(group).not.toBeNull();
		const heading = (group as HTMLElement).querySelector('.astryx-multi-selector-section-heading');
		expect(heading).toBeTruthy();
		expect(heading).toHaveTextContent('Citrus');
		// The group already carries the title as its accessible name, so the
		// visible heading must not announce it a second time.
		expect(heading).toHaveAttribute('aria-hidden', 'true');
		// ...and it precedes the options it heads.
		const [firstOption] = optionsIn(group as HTMLElement);
		expect(
			(heading as HTMLElement).compareDocumentPosition(firstOption) &
				Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});
});

describe('MultiSelector search affordances', () => {
	it('renders the search row seamlessly — no nested input box, a divider under it', async () => {
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
		// The row is the outer gutter; the input sits inside the rounded field.
		const row = search.closest('.astryx-multi-selector-search');
		const field = search.parentElement;
		if (!row || !field) {
			throw new Error('search row not found');
		}
		// The panel is already a bordered surface: the field inside it must not be
		// a second bordered box (this used to render a TextInput).
		expect(row).not.toHaveClass('astryx-text-input');
		expect(search.closest('.astryx-text-input')).toBeNull();
		// The field is a rounded box inset from the panel edge, shaped like the
		// option rows under it — not a full-bleed header strip.
		expect(field).not.toBe(row);
		// ...and a divider separates it from the options.
		const separator = screen.container.querySelector('[role="separator"]');
		if (!separator) {
			throw new Error('divider not found');
		}
		// Order: row, then divider, then the listbox.
		expect(row.compareDocumentPosition(separator) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		const listbox = listboxIn(screen.container);
		expect(
			separator.compareDocumentPosition(listbox) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	it('keeps the search row outside the scrolling option list', async () => {
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
		// The options scroll under the header rather than carrying it away, so the
		// field stays reachable in a long list.
		const search = screen.getByRole('combobox').element() as HTMLElement;
		const listbox = listboxIn(screen.container);
		expect(listbox.contains(search)).toBe(false);
	});

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
		// The magnifier leads the search row, as a sibling of the <input>.
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

describe('MultiSelector disabled state theme target', () => {
	const getSelectorRoot = (container: HTMLElement): HTMLElement => {
		const root = container.querySelector('.astryx-multi-selector');
		if (root == null) {
			throw new Error('multi-selector root not found');
		}
		return root as HTMLElement;
	};

	it('reflects data-state="disabled" on the root when disabled', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana', 'Orange'],
				value: [],
				onChange: () => {},
				isDisabled: true
			}
		});
		expect(getSelectorRoot(screen.container)).toHaveAttribute('data-disabled', 'disabled');
	});

	it('omits the disabled class/attribute when enabled', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana', 'Orange'],
				value: [],
				onChange: () => {}
			}
		});
		const root = getSelectorRoot(screen.container);
		expect(root).not.toHaveAttribute('data-disabled');
		expect(root).not.toHaveClass('disabled');
	});

	it('exposes the disabled state so a theme can key on it', () => {
		const theme = defineTheme({
			name: 'multi-selector-disabled-state-test',
			components: {
				'multi-selector': {
					'disabled:disabled': { opacity: '0.4' }
				}
			}
		});
		const css = generateThemeCss(theme);
		expect(css).toContain('.astryx-multi-selector.disabled');
		expect(css).toContain('opacity: 0.4');
	});
});

describe('MultiSelector dropdown option theme target', () => {
	const ROW_OPTIONS = ['Apple', 'Banana', 'Orange'];

	it('renders astryx-multi-selector-option, with its size, on every dropdown row', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ROW_OPTIONS,
				value: [],
				onChange: () => {},
				size: 'lg' as const
			}
		});
		await userEvent.click(screen.getByRole('combobox'));
		const options = optionsIn(screen.container);
		expect(options).toHaveLength(3);
		for (const option of options) {
			expect(option).toHaveClass('astryx-multi-selector-option');
			expect(option).toHaveClass('lg');
			expect(option).toHaveAttribute('data-size', 'lg');
		}
	});

	it('carries the selected and disabled states a theme keys on', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: [
					{ value: 'apple', label: 'Apple' },
					{ value: 'banana', label: 'Banana' },
					{ value: 'orange', label: 'Orange', disabled: true }
				],
				value: ['apple'],
				onChange: () => {}
			}
		});
		await userEvent.click(screen.getByRole('combobox'));
		const [selected, plain, disabled] = optionsIn(screen.container);

		expect(selected).toHaveClass('selected');
		expect(selected).toHaveAttribute('data-selected', 'selected');
		expect(plain).not.toHaveClass('selected');
		expect(plain).not.toHaveAttribute('data-selected');

		expect(disabled).toHaveClass('disabled');
		expect(disabled).toHaveAttribute('data-disabled', 'disabled');
		expect(plain).not.toHaveAttribute('data-disabled');
	});

	it('marks the Select All row with the select-all state, not a separate target', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ROW_OPTIONS,
				value: [],
				onChange: () => {},
				hasSelectAll: true
			}
		});
		await userEvent.click(screen.getByRole('combobox'));

		const [selectAllRow, ...regularRows] = optionsIn(screen.container);
		expect(selectAllRow).toHaveTextContent('Select all');
		expect(selectAllRow).toHaveClass('astryx-multi-selector-option');
		expect(selectAllRow).toHaveClass('select-all');
		expect(selectAllRow).toHaveAttribute('data-select-all', 'select-all');

		for (const row of regularRows) {
			expect(row).toHaveClass('astryx-multi-selector-option');
			expect(row).not.toHaveClass('select-all');
			expect(row).not.toHaveAttribute('data-select-all');
		}
	});

	it('keeps the row targetable when renderOption replaces the label', async () => {
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
		const option = optionsIn(screen.container)[0];
		// The row owns the typography, so custom content inherits the same
		// treatment the fallback label gets — and one row override reaches both.
		expect(option).toHaveClass('astryx-multi-selector-option');
		// RESTATED in the test id only: the shared fixture's custom row is
		// `data-testid="custom-option"`, where upstream's inline JSX names this
		// one `custom-row`. Same node, same assertion.
		expect(option.querySelector('[data-testid="custom-option"]')).toHaveTextContent('Apple');
	});

	it('exposes the row target, its states and its size to defineTheme', () => {
		const theme = defineTheme({
			name: 'multi-selector-option-target-test',
			components: {
				'multi-selector-option': {
					base: { borderRadius: '8px', fontWeight: '600' },
					selected: { backgroundColor: 'var(--color-background-muted)' },
					'select-all': { fontWeight: '700' },
					'size:lg': { borderRadius: '12px' }
				}
			}
		});
		const css = generateThemeCss(theme);
		expect(css).toContain('.astryx-multi-selector-option {');
		expect(css).toContain('.astryx-multi-selector-option.selected');
		expect(css).toContain('.astryx-multi-selector-option.select-all');
		expect(css).toContain('.astryx-multi-selector-option.lg');
	});
});

describe('MultiSelector popup theme target', () => {
	it('puts astryx-multi-selector-popup on the surface that paints, not the list inside it', async () => {
		const screen = await render(MultiSelector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
				value: [],
				onChange: () => {}
			}
		});
		await userEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));

		const popup = screen.container.querySelector('.astryx-multi-selector-popup') as HTMLElement;
		expect(popup).not.toBeNull();
		expect(popup).toHaveClass('astryx-popover-surface');
		// The scrolling list is a descendant, not the target itself.
		expect(popup.querySelector('[role="listbox"]')).not.toBeNull();
		expect(popup.getAttribute('role')).toBeNull();

		const layer = screen.container.querySelector('[popover]') as HTMLElement;
		expect(popup).not.toBe(layer);
		expect(layer.contains(popup)).toBe(true);
	});
});
