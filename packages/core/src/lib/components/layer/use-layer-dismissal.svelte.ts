import { useLayerDepth } from './layer-depth-context.js';
import {
	isTextComposing,
	isTopmostLayer,
	registerLayer,
	type LayerEscapeBehavior
} from './layer-stack.js';

export type { LayerEscapeBehavior };

/**
 * The API overlays use to join the shared dismissal stack, ported from Astryx's
 * `Layer/useLayerDismissal.ts` (upstream 0.5.0, #4881). Wraps `layer-stack.ts`
 * (registration + the single Escape listener) and reads nesting depth from
 * `layer-depth-context.ts`.
 *
 * Three translations, and every one of them removes machinery rather than
 * adding it:
 *
 * **Options arrive as a getter.** Upstream takes a plain object rebuilt on every
 * render; here it is `() => UseLayerDismissalOptions`, the shape every hook in
 * this port uses, so reading a member inside an effect registers the dependency
 * upstream spells out in a dependency list.
 *
 * **The three closure refs disappear.** Upstream keeps `onDismiss`,
 * `getContainer` and `isPresent` in refs, refreshed by a bare `useEffect`, so
 * the stack — which calls them during an event, outside React's render — reaches
 * the latest closures rather than the ones captured at registration. A getter
 * closure already reads current values at call time, so the callbacks handed to
 * `registerLayer` read straight through `options()` and there is nothing to
 * refresh.
 *
 * **`useRef({})` becomes a plain object.** The token only has to be stable for
 * the layer's lifetime, and a `const` in the hook body is exactly that.
 *
 * What does NOT change: upstream's effect is keyed `[isRegistered, depth,
 * escapeBehavior]`, so those three go through `$derived` first. A derived only
 * notifies dependents when its **value** changes, which is what a dependency
 * list means — reading `options()` in the effect directly would re-register on
 * every unrelated option change, and a re-registration that moved the layer
 * would be the exact bug `seq` is keyed to `token` to prevent.
 *
 * Internal to the Layer system, like the stack it wraps: upstream publishes it
 * from `Layer/index.ts` only and its root barrel does not carry it, so neither
 * does ours — the `focusableSelector` rule.
 */

export interface UseLayerDismissalOptions {
	/**
	 * Whether this layer is participating right now. Usually the layer's open
	 * state. A layer whose open state lags the DOM should pass `true` for its
	 * lifetime and answer `isPresent` from the DOM instead.
	 */
	isActive: boolean;
	/**
	 * Dismiss this layer. Called by the stack when this layer is the one that
	 * should respond to an Escape press. Not called for `escapeBehavior: 'block'`.
	 */
	onDismiss: () => void;
	/**
	 * What this layer does with an Escape press that reaches it.
	 * @default 'close'
	 */
	escapeBehavior?: LayerEscapeBehavior;
	/**
	 * This layer's container element, read lazily. Optional: supply it when the
	 * layer cannot wrap its content in `LayerDepthProvider` (a bare focus trap
	 * renders nothing), so nesting can still be recovered from the DOM.
	 */
	getContainer?: () => HTMLElement | null;
	/**
	 * Whether the layer is really on screen, asked at press time. Supply it when
	 * `isActive` is `true` for the layer's lifetime because its open state lags
	 * the DOM by a frame; the stack skips layers that answer `false`.
	 */
	isPresent?: () => boolean;
	/**
	 * Whether this layer takes part in the shared stack at all. When `false` the
	 * layer is invisible to dismissal: a press flows past it to the layer below,
	 * exactly as if it were not open.
	 *
	 * Deliberately separate from `escapeBehavior: 'block'` — `'block'` is a layer
	 * that is present and swallows the press; this is a layer that is not there
	 * at all. One case uses it: `Dialog`'s inline rendering mode, where content
	 * sits in normal flow with nothing layered over anything.
	 *
	 * A controlled layer is NOT one of these. It stays registered and takes the
	 * press like any other, answering it by calling the consumer's change
	 * handler; whether it then closes is the consumer's decision.
	 *
	 * Layers that are never Escape-dismissible (toasts) should simply not call
	 * this hook.
	 *
	 * @default true
	 */
	isEnabled?: boolean;
}

export interface UseLayerDismissalReturn {
	/**
	 * Whether a close request the browser started on its own — a `<dialog>`'s
	 * `cancel`, the Android back gesture, the platform close watcher — should
	 * dismiss this layer. As well as the top-most rule the stack applies to an
	 * Escape press, it declines a request that arrives while an IME composition
	 * is running, which no `cancel` handler can tell on its own because the
	 * event carries no composition state.
	 */
	shouldDismissOnCloseRequest: () => boolean;
}

/**
 * Join the shared layer dismissal stack for as long as this layer is active.
 *
 * The layer does NOT attach a key listener — the stack owns one listener and
 * routes each Escape press to the top-most REGISTERED layer, so one press
 * dismisses exactly one of them.
 *
 * Wrap the layer's own content in `LayerDepthProvider` so anything opened from
 * inside it registers as nested.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let isOpen = $state(false);
 *   useLayerDismissal(() => ({ isActive: isOpen, onDismiss: () => (isOpen = false) }));
 * </script>
 * ```
 */
export function useLayerDismissal(
	options: () => UseLayerDismissalOptions
): UseLayerDismissalReturn {
	const readDepth = useLayerDepth();

	// Identity for this layer's stack entry, stable across re-registration.
	const token = {};

	const depth = $derived(readDepth());
	const escapeBehavior = $derived(options().escapeBehavior ?? 'close');
	const isRegistered = $derived(options().isActive && (options().isEnabled ?? true));

	$effect(() => {
		if (!isRegistered) {
			return;
		}
		return registerLayer({
			token,
			depth,
			behavior: escapeBehavior,
			getContainer: () => options().getContainer?.() ?? null,
			isPresent: () => options().isPresent?.() ?? true,
			dismiss: () => options().onDismiss()
		});
	});

	return {
		shouldDismissOnCloseRequest: () => isRegistered && !isTextComposing() && isTopmostLayer(token)
	};
}
