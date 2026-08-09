<script lang="ts">
	import InputGroup, { type InputGroupProps } from '$lib/components/input-group/input-group.svelte';
	import InputGroupText from '$lib/components/input-group/input-group-text.svelte';
	import TimeInput, { type TimeInputProps } from '$lib/components/time-input/time-input.svelte';

	/**
	 * Upstream's four `InputGroup integration` cases, whose JSX children a Svelte
	 * case cannot author: `<InputGroupText>Starts</InputGroupText>` followed by a
	 * hidden-label `TimeInput label="Start time">`. Group props arrive through
	 * `group`, the time input's own through `timeInput` — each under its own key
	 * rather than a rest spread, as `selector-input-group.svelte` does.
	 */
	interface Props {
		group: Omit<InputGroupProps, 'children'>;
		timeInput: TimeInputProps;
	}

	const { group, timeInput }: Props = $props();
</script>

<InputGroup {...group}>
	<InputGroupText>Starts</InputGroupText>
	<TimeInput {...timeInput} />
</InputGroup>
