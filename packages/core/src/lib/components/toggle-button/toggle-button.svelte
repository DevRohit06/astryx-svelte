<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { ButtonSize } from '../button/button.stylex.js';

	export interface ToggleButtonProps extends BaseProps<HTMLButtonElement> {
		/** Accessible label — visible text, or the `aria-label` when icon-only. */
		label: string;
		/** Whether the button is pressed. Ignored inside `ToggleButtonGroup`. */
		isPressed?: boolean;
		/**
		 * Called with the next pressed state and the click event. Call
		 * `event.preventDefault()` to opt out of running `pressedChangeAction`.
		 * Ignored inside `ToggleButtonGroup`.
		 */
		onPressedChange?: (isPressed: boolean, event: MouseEvent) => void;
		/** Async handler run inside `Button`'s transition; drives the pending spinner. */
		pressedChangeAction?: (isPressed: boolean) => void | Promise<void>;
		/** @default 'md' (or the group's size) */
		size?: ButtonSize;
		/** @default false (the group's `isDisabled` overrides) */
		isDisabled?: boolean;
		/** @default false */
		isLoading?: boolean;
		/** Icon rendered before the label. */
		icon?: Snippet;
		/** Square icon-only button with `label` as the accessible name. @default false */
		isIconOnly?: boolean;
		/** Icon shown while pressed (outline→filled swap); falls back to `icon`. */
		pressedIcon?: Snippet;
		/** Visible content, rendered instead of `label`. */
		children?: Snippet;
		/** Tooltip text, forwarded to `Button`. */
		tooltip?: string;
		/** Value identifier when used inside `ToggleButtonGroup` (required there). */
		value?: string;
	}
</script>

<script lang="ts">
	import Button from '../button/button.svelte';
	import { themeProps } from '../../internal/theme-props.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { useToggleButtonGroup } from './toggle-button-group-context.svelte.js';
	import {
		toggleButtonLabelAttrs,
		toggleButtonWidthReservationAttrs,
		toggleButtonWrapperAttrs,
		toggleButtonXstyle
	} from './toggle-button.stylex.js';

	/**
	 * A button that toggles between pressed and unpressed states — a thin wrapper
	 * over `Button` adding the controlled toggle pattern, icon swap, and a
	 * semibold-on-press font shift with a width-reservation copy to prevent layout
	 * shift. Works standalone (`isPressed`/`onPressedChange`) or inside
	 * `ToggleButtonGroup` (which controls selection via `value`).
	 *
	 * Upstream drops a consumer `class` (destructured but never forwarded) and
	 * spreads rest last onto `Button`, so a consumer `onclick` clobbers the toggle
	 * handler — both faithful upstream quirks, recorded under Known debts.
	 */
	const {
		label,
		isPressed: isPressedProp,
		onPressedChange: onPressedChangeProp,
		pressedChangeAction,
		size: sizeProp,
		isDisabled: isDisabledProp = false,
		isLoading = false,
		icon,
		isIconOnly = false,
		pressedIcon,
		children,
		tooltip,
		value,
		xstyle,
		class: _className,
		style: styleProp,
		...rest
	}: ToggleButtonProps = $props();

	const group = useToggleButtonGroup();
	const groupValue = $derived(group?.());

	const committedPressed = $derived(
		groupValue != null && value != null
			? groupValue.selectedValues.has(value)
			: (isPressedProp ?? false)
	);
	const size = $derived(sizeProp ?? groupValue?.size ?? 'md');
	const isDisabled = $derived(groupValue?.isDisabled ?? isDisabledProp);

	// Track the pressed state optimistically so the button reflects the intended
	// state immediately while an async action is pending (applied inside Button's
	// clickAction transition).
	const optimistic = createOptimistic(() => committedPressed);
	const isPressed = $derived(optimistic.current);

	// Next state derives from the *optimistic* value so a re-click while an action
	// is pending toggles true→false→true rather than from the stale committed state.
	const nextPressed = $derived(!isPressed);
	const resolvedIcon = $derived(isPressed && pressedIcon ? pressedIcon : icon);

	// Show label content unless it's an icon-only button with no explicit children.
	const hasLabelContent = $derived(children != null || !isIconOnly);

	const theme = $derived(themeProps('toggle-button', { isPressed: isPressed ? 'true' : 'false' }));
	const wrapperAttrs = toggleButtonWrapperAttrs();
	const labelLineAttrs = $derived(toggleButtonLabelAttrs(isPressed));
	const widthReservationAttrs = toggleButtonWidthReservationAttrs();

	// The pre-click pressed target, captured ONCE per click. Upstream's
	// `nextPressed` is a render-time const both `handleClick` and `clickAction`
	// close over. Here `nextPressed` is a live `$derived(!isPressed)`, and
	// `optimistic.run` flips the override (hence `isPressed`, hence `nextPressed`)
	// before it awaits — so reading the derived again inside the action would pass
	// the *inverted* value to `pressedChangeAction`. A plain non-reactive `let`
	// captured before `onPressedChange` runs freezes it the way React does.
	let clickNext = false;

	// Synchronous part of the toggle. Button calls onclick before clickAction and
	// skips clickAction when defaultPrevented, so preventDefault() in
	// onPressedChange opts out of pressedChangeAction.
	function handleClick(event: MouseEvent): void {
		if (isDisabled) {
			return;
		}
		if (groupValue != null && value != null) {
			// Group mode delegates selection to the group; no async-action path.
			groupValue.toggle(value);
			event.preventDefault();
			return;
		}
		clickNext = nextPressed;
		onPressedChangeProp?.(clickNext, event);
	}

	// Async part, run inside Button's transition. undefined in group mode. Uses the
	// frozen `clickNext` so the callback and optimistic update always agree.
	const clickAction = $derived(
		groupValue != null && value != null
			? undefined
			: () => optimistic.run(clickNext, () => pressedChangeAction?.(clickNext))
	);
</script>

{#snippet labelContent()}
	<span class={wrapperAttrs.class} style={wrapperAttrs.style}>
		<span class={labelLineAttrs.class} style={labelLineAttrs.style}>
			{#if children}{@render children()}{:else}{label}{/if}
		</span>
		<span
			class={widthReservationAttrs.class}
			style={widthReservationAttrs.style}
			aria-hidden="true"
		>
			{#if children}{@render children()}{:else}{label}{/if}
		</span>
	</span>
{/snippet}

<Button
	{label}
	variant="ghost"
	{size}
	{isDisabled}
	{isLoading}
	isInterruptible
	{isIconOnly}
	aria-pressed={isPressed}
	icon={resolvedIcon}
	{tooltip}
	{...theme}
	xstyle={toggleButtonXstyle(isPressed, xstyle)}
	style={styleProp as string | undefined}
	onclick={handleClick}
	{clickAction}
	{...rest as Record<string, unknown>}
	children={hasLabelContent ? labelContent : undefined}
/>
