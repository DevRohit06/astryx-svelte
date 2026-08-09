/**
 * Ported from Astryx's `Field/types.ts` — the types the input family shares.
 *
 * `Field` itself is unported; this file lands ahead of it because `FieldStatus`
 * is typed by `InputStatusType` and nothing else in the directory is needed to
 * say what a status is.
 */

/** Status type for input validation states. */
export type InputStatusType = 'warning' | 'error' | 'success';

/**
 * Status indicator for input components. Used by `TextInput`, `TextArea`,
 * `DatePicker`, `TimePicker` and the rest of the family.
 */
export interface InputStatus {
	/**
	 * - `error`: invalid input, prevents form submission
	 * - `warning`: caution, but allows submission
	 * - `success`: valid input confirmation
	 */
	type: InputStatusType;
	/** Message shown below the input. Set it to get a coloured message box. */
	message?: string;
}

/** Standard size options for input components. */
export type InputSize = 'sm' | 'md' | 'lg';
