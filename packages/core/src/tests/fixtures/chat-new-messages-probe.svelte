<script lang="ts">
	import { useChatNewMessages } from '$lib/components/chat/use-chat-new-messages.svelte.js';

	/**
	 * Probe for `useChatNewMessages`' content callback.
	 *
	 * Upstream's three harnesses differ only in *when* the observed element
	 * exists — immediately, after a click, or until a click — so one fixture with
	 * a `mounted` toggle covers all three. `isLocked` is a getter here where
	 * upstream passes a boolean; the hook documents why.
	 */
	interface Props {
		isLocked?: boolean;
		onResize?: () => void;
		/** Whether the observed content element is mounted initially. */
		initiallyMounted?: boolean;
	}

	const { isLocked = true, onResize, initiallyMounted = true }: Props = $props();

	let mounted = $state(initiallyMounted);

	const newMessages = useChatNewMessages({ isLocked: () => isLocked, onResize });

	export function toggle(): void {
		mounted = !mounted;
	}

	export const hook = newMessages;
</script>

{#if mounted}
	<div
		data-testid="content"
		{@attach (node) => {
			// The attachment's cleanup is what React's callback ref gets for free
			// when it is called with `null` on unmount — without it the hook would
			// keep observing a detached element.
			newMessages.contentRef(node as HTMLElement);
			return () => newMessages.contentRef(null);
		}}
	>
		<div class="astryx-chat-message">msg</div>
	</div>
{/if}
