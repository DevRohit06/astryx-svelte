import { useThemeName } from '../../theme/use-theme.svelte.js';
import { getIndicator, type CoreIndicatorName } from './indicator-registry.js';
import type { IndicatorComponent, IndicatorMap, IndicatorName } from './types.js';

/**
 * Ported from Astryx's `Indicator/useIndicator.ts`.
 *
 * **The return shape differs from upstream, and deliberately.** React re-runs a
 * component body when the theme changes, so upstream can return the component
 * itself. Here the value has to stay live across a `<Theme>` swap, so it comes
 * back on an object with a `current` getter — the same convention `useThemeName`
 * and every other context-reading hook in this port already follows. Read it in
 * a `$derived` and the indicator re-resolves when the theme does.
 */
/** The live indicator component for a core name — always resolves. */
export interface UseCoreIndicatorReturn<N extends CoreIndicatorName> {
	readonly current: IndicatorComponent<IndicatorMap[N]>;
}

/** The live indicator component for an augmented name — may be absent. */
export interface UseAnyIndicatorReturn<N extends IndicatorName> {
	readonly current: IndicatorComponent<IndicatorMap[N]> | undefined;
}

/**
 * Resolve an indicator component from the nearest `<Theme>`.
 *
 * A core indicator always resolves. A name contributed by augmentation resolves
 * only if a theme supplies it, so that overload's `current` is
 * `| undefined` — see {@link getIndicator}.
 *
 * Call during component initialisation, like every context-reading hook here.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const checkbox = useIndicator('checkbox');
 *   const Checkbox = $derived(checkbox.current);
 * </script>
 *
 * <Checkbox state={isChecked ? 'checked' : 'unchecked'} {size} />
 * ```
 */
export function useIndicator<N extends CoreIndicatorName>(name: N): UseCoreIndicatorReturn<N>;
export function useIndicator<N extends IndicatorName>(name: N): UseAnyIndicatorReturn<N>;
export function useIndicator(name: IndicatorName): {
	readonly current: IndicatorComponent | undefined;
} {
	const themeName = useThemeName();

	return {
		get current(): IndicatorComponent | undefined {
			return getIndicator(name, themeName.current);
		}
	};
}
