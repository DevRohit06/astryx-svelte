<!--
	Ported from upstream's `templates/blocks/components/Kbd/KbdInlineInstructions.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Kbd, Text, VStack } from '@astryx-svelte/core';
</script>

<VStack gap={3}>
	<Text type="body">Press <Kbd keys="mod+k" /> to open the command palette.</Text>
	<Text type="body">Use <Kbd keys="mod+shift+p" /> to access all commands.</Text>
	<Text type="body">Press <Kbd keys="escape" /> to close the dialog.</Text>
	<Text type="body">
		Navigate with <Kbd keys="up" /> and <Kbd keys="down" /> arrow keys, then press
		<Kbd keys="enter" /> to select.
	</Text>
</VStack>
