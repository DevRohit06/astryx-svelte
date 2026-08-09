<script lang="ts">
	import InputGroup, { type InputGroupProps } from '$lib/components/input-group/input-group.svelte';
	import InputGroupText from '$lib/components/input-group/input-group-text.svelte';
	import DateInput, { type DateInputProps } from '$lib/components/date-input/date-input.svelte';

	/**
	 * Upstream's two `InputGroup` cases, whose JSX children a Svelte case cannot
	 * author: `<InputGroupText>Starts</InputGroupText>` followed by a
	 * hidden-label `<DateInput label="Date" />`. Group props arrive through
	 * `group`, the date input's own through `dateInput` — each under its own key
	 * rather than a rest spread, as `time-input-group-probe.svelte` does.
	 */
	interface Props {
		group: Omit<InputGroupProps, 'children'>;
		dateInput: DateInputProps;
	}

	const { group, dateInput }: Props = $props();
</script>

<InputGroup {...group}>
	<InputGroupText>Starts</InputGroupText>
	<DateInput {...dateInput} />
</InputGroup>
