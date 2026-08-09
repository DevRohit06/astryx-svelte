<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	export interface PopoverAnchorProps {
		/**
		 * Wiring for the anchor wrapper — anchor positioning plus finding the
		 * trigger button inside and attaching its ARIA/handlers. Applied to the
		 * wrapper `<div>`, which is the CSS anchor (stable, no pressed-state
		 * transforms).
		 */
		attach: Attachment<HTMLElement>;
		/** The `inline-flex` anchor-wrapper class. */
		class: string;
		/** Inline styles for the anchor wrapper, if any. */
		style?: string;
		/** The trigger content — must contain a `<button>` or `[role="button"]`. */
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { setInteractiveRoleContext } from '../../interactive-role-context.svelte.js';

	/**
	 * The automatic-mode anchor wrapper, replacing upstream's inline
	 * `<InteractiveRoleContext value="button"><div ref={wrapperRef}>…</div>`.
	 *
	 * It is a separate component *because* `setInteractiveRoleContext` scopes to
	 * the calling component's whole subtree: called from `Popover` itself it would
	 * also reach the popover content, so the trigger-only scope upstream gets from
	 * wrapping just the wrapper is recreated by delegating to this wrapper. See the
	 * note in `interactive-role-context.svelte.ts`.
	 *
	 * Optionally-interactive children (e.g. `Token`) therefore render as a button
	 * here; a plain `Button` child is unaffected, exactly as upstream.
	 */
	const { attach, class: className, style, children }: PopoverAnchorProps = $props();

	setInteractiveRoleContext(() => 'button');
</script>

<div {@attach attach} class={className} {style}>
	{@render children?.()}
</div>
