<!--
	Ported from upstream's `templates/blocks/components/BottomSheet/BottomSheetSwitcherShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream's file declares four components — one per step, plus a
	`MultiStepSwitcherExample` wrapper the default export renders with
	`height="hug"`. Svelte has one component per file, so the three steps are
	inlined here and the state each of them held (`frequency`, and the three
	channel checkboxes) sits at the top instead. Nothing about lifetime changes:
	the switcher keeps all three sheets mounted, so upstream's per-step state
	survives a handoff exactly as this does.
-->
<script lang="ts">
	import {
		BottomSheet,
		BottomSheetSwitcher,
		Button,
		CheckboxInput,
		Divider,
		Heading,
		HStack,
		RadioList,
		RadioListItem,
		Section,
		Text,
		VStack,
		type BottomSheetHeight
	} from '@astryx-svelte/core';

	const height: BottomSheetHeight = 'hug';

	let activeSheet = $state<string | null>(null);
	let frequency = $state('daily');
	let email = $state<boolean | 'indeterminate'>(true);
	let pushNotifications = $state<boolean | 'indeterminate'>(true);
	let textMessages = $state<boolean | 'indeterminate'>(false);
</script>

<Button label="Set up notifications" onclick={() => (activeSheet = 'overview')} />
<BottomSheetSwitcher {activeSheet} onActiveSheetChange={(next) => (activeSheet = next)}>
	<BottomSheet sheetId="overview" label="Set up notifications" {height}>
		<Section padding={4}>
			<VStack gap={4}>
				<VStack gap={1}>
					<Heading level={3}>Set up notifications</Heading>
					<Text type="supporting" color="secondary">Step 1 of 3</Text>
				</VStack>
				<Divider />
				<Text type="supporting" color="secondary">
					Stay informed about activity that matters without checking back throughout the day.
				</Text>
				<VStack gap={3}>
					<VStack gap={1}>
						<Text type="label">Important activity</Text>
						<Text type="supporting" color="secondary">
							Know when someone mentions you or needs your attention.
						</Text>
					</VStack>
					<VStack gap={1}>
						<Text type="label">Timely reminders</Text>
						<Text type="supporting" color="secondary">
							Get a reminder before work reaches its due date.
						</Text>
					</VStack>
					<VStack gap={1}>
						<Text type="label">Useful summaries</Text>
						<Text type="supporting" color="secondary">
							Catch up on anything you may have missed.
						</Text>
					</VStack>
				</VStack>
				<HStack gap={2} hAlign="end">
					<Button label="Cancel" variant="secondary" onclick={() => (activeSheet = null)} />
					<Button label="Continue" onclick={() => (activeSheet = 'frequency')} />
				</HStack>
			</VStack>
		</Section>
	</BottomSheet>

	<BottomSheet sheetId="frequency" label="Notification frequency" {height}>
		<Section padding={4}>
			<VStack gap={4}>
				<VStack gap={1}>
					<Heading level={3}>How often?</Heading>
					<Text type="supporting" color="secondary">Step 2 of 3</Text>
				</VStack>
				<Divider />
				<RadioList
					label="Notification frequency"
					isLabelHidden
					value={frequency}
					onChange={(next) => (frequency = next)}
				>
					<RadioListItem label="Immediately" value="immediately" />
					<RadioListItem label="Daily" value="daily" />
					<RadioListItem label="Weekly" value="weekly" />
				</RadioList>
				<HStack gap={2} hAlign="end">
					<Button label="Back" variant="secondary" onclick={() => (activeSheet = 'overview')} />
					<Button label="Continue" onclick={() => (activeSheet = 'channels')} />
				</HStack>
			</VStack>
		</Section>
	</BottomSheet>

	<BottomSheet sheetId="channels" label="Notification channels" {height}>
		<Section padding={4}>
			<VStack gap={4}>
				<VStack gap={1}>
					<Heading level={3}>Where should we notify you?</Heading>
					<Text type="supporting" color="secondary">Step 3 of 3</Text>
				</VStack>
				<Divider />
				<Text type="supporting" color="secondary">
					Choose any combination. You can change these preferences later.
				</Text>
				<VStack gap={2}>
					<CheckboxInput label="Email" value={email} onChange={(next) => (email = next)} />
					<CheckboxInput
						label="Push notifications"
						value={pushNotifications}
						onChange={(next) => (pushNotifications = next)}
					/>
					<CheckboxInput
						label="Text messages"
						value={textMessages}
						onChange={(next) => (textMessages = next)}
					/>
				</VStack>
				<HStack gap={2} hAlign="end">
					<Button label="Back" variant="secondary" onclick={() => (activeSheet = 'frequency')} />
					<Button label="Finish" onclick={() => (activeSheet = null)} />
				</HStack>
			</VStack>
		</Section>
	</BottomSheet>
</BottomSheetSwitcher>
