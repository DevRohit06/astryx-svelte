import type { Snippet } from 'svelte';

/** Toast status type. Controls color scheme. */
export type ToastType = 'info' | 'error';

/** Position for the toast stack relative to the viewport. */
export type ToastPosition = 'topEnd' | 'topStart' | 'bottomEnd' | 'bottomStart';

/** Behavior when a toast with the same uniqueID already exists. */
export type ToastCollisionBehavior = 'overwrite' | 'ignore';

/** Reason why a toast was dismissed. */
export type ToastDismissReason = 'auto' | 'manual';

/**
 * A toast content slot.
 *
 * Upstream types `body`/`endContent` as `ReactNode`, and a toast is shown
 * *imperatively* — the caller hands the content to `showToast()` as an option
 * value rather than writing it as component content. There is therefore no
 * markup position for Svelte to capture, so the slot is `string | Snippet`:
 * the same leaf-slot discrimination (`typeof === 'function'`) the rest of the
 * port uses. See TODO.md → Known debts.
 */
export type ToastContent = string | Snippet;

/** Options for showing a toast. */
export interface ToastOptions {
	/** Primary message content. */
	body: ToastContent;
	/**
	 * Toast type controlling color.
	 * @default 'info'
	 */
	type?: ToastType;
	/**
	 * Whether the toast auto-dismisses.
	 * Defaults to true for info, false for error.
	 */
	isAutoHide?: boolean;
	/**
	 * Duration in ms before auto-dismiss.
	 * @default 5000
	 */
	autoHideDuration?: number;
	/** Content rendered at the end of the toast (trailing slot). */
	endContent?: ToastContent;

	/** Unique identifier for deduplication. */
	uniqueID?: string;
	/**
	 * Behavior when a toast with matching uniqueID already exists.
	 * @default 'overwrite'
	 */
	collisionBehavior?: ToastCollisionBehavior;
	/** Callback fired when the toast is removed. */
	onHide?: (reason: ToastDismissReason) => void;
}

/** Function to programmatically dismiss a toast. */
export type ToastDismissFn = () => void;

/** Function returned by useToast to show toasts. */
export type ShowToastFn = (options: ToastOptions) => ToastDismissFn;

/**
 * Internal toast state with ID and metadata.
 *
 * Module-private upstream (`index.ts` does not re-export it), so it is not
 * published here either.
 */
export interface ToastEntry {
	id: string;
	options: ToastOptions;
	createdAt: number;
}
