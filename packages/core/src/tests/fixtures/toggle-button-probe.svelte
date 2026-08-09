<script lang="ts">
	import ToggleButton, {
		type ToggleButtonProps
	} from '$lib/components/toggle-button/toggle-button.svelte';

	/**
	 * A standalone `ToggleButton` whose `icon`, `pressedIcon` and `children`
	 * upstream authors as inline JSX elements. A Svelte `.ts` test cannot author a
	 * snippet, so the probe describes each with plain props and renders the
	 * snippets here, forwarding every other `ToggleButton` prop through `...rest`
	 * (`label`, `isPressed`, `onPressedChange`, `pressedChangeAction`, `isIconOnly`,
	 * `isDisabled`, `data-testid`, …).
	 *
	 * `hasIcon` renders the `icon` snippet upstream passes as a `<span>` element,
	 * with `iconTestid`/`iconText` filling its attributes. `pressedIconTestid`
	 * opts in the `pressedIcon` swap. `childrenText` renders visible children,
	 * overriding the label.
	 */
	interface Props extends Omit<ToggleButtonProps, 'icon' | 'pressedIcon' | 'children'> {
		hasIcon?: boolean;
		iconTestid?: string;
		iconText?: string;
		pressedIconTestid?: string;
		pressedIconText?: string;
		childrenText?: string;
	}

	let {
		hasIcon = false,
		iconTestid,
		iconText = 'B',
		pressedIconTestid,
		pressedIconText,
		childrenText,
		...rest
	}: Props = $props();
</script>

{#snippet icon()}<span data-testid={iconTestid}>{iconText}</span>{/snippet}
{#snippet pressedIcon()}<span data-testid={pressedIconTestid}>{pressedIconText}</span>{/snippet}
{#snippet childrenSnippet()}{childrenText}{/snippet}

<ToggleButton
	{...rest}
	icon={hasIcon ? icon : undefined}
	pressedIcon={pressedIconTestid != null ? pressedIcon : undefined}
	children={childrenText != null ? childrenSnippet : undefined}
/>
