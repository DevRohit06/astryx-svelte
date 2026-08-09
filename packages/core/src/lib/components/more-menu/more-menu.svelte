<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { ButtonSize, ButtonVariant } from '../button/button.stylex.js';
	import type { DropdownMenuOption } from '../dropdown-menu/dropdown-menu-types.js';

	export interface MoreMenuProps extends Pick<BaseProps, 'xstyle' | 'class' | 'style'> {
		/** Menu items — the same data array `DropdownMenu` takes. */
		items: DropdownMenuOption[];
		/**
		 * Accessible label for the trigger button. The button is always icon-only,
		 * so this is always its `aria-label`.
		 * @default 'More options'
		 */
		label?: string;
		/**
		 * @default 'ghost'
		 */
		variant?: ButtonVariant;
		/**
		 * Size of the trigger button. Inherited from an enclosing size context when
		 * unset.
		 * @default 'md'
		 */
		size?: ButtonSize;
		/**
		 * Override the default three-dot icon.
		 * @default the registry's `moreHorizontal`
		 */
		icon?: Snippet;
		/**
		 * @default false
		 */
		isDisabled?: boolean;
		/** Controlled open state for the menu. */
		isMenuOpen?: boolean;
		/** Fired when the menu visibility changes. */
		onOpenChange?: (isOpen: boolean) => void;
		/** Test ID for testing frameworks. */
		'data-testid'?: string;
	}
</script>

<script lang="ts">
	import DropdownMenu from '../dropdown-menu/dropdown-menu.svelte';
	import { useIcon } from '../icon/use-icon.svelte.js';
	import { stableClassName } from '../../internal/naming.js';
	import { useSize } from '../../internal/contexts.svelte.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';

	/**
	 * Overflow menu with a three-dot icon trigger — a thin wrapper around
	 * `DropdownMenu` with icon-only button defaults.
	 *
	 * @example
	 * ```svelte
	 * <MoreMenu items={[{ label: 'Edit', onClick: edit }, { label: 'Delete', onClick: remove }]} />
	 * ```
	 */
	let {
		items,
		label: labelFromProps,
		variant = 'ghost',
		size: sizeProp,
		icon,
		isDisabled = false,
		isMenuOpen,
		onOpenChange,
		xstyle,
		class: classNameProp,
		style,
		'data-testid': testId
	}: MoreMenuProps = $props();

	const t = useTranslator();
	const resolveSize = useSize();

	const label = $derived(labelFromProps ?? t('@astryx.moreMenu.label'));
	const size = $derived(resolveSize(sizeProp, 'md'));
	const moreIcon = useIcon(() => 'moreHorizontal');
</script>

<DropdownMenu
	class={classNameProp
		? `${stableClassName('more-menu')} ${classNameProp}`
		: stableClassName('more-menu')}
	{xstyle}
	{style}
	{isMenuOpen}
	{onOpenChange}
	button={{
		label,
		icon: icon ?? moreIcon.current,
		variant,
		size,
		isDisabled,
		tooltip: label,
		isIconOnly: true
	}}
	{items}
	hasChevron={false}
	data-testid={testId}
/>
