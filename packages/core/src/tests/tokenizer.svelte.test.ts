import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import Tokenizer from '$lib/components/tokenizer/tokenizer.svelte';
import Fixture from './fixtures/tokenizer-fixture.svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import type { SearchSource, SearchableItem } from '$lib/components/typeahead/types.js';

/**
 * Astryx's `Tokenizer/Tokenizer.test.tsx`, ported case for case — 61 upstream
 * cases at the 0.5.0 pin across its ten describe blocks (the top-level `Tokenizer`,
 * `tokenOverflowBehavior`, `hasCreate`, `popover after selection`, `paste
 * behavior`, `startIcon`, `disabledMessage`, `announcements` and `form
 * participation`, plus the separate top-level `Tokenizer statusVariant
 * forwarding` and `Tokenizer disabled theme state`), 61 here, none dropped.
 * There is no `displayName` case in the file.
 *
 * v0.3.0 → v0.4.1 added the two `Tokenizer disabled theme state` cases (the
 * root now reflects `disabled` through `themeProps`); both are ported verbatim.
 * They query `.astryx-tokenizer` with `querySelector`, as upstream does — this
 * port spreads the one derived `themeProps` object onto BOTH render branches
 * (the inline wrapper and the layer placeholder), so the first match carries the
 * state whichever branch is live.
 *
 * Two cases change shape rather than being dropped, because the seam they test
 * is a different one here:
 *
 * - `forwards ref to the root field element` is an **attachment counterpart**.
 *   `Tokenizer` has no `ref` prop; rest props reach `Field`'s root, so an
 *   attachment travelling through them lands on the same `.astryx-field` div,
 *   and it receives the element rather than only proving a call.
 * - `exposes focus control through handleRef` goes through **`bind:this`**.
 *   Svelte's counterpart to `useImperativeHandle` is the component instance, so
 *   `focus()`/`blur()` are instance exports; the harness reaches them as
 *   `screen.component.focus()`, the shape `layer.svelte.test.ts` uses.
 *
 * Runs in the **client (real Chromium)** project. Upstream's `beforeAll` stubs
 * for `ResizeObserver`, `showPopover`/`hidePopover` and `:popover-open` are
 * therefore GONE — Chromium implements all four natively — so the two cases that
 * asserted `expect(HTMLElement.prototype.showPopover).toHaveBeenCalled()` assert
 * the popover's real `:popover-open` state instead, which is what the spy stood
 * in for.
 *
 * Mechanical translations, each following a pattern an earlier suite set:
 *
 * - `render` is async — always awaited.
 * - `fireEvent.change(input, {target: {value}})` becomes `setQuery()` below, as
 *   in `typeahead.svelte.test.ts`.
 * - `fireEvent.focusIn/focusOut` become dispatched bubbling `FocusEvent`s — only
 *   the browser can set `relatedTarget` on a genuine focus move.
 * - `act()` has no counterpart — a `$state` write flushes on its own and
 *   `vi.waitFor`/`expect.element` retry.
 * - The two `<form>` cases, the RTL ancestor and the snippet `startIcon` go
 *   through `tokenizer-fixture.svelte`; a Svelte case cannot author markup
 *   children or a snippet.
 * - `startIcon` is `IconName | Snippet` here where upstream's is
 *   `ReactNode | IconType`, so its three cases become **counterparts** on the
 *   matching arms: the `ReactNode` case passes a snippet, the `IconType` case
 *   passes a registry `IconName`. Both still assert on the rendered `<svg>` and
 *   its document position, which is what upstream's assertions check.
 * - The six `announcements` cases read the shared polite live region exactly as
 *   upstream does, through `[data-astryx-live-region="polite"]`, and
 *   `__resetLiveRegionsForTest()` runs in `afterEach`. The region auto-clears
 *   ~2s after announcing, so every assertion on it is a short `vi.waitFor`
 *   rather than a long settle.
 *
 * RESTATED cases carry an inline comment: the two `user.paste` cases (the driver
 * has no paste; `fill` produces the same single-input-event value change), the
 * `not.toBeDisabled` assertion on the focusable-disabled input
 * (vitest-browser's is Playwright's ARIA computation, which counts
 * `aria-disabled`), and the `[data-overflow-list]` probe (this port marks the
 * list with `themeProps`' stable `astryx-overflow-list` class, not a data
 * attribute). `blocks input while focusable-disabled` keeps upstream's own
 * `input.focus()` + `user.keyboard('Ali')` verbatim — its inline comment records
 * only why `fill`/`type` could not be substituted for them.
 */

const users: SearchableItem[] = [
	{ id: '1', label: 'Alice' },
	{ id: '2', label: 'Bob' },
	{ id: '3', label: 'Charlie' },
	{ id: '4', label: 'Diana' }
];

const userSource: SearchSource = {
	search: (query: string) =>
		users.filter((u) => u.label.toLowerCase().includes(query.toLowerCase())),
	bootstrap: () => users.slice(0, 3)
};

const emptySource: SearchSource = {
	search: () => [],
	bootstrap: () => []
};

/** Upstream's `fireEvent.change(input, {target: {value}})`. */
function setQuery(input: HTMLInputElement, value: string): void {
	const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
	setter?.call(input, value);
	input.dispatchEvent(new Event('input', { bubbles: true }));
}

function comboboxIn(container: HTMLElement): HTMLInputElement {
	const el = container.querySelector('input[role="combobox"]');
	if (!(el instanceof HTMLInputElement)) throw new Error('expected a combobox input');
	return el;
}

function tooltipIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="tooltip"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a role="tooltip" element');
	return el;
}

function groupIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[role="group"]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a role="group" element');
	return el;
}

/** The `<Layer>` popover the `unfocusedLayer` variant renders. */
function layerPopoverIn(container: HTMLElement): HTMLElement {
	const el = container.querySelector('[popover]');
	if (!(el instanceof HTMLElement)) throw new Error('expected a [popover] element');
	return el;
}

function textIn(container: HTMLElement, text: string): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('*')).filter(
		(el) => el.children.length === 0 && el.textContent?.trim() === text
	);
}

function focusIn(el: HTMLElement): void {
	el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
}

function focusOut(el: HTMLElement, relatedTarget: EventTarget | null): void {
	el.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget }));
}

/** Upstream's `await new Promise(r => setTimeout(r, 50))` after a query change. */
function settle(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 50));
}

/** Upstream's `politeRegion()` helper, verbatim. */
function politeRegion(): HTMLElement | null {
	return document.querySelector('[data-astryx-live-region="polite"]');
}

afterEach(() => {
	vi.restoreAllMocks();
	__resetLiveRegionsForTest();
});

describe('Tokenizer', () => {
	// Counterpart to upstream's `forwards ref to the root field element`; see the
	// file header.
	it('hands the root field element to an attachment passed through rest props', async () => {
		const attached = vi.fn();
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [],
				onChange: () => {},
				[createAttachmentKey()]: attached
			}
		});

		expect(attached).toHaveBeenCalledOnce();
		const root = attached.mock.calls[0][0] as HTMLElement;
		expect(root).toBeInstanceOf(HTMLDivElement);
		expect(root).toHaveClass('astryx-field');
		expect(screen.container.contains(root)).toBe(true);
	});

	// Counterpart to upstream's `exposes focus control through handleRef`.
	it('exposes focus control through the component instance', async () => {
		const screen = await render(Tokenizer, {
			props: { label: 'Members', searchSource: userSource, value: [], onChange: () => {} }
		});

		screen.component.focus();

		expect(document.activeElement).toBe(comboboxIn(screen.container));
	});

	it('renders with label', async () => {
		const screen = await render(Tokenizer, {
			props: { label: 'Members', searchSource: userSource, value: [], onChange: () => {} }
		});
		// Label is rendered by Field
		await expect.element(screen.getByText('Members')).toBeInTheDocument();
	});

	it('renders combobox input', async () => {
		const screen = await render(Tokenizer, {
			props: { label: 'Members', searchSource: userSource, value: [], onChange: () => {} }
		});
		expect(comboboxIn(screen.container)).toBeInTheDocument();
	});

	it('renders placeholder when no tokens', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [],
				onChange: () => {},
				placeholder: 'Search people...'
			}
		});
		expect(comboboxIn(screen.container)).toHaveAttribute('placeholder', 'Search people...');
	});

	it('renders tokens for selected items', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [users[0], users[1]],
				onChange: () => {}
			}
		});
		await expect.element(screen.getByText('Alice')).toBeInTheDocument();
		await expect.element(screen.getByText('Bob')).toBeInTheDocument();
	});

	it('renders remove buttons on tokens', async () => {
		const screen = await render(Tokenizer, {
			props: { label: 'Members', searchSource: userSource, value: [users[0]], onChange: () => {} }
		});
		await expect.element(screen.getByRole('button', { name: 'Remove Alice' })).toBeInTheDocument();
	});

	it('calls onChange with remove when token is removed', async () => {
		const onChange = vi.fn();
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [users[0], users[1]],
				onChange
			}
		});
		await userEvent.click(screen.getByRole('button', { name: 'Remove Alice' }));
		expect(onChange).toHaveBeenCalledWith([users[1]], { item: users[0], type: 'remove' });
	});

	it('visually hides input when maxEntries is reached but preserves it for keyboard access', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [users[0], users[1]],
				onChange: () => {},
				maxEntries: 2
			}
		});
		// Input stays in the DOM for keyboard accessibility (backspace to remove)
		// but is visually hidden
		expect(comboboxIn(screen.container)).toBeInTheDocument();
	});

	it('shows input when under maxEntries', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [users[0]],
				onChange: () => {},
				maxEntries: 2
			}
		});
		expect(comboboxIn(screen.container)).toBeInTheDocument();
	});

	it('shows clear all button when hasClear is true', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [users[0]],
				onChange: () => {},
				hasClear: true
			}
		});
		await expect.element(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument();
	});

	it('does not show clear all when no tokens', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [],
				onChange: () => {},
				hasClear: true
			}
		});
		await expect.element(screen.getByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();
	});

	it('renders description text', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				description: 'Select team members',
				searchSource: userSource,
				value: [],
				onChange: () => {}
			}
		});
		await expect.element(screen.getByText('Select team members')).toBeInTheDocument();
	});

	it('renders error status', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [],
				onChange: () => {},
				status: { type: 'error', message: 'At least one member required' }
			}
		});
		await expect.element(screen.getByText('At least one member required')).toBeInTheDocument();
	});

	it('disables tokens and input when isDisabled', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [users[0]],
				onChange: () => {},
				isDisabled: true
			}
		});
		expect(comboboxIn(screen.container)).toBeDisabled();
		// Remove button should not be present when disabled
		await expect
			.element(screen.getByRole('button', { name: 'Remove Alice' }))
			.not.toBeInTheDocument();
	});

	it('renders with data-testid', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [],
				onChange: () => {},
				'data-testid': 'my-tokenizer'
			}
		});
		await expect.element(screen.getByTestId('my-tokenizer')).toBeInTheDocument();
	});

	it('renders group with aria-label', async () => {
		const screen = await render(Tokenizer, {
			props: { label: 'Members', searchSource: userSource, value: [], onChange: () => {} }
		});
		expect(groupIn(screen.container)).toHaveAttribute('aria-label', 'Members');
	});

	it('hides placeholder when tokens are present', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [users[0]],
				onChange: () => {},
				placeholder: 'Search people...'
			}
		});
		// Placeholder should be empty when tokens exist
		expect(comboboxIn(screen.container)).not.toHaveAttribute('placeholder', 'Search people...');
	});

	it('shows placeholder when no tokens are present', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [],
				onChange: () => {},
				placeholder: 'Search people...'
			}
		});
		expect(comboboxIn(screen.container)).toHaveAttribute('placeholder', 'Search people...');
	});

	it('renders tokens as direct children of wrapper (not in a sub-container)', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [users[0], users[1]],
				onChange: () => {},
				'data-testid': 'tokenizer'
			}
		});
		const wrapper = screen.getByTestId('tokenizer').element() as HTMLElement;
		// Tokens should be direct children of the wrapper, not nested in a div
		expect(wrapper.querySelectorAll(':scope > span').length).toBeGreaterThanOrEqual(2);
	});

	it('renders with size="lg"', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [],
				onChange: () => {},
				size: 'lg'
			}
		});
		await expect.element(screen.getByText('Members')).toBeInTheDocument();
		expect(comboboxIn(screen.container)).toBeInTheDocument();
	});

	describe('tokenOverflowBehavior', () => {
		it('none: renders all tokens directly without OverflowList', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [users[0], users[1]],
					onChange: () => {},
					tokenOverflowBehavior: 'none',
					'data-testid': 'tokenizer'
				}
			});
			await expect.element(screen.getByText('Alice')).toBeInTheDocument();
			await expect.element(screen.getByText('Bob')).toBeInTheDocument();
			// RESTATED: upstream probes `[data-overflow-list]`; this port marks the
			// list with `themeProps`' stable `astryx-overflow-list` class instead.
			expect(screen.container.querySelector('.astryx-overflow-list')).not.toBeInTheDocument();
		});

		it('unfocusedInline: renders OverflowList when blurred', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [users[0], users[1], users[2]],
					onChange: () => {},
					tokenOverflowBehavior: 'unfocusedInline',
					'data-testid': 'tokenizer'
				}
			});
			// OverflowList renders a hidden measurement container plus visible items,
			// so tokens appear multiple times in the DOM
			expect(textIn(screen.container, 'Alice').length).toBeGreaterThanOrEqual(1);
		});

		it('unfocusedInline: removes truncation on focus', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [users[0], users[1], users[2]],
					onChange: () => {},
					tokenOverflowBehavior: 'unfocusedInline',
					'data-testid': 'tokenizer'
				}
			});
			const wrapper = screen.getByTestId('tokenizer').element() as HTMLElement;
			// Focus the wrapper (simulates focusing the input within)
			focusIn(wrapper);
			// All tokens should be directly rendered (no overflow list)
			await vi.waitFor(() => {
				expect(textIn(screen.container, 'Alice')).toHaveLength(1);
				expect(textIn(screen.container, 'Bob')).toHaveLength(1);
				expect(textIn(screen.container, 'Charlie')).toHaveLength(1);
			});
		});

		it('unfocusedLayer: renders placeholder and top-layer popover', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [users[0], users[1]],
					onChange: () => {},
					tokenOverflowBehavior: 'unfocusedLayer',
					'data-testid': 'tokenizer'
				}
			});
			// The wrapper should be rendered inside the placeholder (truncated view in-flow)
			await expect.element(screen.getByTestId('tokenizer')).toBeInTheDocument();
			// A popover element should exist for the top-layer expanded content
			expect(layerPopoverIn(screen.container)).toBeInTheDocument();
			// Only one group role (the wrapper)
			expect(screen.container.querySelectorAll('[role="group"]').length).toBe(1);
		});

		it('unfocusedLayer: shows expanded content in popover on focus', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [users[0], users[1], users[2]],
					onChange: () => {},
					tokenOverflowBehavior: 'unfocusedLayer',
					'data-testid': 'tokenizer'
				}
			});
			const wrapper = screen.getByTestId('tokenizer').element() as HTMLElement;
			// Focus the wrapper to expand
			focusIn(wrapper);
			// RESTATED: upstream asserts its `showPopover` spy was called; Chromium
			// implements the API, so the real open state is what the spy stood in for.
			await vi.waitFor(() => {
				expect(layerPopoverIn(screen.container).matches(':popover-open')).toBe(true);
			});
			// All tokens should be visible
			await vi.waitFor(() => {
				expect(textIn(screen.container, 'Alice')).toHaveLength(1);
				expect(textIn(screen.container, 'Bob')).toHaveLength(1);
				expect(textIn(screen.container, 'Charlie')).toHaveLength(1);
			});
		});

		it('unfocusedLayer: RTL emits no justify-self into the inset-positioned popover', async () => {
			// The popover positions itself with explicit anchor() insets
			// (positioning: 'custom'), so none of useLayer's placement-derived
			// styles may reach it — an RTL justify-self with insets and no
			// position-area would re-align the box inside the inset-modified
			// containing block instead of hugging the anchor.
			const screen = await render(Fixture, {
				props: {
					variant: 'rtl',
					tokenizer: {
						label: 'Members',
						searchSource: userSource,
						value: [users[0], users[1], users[2]],
						onChange: () => {},
						tokenOverflowBehavior: 'unfocusedLayer',
						'data-testid': 'tokenizer'
					}
				}
			});

			focusIn(screen.getByTestId('tokenizer').element() as HTMLElement);
			await vi.waitFor(() => {
				expect(layerPopoverIn(screen.container).matches(':popover-open')).toBe(true);
			});

			const style = layerPopoverIn(screen.container).getAttribute('style') ?? '';
			expect(style).toContain('position-anchor');
			expect(style).not.toContain('justify-self');
			expect(style).not.toContain('position-area');
			expect(style).not.toContain('position-try-fallbacks');
		});

		it('unfocusedLayer: collapses on blur', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [users[0], users[1], users[2]],
					onChange: () => {},
					tokenOverflowBehavior: 'unfocusedLayer',
					'data-testid': 'tokenizer'
				}
			});
			const wrapper = screen.getByTestId('tokenizer').element() as HTMLElement;
			// Focus to expand — fires on the wrapper inside the popover
			focusIn(wrapper);
			const popover = layerPopoverIn(screen.container);
			await vi.waitFor(() => {
				expect(popover.matches(':popover-open')).toBe(true);
			});

			// Blur from the (possibly re-rendered) wrapper to somewhere outside.
			focusOut(screen.getByTestId('tokenizer').element() as HTMLElement, document.body);
			// RESTATED as the case above — the real closed state, not a `hidePopover` spy.
			await vi.waitFor(() => {
				expect(popover.matches(':popover-open')).toBe(false);
			});
		});

		it('unfocusedInline: does not truncate when no tokens', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					tokenOverflowBehavior: 'unfocusedInline',
					'data-testid': 'tokenizer'
				}
			});
			// With no tokens, should not be in truncated state
			await expect.element(screen.getByTestId('tokenizer')).toBeInTheDocument();
		});
	});

	describe('hasCreate', () => {
		it('shows a "Create" option when typing with hasCreate', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Tags',
					searchSource: emptySource,
					value: [],
					onChange: () => {},
					hasCreate: true,
					debounceMs: 0
				}
			});

			setQuery(comboboxIn(screen.container), 'new-tag');
			await settle();

			await expect.element(screen.getByText('Create "new-tag"')).toBeInTheDocument();
		});

		it('fires onChange with type "create" when the Create item is clicked', async () => {
			const onChange = vi.fn();
			const screen = await render(Tokenizer, {
				props: {
					label: 'Tags',
					searchSource: emptySource,
					value: [],
					onChange,
					hasCreate: true,
					debounceMs: 0
				}
			});

			setQuery(comboboxIn(screen.container), 'new-tag');
			await settle();

			textIn(screen.container, 'Create "new-tag"')[0].click();

			expect(onChange).toHaveBeenCalledWith([{ id: 'new-tag', label: 'new-tag' }], {
				item: { id: 'new-tag', label: 'new-tag' },
				type: 'create'
			});
		});

		it('does not show Create option for already-selected values', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Tags',
					searchSource: emptySource,
					value: [{ id: 'existing', label: 'existing' }],
					onChange: () => {},
					hasCreate: true,
					debounceMs: 0
				}
			});

			setQuery(comboboxIn(screen.container), 'existing');
			await settle();

			expect(textIn(screen.container, 'Create "existing"')).toHaveLength(0);
		});

		it('does not show Create option when hasCreate is false', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Tags',
					searchSource: emptySource,
					value: [],
					onChange: () => {},
					hasCreate: false,
					debounceMs: 0
				}
			});

			setQuery(comboboxIn(screen.container), 'something');
			await settle();

			expect(textIn(screen.container, 'Create "something"')).toHaveLength(0);
		});

		it('appends Create option alongside real search results', async () => {
			const onChange = vi.fn();
			const screen = await render(Tokenizer, {
				props: {
					label: 'Tags',
					searchSource: userSource,
					value: [],
					onChange,
					hasCreate: true,
					debounceMs: 0
				}
			});

			// "Ali" matches Alice but "Ali" itself is a new value
			setQuery(comboboxIn(screen.container), 'Ali');
			await settle();

			// Both the real result and the Create option should appear
			await expect.element(screen.getByText('Alice')).toBeInTheDocument();
			await expect.element(screen.getByText('Create "Ali"')).toBeInTheDocument();
		});

		it('does not show Create when typed text exactly matches a result label', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Tags',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					hasCreate: true,
					debounceMs: 0
				}
			});

			setQuery(comboboxIn(screen.container), 'Alice');
			await settle();

			// "Alice" exactly matches a result — no Create option
			await expect.element(screen.getByText('Alice')).toBeInTheDocument();
			expect(textIn(screen.container, 'Create "Alice"')).toHaveLength(0);
		});
	});

	describe('popover after selection', () => {
		it('does not show an empty popover after selecting an item with hasEntriesOnFocus', async () => {
			const onChange = vi.fn();
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
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

			// Select an item
			textIn(screen.container, 'Alice')[0].click();
			expect(onChange).toHaveBeenCalled();

			// Popover should not reopen with an empty menu after selection. Upstream
			// asserts synchronously because React flushes inside `act`; a Svelte
			// `$state` write lands on the next microtask, so this waits — the same
			// translation `typeahead.svelte.test.ts` makes for the identical
			// `BaseTypeahead` case.
			await vi.waitFor(() => {
				expect(input).toHaveAttribute('aria-expanded', 'false');
			});
		});
	});

	describe('paste behavior', () => {
		it('pasting text triggers search results like typing', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					debounceMs: 0
				}
			});

			const input = screen.container.querySelector('input[role="combobox"]') as HTMLInputElement;
			// RESTATED: the driver has no paste primitive; `fill` produces the same
			// single-input-event value change a paste does, which is what the
			// component sees. Same restatement `typeahead.svelte.test.ts` makes.
			await userEvent.fill(input, 'Ali');
			await settle();

			await expect.element(screen.getByText('Alice')).toBeInTheDocument();
		});

		it('pasting text shows Create option with hasCreate', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Tags',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					hasCreate: true,
					debounceMs: 0
				}
			});

			const input = screen.container.querySelector('input[role="combobox"]') as HTMLInputElement;
			// RESTATED as the case above.
			await userEvent.fill(input, 'NewTag');
			await settle();

			await expect.element(screen.getByText('Create "NewTag"')).toBeInTheDocument();
		});
	});

	describe('startIcon', () => {
		it('does not render a start icon when omitted', async () => {
			const screen = await render(Tokenizer, {
				props: { label: 'Members', searchSource: userSource, value: [], onChange: () => {} }
			});
			// RESTATED to the render container: upstream's bare `document` query is
			// safe in a fresh jsdom, but this file shares one long-lived Chromium
			// page across its cases and the popover/tooltip layers it mounts live on
			// `document.body`.
			expect(screen.container.querySelector('svg')).not.toBeInTheDocument();
		});

		// Counterpart to upstream's `renders a ReactNode start icon before the
		// tokens` — `startIcon` is `IconName | Snippet` here, so the "arbitrary
		// element" arm is a snippet, supplied by the fixture.
		it('renders a ReactNode start icon before the tokens', async () => {
			const screen = await render(Fixture, {
				props: {
					variant: 'snippet-start-icon',
					tokenizer: {
						label: 'Members',
						searchSource: userSource,
						value: [{ id: '1', label: 'Alice' }],
						onChange: () => {}
					}
				}
			});
			const icon = screen.getByTestId('start-icon').element() as HTMLElement;
			const token = screen.getByText('Alice').element() as HTMLElement;
			expect(icon).toBeInTheDocument();
			expect(icon.compareDocumentPosition(token) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		});

		// Counterpart to upstream's `renders an IconType (SVG component) start
		// icon`: the other arm of `IconName | Snippet` is a registry name, which
		// `Icon` renders as the same `<svg>` upstream's icon component does.
		it('renders an IconType (SVG component) start icon', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					startIcon: 'search'
				}
			});
			expect(screen.container.querySelector('svg')).toBeInTheDocument();
		});
	});

	describe('disabledMessage', () => {
		it('shows the reason tooltip on hover when disabled with a reason', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					isDisabled: true,
					disabledMessage: 'You need edit access to change members'
				}
			});
			const tooltip = tooltipIn(screen.container);
			expect(tooltip).toHaveTextContent('You need edit access to change members');

			const wrapper = groupIn(screen.container);
			wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
			await vi.waitFor(() => expect(tooltip.matches(':popover-open')).toBe(true));

			wrapper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
			await vi.waitFor(() => expect(tooltip.matches(':popover-open')).toBe(false));
		});

		it('shows the reason tooltip on keyboard focus', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					isDisabled: true,
					disabledMessage: 'You need edit access to change members'
				}
			});
			const tooltip = tooltipIn(screen.container);
			await userEvent.tab();
			expect(document.activeElement).toBe(comboboxIn(screen.container));
			await vi.waitFor(() => expect(tooltip.matches(':popover-open')).toBe(true));
		});

		it('does not render a tooltip when not disabled', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					disabledMessage: 'You need edit access to change members'
				}
			});
			expect(screen.container.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
		});

		it('does not render a tooltip when disabled without a reason', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					isDisabled: true
				}
			});
			expect(screen.container.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
		});

		it('keeps the input focusable via aria-disabled when a reason is provided', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					isDisabled: true,
					disabledMessage: 'You need edit access to change members'
				}
			});
			const input = comboboxIn(screen.container);
			// RESTATED: `not.toBeDisabled()` here is Playwright's ARIA computation,
			// which counts `aria-disabled` and would report this input as disabled.
			// The native attribute is what upstream asserts the absence of.
			expect(input).not.toHaveAttribute('disabled');
			expect(input).toHaveAttribute('aria-disabled', 'true');
		});

		it('links the reason tooltip via aria-describedby', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					isDisabled: true,
					disabledMessage: 'You need edit access to change members'
				}
			});
			const input = comboboxIn(screen.container);
			const tooltip = tooltipIn(screen.container);
			expect(input.getAttribute('aria-describedby')).toContain(tooltip.id);
		});

		it('blocks input while focusable-disabled', async () => {
			const onChange = vi.fn();
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
					onChange,
					isDisabled: true,
					disabledMessage: 'You need edit access to change members'
				}
			});
			const input = comboboxIn(screen.container);
			// PORTED verbatim — upstream focuses and presses keys too. Noted only
			// because `fill`/`type` is not an available substitute: the input is
			// `readonly` and Playwright refuses to write into a non-editable element,
			// so this path (which is also upstream's) is the only one open.
			input.focus();
			await userEvent.keyboard('Ali');
			expect(input.value).toBe('');
			expect(onChange).not.toHaveBeenCalled();
		});

		it('keeps the input natively disabled when disabled without a reason', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					isDisabled: true
				}
			});
			expect(comboboxIn(screen.container)).toBeDisabled();
		});
	});

	describe('announcements', () => {
		it('announces removal politely on Backspace with an empty input', async () => {
			const onChange = vi.fn();
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [users[0], users[1]],
					onChange
				}
			});
			const input = comboboxIn(screen.container);
			input.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true })
			);
			expect(onChange).toHaveBeenCalledWith([users[0]], { item: users[1], type: 'remove' });
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Removed Bob');
			});
		});

		it("announces removal politely when clicking a token's remove button", async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [users[0], users[1]],
					onChange: () => {}
				}
			});
			await userEvent.click(screen.getByRole('button', { name: 'Remove Alice' }));
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Removed Alice');
			});
		});

		it('announces addition politely when selecting a search result', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					hasEntriesOnFocus: true,
					debounceMs: 0
				}
			});
			const input = comboboxIn(screen.container);
			input.focus();
			await settle();
			textIn(screen.container, 'Alice')[0].click();
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Added Alice');
			});
		});

		it('announces addition politely when creating a token with hasCreate', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Tags',
					searchSource: emptySource,
					value: [],
					onChange: () => {},
					hasCreate: true,
					debounceMs: 0
				}
			});
			setQuery(comboboxIn(screen.container), 'new-tag');
			await settle();
			textIn(screen.container, 'Create "new-tag"')[0].click();
			await vi.waitFor(() => {
				expect(politeRegion()).toHaveTextContent('Added new-tag');
			});
		});

		it('does not announce on mount', async () => {
			await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [users[0]],
					onChange: () => {}
				}
			});
			// The live regions are created lazily on first announce, so a mount
			// with pre-selected tokens must not create (or speak through) one.
			expect(politeRegion()).toBeNull();
		});

		it('does not announce add/remove while typing', async () => {
			const screen = await render(Tokenizer, {
				props: {
					label: 'Members',
					searchSource: userSource,
					value: [],
					onChange: () => {},
					debounceMs: 0
				}
			});
			setQuery(comboboxIn(screen.container), 'Ali');
			await settle();
			// BaseTypeahead announces result counts while typing (existing
			// behavior); typing alone must not produce add/remove announcements.
			expect(politeRegion()?.textContent ?? '').not.toMatch(/Added|Removed/);
		});
	});

	describe('form participation', () => {
		it('submits one entry per token id under htmlName', async () => {
			const screen = await render(Fixture, {
				props: {
					variant: 'form',
					tokenizer: {
						label: 'Users',
						htmlName: 'users',
						searchSource: userSource,
						value: [users[0], users[1]],
						onChange: () => {}
					}
				}
			});
			const form = screen.container.querySelector('form');
			expect(form).not.toBeNull();
			const data = new FormData(form as HTMLFormElement);
			expect(data.getAll('users')).toEqual([users[0].id, users[1].id]);
		});

		it('is excluded from form data when disabled', async () => {
			const screen = await render(Fixture, {
				props: {
					variant: 'form',
					tokenizer: {
						label: 'Users',
						htmlName: 'users',
						searchSource: userSource,
						value: [users[0]],
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

describe('Tokenizer statusVariant forwarding', () => {
	it('defaults to attached (status renders with data-variant="attached")', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
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
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
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
});

describe('Tokenizer disabled theme state', () => {
	it('reflects disabled on the root target so themes can gate paint on it', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [],
				onChange: () => {},
				isDisabled: true
			}
		});
		const root = screen.container.querySelector('.astryx-tokenizer');
		expect(root).toHaveAttribute('data-disabled', 'disabled');
		expect(root).toHaveClass('disabled');
	});

	it('omits data-disabled when enabled, like status does', async () => {
		const screen = await render(Tokenizer, {
			props: {
				label: 'Members',
				searchSource: userSource,
				value: [],
				onChange: () => {}
			}
		});
		const root = screen.container.querySelector('.astryx-tokenizer');
		expect(root).not.toHaveAttribute('data-disabled');
	});
});
