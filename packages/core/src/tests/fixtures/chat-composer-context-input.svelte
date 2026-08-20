<script lang="ts">
	import { untrack } from 'svelte';
	import { useChatComposerContext } from '$lib/components/chat/chat-context.svelte.js';

	/**
	 * Upstream's `CustomContextInput` from `ChatComposer.test.tsx`.
	 *
	 * A custom input that participates in the composer's composition contract:
	 * reads value/placeholder/isDisabled from the exported context, and registers
	 * a focus control so the shell can drive body-click-to-focus without knowing
	 * its DOM shape.
	 *
	 * Upstream assigns `ctx.inputControlRef.current`; this port's `inputControlRef`
	 * is the callback half of that ref (a `RefObject` written by the *child* has no
	 * Svelte counterpart — see `chat-context.svelte.ts`), so registration is a
	 * call rather than an assignment and `register(null)` stands in for the
	 * `current = null` teardown.
	 *
	 * The registration is read `untrack`ed, so the effect has mount/unmount
	 * dependencies only — the composer rebuilds its context value on every
	 * keystroke, which is exactly what upstream's `[controlRef, focusSpy]`
	 * dependency list excludes. `chat-composer-input.svelte` does the same.
	 */
	interface Props {
		focusSpy: () => void;
	}

	const { focusSpy }: Props = $props();

	const ctx = useChatComposerContext();
	let el: HTMLInputElement | null = null;

	$effect(() => {
		const register = untrack(() => ctx?.().inputControlRef);
		if (!register) {
			return;
		}
		register({
			focus: () => {
				focusSpy();
				el?.focus();
			}
		});
		return () => register(null);
	});
</script>

<input
	bind:this={el}
	data-testid="custom-input"
	value={ctx?.().value ?? ''}
	placeholder={ctx?.().placeholder}
	disabled={ctx?.().isDisabled}
	oninput={(e) => ctx?.().onChange(e.currentTarget.value)}
/>
