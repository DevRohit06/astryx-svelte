import type { ToastContextValue } from './toast-context.js';

/**
 * The handoff between the fallback `ToastViewport` and `getFallbackContext()`.
 *
 * Upstream captures the context out of its detached React root with a promise
 * plus a pending-entry queue, because `createRoot().render()` is asynchronous —
 * the context does not exist when `getFallbackContext()` returns. Svelte's
 * `mount()` is synchronous, so the capture child has already run by then and a
 * single-slot handoff is enough.
 *
 * A module-level slot rather than a callback prop: the capture happens during
 * component initialisation, and reading a `$props()` value there is exactly what
 * `state_referenced_locally` warns about. Nothing is concurrent — `mount()` runs
 * to completion on one thread — so the slot is written and taken in the same
 * synchronous stretch, and `take` clears it so a second fallback can never read
 * a stale value.
 */
let slot: ToastContextValue | null = null;

export function setFallbackCapture(ctx: ToastContextValue): void {
	slot = ctx;
}

export function takeFallbackCapture(): ToastContextValue | null {
	const captured = slot;
	slot = null;
	return captured;
}
