/**
 * Ported from Astryx's `NumberInput/numberInputCommit.ts`, new at 0.5.1.
 *
 * The shared draft-validation and commit policy for `NumberInput`: it takes a
 * whole draft plus the field's constraints and returns a single commit, clear
 * or revert decision for all of it. Upstream's live consumers (`Table`'s
 * filtering plugin, `PowerSearchValueEditor`) share it for the same reason.
 *
 * Module-private, as upstream's is: `NumberInput/index.ts` publishes only the
 * component and its props types, so nothing here reaches the barrel.
 */

import type { Locale } from '../../i18n/types.js';
import { parseLocaleNumber } from './number-parser.js';

interface NumberInputValidationOptions {
	min?: number | null;
	max?: number | null;
	isIntegerOnly?: boolean;
	locale?: Locale;
}

export type NumberInputCommitDecision =
	{ type: 'commit'; value: number; didClamp: boolean } | { type: 'clear' } | { type: 'revert' };

function parseNumericInput(
	input: string,
	options: Pick<NumberInputValidationOptions, 'isIntegerOnly' | 'locale'>
): number | null {
	const trimmed = input.trim();
	if (trimmed === '') {
		return null;
	}

	const value = parseLocaleNumber(trimmed, options.locale);
	if (value == null || !Number.isFinite(value)) {
		return null;
	}
	if (options.isIntegerOnly && !Number.isInteger(value)) {
		return null;
	}
	return value;
}

export function parseNumberInput(
	input: string,
	options: NumberInputValidationOptions
): number | null {
	const value = parseNumericInput(input, options);
	if (value === null) {
		return null;
	}
	if (options.min != null && value < options.min) {
		return null;
	}
	if (options.max != null && value > options.max) {
		return null;
	}
	return value;
}

export function resolveNumberInputCommit(
	input: string,
	options: NumberInputValidationOptions & { hasClear: boolean }
): NumberInputCommitDecision {
	if (input.trim() === '') {
		return options.hasClear ? { type: 'clear' } : { type: 'revert' };
	}

	const value = parseNumericInput(input, options);
	if (value === null) {
		return { type: 'revert' };
	}

	const min =
		options.min == null ? null : options.isIntegerOnly ? Math.ceil(options.min) : options.min;
	const max =
		options.max == null ? null : options.isIntegerOnly ? Math.floor(options.max) : options.max;
	if (min != null && max != null && min > max) {
		return { type: 'revert' };
	}

	const committedValue =
		min != null && value < min ? min : max != null && value > max ? max : value;
	return {
		type: 'commit',
		value: committedValue,
		didClamp: committedValue !== value
	};
}
