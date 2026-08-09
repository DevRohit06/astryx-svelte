<!--
	Ported from upstream's `templates/blocks/components/ChatDictationButton/ChatDictationButtonShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Two translations, both the ones `useChatDictation` documents: `handleRef` +
	`useRef` become `bind:this` on the component (the handle is an instance
	export), and `inputRef` is a **getter** rather than a `RefObject`. Upstream's
	inline `style` objects become style strings, with React's implicit `px` on
	bare numbers written out.
-->
<script lang="ts">
	import type { ChatComposerInputHandle } from '@astryx-svelte/core';
	import {
		ChatComposer,
		ChatComposerInput,
		ChatDictationButton,
		HStack,
		Text,
		VStack,
		useChatDictation
	} from '@astryx-svelte/core';

	let input = $state<ChatComposerInputHandle | null>(null);

	const dictation = useChatDictation(() => ({
		inputRef: () => input,
		hasSounds: true,
		onResult: (text) => {
			console.log('Dictation result:', text);
		}
	}));

	const meterWidth = $derived(Math.min(dictation.volume * 200, 100));
</script>

{#snippet composerInput()}
	<ChatComposerInput bind:this={input} />
{/snippet}

{#snippet sendActions()}
	<ChatDictationButton {dictation} />
{/snippet}

<VStack gap={4}>
	<Text type="supporting" color="secondary">
		Click the microphone to start dictating. Speech is transcribed into the input.
	</Text>
	<ChatComposer onSubmit={(v) => console.log('Submit:', v)} input={composerInput} {sendActions} />
	{#if dictation.isListening}
		<HStack gap={2} vAlign="center">
			<Text type="supporting" color="secondary">
				{dictation.isSpeaking ? 'Speaking detected' : 'Listening...'}
			</Text>
			<div
				style="width: 80px; height: 6px; background-color: var(--color-surface-secondary); border-radius: 3px; overflow: hidden"
			>
				<div
					style="height: 100%; background-color: {dictation.isSpeaking
						? 'var(--color-accent)'
						: 'var(--color-text-secondary)'}; border-radius: 3px; transition: width 0.08s ease-out; width: {meterWidth}%"
				></div>
			</div>
		</HStack>
	{/if}
	{#if !dictation.isSupported}
		<Text type="supporting" color="accent">
			SpeechRecognition is not supported in this browser.
		</Text>
	{/if}
</VStack>
