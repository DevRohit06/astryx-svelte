/**
 * Ported from the `focusPanel` helper in Astryx's `BottomSheet/BottomSheet.tsx`.
 *
 * Its own module here rather than a file-local, because Svelte cannot export
 * from a component's instance script and both hosts — the standalone sheet and
 * the switcher item — call it. Not exported from the barrel; upstream publishes
 * nothing of it.
 *
 * `preventScroll` on both calls: presenting a sheet must not scroll the page to
 * reveal what it just focused. For an autofocused field that reveal is the
 * mobile keyboard's, and it moves the document under a fixed sheet;
 * `useMobileKeyboard` brings the field into view within the sheet instead.
 */
export function focusPanel(panel: HTMLElement | null, isModal: boolean): void {
	const activeElement = document.activeElement;
	if (activeElement != null && panel?.contains(activeElement)) {
		return;
	}
	const autofocus = panel?.querySelector<HTMLElement>('[data-autofocus]');
	if (autofocus != null) {
		autofocus.focus({ preventScroll: true });
	} else if (isModal) {
		panel?.focus({ preventScroll: true });
	}
}
