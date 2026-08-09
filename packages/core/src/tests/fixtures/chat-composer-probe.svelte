<script lang="ts">
	import type { ChatComposerInputProps } from '$lib/components/chat/chat-composer-input.svelte';
	import ChatComposer from '$lib/components/chat/chat-composer.svelte';
	import ChatComposerInput from '$lib/components/chat/chat-composer-input.svelte';

	/**
	 * `ChatComposer` with an explicit `ChatComposerInput` in its `input` slot.
	 *
	 * Upstream passes `input={<ChatComposerInput onChange={…} />}`; the slot is a
	 * `Snippet` here, so the element has to be authored in a template. The point
	 * of the case is that the child's own `onChange` does not displace the
	 * composer's — so the child must carry props of its own.
	 */
	interface Props {
		onSubmit: (value: string) => void;
		inputProps?: Partial<ChatComposerInputProps>;
	}

	const { onSubmit, inputProps = {} }: Props = $props();
</script>

{#snippet input()}
	<ChatComposerInput {...inputProps} />
{/snippet}

<ChatComposer {onSubmit} {input} />
