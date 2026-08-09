<script lang="ts">
	import ImperativeDialogLayer from '$lib/components/dialog/imperative-dialog-layer.svelte';
	import { useImperativeDialog } from '$lib/components/dialog/use-imperative-dialog.svelte.js';
	import type { DialogProps } from '$lib/components/dialog/dialog.svelte';

	/**
	 * Upstream's `TestHarness` and `OptionsHarness` from
	 * `useImperativeDialog.test.tsx`, as one parameterised probe.
	 *
	 * The two differ in exactly two values — whether the hook is constructed with
	 * default options, and what `show()` is called with — so they are props here
	 * rather than a second fixture. The tree is `TestHarness`'s: an Open button, a
	 * Close button, a `status` span reading `isOpen`, and the hook's rendered half.
	 * `OptionsHarness` has no Close button, so for that one case this is a superset;
	 * none of its locators can reach the extra button.
	 *
	 * `dialog.element` becomes `<ImperativeDialogLayer {dialog} />`, and the JSX
	 * upstream passes to `show()` becomes a snippet — the two translations the hook
	 * itself documents. `show()` is called from the template because that is where
	 * the snippet is in scope.
	 */
	type DialogOptions = Omit<DialogProps, 'isOpen' | 'onOpenChange' | 'children'>;

	interface Props {
		/** Default options for the hook. `undefined` is upstream's no-arg call. */
		defaultOptions?: DialogOptions;
		/** Options passed as `show()`'s second argument, if any. */
		showOptions?: DialogOptions;
		/** Label of the open button — upstream's `Open` / `Open Wide`. */
		openLabel?: string;
		/** Text of the shown content — upstream's `Dialog content` / `Wide content`. */
		text?: string;
	}

	const {
		defaultOptions,
		showOptions,
		openLabel = 'Open',
		text = 'Dialog content'
	}: Props = $props();

	const dialog = useImperativeDialog(() => defaultOptions);
</script>

{#snippet content()}
	<div>{text}</div>
{/snippet}

<div>
	<button type="button" onclick={() => dialog.show(content, showOptions)}>{openLabel}</button>
	<button type="button" onclick={() => dialog.hide()}>Close</button>
	<span data-testid="status">{dialog.isOpen ? 'open' : 'closed'}</span>
	<ImperativeDialogLayer {dialog} />
</div>
