<!--
	Ported from upstream's `templates/blocks/components/ChatDictationButton/ChatDictationButtonBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Two translations, both the ones `useChatDictation` documents: `handleRef` +
	`useRef` become `bind:this` on the component (the handle is an instance
	export), and `inputRef` is a **getter** rather than a `RefObject`.
-->
<script lang="ts">
	import type { ChatComposerInputHandle } from '@astryx-svelte/core';
	import {
		ChatComposer,
		ChatComposerInput,
		ChatDictationButton,
		Stack,
		useChatDictation
	} from '@astryx-svelte/core';

	let input = $state<ChatComposerInputHandle | null>(null);

	const dictation = useChatDictation(() => ({
		inputRef: () => input,
		onResult: (text) => {
			console.log('Dictation result:', text);
		}
	}));
</script>

{#snippet composerInput()}
	<ChatComposerInput bind:this={input} />
{/snippet}

{#snippet sendActions()}
	<ChatDictationButton {dictation} />
{/snippet}

<Stack direction="vertical" width="100%" style="max-width: 450px">
	<ChatComposer
		onSubmit={(value) => console.log('Submit:', value)}
		input={composerInput}
		{sendActions}
	/>
</Stack>
