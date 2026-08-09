<!--
	Ported from upstream's `templates/blocks/components/TopNavHeading/TopNavHeadingShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream authors the SVG in the block file itself, so there is no Heroicons
	substitution here — `AppIcon` becomes a snippet, which is what
	`TopNavHeading.logo` and `NavIcon.icon` take, and it already carries its own
	20px size. It is rendered twice, so it is referenced by two snippet names the
	way upstream references one component twice.
-->
<script lang="ts">
	import { NavIcon, TopNav, TopNavHeading, VStack } from '@astryx-svelte/core';
</script>

{#snippet appIcon()}
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
		/>
	</svg>
{/snippet}

{#snippet navIconLogo()}<NavIcon icon={appIcon} />{/snippet}

{#snippet plainHeading()}
	<TopNavHeading heading="Acme Platform" logo={navIconLogo} />
{/snippet}

{#snippet linkedHeading()}
	<TopNavHeading heading="Acme Platform" logo={appIcon} headingHref="/" />
{/snippet}

<VStack gap={4}>
	<TopNav label="Plain heading example" heading={plainHeading} />
	<TopNav label="Linked heading example" heading={linkedHeading} />
</VStack>
