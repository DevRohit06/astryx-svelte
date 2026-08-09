<script lang="ts">
	import Dialog from '$lib/components/dialog/dialog.svelte';
	import Popover from '$lib/components/popover/popover.svelte';

	/**
	 * Upstream's tree for `lets Escape fall through to a host Dialog when fully
	 * opted out`: a `<Popover hasLightDismiss={false} hasEscapeDismiss={false}>`
	 * nested inside an open `<Dialog purpose="info">`.
	 *
	 * A fixture because `Dialog`'s children, `Popover`'s children and `Popover`'s
	 * `content` are all snippets, and none can be written inline in a `render()`
	 * props object.
	 */
	interface Props {
		onDialogOpenChange: (isOpen: boolean) => unknown;
	}

	const { onDialogOpenChange }: Props = $props();
</script>

{#snippet content()}<span>Coachmark</span>{/snippet}

<Dialog isOpen={true} onOpenChange={onDialogOpenChange} purpose="info">
	<Popover {content} label="Tip" hasLightDismiss={false} hasEscapeDismiss={false}>
		<button type="button">Open tip</button>
	</Popover>
</Dialog>
