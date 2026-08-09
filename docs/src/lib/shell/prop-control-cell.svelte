<script lang="ts">
	import { NumberInput, Selector, Switch, TextInput } from '@astryx-svelte/core';
	import type { Knob } from './prop-control.js';

	/**
	 * One row's editor — upstream's `InlineControl` inside `PlaygroundPropsTable`.
	 *
	 * Built out of this port's own components, which is the docs site's standing
	 * direction (the shell is a real `AppShell`/`TopNav`/`SideNav`) and puts four
	 * form components under load on every component page.
	 *
	 * Each control is the one upstream picks for the same control kind: `Switch`
	 * for a boolean, `Selector` for a literal union, `TextInput` for text and
	 * `NumberInput` for a number. A row whose type earns no control renders
	 * nothing, exactly as upstream's `default: return null` does.
	 */
	interface Props {
		knob: Knob;
		value: unknown;
		onChange: (value: unknown) => void;
	}

	const { knob, value, onChange }: Props = $props();

	const row = $derived(knob.row);
	const control = $derived(knob.control);

	/**
	 * The label a `<select>` shows for the current value. `None` is upstream's
	 * spelling for the empty choice on a union that admits `null` / `undefined`.
	 */
	const selected = $derived.by(() => {
		if (control.kind !== 'enum') return '';
		const match = control.options.find((option) => Object.is(option.value, value));
		if (match) return match.label;
		return control.allowEmpty ? 'None' : (control.options[0]?.label ?? '');
	});

	const selectorOptions = $derived.by(() => {
		if (control.kind !== 'enum') return [];
		const labels = control.options.map((option) => option.label);
		return control.allowEmpty ? ['None', ...labels] : labels;
	});

	function chooseOption(label: string): void {
		if (control.kind !== 'enum') return;
		if (label === 'None' || label === '') {
			onChange(undefined);
			return;
		}
		onChange(control.options.find((option) => option.label === label)?.value);
	}
</script>

{#if control.kind === 'boolean'}
	<Switch
		label={row.name}
		isLabelHidden
		value={value === true}
		onChange={(next) => onChange(next)}
	/>
{:else if control.kind === 'enum'}
	<Selector
		label={row.name}
		isLabelHidden
		size="sm"
		width="100%"
		value={selected}
		options={selectorOptions}
		onChange={chooseOption}
	/>
{:else if control.kind === 'string' || control.kind === 'snippet'}
	<TextInput
		label={row.name}
		isLabelHidden
		size="sm"
		width="100%"
		placeholder={control.kind === 'snippet' ? 'slot text' : 'value'}
		value={typeof value === 'string' ? value : ''}
		onChange={(next) => onChange(next)}
	/>
{:else if control.kind === 'number'}
	<!--
		Two branches rather than one with `hasClear={!row.required}`: `NumberInput`
		is a discriminated union, and its two arms type `onChange` differently
		(`number` vs `number | null`). Upstream's single JSX element is only
		possible because React's props are not checked against a union arm at the
		call site. The behaviour is upstream's either way — an optional number can
		be returned to unset, a required one cannot be emptied out from under the
		preview.
	-->
	{#if row.required}
		<NumberInput
			label={row.name}
			isLabelHidden
			size="sm"
			width="100%"
			value={typeof value === 'number' ? value : null}
			onChange={(next: number) => onChange(next)}
		/>
	{:else}
		<NumberInput
			label={row.name}
			isLabelHidden
			size="sm"
			width="100%"
			hasClear
			placeholder="unset"
			value={typeof value === 'number' ? value : null}
			onChange={(next) => onChange(next ?? undefined)}
		/>
	{/if}
{/if}
