/**
 * Ported from upstream's `docs/inlineMarkdown.tsx`.
 *
 * The authored docs use a *small* markdown subset inline — code spans and links,
 * nothing else — and this is the renderer for it. It is deliberately **not** the
 * `<Markdown>` component, which is batch 11 and parses whole documents; the two
 * are separate upstream for the same reason.
 *
 * Upstream returns `ReactNode[]`; this returns the same segments as data, and
 * `inline-markdown.svelte` renders them. Same split as `CodeBlock`'s
 * `renderLines`, and for the same reason: a Svelte template renders data, so the
 * parser stays a pure function that is trivially testable.
 */

const TOKEN = /(`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;

export type InlineSegment =
	| { kind: 'text'; text: string }
	| { kind: 'code'; text: string }
	| { kind: 'link'; label: string; href: string; isExternal: boolean };

export function parseInlineMarkdown(text: string): InlineSegment[] {
	const segments: InlineSegment[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	// `TOKEN` is module-scoped and global, so its `lastIndex` has to be reset —
	// upstream's shares the same object across calls and gets away with it only
	// because every call runs the loop to completion.
	TOKEN.lastIndex = 0;

	while ((match = TOKEN.exec(text)) !== null) {
		if (match.index > lastIndex) {
			segments.push({ kind: 'text', text: text.slice(lastIndex, match.index) });
		}

		const code = match[2];
		const linkLabel = match[3];
		const linkHref = match[4];

		if (code != null) {
			segments.push({ kind: 'code', text: code });
		} else if (linkLabel != null && linkHref != null) {
			segments.push({
				kind: 'link',
				label: linkLabel,
				href: linkHref,
				isExternal: /^https?:\/\//.test(linkHref)
			});
		}

		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < text.length) {
		segments.push({ kind: 'text', text: text.slice(lastIndex) });
	}

	return segments;
}
