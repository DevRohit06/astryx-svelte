<script lang="ts">
	import DialogHeader from '$lib/components/dialog/dialog-header.svelte';
	import { setLayoutDividerContext } from '$lib/components/layout/layout-divider-context.svelte.js';

	/**
	 * Renders `DialogHeader` inside an optional `LayoutDividerContext`, standing in
	 * for upstream's bare `<LayoutDividerContext value={{defaultHasDividers}}>`
	 * wrapper. `contextValue` unset means no provider at all (the "no context"
	 * baseline); set means a provider with that default.
	 */
	interface Props {
		title: string;
		hasDivider?: boolean;
		contextValue?: boolean;
	}

	const { title, hasDivider, contextValue }: Props = $props();

	// Always provide the getter, returning `null` when unset — to a consumer that
	// falls back through `?? false`, a null-returning provider is indistinguishable
	// from no provider, which is the "no context" baseline these cases compare to.
	setLayoutDividerContext(() =>
		contextValue === undefined ? null : { defaultHasDividers: contextValue }
	);
</script>

<DialogHeader {title} {hasDivider} />
