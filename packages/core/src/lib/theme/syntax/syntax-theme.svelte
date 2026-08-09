<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { SyntaxThemeDefinition } from './define-syntax-theme.js';

	// Deliberately **not** exported, and absent from the barrel: upstream declares
	// `interface SyntaxThemeProps` module-privately and publishes no props type
	// for this component, unlike `MediaTheme`. Exporting it would invent API.
	interface SyntaxThemeProps {
		/** The syntax theme to apply, from `defineSyntaxTheme` or one of the presets. */
		theme: SyntaxThemeDefinition;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { syntaxThemeStyle } from './define-syntax-theme.js';
	import { setSyntaxThemeContext } from './syntax-theme-context.svelte.js';

	/**
	 * Syntax theme provider. Sets the `--color-syntax-*` custom properties on a
	 * wrapper `<div>` so nested code surfaces inherit them through the cascade.
	 *
	 * @example
	 * ```svelte
	 * <SyntaxTheme theme={dracula}>
	 * 	<CodeBlock code={source} language="ts" />
	 * </SyntaxTheme>
	 * ```
	 */
	let { theme, children }: SyntaxThemeProps = $props();

	setSyntaxThemeContext(() => ({ theme }));

	// Upstream hands `syntaxThemeStyle`'s object straight to React's `style` prop.
	// Svelte's `style` attribute is a string, so the same object is serialised
	// here — the published helper keeps its object shape either way.
	// `value == null` is filtered out rather than serialised. `defineSyntaxTheme`
	// warns-and-continues on a missing token, so `theme.tokens[key]` can be
	// undefined; React's `style` object silently omits such entries, letting the
	// block fall through to the `:root` defaults `highlight-styles.ts` injects.
	// Serialising it would emit `--color-syntax-x: undefined`, which is a *valid*
	// custom-property value — it would shadow the fallback and make every
	// `var()` referencing it invalid at computed-value time.
	const style = $derived(
		Object.entries(syntaxThemeStyle(theme))
			.filter(([, value]) => value != null)
			.map(([property, value]) => `${property}: ${value};`)
			.join(' ')
	);
</script>

<div {style} data-astryx-syntax-theme={theme.name}>
	{@render children()}
</div>
