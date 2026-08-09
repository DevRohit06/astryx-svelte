import type {
	SelectorDivider,
	SelectorOptionData,
	SelectorOptionType,
	SelectorSection
} from '../selector/types.js';

/**
 * Ported from Astryx's `MultiSelector/types.ts` — four aliases of the `Selector`
 * option shapes plus a status type of its own. Transcribed verbatim; the icon
 * translation (`ReactNode | IconType` → `IconName | Snippet`) already happened in
 * `selector/types.ts` and is inherited here.
 */

/** A selectable option in the multi-selector. */
export type MultiSelectorOptionData = SelectorOptionData;

/** A divider between options. */
export type MultiSelectorDivider = SelectorDivider;

/** A section/group of options with an optional title. */
export type MultiSelectorSection = SelectorSection;

/** Union of everything the `options` prop accepts. */
export type MultiSelectorOptionType = SelectorOptionType;

export interface MultiSelectorStatus {
	/** The type of status to display. */
	type: 'warning' | 'error' | 'success';
	/** Optional message to display below the selector. */
	message?: string;
}
