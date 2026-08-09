import { Context } from 'runed';
import type { ButtonSize } from '../button/button.stylex.js';

/**
 * Svelte equivalent of upstream's `ToggleButtonGroupContext`. A `ToggleButton`
 * with a `value` reads the group's selected set, toggle handler, size and
 * disabled state.
 *
 * Stored as a **getter** so a member reading `selectedValues`/`size`/`isDisabled`
 * stays reactive. Upstream exports the context from `ToggleButtonGroup.tsx` only
 * so `ToggleButton` can import the hook — it is NOT re-exported from `index.ts`,
 * so the port keeps it barrel-private too.
 */
export interface ToggleButtonGroupContextValue {
	/** Currently selected value(s). */
	selectedValues: Set<string>;
	/** Toggle a value on/off. */
	toggle: (value: string) => void;
	/** Group size default — individual buttons can override. */
	size?: ButtonSize;
	/** Group disabled state. */
	isDisabled?: boolean;
}

const ToggleButtonGroupContext = new Context<() => ToggleButtonGroupContextValue>(
	'astryx.toggleButtonGroup'
);

export function setToggleButtonGroupContext(get: () => ToggleButtonGroupContextValue): void {
	ToggleButtonGroupContext.set(get);
}

/** Returns the group getter, or null when the button is not inside a group. */
export function useToggleButtonGroup(): (() => ToggleButtonGroupContextValue) | null {
	return ToggleButtonGroupContext.getOr(null);
}
