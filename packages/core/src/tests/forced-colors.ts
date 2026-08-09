/**
 * Counterpart to Astryx's `src/__tests__/forcedColors.ts`.
 *
 * jsdom cannot emulate `@media (forced-colors: active)` rendering, so upstream's
 * component tests assert the next-best thing: that the compiled output actually
 * *contains* the forced-colors rules a component relies on for Windows High
 * Contrast (WCAG 1.4.11). Chromium can't emulate it from inside a test page
 * either, so this port keeps that shape — but it cannot keep upstream's
 * implementation.
 *
 * **Why not a straight transcription.** Upstream scans every injected rule and
 * substring-matches the whole document, which is sound *there* because its dev
 * runtime injects only the modules a test file imported — a `Skeleton.test.tsx`
 * that imports only `Skeleton` sees only Skeleton's rules. This harness is the
 * opposite: `setup-stylex.ts` loads the package's entire compiled sheet into
 * every test page on purpose (see the file for why). A global
 * `toContain('background-color: canvastext;')` would therefore pass for
 * `checkbox-input` on the strength of `radio-list-item`'s rule, and keep passing
 * after the component's own rule was deleted. The assertion would be vacuous.
 *
 * So the scan is scoped to the atomic classes actually present on the rendered
 * subtree(s) handed in. Same assertions, same meaning, and they fail when the
 * component under test loses its rule.
 *
 * A style key that only lands in one state (the switch's off-track, its
 * disabled border) needs that state rendered for its class to be in scope —
 * hence the variadic roots: pass one container per variant and the union is
 * scanned.
 */

/** Every class name appearing on `root` or any of its descendants. */
function classesIn(roots: readonly Element[]): Set<string> {
	const classes = new Set<string>();
	for (const root of roots) {
		for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
			for (const name of Array.from(el.classList)) {
				classes.add(name);
			}
		}
	}
	return classes;
}

/** Whether a selector targets any of `classes`. */
function selectorTargets(selectorText: string, classes: Set<string>): boolean {
	// StyleX emits single-class selectors, optionally decorated with
	// pseudo-classes, `:where(...)` scopes and at-rule nesting. Pulling the class
	// tokens out is enough to attribute a rule to an element.
	for (const match of selectorText.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
		if (classes.has(match[1])) {
			return true;
		}
	}
	return false;
}

interface MatchedRule {
	/** The at-rule conditions this rule sits under, outermost first. */
	conditions: string[];
	cssText: string;
}

/**
 * Every style rule in the document that targets one of `classes`, tagged with
 * the at-rule conditions it is nested under (`@media`, `@supports`; `@layer` and
 * other unconditional groupings contribute nothing).
 */
function matchedRules(classes: Set<string>): MatchedRule[] {
	const out: MatchedRule[] = [];

	// `selectorText` is the discriminator, *not* the presence of `cssRules`.
	// Since CSS Nesting shipped, `CSSStyleRule` extends `CSSGroupingRule` and
	// carries a (usually empty) `cssRules` of its own — so a grouping-first check
	// recurses into every style rule and records none of them, and every scan
	// comes back empty.
	function visit(rules: CSSRuleList, conditions: string[]): void {
		for (const rule of Array.from(rules)) {
			const { selectorText } = rule as CSSStyleRule;
			const nested = (rule as CSSGroupingRule).cssRules;
			if (typeof selectorText === 'string') {
				if (selectorTargets(selectorText, classes)) {
					out.push({ conditions, cssText: rule.cssText });
				}
				continue;
			}
			if (nested != null) {
				const condition = (rule as CSSMediaRule).conditionText;
				visit(nested, condition ? [...conditions, condition] : conditions);
			}
		}
	}

	for (const sheet of Array.from(document.styleSheets)) {
		try {
			visit(sheet.cssRules, []);
		} catch {
			// Cross-origin sheet — not ours.
		}
	}
	return out;
}

/**
 * The declarations that apply to the given subtree(s) under
 * `@media (forced-colors: active)`, as one string for substring assertions.
 *
 * Upstream's `getForcedColorsRules()`, scoped.
 */
export function forcedColorsCssIn(...roots: Element[]): string {
	return matchedRules(classesIn(roots))
		.filter((rule) => rule.conditions.some((c) => c.includes('forced-colors: active')))
		.map((rule) => rule.cssText)
		.join('\n');
}

/**
 * Every rule that applies to the given subtree(s), regardless of condition, each
 * line prefixed with the at-rule conditions it sits under.
 *
 * Upstream's `getAllInjectedCss()`, scoped. Use it for declarations that live
 * *outside* `@media (forced-colors: active)` yet exist for forced-colors support
 * — `forced-color-adjust: none` (unconditional), or a hover tint gated behind
 * `(forced-colors: none)` so it cannot override the forced-colors state. The
 * condition prefix is what makes the latter assertable at all: the gate is in
 * the at-rule, not in any declaration.
 */
export function cssIn(...roots: Element[]): string {
	return matchedRules(classesIn(roots))
		.map((rule) => `${rule.conditions.join(' and ')} { ${rule.cssText} }`)
		.join('\n');
}
