<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { PillPlacement } from './resize-handle.stylex.js';
	import type { ResizableProps } from './use-resizable.svelte.js';

	export interface ResizeHandleProps extends Omit<BaseProps<HTMLDivElement>, 'style'> {
		/**
		 * Layout direction — determines cursor and indicator orientation.
		 * @default 'horizontal'
		 */
		direction?: 'horizontal' | 'vertical';
		/**
		 * `'inline'` puts the handle in normal flex flow between siblings.
		 * `'overlay'` positions it absolutely so it sits inside a parent panel's
		 * bounds — which is what a parent with `overflow: clip` requires.
		 * @default 'inline'
		 */
		position?: 'inline' | 'overlay';
		/**
		 * Reverse the drag direction. Use when the handle controls a panel on the
		 * end/right/bottom side.
		 * @default false
		 */
		isReversed?: boolean;
		/** @default false */
		isDisabled?: boolean;
		/**
		 * Show a 1px divider line. The line *is* the handle — it takes only 1px in
		 * the layout, with a wider invisible hit area for interaction. Ignored in
		 * overlay mode.
		 * @default false
		 */
		hasDivider?: boolean;
		/**
		 * Show the pill grip at rest. `false` reveals it only on hover or focus.
		 * @default true
		 */
		isAlwaysVisible?: boolean;
		/**
		 * Which side of the divider line the pill sits on.
		 * - `'auto'` — the panel's side, flipping when the panel collapses to 0px
		 * - `'start'` — left (horizontal) or top (vertical)
		 * - `'end'` — right (horizontal) or bottom (vertical)
		 * - `'center'` — centred on the divider line
		 * @default 'auto'
		 */
		pillPlacement?: PillPlacement;
		/**
		 * Accessible label for the separator.
		 * @default 'Resize handle'
		 */
		label?: string;
		/** Resize props from a `useResizable` region. */
		resizable?: ResizableProps;
		/** Custom handle content. Replaces the default pill. */
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/index.js';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		resizeHandleAttrs,
		resizeHandleHitAreaAttrs,
		resizeHandlePillAttrs,
		resolveEffectiveSide
	} from './resize-handle.stylex.js';

	/**
	 * The draggable separator between two resizable panels: a thin divider line
	 * with a wider invisible hit area and an optional pill grip.
	 *
	 * It carries the WAI-ARIA window-splitter contract — `role="separator"`,
	 * `aria-valuenow`/`min`/`max` bound to the region, and arrow/Home/End/Enter
	 * resizing. All of that is state arithmetic in `useResizable`; this component
	 * only ever reports a delta.
	 *
	 * While the panel is collapsed, `aria-valuenow` is clamped to `aria-valuemin`
	 * (a value below the minimum is invalid per WCAG 4.1.2) and a localized
	 * "Collapsed" `aria-valuetext` announces the real state.
	 *
	 * Two things upstream does with refs are attachments' work here, and one is
	 * not: `handleRef` exists only to read the computed direction for RTL, so it
	 * is a `bind:this`, and the drag teardown is a plain binding because it is
	 * replaced per drag rather than per element.
	 */
	const KEYBOARD_STEP = 10;
	const KEYBOARD_LARGE_STEP = 50;

	const {
		direction = 'horizontal',
		position: positionMode = 'inline',
		isReversed = false,
		isDisabled = false,
		hasDivider = false,
		isAlwaysVisible = true,
		pillPlacement = 'auto',
		label: labelFromProps,
		resizable,
		children,
		class: className,
		onkeydown,
		xstyle,
		...rest
	}: ResizeHandleProps = $props();

	const t = useTranslator();
	const label = $derived(labelFromProps ?? t('@astryx.resizable.handle.label'));

	let handleEl: HTMLDivElement | undefined = $state();
	// Removes the in-flight drag's window listeners (and resets body styles).
	// Held so unmount can tear down a drag that never got a pointerup.
	let dragCleanup: (() => void) | null = null;
	let isDragging = $state(false);
	let isHovered = $state(false);
	let isFocused = $state(false);

	const isHorizontal = $derived(direction === 'horizontal');
	const isOverlay = $derived(positionMode === 'overlay');
	const sign = $derived(isReversed ? -1 : 1);
	const effectiveSide = $derived(
		resolveEffectiveSide(pillPlacement, isReversed, resizable?._isCollapsed ?? false)
	);
	const isInteracting = $derived(isHovered || isFocused);

	function getRTLMultiplier(): number {
		if (!handleEl) {
			return 1;
		}
		return getComputedStyle(handleEl).direction === 'rtl' ? -1 : 1;
	}

	function handlePointerDown(event: PointerEvent): void {
		if (isDisabled || !resizable) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		isDragging = true;
		resizable._onResizeStart();
		const startPos = isHorizontal ? event.clientX : event.clientY;
		const rtl = isHorizontal ? getRTLMultiplier() : 1;
		document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
		document.body.style.userSelect = 'none';

		const onMove = (ev: PointerEvent) => {
			const currentPos = isHorizontal ? ev.clientX : ev.clientY;
			const delta = (currentPos - startPos) * rtl * sign;
			resizable._onResizeMove(delta);
		};
		const onUp = () => {
			cleanup();
			isDragging = false;
			resizable._onResizeEnd();
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
		};
		const onCancel = () => {
			cleanup();
			isDragging = false;
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
		};
		function cleanup() {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onCancel);
			dragCleanup = null;
		}
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onCancel);
		dragCleanup = cleanup;
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (isDisabled || !resizable) {
			return;
		}
		const step = event.shiftKey ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;
		const rtl = isHorizontal ? getRTLMultiplier() : 1;

		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowDown': {
				event.preventDefault();
				resizable._onResizeStart();
				resizable._onResizeMove(step * (isHorizontal ? rtl : 1) * sign);
				resizable._onResizeEnd();
				break;
			}
			case 'ArrowLeft':
			case 'ArrowUp': {
				event.preventDefault();
				resizable._onResizeStart();
				resizable._onResizeMove(-step * (isHorizontal ? rtl : 1) * sign);
				resizable._onResizeEnd();
				break;
			}
			case 'Home': {
				event.preventDefault();
				resizable._onResizeStart();
				resizable._onResizeMove(resizable._minSizePx - resizable._size);
				resizable._onResizeEnd();
				break;
			}
			case 'End': {
				event.preventDefault();
				if (resizable._maxSizePx !== Infinity) {
					resizable._onResizeStart();
					resizable._onResizeMove(resizable._maxSizePx - resizable._size);
					resizable._onResizeEnd();
				}
				break;
			}
			case 'Enter': {
				event.preventDefault();
				if (resizable._collapsible) {
					resizable._onResizeStart();
					resizable._onResizeMove(resizable._isCollapsed ? resizable._minSizePx : -resizable._size);
					resizable._onResizeEnd();
				}
				break;
			}
		}
	}

	function handleDoubleClick(): void {
		if (isDisabled || !resizable || !resizable._collapsible) {
			return;
		}
		resizable._onResizeStart();
		resizable._onResizeMove(resizable._isCollapsed ? resizable._minSizePx : -resizable._size);
		resizable._onResizeEnd();
	}

	// A drag in flight when the handle unmounts never gets its pointerup, so tear
	// down the window listeners here too — otherwise every pointermove keeps
	// driving the (still-mounted) region after the handle is gone, and the body
	// cursor/user-select overrides stick.
	$effect(() => {
		return () => {
			if (dragCleanup) {
				dragCleanup();
				document.body.style.cursor = '';
				document.body.style.userSelect = '';
			}
		};
	});

	// When collapsed the panel's real size (0) sits below aria-valuemin, which is
	// invalid per WCAG 4.1.2. Clamp aria-valuenow to the minimum and announce the
	// true state via aria-valuetext instead; the valuetext is removed as soon as
	// the panel expands so the numeric value reads again.
	const isCollapsed = $derived(resizable?._isCollapsed ?? false);
	const ariaValueNow = $derived(
		resizable
			? isCollapsed
				? Math.max(resizable._size, resizable._minSizePx)
				: resizable._size
			: undefined
	);
	const ariaValueMin = $derived(resizable ? resizable._minSizePx : undefined);
	const ariaValueMax = $derived(
		resizable && resizable._maxSizePx !== Infinity ? resizable._maxSizePx : undefined
	);
	const ariaValueText = $derived(
		resizable && isCollapsed ? t('@astryx.resizable.collapsed') : undefined
	);

	const attrs = $derived(
		resizeHandleAttrs(
			{
				isHorizontal,
				isOverlay,
				hasDivider,
				isInteracting,
				isDragging,
				isDisabled
			},
			xstyle
		)
	);
	const hitArea = $derived(resizeHandleHitAreaAttrs(isHorizontal, effectiveSide, isDisabled));
	const pill = $derived(
		resizeHandlePillAttrs({
			isHorizontal,
			effectiveSide,
			isAlwaysVisible,
			isInteracting,
			isDragging
		})
	);
	const theme = themeProps('resize-handle');
	const pillTheme = themeProps('resize-handle-pill');
</script>

<!--
	The WAI-ARIA window-splitter pattern *requires* a focusable separator — that
	is where the arrow-key contract lives, and a `separator` with a tabindex is
	interactive by definition. Svelte's rule reads the bare role instead.
-->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={handleEl}
	role="separator"
	aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
	aria-valuenow={ariaValueNow}
	aria-valuemin={ariaValueMin}
	aria-valuemax={ariaValueMax}
	aria-valuetext={ariaValueText}
	aria-label={label}
	aria-disabled={isDisabled || undefined}
	tabindex={isDisabled ? -1 : 0}
	ondblclick={handleDoubleClick}
	onfocus={() => (isFocused = true)}
	onblur={() => (isFocused = false)}
	data-resizing={isDragging || undefined}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={attrs.style}
	{...rest}
	onkeydown={(event) => {
		onkeydown?.(event);
		handleKeyDown(event);
	}}
>
	<!--
		Wider invisible hit area for pointer interaction. It takes no role of its
		own on purpose: it is a pointer target *inside* the separator, and giving
		it one would put a second control in the accessibility tree where upstream
		— and the splitter pattern — has exactly one.
	-->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class={hitArea.class}
		style={hitArea.style}
		onpointerdown={handlePointerDown}
		onpointerenter={() => (isHovered = true)}
		onpointerleave={() => {
			if (!isDragging) {
				isHovered = false;
			}
		}}
	></div>
	<!-- Pill grip indicator — themed via .astryx-resize-handle-pill -->
	{#if children}
		{@render children()}
	{:else}
		<div {...pillTheme} class={cx(pillTheme.class, pill.class)} style={pill.style}></div>
	{/if}
</div>
