<script lang="ts">
	import FormLayout from '$lib/components/form-layout/form-layout.svelte';
	import Field from '$lib/components/field/field.svelte';
	import TextInput from '$lib/components/text-input/text-input.svelte';
	import CheckboxInput from '$lib/components/checkbox-input/checkbox-input.svelte';
	import type { FormOptionality } from '$lib/components/form-layout/form-layout-context.svelte.js';
	import OptionalityReader from './optionality-reader.svelte';

	/**
	 * Drives the `defaultOptionality` cases.
	 *
	 * Upstream renders each arrangement as inline JSX and reads the context with a
	 * local `OptionalityReader` component. A Svelte context can only be read from
	 * a component's init, and children can only be authored in a template, so both
	 * live here — selected by `mode` so one fixture covers every case.
	 */
	interface Props {
		mode: 'reader' | 'nested-reader' | 'fields' | 'text-input' | 'checkbox' | 'bare-text-input';
		/** The layout's `defaultOptionality`; omit for the unset case. */
		optionality?: FormOptionality;
		/** Inner layout's optionality, for `nested-reader`. */
		innerOptionality?: FormOptionality;
		/** Marks the single control in the `text-input` / `checkbox` modes. */
		isOptional?: boolean;
		isRequired?: boolean;
		/** Label of the single control, where a case distinguishes two of them. */
		label?: string;
	}

	const {
		mode,
		optionality,
		innerOptionality,
		isOptional = false,
		isRequired = false,
		label = 'Name'
	}: Props = $props();
</script>

{#if mode === 'bare-text-input'}
	<TextInput label="Solo" value="" onChange={() => {}} />
{:else}
	<FormLayout defaultOptionality={optionality}>
		{#if mode === 'reader'}
			<OptionalityReader />
		{:else if mode === 'nested-reader'}
			<FormLayout defaultOptionality={innerOptionality}>
				<OptionalityReader />
			</FormLayout>
		{:else if mode === 'fields'}
			<Field label="Bio" inputID="bio">
				<input id="bio" />
			</Field>
			<Field label="Nickname" inputID="nick" isOptional>
				<input id="nick" />
			</Field>
			<Field label="Email" inputID="email" isRequired>
				<input id="email" />
			</Field>
		{:else if mode === 'text-input'}
			<TextInput {label} value="" onChange={() => {}} {isOptional} {isRequired} />
		{:else if mode === 'checkbox'}
			<CheckboxInput {label} value={false} onChange={() => {}} {isRequired} />
		{/if}
	</FormLayout>
{/if}
