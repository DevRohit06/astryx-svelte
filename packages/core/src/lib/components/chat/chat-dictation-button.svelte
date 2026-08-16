<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { UseSpeechRecognitionReturn } from './use-speech-recognition.svelte.js';

	export interface ChatDictationButtonProps extends BaseProps<HTMLSpanElement> {
		/** The return value from `useChatDictation` or `useSpeechRecognition`. */
		dictation: UseSpeechRecognitionReturn;
		/** Button size. @default "md" */
		size?: 'sm' | 'md';
		/** Hide the button when SpeechRecognition is not supported. @default true */
		isHiddenWhenUnsupported?: boolean;
		/** Accessible label override. */
		label?: string;
	}

	const BAR_COUNT = 5;
	const BAR_MIN_SCALE = 0.08;

	const SIZE_CONFIG = {
		sm: { barWidth: 2, barGap: 1.5, barMaxHeight: 14 },
		md: { barWidth: 2.5, barGap: 2, barMaxHeight: 18 }
	};
</script>

<script lang="ts">
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import {
		chatDictationBarAttrs,
		chatDictationBarColor,
		chatDictationBarsContainerAttrs,
		chatDictationButtonWrapperAttrs
	} from './chat-dictation-button.stylex.js';

	/**
	 * Microphone button for voice input in a chat composer. Takes the return
	 * value of `useChatDictation`.
	 *
	 * Idle it shows a microphone icon; while listening the icon is replaced by
	 * volume-reactive frequency bars that hue-shift once the volume clips.
	 *
	 * The accessible name falls back to a hardcoded English string, because
	 * upstream's does — this component reads no translator. `port/todo.md` records it.
	 *
	 * @example
	 * ```svelte
	 * <ChatDictationButton {dictation} />
	 * ```
	 */
	const {
		dictation,
		size = 'md',
		isHiddenWhenUnsupported = true,
		label,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatDictationButtonProps = $props();

	const t = useTranslator();
	const accessibleLabel = $derived(
		label ??
			(dictation.isListening
				? t('@astryx.chatDictationButton.stopDictation')
				: t('@astryx.chatDictationButton.startDictation'))
	);

	// Boost each band for visibility — quiet speech (0-10%) maps to full visual range
	const boostedBands = $derived(dictation.bands.map((b) => Math.min(Math.pow(b / 0.2, 0.5), 1)));

	// Hue shift from accent color when volume clips past 10%
	const isClipping = $derived(dictation.volume >= 0.2);
	const hueShift = $derived(isClipping ? Math.min((dictation.volume - 0.2) / 0.1, 1) * 60 : 0);

	const barColor = $derived(
		isClipping ? `hsl(calc(var(--accent-hue, 210) + ${hueShift}), 80%, 50%)` : chatDictationBarColor
	);

	const sizeConfig = $derived(SIZE_CONFIG[size]);

	// Constant — the target takes no visual props, so there is nothing to track.
	const theme = themeProps('chat-dictation-button');
	const wrapper = $derived(chatDictationButtonWrapperAttrs(xstyle));
	const barsContainer = $derived(chatDictationBarsContainerAttrs());
	const bar = $derived(chatDictationBarAttrs());

	// React turns a bare number in an inline style into `px` for both of these
	// properties; the port has to spell that out.
	const barsContainerStyle = $derived(
		`gap: ${sizeConfig.barGap}px; height: ${sizeConfig.barMaxHeight}px`
	);
</script>

{#snippet micIcon()}
	<Icon icon="microphone" {size} />
{/snippet}

{#if !isHiddenWhenUnsupported || dictation.isSupported}
	<span
		{...rest}
		{...theme}
		class={cx(theme.class, wrapper.class, className)}
		style={mergeStyle(wrapper.style, styleProp as string | undefined)}
	>
		{#if dictation.isListening}
			<span
				aria-hidden="true"
				class={barsContainer.class}
				style={mergeStyle(barsContainer.style, barsContainerStyle)}
			>
				{#each boostedBands.slice(0, BAR_COUNT) as level, i (i)}
					<span
						class={bar.class}
						style={mergeStyle(
							bar.style,
							`width: ${sizeConfig.barWidth}px; height: 100%; background-color: ${barColor}; transform: scaleY(${
								BAR_MIN_SCALE + level * (1 - BAR_MIN_SCALE)
							})`
						)}
					></span>
				{/each}
			</span>
		{/if}
		<Button
			label={accessibleLabel}
			aria-label={accessibleLabel}
			variant="ghost"
			{size}
			icon={dictation.isListening ? undefined : micIcon}
			isIconOnly
			onclick={dictation.toggle}
		/>
	</span>
{/if}
