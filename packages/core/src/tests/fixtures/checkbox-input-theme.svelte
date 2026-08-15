<script lang="ts">
	import CheckboxInput, {
		type CheckboxInputProps
	} from '$lib/components/checkbox-input/checkbox-input.svelte';
	import Theme from '$lib/theme/theme.svelte';
	import type { DefinedTheme } from '$lib/theme/define-theme.js';

	/**
	 * A `CheckboxInput` under a `<Theme>`, so a case can swap the checkbox
	 * indicator for the theme's own. Upstream nests the two in its `render()`
	 * call; a Svelte test renders one component and cannot author markup
	 * children, so the nesting lives here.
	 *
	 * The theme itself is defined in the test file, as upstream defines it there
	 * — only the component it registers has to be a file.
	 */
	interface Props {
		theme: DefinedTheme;
		checkbox: CheckboxInputProps;
	}

	const { theme, checkbox }: Props = $props();
</script>

<Theme {theme}>
	<CheckboxInput {...checkbox} />
</Theme>
