<script lang="ts">
	import { useOutlineFromDOM } from '$lib/components/outline/use-outline-from-dom.svelte.js';

	/**
	 * The probe substitute for upstream's inline `Demo` component in
	 * `Outline.test.tsx`'s `useOutlineFromDOM` describe: it runs the hook and
	 * renders its result, because Svelte has no `renderHook`.
	 *
	 * Upstream passes a `RefObject`; the container arrives here as a getter, so a
	 * `bind:this` landing after the hook call still reaches the observer.
	 */
	let article = $state<HTMLElement | null>(null);
	const outline = useOutlineFromDOM(() => article);
</script>

<article bind:this={article}>
	<h2 id="intro">Intro</h2>
	<h3 id="details">Details</h3>
</article>
<output>{outline.items.map((item) => `${item.level}:${item.id}:${item.label}`).join('|')}</output>
