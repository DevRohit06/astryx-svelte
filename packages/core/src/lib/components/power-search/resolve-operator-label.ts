import type { TranslatorFn } from '../../i18n/index.js';
import type { PowerSearchOperator } from './types.js';

/**
 * Ported from Astryx's `PowerSearch/resolveOperatorLabel.ts`, verbatim.
 *
 * Pure — no React in the original at all, not even a `'use client'` directive
 * (unlike most of the module's files, which carry one).
 */

/**
 * Resolves an operator's display label.
 *
 * `label` wins when present; otherwise the `i18nKey` is looked up against the
 * active catalog. `PowerSearchOperator` is a discriminated union that permits
 * exactly one of the two, so the fallback is only reached for the `i18nKey`
 * variant.
 */
export function resolveOperatorLabel(operator: PowerSearchOperator, t: TranslatorFn): string {
	if ('label' in operator && operator.label !== undefined) {
		return operator.label;
	}
	return t(operator.i18nKey);
}
