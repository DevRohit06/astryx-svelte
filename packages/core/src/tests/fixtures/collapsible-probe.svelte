<script lang="ts" module>
	import type { CollapsibleProps } from '$lib/components/collapsible/collapsible.svelte';

	export interface CollapsibleProbeProps extends Omit<CollapsibleProps, 'trigger' | 'children'> {
		/** Trigger text (string form). Ignored when `richTrigger` is set. */
		trigger?: string;
		/**
		 * Render the trigger as a snippet exposing `<span data-testid="rich">`, for
		 * upstream's "renders a ReactNode trigger, not just a string" case.
		 */
		richTrigger?: boolean;
		/** Body text placed inside the content region. */
		body?: string;
		/** Render the body inside `<span data-testid={childTestId}>` instead of `<p>`. */
		childTestId?: string;
	}
</script>

<script lang="ts">
	import Collapsible from '$lib/components/collapsible/collapsible.svelte';

	/**
	 * A single standalone `Collapsible`. Every `Collapsible` prop is forwarded
	 * through `...rest` (including `defaultIsOpen`, `isOpen`, `isDisabled`,
	 * `onOpenChange`, `data-testid`, `data-custom`, and an attachment key), matching
	 * upstream's inline JSX. `children` is a `Snippet`, so the body is described by
	 * the `body`/`childTestId` props rather than authored in the `.ts` test.
	 */
	let {
		trigger = 'T',
		richTrigger = false,
		body = 'Body',
		childTestId,
		...rest
	}: CollapsibleProbeProps = $props();
</script>

{#snippet rich()}<span data-testid="rich">Rich</span>{/snippet}

<Collapsible trigger={richTrigger ? rich : trigger} {...rest}>
	{#if childTestId}<span data-testid={childTestId}>{body}</span>{:else}<p>{body}</p>{/if}
</Collapsible>
