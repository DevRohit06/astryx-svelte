<script lang="ts">
	import DismissalLayer from './dismissal-layer.svelte';

	/**
	 * Upstream's layer whose content claims Escape for itself — an editor closing
	 * its own find widget, for instance. A fixture because the `<button>` is
	 * component content, which is a snippet here.
	 *
	 * `onKeyDown` becomes `onkeydown`. Svelte delegates `keydown` from the mount
	 * container, which sits below `document`, so the button's `preventDefault()`
	 * still lands before the stack's document-level listener sees the press —
	 * the same ordering React's own root-container delegation gives upstream.
	 *
	 * The `aria-label` has no upstream counterpart and nothing queries by it: the
	 * case reaches this element by its test id. It is here only because Svelte's
	 * compiler warns about a button with no accessible name, and upstream's JSX
	 * has no such check to answer.
	 */
	interface Props {
		onDismiss: () => void;
	}

	const { onDismiss }: Props = $props();
</script>

<DismissalLayer {onDismiss}>
	<button
		type="button"
		data-testid="editor"
		aria-label="editor"
		onkeydown={(event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
			}
		}}
	></button>
</DismissalLayer>
