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
	}
</script>

<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import { clearButtonStyle } from './input-clear-button.stylex.js';

	/**
	 * A small clear affordance for input controls — a ghost, icon-only `Button`
	 * shrunk to 20px. Used by `Typeahead`, `Tokenizer` and `FileInput` (each
	 * passing its own translated `label`); note `TextInput` inlines its *own*
	 * clear button rather than routing through this one, matching upstream.
	 *
	 * Deliberately three props wide — no `size`, `variant` or `icon` overrides.
	 * Widening it would be invented API.
	 */
	let { label, onclick, xstyle }: InputClearButtonProps = $props();
</script>

{#snippet closeIcon()}
	<Icon icon="close" size="sm" color="inherit" />
{/snippet}

<Button
	variant="ghost"
	size="sm"
	{label}
	icon={closeIcon}
	onclick={onclick as ComponentProps<typeof Button>['onclick']}
	isIconOnly
	xstyle={[clearButtonStyle, xstyle]}
/>
