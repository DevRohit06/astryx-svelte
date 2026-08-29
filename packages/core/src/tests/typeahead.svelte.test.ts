import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import BaseTypeahead from '$lib/components/typeahead/base-typeahead.svelte';
import Typeahead from '$lib/components/typeahead/typeahead.svelte';
import Fixture from './fixtures/base-typeahead-fixture.svelte';
import type { SearchableItem, SearchSource } from '$lib/components/typeahead/types.js';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';

/**
 * Astryx's `Typeahead/Typeahead.test.tsx`. The 49 cases below are its **v0.3.0**
 * file ported case for case — all 49 it had then, across its twelve describe
 * blocks (`BaseTypeahead` and its nested `empty results active descendant
 * (#4059)`, `BaseTypeahead focus-out`, `Typeahead` and its nested
 * `out-of-order async results`, `Typeahead size`, `BaseTypeahead
 * hasEntriesOnFocus`, `BaseTypeahead hasSearched reset`, `BaseTypeahead
 * popover after selection`, `Typeahead edit mode`, `Typeahead collapsed input
 * tab order`, `BaseTypeahead paste behavior`, `Typeahead disabledMessage` and
 * `Typeahead statusVariant forwarding`), none dropped. There is no
 * ref-callback and no `displayName` case in the file, so nothing is
 * React-only.
 *
 * ## The count against the current pin
 *
 * **At the 0.5.0 pin upstream's file holds 56 cases in thirteen top-level
 * describe blocks; 49 are ported and 7 are not.** Two pins moved under this
 * header without it being re-derived, so the "49 upstream" it used to state was
 * false from 0.4.5 onward. The seven, in upstream's order:
 *
 * - 0.4.5, in `BaseTypeahead`: *announces the plural result count*, *speaks the
 *   result count from a provider catalog*, *exposes the empty state as a
 *   themeable target*.
 * - 0.4.5, in a thirteenth describe block this file has no counterpart for,
 *   `IME composition guard (#4828)`: *does not select the highlighted result on
 *   a composing Enter*, *does not exit edit mode on a composing Escape (IME)*.
 * - 0.5.0, in `BaseTypeahead focus-out`: *closes the list on the Tab keydown,
 *   before the blur it produces*, *Tab from the input with the list open moves
 *   focus to the next control*.
 *
 * They are **unported, not dropped** — every one has a real Svelte counterpart
 * and nothing here excuses them. Five of the seven cover behaviour that *is*
 * ported (the IME guard, the announce calls and the `typeahead-empty-state`
 * theme target are all in `base-typeahead.svelte`); the two 0.5.0 `Tab` cases
 * cover behaviour that is **not** — `handleKeyDown` has no `Tab` branch, so
 * they would fail today and the source fix is a unit of its own. 0.5.0's option
 * grouping added no upstream case at all, so there is no grouping case to port.
 *
 * (`use-typeahead.test.ts` is a different suite entirely — the type-to-select
 * hook `DropdownMenu` uses. It was renamed off this filename when the component
 * landed, and has since moved to the server project.)
 *
 * Runs in the **client (real Chromium)** project. Upstream's `beforeAll`/
 * `beforeEach` stubs for `showPopover`/`hidePopover`/`:popover-open` are
 * therefore GONE — Chromium implements all of it natively — and its
 * `h = {hidden: true}` companion survives as a container `querySelector` where
 * the node really is inside a closed (`display: none`) popover.
 *
 * Mechanical translations, each following a pattern an earlier suite set:
 *
 * - `render` is async — always awaited; `rerender` is `screen.rerender`.
 * - `fireEvent.change(input, {target: {value}})` becomes `setQuery()` below: a
 *   native value assignment plus a bubbling `input` event, which is exactly what
 *   React's synthetic `change` on a text input is. It deliberately does *not*
 *   focus, as upstream's does not.
 * - `fireEvent.focus/blur` become the real `.focus()`/`.blur()`; a blur carrying
 *   a `relatedTarget` becomes a dispatched `FocusEvent`, since only the browser
 *   can set that property on a genuine focus move.
 * - `fireEvent.keyDown(input, {key})` becomes a dispatched `KeyboardEvent`.
 *   Upstream's is a synthetic dispatch onto an input it never focused, which
 *   `userEvent.keyboard` — a real key press routed to the focused element —
 *   would not reproduce.
 * - `act()` has no counterpart — a `$state` write flushes on its own and
 *   `vi.waitFor`/`expect.element` retry.
 * - `anchorRef` is `anchorEl` (an element, not a `RefObject` — the shape
 *   `Popover` settled), so the two anchor cases go through
 *   `base-typeahead-fixture.svelte` rather than building the wrapper by hand.
 *
 * RESTATED cases carry an inline comment: the three `user.paste` cases (the
 * driver has no paste; `fill` produces the same single-input-event value
 * change), the `blocks typing` case (Playwright refuses to type into a
 * `readonly` element), the mouse-click bootstrap case (a real click *is* the
 * four-event sequence upstream synthesises), and the two native-attribute
 * assertions that replace `toBeDisabled` (vitest-browser's is Playwright's ARIA
 * computation, which counts `aria-disabled`, not jest-dom's attribute one).
 */

const fruits: SearchableItem[] = [
	{ id: '1', label: 'Apple' },
	{ id: '2', label: 'Banana' },
	{ id: '3', label: 'Cherry' },
	{ id: '4', label: 'Date' },
	{ id: '5', label: 'Elderberry' }
];

const fruitSource: SearchSource = {
	search: (query: string) =>
		fruits.filter((f) => f.label.toLowerCase().includes(query.toLowerCase())),
	bootstrap: () => fruits.slice(0, 3)
};

/** Upstream's `fireEvent.change(input, {target: {value}})`. */
function setQuery(input: HTMLInputElement, value: string): void {
	const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
	setter?.call(input, value);
	input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Upstream's `fireEvent.blur(input, {relatedTarget})`. */
function blurTo(input: HTMLInputElement, relatedTarget: Element | null): void {
	input.dispatchEvent(new FocusEvent('blur', { relatedTarget, bubbles: false }));
}

function comboboxIn(container: HTMLElement): HTMLInputElement {
	const el = container.querySelector('input[role="combobox"]');
	if (!(el instanceof HTMLInputElement)) throw new Error('expected a role="combobox" input');
	return el;
}

function optionsIn(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="option"]'));
}

function optionNamed(container: HTMLElement, text: string): HTMLElement {
	const el = optionsIn(container).find((o) => o.textContent?.trim() === text);
	if (!el) throw new Error(`no option named "${text}"`);
	return el;
}

function tooltipIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="tooltip"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a role="tooltip" element');
	return el;
}

afterEach(() => {
	__resetLiveRegionsForTest();
	vi.restoreAllMocks();
});

describe('BaseTypeahead', () => {
	it('renders input with combobox role', async () => {
		const screen = await render(BaseTypeahead, {
			props: { searchSource: fruitSource, value: null, onChange: () => {} }
		});
		expect(comboboxIn(screen.container)).toBeInTheDocument();
	});

	it('renders placeholder text', async () => {
		const screen = await render(BaseTypeahead, {
			props: {
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				placeholder: 'Pick a fruit...'
			}
		});
		await expect.element(screen.getByPlaceholder('Pick a fruit...')).toBeInTheDocument();
	});

	it('sets aria-expanded=false initially', async () => {
		const screen = await render(BaseTypeahead, {
			props: { searchSource: fruitSource, value: null, onChange: () => {} }
		});
		expect(comboboxIn(screen.container)).toHaveAttribute('aria-expanded', 'false');
	});

	it('shows results on input change', async () => {
		const screen = await render(BaseTypeahead, {
			props: { searchSource: fruitSource, value: null, onChange: () => {} }
		});
		const input = comboboxIn(screen.container);
		setQuery(input, 'App');

		await vi.waitFor(() => {
			expect(input).toHaveAttribute('aria-expanded', 'true');
		});
		expect(screen.container.querySelector('[role="listbox"]')).toBeInTheDocument();
	});

	it('announces the result count to a live region (comboboxes-6)', async () => {
		const screen = await render(BaseTypeahead, {
			props: { searchSource: fruitSource, value: null, onChange: () => {}, debounceMs: 0 }
		});
		setQuery(comboboxIn(screen.container), 'Ap');

		await vi.waitFor(() => {
			const region = document.querySelector('[data-astryx-live-region="polite"]');
			expect(region?.textContent).toMatch(/\d+ results?/);
		});
	});

	it('announces "no results found" when the search is empty (comboboxes-6)', async () => {
		const screen = await render(BaseTypeahead, {
			props: {
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				debounceMs: 0,
				emptySearchResultsText: 'No results found'
			}
		});
		setQuery(comboboxIn(screen.container), 'zzzzz');

		await vi.waitFor(() => {
			expect(document.querySelector('[data-astryx-live-region="polite"]')).toHaveTextContent(
				'No results found'
			);
		});
	});

	describe('empty results active descendant (#4059)', () => {
		it('does not set aria-activedescendant when search has 0 results', async () => {
			const screen = await render(BaseTypeahead, {
				props: { searchSource: fruitSource, value: null, onChange: () => {}, debounceMs: 0 }
			});
			const input = comboboxIn(screen.container);
			setQuery(input, 'zzzzz');

			await vi.waitFor(() => {
				expect(input).not.toHaveAttribute('aria-activedescendant');
			});

			// Press ArrowDown — should NOT set aria-activedescendant to option-0
			input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
			expect(input).not.toHaveAttribute('aria-activedescendant');

			// Press Home — should NOT set aria-activedescendant
			input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
			expect(input).not.toHaveAttribute('aria-activedescendant');
		});
	});

	it('disables input when isDisabled', async () => {
		const screen = await render(BaseTypeahead, {
			props: { searchSource: fruitSource, value: null, onChange: () => {}, isDisabled: true }
		});
		expect(comboboxIn(screen.container)).toBeDisabled();
	});

	it('uses anchorRef for dropdown positioning', async () => {
		// `anchorRef` is `anchorEl` here — an element rather than a `RefObject`, the
		// shape `Popover`'s own anchor settled.
		const anchor = document.createElement('div');
		const screen = await render(BaseTypeahead, {
			props: { searchSource: fruitSource, value: null, onChange: () => {}, anchorEl: anchor }
		});
		// Component renders without error — anchor is wired up internally
		expect(comboboxIn(screen.container)).toBeInTheDocument();
	});

	it('does not select every result when items lack ids', async () => {
		const idlessItems = [{ label: 'Alpha' }, { label: 'Beta' }] as unknown as SearchableItem[];
		const idlessSource: SearchSource = {
			search: () => idlessItems,
			bootstrap: () => idlessItems
		};

		const screen = await render(BaseTypeahead, {
			props: {
				searchSource: idlessSource,
				value: idlessItems[0],
				onChange: () => {},
				hasEntriesOnFocus: true,
				debounceMs: 0
			}
		});

		comboboxIn(screen.container).focus();

		await vi.waitFor(() => {
			expect(optionsIn(screen.container)).toHaveLength(2);
		});

		const options = optionsIn(screen.container);
		expect(options[0]).toHaveAttribute('aria-selected', 'true');
		expect(options[1]).toHaveAttribute('aria-selected', 'false');
	});
});

describe('BaseTypeahead focus-out', () => {
	it('closes the dropdown when focus leaves the input', async () => {
		const screen = await render(Fixture, {
			props: {
				variant: 'outside',
				typeahead: { searchSource: fruitSource, value: null, onChange: () => {}, debounceMs: 0 }
			}
		});
		const input = comboboxIn(screen.container);
		setQuery(input, 'App');

		await vi.waitFor(() => {
			expect(input).toHaveAttribute('aria-expanded', 'true');
		});

		// Focus moves to an element outside the field/dropdown → menu closes.
		blurTo(input, screen.getByRole('button', { name: 'Outside', exact: true }).element());

		await vi.waitFor(() => {
			expect(input).toHaveAttribute('aria-expanded', 'false');
		});
	});

	it('keeps the dropdown open when focus moves into the anchor wrapper', async () => {
		const screen = await render(Fixture, {
			props: {
				variant: 'anchor',
				typeahead: { searchSource: fruitSource, value: null, onChange: () => {}, debounceMs: 0 }
			}
		});
		const input = comboboxIn(screen.container);
		setQuery(input, 'App');

		await vi.waitFor(() => {
			expect(input).toHaveAttribute('aria-expanded', 'true');
		});

		// A sibling control inside the field (e.g. a clear button) receives focus.
		blurTo(input, screen.getByRole('button', { name: 'Sibling', exact: true }).element());

		// Menu stays open because focus is still within the field.
		expect(input).toHaveAttribute('aria-expanded', 'true');
	});

	it('does not close when a dropdown option receives focus', async () => {
		const screen = await render(BaseTypeahead, {
			props: { searchSource: fruitSource, value: null, onChange: () => {}, debounceMs: 0 }
		});
		const input = comboboxIn(screen.container);
		setQuery(input, 'App');

		await vi.waitFor(() => {
			expect(input).toHaveAttribute('aria-expanded', 'true');
		});

		blurTo(input, optionsIn(screen.container)[0]);

		expect(input).toHaveAttribute('aria-expanded', 'true');
	});
});

describe('Typeahead', () => {
	describe('out-of-order async results', () => {
		it('discards a stale response that resolves after a newer query', async () => {
			const resolvers = new Map<string, (items: SearchableItem[]) => void>();
			const rawSource: SearchSource = {
				search: async (query: string) =>
					new Promise<SearchableItem[]>((resolve) => {
						resolvers.set(query, resolve);
					}),
				bootstrap: () => []
			};

			const screen = await render(Typeahead, {
				props: {
					label: 'Fruit',
					searchSource: rawSource,
					value: null,
					onChange: () => {},
					debounceMs: 0
				}
			});

			const input = comboboxIn(screen.container);
			setQuery(input, 'a');
			setQuery(input, 'ap');

			// The newer query resolves first…
			await vi.waitFor(() => {
				expect(resolvers.get('ap')).toBeDefined();
			});
			resolvers.get('ap')!([{ id: 'apple', label: 'Apple' }]);
			await vi.waitFor(() => {
				expect(screen.container).toHaveTextContent('Apple');
			});

			// …then the abandoned query's slow response arrives and must be
			// discarded rather than overwriting the current results.
			resolvers.get('a')!([
				{ id: 'avocado', label: 'Avocado' },
				{ id: 'apricot', label: 'Apricot' }
			]);
			await vi.waitFor(() => {
				expect(screen.container).toHaveTextContent('Apple');
			});
			expect(screen.container).not.toHaveTextContent('Avocado');
		});
	});

	it('renders with label', async () => {
		const screen = await render(Typeahead, {
			props: { label: 'Fruit', searchSource: fruitSource, value: null, onChange: () => {} }
		});
		await expect.element(screen.getByLabelText('Fruit', { exact: true })).toBeInTheDocument();
	});

	it('renders description text', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Fruit',
				description: 'Pick your favorite fruit',
				searchSource: fruitSource,
				value: null,
				onChange: () => {}
			}
		});
		await expect
			.element(screen.getByText('Pick your favorite fruit', { exact: true }))
			.toBeInTheDocument();
	});

	it('shows required indicator', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Fruit',
				isRequired: true,
				searchSource: fruitSource,
				value: null,
				onChange: () => {}
			}
		});
		await expect.element(screen.getByText(/Required/)).toBeInTheDocument();
	});

	it('renders error status message', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Fruit',
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				status: { type: 'error' as const, message: 'Selection required' }
			}
		});
		await expect
			.element(screen.getByText('Selection required', { exact: true }))
			.toBeInTheDocument();
	});

	it('shows selected value as a token', async () => {
		const screen = await render(Typeahead, {
			props: { label: 'Fruit', searchSource: fruitSource, value: fruits[0], onChange: () => {} }
		});
		await expect.element(screen.getByText(fruits[0].label, { exact: true })).toBeInTheDocument();
	});

	it('shows clear button when hasClear and value is selected', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Fruit',
				searchSource: fruitSource,
				value: fruits[0],
				onChange: () => {},
				hasClear: true
			}
		});
		await expect
			.element(screen.getByRole('button', { name: 'Clear selection', exact: true }))
			.toBeInTheDocument();
	});

	it('does not show clear button when hasClear is false', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Fruit',
				searchSource: fruitSource,
				value: fruits[0],
				onChange: () => {},
				hasClear: false
			}
		});
		expect(
			screen.container.querySelector('[aria-label="Clear selection"]')
		).not.toBeInTheDocument();
	});

	it('calls onChange with null when clear button is clicked', async () => {
		const onChange = vi.fn();
		const screen = await render(Typeahead, {
			props: {
				label: 'Fruit',
				searchSource: fruitSource,
				value: fruits[0],
				onChange,
				hasClear: true
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Clear selection', exact: true }));
		expect(onChange).toHaveBeenCalledWith(null);
	});

	it('renders with data-testid', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Fruit',
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				'data-testid': 'my-typeahead'
			}
		});
		await expect.element(screen.getByTestId('my-typeahead')).toBeInTheDocument();
	});
});

describe('Typeahead size', () => {
	it('renders with size="lg"', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Fruit',
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				size: 'lg' as const
			}
		});
		await expect.element(screen.getByLabelText('Fruit', { exact: true })).toBeInTheDocument();
	});
});

describe('BaseTypeahead hasEntriesOnFocus', () => {
	it('shows bootstrap results on mouse click', async () => {
		const screen = await render(BaseTypeahead, {
			props: {
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				hasEntriesOnFocus: true,
				debounceMs: 0
			}
		});
		const input = comboboxIn(screen.container);

		// RESTATED: a real click *is* the pointerdown → focus → pointerup → click
		// sequence upstream has to synthesise one `fireEvent` at a time.
		await userEvent.click(input);

		await vi.waitFor(() => {
			expect(input).toHaveAttribute('aria-expanded', 'true');
		});
	});

	it('shows bootstrap results on keyboard focus', async () => {
		const screen = await render(BaseTypeahead, {
			props: {
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				hasEntriesOnFocus: true,
				debounceMs: 0
			}
		});
		const input = comboboxIn(screen.container);

		// Keyboard focus — no pointer events
		input.focus();

		await vi.waitFor(() => {
			expect(input).toHaveAttribute('aria-expanded', 'true');
		});
	});

	it('re-shows results on refocus when results already exist', async () => {
		const screen = await render(BaseTypeahead, {
			props: {
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				hasEntriesOnFocus: true,
				debounceMs: 0
			}
		});
		const input = comboboxIn(screen.container);

		// Initial focus to load bootstrap results
		input.focus();
		await vi.waitFor(() => {
			expect(input).toHaveAttribute('aria-expanded', 'true');
		});

		// Blur to close, then refocus
		input.blur();
		input.focus();

		await vi.waitFor(() => {
			expect(input).toHaveAttribute('aria-expanded', 'true');
		});
	});
});

describe('BaseTypeahead hasSearched reset', () => {
	it('does not show "No results found" after selecting an item and re-entering', async () => {
		const onChange = vi.fn();
		const screen = await render(BaseTypeahead, {
			props: { searchSource: fruitSource, value: null, onChange, debounceMs: 0 }
		});
		const input = comboboxIn(screen.container);

		// Type a query that returns results
		setQuery(input, 'Apple');
		await vi.waitFor(() => {
			expect(optionsIn(screen.container)).toHaveLength(1);
		});

		// Select the item
		optionNamed(screen.container, 'Apple').click();
		expect(onChange).toHaveBeenCalledWith(fruits[0]);

		// Re-render with the selected value
		await screen.rerender({ searchSource: fruitSource, value: fruits[0], onChange, debounceMs: 0 });

		// Focus the input again — "No results found" should NOT appear
		input.focus();

		// The empty state text should not be visible since hasSearched was reset
		expect(screen.container).not.toHaveTextContent('No results found');
	});

	it('resets hasSearched when query is cleared without hasEntriesOnFocus', async () => {
		const screen = await render(BaseTypeahead, {
			props: { searchSource: fruitSource, value: null, onChange: () => {}, debounceMs: 0 }
		});
		const input = comboboxIn(screen.container);

		// Type a query that returns no results
		setQuery(input, 'xyz');
		await vi.waitFor(() => {
			expect(screen.container).toHaveTextContent('No results found');
		});

		// Clear the query
		setQuery(input, '');

		// "No results found" should disappear since hasSearched is reset
		await vi.waitFor(() => {
			expect(screen.container).not.toHaveTextContent('No results found');
		});
	});
});

describe('BaseTypeahead popover after selection', () => {
	it('does not show an empty popover after selecting an item with hasEntriesOnFocus', async () => {
		const onChange = vi.fn();
		const screen = await render(BaseTypeahead, {
			props: {
				searchSource: fruitSource,
				value: null,
				onChange,
				hasEntriesOnFocus: true,
				debounceMs: 0
			}
		});
		const input = comboboxIn(screen.container);

		// Focus to open bootstrap results
		input.focus();
		await vi.waitFor(() => {
			expect(input).toHaveAttribute('aria-expanded', 'true');
		});

		// Select an item — popover should close
		optionNamed(screen.container, 'Apple').click();
		expect(onChange).toHaveBeenCalledWith(fruits[0]);

		// After selection, input is refocused but popover should NOT reopen with an
		// empty menu. The focus handler should be suppressed.
		await vi.waitFor(() => {
			expect(input).toHaveAttribute('aria-expanded', 'false');
		});
	});
});

describe('Typeahead edit mode', () => {
	it('enters edit mode on token container click', async () => {
		const onChange = vi.fn();
		const screen = await render(Typeahead, {
			props: { label: 'Fruit', searchSource: fruitSource, value: fruits[0], onChange }
		});

		// Click the token to enter edit mode. Upstream reaches it with
		// `getByText(label).closest('div')`; the stable `astryx-token` class is the
		// same element by a name that cannot drift with the markup.
		(screen.container.querySelector('.astryx-token') as HTMLElement).click();

		// onChange should NOT have been called (value is preserved for restore)
		expect(onChange).not.toHaveBeenCalled();
	});

	it('restores token on blur without action', async () => {
		const onChange = vi.fn();
		const screen = await render(Typeahead, {
			props: { label: 'Fruit', searchSource: fruitSource, value: fruits[0], onChange }
		});
		const input = comboboxIn(screen.container);

		// Enter edit mode
		(screen.container.querySelector('.astryx-token') as HTMLElement).click();

		// Blur without selecting anything
		input.blur();

		// onChange should not have been called — value restored
		expect(onChange).not.toHaveBeenCalled();
	});
});

describe('Typeahead collapsed input tab order', () => {
	it('removes the invisible input from the Tab order while a token is shown', async () => {
		const screen = await render(Typeahead, {
			props: { label: 'Fruit', searchSource: fruitSource, value: fruits[0], onChange: () => {} }
		});
		// While the token is shown the input is collapsed (width 0 / opacity 0); it
		// must stay programmatically focusable for token interactions but must not
		// be an invisible Tab stop (WCAG 2.4.3 / 2.4.7).
		expect(comboboxIn(screen.container)).toHaveAttribute('tabindex', '-1');
	});

	it('Tab from the token skips the invisible input', async () => {
		const screen = await render(Typeahead, {
			props: { label: 'Fruit', searchSource: fruitSource, value: fruits[0], onChange: () => {} }
		});
		// Focus the token's internal button, then Tab away — focus must not land on
		// the visually hidden combobox input.
		screen.getByRole('button', { name: fruits[0].label, exact: true }).element().focus();
		await userEvent.tab();
		expect(comboboxIn(screen.container)).not.toHaveFocus();
	});

	it('keeps the input in the Tab order when no token is shown', async () => {
		const screen = await render(Typeahead, {
			props: { label: 'Fruit', searchSource: fruitSource, value: null, onChange: () => {} }
		});
		expect(comboboxIn(screen.container)).not.toHaveAttribute('tabindex');
	});

	it('restores the input to the Tab order in edit mode', async () => {
		const screen = await render(Typeahead, {
			props: { label: 'Fruit', searchSource: fruitSource, value: fruits[0], onChange: () => {} }
		});
		// Entering edit mode removes the token and uncollapses the input. Upstream
		// reaches the token with `getByText(label).closest('div')`; the stable
		// `astryx-token` class is the same element, as in `Typeahead edit mode`.
		(screen.container.querySelector('.astryx-token') as HTMLElement).click();

		await vi.waitFor(() => {
			expect(comboboxIn(screen.container)).not.toHaveAttribute('tabindex');
		});
	});
});

describe('BaseTypeahead paste behavior', () => {
	it('pasting text triggers search results like typing', async () => {
		const screen = await render(BaseTypeahead, {
			props: { searchSource: fruitSource, value: null, onChange: () => {}, debounceMs: 0 }
		});

		// RESTATED: vitest-browser's driver has no `paste`; `fill` sets the value in
		// a single input event, which is what a paste produces.
		await userEvent.fill(comboboxIn(screen.container), 'App');

		await vi.waitFor(() => {
			expect(screen.container).toHaveTextContent('Apple');
		});
	});

	it('pasting non-matching text shows no results', async () => {
		const screen = await render(BaseTypeahead, {
			props: { searchSource: fruitSource, value: null, onChange: () => {}, debounceMs: 0 }
		});

		// RESTATED as above.
		await userEvent.fill(comboboxIn(screen.container), 'xyz');

		await vi.waitFor(() => {
			expect(screen.container).toHaveTextContent('No results found');
		});
	});

	it('scrolls the highlighted option into view during arrow navigation', async () => {
		const scrollIntoView = vi.fn();
		const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			configurable: true,
			value: scrollIntoView
		});
		try {
			const screen = await render(BaseTypeahead, {
				props: { searchSource: fruitSource, value: null, onChange: () => {}, debounceMs: 0 }
			});

			const input = comboboxIn(screen.container);
			// RESTATED as above — `fill` in place of `paste`.
			await userEvent.fill(input, 'e'); // matches multiple fruits, opens listbox
			await vi.waitFor(() => {
				expect(input).toHaveAttribute('aria-expanded', 'true');
			});

			scrollIntoView.mockClear();
			await userEvent.keyboard('{ArrowDown}');
			await userEvent.keyboard('{ArrowDown}');

			await vi.waitFor(() => {
				expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
			});
		} finally {
			if (original) {
				Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', original);
			}
		}
	});
});

describe('Typeahead disabledMessage', () => {
	it('shows the reason tooltip on hover when disabled with a reason', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Assignee',
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				isDisabled: true,
				disabledMessage: 'You need the Editor role'
			}
		});

		const container = comboboxIn(screen.container).parentElement as HTMLElement;
		const tooltip = tooltipIn(screen.container);
		expect(tooltip).toHaveTextContent('You need the Editor role');

		container.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
		await vi.waitFor(() => {
			expect(tooltip.matches(':popover-open')).toBe(true);
		});

		container.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
		await vi.waitFor(() => {
			expect(tooltip.matches(':popover-open')).toBe(false);
		});
	});

	it('shows the reason tooltip on keyboard focus', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Assignee',
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				isDisabled: true,
				disabledMessage: 'You need the Editor role'
			}
		});

		const tooltip = tooltipIn(screen.container);
		await userEvent.tab();
		expect(comboboxIn(screen.container)).toHaveFocus();
		await vi.waitFor(() => {
			expect(tooltip.matches(':popover-open')).toBe(true);
		});
	});

	it('does not render a tooltip when not disabled', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Assignee',
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				disabledMessage: 'You need the Editor role'
			}
		});
		expect(screen.container.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
	});

	it('does not render a tooltip when disabled without a reason', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Assignee',
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				isDisabled: true
			}
		});
		expect(screen.container.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
	});

	it('keeps the input focusable via aria-disabled when a reason is provided', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Assignee',
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				isDisabled: true,
				disabledMessage: 'You need the Editor role'
			}
		});
		const input = comboboxIn(screen.container);
		// RESTATED: native-attribute assertion — vitest-browser's `toBeDisabled` is
		// Playwright's ARIA computation, which counts `aria-disabled`.
		expect(input).not.toHaveAttribute('disabled');
		expect(input).toHaveAttribute('aria-disabled', 'true');
		expect(input).toHaveAttribute('readonly');
	});

	it('links the reason tooltip from the input via aria-describedby', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Assignee',
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				isDisabled: true,
				disabledMessage: 'You need the Editor role'
			}
		});
		const input = comboboxIn(screen.container);
		const tooltip = tooltipIn(screen.container);
		expect(input.getAttribute('aria-describedby')).toContain(tooltip.id);
	});

	it('blocks typing and selection while focusable-disabled', async () => {
		const onChange = vi.fn();
		const screen = await render(Typeahead, {
			props: {
				label: 'Assignee',
				searchSource: fruitSource,
				value: null,
				onChange,
				isDisabled: true,
				disabledMessage: 'You need the Editor role'
			}
		});

		const input = comboboxIn(screen.container);
		// RESTATED: the input is `readonly`, and Playwright refuses to `fill`/`type`
		// into a non-editable element. Focusing and pressing keys is the same user
		// action without the driver's editability precondition — and it is the
		// browser's own readonly handling that must swallow the text, which is what
		// the case is about.
		input.focus();
		await userEvent.keyboard('App');
		expect(input).toHaveValue('');
		expect(input).toHaveAttribute('aria-expanded', 'false');
		expect(onChange).not.toHaveBeenCalled();
	});

	it('remains natively disabled when disabled without a reason', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Assignee',
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				isDisabled: true
			}
		});
		const input = comboboxIn(screen.container);
		expect(input).toBeDisabled();
		expect(input).not.toHaveAttribute('aria-disabled');
	});
});

describe('Typeahead statusVariant forwarding', () => {
	it('defaults to attached (status renders with data-variant="attached")', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Fruit',
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				status: { type: 'error', message: 'Required' }
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'attached'
		);
	});

	it('forwards statusVariant="detached" to the underlying Field status', async () => {
		const screen = await render(Typeahead, {
			props: {
				label: 'Fruit',
				searchSource: fruitSource,
				value: null,
				onChange: () => {},
				status: { type: 'error', message: 'Required' },
				statusVariant: 'detached'
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'detached'
		);
	});
});
