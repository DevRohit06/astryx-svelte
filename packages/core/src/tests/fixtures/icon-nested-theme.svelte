<script lang="ts">
	import Icon from '$lib/components/icon/icon.svelte';
	import { defineTheme } from '$lib/theme/define-theme.js';
	import Theme from '$lib/theme/theme.svelte';

	/**
	 * Two nested `<Theme>`s, each registering its own `check`, for the
	 * theme-scoping case in `icon.svelte.test.ts`.
	 *
	 * Upstream writes this inline in the test, because JSX lets it nest two
	 * providers in the `render()` call and its registry values are bare strings.
	 * Here both halves need a component file: `render()` takes one component, and
	 * a registry value is a *snippet*, which can only be authored in a template.
	 * The snippets render text rather than an `<svg>` so the assertion stays
	 * upstream's `toHaveTextContent`.
	 */
	const outer = defineTheme({ name: 'icon-nested-outer', icons: { check: outerCheck } });
	const inner = defineTheme({ name: 'icon-nested-inner', icons: { check: innerCheck } });
</script>

{#snippet outerCheck()}outer-check{/snippet}
{#snippet innerCheck()}inner-check{/snippet}

<Theme theme={outer}>
	<Icon icon="check" data-testid="outer" />
	<Theme theme={inner}>
		<Icon icon="check" data-testid="inner" />
	</Theme>
</Theme>
