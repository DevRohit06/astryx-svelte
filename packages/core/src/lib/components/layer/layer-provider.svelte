<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { LayerToastConfig } from './layer-context.js';

	export interface LayerProviderProps {
		children: Snippet;
		/** Toast configuration. Omit to use defaults. */
		toast?: LayerToastConfig;
	}

	// Upstream's module-level `DEFAULT_TOAST_CONFIG`, kept as a constant for the
	// same reason: a fresh `{}` per instance would be a new identity every time.
	const DEFAULT_TOAST_CONFIG: LayerToastConfig = {};
</script>

<script lang="ts">
	import ToastViewport from '../toast/toast-viewport.svelte';
	import { setLayerContext, useLayerContext, type LayerContextValue } from './layer-context.js';

	/**
	 * App-level provider for layer systems (toast, sheet, imperative modals),
	 * ported from Astryx's `Layer/LayerProvider.tsx`.
	 *
	 * Optional — `useToast` falls back to a lazy self-mounting viewport when no
	 * provider exists. Nested providers are no-ops.
	 *
	 * **The nesting check reads the context before setting it**, which is what
	 * makes it see ancestors only: Svelte's context map includes a component's
	 * own writes, so a read after `setLayerContext` would always find one. That is
	 * the same hazard `<Theme>` documents, and it is avoided here for free because
	 * upstream's own order — `useLayerContext()` first, provide second — already
	 * has the read on top.
	 *
	 * @example
	 * ```svelte
	 * <LayerProvider toast={{ position: 'topEnd', maxVisible: 3 }}>
	 *   <App />
	 * </LayerProvider>
	 * ```
	 */
	const { children, toast: toastConfig = DEFAULT_TOAST_CONFIG }: LayerProviderProps = $props();

	// Read before the write below, deliberately — see the note above.
	const existingContext = useLayerContext();
	const isNested = existingContext !== null;

	const contextValue = $derived<LayerContextValue>({ toastConfig, isProvider: true });

	if (!isNested) {
		setLayerContext(() => contextValue);
	}
</script>

{#if isNested}
	<!-- Nested provider — pass through, as upstream's `<>{children}</>` does. -->
	{@render children()}
{:else}
	<ToastViewport
		position={toastConfig.position}
		maxVisible={toastConfig.maxVisible}
		inset={toastConfig.inset}
	>
		{@render children()}
	</ToastViewport>
{/if}
