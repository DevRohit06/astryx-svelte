<script lang="ts">
	import Theme from '$lib/theme/theme.svelte';
	import type { DefinedTheme } from '$lib/theme/define-theme.js';
	import type { ThemeMode } from '$lib/theme/types.js';

	/**
	 * `<Theme>` around one text child — upstream's cases pass `<span>hello</span>`
	 * as JSX, and a Svelte child can only be authored in a template.
	 */
	interface Props {
		theme: DefinedTheme;
		mode?: ThemeMode;
		/** Text of the single child, so a case can find it by name. */
		text?: string;
	}

	const { theme, mode, text = 'hello' }: Props = $props();
</script>

<Theme {theme} {mode}>
	<span>{text}</span>
</Theme>
