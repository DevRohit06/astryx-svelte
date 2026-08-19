import type { TranslatorFn } from '../../i18n/index.js';
import type { EnumItem, FilterValue, OperatorValue } from './types.js';
import type { InternalConfig } from './use-internal-config.svelte.js';
import { truncateCharacters } from '../../utils/characters.js';

/**
 * Ported from Astryx's `PowerSearch/formatFilterValue.ts`, verbatim.
 *
 * Entirely pure — no React at all upstream, not even a directive. The switch
 * dispatches on `filterValue.type`, **not** on the operator's declared value
 * type, and several arms re-check `operatorValue.type` to decide whether they
 * can resolve an enum label or a unit suffix; a filter value whose type
 * disagrees with its operator silently takes the value's arm. That asymmetry is
 * upstream's and is load-bearing for the `enum_list` case below.
 *
 * Three transcription notes, each of which looks like an error and is not:
 *
 * - **`_config` is never read.** It is the first parameter of the published
 *   signature (`PowerSearch/utils` exports this function), so it stays.
 * - **The `enum_list` arm is asymmetric.** With an `enum_list` operator it tries
 *   the joined labels before falling back to the count; with any *other*
 *   operator it goes straight to the count for 2+ items and never attempts the
 *   join, so `['x','y']` renders `2 items` even though `x, y` would fit.
 * - **`Intl.NumberFormat()` / `Intl.DateTimeFormat(undefined, …)` take the
 *   runtime default locale**, not the `InternationalizationProvider` one. That
 *   is upstream's behaviour; threading the provider locale in would be a
 *   divergence, not a fix.
 *
 * `truncate` here is *not* `PowerSearch.svelte`'s `truncateString`. They differ
 * in threshold, ellipsis and output length, both are fed the same
 * `maxTokenLength`, and each keeps its own call sites — see the note there.
 */

/**
 * Truncates to exactly `maxLength` characters, the last being U+2026.
 *
 * The guard is `<=`, so a string of exactly `maxLength` survives intact and only
 * a longer one is cut — which means the result is never longer than the input
 * and never longer than `maxLength`.
 */
function truncate(str: string, maxLength: number): string {
	return truncateCharacters(str, maxLength);
}

function formatEnumLabel(value: string, enumValues: ReadonlyArray<EnumItem>): string {
	const item = enumValues.find((v) => v.value === value);
	return item?.label ?? value;
}

function formatNumber(value: number, units?: string): string {
	const formatted = new Intl.NumberFormat().format(value);
	return units ? `${formatted} ${units}` : formatted;
}

function formatDateAbsolute(unixSeconds: number, timezoneID?: string): string {
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		...(timezoneID ? { timeZone: timezoneID } : {})
	};
	return new Intl.DateTimeFormat(undefined, options).format(unixSeconds * 1000);
}

function formatRelativeDate(value: string): string {
	// value is stored as a descriptive string like "7d" or "1w"
	return value;
}

function formatDateRange(_value: { start: unknown; end: unknown }, t: TranslatorFn): string {
	return t('@astryx.powersearch.valueEditor.dateRange');
}

export function formatFilterValue(
	_config: InternalConfig,
	operatorValue: OperatorValue,
	filterValue: FilterValue,
	maxLength: number,
	t: TranslatorFn,
	timezoneID?: string
): string {
	switch (filterValue.type) {
		case 'empty':
			return '';

		case 'string':
			return truncate(filterValue.value, maxLength);

		case 'integer':
			return formatNumber(
				filterValue.value,
				operatorValue.type === 'integer' ? operatorValue.units : undefined
			);

		case 'float':
			return formatNumber(
				filterValue.value,
				operatorValue.type === 'float' ? operatorValue.units : undefined
			);

		case 'enum':
			if (operatorValue.type === 'enum') {
				return truncate(formatEnumLabel(filterValue.value, operatorValue.values), maxLength);
			}
			return truncate(filterValue.value, maxLength);

		case 'string_list': {
			const items = filterValue.value;
			if (items.length === 0) {
				return '';
			}
			if (items.length === 1) {
				return truncate(items[0], maxLength);
			}
			const joined = items.join(', ');
			if (joined.length <= maxLength) {
				return joined;
			}
			return t('@astryx.powersearch.valueEditor.itemsCount', {
				count: items.length
			});
		}

		case 'enum_list': {
			const items = filterValue.value;
			if (items.length === 0) {
				return '';
			}
			if (operatorValue.type === 'enum_list') {
				const labels = items.map((v) => formatEnumLabel(v, operatorValue.values));
				if (labels.length === 1) {
					return truncate(labels[0], maxLength);
				}
				const joined = labels.join(', ');
				if (joined.length <= maxLength) {
					return joined;
				}
				return t('@astryx.powersearch.valueEditor.itemsCount', {
					count: labels.length
				});
			}
			if (items.length === 1) {
				return truncate(items[0], maxLength);
			}
			return t('@astryx.powersearch.valueEditor.itemsCount', {
				count: items.length
			});
		}

		case 'entity_list': {
			const entities = filterValue.value;
			if (entities.length === 0) {
				return '';
			}
			if (entities.length === 1) {
				return truncate(entities[0].label, maxLength);
			}
			const joined = entities.map((e) => e.label).join(', ');
			if (joined.length <= maxLength) {
				return joined;
			}
			return t('@astryx.powersearch.valueEditor.entitiesCount', {
				count: entities.length
			});
		}

		case 'time':
			return filterValue.value;

		case 'date_absolute':
			return truncate(formatDateAbsolute(filterValue.unixSeconds, timezoneID), maxLength);

		case 'date_relative':
			return formatRelativeDate(filterValue.value);

		case 'date_range':
			return formatDateRange(filterValue.value, t);

		case 'custom':
			if (operatorValue.type === 'custom') {
				return truncate(operatorValue.getString(filterValue.value), maxLength);
			}
			return filterValue.value;

		case 'nested': {
			const count = filterValue.value.length;
			return t('@astryx.powersearch.valueEditor.filtersCount', { count });
		}

		default:
			return '';
	}
}
