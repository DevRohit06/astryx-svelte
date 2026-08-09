import {
	InternationalizationContext,
	type InternationalizationContextValue
} from './internationalization-context.svelte.js';

/**
 * Reads the ambient text direction, ported from Astryx's `i18n/useDirection.ts`.
 *
 * Use it where CSS logical properties cannot express the change: swapping a
 * directional icon, mirroring pointer math, or picking an arrow key's meaning.
 * Anything a logical property *can* express belongs in the `.stylex.ts` module
 * instead — the lint rule in `eslint-rules/no-physical-properties.js` exists to
 * keep that boundary.
 *
 * **Returns a getter, not a snapshot.** That is this port's settled shape for a
 * context reader — `useAvatarSize`, `useFormLayout`, `useSideNavRenderMode` and
 * twenty others do the same — and here it is load-bearing rather than stylistic:
 * Svelte reads context once at initialisation, so returning `get().direction`
 * would freeze every consumer at the direction the provider happened to hold on
 * mount, and a runtime locale swap would leave the chevrons pointing the wrong
 * way. The `{ current }` shape is reserved for hooks that own their own
 * `$state` (`useThemeMode`, `useStreamingText`); this one owns none.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const direction = useDirection();
 *   const icon = $derived(direction() === 'rtl' ? 'chevronRight' : 'chevronLeft');
 * </script>
 * ```
 */
export function useDirection(): () => 'ltr' | 'rtl' {
	// No provider — `ltr`, which is what upstream's `createContext` default value
	// gives and the same silent fallback `useTranslator` makes for the catalog.
	const get = InternationalizationContext.getOr((): InternationalizationContextValue => ({
		locale: 'en',
		direction: 'ltr',
		messages: {}
	}));

	return () => get().direction;
}
