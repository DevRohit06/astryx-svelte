import { useInteractiveRoleContext } from '../interactive-role-context.svelte.js';

/**
 * Centralises the "what element should I render as?" decision for polymorphic
 * components. The priority order:
 *
 *   1. href → 'link' (navigation always wins, unless disabled)
 *   2. onclick → 'button' (explicit interactivity)
 *   3. interactive role context → its role (implicit via parent)
 *   4. else → 'inert' (non-interactive)
 *
 * A disabled `href` is excluded at step 1 and therefore resolves via the
 * remaining steps — 'inert' when no onclick or context applies.
 *
 * This is the single place to add new context-based triggers (Popover,
 * DropdownMenu, Disclosure). Components that consume it never need updating
 * when a new trigger context is added.
 */

/**
 * The resolved interactive role for a polymorphic component.
 *
 * - `'link'` — render as `<a>`
 * - `'button'` — render as `<button>`
 * - `'inert'` — render as `<span>` or `<div>` (non-interactive)
 */
export type InteractiveRole = 'link' | 'button' | 'inert';

export interface UseInteractiveRoleOptions {
	/**
	 * URL for link navigation. When provided, the component renders as a link.
	 * Takes highest priority — a link always navigates.
	 */
	href?: string;

	/**
	 * Click handler. When provided, the component renders as a button.
	 * Takes priority over context-based triggers.
	 */
	onclick?: ((...args: never[]) => unknown) | null;

	/**
	 * Whether the component is disabled. When true, an `href` is ignored for
	 * role resolution (a disabled link is an a11y anti-pattern), so the role is
	 * decided by the remaining inputs: `onclick` → `'button'`, an interactive
	 * context → its role, otherwise `'inert'`. In particular a disabled `href`
	 * with no `onclick` and no context override resolves to `'inert'`, not a
	 * link or a button.
	 * @default false
	 */
	isDisabled?: boolean;
}

/**
 * Returns a resolver for the interactive role of a polymorphic component.
 *
 * Where upstream's hook takes the options and returns the role in one call,
 * this returns a function you call with them — the same split `useSize()` uses,
 * and for the same reason: Svelte reads context once at init, so the context
 * lookup happens here and the *decision* re-runs wherever you call the result.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const resolveRole = useInteractiveRole();
 *   const role = $derived(resolveRole({ href, onclick, isDisabled }));
 * </script>
 * ```
 */
export function useInteractiveRole(): (options: UseInteractiveRoleOptions) => InteractiveRole {
	const contextRole = useInteractiveRoleContext();

	return ({ href, onclick, isDisabled = false }) => {
		// 1. href → link (unless disabled — a disabled href is skipped here and
		// resolved by the checks below, landing on 'inert' if nothing else applies)
		if (href != null && !isDisabled) {
			return 'link';
		}

		// 2. Explicit onclick → button
		if (onclick != null) {
			return 'button';
		}

		// 3. Context-provided role override (e.g. Popover provides 'button')
		const role = contextRole();
		if (role != null) {
			return role;
		}

		// 4. Nothing interactive → inert
		return 'inert';
	};
}
