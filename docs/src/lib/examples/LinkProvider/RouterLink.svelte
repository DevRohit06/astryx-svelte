<!--
	The `RouterLink` stand-in from upstream's
	`templates/blocks/components/LinkProvider/LinkProviderCustomLink.tsx`.

	Upstream declares it as a second function component in the same file; Svelte
	has no in-file component declaration, so it is a sibling module — the shape the
	demo route's `Theme` helpers already use. Not a block itself: the example
	registry only looks for `<BlockName>.svelte`, so this file is never listed.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface RouterLinkProps {
		href?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
		[key: string]: unknown;
	}

	const { href, onclick, children, ...props }: RouterLinkProps = $props();
</script>

<a
	{href}
	onclick={(e) => {
		e.preventDefault();
		onclick?.(e);
		alert(`RouterLink intercepted navigation to: ${href}`);
	}}
	{...props}
>
	{@render children?.()}
</a>
