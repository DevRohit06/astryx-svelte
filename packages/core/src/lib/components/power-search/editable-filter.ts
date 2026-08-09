import type { FilterValue, PowerSearchFilter } from './types.js';
import type { InternalConfig } from './use-internal-config.svelte.js';

/**
 * The recursive-nesting state helpers from Astryx's
 * `PowerSearchEditPopover.tsx`, transcribed verbatim into a `.ts` sibling.
 *
 * All seven are pure functions over plain data — upstream declares them at
 * module scope in the component file, which a `.svelte` file cannot do for
 * non-snippet values that its `<script module>` would then have to export. They
 * are module-private on both sides.
 *
 * The three path helpers (`updateAtPath`, `removeAtPath`, `addAtPath`) are
 * immutable: each returns a new array and clones only the spine down to the
 * touched node. That is load-bearing rather than stylistic — `NestedEditor`
 * hands the result straight to its parent as the new value, and a mutation in
 * place would leave the parent comparing an array with itself.
 */

export interface EditablePartialFilter {
	field: string;
	operator?: string;
	value?: FilterValue;
	_subFilters?: EditablePartialFilter[];
}

export function initEditableFilter(
	config: InternalConfig,
	filter: PowerSearchFilter
): EditablePartialFilter {
	const op = config.getOperator(filter.field, filter.operator);
	if (op?.value.type === 'nested' && filter.value?.type === 'nested') {
		return {
			field: filter.field,
			operator: filter.operator,
			value: filter.value,
			_subFilters: filter.value.value.map((f) => initEditableFilter(config, f))
		};
	}
	return {
		field: filter.field,
		operator: filter.operator,
		value: filter.value
	};
}

export function isEditableFilterComplete(
	config: InternalConfig,
	ef: EditablePartialFilter
): boolean {
	if (!ef.field || !ef.operator) {
		return false;
	}
	const op = config.getOperator(ef.field, ef.operator);
	if (op?.value.type === 'nested') {
		const subs = ef._subFilters ?? [];
		return subs.length > 0 && subs.every((s) => isEditableFilterComplete(config, s));
	}
	return ef.value != null;
}

export function editableToCompleteFilter(
	config: InternalConfig,
	ef: EditablePartialFilter
): PowerSearchFilter | null {
	if (!ef.operator) {
		return null;
	}
	const op = config.getOperator(ef.field, ef.operator);
	if (op?.value.type === 'nested') {
		const subs = (ef._subFilters ?? [])
			.map((s) => editableToCompleteFilter(config, s))
			.filter((s): s is PowerSearchFilter => s != null);
		return {
			field: ef.field,
			operator: ef.operator,
			value: { type: 'nested', value: subs }
		};
	}
	if (ef.value == null) {
		return null;
	}
	return {
		field: ef.field,
		operator: ef.operator,
		value: ef.value
	};
}

export function updateAtPath(
	filters: EditablePartialFilter[],
	path: number[],
	updater: (filter: EditablePartialFilter) => EditablePartialFilter
): EditablePartialFilter[] {
	const [idx, ...rest] = path;
	const next = [...filters];
	if (rest.length === 0) {
		next[idx] = updater(next[idx]);
	} else {
		const sf = next[idx];
		next[idx] = {
			...sf,
			_subFilters: updateAtPath(sf._subFilters ?? [], rest, updater)
		};
	}
	return next;
}

export function removeAtPath(
	filters: EditablePartialFilter[],
	path: number[]
): EditablePartialFilter[] {
	const [idx, ...rest] = path;
	if (rest.length === 0) {
		return filters.filter((_, i) => i !== idx);
	}
	const next = [...filters];
	const sf = next[idx];
	next[idx] = {
		...sf,
		_subFilters: removeAtPath(sf._subFilters ?? [], rest)
	};
	return next;
}

export function addAtPath(
	filters: EditablePartialFilter[],
	parentPath: number[],
	newFilter: EditablePartialFilter
): EditablePartialFilter[] {
	if (parentPath.length === 0) {
		return [...filters, newFilter];
	}
	const [idx, ...rest] = parentPath;
	const next = [...filters];
	const sf = next[idx];
	next[idx] = {
		...sf,
		_subFilters: addAtPath(sf._subFilters ?? [], rest, newFilter)
	};
	return next;
}
