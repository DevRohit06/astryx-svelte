<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	/** `onchange` is omitted from `BaseProps` so the redeclaration below replaces it. */
	export interface DropdownMenuRadioGroupProps extends Omit<BaseProps, 'onchange'> {
		/**
		 * The currently selected value in the group. Pass `undefined` when nothing
		 * is selected yet.
		 */
		value: string | undefined;
		/** Callback fired when the selected value changes. */
		onChange: (value: string) => void;
		/**
		 * Accessible name for the group, announced by screen readers so the radios
		 * read as a named set (e.g. "Sort by"). Applied as the group's `aria-label`.
		 * Required — an unnamed radio group is an accessibility defect. Pass
		 * `aria-labelledby` (via base props) instead if the name already exists as a
		 * visible element on the page.
		 */
		label: string;
		/**
		 * Whether selecting a value closes the menu. Radio items default to
		 * closing on selection (a single-choice commit), unlike checkbox items
		 * which stay open.
		 * @default true
		 */
		hasCloseOnSelect?: boolean;
		/** The `DropdownMenuRadioItem`s that make up the group. */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { setDropdownMenuRadioGroupContext } from './dropdown-menu-context.svelte.js';
	import { radioGroupAttrs } from './dropdown-menu-radio-group.stylex.js';

	/**
	 * A single-select group of radio menu items — a `role="group"` of
	 * `menuitemradio` rows.
	 *
	 * @example
	 * ```svelte
	 * <DropdownMenuRadioGroup value={sort} onChange={(v) => (sort = v)} label="Sort by">
	 *   <DropdownMenuRadioItem value="newest" label="Newest" />
	 *   <DropdownMenuRadioItem value="oldest" label="Oldest" />
	 * </DropdownMenuRadioGroup>
	 * ```
	 */
	const {
		value,
		onChange,
		label,
		hasCloseOnSelect = true,
		children,
		class: className,
		style: styleProp,
		...rest
	}: DropdownMenuRadioGroupProps = $props();

	// Stored as a getter, per the port's context convention, so an item re-reads
	// the live `value` rather than the one that existed when it mounted.
	setDropdownMenuRadioGroupContext(() => ({ value, onChange, hasCloseOnSelect }));

	const groupAttrs = radioGroupAttrs();
</script>

<div
	{...rest}
	role="group"
	aria-label={label}
	class={cx(groupAttrs.class, className)}
	style={mergeStyle(groupAttrs.style, styleProp as string | undefined)}
>
	{@render children()}
</div>
