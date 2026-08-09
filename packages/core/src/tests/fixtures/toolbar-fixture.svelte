<script lang="ts">
	import Toolbar from '$lib/components/toolbar/toolbar.svelte';

	/**
	 * `<Toolbar>` with its three snippet slots filled from data.
	 *
	 * Upstream passes the slots as inline JSX — a span, a fragment of buttons, or
	 * an input plus a button. A Svelte snippet can only be authored in a template,
	 * so each shape becomes a flag here.
	 */
	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props: Record<string, any>;
		/** `startContent` — a `<span data-testid>`. */
		startTestid?: string;
		/** `centerContent` — a `<span data-testid>`. */
		centerTestid?: string;
		/** `endContent` — a `<span data-testid>`. */
		endTestid?: string;
		/** `startContent` — these labels as plain `<button>`s, for the focus cases. */
		startButtons?: string[];
		/** `startContent` — an `<input>` plus a button, for the caret-guard case. */
		hasStartInput?: boolean;
	}

	const {
		props,
		startTestid,
		centerTestid,
		endTestid,
		startButtons,
		hasStartInput = false
	}: Props = $props();
</script>

{#snippet startContent()}
	{#if hasStartInput}
		<input type="text" aria-label="Query" value="hello" />
		<button type="button">Go</button>
	{:else if startButtons}
		{#each startButtons as text (text)}
			<button type="button">{text}</button>
		{/each}
	{:else}
		<span data-testid={startTestid}>Start</span>
	{/if}
{/snippet}

{#snippet centerContent()}
	<span data-testid={centerTestid}>Center</span>
{/snippet}

{#snippet endContent()}
	<span data-testid={endTestid}>End</span>
{/snippet}

<Toolbar
	{...props}
	label={props.label as string}
	startContent={startTestid != null || startButtons != null || hasStartInput
		? startContent
		: undefined}
	centerContent={centerTestid != null ? centerContent : undefined}
	endContent={endTestid != null ? endContent : undefined}
/>
