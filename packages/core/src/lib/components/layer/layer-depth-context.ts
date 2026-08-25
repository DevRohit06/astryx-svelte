import { Context } from '../../internal/context.js';

/**
 * Ported from Astryx's `Layer/LayerDepthContext.tsx` (upstream 0.5.0, #4881) —
 * how the dismissal stack learns which layer is nested inside which.
 *
 * Nesting is read from the component tree rather than the DOM. Two reasons:
 *
 * - **Portals.** A nested overlay routinely renders into `document.body` or the
 *   native top layer, so DOM containment reports it as a sibling of the layer
 *   it is logically inside. Context flows across that boundary, so the tree
 *   keeps the relationship the DOM loses.
 * - **Same-flush mounts.** Depth is fixed during initialisation. Effect order
 *   is not available then and is misleading anyway: child effects run before
 *   parent effects, so an inner layer registers first and looks "older" than
 *   the outer layer that contains it.
 *
 * There is nothing to mount at the app root: the context defaults to 0, and
 * each layer provides depth for its OWN content, so nesting composes on its own.
 *
 * The one translation is this port's context convention — the context stores a
 * **getter**, not the number. `LayerDepthProvider` reads the ambient getter at
 * init and publishes one that adds one to it, so a provider whose own ambient
 * depth changes still reports the right number to everything below it.
 *
 * Module-public but **not** on the root barrel, because upstream's root does not
 * carry it either (only `Layer/index.ts` does, and this port ships no
 * per-component subpaths) — the `focusableSelector` rule, and the same call
 * `layer-context.ts` makes.
 */

/** Named as upstream names its context object, and public for the same reason. */
export const LayerDepthContext = new Context<() => number>('astryx.layerDepth');

export function setLayerDepthContext(get: () => number): void {
	LayerDepthContext.set(get);
}

/**
 * Read the current nesting depth. A layer calls this to learn its OWN depth —
 * the depth of the subtree it is rendered into, before it pushes its content
 * one level deeper.
 *
 * Reads at init and returns a getter; upstream's context defaults to 0, and so
 * does this, which is what makes a root-level layer need no provider above it.
 */
export function useLayerDepth(): () => number {
	return LayerDepthContext.getOr(() => 0);
}
