<script lang="ts" module>
	export type SubMenuScenario =
		'move' | 'disabled' | 'threeItems' | 'fruit' | 'nested' | 'loading' | 'async';
</script>

<script lang="ts">
	import DropdownMenu from '$lib/components/dropdown-menu/dropdown-menu.svelte';
	import DropdownMenuItem from '$lib/components/dropdown-menu/dropdown-menu-item.svelte';
	import DropdownMenuSubMenu from '$lib/components/dropdown-menu/dropdown-menu-sub-menu.svelte';

	/**
	 * Compound-mode `DropdownMenu` with submenus, for the cases upstream writes as
	 * JSX children (including its inline `AsyncSubmenu` component). A Svelte
	 * `children` snippet can only be authored in a template, so each scenario
	 * lives here — the arrangement `dropdown-menu-compound.svelte` already uses.
	 */
	interface Props {
		scenario: SubMenuScenario;
		onMove?: (folder: string) => void;
		onPick?: (team: string) => void;
	}
	const { scenario, onMove = () => {}, onPick = () => {} }: Props = $props();

	// Upstream's `AsyncSubmenu` holds `loaded` in `useState` and flips it from
	// `onOpenChange`; `$state` is the counterpart.
	//
	// The write is DEFERRED, where upstream's is not, and the deferral is the
	// translation. Upstream's `setLoaded(true)` fires during `layer.show()` but
	// React has not committed by the time the submenu's `requestAnimationFrame`
	// runs `focusFirst()` — so the flyout is genuinely item-less at that moment
	// and focus falls back to the container, which is the state the case exists
	// to exercise. A `$state` write flushes ahead of that rAF, so an
	// undeferred version would already have rendered `Folder A` and focus would
	// land straight on it, testing nothing. The deferral restores upstream's
	// ordering — children arriving *after* the flyout has opened.
	//
	// **It is a double rAF, not a timer, and that is a bug fix** (2026-08-07).
	// A `setTimeout(…, 10)` races the very `requestAnimationFrame` it has to land
	// after: under full-run load a frame can arrive later than 10ms, the children
	// render first, `focusFirst()` then finds `Folder A` and focuses it, and the
	// case's ArrowDown advances to `Folder B`. A nested rAF runs in the *next*
	// frame by definition, so it is ordered after the submenu's — the ordering
	// the comment above claims is now guaranteed rather than probable. This was
	// the suite's one full-run flake.
	let loaded = $state(false);

	function loadAfterOpen(): void {
		requestAnimationFrame(() => requestAnimationFrame(() => (loaded = true)));
	}
</script>

{#if scenario === 'move'}
	<DropdownMenu button={{ label: 'Actions' }}>
		<DropdownMenuItem label="Rename" onClick={() => {}} />
		<DropdownMenuSubMenu label="Move to">
			<DropdownMenuItem label="Folder A" onClick={() => onMove('a')} />
			<DropdownMenuItem label="Folder B" onClick={() => onMove('b')} />
		</DropdownMenuSubMenu>
	</DropdownMenu>
{:else if scenario === 'disabled'}
	<DropdownMenu button={{ label: 'Actions' }}>
		<DropdownMenuSubMenu label="Move to" isDisabled>
			<DropdownMenuItem label="Folder A" onClick={() => {}} />
		</DropdownMenuSubMenu>
	</DropdownMenu>
{:else if scenario === 'threeItems'}
	<DropdownMenu button={{ label: 'Actions' }}>
		<DropdownMenuSubMenu label="Move to">
			<DropdownMenuItem label="Projects" onClick={() => {}} />
			<DropdownMenuItem label="Archive" onClick={() => {}} />
			<DropdownMenuItem label="Trash" onClick={() => {}} />
		</DropdownMenuSubMenu>
	</DropdownMenu>
{:else if scenario === 'fruit'}
	<DropdownMenu button={{ label: 'Actions' }}>
		<DropdownMenuSubMenu label="Move to">
			<DropdownMenuItem label="Apple" onClick={() => {}} />
			<DropdownMenuItem label="Banana" onClick={() => {}} />
			<DropdownMenuItem label="Cherry" onClick={() => {}} />
		</DropdownMenuSubMenu>
	</DropdownMenu>
{:else if scenario === 'nested'}
	<DropdownMenu button={{ label: 'Share' }}>
		<DropdownMenuItem label="Copy link" onClick={() => {}} />
		<DropdownMenuSubMenu label="Share to">
			<DropdownMenuItem label="Email" onClick={() => {}} />
			<DropdownMenuSubMenu label="Team">
				<DropdownMenuItem label="Design" onClick={() => onPick('design')} />
				<DropdownMenuItem label="Eng" onClick={() => onPick('eng')} />
				<DropdownMenuItem label="Data" onClick={() => onPick('data')} />
			</DropdownMenuSubMenu>
		</DropdownMenuSubMenu>
	</DropdownMenu>
{:else if scenario === 'loading'}
	<DropdownMenu button={{ label: 'Actions' }}>
		<DropdownMenuItem label="Rename" onClick={() => {}} />
		<DropdownMenuSubMenu label="Move to" hasSpinner>
			<DropdownMenuItem label="Loading…" isDisabled onClick={() => {}} />
		</DropdownMenuSubMenu>
		<DropdownMenuItem label="Delete" onClick={() => {}} />
	</DropdownMenu>
{:else if scenario === 'async'}
	<DropdownMenu button={{ label: 'Actions' }}>
		<DropdownMenuSubMenu
			label="Move to"
			hasSpinner={!loaded}
			onOpenChange={(open) => {
				if (open) loadAfterOpen();
			}}
		>
			{#if loaded}
				<DropdownMenuItem label="Folder A" onClick={() => {}} />
				<DropdownMenuItem label="Folder B" onClick={() => {}} />
			{:else}
				<DropdownMenuItem label="Loading…" isDisabled onClick={() => {}} />
			{/if}
		</DropdownMenuSubMenu>
	</DropdownMenu>
{/if}
