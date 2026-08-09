<script lang="ts">
	import Theme from '$lib/theme/theme.svelte';
	import UseThemeValues from './use-theme-values.svelte';
	import type { DefinedTheme } from '$lib/theme/define-theme.js';
	import type { ThemeMode } from '$lib/theme/types.js';

	/**
	 * Upstream's `wrapper({children, mode})` from `useTheme.test.tsx`: the hook
	 * probe, optionally inside a `<Theme>`. Omitting `theme` is the no-provider
	 * path its last two describes exercise.
	 */
	interface Props {
		theme?: DefinedTheme;
		mode?: ThemeMode;
		/** Token names to resolve, each rendered under its own testid. */
		tokenNames?: string[];
	}

	const { theme, mode, tokenNames = [] }: Props = $props();
</script>

{#if theme}
	<Theme {theme} {mode}>
		<UseThemeValues {tokenNames} />
	</Theme>
{:else}
	<UseThemeValues {tokenNames} />
{/if}
