<!--
	Ported from upstream's `templates/blocks/components/Kbd/KbdModifierCombos.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Kbd, Text, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={3}>
	<HStack gap={4}>
		<Kbd keys="mod+k" />
		<Kbd keys="shift+enter" />
		<Kbd keys="ctrl+c" />
		<Kbd keys="alt+tab" />
	</HStack>
	<HStack gap={4}>
		<Kbd keys="mod+shift+z" />
		<Kbd keys="ctrl+alt+delete" />
		<Kbd keys="mod+shift+p" />
	</HStack>
	<HStack gap={4}>
		<Text type="body">Special keys:</Text>
		<Kbd keys="escape" />
		<Kbd keys="enter" />
		<Kbd keys="backspace" />
		<Kbd keys="tab" />
		<Kbd keys="space" />
	</HStack>
</VStack>
