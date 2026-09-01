<script lang="ts">
	import ToastViewport from '$lib/components/toast/toast-viewport.svelte';
	import ShowToastButton from './show-toast-button.svelte';
	import Button from '$lib/components/button/button.svelte';
	import type {
		ToastContentRenderProps,
		ToastDismissReason,
		ToastOptions
	} from '$lib/components/toast/types.js';

	/**
	 * The four custom layouts upstream's `describe('renderContent')` declares
	 * inline, as snippets.
	 *
	 * `renderContent` is a `Snippet<[ToastContentRenderProps]>` here where upstream
	 * has `(toast) => ReactNode`, so the layout cannot be written in a `.test.ts`
	 * at all — it has to live in a component. One fixture carries all four rather
	 * than four fixtures carrying one each, because they differ only in their body
	 * and every case renders the same viewport around them.
	 *
	 * `body` and `endContent` are `string | Snippet` (recorded in
	 * `port/debts.md`), so each is rendered through the leaf-slot discrimination
	 * this port uses everywhere — `typeof === 'function'`. Upstream writes
	 * `{toast.body}` and React sorts it out.
	 */
	const {
		variant,
		onHide,
		onAction,
		withEndContent = false,
		withPlainTrigger = false
	}: {
		variant: 'custom' | 'nested' | 'controlFree' | 'timing';
		onHide?: (reason: ToastDismissReason) => void;
		onAction?: () => void;
		withEndContent?: boolean;
		withPlainTrigger?: boolean;
	} = $props();
</script>

{#snippet slot(content: ToastOptions['body'] | undefined)}
	{#if typeof content === 'function'}{@render content()}{:else if content}{content}{/if}
{/snippet}

{#snippet undo()}
	<button type="button" onclick={onAction}>Undo</button>
{/snippet}

{#snippet custom(toast: ToastContentRenderProps)}
	<div data-testid="custom-content">
		{@render slot(toast.body)}
		{@render slot(toast.endContent)}
		<Button label="Dismiss custom toast" onclick={toast.dismiss} />
	</div>
{/snippet}

{#snippet nestedDismiss(dismiss: () => void)}
	<Button label="Nested dismiss" onclick={dismiss} />
{/snippet}

{#snippet nested(toast: ToastContentRenderProps)}
	<div>
		{@render slot(toast.body)}
		{@render nestedDismiss(toast.dismiss)}
	</div>
{/snippet}

{#snippet controlFree(toast: ToastContentRenderProps)}
	<div data-testid="control-free-content">{@render slot(toast.body)}</div>
{/snippet}

{#snippet timing(toast: ToastContentRenderProps)}
	<!--
		Upstream's layout pushes the resolved timing into a closure array and returns
		`<div>{toast.body}</div>`. A snippet body is markup, not a function body, so
		there is nowhere to run that push without a side effect in the template —
		the resolved values are put on the element instead and read back from there.
		The layout is the test's either way, so this changes nothing the component
		renders.
	-->
	<div data-auto-hide={String(toast.isAutoHide)} data-duration={String(toast.autoHideDuration)}>
		{@render slot(toast.body)}
	</div>
{/snippet}

<ToastViewport isTopLayer={false}>
	{#if variant === 'custom'}
		<ShowToastButton
			triggerLabel="Show"
			options={{
				body: 'Toast A',
				onHide,
				renderContent: custom,
				endContent: withEndContent ? undo : undefined
			}}
		/>
	{:else if variant === 'nested'}
		<ShowToastButton
			triggerLabel="Show"
			options={{ body: 'Nested', isAutoHide: false, onHide, renderContent: nested }}
		/>
	{:else if variant === 'controlFree'}
		<ShowToastButton
			triggerLabel="Show"
			options={{ body: 'Control-free', type: 'error', renderContent: controlFree }}
		/>
	{:else}
		<ShowToastButton
			triggerLabel="Show"
			options={{ body: 'Fleeting', autoHideDuration: 3000, onHide, renderContent: timing }}
		/>
	{/if}
	{#if withPlainTrigger}
		<ShowToastButton triggerLabel="Plain" options={{ body: 'Toast B' }} />
	{/if}
</ToastViewport>
