<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';

	export interface KbdProps extends BaseProps<HTMLSpanElement> {
		/**
		 * The shortcut, with `+` between keys. Recognised names: `mod`, `ctrl`,
		 * `alt`, `shift`, `enter`, `backspace`, `escape`, `tab`, the four arrows,
		 * and `plus` for a literal `+`. Anything else is uppercased as-is.
		 *
		 * @example 'mod+k', 'mod+shift+p', 'shift+plus'
		 */
		keys: string;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { detectMac, getKeyDisplay, getKeyLabel, parseKeys } from './kbd-keys.js';
	import { kbdKeyAttrs, kbdWrapperAttrs } from './kbd.stylex.js';

	/**
	 * A keyboard shortcut, rendered as one styled `<kbd>` per key.
	 *
	 * Platform-aware: `mod` shows ⌘ on macOS and Ctrl elsewhere.
	 */
	const { keys, xstyle, class: className, style: styleProp, ...rest }: KbdProps = $props();

	// Starts false so the server and the first client pass agree; the real
	// platform lands in an effect, after hydration. Upstream reaches for
	// useSyncExternalStore with a `false` server snapshot for the same reason.
	//
	// A $derived would resolve during hydration and quietly repaint the server's
	// markup; the deferral is the whole point, so the rule does not apply here.
	// eslint-disable-next-line svelte/prefer-writable-derived
	let isMac = $state(false);
	$effect(() => {
		isMac = detectMac();
	});

	const parts = $derived(parseKeys(keys));
	// The glyphs are announced as noise, so the wrapper carries the spoken form
	// and every key is hidden from the accessibility tree.
	const accessibleName = $derived(parts.map((key) => getKeyLabel(key, isMac)).join(' + '));

	const wrapper = $derived(kbdWrapperAttrs(xstyle));
	const key = kbdKeyAttrs();
	const theme = themeProps('kbd');
</script>

<span
	{...rest}
	{...theme}
	class={cx(theme.class, wrapper.class, className)}
	style={mergeStyle(wrapper.style, styleProp as string | undefined)}
	role="img"
	aria-label={accessibleName}
>
	<!-- Keyed by index, not by name: a repeated key ("a+a") is legal input, and
	     keying by the name would make Svelte throw on the duplicate. -->
	{#each parts as part, index (index)}
		<kbd class={key.class} style={key.style} aria-hidden="true">
			{getKeyDisplay(part, isMac)}
		</kbd>
	{/each}
</span>
