<!--
	Ported from upstream's `templates/blocks/components/BottomSheet/BottomSheetSnapPoints.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		BottomSheet,
		Button,
		Divider,
		Heading,
		HStack,
		Icon,
		Item,
		Text,
		VStack,
		type BottomSheetSnapPoint,
		type IconName
	} from '@astryx-svelte/core';

	/**
	 * Upstream's steps carry Heroicons — `MapPin`, `ArrowRight`, `ArrowUp`,
	 * `ArrowLeft`, `ArrowUturnLeft` and `Flag`. The built-in registry has no pin,
	 * u-turn or flag glyph, so each maps to the nearest built-in and the arrows
	 * become chevrons. Retires with the icon registry (port/todo.md).
	 */

	// Half the viewport is a working surface — the sheet lays its content out at
	// that height and keeps a full scrim. The 96px stop is a peek: a sliver, so the
	// sheet slides away rather than reflowing into it, and the scrim thins.
	const SNAP_POINTS: ReadonlyArray<BottomSheetSnapPoint> = ['96px', '50%'];

	const steps: ReadonlyArray<{
		icon: IconName;
		label: string;
		detail: string;
		distance: string;
	}> = [
		{
			icon: 'info',
			label: 'Head northeast on Mission St',
			detail: 'Toward 3rd St',
			distance: '350 ft'
		},
		{
			icon: 'chevronRight',
			label: 'Turn right onto 3rd St',
			detail: 'Pass Yerba Buena Gardens on your left',
			distance: '0.2 mi'
		},
		{
			icon: 'arrowUp',
			label: 'Continue onto Kearny St',
			detail: 'Stay in the right lane',
			distance: '0.4 mi'
		},
		{
			icon: 'chevronLeft',
			label: 'Turn left onto Market St',
			detail: 'Cable car crossing ahead',
			distance: '0.6 mi'
		},
		{
			icon: 'chevronRight',
			label: 'Bear right onto Sutter St',
			detail: 'Toward the Financial District',
			distance: '0.3 mi'
		},
		{
			icon: 'arrowUp',
			label: 'Continue on Sansome St',
			detail: 'Four blocks, past Pine St',
			distance: '0.5 mi'
		},
		{
			icon: 'chevronsLeft',
			label: 'Make a U-turn at Washington St',
			detail: 'Construction detour until March',
			distance: '150 ft'
		},
		{
			icon: 'chevronRight',
			label: 'Turn right onto Battery St',
			detail: 'Follow signs for the Embarcadero',
			distance: '0.4 mi'
		},
		{
			icon: 'chevronLeft',
			label: 'Turn left onto Sacramento St',
			detail: 'Toward the waterfront',
			distance: '0.2 mi'
		},
		{
			icon: 'chevronRight',
			label: 'Turn right onto The Embarcadero',
			detail: 'Bay Bridge on your right',
			distance: '0.5 mi'
		},
		{
			icon: 'arrowUp',
			label: 'Continue past Pier 14',
			detail: 'Ferry terminal signage begins here',
			distance: '0.3 mi'
		},
		{
			icon: 'success',
			label: 'Arrive at the Ferry Building',
			detail: 'Parking garage entrance on Washington St',
			distance: '—'
		}
	];

	let isOpen = $state(false);
</script>

<VStack gap={3} align="start">
	<Text type="body">
		This sheet has two extra stops: half the viewport, and a 96px peek. Drag the handle down to
		collapse it, then back up — it rests at each stop instead of following your finger.
	</Text>
	<Button label="Show directions" onclick={() => (isOpen = true)} />
</VStack>
<BottomSheet
	{isOpen}
	onOpenChange={(next) => (isOpen = next)}
	label="Directions to the Ferry Building"
	height="tall"
	snapPoints={SNAP_POINTS}
>
	<VStack gap={4} padding={4}>
		<VStack gap={1}>
			<Heading level={3}>Ferry Building</Heading>
			<HStack gap={2}>
				<Text type="label">18 min</Text>
				<Text type="supporting">3.7 mi · arrive 9:41 AM</Text>
			</HStack>
		</VStack>
		<Divider />
		<VStack gap={0}>
			{#each steps as step (step.label)}
				<Item label={step.label} description={step.detail}>
					{#snippet startContent()}<Icon icon={step.icon} size="sm" />{/snippet}
					{#snippet endContent()}<Text type="supporting">{step.distance}</Text>{/snippet}
				</Item>
			{/each}
		</VStack>
		<Divider />
		<Button label="Start" onclick={() => (isOpen = false)} variant="primary" />
	</VStack>
</BottomSheet>
