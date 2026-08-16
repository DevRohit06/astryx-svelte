<!--
	Ported from upstream's `templates/blocks/components/AppShell/AppShellTopNavOnly.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here rather than inlining the SVG, so the logo is a
	registry substitution: `CubeIcon` → `stop`. A stand-in rather than a true
	match, the same one the demo routes make. Retires with the icon registry
	(port/todo.md).
-->
<script lang="ts">
	import {
		AppShell,
		Heading,
		Icon,
		NavIcon,
		Text,
		TopNav,
		TopNavHeading,
		TopNavItem,
		VStack
	} from '@astryx-svelte/core';
</script>

{#snippet cubeIcon()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet logo()}<NavIcon icon={cubeIcon} />{/snippet}

{#snippet heading()}
	<TopNavHeading heading="App Shell" {logo} />
{/snippet}

{#snippet startContent()}
	<TopNavItem label="Home" href="#" isSelected />
	<TopNavItem label="Products" href="#" />
	<TopNavItem label="Docs" href="#" />
{/snippet}

{#snippet topNav()}
	<TopNav label="Main navigation" {heading} {startContent} />
{/snippet}

<!--
	`AppShell` fills the viewport (`height: 100dvh`), and upstream's own blocks
	cut that down with `height: 100%` — which only resolves against an ancestor
	that has a definite height. Upstream's docsite gives every block an
	`aspectRatio: 4 / 3` frame; this one's preview container is shrink-to-fit on
	both axes, so the block supplies the frame itself. Same precedent as
	`AspectRatio/AspectRatioImageGallery.svelte`.
-->
<div style="width: 640px; height: 480px">
	<AppShell contentPadding={6} style="height: 100%; min-height: 0" {topNav}>
		<VStack gap={4}>
			<Heading level={3}>Page Content</Heading>
			<Text type="body">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
				labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
				laboris.
			</Text>
		</VStack>
	</AppShell>
</div>
