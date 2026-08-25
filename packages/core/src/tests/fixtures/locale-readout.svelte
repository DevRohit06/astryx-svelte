<script lang="ts">
	import { useLocale } from '$lib/i18n/use-locale.svelte.js';

	/**
	 * The consumer half of `use-locale-probe.svelte`. Separate component, not a
	 * snippet: `useLocale()` reads Svelte context and so must run during a
	 * component's *initialisation*, which a snippet body is too late for. It also
	 * has to sit below the provider in the component tree for the context to
	 * reach it at all.
	 *
	 * The locale is rendered rather than exposed as an instance `export const`
	 * because the hook returns a getter — a value captured at init would report
	 * the initial locale forever, and the suite could not tell a live read from a
	 * frozen one. `direction-readout.svelte`'s reasoning, for the sibling hook.
	 */
	const locale = useLocale();
</script>

<span data-testid="locale">{locale()}</span>
