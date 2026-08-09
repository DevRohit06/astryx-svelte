<script lang="ts">
	import '$lib/styles/base.css';
	// Built artifact from packages/themes/neutral. Imported by relative path
	// rather than package name so the workbench doesn't create a dependency
	// cycle (the theme package depends on core, not the other way round).
	//
	// **The relative path dodges pnpm's graph, not the bundler's.** This is a
	// real build-time edge from core back to a package that builds *after* it,
	// and it is why `build` no longer runs `vite build` — see `build:demo` in
	// package.json. On a clean checkout `themes/neutral/dist/` does not exist
	// when core builds, so bundling the workbench there fails with rolldown's
	// `UNRESOLVED_IMPORT` on this line and on `+page.svelte`'s sibling import.
	// It passed locally only because a previous run had left the artifact on
	// disk. Upstream has no such edge: its core `build` is a library build
	// (babel + tsc + css + umd) that produces no app, and `theme-neutral` takes
	// core as a *peer* dependency.
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
