<script lang="ts">
	import { useFocusTrap } from '$lib/hooks/use-focus-trap.svelte.js';

	/**
	 * Upstream's `Trap`, which takes its trapped content as JSX children. A test
	 * file cannot declare a snippet, so the three bodies it is rendered with are
	 * selected by prop instead — the alternative was three near-identical fixture
	 * files.
	 */
	const {
		content
	}: {
		content: 'contenteditable' | 'inert' | 'anchor' | 'aria-hidden' | 'aria-hidden-last';
	} = $props();

	const trap = useFocusTrap(() => ({ isActive: true }));
</script>

<div>
	<button type="button" data-testid="outside">Outside</button>
	<div {@attach trap.attachContainer} data-testid="trap">
		{#if content === 'contenteditable'}
			<div contenteditable="true" data-testid="editor">Type here</div>
		{:else if content === 'inert'}
			<div inert>
				<button type="button" data-testid="inert-btn">Inert</button>
			</div>
			<button type="button" data-testid="real-btn">Real</button>
		{:else if content === 'aria-hidden'}
			<div aria-hidden="true">
				<button type="button" data-testid="aria-hidden-btn">Hidden from AT</button>
			</div>
			<button type="button" data-testid="real-btn">Real</button>
		{:else if content === 'aria-hidden-last'}
			<button type="button" data-testid="first">First</button>
			<button type="button" data-testid="visible-last">Visible last</button>
			<div aria-hidden="true">
				<button type="button" data-testid="aria-hidden-btn">Hidden from AT</button>
			</div>
		{:else}
			<a href="#link" data-testid="anchor">Link</a>
		{/if}
	</div>
	<button type="button" onclick={trap.focusFirst} data-testid="focus-first">Focus first</button>
</div>
