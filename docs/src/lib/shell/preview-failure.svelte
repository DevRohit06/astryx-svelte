<script lang="ts">
	import { untrack } from 'svelte';
	import { Code, Text, VStack } from '@astryx-svelte/core';

	/**
	 * What a crashed preview shows — the `failed` branch of the stage's
	 * `<svelte:boundary>`, and the counterpart of upstream's
	 * `PreviewErrorBoundary`.
	 *
	 * Most of the errors this catches are one thing: a sub-component that reads a
	 * context its parent publishes and throws when there is no parent. `Tab` calls
	 * `useTabListContext()`, `RadioListItem` needs a `RadioList`, a toast needs its
	 * viewport. Upstream heads six of those off with `playground.wrapper`, which
	 * this port honours too; the rest land here, and core's own error messages name
	 * the parent, so the message is worth showing rather than swallowing.
	 *
	 * It is a component rather than inline markup for the reset: upstream resets
	 * its boundary from `componentDidUpdate` when its `resetKeys` change, and a
	 * Svelte boundary has no such hook — but the `failed` snippet can render a
	 * component, and a component can hold an effect.
	 */
	interface Props {
		name: string;
		error: unknown;
		/** The boundary's own reset, handed in by the `failed` snippet. */
		reset: () => void;
		/** Increments on every edit. See the effect below. */
		token: number;
		/** Snippet-typed rows with nothing typed in them yet. */
		emptySlots: string[];
	}

	const { name, error, reset, token, emptySlots }: Props = $props();

	/**
	 * The edit count at the moment of the failure — read once, deliberately not
	 * tracked, so the effect below compares against a fixed point. `untrack` says
	 * so out loud, and keeps the compiler from reading a plain `const failedAt =
	 * token` as a mistake.
	 */
	const failedAt = untrack(() => token);

	/**
	 * Upstream's `resetKeys`: a change to the knobs since the failure means the
	 * render that threw is no longer the render being asked for, so try again.
	 * A component that throws unconditionally simply fails again and lands on a
	 * fresh instance of this one, which cannot loop — `failedAt` is re-read.
	 */
	$effect(() => {
		if (token !== failedAt) reset();
	});

	const message = $derived(
		error instanceof Error ? error.message : typeof error === 'string' ? error : String(error)
	);

	/**
	 * An unfilled slot, and the port's own failure mode rather than a component
	 * fault. React renders `{children}` as nothing when it is undefined, so
	 * upstream's stage never meets this; `{@render children()}` throws, and eight
	 * containers whose `children` the compiler declares non-optional are documented
	 * upstream without `required: true`, so nothing seeds them.
	 *
	 * The message is worth replacing here because the fix is one cell away — and
	 * the effect above turns typing into that cell into a retry.
	 *
	 * `invalid_snippet` is Svelte's own error code, and it survives the production
	 * build: a minified runtime throws the same code as a `svelte.dev/e/…` URL
	 * rather than the sentence.
	 */
	const isEmptySlot = $derived(message.includes('invalid_snippet') && emptySlots.length > 0);
</script>

<VStack gap={2} style="padding: var(--spacing-6); text-align: center; align-items: center;">
	<Text type="supporting" color="secondary">
		Live preview unavailable — <Code>{name}</Code> did not render on its own.
	</Text>
	{#if isEmptySlot}
		<Text type="supporting" color="secondary">
			It renders slot content unconditionally and no slot is filled yet. Type into the
			<Code>{emptySlots[0]}</Code> row below and the preview appears.
		</Text>
	{:else}
		<Text type="supporting" color="secondary">{message}</Text>
	{/if}
</VStack>
