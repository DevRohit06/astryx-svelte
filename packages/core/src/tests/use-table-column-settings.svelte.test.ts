import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type {
	ColumnSettingsOption,
	UseTableColumnSettingsConfig
} from '$lib/components/table/plugins/column-settings/use-table-column-settings.js';
import type { TableColumn } from '$lib/components/table/table-types.js';
import ColumnSettingsProbe from './fixtures/table-column-settings-probe.svelte';
import ColumnSettingsTable from './fixtures/table-column-settings-fixture.svelte';

/**
 * Astryx's `Table/plugins/columnSettings/useTableColumnSettings.test.tsx`,
 * ported case for case — **6 upstream cases** (4 `useTableColumnSettings`, 2
 * `integration with Table`), **6 here**. Nothing dropped, nothing added.
 *
 * Two harness translations, both forced and both documented at their fixture:
 *
 * - **`renderHook` has no counterpart.** A hook must run during a component's
 *   init, so `fixtures/table-column-settings-probe.svelte` runs it, renders
 *   nothing, and exposes the plugin as an instance `export const` —
 *   `render(...).component` hands it back, which is the nearest thing to
 *   `result.current`. The whole config goes in as **one prop object** so the
 *   hook's config getter returns the same object every call; a getter returning a
 *   fresh literal would quietly void the identity assertions.
 * - Upstream's `ColumnSettingsTable` becomes
 *   `fixtures/table-column-settings-fixture.svelte`, which reads
 *   `state.columnSettingsConfig` inside the getter rather than destructuring it:
 *   the port returns it as a **getter**, and destructuring would snapshot the
 *   first value.
 *
 * The row generic is erased to `Record<string, unknown>` throughout, because
 * `render()` takes the component as a value and cannot infer a component generic
 * from props — `render-table.ts` documents that at length. `TableColumn<T>` is
 * invariant in `T`, so upstream's `TableColumn<User>[]` is declared at the erased
 * row type here. No assertion in this file reads the row shape.
 *
 * Standing translations: `render` is async and takes `{ props }`; `rerender` is
 * `screen.rerender`, which takes the whole props object; `getAllByRole(r)` is
 * `screen.getByRole(r).elements()`; `queryByText(t)` is
 * `screen.getByText(t, { exact: true }).query()`, with `exact` restoring RTL's
 * whole-string match over a Vitest browser locator's substring one.
 */

// =============================================================================
// Test Data
// =============================================================================

interface User extends Record<string, unknown> {
	id: string;
	name: string;
	email: string;
	role: string;
	status: string;
	lastLogin: string;
}

const testUsers: User[] = [
	{
		id: '1',
		name: 'Alice',
		email: 'alice@test.com',
		role: 'admin',
		status: 'active',
		lastLogin: '2026-01-01'
	},
	{
		id: '2',
		name: 'Bob',
		email: 'bob@test.com',
		role: 'user',
		status: 'inactive',
		lastLogin: '2026-02-01'
	}
];

const allTableColumns: TableColumn<Record<string, unknown>>[] = [
	{ key: 'name', header: 'Name' },
	{ key: 'email', header: 'Email' },
	{ key: 'role', header: 'Role' },
	{ key: 'status', header: 'Status' },
	{ key: 'lastLogin', header: 'Last Login' }
];

const columnOptions: ColumnSettingsOption[] = [
	{ key: 'name', label: 'Name', isAlwaysVisible: true },
	{ key: 'email', label: 'Email' },
	{ key: 'role', label: 'Role' },
	{ key: 'status', label: 'Status' },
	{ key: 'lastLogin', label: 'Last Login' }
];

const exact = { exact: true } as const;

// =============================================================================
// Plugin Hook Tests
// =============================================================================

describe('useTableColumnSettings', () => {
	function pluginConfig(
		overrides: Partial<UseTableColumnSettingsConfig> = {}
	): UseTableColumnSettingsConfig {
		return {
			columns: columnOptions,
			activeColumnKeys: ['name', 'email', 'role'],
			onChangeActiveColumnKeys: vi.fn(),
			...overrides
		};
	}

	function renderPluginHook(overrides: Partial<UseTableColumnSettingsConfig> = {}) {
		return render(ColumnSettingsProbe, { props: { config: pluginConfig(overrides) } });
	}

	it('returns a TablePlugin with transformColumns', async () => {
		const screen = await renderPluginHook();
		expect(screen.component.plugin).toBeDefined();
		expect(screen.component.plugin.transformColumns).toBeInstanceOf(Function);
	});

	it('transformColumns filters columns by activeColumnKeys', async () => {
		const screen = await renderPluginHook({ activeColumnKeys: ['name', 'email'] });

		const filtered = screen.component.plugin.transformColumns!(allTableColumns);
		expect(filtered.map((c) => c.key)).toEqual(['name', 'email']);
	});

	it('transformColumns reorders columns by activeColumnKeys order', async () => {
		const screen = await renderPluginHook({ activeColumnKeys: ['role', 'name'] });

		const filtered = screen.component.plugin.transformColumns!(allTableColumns);
		expect(filtered.map((c) => c.key)).toEqual(['role', 'name']);
	});

	// Upstream's `rerender()` re-invokes the hook with the same config object.
	// Here the hook body runs once at init, so the identity holds by construction
	// rather than by a `useRef` — which is exactly what the port's docstring
	// claims, and what this pins.
	//
	// Upstream's assertion is kept, but on its own it is **unfalsifiable** here:
	// `screen.component` is captured once and `rerender` merges props into the
	// mounted instance rather than remounting it, so `plugin` resolves to the same
	// `const` both times for any implementation. The falsifiable half is what the
	// stable plugin *produces*. This plugin is pure — no context, no bound slot —
	// so its whole observable output is `transformColumns`, and the property that
	// bites is that unchanged input yields back the **same column objects**:
	// `base-table.svelte` keys its header and body cells off the resolved columns,
	// so a transform that cloned or re-derived them would churn every cell on
	// every re-run. Mutation-checked; see the run notes.
	it('plugin reference is stable across renders', async () => {
		const config = pluginConfig();
		const screen = await render(ColumnSettingsProbe, { props: { config } });
		const firstPlugin = screen.component.plugin;
		const firstColumns = firstPlugin.transformColumns!(allTableColumns);
		expect(firstColumns.map((c) => c.key)).toEqual(['name', 'email', 'role']);

		await screen.rerender({ config });

		expect(screen.component.plugin).toBe(firstPlugin);
		const secondColumns = screen.component.plugin.transformColumns!(allTableColumns);
		expect(secondColumns.map((c) => c.key)).toEqual(firstColumns.map((c) => c.key));
		for (let i = 0; i < secondColumns.length; i++) {
			expect(secondColumns[i]).toBe(firstColumns[i]);
		}
	});
});

// =============================================================================
// Integration: state hook + plugin hook + Table
// =============================================================================

describe('integration with Table', () => {
	function renderColumnSettingsTable(initialActiveKeys: string[]) {
		return render(ColumnSettingsTable, {
			props: {
				data: testUsers,
				columns: allTableColumns,
				columnOptions,
				initialActiveKeys
			}
		});
	}

	it('table renders only active columns', async () => {
		const screen = await renderColumnSettingsTable(['name', 'email', 'role']);

		await expect.element(screen.getByText('Name', exact)).toBeInTheDocument();
		await expect.element(screen.getByText('Email', exact)).toBeInTheDocument();
		await expect.element(screen.getByText('Role', exact)).toBeInTheDocument();

		expect(screen.getByText('Status', exact).query()).toBeNull();
		expect(screen.getByText('Last Login', exact).query()).toBeNull();
	});

	it('column order matches activeColumnKeys order', async () => {
		const screen = await renderColumnSettingsTable(['role', 'name', 'email']);

		const headers = screen.getByRole('columnheader').elements();
		expect(headers[0]).toHaveTextContent('Role');
		expect(headers[1]).toHaveTextContent('Name');
		expect(headers[2]).toHaveTextContent('Email');
	});
});
