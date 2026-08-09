<!--
	Ported from upstream's `templates/blocks/components/Avatar/AvatarTooltip.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The first group passes no `tooltip` at all — that is the point of the block:
	`tooltip` defaults on, so every *named* avatar gets one for free. Only the
	second group opts into custom text.
-->
<script lang="ts">
	import { Avatar, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={5}>
	<Stack direction="vertical" gap={2}>
		<Text type="supporting" color="secondary">Hover or focus to reveal each name</Text>
		<Stack direction="horizontal" gap={4} vAlign="center">
			<Avatar
				src="https://lookaside.facebook.com/assets/astryx/DATA-Ana-Thomas.png"
				name="Ana Thomas"
				size="xl"
			/>
			<Avatar
				src="https://lookaside.facebook.com/assets/astryx/DATA-Drew-Young.png"
				name="Drew Young"
				size="xl"
			/>
			<Avatar
				src="https://lookaside.facebook.com/assets/astryx/DATA-Jihoo-Song.png"
				name="Jihoo Song"
				size="xl"
			/>
		</Stack>
	</Stack>
	<Stack direction="vertical" gap={2}>
		<Text type="supporting" color="secondary">Custom tooltip text</Text>
		<Avatar
			src="https://lookaside.facebook.com/assets/astryx/DATA-Itai-Jordaan.png"
			name="Itai Jordaan"
			size="xl"
			tooltip="Itai Jordaan · Engineering Lead"
		/>
	</Stack>
</Stack>
