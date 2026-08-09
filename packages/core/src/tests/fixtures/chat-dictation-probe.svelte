<script lang="ts">
	import type {
		UseChatDictationOptions,
		UseChatDictationReturn
	} from '$lib/components/chat/use-chat-dictation.svelte.js';
	import type {
		UseSpeechRecognitionOptions,
		UseSpeechRecognitionReturn
	} from '$lib/components/chat/use-speech-recognition.svelte.js';
	import { useChatDictation } from '$lib/components/chat/use-chat-dictation.svelte.js';
	import { useSpeechRecognition } from '$lib/components/chat/use-speech-recognition.svelte.js';

	/**
	 * Probe for `useSpeechRecognition` and `useChatDictation` — the `renderHook`
	 * substitute for the two dictation hooks.
	 *
	 * One fixture serves both because upstream's suite exercises them through the
	 * same surface: start/stop/toggle/abort plus the callbacks. `which` picks the
	 * hook, and only that one is called, so the unused hook never registers an
	 * effect. Options arrive as a plain object and are handed over as a getter,
	 * which is how both hooks take them.
	 */
	interface Props {
		which: 'speech' | 'dictation';
		options?: UseSpeechRecognitionOptions & UseChatDictationOptions;
	}

	const { which, options = {} }: Props = $props();

	export const api: UseSpeechRecognitionReturn | UseChatDictationReturn =
		which === 'speech'
			? useSpeechRecognition(() => options as UseSpeechRecognitionOptions)
			: useChatDictation(() => options as UseChatDictationOptions);
</script>
