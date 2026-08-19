<script lang="ts" module>
	import type { ButtonGroupProps } from '$lib/components/button-group/button-group.svelte';
	import type { ButtonVariant } from '$lib/components/button/button.stylex.js';

	/**
	 * One member of the group, in the shape upstream writes as JSX.
	 *
	 * `ButtonGroup`'s children are a snippet, so every one of upstream's twenty-odd
	 * child arrangements would otherwise need its own fixture file. They are all
	 * drawn from the same handful of member kinds, so this describes a member as
	 * data and the markup below renders it — one fixture, and the test file reads
	 * close to upstream's JSX.
	 */
	export interface GroupMember {
		/** @default 'button' */
		kind?:
			'button' | 'icon-button' | 'raw' | 'tooltip-wrapped' | 'hover-card-wrapped' | 'dropdown-menu';
		label: string;
		variant?: ButtonVariant;
		href?: string;
		/** `Button`'s own `tooltip` prop — renders a `[popover]` layer *sibling*. */
		tooltip?: string;
		/** Text for the icon slot of an `icon-button`. */
		icon?: string;
		iconTestId?: string;
		/** Content of a wrapping `<Tooltip>` / `<HoverCard>`. */
		content?: string;
		/** Item labels for a `dropdown-menu` member. */
		items?: string[];
	}

	export interface ButtonGroupHarnessProps extends Omit<ButtonGroupProps, 'children'> {
		members: GroupMember[];
	}
</script>

<script lang="ts">
	import Button from '$lib/components/button/button.svelte';
	import ButtonGroup from '$lib/components/button-group/button-group.svelte';
	import DropdownMenu from '$lib/components/dropdown-menu/dropdown-menu.svelte';
	import HoverCard from '$lib/components/hover-card/hover-card.svelte';
	import IconButton from '$lib/components/icon-button/icon-button.svelte';
	import Tooltip from '$lib/components/tooltip/tooltip.svelte';

	// Everything but `members` is a `ButtonGroup` prop and goes straight through —
	// including a consumer's `{@attach}`, which arrives here as a symbol key and
	// has to survive the rest spread for the ref counterpart to mean anything.
	const { members, ...group }: ButtonGroupHarnessProps = $props();
</script>

<ButtonGroup {...group}>
	{#each members as member, index (index)}
		{#if member.kind === 'icon-button'}
			<IconButton label={member.label}>
				{#snippet icon()}<span data-testid={member.iconTestId}>{member.icon}</span>{/snippet}
			</IconButton>
		{:else if member.kind === 'raw'}
			<button type="button">{member.label}</button>
		{:else if member.kind === 'tooltip-wrapped'}
			<Tooltip content={member.content ?? ''}>
				<Button label={member.label} variant={member.variant} />
			</Tooltip>
		{:else if member.kind === 'dropdown-menu'}
			<DropdownMenu
				button={{ label: member.label, variant: member.variant }}
				items={(member.items ?? []).map((label) => ({ label }))}
			/>
		{:else if member.kind === 'hover-card-wrapped'}
			{#snippet cardContent()}{member.content ?? ''}{/snippet}
			<HoverCard content={cardContent}>
				<Button label={member.label} variant={member.variant} />
			</HoverCard>
		{:else}
			<Button
				label={member.label}
				variant={member.variant}
				href={member.href}
				tooltip={member.tooltip}
			/>
		{/if}
	{/each}
</ButtonGroup>
