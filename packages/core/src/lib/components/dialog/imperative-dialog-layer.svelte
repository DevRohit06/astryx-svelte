<script lang="ts" module>
	import type { ImperativeDialogReturn } from './use-imperative-dialog.svelte.js';

	/**
	 * As with `LayerProps`, `TooltipLayerProps`, `KeyboardHintLayerProps` and
	 * `LightboxLayerProps`, upstream has no counterpart name: `element` is a value
	 * on the hook's return, not a component, so there is nothing there for a props
	 * type to describe.
	 */
	export interface ImperativeDialogLayerProps {
		/** The value returned by `useImperativeDialog`. */
		dialog: ImperativeDialogReturn;
	}
</script>

<script lang="ts">
	import Dialog from './dialog.svelte';

	/**
	 * The rendering half of `useImperativeDialog`, replacing upstream's `element`.
	 *
	 * Note `onOpenChange` only handles `false` — upstream's `element` ignores a
	 * `true`, so the dialog can never re-open itself through this path; only
	 * `show()` opens it.
	 */
	const { dialog }: ImperativeDialogLayerProps = $props();

	const options = $derived(dialog.options);
	const content = $derived(dialog.content);
</script>

<!--
	Rendered unconditionally, as upstream's `element` is: a closed `Dialog` is a
	closed `<dialog>` element, not an absent one. (`useImperativeAlertDialog` is
	the one that returns `null` before its first `show()`.)
-->
<Dialog
	isOpen={dialog.isOpen}
	onOpenChange={(nextOpen) => {
		if (!nextOpen) {
			dialog.hide();
		}
	}}
	{...options}
>
	{#if typeof content === 'function'}
		{@render content()}
	{:else}
		{content}
	{/if}
</Dialog>
