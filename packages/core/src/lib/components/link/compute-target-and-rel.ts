/**
 * Ported from Astryx's `Link/computeTargetAndRel.ts`.
 *
 * When a link opens in a new tab, the browser hands the opened page a
 * `window.opener` reference and leaks the referrer unless `rel` says otherwise.
 * So for `target="_blank"` the safe tokens are auto-included — but only then,
 * and without disturbing any tokens the caller already set.
 */

const BLANK_TARGET_REL_TOKENS = ['noopener', 'noreferrer'];

export function computeTargetAndRel(
	target: string | undefined,
	rel: string | undefined
): { target: string | undefined; rel: string | undefined } {
	if (target !== '_blank') {
		return { target, rel };
	}

	const tokens = rel ? rel.split(/\s+/).filter(Boolean) : [];
	for (const token of BLANK_TARGET_REL_TOKENS) {
		if (!tokens.includes(token)) {
			tokens.push(token);
		}
	}

	return { target, rel: tokens.join(' ') };
}
