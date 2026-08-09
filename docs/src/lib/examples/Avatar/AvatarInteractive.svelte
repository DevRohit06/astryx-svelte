<!--
	Ported from upstream's `templates/blocks/components/Avatar/AvatarInteractive.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`onClick` is `onclick` here, the port's spelling for a DOM-handler prop.
-->
<script lang="ts">
	import { Avatar, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="horizontal" gap={6} vAlign="start">
	<Stack direction="vertical" gap={2} hAlign="center">
		<Avatar
			src="https://lookaside.facebook.com/assets/astryx/DATA-Itai-Jordaan.png"
			name="Itai Jordaan"
			size="xl"
			href="https://example.com/people/itai-jordaan"
		/>
		<Text type="supporting" color="secondary">Link (href)</Text>
	</Stack>
	<Stack direction="vertical" gap={2} hAlign="center">
		<Avatar
			src="https://lookaside.facebook.com/assets/astryx/DATA-Margot-Schroder.png"
			name="Margot Schroder"
			size="xl"
			onclick={() => window.alert('Opening Margot Schroder’s profile')}
		/>
		<Text type="supporting" color="secondary">Button (onClick)</Text>
	</Stack>
</Stack>
