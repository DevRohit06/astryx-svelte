import { Context } from 'runed';

/**
 * Svelte equivalent of Astryx's `CheckboxList/CheckboxListContext.tsx`.
 *
 * Read by two consumers, for different reasons: `CheckboxListItem` takes its
 * checked state, disabled/read-only inheritance and pending-item spinner from
 * it, while `CheckboxInput` reads exactly one field — `hasDisabledMessage` —
 * so a checkbox inside a disabled-with-a-reason group keeps native focusability
 * via `aria-disabled` and the group's tooltip stays keyboard-reachable.
 *
 * Stored as a **getter** so a consumer re-reads a changing `value`/`isDisabled`,
 * where upstream re-renders on the memoised context value. The context is
 * *optional*: upstream's `use(CheckboxListContext)` yields `null` outside a
 * `<CheckboxList>` and both consumers guard for it — `CheckboxInput` with
 * `?? false`, `CheckboxListItem` with `ctx != null` — so a bare
 * `<CheckboxListItem>` inside a plain `<List>` still renders in standalone mode.
 * Hence `getOr(null)` rather than the throwing accessor `useRadioList()` uses.
 *
 * `CheckboxListContext` is module-private upstream (`CheckboxList/index.ts`
 * exports only the two components and their prop types, unlike `RadioList`'s,
 * which does publish its context), so it is not re-exported here either.
 */
export interface CheckboxListContextValue {
	/** The selected values, or `undefined` outside collection mode. */
	value?: string[];
	/** Toggle handler, or `undefined` outside collection mode. */
	onChange?: (values: string[], toggledValue?: string) => void;
	/** Whether the whole group is disabled. */
	isDisabled: boolean;
	/**
	 * Whether the group renders its own disabled-reason tooltip. Signals each
	 * `CheckboxInput` to stay focusable via `aria-disabled` so the reason is
	 * discoverable, rather than going natively `disabled`.
	 */
	hasDisabledMessage?: boolean;
	/** Whether the whole group is read-only. */
	isReadOnly: boolean;
	/** The value whose `changeAction` is currently pending, if any. */
	loadingValue?: string | null;
}

const CheckboxListContext = new Context<() => CheckboxListContextValue>('astryx.checkbox-list');

export function setCheckboxListContext(get: () => CheckboxListContextValue): void {
	CheckboxListContext.set(get);
}

/** Returns the enclosing group's getter, or `null` for a standalone checkbox. */
export function useCheckboxList(): (() => CheckboxListContextValue) | null {
	return CheckboxListContext.getOr(null);
}
