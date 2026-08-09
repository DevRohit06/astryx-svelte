import { Context } from '../../internal/context.js';

/**
 * Svelte equivalent of Astryx's `TabList/TabListContext.ts`.
 *
 * Written by `TabList`, read by every `Tab` and `TabMenu` for the selected
 * value, the change callback, and the size/layout the strip carries. Stored as a
 * **getter**, per the port's context convention, so a changing `value` reaches
 * the tabs; upstream re-renders on the memoised object.
 *
 * `useTabListContext()` throws outside a `TabList`, as upstream's does — the
 * only thing a tab can do without one is render wrong. Upstream also exports the
 * `TabListContext` object; a Svelte context has no equivalent value to publish,
 * so only the reader and the value type are public, as `DropdownMenu`'s are.
 */

/**
 * Size variants for tab list items. The same element-size tokens `Button` and
 * `TextInput` use (`sm` = 28px, `md` = 32px, `lg` = 36px).
 */
export type TabListSize = 'sm' | 'md' | 'lg';

/**
 * Layout mode for tab sizing.
 * - `'hug'`: each tab hugs its content width.
 * - `'fill'`: tabs stretch equally to fill the container width.
 */
export type TabListLayout = 'hug' | 'fill';

/** What `TabList` publishes to its `Tab`/`TabMenu` children. */
export interface TabListContextValue {
	value: string;
	onChange: (value: string) => void;
	size: TabListSize;
	layout: TabListLayout;
}

const TabListContext = new Context<() => TabListContextValue>('astryx.tabList');

export function setTabListContext(get: () => TabListContextValue): void {
	TabListContext.set(get);
}

/** The strip's getter, throwing when the tab is not inside a `TabList`. */
export function useTabListContext(): () => TabListContextValue {
	const ctx = TabListContext.getOr(null);
	if (ctx == null) {
		throw new Error(
			'useTabListContext must be used within TabList. Wrap your Tab/TabMenu in <TabList>.'
		);
	}
	return ctx;
}
