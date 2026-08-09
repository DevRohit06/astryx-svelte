<script lang="ts" module>
	import type { ImperativeAlertDialogReturn } from './use-imperative-alert-dialog.svelte.js';

	/**
	 * As with `LayerProps`, `TooltipLayerProps`, `KeyboardHintLayerProps` and
	 * `LightboxLayerProps`, upstream has no counterpart name: `element` is a value
	 * on the hook's return, not a component, so there is nothing there for a props
	 * type to describe.
	 */
	export interface ImperativeAlertDialogLayerProps {
		/** The value returned by `useImperativeAlertDialog`. */
		alert: ImperativeAlertDialogReturn;
	}
</script>

<script lang="ts">
	import AlertDialog from './alert-dialog.svelte';

	/**
	 * The rendering half of `useImperativeAlertDialog`, replacing upstream's
	 * `element`.
	 *
	 * Note `onOpenChange` only handles `false` — upstream's `element` ignores a
	 * `true`, so the dialog can never re-open itself through this path; only
	 * `show()` opens it.
	 */
	const { alert }: ImperativeAlertDialogLayerProps = $props();

	const options = $derived(alert.options);
</script>

<!--
	Nothing renders before the first `show()`, matching upstream's
	`if (!options) return null` — the options carry `title`/`description`/
	`actionLabel`/`onAction`, so there is no alert dialog to render without them.
	Upstream spreads `{...options}` *first*, so `isOpen`/`onOpenChange` win; the
	option type Omits both, so a type-legal caller cannot reach them either way.
-->
{#if options}
	<AlertDialog
		{...options}
		isOpen={alert.isOpen}
		onOpenChange={(nextOpen) => {
			if (!nextOpen) {
				alert.hide();
			}
		}}
	/>
{/if}
