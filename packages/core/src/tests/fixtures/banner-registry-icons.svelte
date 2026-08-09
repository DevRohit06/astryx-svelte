<script lang="ts" module>
	export { customInfo, customChevron };
</script>

<!--
	Snippets for the two icon-registry cases in `banner.svelte.test.ts`.

	`registerIcons` takes snippets, and a snippet can only be authored in a
	template — so upstream's inline `<svg data-testid="…">` arguments become
	module-level exports of this fixture, the same shape `default-icons.svelte`
	uses for the built-in registry.
-->

{#snippet customInfo()}
	<svg data-testid="custom-registry-icon"><circle /></svg>
{/snippet}

{#snippet customChevron()}
	<svg data-testid="custom-chevron"><path d="M0 0" /></svg>
{/snippet}
