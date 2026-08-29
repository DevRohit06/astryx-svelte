<script lang="ts" module>
	import type { Locale } from '../../i18n/index.js';
	import type { EnumItem, FilterValue, OperatorValue } from './types.js';

	export interface PowerSearchTokenValueProps {
		operatorValue: OperatorValue;
		filterValue: FilterValue;
		maxLength: number;
		locale: Locale;
	}

	/**
	 * `PowerSearch.tsx`'s own truncator — **not** `formatFilterValue`'s.
	 *
	 * The two differ in every respect and are fed the same `maxTokenLength`:
	 * this one cuts only past `limit + 3`, slices to `limit` and appends three
	 * ASCII dots (result length `limit + 3`); `format-filter-value.ts`'s cuts
	 * past `maxLength`, slices to `maxLength - 1` and appends one U+2026 (result
	 * length `maxLength`). Upstream keeps both, uses this one in the token markup
	 * and the other in the accessible tokenizer label, and this port keeps each at
	 * its own call site rather than unifying them. Recorded in port/todo.md's Known
	 * debts.
	 */
	function truncateString(value: string, limit: number): string {
		// Same semantics as before — strings within `limit + 3` pass through, longer
		// ones cut to `limit` plus '...' — but counted in characters, not code units.
		return truncateCharacters(value, limit + 3, '...');
	}

	function getEnumLabel(values: ReadonlyArray<EnumItem>, value: string): string {
		return values.find((v) => v.value === value)?.label ?? value;
	}
</script>

<script lang="ts">
	import { formatDateAbsoluteCompact } from './format-filter-value.js';
	import { powerSearchTokenValueAttrs } from './power-search.stylex.js';
	import { truncateCharacters } from '../../utils/characters.js';

	/**
	 * Ported from `PowerSearchTokenValue` in Astryx's `PowerSearch.tsx`.
	 *
	 * The `<span>` inside a filter token that shows the value. Every non-null
	 * branch renders the same element with the same class, so the whole component
	 * reduces to one `<span>` over a derived string plus a "does this branch show
	 * anything at all" flag.
	 *
	 * ## It is not `formatFilterValue`, and the differences are not incidental
	 *
	 * Upstream has two value formatters and this is the one the *markup* uses.
	 * Against `format-filter-value.ts` it: uses the other truncator (above);
	 * renders `integer`/`float` with plain interpolation rather than
	 * `Intl.NumberFormat`, so no thousands separators and no `units` suffix;
	 * decides `string_list`/`enum_list`/`entity_list` overflow on the **sum of
	 * item lengths** rather than the joined length, so the `, ` separators are not
	 * counted; formats `date_absolute` through `formatDateAbsoluteCompact` — the
	 * same provider locale, but no time fields and **still ignoring
	 * `timezoneID`**; and hard-codes `N items`, `date range`, `1 filter` and
	 * `N filters` in English where the other reaches for `t()`. All of it
	 * transcribed; none of it corrected.
	 */

	const { operatorValue, filterValue, maxLength, locale }: PowerSearchTokenValueProps = $props();

	/**
	 * `null` where upstream returns `null` — the three cases that render no
	 * `<span>` at all: an `empty` filter value and any of the three list types
	 * with no items.
	 */
	const text = $derived.by<string | null>(() => {
		switch (filterValue.type) {
			case 'empty':
				return null;

			case 'string':
				return truncateString(filterValue.value, maxLength);

			case 'integer':
			case 'float':
				return String(filterValue.value);

			case 'enum':
				if (operatorValue.type === 'enum') {
					return truncateString(getEnumLabel(operatorValue.values, filterValue.value), maxLength);
				}
				return truncateString(filterValue.value, maxLength);

			case 'string_list': {
				const items = filterValue.value;
				if (items.length === 0) {
					return null;
				}
				if (items.length === 1) {
					return truncateString(items[0], maxLength);
				}
				const totalLength = items.reduce((sum, s) => sum + s.length, 0);
				if (totalLength > maxLength) {
					return `${items.length} items`;
				}
				return items.join(', ');
			}

			case 'enum_list': {
				const items = filterValue.value;
				if (items.length === 0) {
					return null;
				}
				if (operatorValue.type === 'enum_list') {
					const labels = items.map((v) => getEnumLabel(operatorValue.values, v));
					if (labels.length === 1) {
						return truncateString(labels[0], maxLength);
					}
					const totalLength = labels.reduce((sum, s) => sum + s.length, 0);
					if (totalLength > maxLength) {
						return `${labels.length} items`;
					}
					return labels.join(', ');
				}
				if (items.length === 1) {
					return truncateString(items[0], maxLength);
				}
				return `${items.length} items`;
			}

			case 'entity_list': {
				const entities = filterValue.value;
				if (entities.length === 0) {
					return null;
				}
				if (entities.length === 1) {
					return truncateString(entities[0].label, maxLength);
				}
				const totalLength = entities.reduce((sum, e) => sum + e.label.length, 0);
				if (totalLength > maxLength) {
					return `${entities.length} items`;
				}
				return entities.map((e) => e.label).join(', ');
			}

			case 'time':
				return filterValue.value;

			case 'date_absolute': {
				const formatted = formatDateAbsoluteCompact(filterValue.unixSeconds, locale);
				return truncateString(formatted, maxLength);
			}

			case 'date_relative':
				return truncateString(filterValue.value, maxLength);

			case 'date_range':
				return 'date range';

			case 'custom':
				if (operatorValue.type === 'custom') {
					return truncateString(operatorValue.getString(filterValue.value), maxLength);
				}
				return filterValue.value;

			case 'nested': {
				const count = filterValue.value.length;
				return count === 1 ? '1 filter' : `${count} filters`;
			}

			default:
				return null;
		}
	});
</script>

{#if text !== null}
	<span {...powerSearchTokenValueAttrs()}>{text}</span>
{/if}
