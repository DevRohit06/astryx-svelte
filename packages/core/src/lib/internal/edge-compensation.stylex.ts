import * as stylex from '@stylexjs/stylex';

/**
 * Container-driven edge compensation, ported from Astryx's
 * `src/Layout/edgeCompensation.stylex.ts`.
 *
 * An interactive component with transparent padding — a ghost button, a tab —
 * doubles the visual gap at a container edge: the container's own padding plus
 * the component's. The fix is entirely on the container side:
 *
 * 1. **Components** mark themselves with `data-astryx-edge-comp`, a passive
 *    attribute with no styles attached.
 * 2. **Containers** detect an edge-adjacent marked child with
 *    `:has(> [data-astryx-edge-comp]:first-child)` / `:last-child` and pull
 *    their slot's margin inward.
 *
 * The container owns detection and adjustment alike; a component only declares
 * that it is eligible. `Button` is the one marker so far — the containers that
 * use `edgeCompSlot` (`Toolbar`, `Banner`, `TabList`) are unported, which is why
 * this module lives beside the other two `Layout/` style modules the port needed
 * before `Layout` itself.
 */

/**
 * The attribute an edge-compensatable component renders, so a container can
 * find it with `:has()`.
 */
export const EDGE_COMP_ATTR = 'data-astryx-edge-comp';

/**
 * The container half. Applied to a slot wrapper: when its first or last child
 * carries the marker, the wrapper pulls its own margin in by `amount`.
 */
export const edgeCompSlot = stylex.create({
	inset: (amount: string) => ({
		marginInlineStart: {
			default: null,
			[`:has(> [${EDGE_COMP_ATTR}]:first-child)`]: `calc(-1 * ${amount})`
		},
		marginInlineEnd: {
			default: null,
			[`:has(> [${EDGE_COMP_ATTR}]:last-child)`]: `calc(-1 * ${amount})`
		}
	})
});
