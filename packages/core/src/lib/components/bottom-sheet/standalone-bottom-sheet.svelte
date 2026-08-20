<script lang="ts">
	import { untrack } from 'svelte';
	import BottomSheetPanel, { type BottomSheetPanelMotion } from './bottom-sheet-panel.svelte';
	import type { BottomSheetPanelState } from './bottom-sheet-panel.svelte';
	import type { StandaloneBottomSheetProps } from './bottom-sheet.svelte';
	import { bottomSheetDialogAttrs, bottomSheetPositionerAttrs } from './bottom-sheet.stylex.js';
	import { focusPanel } from './focus-panel.js';
	import { useDevWarning } from '../../hooks/use-dev-warning.svelte.js';
	import { useScrollLock } from '../../hooks/use-scroll-lock.svelte.js';

	/**
	 * Ported from the private `StandaloneBottomSheet` in Astryx's
	 * `BottomSheet/BottomSheet.tsx`.
	 *
	 * The host for a sheet that owns its own native `<dialog>`: it opens and
	 * closes the element, keeps it mounted through the exit animation, restores
	 * focus to whatever opened it, and drives the scrim's opacity from the panel's
	 * drag. Everything about the sheet *surface* belongs to `BottomSheetPanel`.
	 *
	 * Its own file because Svelte allows one component per module where upstream
	 * declares both hosts beside the router. Not exported from the barrel —
	 * upstream keeps it private, and `BottomSheet` is the only way in.
	 */
	let {
		isOpen,
		onOpenChange,
		label,
		children,
		height = 'capped',
		snapPoints,
		hasScrim = true,
		purpose = 'info',
		xstyle,
		...rest
	}: StandaloneBottomSheetProps = $props();

	let dialogEl = $state<HTMLDialogElement>();

	// Plain `let`s, mirroring upstream's refs: the panel element the hosts focus
	// into, and the element focused when the sheet opened, for restoration on
	// close. Nothing renders from either.
	let panelEl: HTMLDivElement | null = null;
	let triggerEl: HTMLElement | null = null;

	// Seeded from the initial prop, as upstream's `useState(isOpen)` is: a sheet
	// mounted already-open is presented from the first frame.
	// svelte-ignore state_referenced_locally
	let isPresented = $state(isOpen);

	const shouldPresent = $derived(isOpen || isPresented);
	const panelState = $derived<BottomSheetPanelState>(
		isOpen
			? { kind: 'open', entering: false }
			: isPresented
				? { kind: 'exiting' }
				: { kind: 'hidden' }
	);

	function dismissOnEscape(): void {
		if (purpose !== 'required') {
			onOpenChange(false);
		}
	}

	function dismissOnLightInteraction(): void {
		if (purpose === 'info') {
			onOpenChange(false);
		}
	}

	/**
	 * The panel invokes the callbacks below from inside its *own* effects, so
	 * anything they read would become a dependency of the panel's effect — a
	 * coupling React cannot express, because a callback in a dependency array
	 * contributes its identity and never its reads. Each body is therefore
	 * untracked. The reads stay current: `untrack` suspends subscription, not
	 * evaluation.
	 */
	function handlePanelElementChange(element: HTMLDivElement | null): void {
		panelEl = element;
	}

	function handleScrimOpacity(opacity: number): void {
		untrack(() => dialogEl)?.style.setProperty('--_sheet-scrim-opacity', String(opacity));
	}

	// Presentation. Tracks `isOpen` and `hasScrim`, upstream's two dependencies —
	// `dialogEl` and `panelEl` are refs on both sides and read untracked.
	$effect(() => {
		const dialog = dialogEl;
		if (dialog == null || !isOpen) {
			return;
		}

		// The controlled prop opens an already-mounted dialog, so presentation
		// state latches here: a later close then keeps the element mounted through
		// its exit rather than unmounting mid-animation.
		isPresented = true;
		dialog.style.setProperty('--_sheet-scrim-opacity', '1');
		if (!dialog.open) {
			if (hasScrim) {
				triggerEl = document.activeElement as HTMLElement | null;
				dialog.showModal();
			} else {
				dialog.show();
			}
			focusPanel(panelEl, hasScrim);
		}
	});

	// Fade the scrim out for the exit. Separate from the effect above because it
	// runs on the *closing* edge, which that one returns early on.
	$effect(() => {
		if (!isOpen && isPresented && hasScrim) {
			handleScrimOpacity(0);
		}
	});

	function handleMotionComplete(motion: BottomSheetPanelMotion): void {
		untrack(() => {
			if (motion !== 'exiting' || isOpen) {
				return;
			}
			if (dialogEl?.open) {
				dialogEl.close();
			}
			isPresented = false;
			triggerEl?.focus();
			triggerEl = null;
		});
	}

	useScrollLock(() => shouldPresent && hasScrim);
	useDevWarning(
		'BottomSheet',
		'requires a non-empty `label` for an accessible name; the open sheet ' +
			'has no built-in heading to derive one from.',
		() => isOpen && !label
	);

	function handleCancel(event: Event): void {
		event.preventDefault();
		dismissOnEscape();
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			event.preventDefault();
			dismissOnEscape();
		}
	}

	function handleClick(event: MouseEvent): void {
		if (hasScrim && event.target === event.currentTarget) {
			dismissOnLightInteraction();
		}
	}

	const dialogAttrs = $derived(bottomSheetDialogAttrs(shouldPresent, hasScrim));
	const positionerAttrs = bottomSheetPositionerAttrs(false, false);
</script>

<dialog
	bind:this={dialogEl}
	class={dialogAttrs.class}
	style={dialogAttrs.style}
	aria-label={label}
	aria-hidden={!isOpen && isPresented ? 'true' : undefined}
	aria-modal={hasScrim && isOpen ? 'true' : undefined}
	role={purpose === 'required' ? 'alertdialog' : undefined}
	inert={!isOpen && isPresented ? true : undefined}
	oncancel={handleCancel}
	onclick={handleClick}
	onkeydown={handleKeyDown}
>
	<div class={positionerAttrs.class} style={positionerAttrs.style}>
		<BottomSheetPanel
			{...rest}
			{panelState}
			{height}
			{snapPoints}
			{xstyle}
			{children}
			isSwipeDismissAllowed={purpose === 'info'}
			isPageScrollLocked={shouldPresent && hasScrim}
			onDismiss={dismissOnLightInteraction}
			onScrimOpacity={handleScrimOpacity}
			onElementChange={handlePanelElementChange}
			onMotionComplete={handleMotionComplete}
		/>
	</div>
</dialog>
