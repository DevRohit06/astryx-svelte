import type { TablePlugin } from './table-types.js';
import { devWarn } from '../../utils/dev-warning.js';

/**
 * Ported from Astryx's `Table/useBaseTablePlugins.ts`.
 *
 * ## Plugin Ordering
 *
 * First-party plugins are sorted into a canonical order so that plugin
 * interactions are deterministic regardless of how the consumer writes
 * their `plugins={{ ... }}` record. Unknown/custom plugin names are
 * appended after the known set in their original record order.
 *
 * Canonical order:
 *   1. columnSettings — column filtering (future: transformColumns)
 *   2. sort           — header cell sort controls
 *   3. tree           — indent + expander on the tree column
 *   4. selection      — checkbox column + row selection
 *   5. pagination     — pagination controls around the table
 *
 * Rationale:
 * - columnSettings filters columns before sort/selection see them
 * - sort adds header cell UI before selection adds its header column
 * - tree wraps the first *user* column before selection prepends its
 *   checkbox column, so the expander never lands in the checkbox column
 * - selection adds its column after sort so the checkbox header
 *   doesn't get a sort button
 * - pagination wraps the table in context last (outermost provider)
 *
 * ## What the port changes
 *
 * Upstream hand-rolls memoisation with a ref and a key-by-key identity
 * comparison, purely so `React.memo`'d rows don't re-render when a consumer
 * writes `plugins={{selection: stablePlugin}}` inline. `$derived.by` is that
 * memo, so the ref, the fast path and `arePluginRecordsEqual` all collapse into
 * it — the same reason `CodeBlock` needed no `React.memo` counterpart. The
 * arguments are getters, which is what gives the derived something to track.
 */

// =============================================================================
// Canonical Plugin Order
// =============================================================================

/**
 * Canonical ordering for first-party plugin names.
 * Plugins are sorted by their position in this array.
 * Unknown names are appended after the known set.
 */
const PLUGIN_ORDER: ReadonlyArray<string> = [
	'columnSettings',
	'sort',
	'tree',
	'selection',
	'pagination'
];

/** Lookup map for O(1) ordering checks. */
const PLUGIN_ORDER_MAP = new Map(PLUGIN_ORDER.map((name, index) => [name, index]));

/**
 * Sort plugin entries into canonical order.
 * Known plugins are sorted by PLUGIN_ORDER; unknown plugins preserve
 * their original record insertion order and appear after all known plugins.
 */
function sortPluginEntries<T extends Record<string, unknown>>(
	entries: [string, TablePlugin<T>][]
): [string, TablePlugin<T>][] {
	// Sentinel value for unknown plugins — higher than any known index
	const unknownBase = PLUGIN_ORDER.length;

	return entries.sort(([a], [b]) => {
		const orderA = PLUGIN_ORDER_MAP.get(a) ?? unknownBase;
		const orderB = PLUGIN_ORDER_MAP.get(b) ?? unknownBase;

		// If both are unknown, preserve original order (sort is stable)
		return orderA - orderB;
	});
}

// =============================================================================
// Plugin Validation
// =============================================================================

/** Known transform method names on the TablePlugin interface. */
const VALID_TRANSFORM_KEYS = new Set([
	'transformColumns',
	'transformTable',
	'transformHeaderRow',
	'transformHeaderCell',
	'transformBodyRow',
	'transformBodyCell',
	'transformScrollWrapper',
	'transformTableContext'
]);

/**
 * Validate a plugin object in development mode.
 * Warns about common mistakes like misspelled transform names,
 * non-function values where functions are expected, or
 * completely empty plugins that add pipeline overhead for nothing.
 */
function validatePlugin<T extends Record<string, unknown>>(
	name: string,
	plugin: TablePlugin<T>
): void {
	// Validation always runs — warnings are cheap and help catch plugin bugs

	const keys = Object.keys(plugin);

	// Warn about unknown keys (likely misspelled transform names)
	for (const key of keys) {
		if (!VALID_TRANSFORM_KEYS.has(key)) {
			devWarn(
				'Table',
				`Plugin "${name}" has unknown key "${key}". ` +
					`Valid keys: ${[...VALID_TRANSFORM_KEYS].join(', ')}. ` +
					`This key will be ignored.`
			);
		}
	}

	// Warn about non-function values on known transform keys
	for (const key of keys) {
		if (VALID_TRANSFORM_KEYS.has(key)) {
			const value = (plugin as Record<string, unknown>)[key];
			if (value != null && typeof value !== 'function') {
				devWarn(
					'Table',
					`Plugin "${name}" has non-function value for "${key}" ` +
						`(got ${typeof value}). Transform will be skipped.`
				);
			}
		}
	}

	// Warn about empty plugins that add pipeline overhead
	const hasTransforms = keys.some(
		(key) =>
			VALID_TRANSFORM_KEYS.has(key) &&
			typeof (plugin as Record<string, unknown>)[key] === 'function'
	);
	if (!hasTransforms) {
		devWarn(
			'Table',
			`Plugin "${name}" has no transform methods. ` +
				`It will be included in the pipeline but won't do anything.`
		);
	}
}

/** A live, canonically-ordered plugin array. */
export interface BaseTablePlugins<T extends Record<string, unknown>> {
	readonly current: TablePlugin<T>[];
}

/**
 * Converts a named plugin record (`Record<string, TablePlugin>`) to a
 * canonically-ordered array for `BaseTable`.
 *
 * Plugins are sorted into a canonical order (see PLUGIN_ORDER) so that
 * interactions between first-party plugins are deterministic.
 *
 * @param basePlugins - Getter for the built-in plugins (e.g. Astryx's style plugin)
 * @param userPlugins - Getter for the named plugin record from the consumer
 *
 * @example
 * ```ts
 * const plugins = useBaseTablePlugins(() => [tablePlugin], () => userPlugins);
 * // <BaseTable plugins={plugins.current} … />
 * ```
 */
export function useBaseTablePlugins<T extends Record<string, unknown>>(
	basePlugins: () => TablePlugin<T>[],
	userPlugins: () => Record<string, TablePlugin<T>> | undefined
): BaseTablePlugins<T> {
	const plugins = $derived.by(() => {
		const base = basePlugins();
		const user = userPlugins();

		// Sort user plugins into canonical order
		const sortedUserPlugins = user
			? sortPluginEntries(Object.entries(user)).map(([, plugin]) => plugin)
			: [];

		if (user) {
			for (const [name, plugin] of Object.entries(user)) {
				validatePlugin(name, plugin);
			}
		}

		return [...base, ...sortedUserPlugins];
	});

	return {
		get current(): TablePlugin<T>[] {
			return plugins;
		}
	};
}
