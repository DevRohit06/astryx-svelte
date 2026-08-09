<script lang="ts">
	import TopNavHeading from '$lib/components/top-nav/top-nav-heading.svelte';

	/**
	 * `<TopNavHeading>` with its `logo` and `menu` slots described as data.
	 *
	 * Upstream's `logo link accessible name` cases hand `logo={<img src="/logo.png"
	 * alt="" />}` — a decorative image — and `menu={<a href="#menu">Menu item</a>}`.
	 * Both are snippets here, so the fixture is what authors them.
	 */
	interface Props {
		/** Props for `<TopNavHeading>` itself. */
		props?: Record<string, unknown>;
		/** `logo` slot: upstream's decorative `<img>`, or a tagged `<span>`. */
		logo?: { img?: boolean; text?: string; testid?: string };
		/** `menu` slot: a single `<a>` with this href and text. */
		menu?: { href: string; text: string };
	}

	const { props = {}, logo, menu }: Props = $props();
</script>

{#snippet logoSlot()}
	{#if logo?.img}
		<img src="/logo.png" alt="" />
	{:else}
		<span data-testid={logo?.testid}>{logo?.text}</span>
	{/if}
{/snippet}

{#snippet menuSlot()}
	<!-- Upstream's `menu={<a href="#menu">Menu item</a>}` verbatim — a bare
	     fragment identifier, not a route, so there is nothing to resolve. -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	{#if menu}<a href={menu.href}>{menu.text}</a>{/if}
{/snippet}

<TopNavHeading {...props} logo={logo ? logoSlot : undefined} menu={menu ? menuSlot : undefined} />
