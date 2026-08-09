<script lang="ts">
	import Theme from '$lib/theme/theme.svelte';
	import type { DefinedTheme } from '$lib/theme/define-theme.js';
	import type { ThemeMode } from '$lib/theme/types.js';

	/**
	 * Two nested `<Theme>`s, for upstream's three nesting cases: only the outer
	 * one may reach `<html>`, and the inner one must still theme its own wrapper.
	 */
	interface Props {
		theme: DefinedTheme;
		mode?: ThemeMode;
		innerTheme: DefinedTheme;
		innerMode?: ThemeMode;
	}

	const { theme, mode, innerTheme, innerMode }: Props = $props();
</script>

<Theme {theme} {mode}>
	<Theme theme={innerTheme} mode={innerMode}>
		<span>nested</span>
	</Theme>
</Theme>
