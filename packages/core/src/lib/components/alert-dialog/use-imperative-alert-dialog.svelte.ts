import type { AlertDialogProps } from './alert-dialog.svelte';

/**
 * The `AlertDialog` props `useImperativeAlertDialog` owns itself, so a caller
 * cannot pass them. Module-private upstream — `AlertDialog/index.ts` does not
 * re-export it.
 */
type AlertDialogOptions = Omit<AlertDialogProps, 'isOpen' | 'onOpenChange'>;

export interface ImperativeAlertDialogReturn {
	/** Show the alert dialog. */
	show: (options: AlertDialogOptions) => void;
	/** Hide the alert dialog. */
	hide: () => void;
	/** Whether the dialog is currently open. */
	readonly isOpen: boolean;
	/**
	 * The options of the most recent `show()`, or `null` before the first one.
	 *
	 * Upstream's `ImperativeAlertDialogReturn` has no such member: its `element`
	 * closure owned the options state directly, and returned `null` while it was
	 * unset. Splitting the rendering half out means
	 * `<ImperativeAlertDialogLayer>` needs a way back in — the same seam
	 * `useLightbox` opens with `options`/`setIndex`, for the same reason.
	 */
	readonly options: AlertDialogOptions | null;
}

/**
 * Imperative alert dialog — show/hide without managing state.
 *
 * Upstream returns a ready-made `element: ReactNode` for the caller to drop in
 * their JSX. A Svelte hook cannot return markup, so the rendering half becomes
 * `<ImperativeAlertDialogLayer {alert} />` — the same split `useLayer` →
 * `<Layer>`, `useTooltip` → `<TooltipLayer>`, `useKeyboardHint` →
 * `<KeyboardHintLayer>` and `useLightbox` → `<LightboxLayer>` already take.
 * `ImperativeAlertDialogLayer` is therefore an export upstream has no
 * counterpart for; see port/todo.md → Known debts.
 *
 * Unlike `useImperativeDialog`, this hook takes no default options: every
 * `show()` replaces the bag outright rather than merging onto it, because
 * `title`/`description`/`actionLabel`/`onAction` are all required.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const alert = useImperativeAlertDialog();
 * </script>
 *
 * <Button
 *   label="Delete"
 *   variant="destructive"
 *   onclick={() =>
 *     alert.show({
 *       title: 'Delete item?',
 *       description: 'This action cannot be undone.',
 *       actionLabel: 'Delete',
 *       onAction: () => alert.hide()
 *     })}
 * />
 * <ImperativeAlertDialogLayer {alert} />
 * ```
 */
export function useImperativeAlertDialog(): ImperativeAlertDialogReturn {
	let isOpen = $state(false);
	// `$state.raw` because upstream treats the options bag as opaque and replaces
	// it wholesale; deep-proxying it would make a caller mutating the object it
	// passed re-render the dialog, which React does not do.
	let options = $state.raw<AlertDialogOptions | null>(null);

	function show(newOptions: AlertDialogOptions): void {
		options = newOptions;
		isOpen = true;
	}

	function hide(): void {
		isOpen = false;
	}

	return {
		show,
		hide,
		get isOpen() {
			return isOpen;
		},
		get options() {
			return options;
		}
	};
}
