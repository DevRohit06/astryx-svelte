import { Context } from 'runed';

/**
 * Ported from Astryx's `Layer/LayerContext.ts`.
 *
 * Note what this context is *not*: nothing outside `Layer/` reads it, upstream
 * included — `LayerProvider` is its only writer, and its only reader is
 * `LayerProvider` itself, checking whether it is nested. It exists for the
 * layer systems upstream's own docstring anticipates (toast, sheet, imperative
 * modals), none of which consult it yet. `useToast` in particular does **not**:
 * it keys off `ToastContext`, which `ToastViewport` sets. Ported as surface, so
 * a consumer's `LayerProvider` behaves as upstream's does.
 */

/** Toast configuration passed through the layer provider. */
export interface LayerToastConfig {
	/** Position of the toast stack. @default 'bottomEnd' */
	position?: 'topEnd' | 'topStart' | 'bottomEnd' | 'bottomStart';
	/** Maximum visible toasts. @default 5 */
	maxVisible?: number;
	/** Inset from viewport edges. */
	inset?: {
		top?: number;
		bottom?: number;
		start?: number;
		end?: number;
	};
}

/** Context value provided by `LayerProvider`. */
export interface LayerContextValue {
	/** Toast configuration from the provider. */
	toastConfig: LayerToastConfig;
	/** Whether this is a real provider (not fallback). */
	isProvider: true;
}

/**
 * Context for the layer provider. Absent means no `LayerProvider` ancestor —
 * upstream's `createContext<LayerContextValue | null>(null)` default drives the
 * same branch.
 *
 * Module-public but **not** on the root barrel, because upstream's root does not
 * carry it either (only `Layer/index.ts` does, and this port ships no
 * per-component subpaths) — the `focusableSelector` rule.
 */
const layerContext = new Context<() => LayerContextValue>('astryx.layer');

export function setLayerContext(get: () => LayerContextValue): void {
	layerContext.set(get);
}

/** Returns a getter, or null when there is no `LayerProvider` ancestor. */
export function useLayerContext(): (() => LayerContextValue) | null {
	return layerContext.getOr(null);
}
