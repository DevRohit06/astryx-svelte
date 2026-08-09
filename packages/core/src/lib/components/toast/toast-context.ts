import { Context } from 'runed';
import type { ToastEntry, ToastDismissReason } from './types.js';

/**
 * Internal context value for toast state management.
 *
 * Module-private upstream — `Toast/index.ts` re-exports neither `ToastContext`
 * nor `ToastContextValue`, so neither is published here.
 */
export interface ToastContextValue {
	/** Add a toast. */
	addToast: (entry: ToastEntry) => void;
	/** Remove a toast by ID with a reason. */
	removeToast: (id: string, reason: ToastDismissReason) => void;
	/** Find a toast by uniqueID. */
	findByUniqueID: (uniqueID: string) => ToastEntry | undefined;
}

/**
 * Context for toast state. Absent means no viewport is mounted above this
 * component — `useToast` then falls back to a self-mounting viewport, exactly
 * as upstream's `createContext(null)` default drives the same branch.
 */
const toastContext = new Context<() => ToastContextValue>('astryx.toast');

export function setToastContext(get: () => ToastContextValue): void {
	toastContext.set(get);
}

/** Returns a getter, or null when there is no `ToastViewport` ancestor. */
export function useToastContext(): (() => ToastContextValue) | null {
	return toastContext.getOr(null);
}
