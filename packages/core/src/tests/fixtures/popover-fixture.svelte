<script lang="ts">
	import Popover from '$lib/components/popover/popover.svelte';
	import type { ComponentProps } from 'svelte';

	/**
	 * Upstream's test tree — `<Popover content={<span>…</span>} label="…">
	 * <button type="button">Open</button></Popover>` — as a fixture, because both
	 * `children` and `content` are snippets here and neither can be written inline
	 * in a `render()` props object.
	 *
	 * The switches cover every trigger shape the suite exercises (a plain button,
	 * a button nested in a wrapper, a `role="button"` element, a non-button, and
	 * sibling `anchorRef` mode) and both content shapes (a plain `<span>` and the
	 * interactive `<button data-testid="inside-content">` the focus-restoration
	 * cases move focus into).
	 *
	 * `anchorRef` is the port's `HTMLElement | null` rather than upstream's ref
	 * object, so the sibling-mode button is captured with `bind:this` and handed
	 * over directly — the translation the component documents.
	 */
	interface Props extends Omit<
		ComponentProps<typeof Popover>,
		'children' | 'content' | 'anchorRef'
	> {
		/** Trigger shape. */
		triggerVariant?: 'button' | 'nested' | 'role-button' | 'not-button' | 'anchor-ref';
		/** The trigger's visible/accessible label. */
		triggerLabel?: string;
		/**
		 * Content shape: plain span, an interactive button (focus restoration), or
		 * a self-labelled `role="menu"` (the `role="none"` wrapper case).
		 */
		contentVariant?: 'span' | 'inside-button' | 'menu';
		/** Text rendered inside the popover content. */
		contentText?: string;
	}

	const {
		triggerVariant = 'button',
		triggerLabel = 'Open',
		contentVariant = 'span',
		contentText = 'Popover content',
		...rest
	}: Props = $props();

	let anchorEl = $state<HTMLButtonElement | null>(null);
</script>

{#snippet content()}{#if contentVariant === 'inside-button'}<button
			type="button"
			data-testid="inside-content">{contentText}</button
		>{:else if contentVariant === 'menu'}<div role="menu" aria-label="Actions">
			{contentText}
		</div>{:else}<span>{contentText}</span>{/if}{/snippet}

{#if triggerVariant === 'anchor-ref'}
	<button type="button" bind:this={anchorEl}>{triggerLabel}</button>
	<Popover {...rest} {content} anchorRef={anchorEl} />
{:else if triggerVariant === 'nested'}
	<Popover {...rest} {content}>
		<div><button type="button">{triggerLabel}</button></div>
	</Popover>
{:else if triggerVariant === 'role-button'}
	<Popover {...rest} {content}>
		<div role="button" tabindex={0}>{triggerLabel}</div>
	</Popover>
{:else if triggerVariant === 'not-button'}
	<Popover {...rest} {content}>
		<span>{triggerLabel}</span>
	</Popover>
{:else}
	<Popover {...rest} {content}>
		<button type="button">{triggerLabel}</button>
	</Popover>
{/if}
