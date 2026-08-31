<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { AvatarShape, AvatarSize } from '../avatar/avatar.stylex.js';

	export interface AvatarGroupProps extends BaseProps<HTMLDivElement> {
		children: Snippet;
		/** Applied to every avatar inside, overriding their own `size`. @default 'md' */
		size?: AvatarSize;
		/**
		 * Applied to every avatar inside, overriding their own `shape`, so a group
		 * stays visually uniform. Also applied to the `AvatarGroupOverflow` "+N"
		 * indicator, so it matches the group.
		 * @default 'circle'
		 */
		shape?: AvatarShape;
	}
</script>

<script lang="ts">
	import { setAvatarGroupContext } from '../avatar/avatar-context.svelte.js';
	import { resolveSize } from '../avatar/avatar.stylex.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import { avatarGroupAttrs, resolveOverlap } from './avatar-group.stylex.js';

	/**
	 * Overlapping avatars, with an optional `AvatarGroupOverflow` for the "+N".
	 *
	 * The API is compositional: children are Avatars, and the group hands them
	 * their size and overlap through context rather than inspecting them. Slicing
	 * to the visible count is the caller's job.
	 */
	const {
		children,
		size = 'md',
		shape = 'circle',
		'aria-label': ariaLabelProp,
		'aria-describedby': ariaDescribedByProp,
		onkeydown: onkeydownProp,
		onfocusin: onfocusinProp,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: AvatarGroupProps = $props();

	const numericSize = $derived(resolveSize(size));
	const overlap = $derived(resolveOverlap(numericSize));

	setAvatarGroupContext(() => ({ size, shape, overlap, numericSize }));

	const attrs = $derived(avatarGroupAttrs(xstyle));
	const theme = $derived(themeProps('avatar-group', { size, shape }));

	const t = useTranslator();
	const ariaLabel = $derived(ariaLabelProp ?? t('@astryx.avatarGroup.label'));

	// The keyboard hint and the roving tab stop only make sense once the group has
	// interactive children. Detect their presence from the rendered DOM. (Arrow-key
	// direction is auto-detected inside `useListFocus`.)
	let root = $state<HTMLDivElement | null>(null);
	let hasInteractiveItems = $state(false);

	// Upstream's is a **dependency-less** `useIsomorphicLayoutEffect` — the "after
	// every commit" form, so a child that arrives later is measured too. An
	// `$effect` here reads only `root`, which `bind:this` assigns once, so it would
	// run exactly once and a facepile filled by a fetch would never gain its hint.
	// A `MutationObserver` is the counterpart to that form, and it is the same
	// idiom `useListFocus` already uses to repair its tab stop for exactly this
	// reason.
	//
	// It cannot loop: the value is not read by the observer's callback, and the
	// only DOM `hasInteractiveItems` controls is a sibling `<VisuallyHidden>` whose
	// own mutation re-runs the read to the same value.
	$effect(() => {
		const el = root;
		if (!el) {
			return;
		}
		const measure = (): void => {
			hasInteractiveItems = el.querySelector('[data-avatar-item]') != null;
		};
		measure();
		const observer = new MutationObserver(measure);
		observer.observe(el, { childList: true, subtree: true, attributes: true });
		return () => observer.disconnect();
	});

	// Single tab stop + roving arrow focus over the group's interactive items.
	// `itemSelector` targets the shared `[data-avatar-item]` marker stamped on
	// interactive avatars (their rendered `<a>`/`<button>`) and on the overflow
	// button — **not** a tag or role selector — so roving never catches a nested
	// button inside a custom status or badge slot.
	const list = useListFocus(() => ({
		itemSelector: '[data-avatar-item]',
		orientation: 'horizontal' as const,
		hasRovingTabIndex: true
	}));

	const hintId = $props.id();
	const describedBy = $derived(
		[ariaDescribedByProp, hasInteractiveItems ? hintId : null].filter(Boolean).join(' ') ||
			undefined
	);

	// Upstream's `composeEventHandlers`: the consumer's handler runs first, and
	// the hook's is skipped if it called `preventDefault`. It wraps *both*
	// handlers, so both are composed here — `onfocusin` rather than `onfocus`
	// because React delivers its synthetic `onFocus` on the bubbling `focusin`,
	// which is what a container-level handler needs.
	function handleKeyDown(event: KeyboardEvent): void {
		onkeydownProp?.(event as KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement });
		if (!event.defaultPrevented) {
			list.handleKeyDown(event);
		}
	}

	function handleFocusIn(event: FocusEvent): void {
		onfocusinProp?.(event as FocusEvent & { currentTarget: EventTarget & HTMLDivElement });
		if (!event.defaultPrevented) {
			list.handleFocus(event);
		}
	}
</script>

<div
	{...rest}
	bind:this={root}
	{@attach list.attachList}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
	role="group"
	aria-label={ariaLabel}
	aria-describedby={describedBy}
	onkeydown={handleKeyDown}
	onfocusin={handleFocusIn}
>
	{@render children()}
	{#if hasInteractiveItems}
		<VisuallyHidden id={hintId}>{t('@astryx.avatarGroup.keyboardHint')}</VisuallyHidden>
	{/if}
</div>
