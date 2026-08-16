<script lang="ts" module>
	import type { FilterValue, OperatorValue } from './types.js';
	import type { InternalConfig } from './use-internal-config.svelte.js';

	export interface PowerSearchValueEditorProps {
		operatorValue: OperatorValue;
		filterValue: FilterValue | undefined;
		onChange: (value: FilterValue, shouldSave?: boolean) => void;
		onEnter?: () => void;
		config: InternalConfig;
		isDisabled?: boolean;
		timezoneID?: string;
	}
</script>

<script lang="ts">
	import CustomEditor from './custom-editor.svelte';
	import DateAbsoluteEditor from './date-absolute-editor.svelte';
	import DateRangeEditor from './date-range-editor.svelte';
	import DateRelativeEditor from './date-relative-editor.svelte';
	import EntityListEditor from './entity-list-editor.svelte';
	import EnumEditor from './enum-editor.svelte';
	import EnumListEditor from './enum-list-editor.svelte';
	import FloatEditor from './float-editor.svelte';
	import IntegerEditor from './integer-editor.svelte';
	import StringEditor from './string-editor.svelte';
	import StringListEditor from './string-list-editor.svelte';
	import TimeEditor from './time-editor.svelte';

	/**
	 * Ported from the `PowerSearchValueEditor` dispatcher in Astryx's
	 * `PowerSearchValueEditor.tsx`.
	 *
	 * Fourteen `OperatorValue.type` arms plus a default. Twelve render an editor;
	 * `empty` and `nested` render nothing, as does the default — upstream's
	 * `nested` arm carries a comment about showing "a message" that it does not
	 * show, and the comment is kept because deleting it would hide that the arm
	 * is deliberately unimplemented rather than missed.
	 *
	 * port/todo.md described this as type-dispatching "into 15 components". The
	 * batch-14 spec pass settled the real numbers: **14 arms, 12 editors, 7
	 * distinct astryx components** (`TextInput`, `NumberInput`, `DateInput`,
	 * `TimeInput`, `Selector`, `Tokenizer`, `Typeahead`) plus the caller's own
	 * `Editor` for `custom`.
	 *
	 * ## Three props that are declared and never read — upstream's, not omissions
	 *
	 * - **`config`** and **`timezoneID`** are on `PowerSearchValueEditorProps`
	 *   and the dispatcher destructures neither. `PowerSearchEditPopover` passes
	 *   both.
	 * - **`onEnter`** is threaded as far as `StringEditor`, which binds it and
	 *   never calls it.
	 *
	 * ## One behaviour worth stating outright
	 *
	 * **`isDisabled` reaches only `CustomEditor`.** Every built-in editor ignores
	 * it, so a read-only popover still renders live, editable inputs — the value
	 * simply cannot be applied, because `PowerSearchEditPopover` disables its
	 * Apply button. That is upstream's behaviour; making the inputs disabled here
	 * would be an improvement the parity rule forbids.
	 */

	const {
		operatorValue,
		filterValue,
		onChange,
		onEnter,
		config: _config,
		isDisabled,
		timezoneID: _timezoneID
	}: PowerSearchValueEditorProps = $props();
</script>

{#if operatorValue.type === 'string'}
	<StringEditor {operatorValue} {filterValue} {onChange} {onEnter} />
{:else if operatorValue.type === 'string_list'}
	<StringListEditor {operatorValue} {filterValue} {onChange} />
{:else if operatorValue.type === 'integer'}
	<IntegerEditor {operatorValue} {filterValue} {onChange} />
{:else if operatorValue.type === 'float'}
	<FloatEditor {operatorValue} {filterValue} {onChange} />
{:else if operatorValue.type === 'time'}
	<TimeEditor {operatorValue} {filterValue} {onChange} />
{:else if operatorValue.type === 'date_absolute'}
	<DateAbsoluteEditor {operatorValue} {filterValue} {onChange} />
{:else if operatorValue.type === 'date_relative'}
	<DateRelativeEditor {operatorValue} {filterValue} {onChange} />
{:else if operatorValue.type === 'date_range'}
	<DateRangeEditor {operatorValue} {filterValue} {onChange} />
{:else if operatorValue.type === 'enum'}
	<EnumEditor {operatorValue} {filterValue} {onChange} />
{:else if operatorValue.type === 'enum_list'}
	<EnumListEditor {operatorValue} {filterValue} {onChange} />
{:else if operatorValue.type === 'entity_list'}
	<EntityListEditor {operatorValue} {filterValue} {onChange} />
{:else if operatorValue.type === 'custom'}
	<CustomEditor {operatorValue} {filterValue} {onChange} {isDisabled} />
{/if}
