/**
 * The plugin transform pipeline, lifted out of Astryx's `Table/BaseTable.tsx`.
 *
 * It lives in its own module here only because `base-table.svelte` cannot hold a
 * generic helper of this shape in its instance script; the function is
 * upstream's verbatim, including the per-plugin `try`/`catch` that stops one
 * broken plugin from taking the whole table down.
 */

import { devError } from '../../utils/dev-warning.js';

/**
 * Run a value through a pipeline of plugin transform functions.
 * Wraps each transform in a try-catch so a single broken plugin
 * doesn't crash the entire table, logging the plugin index and error.
 */
export function applyPlugins<TPlugin, TProps, TArgs extends unknown[]>(
	plugins: TPlugin[],
	getter: (p: TPlugin) => ((props: TProps, ...args: TArgs) => TProps) | undefined,
	initial: TProps,
	...args: TArgs
): TProps {
	return plugins.reduce<TProps>((acc, plugin, index) => {
		const transform = getter(plugin);
		if (!transform) {
			return acc;
		}
		try {
			return transform(acc, ...args);
		} catch (error) {
			devError('Table', `Plugin at index ${index} threw in transform:`, error);
			return acc;
		}
	}, initial);
}
