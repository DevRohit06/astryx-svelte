import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Selector from '$lib/components/selector/selector.svelte';
import Icon from '$lib/components/icon/icon.svelte';
import Fixture from './fixtures/selector-fixture.svelte';
import GroupFixture from './fixtures/selector-input-group.svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import { defineTheme } from '$lib/theme/define-theme.js';
import { generateThemeCss } from '$lib/theme/generate-theme-rules.js';

/**
 * Astryx's `Selector/Selector.test.tsx`, ported case for case — 77 upstream
 * cases across its eleven describe blocks (the top-level `Selector`, `hasClear`,
 * `hasSearch` and its two nested blocks `result announcements` and `grouped
 * search`, `keyboard accessibility`, `InputGroup integration`, `disabledMessage`
 * and `form participation`, then the four top-level `Selector statusVariant
 * forwarding`, `Selector clear icon theme target`, `Selector indicator
 * (chevron) icon theme target` and `Selector search affordances`), 77 here, none
 * dropped. There is no ref-callback and no `displayName` case in the file, so
 * nothing is React-only.
 *
 * Runs in the **client (real Chromium)** project, for the reason
 * `popover.svelte.test.ts` and `dropdown-menu.svelte.test.ts` do: the popup opens
 * through the native Popover API, and the keyboard model needs real focus.
 * Upstream's `beforeEach` stubbing `showPopover`/`hidePopover`/`:popover-open` is
 * therefore GONE — Chromium implements all three natively, and keeping the stub
 * would substitute a model of the thing under test for the thing itself. Its
 * `h = {hidden: true}` companion survives as `{ includeHidden: true }` where the
 * queried node really is inside a closed (`display: none`) popover, and as a
 * container `querySelector` where the accessibility tree would need to opt in.
 *
 * Mechanical translations, each following a pattern an earlier suite set:
 *
 * - `render` is async — always awaited.
 * - `userEvent` comes from `vitest/browser`; `fireEvent.mouseEnter/mouseLeave`
 *   become dispatched `MouseEvent`s, as the tooltip cases in
 *   `number-input.svelte.test.ts` do.
 * - The three JSX-children cases (a `<form>` wrapper, an RTL ancestor, a sibling
 *   Tab target) and the `renderOption` render prop go through
 *   `selector-fixture.svelte`; the two `InputGroup` cases through
 *   `selector-input-group.svelte`. A Svelte case cannot author markup children.
 *
 * RESTATED cases carry an inline comment: the two `position-area` cases (the
 * browser canonicalises keyword order — see `layer.svelte.test.ts`), the two
 * `getBoundingClientRect` overlay cases (a real engine returns real rects, so the
 * mock has to cover every element the hook measures), the two `tabIndex`
 * assertions (Svelte renders the attribute lowercase), and the three
 * `toBeDisabled` assertions (vitest-browser's is Playwright's ARIA computation,
 * not jest-dom's native-attribute one).
 */

const OPTIONS = ['Apple', 'Banana', 'Cherry'];

function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}

/** `position-area` keywords are order-insensitive; the engine canonicalises. */
function areaTokens(value: string): string[] {
	return value.trim().split(/\s+/).filter(Boolean).sort();
}

function listboxIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="listbox"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a role="listbox" element');
	return el;
}

function popoverOf(container: HTMLElement): HTMLElement {
	const el = listboxIn(container).closest('[popover]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a [popover] ancestor');
	return el;
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

function tooltipIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="tooltip"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a role="tooltip" element');
	return el;
}

/**
 * Upstream's `mockSelectorRects`. Restated: jsdom returns zero rects for
 * everything, so upstream only has to override the three elements it cares
 * about and everything else stays at zero. A real engine returns real rects, so
 * the override must return zero for the rest or the layer's own measurements
 * leak into the assertion — hence the explicit fallback.
 */
function rect(top: number, height: number): DOMRect {
	return {
		x: 0,
		y: top,
		top,
		bottom: top + height,
		left: 0,
		right: 100,
		width: 100,
		height,
		toJSON: () => ({})
	} as DOMRect;
}

function mockSelectorRects(): () => void {
	const original = HTMLElement.prototype.getBoundingClientRect;
	const originalInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
	HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
		// The trigger is role="combobox" by default, or a plain button with
		// aria-haspopup="listbox" in hasSearch mode — match either.
		if (
			this.getAttribute('role') === 'combobox' ||
			this.getAttribute('aria-haspopup') === 'listbox'
		) {
			return rect(160, 30);
		}
		if (this.getAttribute('role') === 'listbox') {
			return rect(190, 120);
		}
		if (this.id.endsWith('-item-1')) {
			return rect(220, 30);
		}
		return original.call(this);
	};
	Object.defineProperty(window, 'innerHeight', { value: 200, configurable: true });
	return () => {
		HTMLElement.prototype.getBoundingClientRect = original;
		if (originalInnerHeight) {
			Object.defineProperty(window, 'innerHeight', originalInnerHeight);
		}
	};
}

afterEach(() => {
	__resetLiveRegionsForTest();
	vi.restoreAllMocks();
});

describe('Selector', () => {
	it('renders with placeholder when no value', async () => {
		const screen = await render(Selector, {
			props: { label: 'Fruit', options: OPTIONS, placeholder: 'Pick one' }
		});
		await expect.element(screen.getByRole('combobox')).toHaveTextContent('Pick one');
	});

	it('renders selected value label', async () => {
		const screen = await render(Selector, {
			props: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange: () => {} }
		});
		await expect.element(screen.getByRole('combobox')).toHaveTextContent('Banana');
	});

	it('renders custom option endContent', async () => {
		const screen = await render(Fixture, {
			props: {
				variant: 'render-option',
				selector: {
					label: 'Role',
					options: [{ value: 'admin', label: 'Admin' }],
					value: undefined,
					onChange: () => {}
				}
			}
		});

		await userEvent.click(screen.getByRole('combobox'));
		await expect.element(screen.getByTestId('option-badge')).toHaveTextContent('Owner');
	});

	it('exposes the popup as a listbox, not a modal dialog', async () => {
		const screen = await render(Selector, {
			props: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange: () => {} }
		});
		// The combobox trigger keeps DOM focus; the popup must expose its own
		// role="listbox" and must not be wrapped in a role="dialog" aria-modal
		// element, which would tell AT the focused trigger is inert.
		expect(listboxIn(screen.container)).toBeInTheDocument();
		expect(screen.container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
		expect(document.querySelector('[aria-modal="true"]')).not.toBeInTheDocument();
	});

	it('supports explicit menu placement', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Banana',
				onChange: () => {},
				placement: 'above'
			}
		});
		// RESTATED: upstream matches the raw `style` string. Chromium reserialises
		// the attribute and reorders position-area keywords, so this compares the
		// parsed property as a sorted token set — the `layer.svelte.test.ts`
		// translation, and stricter (it only passes if the engine accepted it).
		expect(areaTokens(popoverOf(screen.container).style.getPropertyValue('position-area'))).toEqual(
			areaTokens('self-block-start span-self-inline-end')
		);
	});

	it('emits the direction-independent logical mapping under an RTL ancestor (#3389)', async () => {
		// The self-* position-area keywords resolve against the popover's own
		// inherited direction, so RTL emits the same string as LTR and the
		// mirroring is pure CSS.
		const screen = await render(Fixture, {
			props: {
				variant: 'rtl',
				selector: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange: () => {} }
			}
		});

		await userEvent.click(screen.getByRole('combobox'));

		// RESTATED as the placement case above — token-set comparison.
		expect(areaTokens(popoverOf(screen.container).style.getPropertyValue('position-area'))).toEqual(
			areaTokens('self-block-end span-self-inline-end')
		);
	});

	it('clamps the default selected-item overlay to the viewport', async () => {
		const restoreRects = mockSelectorRects();
		try {
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange: () => {} }
			});

			await userEvent.click(screen.getByRole('combobox'));
			await vi.waitFor(() => {
				expect(popoverOf(screen.container).style.getPropertyValue('margin-block-start')).toBe(
					'-110px'
				);
			});
		} finally {
			restoreRects();
		}
	});

	it('does not apply selected-item overlay offset when placement is explicit', async () => {
		const restoreRects = mockSelectorRects();
		try {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Banana',
					onChange: () => {},
					placement: 'above'
				}
			});

			await userEvent.click(screen.getByRole('combobox'));
			await vi.waitFor(() => {
				expect(popoverOf(screen.container).getAttribute('style')).not.toContain(
					'margin-block-start'
				);
			});
		} finally {
			restoreRects();
		}
	});

	describe('hasClear', () => {
		it('shows selected value label when hasClear is enabled', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Banana',
					onChange: () => {},
					hasClear: true
				}
			});
			await expect.element(screen.getByRole('combobox')).toHaveTextContent('Banana');
		});

		it('shows clear button when hasClear is true and value is selected', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Banana',
					onChange: () => {},
					hasClear: true
				}
			});
			await expect.element(screen.getByRole('button', { name: 'Clear Fruit' })).toBeInTheDocument();
		});

		it('does not show clear button when value is null', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: null,
					onChange: () => {},
					hasClear: true
				}
			});
			expect(screen.container.querySelector('[aria-label="Clear Fruit"]')).not.toBeInTheDocument();
		});

		it('does not show clear button when hasClear is false', async () => {
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange: () => {} }
			});
			expect(screen.container.querySelector('[aria-label="Clear Fruit"]')).not.toBeInTheDocument();
		});

		it('does not show clear button when disabled', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Banana',
					onChange: () => {},
					hasClear: true,
					isDisabled: true
				}
			});
			expect(screen.container.querySelector('[aria-label="Clear Fruit"]')).not.toBeInTheDocument();
		});

		it('calls onChange with null when clear is clicked', async () => {
			const onChange = vi.fn();
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange, hasClear: true }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Clear Fruit' }));
			expect(onChange).toHaveBeenCalledWith(null);
		});

		it('clears the value via Delete on the focused trigger', async () => {
			const onChange = vi.fn();
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange, hasClear: true }
			});
			(screen.getByRole('combobox').element() as HTMLElement).focus();
			await userEvent.keyboard('{Delete}');
			expect(onChange).toHaveBeenCalledWith(null);
		});

		it('clears the value via Backspace on the focused trigger', async () => {
			const onChange = vi.fn();
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange, hasClear: true }
			});
			(screen.getByRole('combobox').element() as HTMLElement).focus();
			await userEvent.keyboard('{Backspace}');
			expect(onChange).toHaveBeenCalledWith(null);
		});

		it('does not clear via Delete when hasClear is not set', async () => {
			const onChange = vi.fn();
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange }
			});
			(screen.getByRole('combobox').element() as HTMLElement).focus();
			await userEvent.keyboard('{Delete}');
			expect(onChange).not.toHaveBeenCalled();
		});

		it('shows placeholder after clearing', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: null,
					onChange: () => {},
					hasClear: true,
					placeholder: 'Select a fruit...'
				}
			});
			await expect.element(screen.getByRole('combobox')).toHaveTextContent('Select a fruit...');
		});

		it('renders selected label with object options and hasClear', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: [
						{ value: 'apple', label: 'Red Apple' },
						{ value: 'banana', label: 'Yellow Banana' }
					],
					value: 'banana',
					onChange: () => {},
					hasClear: true
				}
			});
			await expect.element(screen.getByRole('combobox')).toHaveTextContent('Yellow Banana');
		});
	});

	describe('hasSearch', () => {
		it('renders search input when hasSearch is true', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Apple',
					onChange: () => {},
					hasSearch: true
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			await expect.element(screen.getByRole('combobox')).toBeInTheDocument();
		});

		it('wires the search input as the combobox with activedescendant (comboboxes-4)', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Apple',
					onChange: () => {},
					hasSearch: true
				}
			});
			const triggerBtn = screen.getByRole('button', { name: 'Fruit' });
			// In hasSearch mode the trigger is a plain button, not a combobox.
			await expect.element(triggerBtn).not.toHaveAttribute('role', 'combobox');
			await userEvent.click(triggerBtn);
			const search = screen.getByRole('combobox');
			await expect.element(search).toHaveAttribute('aria-autocomplete', 'list');
			await expect.element(search).toHaveAttribute('aria-expanded', 'true');
			await expect.element(search).toHaveAttribute('aria-controls');
			// ArrowDown moves the highlight; the search input reports it via
			// aria-activedescendant (previously silent on the trigger).
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(search).toHaveAttribute('aria-activedescendant');
		});

		it('PageDown/PageUp jump the highlight to the last/first filtered option', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Apple',
					onChange: () => {},
					hasSearch: true
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			const search = screen.getByRole('combobox');
			// Filter to Apple and Banana so "last" means last *visible* option.
			await userEvent.fill(search, 'a');
			let options: HTMLElement[] = [];
			await vi.waitFor(() => {
				options = optionsIn(screen.container);
				expect(options).toHaveLength(2);
			});
			await userEvent.keyboard('{PageDown}');
			await expect
				.element(search)
				.toHaveAttribute('aria-activedescendant', options[options.length - 1].id);
			await userEvent.keyboard('{PageUp}');
			await expect.element(search).toHaveAttribute('aria-activedescendant', options[0].id);
		});

		it('Home/End move the search caret, not the option highlight', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Apple',
					onChange: () => {},
					hasSearch: true
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			// `userEvent.type`, not `fill`: this case is about the caret, and only a
			// real per-character keystroke sequence leaves it where typing would.
			const search = screen.getByRole('combobox').element() as HTMLInputElement;
			await userEvent.type(screen.getByRole('combobox'), 'an');
			await vi.waitFor(() => {
				expect(search.selectionStart).toBe(2);
			});
			const activeBefore = search.getAttribute('aria-activedescendant');
			// Home/End stay on the input for caret movement (APG editable
			// combobox); the option highlight must not move.
			await userEvent.keyboard('{Home}');
			expect(search.selectionStart).toBe(0);
			expect(search.getAttribute('aria-activedescendant')).toBe(activeBefore);
			await userEvent.keyboard('{End}');
			expect(search.selectionStart).toBe(2);
			expect(search.getAttribute('aria-activedescendant')).toBe(activeBefore);
		});

		it('does not render search input when hasSearch is false', async () => {
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, value: 'Apple', onChange: () => {} }
			});
			// hasSearch is false, so the trigger itself is the combobox and there is
			// no separate search input inside the popup.
			await userEvent.click(screen.getByRole('combobox'));
			expect(screen.container.querySelector('[role="searchbox"]')).not.toBeInTheDocument();
			expect(screen.container.querySelector('input[type="text"]')).not.toBeInTheDocument();
		});

		it('filters options by search query', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Apple',
					onChange: () => {},
					hasSearch: true
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			await userEvent.fill(screen.getByRole('combobox'), 'ban');
			await vi.waitFor(() => {
				const options = optionsIn(screen.container);
				expect(options).toHaveLength(1);
				expect(options[0]).toHaveTextContent('Banana');
			});
		});

		it('shows empty state when no options match', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Apple',
					onChange: () => {},
					hasSearch: true
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			await userEvent.fill(screen.getByRole('combobox'), 'xyz');
			await vi.waitFor(() => {
				expect(optionsIn(screen.container)).toHaveLength(0);
				// Scope to the listbox: the polite live region also announces "No
				// results found", so an unscoped query matches both.
				expect(listboxIn(screen.container)).toHaveTextContent('No results found');
			});
		});

		it('empty-state message is not exposed as a listbox child', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Apple',
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

		it('calls onChange when selecting a filtered option', async () => {
			const onChange = vi.fn();
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, value: 'Apple', onChange, hasSearch: true }
			});
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			await userEvent.fill(screen.getByRole('combobox'), 'ban');
			await vi.waitFor(() => {
				expect(optionsIn(screen.container)).toHaveLength(1);
			});
			optionsIn(screen.container)[0].click();
			expect(onChange).toHaveBeenCalledWith('Banana');
		});

		it('closes dropdown on Tab without preventing default focus movement', async () => {
			const screen = await render(Fixture, {
				props: {
					variant: 'next',
					selector: {
						label: 'Fruit',
						options: OPTIONS,
						value: 'Apple',
						onChange: () => {},
						hasSearch: true
					}
				}
			});

			// In hasSearch mode the trigger is a plain button (the popup's search
			// input is the combobox); it still owns aria-expanded.
			const trigger = screen.getByRole('button', { name: 'Fruit' });
			await userEvent.click(trigger);
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

			await userEvent.keyboard('{Tab}');
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		});

		it('uses custom search placeholder', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Apple',
					onChange: () => {},
					hasSearch: true,
					searchPlaceholder: 'Find a fruit...'
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			await expect.element(screen.getByPlaceholder('Find a fruit...')).toBeInTheDocument();
		});

		describe('result announcements', () => {
			it('announces the match count politely while searching', async () => {
				const screen = await render(Selector, {
					props: {
						label: 'Fruit',
						options: OPTIONS,
						value: 'Apple',
						onChange: () => {},
						hasSearch: true
					}
				});
				await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
				// "a" matches Apple and Banana.
				await userEvent.fill(screen.getByRole('combobox'), 'a');
				await vi.waitFor(() => {
					expect(politeRegion()).toHaveTextContent('2 results');
				});
			});

			it('announces the singular form when one option matches', async () => {
				const screen = await render(Selector, {
					props: {
						label: 'Fruit',
						options: OPTIONS,
						value: 'Apple',
						onChange: () => {},
						hasSearch: true
					}
				});
				await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
				// "ban" matches only Banana. Anchored so it cannot pass on "1 results".
				await userEvent.fill(screen.getByRole('combobox'), 'ban');
				await vi.waitFor(() => {
					expect(politeRegion()).toHaveTextContent(/^1 result$/);
				});
			});

			it('announces "No results found" when nothing matches', async () => {
				const screen = await render(Selector, {
					props: {
						label: 'Fruit',
						options: OPTIONS,
						value: 'Apple',
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
				const screen = await render(Selector, {
					props: {
						label: 'Fruit',
						options: OPTIONS,
						value: 'Apple',
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
				const screen = await render(Selector, {
					props: { label: 'Fruit', options: GROUPED, onChange: () => {}, hasSearch: true }
				});
				await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
				// "orange" only matches within the Citrus group.
				await userEvent.fill(screen.getByRole('combobox'), 'orange');

				await vi.waitFor(() => {
					expect(groupNamed(screen.container, 'Citrus')).toBeInTheDocument();
					const options = optionsIn(screen.container);
					expect(options).toHaveLength(1);
					expect(options[0]).toHaveTextContent('Orange');
				});
			});

			it('hides a group whose items have no match', async () => {
				const screen = await render(Selector, {
					props: { label: 'Fruit', options: GROUPED, onChange: () => {}, hasSearch: true }
				});
				await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
				// "berry" only matches items inside the Berries group.
				await userEvent.fill(screen.getByRole('combobox'), 'berry');

				await vi.waitFor(() => {
					expect(groupNamed(screen.container, 'Berries')).toBeInTheDocument();
					expect(groupNamed(screen.container, 'Citrus')).not.toBeInTheDocument();
					expect(optionsIn(screen.container)).toHaveLength(2);
				});
			});

			it('lands keyboard focus on the correct option after filtering', async () => {
				const screen = await render(Selector, {
					props: { label: 'Fruit', options: GROUPED, onChange: () => {}, hasSearch: true }
				});
				await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
				const search = screen.getByRole('combobox');
				// "berry" leaves Strawberry, Blueberry (in that document order).
				await userEvent.fill(search, 'berry');
				let options: HTMLElement[] = [];
				await vi.waitFor(() => {
					options = optionsIn(screen.container);
					expect(options.map((o) => o.textContent?.trim())).toEqual(['Strawberry', 'Blueberry']);
				});
				await userEvent.keyboard('{ArrowDown}');
				await expect.element(search).toHaveAttribute('aria-activedescendant', options[0].id);
				await userEvent.keyboard('{ArrowDown}');
				await expect.element(search).toHaveAttribute('aria-activedescendant', options[1].id);
			});

			it('shows the empty state when no group has a match', async () => {
				const screen = await render(Selector, {
					props: { label: 'Fruit', options: GROUPED, onChange: () => {}, hasSearch: true }
				});
				await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
				await userEvent.fill(screen.getByRole('combobox'), 'zzz');
				await vi.waitFor(() => {
					expect(optionsIn(screen.container)).toHaveLength(0);
					expect(groupNamed(screen.container, 'Citrus')).not.toBeInTheDocument();
					// Scoped to the listbox, as upstream scopes it: the polite live
					// region carries the same string.
					expect(listboxIn(screen.container)).toHaveTextContent('No results found');
				});
			});
		});
	});

	describe('keyboard accessibility', () => {
		it('trigger is focusable via Tab when enabled', async () => {
			const screen = await render(Selector, { props: { label: 'Fruit', options: OPTIONS } });

			await userEvent.tab();
			await expect.element(screen.getByRole('combobox')).toHaveFocus();
		});

		it('trigger is not focusable when disabled', async () => {
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, isDisabled: true }
			});
			// RESTATED: Svelte renders the attribute as lowercase `tabindex`.
			await expect.element(screen.getByRole('combobox')).toHaveAttribute('tabindex', '-1');
		});

		it('opens the listbox with ArrowDown from a focused trigger', async () => {
			const screen = await render(Selector, { props: { label: 'Fruit', options: OPTIONS } });

			const trigger = screen.getByRole('combobox');
			await userEvent.tab();
			await expect.element(trigger).toHaveFocus();

			await userEvent.keyboard('{ArrowDown}');
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		});

		it('End/Home jump the highlight to the last/first option (non-search)', async () => {
			const screen = await render(Selector, { props: { label: 'Fruit', options: OPTIONS } });

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

		it('opens and selects an option with Enter (no mouse)', async () => {
			const onChange = vi.fn();
			await render(Selector, { props: { label: 'Fruit', options: OPTIONS, onChange } });

			await userEvent.tab();
			await userEvent.keyboard('{Enter}'); // open
			await userEvent.keyboard('{ArrowDown}'); // move highlight
			await userEvent.keyboard('{Enter}'); // select

			expect(onChange).toHaveBeenCalled();
		});

		it('clear button is reachable by keyboard', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Apple',
					onChange: () => {},
					hasClear: true
				}
			});
			// RESTATED: lowercase `tabindex`, as above.
			await expect
				.element(screen.getByRole('button', { name: 'Clear Fruit' }))
				.not.toHaveAttribute('tabindex', '-1');
		});

		it('scrolls the highlighted option into view during arrow navigation', async () => {
			const scrollIntoView = vi.fn();
			const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
			Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
				configurable: true,
				value: scrollIntoView
			});
			try {
				const longOptions = Array.from({ length: 20 }, (_, i) => `Option ${i + 1}`);
				await render(Selector, { props: { label: 'Fruit', options: longOptions } });

				await userEvent.tab();
				await userEvent.keyboard('{Enter}'); // open
				scrollIntoView.mockClear();
				await userEvent.keyboard('{ArrowDown}'); // move highlight
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

	describe('InputGroup integration', () => {
		it('uses the group Field chrome and composes group and selector labels', async () => {
			const screen = await render(GroupFixture, {
				props: {
					group: {
						label: 'Destination',
						description: 'Where the alert should route',
						status: { type: 'error' as const, message: 'Destination is required' }
					},
					selector: {
						label: 'Channel',
						isLabelHidden: true,
						options: OPTIONS,
						placeholder: 'Choose a channel'
					}
				}
			});

			const group = screen.getByRole('group', { name: 'Destination' }).element() as HTMLElement;
			const groupLabelID = group.getAttribute('aria-labelledby');
			const trigger = screen
				.getByRole('combobox', { name: 'Destination Channel' })
				.element() as HTMLElement;
			const labelledByIDs = trigger.getAttribute('aria-labelledby')?.split(' ') ?? [];

			expect(labelledByIDs).toHaveLength(2);
			expect(labelledByIDs[0]).toBe(groupLabelID);
			expect(document.getElementById(labelledByIDs[1])).toHaveTextContent('Channel');
			expect(trigger).toHaveAttribute('aria-describedby', group.getAttribute('aria-describedby'));
			await expect.element(screen.getByText('#')).toBeInTheDocument();
		});

		it('keeps disabled reasons described when grouped', async () => {
			const screen = await render(GroupFixture, {
				props: {
					group: { label: 'Destination' },
					selector: {
						label: 'Channel',
						isLabelHidden: true,
						options: OPTIONS,
						isDisabled: true,
						disabledMessage: 'Choose a project first'
					}
				}
			});

			const trigger = screen
				.getByRole('combobox', { name: 'Destination Channel' })
				.element() as HTMLElement;
			const tooltip = tooltipIn(screen.container);

			// RESTATED: vitest-browser's `toBeDisabled` is Playwright's ARIA
			// computation, which counts `aria-disabled`; upstream's jest-dom matcher
			// reads the native attribute. The native attribute is what this pins.
			expect(trigger).not.toHaveAttribute('disabled');
			expect(trigger).toHaveAttribute('aria-disabled', 'true');
			expect(trigger.getAttribute('aria-describedby')).toContain(tooltip.id);
		});
	});

	describe('disabledMessage', () => {
		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					isDisabled: true,
					disabledMessage: 'You need the Editor role',
					'data-testid': 'fruit-selector'
				}
			});

			const container = screen.getByTestId('fruit-selector').element() as HTMLElement;
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
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const tooltip = tooltipIn(screen.container);
			await userEvent.tab();
			await expect.element(screen.getByRole('combobox')).toHaveFocus();
			await vi.waitFor(() => {
				expect(tooltip.matches(':popover-open')).toBe(true);
			});
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, disabledMessage: 'You need the Editor role' }
			});
			expect(screen.container.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, isDisabled: true }
			});
			expect(screen.container.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
		});

		it('keeps the trigger focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const trigger = screen.getByRole('combobox');
			// RESTATED: native-attribute assertion, and lowercase `tabindex`.
			await expect.element(trigger).not.toHaveAttribute('disabled');
			await expect.element(trigger).toHaveAttribute('aria-disabled', 'true');
			await expect.element(trigger).toHaveAttribute('tabindex', '0');
		});

		it('links the reason tooltip from the trigger via aria-describedby', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});
			const trigger = screen.getByRole('combobox').element() as HTMLElement;
			const tooltip = tooltipIn(screen.container);
			expect(trigger.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks activation while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					onChange,
					isDisabled: true,
					disabledMessage: 'You need the Editor role'
				}
			});

			const trigger = screen.getByRole('combobox');
			// RESTATED: Playwright refuses to click an `aria-disabled` element, so
			// the click is dispatched natively — the component's own guard is what
			// this case is about, not the driver's actionability heuristic.
			(trigger.element() as HTMLElement).click();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

			(trigger.element() as HTMLElement).focus();
			await userEvent.keyboard('{Enter}');
			await userEvent.keyboard('{ArrowDown}');
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
			expect(onChange).not.toHaveBeenCalled();
		});

		it('remains non-focusable when disabled without a reason', async () => {
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, isDisabled: true }
			});
			const trigger = screen.getByRole('combobox');
			await expect.element(trigger).toBeDisabled();
			// RESTATED: lowercase `tabindex`, as above.
			await expect.element(trigger).toHaveAttribute('tabindex', '-1');
		});
	});

	describe('form participation', () => {
		it('submits the selected value under htmlName', async () => {
			const screen = await render(Fixture, {
				props: {
					variant: 'form',
					selector: { label: 'Fruit', htmlName: 'fruit', options: OPTIONS, value: 'Banana' }
				}
			});
			const data = new FormData(screen.container.querySelector('form')!);
			expect(data.get('fruit')).toBe('Banana');
		});

		it('submits an empty string when nothing is selected', async () => {
			const screen = await render(Fixture, {
				props: {
					variant: 'form',
					selector: { label: 'Fruit', htmlName: 'fruit', options: OPTIONS }
				}
			});
			const data = new FormData(screen.container.querySelector('form')!);
			expect(data.get('fruit')).toBe('');
		});

		it('is excluded from form data when disabled', async () => {
			const screen = await render(Fixture, {
				props: {
					variant: 'form',
					selector: {
						label: 'Fruit',
						htmlName: 'fruit',
						options: OPTIONS,
						value: 'Banana',
						isDisabled: true
					}
				}
			});
			expect([...new FormData(screen.container.querySelector('form')!).keys()]).toEqual([]);
		});
	});
});

describe('Selector statusVariant forwarding', () => {
	it('defaults to attached (status renders with data-variant="attached")', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
				status: { type: 'error' as const, message: 'Required' }
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'attached'
		);
	});

	it('forwards statusVariant="detached" to the underlying Field status', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
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
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
				status: { type: 'error' as const, message: 'Required' }
			}
		});
		// Attached: the status glyph replaces the chevron indicator on the field.
		expect(screen.container.querySelector('.astryx-selector-indicator-icon')).toBeNull();
	});

	it('suppresses the on-field status icon for the detached variant', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
				status: { type: 'error' as const, message: 'Required' },
				statusVariant: 'detached' as const
			}
		});
		// Detached: the message box below carries its own leading icon, so the
		// field keeps its chevron indicator rather than duplicating the glyph.
		expect(screen.container.querySelector('.astryx-selector-indicator-icon')).not.toBeNull();
	});

	it('detaches attached status by default for the ghost variant', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
				variant: 'ghost' as const,
				status: { type: 'error' as const, message: 'Required' }
			}
		});
		expect(screen.container.querySelector('.astryx-selector')).toHaveAttribute(
			'data-variant',
			'ghost'
		);
		expect(screen.container.querySelector('.astryx-field-status')).toHaveAttribute(
			'data-variant',
			'detached'
		);
	});

	it('uses a status tooltip for ghost selectors when requested', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
				variant: 'ghost' as const,
				status: { type: 'warning' as const, message: 'Visible to all users' },
				statusVariant: 'tooltip' as const
			}
		});
		expect(screen.container.querySelector('.astryx-field-status')).toBeNull();
		const statusButton = screen
			.getByRole('button', { name: 'Warning details' })
			.element() as HTMLElement;
		const tooltip = tooltipIn(screen.container);
		expect(tooltip).toHaveTextContent('Visible to all users');
		expect(statusButton.getAttribute('aria-describedby')).toContain(tooltip.id);
		const trigger = screen.getByRole('combobox').element() as HTMLElement;
		expect(trigger.getAttribute('aria-describedby')).toContain(tooltip.id);
	});
});

describe('Selector clear icon theme target', () => {
	// Resolve the clear glyph span (the astryx-icon element inside the clear
	// button), independent of the theme target class. Scoped to the render
	// container rather than upstream's global `screen`, because the byte-identical
	// case below mounts a second, reference `Icon` into the same document.
	const getClearIcon = (container: HTMLElement): HTMLElement => {
		const button = container.querySelector('[aria-label="Clear Fruit"]');
		const icon = button?.querySelector('.astryx-icon');
		if (icon == null) {
			throw new Error('clear icon not found');
		}
		return icon as HTMLElement;
	};

	it('renders the astryx-selector-clear-icon target on the clear glyph', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Banana',
				onChange: () => {},
				hasClear: true
			}
		});
		// The stable theme target lands on the icon element itself (not the
		// button), so a theme can restyle just this glyph (color, size, hover)
		// via `defineTheme` — a button-level target could not reach the icon's
		// own color/size.
		const icon = getClearIcon(screen.container);
		expect(icon).toHaveClass('astryx-selector-clear-icon');
		expect(icon).toHaveClass('astryx-icon');
	});

	it('keeps the clear button functional alongside the target', async () => {
		const onChange = vi.fn();
		const screen = await render(Selector, {
			props: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange, hasClear: true }
		});
		const clear = screen.getByRole('button', { name: 'Clear Fruit' }).element() as HTMLElement;
		expect(clear.tagName).toBe('BUTTON');
		// RESTATED only in mechanism: upstream's `fireEvent.click` is a dispatched
		// click with no pointer sequence, which a native `.click()` is here.
		clear.click();
		expect(onChange).toHaveBeenCalledWith(null);
	});

	it('renders the default icon (secondary color, sm size) byte-identically', async () => {
		// Pixel-identical default guard: the clear glyph must carry the exact same
		// StyleX color/size classes as a standalone secondary/sm icon. The added
		// target class is purely additive — it changes nothing until a theme
		// targets it.
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Banana',
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
				.filter((c) => c !== 'astryx-selector-clear-icon')
				.sort();

		expect(styleClasses(icon)).toEqual(styleClasses(refIcon));
	});

	it('exposes selector-clear-icon so a theme reaches the icon color, size, and hover', () => {
		// The DOM-class assertion above (target lands on the icon element) plus
		// this generation assertion (the theme emits same-element icon rules in
		// `@layer astryx-theme`) together prove the seam: a same-element theme rule
		// wins over the icon's own base-layer color/size. `generateThemeCss` is
		// this port's counterpart to upstream's `generateThemeCSSFlat` — both
		// return the flat stylesheet string.
		const theme = defineTheme({
			name: 'selector-clear-icon-test',
			components: {
				'selector-clear-icon': {
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
		expect(css).toContain('.astryx-selector-clear-icon {');
		expect(css).toContain('width: 12px');
		expect(css).toContain('height: 12px');
		expect(css).toContain('.astryx-selector-clear-icon:hover {');
		expect(css).toContain('color: var(--color-icon-primary)');
	});
});

describe('Selector indicator (chevron) icon theme target', () => {
	const getIndicatorIcon = (container: HTMLElement): HTMLElement => {
		// The chevron is the only glyph carrying the indicator target class.
		const icon = container.querySelector('.astryx-selector-indicator-icon');
		if (icon == null) {
			throw new Error('indicator icon not found');
		}
		return icon as HTMLElement;
	};

	it('renders the astryx-selector-indicator-icon target on the chevron glyph', async () => {
		const screen = await render(Selector, {
			props: { label: 'Fruit', options: OPTIONS, onChange: () => {} }
		});
		// The stable theme target lands on the icon element itself (not the trigger
		// button), so a theme can restyle just this glyph (color, size, hover) —
		// and each open/closed state — via `defineTheme`. A button-level target
		// could not reach the icon's own color/size.
		const icon = getIndicatorIcon(screen.container);
		expect(icon).toHaveClass('astryx-selector-indicator-icon');
		expect(icon).toHaveClass('astryx-icon');
		// Open/closed state is reflected so a theme can target each state alone.
		expect(icon).toHaveAttribute('data-state', 'collapsed');
	});

	it('reflects the expanded state on the chevron when the popover is open', async () => {
		const screen = await render(Selector, {
			props: { label: 'Fruit', options: OPTIONS, onChange: () => {} }
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
		const screen = await render(Selector, {
			props: { label: 'Fruit', options: OPTIONS, onChange: () => {} }
		});
		const icon = getIndicatorIcon(screen.container);

		const refScreen = await render(Icon, {
			props: { icon: 'chevronDown', size: 'sm', color: 'inherit' }
		});
		const refIcon = refScreen.container.querySelector('.astryx-icon') as HTMLElement;

		// Exclude the additive theme-target classes (the stable target + its
		// reflected state class) so only the StyleX color/size classes remain.
		const themeTargetClasses = new Set(['astryx-selector-indicator-icon', 'collapsed', 'expanded']);
		const styleClasses = (el: HTMLElement) =>
			el.className
				.split(' ')
				.filter((c) => !themeTargetClasses.has(c))
				.sort();

		expect(styleClasses(icon)).toEqual(styleClasses(refIcon));
	});

	it('exposes selector-indicator-icon so a theme reaches the icon size and per-state color', () => {
		// As the clear-icon generation case above: the DOM-class assertions prove
		// the target lands on the icon element, and this proves the theme emits
		// same-element rules for it — including the per-state selector.
		const theme = defineTheme({
			name: 'selector-indicator-icon-test',
			components: {
				'selector-indicator-icon': {
					base: { width: '14px', height: '14px', fontSize: '14px' },
					'state:expanded': { color: 'var(--color-icon-primary)' }
				}
			}
		});
		const css = generateThemeCss(theme);
		expect(css).toContain('.astryx-selector-indicator-icon {');
		expect(css).toContain('width: 14px');
		expect(css).toContain('height: 14px');
		expect(css).toContain('.astryx-selector-indicator-icon.expanded');
		expect(css).toContain('color: var(--color-icon-primary)');
	});
});

describe('Selector search affordances', () => {
	it('renders a decorative (aria-hidden) magnifier icon whenever hasSearch is on', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Apple',
				onChange: () => {},
				hasSearch: true
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		const search = screen.getByRole('combobox').element() as HTMLElement;
		// The search field is a TextInput; the magnifier is its startIcon, so it
		// sits inside the input container as a sibling of the <input>.
		const container = search.parentElement;
		const magnifier = container?.querySelector('.astryx-icon');
		expect(magnifier).toBeTruthy();
		// Decorative: the icon is hidden from assistive tech and carries no name.
		expect(magnifier?.getAttribute('aria-hidden')).toBe('true');
		expect(magnifier?.getAttribute('aria-label')).toBeNull();
	});

	it('renders the clear button once a query is typed and clears + refocuses on click', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Apple',
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
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Apple',
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
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Apple',
				onChange: () => {},
				hasSearch: true
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		// Exactly one combobox — the input. The magnifier and clear button are not
		// part of the combobox contract.
		const comboboxes = screen.container.querySelectorAll('[role="combobox"]');
		expect(comboboxes).toHaveLength(1);
		expect(comboboxes[0].tagName).toBe('INPUT');
		expect(comboboxes[0]).toHaveAttribute('aria-autocomplete', 'list');
	});

	it('tabs from the search input to the clear button (keeping the popup open) when a query is showing it', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Apple',
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
});
