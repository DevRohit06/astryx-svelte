<script lang="ts">
	import SideNav from '$lib/components/side-nav/side-nav.svelte';
	import SideNavHeading from '$lib/components/side-nav/side-nav-heading.svelte';
	import SideNavItem from '$lib/components/side-nav/side-nav-item.svelte';
	import SideNavSection from '$lib/components/side-nav/side-nav-section.svelte';
</script>

<!--
	Upstream's "renders a complete page nav" integration case, transcribed: every
	slot filled with the component it is meant to hold, two sections, three items.
	It takes no props — the case configures nothing.
-->

{#snippet header()}
	<SideNavHeading heading="My App" />
{/snippet}

{#snippet topContent()}
	<button type="button">Create</button>
{/snippet}

{#snippet footer()}
	<div data-testid="promo">Promo</div>
{/snippet}

{#snippet footerIcons()}
	<button type="button">Help</button>
{/snippet}

<SideNav {header} {topContent} {footer} {footerIcons}>
	<SideNavSection title="Main">
		<SideNavItem label="Dashboard" isSelected />
		<SideNavItem label="Projects" />
	</SideNavSection>
	<SideNavSection title="Settings">
		<SideNavItem label="General" />
	</SideNavSection>
</SideNav>
