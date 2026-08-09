<script lang="ts" module>
	import type { UseInputStatusIconReturn } from './use-input-status-icon.svelte.js';

	/**
	 * As with `KeyboardHintLayerProps`, upstream has no counterpart name: its hook
	 * returns `statusIcon` as a node, so there is nothing there for a props type
	 * to describe.
	 */
	export interface InputStatusIconProps {
		/** The value returned by `useInputStatusIcon`. */
		statusIcon: UseInputStatusIconReturn;
	}
</script>

<script lang="ts">
	import Icon from '../components/icon/icon.svelte';
	import TooltipLayer from '../components/tooltip/tooltip-layer.svelte';
	import { themeProps } from '../internal/theme-props.js';
	import { inputStatusButtonAttrs } from './use-input-status-icon.stylex.js';

	/**
	 * The rendering half of `useInputStatusIcon`, replacing upstream's
	 * `statusIcon` node — the same split `TooltipLayer` and `KeyboardHintLayer`
	 * already made, for the same reason: a Svelte hook cannot return markup.
	 *
	 * Renders nothing at all when the hook says no affordance belongs on the
	 * field, a plain glyph for `attached`, and the focusable info-tip button plus
	 * its tooltip layer for `tooltip`.
	 */
	const { statusIcon }: InputStatusIconProps = $props();

	const icon = $derived(statusIcon.icon);
	const type = $derived(statusIcon.type);

	// Stable theme target on the status glyph itself, so a theme can restyle just
	// this icon (color, size) — and each status — via `defineTheme`. Same-element
	// rules in @layer astryx-theme win over the icon's own base
	// width/height/fontSize, which a field-level target could not reach. Shared by
	// the attached and tooltip variants across all bordered inputs.
	//
	// Upstream builds this inside the hook, because the hook is what constructs
	// the node; here the node lives in this component, so the theme props are
	// derived here from what the hook exposes. Same element, same attributes.
	const iconTheme = $derived(
		themeProps('input-status-icon', { size: statusIcon.size, status: type })
	);

	const buttonAttrs = inputStatusButtonAttrs();
</script>

{#if icon && type}
	{#if statusIcon.hasTooltip}
		<button
			type="button"
			aria-label={statusIcon.label}
			aria-describedby={statusIcon.describedBy}
			onclick={statusIcon.handleButtonClick}
			onblur={statusIcon.handleButtonBlur}
			class={buttonAttrs.class}
			style={buttonAttrs.style}
			{@attach statusIcon.tooltip.attachTrigger}
		>
			<Icon {icon} size={statusIcon.size} color={type} {...iconTheme} />
		</button>
		<TooltipLayer tooltip={statusIcon.tooltip}>{statusIcon.message}</TooltipLayer>
	{:else}
		<Icon {icon} size={statusIcon.size} color={type} {...iconTheme} />
	{/if}
{/if}
