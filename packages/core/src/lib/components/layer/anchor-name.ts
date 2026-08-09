/**
 * Anchor-name list helpers, ported from Astryx's `Layer/anchorName.ts`.
 *
 * CSS `anchor-name` is a comma-separated list, so multiple layers can anchor to
 * the same element (e.g. several TopNavMegaMenus anchored to one `<nav>`). These
 * helpers add/remove a single layer's anchor id without clobbering the others —
 * overwriting the whole property would break every sibling layer's positioning.
 *
 * There is no React here, so this is a transcription, and so is its test suite.
 */

export function readAnchorNames(el: HTMLElement): string[] {
	const value = (el.style as unknown as Record<string, string>).anchorName ?? '';
	return value
		.split(',')
		.map((name) => name.trim())
		.filter(Boolean);
}

export function writeAnchorNames(el: HTMLElement, names: string[]): void {
	(el.style as unknown as Record<string, string>).anchorName = names.join(', ');
}

export function addAnchorName(el: HTMLElement, name: string): void {
	const names = readAnchorNames(el);
	if (!names.includes(name)) {
		names.push(name);
		writeAnchorNames(el, names);
	}
}

export function removeAnchorName(el: HTMLElement, name: string): void {
	writeAnchorNames(
		el,
		readAnchorNames(el).filter((existing) => existing !== name)
	);
}
