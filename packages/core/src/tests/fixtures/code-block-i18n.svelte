<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import InternationalizationProvider from '$lib/i18n/internationalization-provider.svelte';
	import type { Locale, Overrides } from '$lib/i18n/types.js';
	import CodeBlock from '$lib/components/code-block/code-block.svelte';

	/**
	 * `<CodeBlock>` under an `InternationalizationProvider`, the
	 * `metadata-list-i18n.svelte` precedent: a provider's `children` is a snippet
	 * and cannot be written inline in a `render()` props object.
	 *
	 * Serves the one case asserting the copy announcement reads its copy from the
	 * i18n catalog.
	 */
	interface Props extends ComponentProps<typeof CodeBlock> {
		locale: Locale;
		overrides?: Overrides;
	}

	const { locale, overrides, ...codeBlock }: Props = $props();
</script>

<InternationalizationProvider {locale} {overrides}>
	<CodeBlock {...codeBlock} />
</InternationalizationProvider>
