import { Context } from '../../internal/context.js';

/**
 * Svelte equivalent of Astryx's `InputGroup/InputGroupContext.ts`.
 *
 * A member control (`TextInput`, `NumberInput`, `Selector`, …) reads this to
 * learn it is inside an `InputGroup` and to compose its own accessibility ids
 * with the group's: the group owns the label and the shared description/status
 * ids, so the child points its `aria-labelledby`/`aria-describedby` at them
 * rather than minting its own `Field`.
 *
 * As every context here does, it stores a **getter** rather than the value —
 * `describedByIDs` recomputes when the group's `description` or `status.message`
 * change, and a frozen value would strand a child at its mount-time state. The
 * provider (`setInputGroupContext`) closes over the group's reactive state;
 * consumers call `useInputGroup()` at init and read the returned getter inside
 * `$derived`.
 *
 * Upstream's `index.ts` publishes `useInputGroup` and `InputGroupContextValue`
 * but not the context object itself, so this module exports the same surface —
 * `setInputGroupContext` stands in for React's `<InputGroupContext value>`.
 */
export interface InputGroupContextValue {
	/** Always `true` — a member reads it purely as "I am inside a group". */
	isInGroup: true;
	/** Id of the group's label element, for the child's `aria-labelledby`. */
	labelID: string;
	/**
	 * Space-joined ids of the group's description and status message, or
	 * `undefined` when neither is present. Reactive — hence the getter.
	 */
	describedByIDs: string | undefined;
}

const inputGroupContext = new Context<() => InputGroupContextValue>('astryx.inputGroup');

export function setInputGroupContext(get: () => InputGroupContextValue): void {
	inputGroupContext.set(get);
}

/** Returns a getter, or null when the component is not inside an `InputGroup`. */
export function useInputGroup(): (() => InputGroupContextValue) | null {
	return inputGroupContext.getOr(null);
}
