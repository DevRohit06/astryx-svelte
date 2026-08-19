<script lang="ts">
	import {
		useSheetGestures,
		type UseSheetGesturesResult
	} from '$lib/components/bottom-sheet/use-sheet-gestures.svelte.js';

	/**
	 * The `renderHook` substitute for `useSheetGestures`, per CLAUDE.md: Svelte has
	 * no `renderHook`, so a probe fixture runs the hook and exposes its result
	 * through an instance `export`, reachable via `render(...).component`.
	 *
	 * Options arrive as plain values and are handed to the hook as getters, so a
	 * case can change one with `rerender` and the hook sees it — which is what
	 * upstream's `hook.rerender({...})` does.
	 *
	 * `attachSheet` / `attachBody` invoke the hook's attachments against an
	 * arbitrary element. Upstream calls `sheetRef(target)` and `bodyProps.ref(node)`
	 * directly with a detached, stubbed div; an attachment is a plain function
	 * behind a symbol key, so exposing it is the same move.
	 */
	interface Props {
		isOpen?: boolean;
		canDismiss?: boolean;
		offscreenBlockEndInset?: number;
		onDismiss?: () => void;
		snapHeights?: () => number[];
		onSnap?: (heightPx: number) => void;
		onScrimOpacity?: (opacity: number) => void;
	}

	const {
		isOpen = true,
		canDismiss,
		offscreenBlockEndInset,
		onDismiss = () => {},
		snapHeights,
		onSnap,
		onScrimOpacity
	}: Props = $props();

	const gestures = useSheetGestures({
		isOpen: () => isOpen,
		// Always a getter, never a conditional one: deciding at init whether to pass
		// it would capture the prop's initial value, so a `rerender` flipping it
		// would never reach the hook. The defaults match the hook's own `?? true` /
		// `?? 0`.
		canDismiss: () => canDismiss ?? true,
		offscreenBlockEndInset: () => offscreenBlockEndInset ?? 0,
		onDismiss: () => onDismiss(),
		snapHeights: () => snapHeights,
		onSnap: (heightPx) => onSnap?.(heightPx),
		onScrimOpacity: (opacity) => onScrimOpacity?.(opacity)
	});

	/** The live hook result. Read it fresh on every access — it holds getters. */
	export function result(): UseSheetGesturesResult {
		return gestures;
	}

	/** Pull an attachment function out from behind its symbol key. */
	function attachmentOf(bag: Record<symbol, unknown>) {
		const key = Object.getOwnPropertySymbols(bag)[0];
		return bag[key] as (node: HTMLElement) => (() => void) | void;
	}

	export function attachSheet(node: HTMLElement): (() => void) | void {
		return attachmentOf(gestures.sheetAttachment)(node);
	}

	export function attachBody(node: HTMLElement): (() => void) | void {
		return attachmentOf(gestures.bodyProps as unknown as Record<symbol, unknown>)(node);
	}
</script>

<div data-testid="sheet-gestures-probe"></div>
