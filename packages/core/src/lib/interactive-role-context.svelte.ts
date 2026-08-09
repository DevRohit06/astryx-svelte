import { Context } from './internal/context.js';
import type { InteractiveRole } from './hooks/use-interactive-role.svelte.js';

/**
 * Provides a role override to optionally-interactive child components. When a
 * parent (Popover, DropdownMenu, …) needs its child to render as a button, it
 * puts `'button'` in this context.
 *
 * Components don't consume this directly — they use `useInteractiveRole`, which
 * takes it as one of its decision inputs. It is the same shape as the size
 * context in `internal/contexts.svelte.ts`:
 *
 *   size context provides a size → `useSize` resolves it
 *   this provides a role         → `useInteractiveRole` resolves it
 *
 * It lives at the top level rather than in `internal/contexts.svelte.ts` because
 * upstream publishes it as its own module and entry point, and unlike the size
 * and ButtonGroup contexts it is part of a documented extension point.
 *
 * Stores a getter, per the convention `internal/contexts.svelte.ts` explains:
 * Svelte reads context once at init, so a plain value would freeze descendants
 * at whatever the provider held on mount.
 */
export const InteractiveRoleContext = new Context<() => InteractiveRole | null>(
	'astryx.interactiveRole'
);

/**
 * Override the role every optionally-interactive descendant resolves to.
 *
 * This is the Svelte counterpart of rendering `<InteractiveRoleContext value=…>`
 * in React, and it is why this module has a setter where `i18n` does not: i18n
 * ships an `InternationalizationProvider` component to do the providing, while
 * upstream uses this context directly as its own provider.
 *
 * Scopes to the calling component's whole subtree. A component that must provide
 * a role to *part* of its tree — as `Popover` does, wrapping only its trigger —
 * has to delegate to a wrapper component, exactly as this port's test fixture does.
 */
export function setInteractiveRoleContext(get: () => InteractiveRole | null): void {
	InteractiveRoleContext.set(get);
}

/**
 * Read the role override from context, if any.
 *
 * Most components should use `useInteractiveRole` instead of calling this
 * directly — it weighs this signal alongside `href` and `onclick`.
 *
 * @returns a getter for the overridden role, or for `null` when no parent is
 * providing one.
 */
export function useInteractiveRoleContext(): () => InteractiveRole | null {
	return InteractiveRoleContext.getOr(() => null);
}
