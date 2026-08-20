<script lang="ts">
	import ChatComposer from '$lib/components/chat/chat-composer.svelte';
	import type { ChatComposerElevation } from '$lib/components/chat/chat-composer.svelte';
	import ChatComposerContextInput from './chat-composer-context-input.svelte';

	/**
	 * `ChatComposer` with one of the three `input` slot shapes `ChatComposer.test.tsx`
	 * passes inline as JSX. The slot is a `Snippet` here, so each shape has to be
	 * authored in a template — the same string-discriminator move
	 * `app-shell-fixture.svelte` and `dialog-probe.svelte` make.
	 *
	 * `marker` is upstream's `<div data-testid="composer-input-marker" />`, which
	 * the elevation cases walk up from (slot marker → inputArea → body) so they
	 * stay independent of StyleX's generated class names.
	 */
	interface Props {
		/** Which shape to render into the composer's `input` slot. */
		input: 'marker' | 'context' | 'textarea';
		elevation?: ChatComposerElevation;
		value?: string;
		placeholder?: string;
		isDisabled?: boolean;
		/** Called when the registered focus control fires — upstream's `focusSpy`. */
		focusSpy?: () => void;
	}

	const { input, elevation, value, placeholder, isDisabled, focusSpy = () => {} }: Props = $props();
</script>

{#snippet inputSlot()}
	{#if input === 'marker'}
		<div data-testid="composer-input-marker"></div>
	{:else if input === 'context'}
		<ChatComposerContextInput {focusSpy} />
	{:else}
		<textarea data-testid="bare-textarea"></textarea>
	{/if}
{/snippet}

<ChatComposer
	onSubmit={() => {}}
	{elevation}
	{value}
	{placeholder}
	{isDisabled}
	input={inputSlot}
/>
