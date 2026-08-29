<script lang="ts">
	import Dialog from '$lib/components/dialog/dialog.svelte';
	import Popover from '$lib/components/popover/popover.svelte';

	/**
	 * Upstream's `Scene` for the last shim case: a `Popover` whose open state is
	 * driven by a prop, hosted inside an already-open `Dialog`. Only the popover
	 * traps focus, so the shim must follow the popover alone and go false when it
	 * closes while the dialog stays open.
	 *
	 * A fixture because `Dialog`'s children, `Popover`'s children and `Popover`'s
	 * `content` are all snippets here, and none can be written inline in a
	 * `render()` props object. `fixtures/popover-in-dialog.svelte` is the same
	 * tree with both dismiss controls turned off and no `isOpen`, so it cannot
	 * stand in.
	 */
	interface Props {
		isPopoverOpen: boolean;
	}

	const { isPopoverOpen }: Props = $props();
</script>

{#snippet content()}<span>Popover body</span>{/snippet}

<Dialog isOpen={true} onOpenChange={() => {}} aria-label="Dialog">
	<Popover {content} label="Popover" isOpen={isPopoverOpen} onOpenChange={() => {}}>
		<button type="button">Open</button>
	</Popover>
</Dialog>
