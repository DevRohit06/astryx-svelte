<script lang="ts">
	import InputGroup, { type InputGroupProps } from '$lib/components/input-group/input-group.svelte';
	import InputGroupText from '$lib/components/input-group/input-group-text.svelte';
	import TextInput from '$lib/components/text-input/text-input.svelte';
	import NumberInput from '$lib/components/number-input/number-input.svelte';
	import Selector from '$lib/components/selector/selector.svelte';
	import MultiSelector from '$lib/components/multi-selector/multi-selector.svelte';
	import Typeahead from '$lib/components/typeahead/typeahead.svelte';
	import DateInput from '$lib/components/date-input/date-input.svelte';
	import { createStaticSource } from '$lib/components/typeahead/create-static-source.js';

	/**
	 * An `InputGroup` around the member children upstream writes inline as JSX —
	 * a test case cannot author a snippet, so the child arrangement is selected by
	 * `variant` and every `InputGroup` prop is forwarded through `...rest`.
	 *
	 * - `currency` — `<InputGroupText>$</InputGroupText>` + a hidden-label
	 *   `TextInput label="Amount">`, upstream's recurring `$`/Amount pair.
	 * - `plain` — the `TextInput` alone (the label/description/status/size cases).
	 * - `url` — `https://` + `TextInput label="URL"` + `.com`, the prefix/suffix case.
	 * - `number` — `<InputGroupText>$</InputGroupText>` + a hidden-label
	 *   `NumberInput label="Amount"`, upstream's `WithNumberInput` pair.
	 * - `selector` — `#` + a hidden-label `Selector label="Channel"`, added in
	 *   batch 6 when `Selector` landed.
	 * - `multi-selector` — `#` + a hidden-label `MultiSelector label="Channels"`,
	 *   added in batch 7 when `MultiSelector` landed.
	 * - `typeahead` — `Fruit` + a hidden-label `Typeahead label="Selection"`,
	 *   added in batch 6 when `Typeahead` landed.
	 * - `date` — `Due` + a hidden-label `DateInput label="Date"`, added in batch 12
	 *   when `DateInput` landed. This is the last variant the fixture was missing.
	 *
	 * `TextInput` is controlled; the value it holds is irrelevant to every case
	 * that uses this fixture, so it is pinned to `''` with a noop `onChange`.
	 * `NumberInput` is likewise controlled, pinned to `null` as upstream's case is,
	 * and so are `Selector` (no `value`), `MultiSelector` (`[]`) and `Typeahead`
	 * (`null`). `DateInput` takes no `value` at all, as upstream's case does.
	 */
	type Variant =
		'currency' | 'plain' | 'url' | 'number' | 'selector' | 'multi-selector' | 'typeahead' | 'date';

	interface Props extends Omit<InputGroupProps, 'children'> {
		variant?: Variant;
	}

	const { variant = 'plain', ...rest }: Props = $props();

	const noop = (): void => {};

	// Upstream's `fruitSource` for the grouped-Typeahead case.
	const fruitSource = createStaticSource([
		{ id: '1', label: 'Apple' },
		{ id: '2', label: 'Banana' },
		{ id: '3', label: 'Cherry' }
	]);
</script>

<InputGroup {...rest}>
	{#if variant === 'currency'}
		<InputGroupText>$</InputGroupText>
		<TextInput label="Amount" isLabelHidden value="" onChange={noop} />
	{:else if variant === 'number'}
		<InputGroupText>$</InputGroupText>
		<NumberInput label="Amount" isLabelHidden value={null} onChange={noop} />
	{:else if variant === 'selector'}
		<InputGroupText>#</InputGroupText>
		<Selector
			label="Channel"
			isLabelHidden
			options={['General', 'Support']}
			placeholder="Choose channel"
		/>
	{:else if variant === 'multi-selector'}
		<InputGroupText>#</InputGroupText>
		<MultiSelector
			label="Channels"
			isLabelHidden
			options={['General', 'Support']}
			value={[]}
			onChange={noop}
			placeholder="Choose channels"
		/>
	{:else if variant === 'typeahead'}
		<InputGroupText>Fruit</InputGroupText>
		<Typeahead
			label="Selection"
			isLabelHidden
			searchSource={fruitSource}
			value={null}
			onChange={noop}
		/>
	{:else if variant === 'date'}
		<InputGroupText>Due</InputGroupText>
		<DateInput label="Date" isLabelHidden onChange={noop} />
	{:else if variant === 'url'}
		<InputGroupText>https://</InputGroupText>
		<TextInput label="URL" isLabelHidden value="" onChange={noop} />
		<InputGroupText>.com</InputGroupText>
	{:else}
		<TextInput label="Amount" isLabelHidden value="" onChange={noop} />
	{/if}
</InputGroup>
