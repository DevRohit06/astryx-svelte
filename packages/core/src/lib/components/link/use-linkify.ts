/**
 * Ported from Astryx's `Link/useLinkify.tsx`.
 *
 * Scans plain text and splits it into runs of literal text and detected links
 * (URLs and emails by default, plus any caller patterns). Upstream returns
 * `ReactNode[]` — strings interleaved with `<Link>` elements — but a Svelte hook
 * cannot emit markup, so this returns **structured segments** the caller renders
 * (`{#each} … <Link>`). The segment carries only upstream's public link fields
 * (`href`, `label`, `isExternal`); the internal `start`/`end` offsets do not
 * escape. This return-shape change is the one deliberate divergence, and it is
 * why the ported suite's `toEqual(['text'])` cases become `toEqual([{ type:
 * 'text', text }])`.
 *
 * Pure — no state, no effects. Reactivity is the caller's: wrap the call in
 * `$derived` and it re-runs when `text` or the options change.
 */

/** A caller-supplied linkify rule. `pattern` must carry the global (`/g`) flag. */
export interface LinkifyPattern {
	pattern: RegExp;
	href: (match: RegExpMatchArray) => string;
	/** Display text for the match. Defaults to the whole matched substring. */
	label?: (match: RegExpMatchArray) => string;
	/**
	 * @default false
	 */
	isExternal?: boolean;
}

export interface UseLinkifyOptions {
	/** Extra patterns, matched *before* the built-ins so they win ties. */
	patterns?: LinkifyPattern[];
	/**
	 * Whether to include the built-in URL and email patterns.
	 * @default true
	 */
	hasBuiltins?: boolean;
}

/** One piece of linkified text: a literal run or a detected link. */
export type LinkifySegment =
	| { type: 'text'; text: string }
	| { type: 'link'; href: string; label: string; isExternal: boolean };

const URL_PATTERN: LinkifyPattern = {
	pattern: /https?:\/\/[^\s<>'")\]},]+/g,
	href: (match) => match[0],
	isExternal: true
};

const EMAIL_PATTERN: LinkifyPattern = {
	pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
	href: (match) => `mailto:${match[0]}`
};

const BUILTIN_PATTERNS: LinkifyPattern[] = [URL_PATTERN, EMAIL_PATTERN];

interface ResolvedMatch {
	start: number;
	end: number;
	href: string;
	label: string;
	isExternal: boolean;
}

function findMatches(text: string, patterns: LinkifyPattern[]): ResolvedMatch[] {
	const matches: ResolvedMatch[] = [];

	for (const p of patterns) {
		// Clone the regex so its `lastIndex` state is never shared or mutated
		// across calls — reusing a stateful `/g` regex is a real bug upstream
		// deliberately avoids.
		const re = new RegExp(p.pattern.source, p.pattern.flags);
		let match: RegExpExecArray | null;
		while ((match = re.exec(text)) !== null) {
			matches.push({
				start: match.index,
				end: match.index + match[0].length,
				href: p.href(match),
				label: p.label ? p.label(match) : match[0],
				isExternal: p.isExternal ?? false
			});
		}
	}

	// Stable sort by start (ES2019+), so equal-start matches keep pattern order —
	// which is what makes custom patterns win over built-ins.
	matches.sort((a, b) => a.start - b.start);

	// First-match-wins overlap resolution.
	const result: ResolvedMatch[] = [];
	let lastEnd = 0;
	for (const m of matches) {
		if (m.start >= lastEnd) {
			result.push(m);
			lastEnd = m.end;
		}
	}
	return result;
}

export function useLinkify(text: string, options: UseLinkifyOptions = {}): LinkifySegment[] {
	const { patterns: customPatterns, hasBuiltins = true } = options;

	const allPatterns: LinkifyPattern[] = [
		...(customPatterns ?? []),
		...(hasBuiltins ? BUILTIN_PATTERNS : [])
	];

	if (allPatterns.length === 0 || text.length === 0) {
		return [{ type: 'text', text }];
	}

	const matches = findMatches(text, allPatterns);
	if (matches.length === 0) {
		return [{ type: 'text', text }];
	}

	const segments: LinkifySegment[] = [];
	let lastIndex = 0;
	for (const m of matches) {
		if (m.start > lastIndex) {
			segments.push({ type: 'text', text: text.slice(lastIndex, m.start) });
		}
		segments.push({ type: 'link', href: m.href, label: m.label, isExternal: m.isExternal });
		lastIndex = m.end;
	}
	if (lastIndex < text.length) {
		segments.push({ type: 'text', text: text.slice(lastIndex) });
	}
	return segments;
}
