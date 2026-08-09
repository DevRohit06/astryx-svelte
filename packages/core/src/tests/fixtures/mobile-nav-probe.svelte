<script lang="ts">
	import MobileNav, { type MobileNavProps } from '$lib/components/mobile-nav/mobile-nav.svelte';

	/**
	 * Renders `MobileNav` with an arbitrary prop bag and a single `<span>` body —
	 * the smallest thing that can hand `MobileNav` a `children` snippet, since a
	 * snippet can only be authored in a template. Upstream writes the body inline
	 * as JSX.
	 */
	interface Props {
		// The bag spread onto `<MobileNav>`. `Record<string, any>` for the same
		// contravariance reason the other shared probes give, and so the
		// pass-through case can pass attributes that are not declared on
		// `MobileNavProps`.
		//
		// It is `navProps` rather than the usual `props` because this probe is
		// re-rendered: `vitest-browser-svelte`'s `rerender({props: {…}})` is the
		// *deprecated* legacy signature and unwraps the `props` key as the whole
		// prop bag, so a prop literally named `props` is unreachable through it.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		navProps: Record<string, any>;
		/** Text of the `<span>` inside the drawer. */
		text?: string;
	}

	const { navProps, text = 'Content' }: Props = $props();
</script>

<MobileNav {...navProps as Omit<MobileNavProps, 'children'>}>
	<span>{text}</span>
</MobileNav>
