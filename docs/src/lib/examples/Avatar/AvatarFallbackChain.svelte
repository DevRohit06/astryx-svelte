<!--
	Ported from upstream's `templates/blocks/components/Avatar/AvatarFallbackChain.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, HStack, Text, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={4}>
	<HStack gap={3} vAlign="center">
		<Avatar
			src="https://lookaside.facebook.com/assets/astryx/DATA-Daniela-Gimenez.png"
			name="Daniela Gimenez"
			size="lg"
		/>
		<Text type="supporting">Valid src</Text>
	</HStack>
	<HStack gap={3} vAlign="center">
		<Avatar
			src="https://lookaside.facebook.com/assets/astryx/does-not-exist-primary.jpg"
			fallbackSrc="https://lookaside.facebook.com/assets/astryx/DATA-Ami-Pena.png"
			name="Invalid User"
			size="lg"
		/>
		<Text type="supporting">Invalid src, valid fallbackSrc</Text>
	</HStack>
	<HStack gap={3} vAlign="center">
		<Avatar
			src="https://lookaside.facebook.com/assets/astryx/does-not-exist-primary.jpg"
			fallbackSrc="https://lookaside.facebook.com/assets/astryx/does-not-exist-fallback.jpg"
			name="Test User"
			size="lg"
		/>
		<Text type="supporting">Both invalid, has name</Text>
	</HStack>
	<HStack gap={3} vAlign="center">
		<Avatar
			src="https://lookaside.facebook.com/assets/astryx/does-not-exist-primary.jpg"
			size="lg"
		/>
		<Text type="supporting">All invalid, no name</Text>
	</HStack>
</VStack>
