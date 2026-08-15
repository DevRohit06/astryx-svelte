import type { LightboxMedia, LightboxProps } from './lightbox.svelte';

/**
 * The `Lightbox` props `useLightbox` owns itself, so a caller cannot pass them.
 * Module-private upstream — `Lightbox/index.ts` does not re-export it.
 */
type LightboxOptions = Omit<
	LightboxProps,
	'isOpen' | 'onOpenChange' | 'media' | 'index' | 'defaultIndex' | 'onIndexChange'
>;

export interface UseLightboxOptions extends LightboxOptions {
	/** Media to display in the lightbox. */
	media: LightboxMedia | LightboxMedia[];
}

/**
 * Props to spread on a trigger element for accessibility.
 *
 * The keys are Svelte's, not React's: `tabIndex` → `tabindex`, `onClick` →
 * `onclick`, `onKeyDown` → `onkeydown`. `role` and `aria-haspopup` are
 * unchanged.
 */
export interface LightboxTriggerProps {
	role: 'button';
	tabindex: 0;
	'aria-haspopup': 'dialog';
	onclick: () => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface UseLightboxReturn {
	/** Open the lightbox, optionally at a specific gallery index. */
	open: (index?: number) => void;
	/** Close the lightbox. */
	close: () => void;
	/** Whether the lightbox is currently open. */
	readonly isOpen: boolean;
	/** Current gallery index. */
	readonly index: number;
	/** Props to spread on a trigger element for accessibility. */
	readonly triggerProps: LightboxTriggerProps;
	/** Returns trigger props that open at a specific gallery index. */
	getTriggerProps: (index: number) => LightboxTriggerProps;
	/**
	 * The options the hook was constructed with, read live. `<LightboxLayer>`
	 * needs them to render, and reading them through a getter is what keeps a
	 * changing `media` array reaching the rendered lightbox.
	 */
	readonly options: UseLightboxOptions;
	/**
	 * The hook's index writer, called by `<LightboxLayer>` when the rendered
	 * `Lightbox` reports a navigation.
	 *
	 * Upstream's `UseLightboxReturn` has no such member: its `element` closure
	 * owned `setIndex` directly. Splitting the rendering half out means the
	 * component needs a way back in — the same seam `useTooltip` opens with
	 * `cancelHide`/`scheduleHide`, for the same reason.
	 */
	setIndex: (index: number) => void;
}

/**
 * Hook for lightbox with trigger props and state management.
 *
 * Upstream returns a ready-made `element: ReactNode` for the caller to drop in
 * their JSX. A Svelte hook cannot return markup, so the rendering half becomes
 * `<LightboxLayer {lightbox} />` — the same split `useLayer` → `<Layer>`,
 * `useTooltip` → `<TooltipLayer>` and `useKeyboardHint` → `<KeyboardHintLayer>`
 * already take. `LightboxLayer` is therefore an export upstream has no
 * counterpart for; see port/todo.md → Known debts.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const lightbox = useLightbox(() => ({ media: photos }));
 * </script>
 *
 * {#each photos as photo, i (photo.src)}
 *   <img src={photo.src} alt={photo.alt} {...lightbox.getTriggerProps(i)} />
 * {/each}
 * <LightboxLayer {lightbox} />
 * ```
 */
export function useLightbox(options: () => UseLightboxOptions): UseLightboxReturn {
	let isOpen = $state(false);
	let index = $state(0);

	function open(i: number = 0): void {
		index = i;
		isOpen = true;
	}

	function close(): void {
		isOpen = false;
	}

	function makeTriggerProps(i: number): LightboxTriggerProps {
		return {
			role: 'button',
			tabindex: 0,
			'aria-haspopup': 'dialog',
			onclick: () => open(i),
			onkeydown: (e: KeyboardEvent) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					open(i);
				}
			}
		};
	}

	return {
		open,
		close,
		get isOpen() {
			return isOpen;
		},
		get index() {
			return index;
		},
		// Upstream's `triggerProps` opens at index 0 — it calls `open()` with no
		// argument, which defaults to 0 — so it is `getTriggerProps(0)` by another
		// name, not a distinct shape.
		get triggerProps() {
			return makeTriggerProps(0);
		},
		getTriggerProps: makeTriggerProps,
		get options() {
			return options();
		},
		setIndex(next: number) {
			index = next;
		}
	};
}
