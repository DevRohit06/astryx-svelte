<script lang="ts">
	import { bottomSheetEdgeTintAttrs } from './bottom-sheet-edge-tint.stylex.js';

	/**
	 * Ported from Astryx's `BottomSheet/BottomSheetEdgeTint.tsx`.
	 *
	 * iOS 26 Safari dropped `<meta name="theme-color">` and instead derives the
	 * colour it paints behind its translucent toolbars by sampling the page: it
	 * hit tests a point just inside each viewport edge, walks up to the nearest
	 * `fixed`/`sticky` ancestor, and extends that element's declared
	 * `background-color` into the browser chrome.
	 *
	 * A modal sheet is served by that heuristic already — WebKit has a dedicated
	 * branch for a dialog's `::backdrop`. A non-modal sheet is not: the nearest
	 * fixed ancestor of the panel is the sheet's own full-viewport `<dialog>`,
	 * which is transparent and viewport-sized, and WebKit answers a viewport-sized
	 * candidate by *keeping the colour it already had* — the host page's. The page
	 * then shows through behind the address bar while the sheet covers the screen
	 * above it.
	 *
	 * This element gives the heuristic something unambiguous to sample: fixed,
	 * full width, flush with the bottom edge, taller than WebKit's 10px minimum
	 * for reading a declared colour, and painted in the sheet's own surface
	 * colour. It is masked out so it never renders for the user; Safari reads the
	 * computed style, not the painted pixels.
	 *
	 * Everywhere else it is inert decoration.
	 *
	 * Takes no props and is not exported from the barrel — upstream keeps it
	 * private, rendered only by the two sheet hosts when they are non-modal.
	 */
	const attrs = bottomSheetEdgeTintAttrs();
</script>

<div class={attrs.class} style={attrs.style} data-sheet-edge-tint="" aria-hidden="true"></div>
