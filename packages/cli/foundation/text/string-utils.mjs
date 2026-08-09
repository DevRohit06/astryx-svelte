/**
 * @file String utilities — fuzzy matching and semantic search for component names
 */

// levenshteinDistance lives in its own pure module so browser-bundled code
// (the XLE/XLO language) can use it without this file's dynamic node:fs/path
// imports landing in the bundler graph. Re-exported for existing consumers.
import { levenshteinDistance } from './levenshtein.mjs';
export { levenshteinDistance } from './levenshtein.mjs';

/**
 * Find the closest component names to a given (possibly misspelled) name.
 * Returns matches sorted by distance, filtered to maxDistance.
 * @param {string} name
 * @param {Record<string, string[]>} components
 * @param {number} [maxDistance]
 * @returns {{name: string, distance: number}[]}
 */
export function findClosestComponents(name, components, maxDistance = 3) {
	const allNames = Object.values(components).flat();
	const needle = name.toLowerCase();

	const matches = allNames
		.map((comp) => ({
			name: comp,
			distance: levenshteinDistance(needle, comp.toLowerCase())
		}))
		.filter((m) => m.distance <= maxDistance)
		.sort((a, b) => a.distance - b.distance);

	return matches;
}

/**
 * Unified component search that scores matches across multiple signals:
 * name similarity, keyword matches, and description/feature text search.
 *
 * Always returns results (top 5 minimum). Scores determine confidence:
 *   100  exact name match
 *    90  exact keyword match
 *    80  name Levenshtein distance 1
 *    70  keyword substring or Levenshtein distance 1
 *    60  substring match on component name (min 4 chars, 50%+ coverage)
 *    50  description or feature text contains the search term
 *    40  name Levenshtein distance 2
 *    30  keyword Levenshtein distance 2
 *    20  name Levenshtein distance 3
 *
 * Each result: { name, score, reason }
 *
 * Pass 2 reads `.doc.mjs` files out of core. It landed in slice 2 finding
 * nothing — core shipped no docs then, and the probe was a literal port of
 * upstream's `<core>/src/<Name>/<Name>.doc.mjs` path, which is never a real path
 * here. **Slice 4 wired it up**, and it is not a nicety: without Pass 2 the
 * keyword scores never appear, so `component button` auto-resolves to `Button`
 * on an unopposed 100 instead of refusing a case-mismatched name — the ported
 * `is case-SENSITIVE` case fails on the gap rule, not on the lookup.
 *
 * Two changes, both forced by what core actually ships: the lookup goes through
 * `findComponentReadme` (the doc index) rather than guessing a path, and the
 * module is read as `default ?? docs`, because every doc core ships is the
 * stamped default-export form.
 *
 * @param {string} needle
 * @param {string} coreDir
 * @param {Record<string, string[]>} components
 * @returns {Promise<{name: string, score: number, reason: string}[]>}
 */
export async function searchComponents(needle, coreDir, components) {
	const { pathToFileURL } = await import('node:url');
	const { findComponentReadme } = await import('../discovery/component-discovery.mjs');

	const term = needle.toLowerCase();
	const allNames = Object.values(components).flat();
	/** @type {Map<string, {name: string, score: number, reason: string}>} */
	const scored = new Map();

	/**
	 * @param {string} name
	 * @param {number} score
	 * @param {string} reason
	 */
	function addMatch(name, score, reason) {
		const existing = scored.get(name);
		if (!existing || score > existing.score) {
			scored.set(name, { name, score, reason });
		}
	}

	// --- Pass 1: Name matching (sync, fast) ---
	for (const comp of allNames) {
		const compLower = comp.toLowerCase();

		// Exact name
		if (compLower === term) {
			addMatch(comp, 100, 'exact name');
			continue;
		}

		// Substring match on name (both directions)
		const shorter = term.length < compLower.length ? term : compLower;
		const longer = term.length < compLower.length ? compLower : term;
		if (shorter.length >= 4 && longer.includes(shorter)) {
			const coverage = shorter.length / longer.length;
			if (coverage >= 0.5) {
				addMatch(comp, 60, 'name contains "' + shorter + '"');
			}
		}

		// Levenshtein on name
		const dist = levenshteinDistance(term, compLower);
		if (dist === 1) addMatch(comp, 80, 'similar name (distance ' + dist + ')');
		else if (dist === 2) addMatch(comp, 40, 'similar name (distance ' + dist + ')');
		else if (dist === 3) addMatch(comp, 20, 'similar name (distance ' + dist + ')');
	}

	// --- Pass 2: Keyword + description matching (async, reads doc files) ---
	for (const comp of allNames) {
		/** @type {string | null} */
		let docPath;
		try {
			docPath = findComponentReadme(coreDir, comp);
		} catch {
			// A coreDir with no source tree scores on Pass 1 alone.
			break;
		}

		if (!docPath || !docPath.endsWith('.doc.mjs')) continue;

		try {
			const mod = await import(pathToFileURL(docPath).href);
			const docs = mod.default ?? mod.docs;
			if (!docs) continue;

			// Keyword matching
			if (docs.keywords && Array.isArray(docs.keywords)) {
				for (const kw of docs.keywords) {
					const kwLower = kw.toLowerCase();

					// Exact keyword
					if (kwLower === term) {
						addMatch(comp, 90, 'keyword "' + kw + '"');
						break;
					}

					// Substring: term contains keyword or keyword contains term
					const s = term.length < kwLower.length ? term : kwLower;
					const l = term.length < kwLower.length ? kwLower : term;
					if (s.length >= 4 && l.includes(s)) {
						const coverage = s.length / l.length;
						if (coverage >= 0.5) {
							addMatch(comp, 70, 'keyword "' + kw + '"');
						}
					}

					const dist = levenshteinDistance(term, kwLower);
					if (dist === 1) addMatch(comp, 70, 'keyword "' + kw + '" (distance ' + dist + ')');
					else if (dist === 2) addMatch(comp, 30, 'keyword "' + kw + '" (distance ' + dist + ')');
				}
			}

			// Description search (whole word boundary)
			const searchDesc = docs.usage?.description || docs.description;
			if (searchDesc && term.length >= 3) {
				const descLower = searchDesc.toLowerCase();
				const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const re = new RegExp('\\b' + escaped + '\\b');
				if (re.test(descLower)) {
					addMatch(comp, 50, 'description mentions "' + term + '"');
				}
			}

			// Best practices search (whole word boundary)
			const bestPractices = docs.usage?.bestPractices;
			if (bestPractices && Array.isArray(bestPractices) && term.length >= 3) {
				for (const bp of bestPractices) {
					const bpLower = bp.description.toLowerCase();
					const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					const re = new RegExp('\\b' + escaped + '\\b');
					if (re.test(bpLower)) {
						addMatch(comp, 50, 'best practice mentions "' + term + '"');
						break;
					}
				}
			}
		} catch {
			continue;
		}
	}

	const results = Array.from(scored.values()).sort(
		(a, b) => b.score - a.score || a.name.localeCompare(b.name)
	);

	return results;
}
