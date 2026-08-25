import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PowerSearchValueEditor from '$lib/components/power-search/power-search-value-editor.svelte';
import RenderItemProbe from './fixtures/power-search-render-item-probe.svelte';
import type {
	FilterValueEntityList,
	OperatorValue,
	PowerSearchEntity
} from '$lib/components/power-search/types.js';
import type { InternalConfig } from '$lib/components/power-search/use-internal-config.svelte.js';
import type { SearchableItem, SearchSource } from '$lib/components/typeahead/types.js';

/**
 * Astryx's `PowerSearch/PowerSearchValueEditor.test.tsx` at the **0.5.0** pin —
 * **14 upstream cases across four describe blocks** (`StringEditor (#1103)` 4,
 * `EntityListEditor (#1106)` 3, `StringListEditor (#1107)` 4, `maxMenuItems` 3),
 * **14 here**, in upstream's order and under upstream's `describe` names.
 * Nothing dropped, nothing added. There is no `displayName` case and no ref
 * case in this file.
 *
 * The `maxMenuItems` describe is new at 0.5.0 and belongs to the same
 * menu-capping change that added `maxOperatorMenuItems` and the field-menu
 * sizing block to `PowerSearch.test.tsx`, and the `typed-result cap` describe
 * to `usePowerSearchSource.test.ts`. (This header read "**11 upstream cases
 * across three describe blocks** … 11 here", true at the v0.4.5 pin.)
 *
 * Runs in the **client (real Chromium)** project. Upstream's `beforeAll` stubs
 * for `ResizeObserver`, `showPopover`/`hidePopover` and `:popover-open` are
 * therefore GONE — Chromium implements all four natively — which is the same
 * removal `tokenizer.svelte.test.ts` and `typeahead.svelte.test.ts` made.
 *
 * Mechanical translations, each following a pattern an earlier suite set:
 *
 * - `render` is async — always awaited.
 * - `fireEvent.change(input, {target: {value}})` becomes `setQuery()` below (a
 *   native value assignment plus a bubbling `input` event), as in
 *   `typeahead.svelte.test.ts`.
 * - `fireEvent.keyDown(input, {key})` becomes `keyDown()` below.
 * - `fireEvent.click(el)` becomes the element's own `.click()`. That is what a
 *   dispatched click is, and it sidesteps Playwright's actionability checks,
 *   which upstream's synthetic dispatch never runs.
 * - `act()` has no counterpart — a `$state` write flushes on its own, and the
 *   `await new Promise(r => setTimeout(r, …))` debounce waits survive verbatim
 *   as `settle(ms)`.
 * - `screen.queryByRole/queryByText` become container queries or
 *   `expect.element(...)`, which retries. `getAllByRole('option', {hidden:
 *   true})` becomes `optionsIn(container)`, the `[role="option"]` sweep
 *   `typeahead.svelte.test.ts` uses: upstream needs `hidden: true` because
 *   jsdom does not resolve the popover's visibility, and a DOM query does not
 *   ask the question at all.
 * - **`getByText` carries `{exact: true}`** wherever the sought string is a
 *   prefix of another rendered one: Playwright's text engine is substring by
 *   default, so a bare `getByText('Alice')` is a strict-mode violation waiting
 *   to happen. (`app-shell.svelte.test.ts` set this convention.)
 *
 * ## The one RESTATED case
 *
 * `calls onChange with string FilterValue when typeahead item is selected` is
 * upstream's, wrapped in `if (option) { … }` — so if the option never appears,
 * upstream's case passes having asserted nothing. `expect.requireAssertions` is
 * on here and would fail it outright, so the guard becomes an assertion: the
 * option *must* be in the document, and then upstream's `toHaveBeenCalledWith`
 * runs unconditionally. Same question, actually asked.
 *
 * ## One fixture
 *
 * `passes renderItem from operatorValue to Tokenizer` goes through
 * `fixtures/power-search-render-item-probe.svelte`, because `renderItem` is a
 * `Snippet` here and a snippet can only be authored in a template.
 */

// =============================================================================
// Helpers
// =============================================================================

/** Upstream's `fireEvent.change(input, {target: {value}})`. */
function setQuery(input: HTMLInputElement, value: string): void {
	const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
	setter?.call(input, value);
	input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Upstream's `fireEvent.keyDown(input, {key})`. */
function keyDown(el: HTMLElement, key: string): void {
	el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

/** Upstream's `await new Promise(r => setTimeout(r, ms))` debounce waits. */
function settle(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function comboboxIn(container: HTMLElement): HTMLInputElement {
	const el = container.querySelector('input[role="combobox"]');
	if (!(el instanceof HTMLInputElement)) throw new Error('expected a role="combobox" input');
	return el;
}

function optionsIn(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="option"]'));
}

/**
 * Minimal config stub — the dispatcher and the editors never read it. Upstream
 * stubs `{fieldsMap, operatorsMap}` because its `InternalConfig` is two maps;
 * this port's is a method table, so the equivalent minimum is an empty object
 * behind the same cast upstream uses.
 */
const stubConfig = {} as unknown as InternalConfig;

function createSearchSource(items: SearchableItem[]): SearchSource<SearchableItem> {
	return {
		search: (query: string) =>
			items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase())),
		bootstrap: () => items.slice(0, 5)
	};
}

// =============================================================================
// #1103 — StringEditor ignores searchSource
// =============================================================================

describe('StringEditor (#1103)', () => {
	it('renders a typeahead when searchSource is provided', async () => {
		const source = createSearchSource([
			{ id: 'us', label: 'United States' },
			{ id: 'uk', label: 'United Kingdom' }
		]);

		const onChange = vi.fn();
		const screen = await render(PowerSearchValueEditor, {
			props: {
				operatorValue: { type: 'string', searchSource: source },
				filterValue: undefined,
				onChange,
				config: stubConfig
			}
		});

		// Should render a combobox (typeahead), not a plain textbox
		const combobox = screen.getByRole('combobox');
		await expect.element(combobox).toBeInTheDocument();
	});

	it('renders a plain text input when no searchSource', async () => {
		const onChange = vi.fn();
		const screen = await render(PowerSearchValueEditor, {
			props: {
				operatorValue: { type: 'string' },
				filterValue: undefined,
				onChange,
				config: stubConfig
			}
		});

		// Should render a textbox (TextInput), not a combobox
		const textbox = screen.getByRole('textbox');
		await expect.element(textbox).toBeInTheDocument();
	});

	// RESTATED: upstream guards its assertion behind `if (option)`, so the case
	// asserts nothing when the option never renders. `requireAssertions` forbids
	// that here, so the guard is promoted to an assertion and upstream's
	// `toHaveBeenCalledWith` then runs unconditionally.
	it('calls onChange with string FilterValue when typeahead item is selected', async () => {
		const source = createSearchSource([
			{ id: 'us', label: 'United States' },
			{ id: 'uk', label: 'United Kingdom' }
		]);

		const onChange = vi.fn();
		const screen = await render(PowerSearchValueEditor, {
			props: {
				operatorValue: { type: 'string', searchSource: source },
				filterValue: undefined,
				onChange,
				config: stubConfig
			}
		});

		const combobox = comboboxIn(screen.container);
		setQuery(combobox, 'United');

		// Wait for debounce + results
		await settle(200);

		// Select the first result
		const option = screen.getByText('United States', { exact: true });
		await expect.element(option).toBeInTheDocument();
		(option.element() as HTMLElement).click();
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'string' }), true);
	});

	it('allows arbitrary string input when isArbitraryStringAllowed + searchSource', async () => {
		const source = createSearchSource([{ id: 'us', label: 'United States' }]);

		const onChange = vi.fn();
		const screen = await render(PowerSearchValueEditor, {
			props: {
				operatorValue: {
					type: 'string',
					searchSource: source,
					isArbitraryStringAllowed: true
				},
				filterValue: undefined,
				onChange,
				config: stubConfig
			}
		});

		// Should still render a combobox (typeahead with suggestions)
		const combobox = screen.getByRole('combobox');
		await expect.element(combobox).toBeInTheDocument();
	});
});

// =============================================================================
// #1106 — EntityListEditor drops photo, no renderItem
// =============================================================================

describe('EntityListEditor (#1106)', () => {
	const entitiesWithPhoto: PowerSearchEntity[] = [
		{ id: 'u1', label: 'Alice', photo: 'https://example.com/alice.jpg' },
		{ id: 'u2', label: 'Bob', photo: 'https://example.com/bob.jpg' }
	];

	const entitySource = createSearchSource(
		entitiesWithPhoto.map((e) => ({
			id: e.id,
			label: e.label,
			auxiliaryData: { photo: e.photo }
		}))
	);

	it('round-trips photo through onChange', async () => {
		const onChange = vi.fn();
		const filterValue: FilterValueEntityList = {
			type: 'entity_list',
			value: entitiesWithPhoto
		};

		const screen = await render(PowerSearchValueEditor, {
			props: {
				operatorValue: { type: 'entity_list', searchSource: entitySource },
				filterValue,
				onChange,
				config: stubConfig
			}
		});

		// Tokens for Alice and Bob should render
		await expect.element(screen.getByText('Alice', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Bob', { exact: true })).toBeInTheDocument();

		// Remove Alice — the remaining value should still have Bob's photo
		const removeBtn = screen.getByRole('button', { name: 'Remove Alice' });
		(removeBtn.element() as HTMLElement).click();

		expect(onChange).toHaveBeenCalled();
		const newFilterValue = onChange.mock.calls[0][0] as FilterValueEntityList;
		expect(newFilterValue.type).toBe('entity_list');
		expect(newFilterValue.value).toHaveLength(1);
		expect(newFilterValue.value[0].id).toBe('u2');
		expect(newFilterValue.value[0].label).toBe('Bob');
		// Bug #1106: photo should be preserved, not dropped
		expect(newFilterValue.value[0].photo).toBe('https://example.com/bob.jpg');
	});

	it('preserves photo when mapping filter value to tokenizer', async () => {
		const onChange = vi.fn();
		const filterValue: FilterValueEntityList = {
			type: 'entity_list',
			value: [{ id: 'u1', label: 'Alice', photo: 'https://example.com/alice.jpg' }]
		};

		const screen = await render(PowerSearchValueEditor, {
			props: {
				operatorValue: { type: 'entity_list', searchSource: entitySource },
				filterValue,
				onChange,
				config: stubConfig
			}
		});

		// The token should render — verifies the entity was properly mapped
		await expect.element(screen.getByText('Alice', { exact: true })).toBeInTheDocument();
	});

	it('passes renderItem from operatorValue to Tokenizer', async () => {
		const onChange = vi.fn();
		const screen = await render(RenderItemProbe, {
			props: {
				searchSource: entitySource,
				config: stubConfig,
				onChange
			}
		});

		// The tokenizer should render — renderItem is passed through
		// (we can't easily assert it was passed as a prop in unit tests,
		// but we verify the component renders without error with renderItem)
		expect(comboboxIn(screen.container)).toBeInTheDocument();
	});
});

// =============================================================================
// #1107 — StringListEditor without searchSource is non-functional
// =============================================================================

describe('StringListEditor (#1107)', () => {
	it('shows a "Create" item in the dropdown when typing free-text without searchSource', async () => {
		const onChange = vi.fn();
		const screen = await render(PowerSearchValueEditor, {
			props: {
				operatorValue: { type: 'string_list' },
				filterValue: undefined,
				onChange,
				config: stubConfig
			}
		});

		const input = comboboxIn(screen.container);

		// Type a free-text value — should show 'Create "my-tag"' in the dropdown
		setQuery(input, 'my-tag');

		// Wait for debounce
		await settle(50);

		const createOption = screen.getByText('Create "my-tag"', { exact: true });
		await expect.element(createOption).toBeInTheDocument();
	});

	it('commits free-text token when clicking the Create item', async () => {
		const onChange = vi.fn();
		const screen = await render(PowerSearchValueEditor, {
			props: {
				operatorValue: { type: 'string_list' },
				filterValue: undefined,
				onChange,
				config: stubConfig
			}
		});

		const input = comboboxIn(screen.container);

		setQuery(input, 'my-tag');

		await settle(50);

		const createOption = screen.getByText('Create "my-tag"', { exact: true });
		await expect.element(createOption).toBeInTheDocument();
		(createOption.element() as HTMLElement).click();

		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'string_list',
				value: expect.arrayContaining(['my-tag'])
			})
		);
	});

	it('commits free-text via Enter when the Create item is highlighted', async () => {
		const onChange = vi.fn();
		const screen = await render(PowerSearchValueEditor, {
			props: {
				operatorValue: {
					type: 'string_list',
					isArbitraryStringAllowed: true
				},
				filterValue: undefined,
				onChange,
				config: stubConfig
			}
		});

		const input = comboboxIn(screen.container);

		setQuery(input, 'custom-value');

		await settle(50);

		// Arrow down to highlight the Create item, then Enter
		keyDown(input, 'ArrowDown');
		keyDown(input, 'Enter');

		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'string_list',
				value: expect.arrayContaining(['custom-value'])
			})
		);
	});

	it('still works with a searchSource (existing behavior)', async () => {
		const source = createSearchSource([
			{ id: 'tag1', label: 'frontend' },
			{ id: 'tag2', label: 'backend' }
		]);

		const onChange = vi.fn();
		const screen = await render(PowerSearchValueEditor, {
			props: {
				operatorValue: { type: 'string_list', searchSource: source },
				filterValue: undefined,
				onChange,
				config: stubConfig
			}
		});

		// Should render the tokenizer with a combobox
		expect(comboboxIn(screen.container)).toBeInTheDocument();
	});
});

// =============================================================================
// maxMenuItems — the 0.5.0 cap on value-typeahead suggestions
// =============================================================================

describe('maxMenuItems', () => {
	const source = createSearchSource(
		Array.from({ length: 6 }, (_, index) => ({
			id: `option-${index}`,
			label: `Option ${index}`
		}))
	);

	async function expectCapped(operatorValue: OperatorValue): Promise<void> {
		const screen = await render(PowerSearchValueEditor, {
			props: {
				operatorValue,
				filterValue: undefined,
				onChange: vi.fn(),
				config: stubConfig,
				maxMenuItems: 2
			}
		});

		setQuery(comboboxIn(screen.container), 'Option');
		await settle(200);

		expect(optionsIn(screen.container)).toHaveLength(2);
	}

	it('caps string suggestions', async () => {
		await expectCapped({ type: 'string', searchSource: source });
	});

	it('caps string-list suggestions', async () => {
		await expectCapped({ type: 'string_list', searchSource: source });
	});

	it('caps entity-list suggestions', async () => {
		await expectCapped({ type: 'entity_list', searchSource: source });
	});
});
