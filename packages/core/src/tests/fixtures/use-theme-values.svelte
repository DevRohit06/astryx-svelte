<script lang="ts">
	import { useTheme } from '$lib/theme/use-theme.svelte.js';

	/**
	 * The `renderHook` substitute for `useTheme`: runs the hook at init — which is
	 * where a context-reading hook must run — and renders every value the suite
	 * reads.
	 *
	 * `tokens` is rendered as JSON rather than exposed through an instance export,
	 * because the harness reaches this component through a `<Theme>` wrapper and
	 * the suite only ever compares the whole map, which JSON does exactly.
	 */
	const { tokenNames = [] }: { tokenNames?: string[] } = $props();

	const resolved = useTheme();
</script>

<span data-testid="name">{resolved.name}</span>
<span data-testid="mode">{resolved.mode}</span>
{#each tokenNames as name (name)}
	<span data-testid="token:{name}">{resolved.token(name)}</span>
{/each}
<span data-testid="tokens">{JSON.stringify(resolved.tokens)}</span>
