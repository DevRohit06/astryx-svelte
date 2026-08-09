<script lang="ts">
	import type {
		ChatComposerInputHandle,
		ChatComposerInputProps
	} from '$lib/components/chat/chat-composer-input.svelte';
	import ChatComposerInput from '$lib/components/chat/chat-composer-input.svelte';

	/**
	 * `ChatComposerInput` with its imperative handle hoisted out.
	 *
	 * Upstream reaches the handle through a `handleRef` callback prop; this port
	 * publishes the same five functions as instance exports, so a parent gets
	 * them with `bind:this`. The fixture is that parent — it re-exports the
	 * handle so a test can hold it exactly where upstream holds its `handle`
	 * variable, and `render(...).component.handle` reads the same object
	 * `ChatComposer` would.
	 */
	interface Props {
		props?: Partial<ChatComposerInputProps>;
		/**
		 * Adds a `renderItem` snippet to every trigger. `renderItem` is a
		 * `Snippet<[SearchableItem]>` where upstream takes a render function, and a
		 * snippet can only be written in a template.
		 */
		customRenderItem?: boolean;
	}

	const { props = {}, customRenderItem = false }: Props = $props();

	const resolved = $derived(
		customRenderItem && props.triggers != null
			? { ...props, triggers: props.triggers.map((t) => ({ ...t, renderItem: customItem })) }
			: props
	);

	let input = $state<ChatComposerInputHandle | null>(null);

	export function handle(): ChatComposerInputHandle {
		if (input == null) {
			throw new Error('ChatComposerInput has not mounted');
		}
		return input;
	}
</script>

{#snippet customItem(item: { label: string })}
	<div data-testid="custom-item">{item.label}</div>
{/snippet}

<ChatComposerInput bind:this={input} {...resolved} />
