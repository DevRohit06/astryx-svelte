<script lang="ts" module>
	import type { MouseEventHandler } from 'svelte/elements';
	import type { StyleArg } from '../../internal/sx.js';

	export interface InputClearButtonProps {
		/** Accessible name for the button (arrives pre-translated from the caller). */
		label: string;
		/**
		 * Click handler. Lowercase for the reason `Thumbnail` established: it is
		 * forwarded to the underlying `<button>` (through `Button`), so it takes the
		 * DOM event name rather than upstream's `onClick`.
		 */
		onclick: MouseEventHandler<HTMLButtonElement>;
		/** Extra styles, merged after the 20px height override so a caller can win. */
		xstyle?: StyleArg;
		/**
		 * Extra class(es) for the clear glyph itself, merged onto the shared
		 * `astryx-input-clear-icon` target. Used by inputs that shipped a
		 * component-specific clear-icon target before the family converged here
		 * (e.g. `astryx-date-input-clear-icon`) to keep emitting it for a
		 * deprecation window; new callers don't need it.
		 */
		iconClassName?: string;
	}
</script>

<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { themeProps } from '../../internal/theme-props.js';
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import { clearButtonStyle } from './input-clear-button.stylex.js';

	/**
	 * A small clear affordance for input controls — a ghost, icon-only `Button`
	 * shrunk to 20px.
	 *
	 * At 0.4.x (#4876) the whole input family converges here: `TextInput`,
	 * `NumberInput`, `TimeInput`, the three date inputs and the selectors each
	 * used to inline their own `<button>`, and each drew its own focus ring. The
	 * glyph carries the shared `astryx-input-clear-icon` target so one rule
	 * reaches every clear button in the system, and `iconClassName` lets the
	 * inputs that already shipped a component-specific target keep emitting it
	 * through a deprecation window.
	 *
	 * Deliberately narrow — no `size`, `variant` or `icon` overrides. Widening it
	 * would be invented API.
	 */
	let { label, onclick, xstyle, iconClassName }: InputClearButtonProps = $props();

	const iconTheme = themeProps('input-clear-icon');
	// The button wrapper carries its own target, so a theme can reach the control's
	// size and hover without also matching the glyph inside it. Upstream stamps
	// both (`Field/InputClearButton.tsx`); this port shipped only the icon one, and
	// the CLI's documented-target registry test is what caught the gap.
	const buttonTheme = themeProps('input-clear-button');
	const iconClass = $derived(
		iconClassName != null ? `${iconTheme.class} ${iconClassName}` : iconTheme.class
	);
</script>

{#snippet closeIcon()}
	<Icon icon="close" size="sm" color="secondary" class={iconClass} />
{/snippet}

<Button
	variant="ghost"
	size="sm"
	{label}
	icon={closeIcon}
	onclick={onclick as ComponentProps<typeof Button>['onclick']}
	isIconOnly
	class={buttonTheme.class}
	xstyle={[clearButtonStyle, xstyle]}
/>
