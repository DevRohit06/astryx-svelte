<script lang="ts">
	import DateTimeInput from '$lib/components/date-time-input/date-time-input.svelte';
	import type { ISODateTimeString } from '$lib/components/date-time-input/date-time-input.svelte';

	/**
	 * Upstream's `ControlledDateTimeInput` from
	 * `DateTimeInput/DateTimeInputTouch.test.tsx`: a `useState` wrapper that
	 * feeds its own `onChange` back in as `value`, so the four "Save date is
	 * disabled until a valid date exists" cases observe a value that actually
	 * moves.
	 *
	 * A fixture rather than an inline component because `render()` takes a
	 * component and a props object — there is no place to declare local state
	 * beside the call, which is what upstream's function component is.
	 */
	interface Props {
		initialValue?: ISODateTimeString;
	}

	const { initialValue }: Props = $props();

	// svelte-ignore state_referenced_locally
	let value = $state<ISODateTimeString | undefined>(initialValue);
</script>

<DateTimeInput label="Meeting" {value} onChange={(next) => (value = next)} />
