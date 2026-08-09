<script lang="ts">
	import type {
		UseChatStreamScrollOptions,
		UseChatStreamScrollReturn
	} from '$lib/components/chat/use-chat-stream-scroll.svelte.js';
	import { useChatStreamScroll } from '$lib/components/chat/use-chat-stream-scroll.svelte.js';

	/**
	 * Probe for `useChatStreamScroll` — Svelte's substitute for `renderHook`.
	 *
	 * Upstream's harness writes the hook's return into a mutable `api` object on
	 * every render; here the return is exported from the instance script and the
	 * test reads it through `render(...).component`, the shape the port already
	 * uses for handler-returning hooks. `scrollRef` is a getter rather than a ref
	 * object, which is the hook's own translation.
	 *
	 * **The geometry is real, not stubbed.** Upstream defines `scrollHeight` and
	 * `clientHeight` onto the element because jsdom has no layout; these tests run
	 * in Chromium, where a `scrollTop` write to an element that does not actually
	 * overflow is clamped straight back to 0. So the scroller is a fixed 400px box
	 * over a spacer whose height the test drives — the same numbers upstream
	 * stubs, produced by the layout engine instead of defined onto it.
	 */
	interface Props {
		options?: Partial<Omit<UseChatStreamScrollOptions, 'scrollRef'>>;
		/** Starting height of the spacer, i.e. the container's `scrollHeight`. */
		contentHeight?: number;
	}

	const { options = {}, contentHeight: initialContentHeight = 400 }: Props = $props();

	let el: HTMLDivElement | null = $state(null);
	let contentHeight = $state(initialContentHeight);

	export const api: UseChatStreamScrollReturn = useChatStreamScroll({
		scrollRef: () => el,
		...options
	});

	export function setContentHeight(px: number): void {
		contentHeight = px;
	}
</script>

<div
	bind:this={el}
	data-testid="scroller"
	style="overflow-y: auto; height: 400px; margin: 0; padding: 0"
>
	<div style="height: {contentHeight}px"></div>
</div>
