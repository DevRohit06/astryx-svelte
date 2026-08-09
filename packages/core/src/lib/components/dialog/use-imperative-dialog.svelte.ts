import type { Snippet } from 'svelte';
import type { DialogProps } from './dialog.svelte';

/**
 * The `Dialog` props `useImperativeDialog` owns itself, so a caller cannot pass
 * them. Module-private upstream — `Dialog/index.ts` does not re-export it.
 */
type DialogOptions = Omit<DialogProps, 'isOpen' | 'onOpenChange' | 'children'>;

/**
 * Content handed to `show()`.
 *
 * Upstream's parameter is `ReactNode`. A dialog is shown *imperatively* — the
 * caller passes content as an argument rather than in a markup position — so
 * there is nothing to capture as a slot and the string branch is reachable.
 * This is the same leaf-slot translation `ToastOptions.body` already settles;
 * it is not exported under a public name for the same reason that one is not,
 * because upstream's counterpart is React's own `ReactNode`.
 */
type ImperativeDialogContent = string | Snippet;

export interface ImperativeDialogReturn {
	/** Show the dialog with the given content. */
	show: (content: ImperativeDialogContent, options?: DialogOptions) => void;
	/** Hide the dialog. */
	hide: () => void;
	/** Whether the dialog is currently open. */
	readonly isOpen: boolean;
	/**
	 * The content of the most recent `show()`, read live.
	 *
	 * Upstream's `ImperativeDialogReturn` has no such member: its `element`
	 * closure owned the content state directly. Splitting the rendering half out
	 * means `<ImperativeDialogLayer>` needs a way back in — the same seam
	 * `useLightbox` opens with `options`/`setIndex`, for the same reason.
	 */
	readonly content: ImperativeDialogContent | null;
	/**
	 * The options the rendered `Dialog` should take, read live: the hook's
	 * default options with every `show()` override merged over them. The other
	 * half of the seam above.
	 */
	readonly options: DialogOptions;
}

/**
 * Imperative dialog — show/hide without managing state.
 *
 * Upstream returns a ready-made `element: ReactNode` for the caller to drop in
 * their JSX. A Svelte hook cannot return markup, so the rendering half becomes
 * `<ImperativeDialogLayer {dialog} />` — the same split `useLayer` → `<Layer>`,
 * `useTooltip` → `<TooltipLayer>`, `useKeyboardHint` → `<KeyboardHintLayer>` and
 * `useLightbox` → `<LightboxLayer>` already take. `ImperativeDialogLayer` is
 * therefore an export upstream has no counterpart for; see TODO.md → Known
 * debts.
 *
 * `defaultOptions` arrives as a getter, this port's standing shape for hook
 * options, because upstream's `useMemo` lists it as a dependency and so re-reads
 * it on every change.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const dialog = useImperativeDialog(() => ({ width: 400 }));
 * </script>
 *
 * <Button label="Open" onclick={() => dialog.show(body)} />
 * {#snippet body()}<Text type="body">Hello</Text>{/snippet}
 * <ImperativeDialogLayer {dialog} />
 * ```
 */
export function useImperativeDialog(
	defaultOptions?: () => DialogOptions | undefined
): ImperativeDialogReturn {
	let isOpen = $state(false);
	let content = $state<ImperativeDialogContent | null>(null);

	// `useState(defaultOptions)` reads its argument once, at init — a later
	// change to the getter's result does not replace what `show()` has merged.
	// `$state.raw` because upstream treats the options bag as opaque and replaces
	// it wholesale; deep-proxying it would make a caller mutating the object it
	// passed re-render the dialog, which React does not do.
	let options = $state.raw<DialogOptions | undefined>(defaultOptions?.());

	function show(newContent: ImperativeDialogContent, newOptions?: DialogOptions): void {
		content = newContent;
		if (newOptions) {
			options = { ...options, ...newOptions };
		}
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
		get content() {
			return content;
		},
		// Upstream spreads `{...(defaultOptions ?? {})}` then `{...(options ?? {})}`
		// onto the `Dialog`, in that order. The second wins, and it is seeded from
		// the first — so a *changed* `defaultOptions` only contributes keys the
		// initial one did not have. Replicated rather than tidied: collapsing the
		// two spreads would change which side wins.
		get options() {
			return { ...(defaultOptions?.() ?? {}), ...(options ?? {}) };
		}
	};
}
