<script lang="ts" module>
	import type { AvatarProps } from '$lib/components/avatar/avatar.svelte';
	import type { AvatarStatusDotProps } from '$lib/components/avatar/avatar-status-dot.svelte';
	import type { AvatarGroupProps } from '$lib/components/avatar-group/avatar-group.svelte';
	import type { AvatarGroupOverflowProps } from '$lib/components/avatar-group/avatar-group-overflow.svelte';

	export interface AvatarGroupFixtureAvatar extends Omit<AvatarProps, 'status'> {
		/**
		 * `'dot'` gives the avatar upstream's
		 * `status={<AvatarStatusDot variant="success" label="Online" />}` (props from
		 * `statusDot`); `'button'` gives it upstream's bare
		 * `status={<button type="button">badge</button>}`, the non-avatar control the
		 * roving-focus case must skip.
		 */
		status?: 'dot' | 'button';
		statusDot?: AvatarStatusDotProps;
	}

	export interface AvatarGroupFixtureProps {
		/** The group's own props. `children` is supplied by this fixture. */
		group?: Omit<AvatarGroupProps, 'children'>;
		/** One `Avatar` per entry, in order. Omitted (or `[]`) → an empty group. */
		avatars?: AvatarGroupFixtureAvatar[];
		/** A trailing `AvatarGroupOverflow`. Omitted → none. */
		overflow?: Omit<AvatarGroupOverflowProps, 'children'>;
		/**
		 * Replaces the overflow's default `+N` with upstream's
		 * `<span data-testid="custom">more</span>`.
		 */
		overflowChild?: boolean;
	}
</script>

<script lang="ts">
	import Avatar from '$lib/components/avatar/avatar.svelte';
	import AvatarStatusDot from '$lib/components/avatar/avatar-status-dot.svelte';
	import AvatarGroup from '$lib/components/avatar-group/avatar-group.svelte';
	import AvatarGroupOverflow from '$lib/components/avatar-group/avatar-group-overflow.svelte';

	/**
	 * `<AvatarGroup>…children…</AvatarGroup>` for the ported AvatarGroup suite.
	 *
	 * Upstream writes the children inline as JSX. Here `children` (and `status`,
	 * and the overflow's own `children`) are `Snippet`s, and a snippet can only be
	 * authored in a template — so a component is the smallest thing that can hand
	 * them to `AvatarGroup`. The per-avatar status arrives as a discriminator
	 * rather than as a node for the same reason.
	 */
	const {
		group = {},
		avatars = [],
		overflow,
		overflowChild = false
	}: AvatarGroupFixtureProps = $props();

	/**
	 * The fixture's two extra keys stripped off, so what is left is exactly an
	 * `Avatar`'s own props. Deleting from a copy rather than destructuring keeps
	 * the discarded names from reading as unused bindings.
	 */
	function avatarProps(avatar: AvatarGroupFixtureAvatar): Record<string, unknown> {
		const rest: Record<string, unknown> = { ...avatar };
		delete rest.status;
		delete rest.statusDot;
		return rest;
	}
</script>

{#snippet overflowContent()}
	<span data-testid="custom">more</span>
{/snippet}

<AvatarGroup {...group}>
	{#each avatars as avatar, index (index)}
		{@const rest = avatarProps(avatar)}
		{#snippet dotStatus()}
			<AvatarStatusDot {...avatar.statusDot ?? {}} />
		{/snippet}
		{#snippet buttonStatus()}
			<button type="button">badge</button>
		{/snippet}
		<Avatar
			{...rest}
			status={avatar.status === 'dot'
				? dotStatus
				: avatar.status === 'button'
					? buttonStatus
					: undefined}
		/>
	{/each}
	{#if overflow}
		<AvatarGroupOverflow {...overflow} children={overflowChild ? overflowContent : undefined} />
	{/if}
</AvatarGroup>
