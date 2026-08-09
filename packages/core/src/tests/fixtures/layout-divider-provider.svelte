<script lang="ts">
	import type { Component } from 'svelte';
	import { setLayoutDividerContext } from '$lib/components/layout/layout-divider-context.svelte.js';

	/**
	 * Provides `LayoutDividerContext` around one slot component, which is what
	 * upstream's cases do with a bare `<LayoutDividerContext value={…}>` — the
	 * divider default has to be checkable without a whole `Layout` above it.
	 */
	interface Props {
		defaultHasDividers: boolean;
		// `any` for the same reason `slot-probe` gives: a component's props are
		// contravariant, so nothing narrower accepts every component.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>;
		text: string;
		rest?: Record<string | symbol, unknown>;
	}

	const { defaultHasDividers, component: Target, text, rest = {} }: Props = $props();

	setLayoutDividerContext(() => ({ defaultHasDividers }));
</script>

{#snippet content()}
	<span>{text}</span>
{/snippet}

<Target {...rest} children={content} />
