<!--
	Ported from upstream's `templates/blocks/components/VisuallyHidden/VisuallyHiddenShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Card,
		HStack,
		Icon,
		IconButton,
		Text,
		VisuallyHidden,
		VStack
	} from '@astryx-svelte/core';
	import type { IconName } from '@astryx-svelte/core';

	/**
	 * VisuallyHidden is invisible by design, so this hero teaches the concept by
	 * contrast: the icon-only buttons are all a sighted user sees, while the
	 * caption spells out the accessible name each one exposes. A live
	 * `VisuallyHidden` region below announces the same names to assistive tech,
	 * so the demo genuinely exercises the component it documents.
	 *
	 * Upstream passes Heroicons' `ArrowDownTray`/`Share`/`Trash` and
	 * `SpeakerWave`; the registry ships neither, so this uses built-ins — the same
	 * substitution the demo routes already make, and it retires with the icon
	 * registry (port/todo.md).
	 */
	const actions: { label: string; icon: IconName }[] = [
		{ label: 'Download', icon: 'arrowDown' },
		{ label: 'Share', icon: 'externalLink' },
		{ label: 'Delete', icon: 'close' }
	];
</script>

<VStack gap={5} hAlign="center">
	<HStack gap={6} vAlign="stretch" wrap="wrap" hAlign="center">
		<Card variant="muted">
			<VStack gap={4} hAlign="center">
				<Text type="supporting" color="secondary">What you see</Text>
				<HStack gap={2}>
					{#each actions as action (action.label)}
						<IconButton label={action.label} variant="ghost">
							{#snippet icon()}<Icon icon={action.icon} />{/snippet}
						</IconButton>
					{/each}
				</HStack>
			</VStack>
		</Card>

		<Card variant="muted">
			<VStack gap={4} hAlign="start">
				<HStack gap={2} vAlign="center">
					<Icon icon="microphone" size="sm" />
					<Text type="supporting" color="secondary">What a screen reader hears</Text>
				</HStack>
				<VStack gap={2}>
					{#each actions as action (action.label)}
						<Text type="body">{action.label}, button</Text>
					{/each}
				</VStack>
			</VStack>
		</Card>
	</HStack>

	<!-- A real live region: silent to sighted users, announced by AT. -->
	<VisuallyHidden as="div" aria-live="polite">
		Actions available: Download, Share, Delete.
	</VisuallyHidden>
</VStack>
