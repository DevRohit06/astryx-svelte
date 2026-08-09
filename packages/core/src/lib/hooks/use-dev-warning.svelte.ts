import { devWarn } from '../utils/dev-warning.js';

/**
 * The render-safe way to surface a dev guardrail from inside a component,
 * ported from Astryx's `hooks/useDevWarning.ts`.
 *
 * A bare `if (condition) console.warn(...)` in a component body repeats every
 * time the body re-runs, and gating it with state adds state for nothing.
 * Upstream uses a ref + effect: the warning fires once per mount while the
 * condition holds, never during render, and never triggers a re-render.
 *
 * Two translations:
 *
 * **`condition` is a getter.** It is the only argument in upstream's dependency
 * list that varies, and the hook's contract includes re-checking it — upstream
 * warns when the condition flips false → true after mount. A plain boolean read
 * once could not do that, so it comes in as a getter and the `$effect` tracks
 * it. `component` and `message` stay plain strings, as `useMediaQuery`'s
 * `serverDefault` does beside its getter.
 *
 * **The latch is a plain `let`.** Upstream's `useRef(false)` exists to hold a
 * value across renders without causing one; a closure variable in a hook that
 * runs once per component instance already is that, with no rune needed.
 *
 * Like upstream's `useEffect`, the warning does **not** fire during SSR — an
 * effect has no server counterpart on either side.
 */

/**
 * Fire a dev-only warning once per mount while `condition` is true.
 *
 * @param component - Component or hook name (message prefix)
 * @param message - What went wrong and how to fix it
 * @param condition - Getter for whether to warn; defaults to always
 *
 * @example
 * ```ts
 * useDevWarning(
 *   'Field',
 *   'isOptional and isRequired are mutually exclusive. isOptional takes precedence.',
 *   () => isOptional && isRequired
 * );
 * ```
 */
export function useDevWarning(
	component: string,
	message: string,
	condition: () => boolean = () => true
): void {
	let hasWarned = false;
	$effect(() => {
		if (condition() && !hasWarned) {
			hasWarned = true;
			devWarn(component, message);
		}
	});
}
