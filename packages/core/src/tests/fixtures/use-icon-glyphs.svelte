<!--
	A snippet library of text glyphs for `use-icon.svelte.test.ts`, not a
	component — its default export renders nothing.

	The icon registry holds **snippets**, and a snippet can only be authored in a
	template, so a suite that wants to register its own glyphs needs a `.svelte`
	file to declare them in. Top-level snippets compile to module-scope functions,
	which is what lets the module script collect them into a plain record the test
	can import — the same shape `src/lib/components/icon/default-icons.svelte`
	uses for the built-ins.

	They render text rather than SVG so the assertions can stay
	`toHaveTextContent`, exactly as `icon-nested-theme.svelte`'s do.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export const glyphs: Record<'root' | 'first' | 'second' | 'outer' | 'inner' | 'global', Snippet> =
		{
			root,
			first,
			second,
			outer,
			inner,
			global: globalGlyph
		};
</script>

{#snippet root()}root-check{/snippet}
{#snippet first()}first-check{/snippet}
{#snippet second()}second-check{/snippet}
{#snippet outer()}outer-check{/snippet}
{#snippet inner()}inner-check{/snippet}
{#snippet globalGlyph()}global-check{/snippet}
