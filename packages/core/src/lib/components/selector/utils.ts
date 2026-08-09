import type {
	SelectorDivider,
	SelectorOptionData,
	SelectorOptionType,
	SelectorSection
} from './types.js';

/**
 * Ported from Astryx's `Selector/utils.ts` — a verbatim transcription; the
 * module is pure and has no React in it. Module-private on both sides
 * (`Selector/index.ts` publishes the types, not these guards).
 */

/**
 * Type guard: check if option is a selectable option (string or OptionData).
 */
export function isOptionData(option: SelectorOptionType): option is SelectorOptionData | string {
	if (typeof option === 'string') {
		return true;
	}
	return !('type' in option);
}

/**
 * Type guard: check if option is a divider.
 */
export function isDivider(option: SelectorOptionType): option is SelectorDivider {
	return typeof option === 'object' && 'type' in option && option.type === 'divider';
}

/**
 * Type guard: check if option is a section.
 */
export function isSection(option: SelectorOptionType): option is SelectorSection {
	return typeof option === 'object' && 'type' in option && option.type === 'section';
}

/**
 * Normalize string or option to consistent shape.
 */
export function normalizeOption(option: string | SelectorOptionData): SelectorOptionData {
	if (typeof option === 'string') {
		return { value: option, label: option };
	}
	return {
		...option,
		label: option.label ?? option.value
	};
}

/**
 * Get all selectable options (flattening sections).
 */
export function getSelectableOptions(options: SelectorOptionType[]): SelectorOptionData[] {
	const result: SelectorOptionData[] = [];

	for (const option of options) {
		if (isOptionData(option)) {
			result.push(normalizeOption(option));
		} else if (isSection(option)) {
			for (const opt of option.options) {
				result.push(normalizeOption(opt));
			}
		}
		// Skip dividers
	}

	return result;
}
