<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import BottomSheet from '$lib/components/bottom-sheet/bottom-sheet.svelte';
	import BottomSheetSwitcher from '$lib/components/bottom-sheet/bottom-sheet-switcher.svelte';
	import type { DialogPurpose } from '$lib/components/dialog/dialog.svelte';
	import EscapeTrap from './escape-trap.svelte';

	/**
	 * One sheet in one switcher, with everything the cases vary exposed as props.
	 *
	 * Upstream writes each of these inline as JSX; a Svelte snippet cannot declare
	 * a component tree inside a test case, so the shape lives here. `clip` wraps
	 * the switcher in an overflow-hidden, transformed ancestor — the inline-modal
	 * case — `nestedTrap` puts a focus trap inside the sheet, and
	 * `backgroundAction` renders a tabbable control *outside* the switcher, which
	 * is what gives the focus-trap case somewhere for focus to escape to.
	 */
	let {
		activeSheet = 'details',
		onActiveSheetChange = () => {},
		hasScrim,
		purpose,
		label = 'Details',
		sheetTestId,
		sheetAttach,
		sheetOwner,
		clip = false,
		backgroundAction = false,
		nestedTrap,
		onNestedEscape = () => {},
		second,
		children,
		...rest
	}: {
		activeSheet?: string | null;
		onActiveSheetChange?: (sheetId: string | null) => void;
		hasScrim?: boolean;
		purpose?: DialogPurpose;
		label?: string;
		sheetTestId?: string;
		/** Reaches the sheet panel — this port's translation of upstream's `ref`. */
		sheetAttach?: Attachment<HTMLElement>;
		/** `data-sheet-owner` on the sheet, to prove rest props reach the panel. */
		sheetOwner?: string;
		clip?: boolean;
		/** A tabbable control outside the switcher, as upstream's focus-trap case has. */
		backgroundAction?: boolean;
		nestedTrap?: boolean;
		onNestedEscape?: () => void;
		second?: Snippet;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

{#snippet flow()}
	<BottomSheetSwitcher {...rest} {activeSheet} {onActiveSheetChange} {hasScrim}>
		<BottomSheet
			sheetId="details"
			{label}
			{purpose}
			data-testid={sheetTestId}
			data-sheet-owner={sheetOwner}
			{@attach sheetAttach ?? (() => {})}
		>
			{#if nestedTrap}
				<EscapeTrap isActive={true} onEscape={onNestedEscape} label="nested-escape-trap" />
			{:else if children}
				{@render children()}
			{:else}
				Content
			{/if}
		</BottomSheet>
		{#if second}
			<BottomSheet sheetId="confirm" label="Confirm">
				{@render second()}
			</BottomSheet>
		{/if}
	</BottomSheetSwitcher>
{/snippet}

{#if backgroundAction}
	<button type="button">Background action</button>
{/if}

{#if clip}
	<div data-testid="clipping-ancestor" style="overflow: hidden; transform: translateY(100px)">
		{@render flow()}
	</div>
{:else}
	{@render flow()}
{/if}
