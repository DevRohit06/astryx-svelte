<script lang="ts" module>
	import type { UseKeyboardHintReturn } from './use-keyboard-hint.svelte.js';

	/**
	 * As with `LayerProps` and `TooltipLayerProps`, upstream has no counterpart
	 * name: `hintElement` is a value on the hook's return, not a component, so
	 * there is nothing there for a props type to describe.
	 */
	export interface KeyboardHintLayerProps {
		/** The value returned by `useKeyboardHint`. */
		hint: UseKeyboardHintReturn;
	}
</script>

<script lang="ts">
	import Kbd from '../components/kbd/kbd.svelte';
	import Layer from '../components/layer/layer.svelte';
	import { useTranslator } from '../i18n/use-translator.svelte.js';
	import {
		KEYBOARD_HINT_OFFSET_STYLE,
		keyboardHintKeysAttrs,
		keyboardHintLabelAttrs,
		keyboardHintXstyle
	} from './keyboard-hint.stylex.js';
	import { ARROW_HINT_KEYS } from './use-keyboard-hint.svelte.js';

	/**
	 * The rendering half of `useKeyboardHint`, replacing upstream's
	 * `hintElement`.
	 *
	 * The same split `layer.render` → `<Layer>` and `renderTooltip` →
	 * `<TooltipLayer>` took, and the simplest instance of it: `orientation` is
	 * the only dynamic input to the markup, so there are no render-time
	 * overrides to expose. `placement`, `alignment`, the surface `xstyle` and the
	 * offset are literals in upstream's `layer.render` call and are literals
	 * here.
	 *
	 * Render it unconditionally, as upstream's doc says — it manages its own
	 * visibility through the popover attribute, and there is no `{#if}` to add.
	 *
	 * `aria-hidden` sits on the inner span rather than the popover container,
	 * which is upstream's placement. It is what makes the hint purely visual:
	 * the arrow affordance is already conveyed to assistive tech by the
	 * composite's own roving-tabindex semantics, so announcing it again would be
	 * duplication rather than help.
	 *
	 * Upstream calls `useTranslator()` inside the hook, because the hook is what
	 * builds `hintElement`. Here the markup lives in this component, so the
	 * translator is read here — same provider tree, same key.
	 */
	const { hint }: KeyboardHintLayerProps = $props();

	const t = useTranslator();

	const keys = keyboardHintKeysAttrs();
	const label = keyboardHintLabelAttrs();
</script>

<Layer
	layer={hint.layer}
	placement="below"
	alignment="start"
	xstyle={keyboardHintXstyle}
	style={KEYBOARD_HINT_OFFSET_STYLE}
>
	<span aria-hidden="true">
		<span class={keys.class} style={keys.style}>
			{#each ARROW_HINT_KEYS[hint.orientation] as key (key)}
				<Kbd keys={key} />
			{/each}
		</span>
		<span class={label.class} style={label.style}>{t('@astryx.keyboardHint.toNavigate')}</span>
	</span>
</Layer>
