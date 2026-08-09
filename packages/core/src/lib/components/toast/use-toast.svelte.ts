import { mount } from 'svelte';
import { dataAttr } from '../../internal/naming.js';
import { warnOnce } from '../../utils/dev-warning.js';
import { useToastContext, type ToastContextValue } from './toast-context.js';
import { takeFallbackCapture } from './fallback-slot.js';
import ToastFallback from './toast-fallback.svelte';
import type { ToastOptions, ToastDismissFn, ShowToastFn, ToastEntry } from './types.js';

// Fallback singleton
let fallbackContext: ToastContextValue | null = null;

const ROOT_THEME_ATTRS = ['data-theme', dataAttr('theme')] as const;

/**
 * The fallback container is a detached tree with no theme ancestor, so this
 * mirrors `<html>`'s theme attributes onto it directly (live via
 * `MutationObserver`) for the theme's scoped CSS to reach it. It's a
 * lifetime-of-app singleton that's never torn down, so there's nothing to
 * disconnect — this returns void.
 */
function syncRootThemeAttrs(container: HTMLElement): void {
	const sync = (): void => {
		let mirroredMode: string | null = null;
		for (const attr of ROOT_THEME_ATTRS) {
			const value = document.documentElement.getAttribute(attr);
			if (value == null) {
				container.removeAttribute(attr);
			} else {
				container.setAttribute(attr, value);
				if (attr === 'data-theme') {
					mirroredMode = value;
				}
			}
		}
		// Pages whose built theme CSS pins color-scheme unconditionally (#3658)
		// would otherwise resolve light-dark() tokens by OS preference while the
		// mirrored mode above follows the app theme; the inline style wins over
		// that CSS.
		if (mirroredMode === 'light' || mirroredMode === 'dark') {
			container.style.colorScheme = mirroredMode;
		} else {
			container.style.removeProperty('color-scheme');
		}
	};
	sync();
	const observer = new MutationObserver(sync);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: [...ROOT_THEME_ATTRS]
	});
}

function getFallbackContext(): ToastContextValue {
	if (fallbackContext) {
		return fallbackContext;
	}

	if (typeof document === 'undefined') {
		throw new Error(
			'useToast: Cannot create fallback viewport during SSR. ' +
				'Wrap your app with <LayerProvider> or <AppShell>.'
		);
	}

	warnOnce(
		'toast-fallback-viewport',
		'useToast',
		'No LayerProvider found. Using fallback viewport. ' +
			'Wrap your app with <LayerProvider> or <AppShell> for full control.'
	);

	const container = document.createElement('div');
	container.setAttribute('data-astryx-toast-fallback', '');
	document.body.appendChild(container);
	syncRootThemeAttrs(container);

	// `mount()` is synchronous, so the capture child has published the viewport's
	// context by the time this returns. Upstream's `createRoot().render()` is
	// not, which is the only reason it needs a promise handshake and a queue of
	// pending entries to flush — both drop out here.
	mount(ToastFallback, { target: container });

	const captured = takeFallbackCapture();
	if (!captured) {
		throw new Error('useToast: fallback viewport failed to publish its context.');
	}

	fallbackContext = captured;
	return fallbackContext;
}

let toastIdCounter = 0;
function generateToastId(): string {
	return `astryx-toast-${++toastIdCounter}`;
}

/**
 * Hook to show toast notifications.
 *
 * Returns an imperative function that shows a toast and returns a dismiss
 * function. Works with or without a provider — falls back to a self-mounting
 * viewport.
 *
 * Must be called during component initialisation, like every context-reading
 * hook in this port; the returned `showToast` can be called at any time.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const toast = useToast();
 *
 *   async function handleSave() {
 *     try {
 *       await saveData();
 *       toast({ body: 'Saved successfully' });
 *     } catch {
 *       toast({ body: 'Failed to save', type: 'error' });
 *     }
 *   }
 * </script>
 *
 * <Button label="Save" onclick={handleSave} />
 * ```
 */
export function useToast(): ShowToastFn {
	const contextFromProvider = useToastContext();

	return (options: ToastOptions): ToastDismissFn => {
		const ctx = contextFromProvider ? contextFromProvider() : getFallbackContext();
		const id = generateToastId();
		const entry: ToastEntry = { id, options, createdAt: Date.now() };
		ctx.addToast(entry);
		return () => ctx.removeToast(id, 'manual');
	};
}
