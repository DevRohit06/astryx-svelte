import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Selector, { type SelectorProps } from '$lib/components/selector/selector.svelte';
import Icon from '$lib/components/icon/icon.svelte';
import RadioIndicator from '$lib/components/indicator/radio-indicator.svelte';
import Theme from '$lib/theme/theme.svelte';
import Fixture from './fixtures/selector-fixture.svelte';
import GroupFixture from './fixtures/selector-input-group.svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import { __resetInteractionModalityForTest } from '$lib/utils/interaction-modality.js';
import { defineTheme } from '$lib/theme/define-theme.js';
import { generateThemeCss } from '$lib/theme/generate-theme-rules.js';
import { spacingVars } from '$lib/styles/tokens.stylex.js';

/**
 * Astryx's `Selector/Selector.test.tsx` at v0.4.5, ported case for case — 124
 * upstream blocks producing **125 cases** (the last is an `it.each` with two
 * rows), **124 here**. There is no ref-callback, no `displayName` and no
 * snapshot in the file, so nothing is React-only.
 *
 * ## ONE CASE IS MISSING, and it is blocked on a port defect
 *
 * **`does not select the highlighted option on a composing Enter (IME)`**
 * (upstream `:1004`, in `describe('hasSearch')`) is NOT here. It is not
 * droppable, and it would fail if written: the search input's keydown handler in
 * `selector.svelte` has **no `isImeKeyEvent` guard**, where upstream's has
 * carried one since the case landed (`Selector.tsx:1066`). A CJK user committing
 * an IME candidate with Enter therefore selects the highlighted option instead.
 * `utils/ime.ts` is ported and exported here; it is simply not called from this
 * component. Write the case the moment the guard lands — it transcribes from
 * upstream unchanged. The same gap blocks two cases in `date-time-input` and one
 * each in `time-input` and `date-input`.
 *
 * ## The count, re-derived at the v0.4.5 pin
 *
 * This header read "123 upstream blocks … **124 cases**, 124 here, none
 * dropped" at v0.4.1 and stayed true only until the pin moved: 0.4.x added the
 * IME case above, so the header was hiding a one-case gap. The one other title
 * that differs is not a gap — upstream's `announces the empty-results message
 * when nothing matches` is here as `announces "No results found" when nothing
 * matches`, the same case reading this port's default English catalog where
 * upstream reads an `fr` override.
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
 *   `number-input.svelte.test.ts` do, and `fireEvent.keyDown` becomes a dispatched
 *   `KeyboardEvent` (`type()` below), as `number-input`'s `pressKey` does.
 * - The three JSX-children cases (a `<form>` wrapper, an RTL ancestor, a sibling
 *   Tab target) and the `renderOption` render prop go through
 *   `selector-fixture.svelte`; the two `InputGroup` cases through
 *   `selector-input-group.svelte`. A Svelte case cannot author markup children.
 * - The two `<Theme>`-wrapping cases (the radio-mark replacement, and the same
 *   replacement at `indicatorPosition="start"`) use `render`'s third argument,
 *   `{ wrapper, wrapperProps }` — `vitest-browser-svelte`'s own supported way to
 *   mount a provider around the component under test, in ONE component tree so
 *   the theme context reaches it. No fixture, and no second `mount`, which would
 *   start a fresh root and see no context at all.
 * - Upstream's six `useState` `Harness` components become `renderControlled`
 *   below: `rerender` feeds the committed value back in, synchronously.
 *
 * RESTATED cases carry an inline comment: the two `position-area` cases (the
 * browser canonicalises keyword order — see `layer.svelte.test.ts`), the four
 * `getBoundingClientRect`/`offset*` overlay cases (a real engine returns real
 * geometry, so the mock has to cover every element the hook measures), the two
 * `tabIndex` assertions (Svelte renders the attribute lowercase), the three
 * `toBeDisabled` assertions (vitest-browser's is Playwright's ARIA computation,
 * not jest-dom's native-attribute one), and the search field's `borderRadius`
 * (Chromium always resolves a computed value, so upstream's `not.toBe('')` is
 * vacuous here and would pass on a square box).
 */

const OPTIONS = ['Apple', 'Banana', 'Cherry'];

/** Mirrors useTypeahead's default resetMs — how long the typed buffer survives. */
const TYPEAHEAD_RESET_MS = 750;

function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}

/**
 * Upstream's `type(text, element)`: keydowns with no awaits between them, since
 * typeahead only accumulates while keys land inside the reset window. Cancelable,
 * so the component's `preventDefault` reads back — the `number-input` idiom.
 */
function type(text: string, element: HTMLElement): void {
	for (const key of text) {
		element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
	}
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

/** Upstream's `screen.getByRole('option', {name: /Banana/, hidden: true})`. */
function optionNamed(container: HTMLElement, label: string): HTMLElement {
	const row = optionsIn(container).find((o) => o.textContent?.includes(label));
	if (!row) throw new Error(`no option labelled "${label}"`);
	return row;
}

function selectedOptionIn(container: HTMLElement): HTMLElement {
	const row = optionsIn(container).find((o) => o.getAttribute('aria-selected') === 'true');
	if (!row) throw new Error('expected a selected option');
	return row;
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
 * Upstream's `Harness` components, which six typeahead cases need: React's
 * `useState` feeds the committed value straight back in as `value`, and without
 * that the match anchor stays at -1 for the whole case and is never exercised.
 *
 * `rerender` is the counterpart, and it is close enough to be exact:
 * `@testing-library/svelte-core` applies the new props inside a `flushSync`
 * *before* its promise resolves, so the committed value is on the trigger by the
 * time the next keystroke is dispatched — which is what React's re-render gives
 * upstream. The float is deliberate; awaiting it inside `onChange` would move the
 * commit after the keystroke.
 */
async function renderControlled(props: SelectorProps, spy?: (value: string | null) => void) {
	let commit: (value: string | null) => void = () => {};
	const onChange = (next: string | null): void => {
		spy?.(next);
		commit(next);
	};
	const screen = await render(Selector, { props: { ...props, onChange } as SelectorProps });
	commit = (next: string | null): void => {
		void screen.rerender({ value: next } as Partial<SelectorProps>);
	};
	return screen;
}

function rect({
	top,
	bottom,
	left = 0,
	right = 100,
	width = right - left,
	height = bottom - top
}: {
	top: number;
	bottom: number;
	left?: number;
	right?: number;
	width?: number;
	height?: number;
}): DOMRect {
	return {
		x: left,
		y: top,
		top,
		bottom,
		left,
		right,
		width,
		height,
		toJSON: () => ({})
	} as DOMRect;
}

/**
 * Upstream's `mockSelectorRects`, kept parameter for parameter.
 *
 * RESTATED only in its restore path: jsdom leaves `window.innerHeight` as an own
 * property, so upstream's `if (originalInnerHeight)` always fires. `Window` is a
 * `[Global]` interface, so it is an own accessor in Chromium too — but the
 * `delete` fallback is there because a missed restore would silently pin every
 * later case in the file to a 200px viewport.
 *
 * The `offsetTop`/`offsetHeight` overrides are load-bearing here in a way they
 * are not upstream: `useSelectedItemOffset` measures untransformed layout
 * geometry (#4802), and a real engine returns real values for it where jsdom
 * returns zero.
 */
function mockSelectorRects({
	anchor = rect({ top: 160, bottom: 190, height: 30 }),
	trigger = rect({ top: 160, bottom: 190, height: 30 }),
	listbox = rect({ top: 190, bottom: 310, height: 120 }),
	selectedItem = rect({ top: 220, bottom: 250, height: 30 }),
	listboxLayoutHeight = listbox.height,
	selectedItemLayoutTop = selectedItem.top - listbox.top,
	selectedItemLayoutHeight = selectedItem.height,
	viewportHeight = 200
}: {
	anchor?: DOMRect;
	trigger?: DOMRect;
	listbox?: DOMRect;
	selectedItem?: DOMRect;
	listboxLayoutHeight?: number;
	selectedItemLayoutTop?: number;
	selectedItemLayoutHeight?: number;
	viewportHeight?: number;
} = {}): () => void {
	const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
	const originalInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
	const originalOffsetTop = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop');
	const originalOffsetHeight = Object.getOwnPropertyDescriptor(
		HTMLElement.prototype,
		'offsetHeight'
	);

	HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement): DOMRect {
		if (this.classList.contains('astryx-selector')) {
			return anchor;
		}
		// The trigger is role="combobox" by default, or a plain button with
		// aria-haspopup="listbox" in hasSearch mode — match either.
		if (
			this.getAttribute('role') === 'combobox' ||
			this.getAttribute('aria-haspopup') === 'listbox'
		) {
			return trigger;
		}
		if (this.getAttribute('role') === 'listbox') {
			return listbox;
		}
		if (this.id.endsWith('-item-1')) {
			return selectedItem;
		}
		return originalGetBoundingClientRect.call(this);
	};
	Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
		configurable: true,
		get(this: HTMLElement): number {
			if (this.getAttribute('role') === 'listbox') {
				return 0;
			}
			if (this.id.endsWith('-item-1')) {
				return selectedItemLayoutTop;
			}
			return 0;
		}
	});
	Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
		configurable: true,
		get(this: HTMLElement): number {
			if (this.getAttribute('role') === 'listbox') {
				return listboxLayoutHeight;
			}
			if (this.id.endsWith('-item-1')) {
				return selectedItemLayoutHeight;
			}
			return 0;
		}
	});
	Object.defineProperty(window, 'innerHeight', { value: viewportHeight, configurable: true });

	return () => {
		HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
		if (originalOffsetTop) {
			Object.defineProperty(HTMLElement.prototype, 'offsetTop', originalOffsetTop);
		}
		if (originalOffsetHeight) {
			Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
		}
		if (originalInnerHeight) {
			Object.defineProperty(window, 'innerHeight', originalInnerHeight);
		} else {
			delete (window as unknown as Record<string, unknown>).innerHeight;
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

	it('draws the selected mark through the check indicator', async () => {
		const screen = await render(Selector, {
			props: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange: () => {} }
		});

		const selected = optionNamed(screen.container, 'Banana');
		// The default check indicator IS the glyph — no wrapper element, so the
		// host's theme target sits on the same node as astryx-icon.
		const mark = selected.querySelector('.astryx-selector-check');
		expect(mark).not.toBeNull();
		expect(mark).toHaveClass('astryx-icon');
	});

	it('lets a theme replace the mark with a radio, which draws when unselected too', async () => {
		// The point of the indicator layer: one theme entry, and every
		// single-selection mark becomes a radio — including the empty circle on
		// rows that are NOT selected, which a check-only mark never drew.
		const theme = defineTheme({
			name: 'selector-radio-mark-test',
			indicators: { check: RadioIndicator }
		});

		const screen = await render(
			Selector,
			{ props: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange: () => {} } },
			{ wrapper: Theme, wrapperProps: { theme } }
		);

		const options = optionsIn(screen.container);
		expect(options.length).toBeGreaterThan(1);

		// Every row has a radio, selected or not.
		for (const option of options) {
			expect(option.querySelector('.astryx-radio')).not.toBeNull();
		}

		// And exactly the selected one is filled.
		const filled = options.filter((o) => o.querySelector('.astryx-radio-dot') != null);
		expect(filled).toHaveLength(1);
		expect(filled[0]).toHaveTextContent('Banana');
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

	it('aligns the selected item using untransformed layout geometry', async () => {
		const restoreRects = mockSelectorRects({
			anchor: rect({ top: 160, bottom: 192, height: 32 }),
			trigger: rect({ top: 166, bottom: 186, height: 20 }),
			// Simulate the 0.95 entry scale in visual rects while retaining the
			// untransformed 120px list / 36px item offset used for positioning.
			listbox: rect({ top: 190, bottom: 304, height: 114 }),
			selectedItem: rect({ top: 224.2, bottom: 254.6, height: 30.4 }),
			listboxLayoutHeight: 120,
			selectedItemLayoutTop: 36,
			selectedItemLayoutHeight: 32,
			viewportHeight: 900
		});
		try {
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange: () => {} }
			});

			await userEvent.click(screen.getByRole('combobox'));
			await vi.waitFor(() => {
				// 68px geometric alignment plus the 1px optical correction.
				expect(popoverOf(screen.container).style.getPropertyValue('margin-block-start')).toBe(
					'-69px'
				);
			});
		} finally {
			restoreRects();
		}
	});

	it('adds the border inset only to input-variant dropdowns', async () => {
		const inputScreen = await render(Selector, {
			props: { label: 'Input fruit', options: OPTIONS, value: 'Banana', onChange: () => {} }
		});

		await userEvent.click(inputScreen.getByRole('combobox'));
		const inputDropdownClass = listboxIn(inputScreen.container).className;
		await inputScreen.unmount();

		const ghostScreen = await render(Selector, {
			props: {
				label: 'Ghost fruit',
				options: OPTIONS,
				value: 'Banana',
				variant: 'ghost',
				onChange: () => {}
			}
		});
		await userEvent.click(ghostScreen.getByRole('combobox'));
		const ghostDropdownClass = listboxIn(ghostScreen.container).className;

		// The bordered input gets one extra StyleX rule for its border-width
		// correction; the borderless ghost keeps the base menu inset.
		expect(inputDropdownClass).not.toBe(ghostDropdownClass);
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

	describe('menu clearance', () => {
		it('clears the trigger by the standard menu offset when placement is explicit', async () => {
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
			const popover = popoverOf(screen.container);
			// Both block edges, so the gap survives a position-try-fallbacks flip
			// to the opposite side (#4803).
			await vi.waitFor(() => {
				expect(popover.style.getPropertyValue('--x-marginBlockStart')).toBe(
					spacingVars['--spacing-1']
				);
			});
			expect(popover.style.getPropertyValue('--x-marginBlockEnd')).toBe(spacingVars['--spacing-1']);
		});

		it('clears the trigger in search mode', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Banana',
					onChange: () => {},
					hasSearch: true
				}
			});

			// In hasSearch mode the trigger is a plain button, not a combobox.
			await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
			const popover = popoverOf(screen.container);
			await vi.waitFor(() => {
				expect(popover.style.getPropertyValue('--x-marginBlockStart')).toBe(
					spacingVars['--spacing-1']
				);
			});
		});

		it('stays flush in the default selected-item overlay', async () => {
			const restoreRects = mockSelectorRects();
			try {
				const screen = await render(Selector, {
					props: { label: 'Fruit', options: OPTIONS, value: 'Banana', onChange: () => {} }
				});

				await userEvent.click(screen.getByRole('combobox'));
				const popover = popoverOf(screen.container);
				await vi.waitFor(() => {
					expect(popover.style.getPropertyValue('margin-block-start')).toBe('-110px');
				});
				expect(popover.style.getPropertyValue('--x-marginBlockStart')).toBe('');
				expect(popover.style.getPropertyValue('--x-marginBlockEnd')).toBe('');
			} finally {
				restoreRects();
			}
		});
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

	describe('typeahead', () => {
		const CITIES = ['Austin', 'Chicago', 'Cleveland', 'Columbus'];

		it('selects the matching option by typing on the closed trigger', async () => {
			const onChange = vi.fn();
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, onChange }
			});

			await userEvent.tab();
			await userEvent.keyboard('c');

			expect(onChange).toHaveBeenCalledWith('Cherry');
			// Native select parity: the value changes without opening the menu.
			await expect.element(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
		});

		it('cycles through options sharing a first letter on repeated presses', async () => {
			const screen = await renderControlled({
				label: 'City',
				options: CITIES,
				value: undefined
			});

			const trigger = screen.getByRole('combobox');
			await userEvent.tab();
			await userEvent.keyboard('c');
			await expect.element(trigger).toHaveTextContent('Chicago');
			await userEvent.keyboard('c');
			await expect.element(trigger).toHaveTextContent('Cleveland');
			await userEvent.keyboard('c');
			await expect.element(trigger).toHaveTextContent('Columbus');
			// Wraps back around past non-matching options.
			await userEvent.keyboard('c');
			await expect.element(trigger).toHaveTextContent('Chicago');
		});

		it('advances past the current selection on a fresh single-letter press', async () => {
			const screen = await renderControlled({
				label: 'City',
				options: CITIES,
				value: 'Chicago'
			});

			const trigger = screen.getByRole('combobox');
			await userEvent.tab();
			// Native select parity: the selected option's own initial moves on to
			// the next match. Anchoring the search AT the selection instead of after
			// it re-matches the current value, and the duplicate-select guard then
			// swallows the keystroke entirely.
			type('c', trigger.element() as HTMLElement);

			await expect.element(trigger).toHaveTextContent('Cleveland');
		});

		it('advances the highlight past the current one with the menu open', async () => {
			const screen = await render(Selector, {
				props: { label: 'City', options: CITIES, value: 'Chicago', onChange: () => {} }
			});

			const trigger = screen.getByRole('combobox');
			await userEvent.tab();
			await userEvent.keyboard('{Enter}'); // opens with the highlight on Chicago
			type('c', trigger.element() as HTMLElement);

			await vi.waitFor(() => {
				const activeId = (trigger.element() as HTMLElement).getAttribute('aria-activedescendant');
				expect(document.getElementById(activeId ?? '')).toHaveTextContent('Cleveland');
			});
		});

		it('treats a space mid-buffer as part of the match, not as open', async () => {
			const onChange = vi.fn();
			const screen = await render(Selector, {
				props: { label: 'State', options: ['New Jersey', 'New York'], onChange }
			});

			const trigger = screen.getByRole('combobox');
			await userEvent.tab();
			// Synchronous keydowns: the buffer only accumulates while keystrokes
			// land inside the TYPEAHEAD_RESET_MS window, and awaiting between them
			// would put a CI stall on the critical path.
			type('new y', trigger.element() as HTMLElement);

			expect(onChange).toHaveBeenLastCalledWith('New York');
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		});

		it('opens and seeds the search input when typing on a closed hasSearch trigger', async () => {
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, hasSearch: true }
			});

			await userEvent.tab();
			await userEvent.keyboard('c');

			const search = screen.getByPlaceholder('Search…');
			await expect.element(search).toHaveValue('c');
			await expect.element(search).toHaveFocus();
		});

		it('accumulates a multi-character prefix and resets it after the timeout', async () => {
			// Controlled: the committed value has to feed back in, or the match
			// anchor stays -1 for the whole test and never gets exercised.
			const screen = await renderControlled({
				label: 'Fruit',
				options: ['Apple', 'Banana', 'Blueberry'],
				value: undefined
			});

			const trigger = screen.getByRole('combobox');
			const triggerEl = trigger.element() as HTMLElement;
			await userEvent.tab();
			type('b', triggerEl);
			await expect.element(trigger).toHaveTextContent('Banana');
			// Within the window the buffer accumulates: "bl" → Blueberry. A
			// multi-character buffer refines, so it may keep the current match.
			type('l', triggerEl);
			await expect.element(trigger).toHaveTextContent('Blueberry');

			// Past the window the buffer starts fresh: "a" → Apple. A surviving
			// buffer would search "bla" and match nothing, so only a real reset
			// gets here — worth the one real wait in the suite.
			await new Promise((resolve) => setTimeout(resolve, TYPEAHEAD_RESET_MS + 100));
			type('a', triggerEl);
			await expect.element(trigger).toHaveTextContent('Apple');
		});

		it('skips disabled options when matching', async () => {
			const screen = await renderControlled({
				label: 'Fruit',
				options: [{ value: 'Cherry', disabled: true }, 'Coconut'],
				value: undefined
			});

			const trigger = screen.getByRole('combobox');
			const triggerEl = trigger.element() as HTMLElement;
			await userEvent.tab();
			type('c', triggerEl);
			await expect.element(trigger).toHaveTextContent('Coconut');

			// The skip has to survive cycling too: with Coconut current, the next
			// press wraps onto the disabled Cherry and must pass over it.
			type('c', triggerEl);
			await expect.element(trigger).toHaveTextContent('Coconut');
			await expect.element(trigger).not.toHaveTextContent('Cherry');
		});

		it('moves the highlight without committing when typing with the menu open', async () => {
			const onChange = vi.fn();
			const screen = await render(Selector, {
				props: { label: 'City', options: ['Austin', 'Chicago', 'Cleveland'], onChange }
			});

			await userEvent.tab();
			await userEvent.keyboard('{Enter}'); // open
			const trigger = screen.getByRole('combobox').element() as HTMLElement;

			await userEvent.keyboard('c');
			await vi.waitFor(() => {
				const activeId = trigger.getAttribute('aria-activedescendant');
				expect(document.getElementById(activeId ?? '')).toHaveTextContent('Chicago');
			});

			// Repeated press cycles the highlight, still without committing.
			await userEvent.keyboard('c');
			await vi.waitFor(() => {
				const activeId = trigger.getAttribute('aria-activedescendant');
				expect(document.getElementById(activeId ?? '')).toHaveTextContent('Cleveland');
			});
			expect(onChange).not.toHaveBeenCalled();
			// aria-activedescendant already announces each match, so announcing
			// again here would make a screen reader say every match twice.
			// useAnnounce writes its text in a rAF callback, so let a frame pass —
			// asserting before it runs would pass no matter what the code does.
			await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
			expect(politeRegion()?.textContent ?? '').toBe('');

			await userEvent.keyboard('{Enter}');
			expect(onChange).toHaveBeenCalledWith('Cleveland');
		});

		it('does not fire onChange when the only match is already selected', async () => {
			const onChange = vi.fn();
			await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, value: 'Cherry', onChange }
			});

			await userEvent.tab();
			await userEvent.keyboard('c');

			expect(onChange).not.toHaveBeenCalled();
		});

		it('ignores printable keys pressed with ctrl or meta modifiers', async () => {
			const onChange = vi.fn();
			await render(Selector, { props: { label: 'Fruit', options: OPTIONS, onChange } });

			await userEvent.tab();
			await userEvent.keyboard('{Control>}c{/Control}{Meta>}b{/Meta}');

			expect(onChange).not.toHaveBeenCalled();
		});

		it('announces the committed option to screen readers', async () => {
			await render(Selector, { props: { label: 'Fruit', options: OPTIONS, onChange: () => {} } });

			await userEvent.tab();
			await userEvent.keyboard('c');

			// The trigger keeps focus and the menu never opens, so nothing else
			// prompts a re-read. The polite live region carries the new value.
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Cherry');
			});
		});

		it('does not select while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: OPTIONS,
					onChange,
					isDisabled: true,
					disabledMessage: 'Ask an admin'
				}
			});

			// aria-disabled keeps the trigger focusable, so keydowns still arrive.
			(screen.getByRole('combobox').element() as HTMLElement).focus();
			await userEvent.keyboard('c');

			expect(onChange).not.toHaveBeenCalled();
		});

		it('cycles without duplicating changeAction while an action is pending', async () => {
			const calls: string[] = [];
			const screen = await render(Selector, {
				props: {
					label: 'City',
					options: ['Chicago', 'Cleveland', 'Columbus'],
					value: undefined,
					changeAction: async (value: string) => {
						calls.push(value);
						// Never settles, so the value prop never catches up to what the
						// trigger already shows.
						await new Promise<void>(() => {});
					}
				}
			});

			const trigger = screen.getByRole('combobox');
			await userEvent.tab();
			type('ccc', trigger.element() as HTMLElement);

			// The anchor must come from the optimistic value, not the stale prop.
			// Three options make that observable: with a stale anchor every press
			// re-matches Chicago, which the duplicate guard then swallows.
			expect(calls).toEqual(['Chicago', 'Cleveland', 'Columbus']);
		});

		it('starts a fresh buffer after selecting from the open menu', async () => {
			const onChange = vi.fn();
			await render(Selector, { props: { label: 'Animal', options: ['Cat', 'Dog'], onChange } });

			await userEvent.tab();
			await userEvent.keyboard('{Enter}'); // open
			await userEvent.keyboard('d'); // highlight Dog
			await userEvent.keyboard('{Enter}'); // commit Dog, closes
			onChange.mockClear();

			// The stale 'd' must not linger: 'c' is a fresh buffer, not "dc".
			await userEvent.keyboard('c');
			expect(onChange).toHaveBeenCalledWith('Cat');
		});

		it('starts a fresh buffer after the value is cleared', async () => {
			const onChange = vi.fn();
			const screen = await renderControlled(
				{ label: 'Animal', options: ['Cat', 'Dog'], hasClear: true, value: 'Dog' },
				onChange
			);

			const trigger = screen.getByRole('combobox').element() as HTMLElement;
			await userEvent.tab();
			// Fills the buffer with 'd' without committing — Dog is already current.
			type('d', trigger);
			trigger.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true })
			);
			expect(onChange).toHaveBeenLastCalledWith(null);

			// The stale 'd' must not survive the clear: 'c' is a fresh buffer, not
			// "dc", which would match nothing and leave the value cleared.
			type('c', trigger);
			expect(onChange).toHaveBeenLastCalledWith('Cat');
		});

		it('matches on the label and commits the value', async () => {
			const onChange = vi.fn();
			// Values deliberately crossed against labels: a native select matches
			// the rendered text and reports the value.
			const screen = await renderControlled(
				{
					label: 'Fruit',
					options: [
						{ value: 'zzz', label: 'Apple' },
						{ value: 'apple', label: 'Zebra' }
					],
					value: undefined
				},
				onChange
			);

			const trigger = screen.getByRole('combobox');
			await userEvent.tab();
			type('a', trigger.element() as HTMLElement);

			expect(onChange).toHaveBeenCalledWith('zzz');
			await expect.element(trigger).toHaveTextContent('Apple');

			// No other label starts with "a" — the option whose *value* is 'apple'
			// is labelled Zebra — so a second press stays put and commits nothing.
			type('a', trigger.element() as HTMLElement);
			expect(onChange).toHaveBeenCalledTimes(1);
		});

		it('matches across sections, ignoring dividers and group titles', async () => {
			const onChange = vi.fn();
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: [
						'Almond',
						{ type: 'divider' as const },
						{
							type: 'section' as const,
							title: 'Tropical',
							options: [
								{ value: 'mango', label: 'Mango' },
								{ value: 'papaya', label: 'Papaya' }
							]
						}
					],
					onChange
				}
			});

			const trigger = screen.getByRole('combobox').element() as HTMLElement;
			await userEvent.tab();
			type('p', trigger);
			expect(onChange).toHaveBeenCalledWith('papaya');

			// The section title "Tropical" is decoration, not an option.
			onChange.mockClear();
			type('t', trigger);
			expect(onChange).not.toHaveBeenCalled();
		});

		it('keeps aria-activedescendant on the matched option across a section', async () => {
			const screen = await render(Selector, {
				props: {
					label: 'Fruit',
					options: [
						'Almond',
						{ type: 'divider' as const },
						{
							type: 'section' as const,
							title: 'Berries',
							options: [{ value: 'blueberry', label: 'Blueberry' }]
						}
					],
					value: 'Almond',
					onChange: () => {}
				}
			});

			const trigger = screen.getByRole('combobox').element() as HTMLElement;
			await userEvent.tab();
			await userEvent.keyboard('{Enter}'); // opens on Almond
			type('b', trigger);

			await vi.waitFor(() => {
				const activeId = trigger.getAttribute('aria-activedescendant');
				expect(document.getElementById(activeId ?? '')).toHaveTextContent('Blueberry');
			});
		});

		it('anchors at the top when the value matches no option', async () => {
			const onChange = vi.fn();
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: ['Apple', 'Apricot'], value: 'Durian', onChange }
			});

			const trigger = screen.getByRole('combobox').element() as HTMLElement;
			await userEvent.tab();
			type('a', trigger);

			// Nothing is really selected, so the first match must stay reachable.
			expect(onChange).toHaveBeenCalledWith('Apple');
		});

		it('lets Space open the menu after an abandoned typeahead', async () => {
			const screen = await render(Selector, { props: { label: 'Fruit', options: OPTIONS } });

			const trigger = screen.getByRole('combobox');
			await userEvent.tab();
			await userEvent.keyboard('{Enter}'); // open
			await userEvent.keyboard('z'); // no match; buffer holds "z"
			await userEvent.keyboard('{Escape}'); // close, abandoning the buffer

			// A live "z" buffer would swallow Space as a match character.
			await userEvent.keyboard(' ');
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		});

		it('seeds every character typed before the search input takes focus', async () => {
			const screen = await render(Selector, {
				props: { label: 'Fruit', options: OPTIONS, hasSearch: true }
			});

			await userEvent.tab();
			// The popup opens on the first key, but focus only moves to the search
			// input on the next frame — the second key still lands on the trigger.
			await userEvent.keyboard('ch');

			await expect.element(screen.getByPlaceholder('Search…')).toHaveValue('ch');
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

describe('Selector empty-state theme target', () => {
	const OPTIONS = ['Apple', 'Banana', 'Cherry'];

	it('renders the astryx-selector-empty-state target on the "No results found" element', async () => {
		const screen = await render(Selector, {
			props: { label: 'Fruit', options: OPTIONS, onChange: () => {}, hasSearch: true }
		});
		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		await userEvent.fill(screen.getByRole('combobox'), 'xyz');

		await vi.waitFor(() => {
			const empty = screen.container.querySelector('.astryx-selector-empty-state');
			expect(empty).not.toBeNull();
			expect(empty).toHaveTextContent('No results found');
		});
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

	it('renders the astryx-input-clear-icon target (plus the legacy alias) on the clear glyph', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Banana',
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

	it('routes the clear glyph through the shared clear button, keeping the legacy target', async () => {
		// The clear affordance now composes the shared InputClearButton (a ghost
		// Button with a secondary/sm glyph), so the icon carries the canonical
		// `astryx-input-clear-icon` target and — for a deprecation window — the
		// original `astryx-selector-clear-icon`. Aside from those target classes
		// it matches the shared button's own `close`/`sm`/`secondary` glyph
		// exactly, so the default look is defined in one place.
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
		expect(icon).toHaveClass('astryx-input-clear-icon');
		expect(icon).toHaveClass('astryx-selector-clear-icon');

		const refScreen = await render(Icon, {
			props: { icon: 'close', size: 'sm', color: 'secondary' }
		});
		const refIcon = refScreen.container.querySelector('.astryx-icon') as HTMLElement;

		const styleClasses = (el: HTMLElement) =>
			el.className
				.split(' ')
				.filter((c) => c !== 'astryx-input-clear-icon' && c !== 'astryx-selector-clear-icon')
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
		expect(css).toContain('.astryx-selector-clear-icon:hover');
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

	it('renders the default icon (secondary color, sm size) byte-identically', async () => {
		// Pixel-identical default guard: the chevron glyph must carry the exact
		// same StyleX color/size classes as a standalone secondary/sm icon. The
		// glyph now sets --color-icon-secondary itself rather than inheriting it
		// from a wrapper span that set the same token, so the rendered color is
		// unchanged. The added target class + data-state are purely additive —
		// they change nothing until a theme targets them.
		const screen = await render(Selector, {
			props: { label: 'Fruit', options: OPTIONS, onChange: () => {} }
		});
		const icon = getIndicatorIcon(screen.container);

		const refScreen = await render(Icon, {
			props: { icon: 'chevronDown', size: 'sm', color: 'secondary' }
		});
		const refIcon = refScreen.container.querySelector('.astryx-icon') as HTMLElement;

		// Exclude the additive theme-target classes (the stable target + its
		// reflected state class) so only StyleX classes remain.
		const themeTargetClasses = new Set(['astryx-selector-indicator-icon', 'collapsed', 'expanded']);
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

describe('Selector section headings', () => {
	it('renders a section title as a plain heading inside the group, not a divider', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: [
					{
						type: 'section' as const,
						title: 'Citrus',
						options: [
							{ value: 'orange', label: 'Orange' },
							{ value: 'lemon', label: 'Lemon' }
						]
					}
				],
				value: undefined,
				onChange: () => {}
			}
		});
		await userEvent.click(screen.getByRole('combobox'));

		// A labeled Divider used to stand in for the heading; it rendered a
		// role="separator" as a direct child of the listbox and stacked a second
		// rule under the search row's own.
		expect(screen.container.querySelectorAll('[role="separator"]')).toHaveLength(0);

		const group = groupNamed(screen.container, 'Citrus');
		const heading = group?.querySelector('.astryx-selector-section-heading');
		expect(heading).toBeTruthy();
		expect(heading).toHaveTextContent('Citrus');
		// The group already carries the title as its accessible name, so the
		// visible heading must not announce it a second time.
		expect(heading).toHaveAttribute('aria-hidden', 'true');
	});
});

describe('Selector search focus ring', () => {
	// The ring is for keyboard focus only. `:focus-visible` cannot express that
	// on its own: per CSS Selectors 4 a pointer-focused text input matches it
	// too, which is why a modality gate sits alongside it. These assert the gate;
	// the painted ring is a `:has(input:focus-visible)` box-shadow the gate
	// switches on.
	//
	// Focus moves into the search input on the frame after the panel opens, and
	// the gate is read at that moment: every case must wait for the focus to
	// land before asserting or typing, or a slow frame reads the modality of
	// whatever the test did next.
	beforeEach(() => {
		__resetInteractionModalityForTest();
	});

	const fieldOf = (container: HTMLElement): HTMLElement => {
		const search = container.querySelector('[role="combobox"]');
		const field = search?.parentElement;
		if (!field) {
			throw new Error('search field not found');
		}
		return field;
	};

	it('does not ring when the panel is opened by mouse', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: undefined,
				onChange: () => {},
				hasSearch: true
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		await expect.element(screen.getByRole('combobox')).toHaveFocus();
		expect(fieldOf(screen.container)).not.toHaveAttribute('data-keyboard-focus');
	});

	it('does not ring when the query is typed after a mouse open', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: undefined,
				onChange: () => {},
				hasSearch: true
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Fruit' }));
		await expect.element(screen.getByRole('combobox')).toHaveFocus();
		await userEvent.keyboard('an');
		// Typing does not retroactively make a pointer focus a keyboard one; the
		// caret already shows where the text is going.
		expect(fieldOf(screen.container)).not.toHaveAttribute('data-keyboard-focus');
	});

	it('rings when the panel is opened from the keyboard', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: undefined,
				onChange: () => {},
				hasSearch: true
			}
		});
		await userEvent.tab();
		await userEvent.keyboard('{Enter}');
		await expect.element(screen.getByRole('combobox')).toHaveFocus();
		expect(fieldOf(screen.container)).toHaveAttribute('data-keyboard-focus', 'true');
	});
});

describe('Selector search affordances', () => {
	it('renders the search row seamlessly — no nested input box, a divider under it', async () => {
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
		// The row is the outer gutter; the input sits inside the rounded field.
		const row = search.closest('.astryx-selector-search');
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
		// RESTATED: upstream asserts `not.toBe('')`, which a real engine can never
		// return — `getComputedStyle` always resolves a used value, so the case
		// would pass on a square box. `not.toBe('0px')` is what the title claims.
		expect(getComputedStyle(field).borderRadius).not.toBe('0px');
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
		// The magnifier leads the search row, as a sibling of the <input>.
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

		// The clear button is the shared InputClearButton; its name is derived from
		// the field label ("Search options").
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

describe('Selector selected-marker theme target (selector-check)', () => {
	it('renders the astryx-selector-check target on the selected row only', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Banana',
				onChange: () => {},
				isDefaultOpen: true
			}
		});
		const options = optionsIn(screen.container);
		const selected = selectedOptionIn(screen.container);
		const check = selected.querySelector('.astryx-selector-check');
		expect(check).toBeInTheDocument();
		// The target lands on the checkmark glyph itself, so a theme can restyle or
		// hide it (e.g. to compose its own selected indicator via renderOption).
		expect(check).toHaveClass('astryx-icon');

		const unselected = options.filter((o) => o.getAttribute('aria-selected') !== 'true');
		for (const row of unselected) {
			expect(row.querySelector('.astryx-selector-check')).not.toBeInTheDocument();
		}
	});

	it('renders the default checkmark byte-identically aside from the target class', async () => {
		// The added target class is purely additive — it changes nothing about the
		// glyph's own color/size until a theme targets it.
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Banana',
				onChange: () => {},
				isDefaultOpen: true
			}
		});
		const check = selectedOptionIn(screen.container).querySelector(
			'.astryx-selector-check'
		) as HTMLElement;

		const refScreen = await render(Icon, {
			props: { icon: 'check', size: 'sm', color: 'accent' }
		});
		const refIcon = refScreen.container.querySelector('.astryx-icon') as HTMLElement;
		const styleClasses = (el: HTMLElement) =>
			el.className
				.split(' ')
				.filter((c) => c !== 'astryx-selector-check')
				.sort();
		expect(styleClasses(check)).toEqual(styleClasses(refIcon));
	});

	it('exposes selector-check so a theme can hide or restyle the marker', () => {
		const theme = defineTheme({
			name: 'selector-check-test',
			components: {
				'selector-check': {
					base: { display: 'none' }
				}
			}
		});
		const css = generateThemeCss(theme);
		expect(css).toContain('.astryx-selector-check {');
		expect(css).toContain('display: none');
	});
});

describe('Selector disabled state theme target', () => {
	const getSelectorRoot = (container: HTMLElement): HTMLElement => {
		const root = container.querySelector('.astryx-selector');
		if (root == null) {
			throw new Error('selector root not found');
		}
		return root as HTMLElement;
	};

	it('reflects data-disabled="disabled" on the root when disabled', async () => {
		const screen = await render(Selector, {
			props: { label: 'Fruit', options: OPTIONS, onChange: () => {}, isDisabled: true }
		});
		expect(getSelectorRoot(screen.container)).toHaveAttribute('data-disabled', 'disabled');
	});

	it('omits the disabled class/attribute when enabled', async () => {
		const screen = await render(Selector, {
			props: { label: 'Fruit', options: OPTIONS, onChange: () => {} }
		});
		const root = getSelectorRoot(screen.container);
		expect(root).not.toHaveAttribute('data-disabled');
		expect(root).not.toHaveClass('disabled');
	});

	it('exposes the disabled state so a theme can key on it', () => {
		const theme = defineTheme({
			name: 'selector-disabled-state-test',
			components: {
				selector: {
					'disabled:disabled': { opacity: '0.4' }
				}
			}
		});
		const css = generateThemeCss(theme);
		expect(css).toContain('.astryx-selector.disabled');
		expect(css).toContain('opacity: 0.4');
	});
});

describe('Selector indicatorPosition', () => {
	it('draws the mark after the option content by default', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Banana',
				onChange: () => {},
				isDefaultOpen: true
			}
		});
		const row = optionNamed(screen.container, 'Banana');
		const mark = row.querySelector('.astryx-selector-check')!;
		const content = row.querySelector('.astryx-selector-option')!;
		expect(content.compareDocumentPosition(mark) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it('draws the mark before the option content when set to start', async () => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Banana',
				onChange: () => {},
				indicatorPosition: 'start' as const,
				isDefaultOpen: true
			}
		});
		const row = optionNamed(screen.container, 'Banana');
		const mark = row.querySelector('.astryx-selector-check')!;
		const content = row.querySelector('.astryx-selector-option')!;
		expect(content.compareDocumentPosition(mark) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
	});

	it('reserves the mark column on every row, at either position', async () => {
		// The default check draws nothing when unchecked, so without a reserved
		// column the chosen row would be laid out differently from the rest —
		// indented at the start, truncating earlier at the end. Every row is two
		// children wide either way, so a row's geometry does not depend on whether
		// it happens to be the chosen one.
		const startScreen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Banana',
				onChange: () => {},
				indicatorPosition: 'start' as const,
				isDefaultOpen: true
			}
		});
		for (const row of optionsIn(startScreen.container)) {
			expect(row.children).toHaveLength(2);
		}
		await startScreen.unmount();

		const endScreen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: OPTIONS,
				value: 'Banana',
				onChange: () => {},
				isDefaultOpen: true
			}
		});
		for (const row of optionsIn(endScreen.container)) {
			expect(row.children).toHaveLength(2);
		}
	});

	it('positions a themed replacement indicator the same way', async () => {
		const theme = defineTheme({
			name: 'selector-start-radio-mark-test',
			indicators: { check: RadioIndicator }
		});
		const screen = await render(
			Selector,
			{
				props: {
					label: 'Fruit',
					options: OPTIONS,
					value: 'Banana',
					onChange: () => {},
					indicatorPosition: 'start' as const,
					isDefaultOpen: true
				}
			},
			{ wrapper: Theme, wrapperProps: { theme } }
		);
		for (const row of optionsIn(screen.container)) {
			const radio = row.querySelector('.astryx-radio')!;
			const content = row.querySelector('.astryx-selector-option')!;
			expect(
				content.compareDocumentPosition(radio) & Node.DOCUMENT_POSITION_PRECEDING
			).toBeTruthy();
		}
	});
});

describe('Selector popup theme target', () => {
	// The surface is the same element whether or not the popup has a search
	// field — which is the reason the target lives there. Rendered on the
	// component's own content, it would land on the listbox in one branch and
	// on a wrapper in the other, so one theme rule would style two different
	// boxes.
	it.each([
		['without search', false],
		['with search', true]
	])('puts astryx-selector-popup on the painting surface, %s', async (_label, hasSearch) => {
		const screen = await render(Selector, {
			props: {
				label: 'Fruit',
				options: ['Apple', 'Banana'],
				value: 'Apple',
				onChange: () => {},
				hasSearch: hasSearch as boolean
			}
		});
		// The trigger is a combobox in the plain variant and a listbox-popup
		// button in the search variant; the surface is the same either way.
		// RESTATED in mechanism only: upstream picks the trigger with
		// `queryByRole('combobox') ?? getByRole('button')`, which here would race
		// the search input's own (hidden, then visible) combobox role — so the
		// branch reads the parameter that decided which trigger exists.
		await userEvent.click(
			hasSearch ? screen.getByRole('button', { name: 'Fruit' }) : screen.getByRole('combobox')
		);

		const popup = screen.container.querySelector('.astryx-selector-popup');
		expect(popup).not.toBeNull();
		expect(popup).toHaveClass('astryx-popover-surface');
		expect(popup?.querySelector('[role="listbox"]')).not.toBeNull();
	});
});
