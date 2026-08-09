<script lang="ts">
	import DocsShell from '$lib/shell/docs-shell.svelte';

	let { children } = $props();
</script>

<DocsShell>
	{@render children()}
</DocsShell>
