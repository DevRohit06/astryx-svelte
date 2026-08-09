<!--
	Ported from upstream's `templates/blocks/components/Popover/PopoverHookUsage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Button,
		Card,
		Center,
		PopoverLayer,
		Text,
		usePopover,
		VStack
	} from '@astryx-svelte/core';

	/**
	 * Upstream's `popover.render(node, {placement, alignment})` is the
	 * `<PopoverLayer>` component here, and its `triggerRef` is `attachTrigger` —
	 * the render-split and ref translations this port makes for every layer hook.
	 * `id` is required because `useLayer` cannot mint an SSR-stable one from
	 * inside a hook.
	 */
	const id = $props.id();

	const popover = usePopover(() => ({ id, dialogLabel: 'Quick actions' }));
</script>

<Center height={240}>
	<Button
		label="Open actions"
		onclick={popover.toggle}
		{...popover.triggerProps}
		{@attach popover.attachTrigger}
	/>
	<PopoverLayer {popover} placement="below" alignment="center">
		<Card width={220} padding={3} variant="transparent">
			<VStack gap={2}>
				<Text type="body" weight="bold">Quick actions</Text>
				<Button label="Create task" size="sm" />
				<Button label="Share report" variant="secondary" size="sm" />
			</VStack>
		</Card>
	</PopoverLayer>
</Center>
