<script lang="ts" module>
	import type {
		ToastType,
		ToastDismissReason,
		ToastContent,
		ToastContentRenderFn
	} from './types.js';

	export interface ToastProps {
		type: ToastType;
		body: ToastContent;
		endContent?: ToastContent;
		isAutoHide: boolean;
		autoHideDuration: number;
		isExiting?: boolean;
		onDismiss: (reason: ToastDismissReason) => void;
		/**
		 * Replaces the content of this toast's card with your own layout. Direct
		 * `Toast` renders use the same contract as `ToastOptions.renderContent`;
		 * apps normally set it per toast in the options passed to `useToast()`.
		 */
		renderContent?: ToastContentRenderFn;
	}
</script>

<script lang="ts">
	import ToastSurface from './toast-surface.svelte';

	/**
	 * Individual toast notification.
	 *
	 * Renders with inverted surface colors for the default variant, and
	 * error-inverted for the error variant. Applies MediaTheme for that surface,
	 * unless the painted colors make the chosen side unreadable — a theme is free
	 * to define an "inverted" background that is not. Pauses auto-dismiss on
	 * hover and focus.
	 *
	 * `ToastProps` is a closed list upstream — it does not extend `BaseProps`, so
	 * there is no `class`/`style`/`xstyle` and no rest spread. A toast is only
	 * ever constructed by `ToastViewport` from a `ToastOptions`.
	 *
	 * Upstream splits the implementation into a `ToastSurface` that also takes a
	 * `gestureDirection`, and keeps `Toast` as the published wrapper that pins it
	 * to `1` — a toast rendered on its own swipes towards the block end. The
	 * viewport renders the surface directly and resolves the direction from the
	 * stack's position, which is why the prop is not on `ToastProps`.
	 *
	 * @example
	 * ```svelte
	 * <Toast
	 *   type="info"
	 *   body="Saved successfully"
	 *   isAutoHide={true}
	 *   autoHideDuration={5000}
	 *   onDismiss={(reason) => removeToast(id, reason)}
	 * />
	 * ```
	 */
	const props: ToastProps = $props();
</script>

<ToastSurface {...props} gestureDirection={1} />
