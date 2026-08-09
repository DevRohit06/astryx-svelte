import { Context } from 'runed';

/**
 * Svelte equivalent of upstream's `SegmentedControlContext`. A
 * `SegmentedControlItem` reads the group's selected value, change handler,
 * size/layout, and disabled state.
 *
 * Stored as a **getter** so a member reading `value`/`size`/`isDisabled` stays
 * reactive. Unlike `RadioListContext`, upstream keeps this context module-private
 * (it is not re-exported from `index.ts`), so the port keeps it internal too.
 */
export type SegmentedControlSize = 'sm' | 'md' | 'lg';
export type SegmentedControlLayout = 'hug' | 'fill';

export interface SegmentedControlContextValue {
	value: string;
	onChange: (value: string) => void;
	size: SegmentedControlSize;
	layout: SegmentedControlLayout;
	isDisabled: boolean;
	/**
	 * True when the whole control is disabled *and* a `disabledMessage` is set. The
	 * selected segment then stays focusable via `aria-disabled` (not dropped from
	 * the tab order) so the disabled-reason tooltip is keyboard-discoverable;
	 * selection stays blocked.
	 */
	hasDisabledMessage?: boolean;
}

const SegmentedControlContext = new Context<() => SegmentedControlContextValue>(
	'astryx.segmentedControl'
);

export function setSegmentedControlContext(get: () => SegmentedControlContextValue): void {
	SegmentedControlContext.set(get);
}

/** Returns the group getter, throwing when the item is not inside a `SegmentedControl`. */
export function useSegmentedControlContext(): () => SegmentedControlContextValue {
	const ctx = SegmentedControlContext.getOr(null);
	if (ctx == null) {
		throw new Error(
			'useSegmentedControlContext must be used within SegmentedControl. ' +
				'Wrap your SegmentedControlItem in <SegmentedControl>.'
		);
	}
	return ctx;
}
