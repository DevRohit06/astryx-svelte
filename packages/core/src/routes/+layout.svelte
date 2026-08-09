<script lang="ts">
	import '$lib/styles/base.css';
	// Built artifact from packages/themes/neutral. Imported by relative path
	// rather than package name so the workbench doesn't create a dependency
	// cycle (the theme package depends on core, not the other way round).
	import '../../../themes/neutral/dist/theme.css';

	let { children } = $props();

	// In dev, StyleX serves its compiled CSS from a virtual module rather than a
	// real asset, so it has to be injected by hand; the production build appends
	// it to a normal CSS asset. `import.meta.env.DEV` is statically replaced by
	// Vite, so this whole branch is stripped from the production bundle.
	if (import.meta.env.DEV) {
		import('virtual:stylex:runtime');
	}
</script>

<svelte:head>
	{#if import.meta.env.DEV}
		<link rel="stylesheet" href="/virtual:stylex.css" />
	{/if}
</svelte:head>

{@render children()}
