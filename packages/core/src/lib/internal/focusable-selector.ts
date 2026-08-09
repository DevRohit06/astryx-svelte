/**
 * Ported from Astryx's `hooks/focusableSelector.ts`.
 *
 * Upstream's header calls it an internal implementation detail, deliberately
 * kept out of the public barrel and shared by the focus-management hooks so the
 * selector is written once. It lives under `internal/` here for the same reason.
 */

/**
 * Canonical CSS selector for commonly focusable elements. Includes the
 * tabbable natives (button/link/input/select/textarea/[tabindex]) plus
 * editable and media elements the browser also puts in the tab order —
 * contenteditable, media with controls, iframe, and an open <details>'s
 * <summary> — which a naive selector misses, letting Tab escape a trap whose
 * only interactive content is (e.g.) a contenteditable composer (infra-8).
 *
 * This is the canonical focusable selector; prefer importing it here over
 * re-declaring the string so behavior stays consistent across hooks.
 */
export const FOCUSABLE_SELECTOR =
	'button:not([disabled]), a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), [contenteditable]:not([contenteditable="false"]), audio[controls], video[controls], iframe, details > summary:first-child';
