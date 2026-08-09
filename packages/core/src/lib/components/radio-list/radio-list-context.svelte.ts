import { Context } from '../../internal/context.js';
import type { InputStatus } from '../field/types.js';

/**
 * Svelte equivalent of the `RadioListContext` Astryx exports as a value from
 * `RadioList/index.ts`. A `RadioListItem` reads the group's shared name, the
 * selected value, the change handler, and the size/disabled/status the whole
 * group carries.
 *
 * Stored as a **getter** so a member reading `value`/`size`/`isDisabled` stays
 * reactive; `setRadioListContext` stands in for the `<RadioListContext value>`
 * provider, and `RadioListContext` is published under that name as `SizeContext`
 * is. `useRadioList()` throws when used outside a group, matching upstream.
 */
export type RadioListSize = 'sm' | 'md';

export interface RadioListContextValue {
	name: string;
	value: string;
	onChange: (value: string) => void;
	isDisabled: boolean;
	/**
	 * True when the whole group is disabled *and* a `disabledMessage` is set — the
	 * radios then stay focusable via `aria-disabled` (not the native `disabled`)
	 * so the reason tooltip is keyboard-discoverable; selection stays blocked.
	 */
	hasDisabledMessage: boolean;
	isRequired: boolean;
	size: RadioListSize;
	status?: InputStatus;
}

export const RadioListContext = new Context<() => RadioListContextValue>('astryx.radioList');

export function setRadioListContext(get: () => RadioListContextValue): void {
	RadioListContext.set(get);
}

/** Returns the group getter, throwing when the item is not inside a `RadioList`. */
export function useRadioList(): () => RadioListContextValue {
	const ctx = RadioListContext.getOr(null);
	if (ctx == null) {
		throw new Error('RadioListItem must be used within an RadioList');
	}
	return ctx;
}
