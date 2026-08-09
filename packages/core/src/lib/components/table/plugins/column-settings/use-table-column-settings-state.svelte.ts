import type { ColumnSettingsOption } from './use-table-column-settings.js';

/**
 * Ported from Astryx's
 * `Table/plugins/columnSettings/useTableColumnSettingsState.tsx`.
 *
 * Pure state operations, transcribed verbatim. Upstream's `configRef` — read by
 * every callback so a `useCallback(…, [])` still sees current values — is the
 * config getter here, and the two `useMemo` lookup sets become `$derived`.
 *
 * The `Set`s are plain, with `svelte/prefer-svelte-reactivity` disabled at each
 * site: each is built fresh inside a `$derived` or as scratch space in a
 * callback, never mutated after construction, so the derived is already the
 * reactive boundary.
 *
 * The returned members are **getters** for the same reason
 * `useTableSortableState`'s are: upstream returns a fresh object each render,
 * so a consumer always reads current values; a Svelte hook returns one object,
 * and a plain property would freeze `activeColumnKeys` at its first value.
 */

// =============================================================================
// Config Type
// =============================================================================

/**
 * Configuration for {@link useTableColumnSettingsState}.
 *
 * The consumer owns the active keys state. This hook provides column
 * visibility operations (toggle, show all, reset) and a config object
 * that feeds directly into `useTableColumnSettings`.
 *
 * @template TColumnKey - String literal union of column keys
 */
export interface UseTableColumnSettingsStateConfig<TColumnKey extends string = string> {
	/**
	 * All available columns with metadata for the settings UI.
	 * This defines the universe of columns the user can toggle.
	 */
	columns: ReadonlyArray<ColumnSettingsOption<TColumnKey>>;

	/**
	 * Currently active column keys, in display order.
	 * Only columns with keys in this array are shown in the table.
	 * The array order determines column display order.
	 */
	activeColumnKeys: ReadonlyArray<TColumnKey>;

	/**
	 * Called when active columns change (toggle, reorder).
	 * Consumer updates their own state.
	 */
	onChangeActiveColumnKeys: (keys: ReadonlyArray<TColumnKey>) => void;

	/**
	 * The default column set for "Reset to default" functionality.
	 * When omitted, `resetToDefault` shows all columns.
	 */
	defaultColumnKeys?: ReadonlyArray<TColumnKey>;
}

// =============================================================================
// Return Type
// =============================================================================

/** Return value of {@link useTableColumnSettingsState}. */
export interface UseTableColumnSettingsStateReturn<TColumnKey extends string = string> {
	/**
	 * Ready-to-use config for `useTableColumnSettings`.
	 * Pass this directly to the plugin hook.
	 */
	readonly columnSettingsConfig: UseTableColumnSettingsStateConfig<TColumnKey>;

	/** Currently active column keys (pass-through from config). */
	readonly activeColumnKeys: ReadonlyArray<TColumnKey>;

	/**
	 * Toggle a column's visibility.
	 * If the column is active, removes it. If inactive, adds it to the end.
	 * No-op for columns with `isAlwaysVisible: true`.
	 */
	toggleColumn: (key: TColumnKey) => void;

	/** Whether a specific column is currently active (visible). */
	isColumnActive: (key: TColumnKey) => boolean;

	/**
	 * Whether a specific column can be toggled.
	 * Returns false for columns with `isAlwaysVisible: true`.
	 */
	isColumnToggleable: (key: TColumnKey) => boolean;

	/** Show all columns. */
	showAllColumns: () => void;

	/**
	 * Reset to the default column set.
	 * Uses `defaultColumnKeys` if provided, otherwise shows all columns.
	 */
	resetToDefault: () => void;

	/**
	 * Set active column keys from a list of key strings.
	 * Enforces that `isAlwaysVisible` columns remain in the active set.
	 * Useful as an `onChange` handler for any list-based column picker.
	 */
	setActiveColumnKeys: (keys: string[]) => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Headless column visibility and ordering state management.
 *
 * Manages which columns are active, provides toggle/reset operations,
 * and produces a config object for `useTableColumnSettings`.
 * Renderer-agnostic — pair with any column picker UI.
 */
export function useTableColumnSettingsState<TColumnKey extends string = string>(
	config: () => UseTableColumnSettingsStateConfig<TColumnKey>
): UseTableColumnSettingsStateReturn<TColumnKey> {
	// Build lookup sets for fast checks
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const activeSet = $derived(new Set(config().activeColumnKeys));

	const alwaysVisibleSet = $derived(
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		new Set(
			config()
				.columns.filter((c) => c.isAlwaysVisible)
				.map((c) => c.key)
		)
	);

	// --- Column operations ---

	const toggleColumn = (key: TColumnKey): void => {
		const cfg = config();
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const avSet = new Set(cfg.columns.filter((c) => c.isAlwaysVisible).map((c) => c.key));
		if (avSet.has(key)) {
			return;
		}

		const currentKeys = cfg.activeColumnKeys;
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const currentSet = new Set(currentKeys);
		if (currentSet.has(key)) {
			cfg.onChangeActiveColumnKeys(currentKeys.filter((k) => k !== key));
		} else {
			cfg.onChangeActiveColumnKeys([...currentKeys, key]);
		}
	};

	const showAllColumns = (): void => {
		const cfg = config();
		cfg.onChangeActiveColumnKeys(cfg.columns.map((c) => c.key));
	};

	const resetToDefault = (): void => {
		const cfg = config();
		if (cfg.defaultColumnKeys) {
			cfg.onChangeActiveColumnKeys([...cfg.defaultColumnKeys]);
		} else {
			cfg.onChangeActiveColumnKeys(cfg.columns.map((c) => c.key));
		}
	};

	const setActiveColumnKeys = (value: string[]): void => {
		const cfg = config();
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const avSet = new Set(cfg.columns.filter((c) => c.isAlwaysVisible).map((c) => c.key));
		// Ensure always-visible columns remain in the set
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const valueSet = new Set(value);
		for (const key of avSet) {
			valueSet.add(key);
		}
		cfg.onChangeActiveColumnKeys(Array.from(valueSet) as unknown as TColumnKey[]);
	};

	return {
		get columnSettingsConfig(): UseTableColumnSettingsStateConfig<TColumnKey> {
			return config();
		},
		get activeColumnKeys(): ReadonlyArray<TColumnKey> {
			return config().activeColumnKeys;
		},
		toggleColumn,
		isColumnActive: (key) => activeSet.has(key),
		isColumnToggleable: (key) => !alwaysVisibleSet.has(key),
		showAllColumns,
		resetToDefault,
		setActiveColumnKeys
	};
}
