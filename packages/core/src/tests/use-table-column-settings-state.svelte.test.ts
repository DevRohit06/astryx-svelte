import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { ColumnSettingsOption } from '$lib/components/table/plugins/column-settings/use-table-column-settings.js';
import type { UseTableColumnSettingsStateConfig } from '$lib/components/table/plugins/column-settings/use-table-column-settings-state.svelte.js';
import ColumnSettingsStateProbe from './fixtures/table-column-settings-state-probe.svelte';

/**
 * Astryx's `Table/plugins/columnSettings/useTableColumnSettingsState.test.tsx`,
 * ported case for case — **18 upstream cases, 18 here**, in upstream's order and
 * under upstream's `describe`s. Nothing dropped, nothing added.
 *
 * Two translations, both structural and neither touching an assertion:
 *
 * - **`renderHook` has no counterpart.** A hook must run during a component's
 *   init, so `fixtures/table-column-settings-state-probe.svelte` runs it, renders
 *   nothing, and exposes the return value as an instance `export const` —
 *   `render(...).component.result` is `result.current`. The whole config is one
 *   prop object, which is what keeps
 *   `expect(result.current.columnSettingsConfig).toBe(config)` an identity
 *   assertion.
 * - **`act()` has no counterpart.** Every operation here is a synchronous call
 *   that ends in `onChangeActiveColumnKeys`; there is no render to batch, so
 *   `act(() => result.current.toggleColumn('email'))` is the bare call.
 *
 * The probe's exposed object is *not* destructured, in the test or in the
 * fixture: `columnSettingsConfig` and `activeColumnKeys` are getters on the
 * port's return value (upstream returns a fresh object each render, so a
 * consumer always reads current values), and destructuring would freeze them at
 * their first value — the hazard the hook's own docstring names.
 */

// =============================================================================
// Test Data
// =============================================================================

const columnOptions: ColumnSettingsOption[] = [
	{ key: 'name', label: 'Name', isAlwaysVisible: true },
	{ key: 'email', label: 'Email' },
	{ key: 'role', label: 'Role' },
	{ key: 'status', label: 'Status' },
	{ key: 'lastLogin', label: 'Last Login' }
];

// =============================================================================
// Helpers
// =============================================================================

function renderStateHook(overrides: Partial<UseTableColumnSettingsStateConfig> = {}) {
	const defaultConfig: UseTableColumnSettingsStateConfig = {
		columns: columnOptions,
		activeColumnKeys: ['name', 'email', 'role'],
		onChangeActiveColumnKeys: vi.fn(),
		...overrides
	};

	return render(ColumnSettingsStateProbe, { props: { config: defaultConfig } });
}

// =============================================================================
// Tests
// =============================================================================

describe('useTableColumnSettingsState', () => {
	// ===========================================================================
	// Return value shape
	// ===========================================================================

	describe('return value', () => {
		it('returns columnSettingsConfig that matches input config', async () => {
			const config: UseTableColumnSettingsStateConfig = {
				columns: columnOptions,
				activeColumnKeys: ['name', 'email'],
				onChangeActiveColumnKeys: vi.fn()
			};
			const screen = await render(ColumnSettingsStateProbe, { props: { config } });
			expect(screen.component.result.columnSettingsConfig).toBe(config);
		});

		it('returns activeColumnKeys passthrough', async () => {
			const screen = await renderStateHook({ activeColumnKeys: ['name', 'email'] });
			expect(screen.component.result.activeColumnKeys).toEqual(['name', 'email']);
		});

		it('returns all operation functions', async () => {
			const screen = await renderStateHook();
			expect(screen.component.result.toggleColumn).toBeInstanceOf(Function);
			expect(screen.component.result.isColumnActive).toBeInstanceOf(Function);
			expect(screen.component.result.isColumnToggleable).toBeInstanceOf(Function);
			expect(screen.component.result.showAllColumns).toBeInstanceOf(Function);
			expect(screen.component.result.resetToDefault).toBeInstanceOf(Function);
			expect(screen.component.result.setActiveColumnKeys).toBeInstanceOf(Function);
		});
	});

	// ===========================================================================
	// toggleColumn
	// ===========================================================================

	describe('toggleColumn', () => {
		it('removes active column', async () => {
			const onChange = vi.fn();
			const screen = await renderStateHook({
				activeColumnKeys: ['name', 'email', 'role'],
				onChangeActiveColumnKeys: onChange
			});

			screen.component.result.toggleColumn('email');
			expect(onChange).toHaveBeenCalledWith(['name', 'role']);
		});

		it('adds inactive column at end', async () => {
			const onChange = vi.fn();
			const screen = await renderStateHook({
				activeColumnKeys: ['name', 'email'],
				onChangeActiveColumnKeys: onChange
			});

			screen.component.result.toggleColumn('status');
			expect(onChange).toHaveBeenCalledWith(['name', 'email', 'status']);
		});

		it('no-op for isAlwaysVisible columns', async () => {
			const onChange = vi.fn();
			const screen = await renderStateHook({
				activeColumnKeys: ['name', 'email'],
				onChangeActiveColumnKeys: onChange
			});

			screen.component.result.toggleColumn('name');
			expect(onChange).not.toHaveBeenCalled();
		});
	});

	// ===========================================================================
	// isColumnActive
	// ===========================================================================

	describe('isColumnActive', () => {
		it('returns true for active columns', async () => {
			const screen = await renderStateHook({ activeColumnKeys: ['name', 'email'] });
			expect(screen.component.result.isColumnActive('name')).toBe(true);
			expect(screen.component.result.isColumnActive('email')).toBe(true);
		});

		it('returns false for inactive columns', async () => {
			const screen = await renderStateHook({ activeColumnKeys: ['name', 'email'] });
			expect(screen.component.result.isColumnActive('role')).toBe(false);
			expect(screen.component.result.isColumnActive('status')).toBe(false);
		});
	});

	// ===========================================================================
	// isColumnToggleable
	// ===========================================================================

	describe('isColumnToggleable', () => {
		it('returns true for normal columns', async () => {
			const screen = await renderStateHook();
			expect(screen.component.result.isColumnToggleable('email')).toBe(true);
			expect(screen.component.result.isColumnToggleable('role')).toBe(true);
		});

		it('returns false for always-visible columns', async () => {
			const screen = await renderStateHook();
			expect(screen.component.result.isColumnToggleable('name')).toBe(false);
		});
	});

	// ===========================================================================
	// showAllColumns
	// ===========================================================================

	describe('showAllColumns', () => {
		it('sets all column keys as active in columns config order', async () => {
			const onChange = vi.fn();
			const screen = await renderStateHook({
				activeColumnKeys: ['name'],
				onChangeActiveColumnKeys: onChange
			});

			screen.component.result.showAllColumns();
			expect(onChange).toHaveBeenCalledWith(['name', 'email', 'role', 'status', 'lastLogin']);
		});
	});

	// ===========================================================================
	// resetToDefault
	// ===========================================================================

	describe('resetToDefault', () => {
		it('resets to defaultColumnKeys when provided', async () => {
			const onChange = vi.fn();
			const screen = await renderStateHook({
				activeColumnKeys: ['name', 'email', 'role', 'status', 'lastLogin'],
				onChangeActiveColumnKeys: onChange,
				defaultColumnKeys: ['name', 'email']
			});

			screen.component.result.resetToDefault();
			expect(onChange).toHaveBeenCalledWith(['name', 'email']);
		});

		it('shows all columns when no defaultColumnKeys', async () => {
			const onChange = vi.fn();
			const screen = await renderStateHook({
				activeColumnKeys: ['name'],
				onChangeActiveColumnKeys: onChange
			});

			screen.component.result.resetToDefault();
			expect(onChange).toHaveBeenCalledWith(['name', 'email', 'role', 'status', 'lastLogin']);
		});
	});

	// ===========================================================================
	// setActiveColumnKeys
	// ===========================================================================

	describe('setActiveColumnKeys', () => {
		it('passes selected values to onChangeActiveColumnKeys', async () => {
			const onChange = vi.fn();
			const screen = await renderStateHook({ onChangeActiveColumnKeys: onChange });

			screen.component.result.setActiveColumnKeys(['name', 'email', 'status']);
			expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['name', 'email', 'status']));
		});

		it('enforces isAlwaysVisible columns remain in set', async () => {
			const onChange = vi.fn();
			const screen = await renderStateHook({ onChangeActiveColumnKeys: onChange });

			// Try to deselect 'name' (isAlwaysVisible) by not including it
			screen.component.result.setActiveColumnKeys(['email']);
			const calledWith = onChange.mock.calls[0][0] as string[];
			expect(calledWith).toContain('name');
			expect(calledWith).toContain('email');
		});
	});

	// ===========================================================================
	// Edge Cases
	// ===========================================================================

	describe('edge cases', () => {
		it('handles empty columns config', async () => {
			const screen = await renderStateHook({ columns: [], activeColumnKeys: [] });

			expect(screen.component.result.activeColumnKeys).toEqual([]);
		});

		it('handles single column with isAlwaysVisible', async () => {
			const screen = await renderStateHook({
				columns: [{ key: 'name', label: 'Name', isAlwaysVisible: true }],
				activeColumnKeys: ['name']
			});

			expect(screen.component.result.isColumnToggleable('name')).toBe(false);
			expect(screen.component.result.isColumnActive('name')).toBe(true);
		});

		it('handles all columns isAlwaysVisible', async () => {
			const allVisible: ColumnSettingsOption[] = [
				{ key: 'name', label: 'Name', isAlwaysVisible: true },
				{ key: 'email', label: 'Email', isAlwaysVisible: true }
			];

			const onChange = vi.fn();
			const screen = await renderStateHook({
				columns: allVisible,
				activeColumnKeys: ['name', 'email'],
				onChangeActiveColumnKeys: onChange
			});

			screen.component.result.toggleColumn('name');
			screen.component.result.toggleColumn('email');
			expect(onChange).not.toHaveBeenCalled();
		});
	});
});
