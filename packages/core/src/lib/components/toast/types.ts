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
 * port uses. See port/debts.md → Known debts.
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
	/**
	 * Replaces the content of this toast's card with your own layout.
	 *
	 * Astryx keeps the card, live-region role and auto-hide behavior, then hands
	 * the renderer this toast's content, resolved settings and `dismiss`
	 * callback. The renderer owns every control inside its layout; call
	 * `dismiss` from the control that should close the toast. Astryx does not
	 * inject a fallback control into custom content.
	 *
	 * Per-toast rather than app-wide on purpose. An app that wants every one of
	 * its toasts to share a layout wraps `useToast()` once and passes this on
	 * every call; a toast raised by library code that knows nothing about that
	 * wrapper then renders as an ordinary Astryx toast.
	 */
	renderContent?: ToastContentRenderFn;

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

/** Values passed to a custom toast content renderer. */
export interface ToastContentRenderProps {
	/** Primary message content, as passed to `showToast`. */
	body: ToastContent;
	/** Trailing content, as passed to `showToast`. Place it in your layout. */
	endContent?: ToastContent;
	/** Resolved toast type — `'error'` also makes the live region assertive. */
	type: ToastType;
	/** Whether this toast will dismiss itself. */
	isAutoHide: boolean;
	/** Milliseconds until auto-dismiss, when `isAutoHide`. */
	autoHideDuration: number;
	/**
	 * Dismisses this toast with reason `'manual'`. Pass it through any nested
	 * components that need to close the toast.
	 */
	dismiss: ToastDismissFn;
}

/**
 * Renders the content of one toast inside Astryx's card — see
 * `ToastOptions.renderContent`.
 *
 * Upstream's `(toast: ToastContentRenderProps) => ReactNode` is a render
 * function; a snippet taking the same single parameter is this port's
 * counterpart, as it is for every other node-returning render prop here
 * (`Selector.renderOption`, `Table.renderCell`, `Popover.trigger`).
 */
export type ToastContentRenderFn = Snippet<[ToastContentRenderProps]>;

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
