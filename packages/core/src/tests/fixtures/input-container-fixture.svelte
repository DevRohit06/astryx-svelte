<script lang="ts">
	import { useInputContainer } from '$lib/hooks/use-input-container.svelte.js';

	/**
	 * Stands in for upstream's `TestContainer`, which wires `useInputContainer`
	 * around one control supplied by a `renderControl` render prop.
	 *
	 * Svelte has no render prop that can hand a `ref` back out to its caller, so
	 * the control is *described* instead: `element` picks the tag upstream's JSX
	 * uses for that case and `attrs` carries that case's attributes verbatim.
	 * `bind:this` replaces the ref, and the two `bind:this` targets are separate
	 * variables so each keeps its concrete element type.
	 *
	 * The chrome span is upstream's, and it is the point: clicking it — rather
	 * than the control — is what makes the container's handler the thing under
	 * test.
	 */
	interface Props {
		element?: 'input' | 'textarea';
		/** The control's attributes, transcribed from upstream's JSX. */
		attrs?: Record<string, string>;
		onControlFocus?: () => void;
		onControlClick?: () => void;
	}

	const { element = 'input', attrs = {}, onControlFocus, onControlClick }: Props = $props();

	let container = $state<HTMLElement | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);

	const inputContainer = useInputContainer(() => ({
		container,
		input: element === 'textarea' ? textareaEl : inputEl
	}));
</script>

<div bind:this={container} {...inputContainer}>
	<span data-testid="chrome">chrome</span>
	{#if element === 'textarea'}
		<textarea
			bind:this={textareaEl}
			data-testid="control"
			{...attrs}
			onfocus={onControlFocus}
			onclick={onControlClick}></textarea>
	{:else}
		<input
			bind:this={inputEl}
			data-testid="control"
			{...attrs}
			onfocus={onControlFocus}
			onclick={onControlClick}
		/>
	{/if}
</div>
