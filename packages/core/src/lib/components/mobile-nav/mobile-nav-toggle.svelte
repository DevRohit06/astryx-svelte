<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	/**
	 * A closed `Pick`, as upstream's is: only the three style props reach the
	 * button, everything else it needs comes from context. Same shape
	 * `MoreMenuProps` has, and with the same consequence — no rest spread, so no
	 * seam for an attachment.
	 */
	export interface MobileNavToggleProps extends Pick<
		BaseProps<HTMLButtonElement>,
		'xstyle' | 'class' | 'style'
	> {
		/** Custom content to render instead of the default hamburger icon. */
		children?: Snippet;
		/**
		 * Accessible label for the toggle button.
		 * @default 'Open navigation'
		 */
		label?: string;
		/** Test ID for the button element. */
		'data-testid'?: string;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/index.js';
	import { useAppShellMobile } from '../app-shell/app-shell-mobile-context.svelte.js';
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';

	/**
	 * The hamburger that opens and closes the mobile nav drawer.
	 *
	 * Reads `AppShell`'s mobile context, so it can be placed anywhere in the tree
	 * — inside a `TopNav`, a custom toolbar, the content area — and renders
	 * **nothing** above the mobile breakpoint or when mobile nav is disabled.
	 * That makes it safe to include unconditionally.
	 *
	 * @example
	 * ```svelte
	 * <div class="my-toolbar">
	 *   <MobileNavToggle />
	 *   <h1>Page Title</h1>
	 * </div>
	 * ```
	 */
	let {
		children,
		label: labelFromProps,
		'data-testid': testId,
		xstyle,
		class: className,
		style: styleProp
	}: MobileNavToggleProps = $props();

	const t = useTranslator();
	const appShellMobile = useAppShellMobile();

	const label = $derived(labelFromProps ?? t('@astryx.mobileNav.toggle.open'));
	// Don't render above the breakpoint or when mobile nav is disabled.
	const isVisible = $derived(appShellMobile().isMobile && appShellMobile().isMobileNavEnabled);
</script>

{#snippet menuIcon()}
	<Icon icon="menu" color="inherit" />
{/snippet}

{#if isVisible}
	<Button
		variant="ghost"
		{label}
		icon={children ?? menuIcon}
		onclick={appShellMobile().toggleMobileNav}
		aria-expanded={appShellMobile().isMobileNavOpen}
		aria-controls={appShellMobile().mobileNavId || undefined}
		data-testid={testId ?? 'mobile-nav-toggle'}
		{xstyle}
		class={className}
		style={styleProp}
		isIconOnly
	/>
{/if}
