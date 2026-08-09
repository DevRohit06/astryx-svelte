import { Context } from 'runed';

/**
 * Ported from Astryx's `TopNav/TopNavContext.ts`.
 *
 * Which of `TopNav`'s three slots a child is rendering in. `TopNavMenu` and
 * `TopNavMegaMenu` read it and hand it to their popover as the `alignment`, so a
 * menu in the start slot opens flush left and one in the end slot flush right —
 * the slot name and the layer alignment share a vocabulary (`start`/`center`/
 * `end`) deliberately.
 *
 * Upstream's `TopNav/index.ts` does **not** re-export this file, so
 * `TopNavSlot`, the context and `useTopNavSlot` are all module-internal on both
 * sides — the `focusableSelector` rule this port already applies.
 */
export type TopNavSlot = 'start' | 'center' | 'end';

const TopNavSlotContext = new Context<() => TopNavSlot>('astryx.topNavSlot');

/** Stands in for React's `<TopNavSlotContext value={…}>`. */
export function setTopNavSlot(get: () => TopNavSlot): void {
	TopNavSlotContext.set(get);
}

/**
 * Read the enclosing `TopNav` slot.
 *
 * Call at component init and read the returned getter reactively. Defaults to
 * `'start'` outside any provider, as upstream's `createContext('start')` does.
 */
export function useTopNavSlot(): () => TopNavSlot {
	return TopNavSlotContext.getOr(() => 'start');
}
