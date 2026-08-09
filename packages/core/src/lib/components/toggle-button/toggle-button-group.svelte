<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { StyleArg } from '../../internal/sx.js';
	import type { ButtonSize } from '../button/button.stylex.js';

	interface ToggleButtonGroupBaseProps {
		/** Toggle button children. */
		children: Snippet;
		/** Accessible label for the group (used as `aria-label`). */
		label: string;
		/** @default 'horizontal' */
		orientation?: 'horizontal' | 'vertical';
		/** Default size for buttons in the group; individual buttons can override. */
		size?: ButtonSize;
		/** @default false */
		isDisabled?: boolean;
		xstyle?: StyleArg;
		'data-testid'?: string;
	}

	/** Single-select: one active at a time; clicking the active button deselects it. */
	export interface ToggleButtonGroupSingleProps extends ToggleButtonGroupBaseProps {
		/** @default 'single' */
		type?: 'single';
		value: string | null;
		onChange: (value: string | null) => void;
	}

	/** Multi-select: multiple buttons active simultaneously. */
	export interface ToggleButtonGroupMultipleProps extends ToggleButtonGroupBaseProps {
		type: 'multiple';
		value: string[];
		onChange: (value: string[]) => void;
	}

	export type ToggleButtonGroupProps =
		ToggleButtonGroupSingleProps | ToggleButtonGroupMultipleProps;
</script>

<script lang="ts">
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { setToggleButtonGroupContext } from './toggle-button-group-context.svelte.js';
	import { toggleButtonGroupAttrs } from './toggle-button-group.stylex.js';

	/**
	 * Groups toggle buttons for exclusive (single) or multi-select behaviour,
	 * discriminated on `type`. Closed prop set — like upstream, only
	 * `role`/`aria-label`/`data-testid` and the stylex/theme classes reach the
	 * `<div>` (no rest spread); the type itself forbids arbitrary attributes.
	 *
	 * @example
	 * ```svelte
	 * <ToggleButtonGroup {value} onChange={(v) => (value = v)} label="View mode">
	 *   <ToggleButton value="list" label="List" />
	 *   <ToggleButton value="grid" label="Grid" />
	 * </ToggleButtonGroup>
	 * ```
	 */
	const props: ToggleButtonGroupProps = $props();

	const orientation = $derived(props.orientation ?? 'horizontal');

	const selectedValues = $derived.by(() => {
		if (props.type === 'multiple') {
			return new Set(props.value);
		}
		const singleValue = props.value;
		return singleValue != null ? new Set([singleValue]) : new Set<string>();
	});

	function toggle(itemValue: string): void {
		if (props.type === 'multiple') {
			const current = props.value;
			if (current.includes(itemValue)) {
				props.onChange(current.filter((v) => v !== itemValue));
			} else {
				props.onChange([...current, itemValue]);
			}
		} else {
			const current = props.value;
			// Clicking the active button deselects it (value becomes null).
			props.onChange(current === itemValue ? null : itemValue);
		}
	}

	setToggleButtonGroupContext(() => ({
		selectedValues,
		toggle,
		size: props.size,
		isDisabled: props.isDisabled ?? false
	}));

	const theme = themeProps('toggle-button-group');
	const groupAttrs = $derived(toggleButtonGroupAttrs(orientation, props.xstyle));
</script>

<div
	role="group"
	aria-label={props.label}
	data-testid={props['data-testid']}
	{...theme}
	class={cx(theme.class, groupAttrs.class)}
	style={groupAttrs.style}
>
	{@render props.children()}
</div>
