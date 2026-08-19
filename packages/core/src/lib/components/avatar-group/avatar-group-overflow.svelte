<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface AvatarGroupOverflowProps extends Omit<BaseProps<HTMLElement>, 'onclick'> {
		/** How many avatars are not shown. */
		count: number;
		/**
		 * Fired when the indicator is clicked. Providing it is what makes this a
		 * focusable `<button>`. Narrowed from the DOM handler signature, as
		 * upstream narrows `onClick` — the event carries nothing a caller needs.
		 */
		onclick?: () => void;
		/** Replaces the default `+N`. */
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { useAvatarGroup } from '../avatar/avatar-context.svelte.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { avatarGroupOverflowAttrs } from './avatar-group-overflow.stylex.js';

	/**
	 * The "+N" that closes an `AvatarGroup`.
	 *
	 * Given an `onclick` it renders as a `<button>` and picks up the pointer,
	 * hover and focus-ring states; otherwise it is an inert `<span>`, so the
	 * group never grows a tab stop that does nothing.
	 */
	const {
		count,
		children,
		onclick,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: AvatarGroupOverflowProps = $props();

	const t = useTranslator();

	// Outside a group there is nothing to overlap, and 36px — the `small`
	// avatar — is the size to match.
	const group = useAvatarGroup();
	const numericSize = $derived(group?.().numericSize ?? 36);
	const overlap = $derived(group?.().overlap ?? 0);

	const attrs = $derived(
		avatarGroupOverflowAttrs({ numericSize, overlap, isInteractive: onclick != null }, xstyle)
	);
	// The `{count, number}` argument means `en` renders a grouping separator
	// ("4,912 more"), which the raw template literal never did.
	const label = $derived(t('@astryx.avatarGroup.overflow', { count }));
	// `size` is a documented theming axis on this target (`AvatarGroup.doc.mjs`
	// declares `visualProps: ['size']`), so it has to reach `themeProps` — and it
	// arrives through the group context, which makes it `$derived` rather than a
	// mount-time `const`.
	const size = $derived(group?.().size ?? 'md');
	const theme = $derived(themeProps('avatar-group-overflow', { size }));
</script>

{#snippet content()}
	{#if children}{@render children()}{:else}+{count}{/if}
{/snippet}

{#if onclick}
	<!--
		`data-avatar-item` is the marker `AvatarGroup`'s roving focus finds its
		members by, so an interactive overflow is the last stop in the arrow cycle.
		Only the `<button>` branch carries it — an inert `<span>` overflow is not a
		focus target and must not join the cycle.
	-->
	<button
		type="button"
		{onclick}
		{...rest}
		data-avatar-item=""
		{...theme}
		class={cx(theme.class, attrs.class, className)}
		style={mergeStyle(attrs.style, styleProp as string | undefined)}
		aria-label={label}
	>
		{@render content()}
	</button>
{:else}
	<span
		{...rest}
		{...theme}
		class={cx(theme.class, attrs.class, className)}
		style={mergeStyle(attrs.style, styleProp as string | undefined)}
		aria-label={label}
	>
		{@render content()}
	</span>
{/if}
