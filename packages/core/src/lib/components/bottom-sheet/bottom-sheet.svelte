<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { StyleArg } from '../../internal/sx.js';
	import type { DialogPurpose } from '../dialog/dialog.svelte';
	// Aliased locally only so the imports and the re-exports below do not name
	// the same bindings twice in one module.
	import type { BottomSheetHeight as BottomSheetHeightValue } from './bottom-sheet-panel.stylex.js';
	import type { BottomSheetSnapPoint as BottomSheetSnapPointValue } from './snap-offsets.js';

	// Upstream's `BottomSheet.tsx` re-exports both from `BottomSheetPanel`, and
	// its `index.ts` publishes them from here; so does this port's barrel.
	export type { BottomSheetHeight } from './bottom-sheet-panel.stylex.js';
	export type { BottomSheetSnapPoint } from './snap-offsets.js';

	interface BottomSheetSharedProps extends BaseProps<HTMLDivElement> {
		/** Accessible label for the sheet. */
		label: string;

		/** Sheet content, rendered below the grab handle in a scrollable area. */
		children: Snippet;

		/**
		 * Height budget or custom CSS length. Only fully expanded Tall is
		 * keyboard-aware.
		 * @default 'capped'
		 */
		height?: BottomSheetHeightValue | number | string;

		/**
		 * Extra heights the sheet can rest at when dragged; its own height is
		 * always the tallest stop, and omitting this gives a sheet that only opens
		 * and closes. Each stop is the sheet's visible height: a number is a
		 * viewport fraction (`0.5` is half the screen), `'50%'` the same in CSS,
		 * `'320px'` an absolute length. A stop of a quarter of the sheet or less is
		 * a peek — it slides away instead of reflowing, and thins the scrim.
		 */
		snapPoints?: ReadonlyArray<BottomSheetSnapPointValue>;

		/**
		 * Configures implicit dismissal behavior, matching Dialog.
		 * - required: Blocks swipe, scrim click, and Escape
		 * - form: Blocks swipe and scrim click, allows Escape
		 * - info: Allows swipe, scrim click, and Escape
		 * @default 'info'
		 */
		purpose?: DialogPurpose;

		xstyle?: StyleArg;
	}

	/**
	 * A sheet that owns its own dialog. Exported for the two private hosts, not
	 * from the barrel — upstream keeps both arms of the union module-private and
	 * publishes only their union.
	 */
	export interface StandaloneBottomSheetProps extends BottomSheetSharedProps {
		isOpen: boolean;
		onOpenChange: (isOpen: boolean) => void;
		hasScrim?: boolean;
		sheetId?: never;
	}

	/** A sheet that participates in an enclosing `BottomSheetSwitcher`. */
	export interface SwitcherBottomSheetProps extends BottomSheetSharedProps {
		sheetId: string;
		isOpen?: never;
		onOpenChange?: never;
		hasScrim?: never;
	}

	export type BottomSheetProps = StandaloneBottomSheetProps | SwitcherBottomSheetProps;
</script>

<script lang="ts">
	import StandaloneBottomSheet from './standalone-bottom-sheet.svelte';
	import SwitcherBottomSheetItem from './switcher-bottom-sheet-item.svelte';
	import {
		useBottomSheetSwitcher,
		type BottomSheetSwitcherContextValue
	} from './bottom-sheet-switcher-context.svelte.js';
	import { useDevWarning } from '../../hooks/use-dev-warning.svelte.js';

	/**
	 * Ported from Astryx's `BottomSheet/BottomSheet.tsx`.
	 *
	 * A mobile touch sheet that either owns a native dialog or participates in a
	 * `BottomSheetSwitcher`'s shared dialog when given a `sheetId` inside that
	 * context. This component is only the router: it picks a host and warns when
	 * the props do not match the context it finds itself in. Both hosts render
	 * the same `BottomSheetPanel`, which owns sheet presentation, gestures,
	 * mobile-keyboard accommodation, and motion completion.
	 *
	 * Upstream's `ref` has no counterpart prop here: an `{@attach}` on this
	 * component reaches the sheet panel `<div>` through the same rest spread that
	 * carries `class`, `style` and `data-*`, which is this port's standing
	 * translation of a forwarded ref.
	 */
	/* eslint-disable-next-line svelte/no-unused-props -- the router forwards the
	   whole prop bag to whichever host it picks, and reads only `sheetId` itself,
	   so nothing here is destructured for the rule to see used. Naming each prop
	   only to re-assemble it would add a place for the two hosts' signatures to
	   drift apart from this one. */
	let props: BottomSheetProps = $props();

	const switcher = useBottomSheetSwitcher();

	const runtimeSheetId = $derived((props as { sheetId?: string }).sheetId);
	const hasValidSheetId = $derived(typeof runtimeSheetId === 'string' && runtimeSheetId.length > 0);

	useDevWarning(
		'BottomSheet',
		'requires a non-empty `sheetId` when nested in ' +
			'BottomSheetSwitcher; standalone `isOpen` / `onOpenChange` props are ' +
			'ignored there.',
		() => switcher() != null && !hasValidSheetId
	);
	useDevWarning(
		'BottomSheet',
		'`sheetId` only works inside BottomSheetSwitcher. Use `isOpen` and ' +
			'`onOpenChange` for a standalone sheet.',
		() => switcher() == null && runtimeSheetId != null
	);
</script>

{#if switcher() != null}
	<SwitcherBottomSheetItem
		{...props as SwitcherBottomSheetProps}
		switcher={switcher as () => BottomSheetSwitcherContextValue}
	/>
{:else}
	<StandaloneBottomSheet {...props as StandaloneBottomSheetProps} />
{/if}
