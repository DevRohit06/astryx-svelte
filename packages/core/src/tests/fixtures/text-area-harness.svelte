<script lang="ts">
	import TextArea, { type TextAreaProps } from '$lib/components/text-area/text-area.svelte';

	/**
	 * A `TextArea` that owns its value, standing in for upstream's
	 * `function Wrapper() { const [val, setVal] = useState(''); … }`.
	 *
	 * `value` is a required prop and the component is controlled, so a case that
	 * needs the value to follow what was typed needs a component around it — a
	 * test file cannot hold `$state` that a rendered component reads.
	 */
	interface Props extends Omit<TextAreaProps, 'value'> {
		/** Starting value, as upstream's `useState('')` argument. */
		initialValue?: string;
	}

	const { initialValue = '', onChange, ...rest }: Props = $props();

	// svelte-ignore state_referenced_locally
	let value = $state(initialValue);
</script>

<TextArea
	{...rest}
	{value}
	onChange={(newValue, e) => {
		value = newValue;
		onChange?.(newValue, e);
	}}
/>
