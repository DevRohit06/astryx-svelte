<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface MobileNavProps extends BaseProps<HTMLElement> {
		/**
		 * Whether the drawer is open.
		 * Inside AppShell, this is managed automatically via context.
		 * Outside AppShell, provide this prop to control the drawer yourself.
		 */
		isOpen?: boolean;

		/**
		 * Callback fired when the drawer visibility changes.
		 * Called with `false` when the drawer should close
		 * (backdrop click, escape, close button).
		 * Inside AppShell, this is managed automatically via context.
		 * Outside AppShell, provide this prop to control the drawer yourself.
		 */
		onOpenChange?: (isOpen: boolean) => void;

		/** Drawer content — typically `SideNavSection`/`SideNavItem`, or anything. */
		children: Snippet;

		/**
		 * Header content for the drawer, rendered next to the close button.
		 * A string gets a `<Heading level={2}>`; a snippet is rendered as-is
		 * (a logo, a `SideNavHeading`, a search box).
		 */
		header?: string | Snippet;

		/**
		 * Width of the drawer in pixels.
		 * @default 320
		 */
		width?: number;

		/**
		 * Which side the drawer slides from.
		 * - `'start'` — slides from the inline-start edge (left in LTR)
		 * - `'end'` — slides from the inline-end edge (right in LTR)
		 * - `'auto'` — determined by the trigger element's position: if the
		 *   toggle is in the start half of the viewport the drawer opens from
		 *   start, otherwise from end.
		 * @default 'auto'
		 */
		side?: 'start' | 'end' | 'auto';

		/** Accessible label. Falls back to a string `header`, then 'Navigation'. */
		label?: string;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/index.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useAppShellMobile } from '../app-shell/app-shell-mobile-context.svelte.js';
	import Button from '../button/button.svelte';
	import Heading from '../heading/heading.svelte';
	import Icon from '../icon/icon.svelte';
	import { holdScrollbarGutter, type ScrollbarGutterHold } from '../../hooks/scrollbar-gutter.js';
	import { resolveCloseDelay } from './close-timing.js';
	import {
		mobileNavContentAttrs,
		mobileNavDialogAttrs,
		mobileNavDrawerAttrs,
		mobileNavHeaderAttrs,
		mobileNavHeaderTextStyle
	} from './mobile-nav.stylex.js';

	/**
	 * A full-height slide-out drawer for mobile navigation — the mobile
	 * counterpart to `SideNav`, taking the same children.
	 *
	 * Like `Dialog` and `Lightbox`, and unlike every popover in this library, it
	 * is a **native `<dialog>` opened with `showModal()`**: the browser gives it
	 * the top layer (so no `z-index` is needed anywhere), `::backdrop`, body
	 * scroll lock, focus containment and Escape via the `cancel` event.
	 *
	 * Inside an `AppShell`, `isOpen`/`onOpenChange` come from context. Standalone,
	 * pass them yourself.
	 *
	 * @example
	 * ```svelte
	 * <MobileNav bind:isOpen header="Navigation">
	 *   <SideNavItem label="Home" href="/" />
	 * </MobileNav>
	 * ```
	 */
	let {
		isOpen: isOpenProp,
		onOpenChange: onOpenChangeProp,
		children,
		header,
		width = 320,
		side = 'auto',
		label,
		xstyle,
		class: className,
		style: styleProp,
		onclick: onclickProp,
		...rest
	}: MobileNavProps = $props();

	const t = useTranslator();
	// Read from AppShell context as fallback.
	const appShellMobile = useAppShellMobile();

	const isOpen = $derived(isOpenProp ?? appShellMobile().isMobileNavOpen);

	// Share the id from the AppShell context so the toggle's `aria-controls`
	// resolves to this drawer; fall back to a locally generated id when used
	// standalone.
	const fallbackId = $props.id();
	const dialogId = $derived(appShellMobile().mobileNavId || fallbackId);

	function onOpenChange(open: boolean): void {
		if (onOpenChangeProp) {
			onOpenChangeProp(open);
			return;
		}
		if (open) {
			appShellMobile().openMobileNav();
		} else {
			appShellMobile().closeMobileNav();
		}
	}

	// `$state` rather than a plain `let` so the open/close effect re-runs once
	// `bind:this` lands — the ordering-proof shape `Lightbox` settled on.
	let dialogEl = $state<HTMLDialogElement>();
	// Plain `let`s: values that must survive without causing a re-run.
	let closeTimeout: ReturnType<typeof setTimeout> | null = null;
	// The gutter held open in place of the scrollbar `overflow: clip` hides.
	// Upstream keeps it in a `useRef` for the same reason it is a plain `let`
	// here: it is written from inside the effect that reads it, and a `$state`
	// would make that write re-run the effect.
	let gutter: ScrollbarGutterHold | null = null;

	/** Gives back the gutter held open in place of the hidden scrollbar. */
	function releaseGutter(): void {
		if (gutter) {
			gutter.release();
			gutter = null;
		}
	}

	// Resolved side — computed from trigger position when side='auto'. Seeded once,
	// as upstream's `useState` initialiser is.
	let resolvedSide = $state<'start' | 'end'>(side === 'auto' ? 'end' : side);

	/**
	 * Resolve which edge the drawer slides from. Deliberately its own effect,
	 * declared before the open/close effect below so the trigger is still the
	 * active element when `side='auto'` reads it. Keeping it out of that effect is
	 * what stops a `side` change during a close from re-arming the delay: the CSS
	 * hold runs from the commit that started the slide-out and does not restart, so
	 * a fresh full delay could land after the drawer had already stopped being
	 * rendered — #4290 again.
	 */
	$effect(() => {
		if (!isOpen) {
			return;
		}

		if (side === 'auto') {
			const trigger = document.activeElement as HTMLElement | null;
			if (trigger && trigger !== document.body) {
				const rect = trigger.getBoundingClientRect();
				const triggerCenter = rect.left + rect.width / 2;
				resolvedSide = triggerCenter < window.innerWidth / 2 ? 'start' : 'end';
			}
		} else {
			resolvedSide = side;
		}
	});

	/**
	 * Open/close the dialog via `showModal()`/`close()`. `close()` is delayed so
	 * the slide-out transition can play.
	 *
	 * **The delayed close stopped being dead code at upstream 0.4.5**, and this
	 * port's matching debt retires with it. It used to be unreachable on both
	 * sides: the teardown closed the dialog before the delay could fire, because
	 * the unmount close lived in this same effect. Upstream split it into the
	 * unmount-only effect below precisely so an `isOpen` flip no longer cuts the
	 * slide-out off.
	 */
	$effect(() => {
		const dialog = dialogEl;
		if (!dialog) {
			return;
		}

		if (isOpen) {
			// Taken first: every mutation below is one that can hide the scrollbar,
			// and the gutter has to be measured while it is still there.
			gutter ??= holdScrollbarGutter(document.documentElement);

			if (!dialog.open) {
				dialog.showModal();
			}
			// Prevent background scrolling and iOS pull-to-refresh.
			// overflow: clip avoids creating a scroll container (unlike hidden),
			// so there's no scroll bounce and no need to save/restore scroll position.
			document.documentElement.style.overflow = 'clip';
			gutter.settle();
		} else if (dialog.open) {
			document.documentElement.style.overflow = '';
			releaseGutter();

			closeTimeout = setTimeout(() => {
				dialog.close();
			}, resolveCloseDelay(dialog));
		}

		return () => {
			if (closeTimeout) {
				clearTimeout(closeTimeout);
				closeTimeout = null;
			}
			document.documentElement.style.overflow = '';
			releaseGutter();
		};
	});

	/**
	 * Close the native dialog on unmount if it is still open, so the next open
	 * cleanly calls `showModal()` again — leaving it `open` makes `showModal()` a
	 * no-op forever after, which is the regression upstream's
	 * `MobileNavReopen.test.tsx` exists to pin. It is also what stops a drawer
	 * unmounted mid-open from leaving the browser's top layer occupied.
	 *
	 * **A separate unmount-only effect, not part of the open/close effect above**:
	 * folded in there it would close the dialog on every `isOpen` flip and cut off
	 * the delayed slide-out close. Reading `dialogEl` tracks it, so this re-runs
	 * once when `bind:this` lands — the teardown it replaces captured `undefined`
	 * and does nothing, which is the intended no-op.
	 */
	$effect(() => {
		const dialog = dialogEl;
		return () => {
			if (dialog?.open) {
				dialog.close();
			}
		};
	});

	function handleCancel(event: Event): void {
		event.preventDefault();
		onOpenChange(false);
	}

	// Upstream's `composeEventHandlers(onClickProp, handleDialogClick)`: the
	// consumer's handler runs first and can opt out of the built-in dismissal with
	// `event.preventDefault()`. The early return *is* that opt-out — without it a
	// caller pinning the drawer open would be ignored.
	function handleDialogClick(event: MouseEvent): void {
		onclickProp?.(event as MouseEvent & { currentTarget: EventTarget & HTMLElement });
		if (event.defaultPrevented) {
			return;
		}
		// Only close when the click landed directly on the dialog element (the
		// transparent overlay), not on the drawer or its children.
		if (event.target === event.currentTarget) {
			onOpenChange(false);
		}
	}

	const isStart = $derived(resolvedSide === 'start');
	const hasStringHeader = $derived(typeof header === 'string');

	const theme = $derived(themeProps('mobile-nav', { side: resolvedSide }));
	const dialogAttrs = $derived(mobileNavDialogAttrs(isOpen, xstyle));
	const drawerAttrs = $derived(mobileNavDrawerAttrs(width, isStart, isOpen));
	// `!!header`, not `header != null` — upstream's condition is `!header &&
	// styles.headerNoTitle`, so an empty-string header right-aligns the close
	// button. (It still renders the empty `<Heading>`, which is upstream being
	// internally inconsistent for that input; the class is the part we can match.)
	const headerAttrs = $derived(mobileNavHeaderAttrs(!!header));
	const contentAttrs = mobileNavContentAttrs();
</script>

{#snippet closeIcon()}
	<Icon icon="close" color="inherit" />
{/snippet}

<!--
	`{...rest}` sits after the theme/class/style block and before the explicit
	attributes, which is upstream's position exactly: a consumer's `data-*` beats
	the theme reflection, while `aria-label`, `onclick` and `oncancel` — which this
	component owns — beat a consumer's. `onclick` is composed rather than
	overridden (`handleDialogClick` calls `onclickProp` first).
-->
<dialog
	bind:this={dialogEl}
	id={dialogId}
	{...theme}
	class={cx(theme.class, dialogAttrs.class, className)}
	style={mergeStyle(dialogAttrs.style, styleProp as string | undefined)}
	{...rest}
	aria-label={label ?? (hasStringHeader ? (header as string) : t('@astryx.mobileNav.navigation'))}
	onclick={handleDialogClick}
	oncancel={handleCancel}
>
	<!-- Drawer panel — tabindex so showModal() focuses the drawer, not the close button -->
	<div tabindex="-1" class={drawerAttrs.class} style={drawerAttrs.style}>
		<!-- Header — content + close button -->
		<div class={headerAttrs.class} style={headerAttrs.style}>
			{#if hasStringHeader}
				<!--
					The inset rides the `Heading`'s own `xstyle`, as upstream's
					`<Heading level={2} xstyle={styles.headerText}>` does (#4775). It used
					to be a wrapper `<span>` here, which put an element in the drawer
					header that upstream's DOM does not have.
				-->
				<Heading level={2} xstyle={mobileNavHeaderTextStyle}>{header as string}</Heading>
			{:else if header != null}
				{@render (header as Snippet)()}
			{/if}
			<Button
				variant="ghost"
				label={t('@astryx.mobileNav.closeNavigation')}
				icon={closeIcon}
				onclick={() => onOpenChange(false)}
				isIconOnly
			/>
		</div>

		<!-- Scrollable content -->
		<div class={contentAttrs.class} style={contentAttrs.style}>
			{@render children()}
		</div>
	</div>
</dialog>
