<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ButtonProps } from '../button/button.svelte';

	/**
	 * Everything `Button` takes, minus the three that an icon-only button cannot
	 * use: `isIconOnly` is always on, and `children`/`endContent` have nowhere to
	 * go. `icon` becomes required.
	 */
	export interface IconButtonProps extends Omit<
		ButtonProps,
		'isIconOnly' | 'children' | 'endContent'
	> {
		icon: Snippet;
	}
</script>

<script lang="ts">
	import Button from '../button/button.svelte';

	/**
	 * An icon-only button — `<Button isIconOnly>` under a name.
	 *
	 * Upstream's reason for it existing at all is worth keeping: an explicit
	 * component is greppable and codemod-safe in a way a boolean prop is not.
	 *
	 * @example
	 * ```svelte
	 * <IconButton label="Settings" variant="ghost">
	 *   {#snippet icon()}<Icon icon="wrench" />{/snippet}
	 * </IconButton>
	 * ```
	 */
	const { icon, ...rest }: IconButtonProps = $props();
</script>

<Button {...rest} {icon} isIconOnly />
