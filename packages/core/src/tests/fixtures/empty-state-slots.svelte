<script lang="ts">
	import EmptyState, { type EmptyStateProps } from '$lib/components/empty-state/empty-state.svelte';

	/**
	 * `EmptyState` with its two snippet slots filled from plain props.
	 *
	 * React writes an inline `<span data-testid="empty-icon">` for `icon` and
	 * an inline fragment of two `<button>`s for `actions`. A Svelte snippet can
	 * only be authored in a template, so the case describes the slot content and
	 * the fixture builds it.
	 *
	 * `slot-probe.svelte` — the fixture that usually covers "React passes an
	 * element as a prop" — fills one slot at a time and always renders a `<span>`.
	 * Upstream's actions are `<button>`s, and its `renders all slots together`
	 * case needs both slots at once, so neither fits.
	 *
	 * A slot the case leaves out is passed as `undefined`, not as an empty
	 * snippet: `EmptyState` branches on whether the slot was provided at all, and
	 * two of the ported cases assert on the wrapper elements that branch emits.
	 */
	interface Props extends Omit<EmptyStateProps, 'icon' | 'actions'> {
		/** Text of the decorative icon. Omitted, no icon slot is passed. */
		iconText?: string;
		/** `data-testid` on the icon element. */
		iconTestid?: string;
		/** Labels of the action buttons. Omitted, no actions slot is passed. */
		actionLabels?: string[];
		/** `data-testid` on the first action button. */
		actionTestid?: string;
	}

	const { iconText, iconTestid, actionLabels, actionTestid, ...rest }: Props = $props();
</script>

{#snippet icon()}
	<span data-testid={iconTestid}>{iconText}</span>
{/snippet}

{#snippet actions()}
	{#each actionLabels ?? [] as label, index (label)}
		<button type="button" data-testid={index === 0 ? actionTestid : undefined}>{label}</button>
	{/each}
{/snippet}

<EmptyState
	{...rest}
	icon={iconText != null ? icon : undefined}
	actions={actionLabels != null ? actions : undefined}
/>
