/**
 * The anchor a section title gets.
 *
 * Shared because two places have to agree on it: the topic page mints the ids,
 * and a `token-ref` block links to one by *title* — its `section` field carries
 * the human string ("Color Tokens"), not a slug. Slugifying in only one of the
 * two produced a link to `#Color Tokens`, which SvelteKit's prerender link check
 * caught.
 */
export function sectionId(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}
