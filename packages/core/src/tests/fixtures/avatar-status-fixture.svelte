<script lang="ts" module>
	import type { AvatarProps } from '$lib/components/avatar/avatar.svelte';
	import type { AvatarStatusDotProps } from '$lib/components/avatar/avatar-status-dot.svelte';

	export interface AvatarStatusFixtureProps {
		/** The Avatar's own props. `status` is supplied by this fixture. */
		avatar?: Omit<AvatarProps, 'status'>;
		/** The AvatarStatusDot's props. `icon` is supplied via `icon` below. */
		dot?: Omit<AvatarStatusDotProps, 'icon'>;
		/**
		 * `'svg'` gives the dot upstream's `icon={<svg data-testid="user-icon" />}`;
		 * `'none'` (the default) passes no icon at all.
		 */
		icon?: 'svg' | 'none';
	}
</script>

<script lang="ts">
	import Avatar from '$lib/components/avatar/avatar.svelte';
	import AvatarStatusDot from '$lib/components/avatar/avatar-status-dot.svelte';

	/**
	 * `<Avatar status={<AvatarStatusDot … />} />` for the ported Avatar suites.
	 *
	 * Upstream writes the status element inline as JSX. Here `status` is a
	 * `Snippet`, and a snippet can only be authored in a template — so a component
	 * is the smallest thing that can hand one to `Avatar`. The dot's `icon` is a
	 * snippet for the same reason, which is why it arrives as a discriminator
	 * rather than as a node.
	 */
	const { avatar = {}, dot = {}, icon = 'none' }: AvatarStatusFixtureProps = $props();
</script>

{#snippet userIcon()}
	<svg data-testid="user-icon"></svg>
{/snippet}

{#snippet statusDot()}
	<AvatarStatusDot {...dot} icon={icon === 'svg' ? userIcon : undefined} />
{/snippet}

<Avatar {...avatar} status={statusDot} />
