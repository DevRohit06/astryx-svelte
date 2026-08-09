import { Context } from 'runed';
import type { SyntaxThemeDefinition } from './define-syntax-theme.js';

/**
 * Svelte equivalent of Astryx's `SyntaxThemeContext` (declared inside
 * `theme/syntax/SyntaxTheme.tsx`).
 *
 * As every context here does, it stores a **getter** rather than the value, so a
 * consumer tracks a `theme` prop that changes rather than being stranded at its
 * mount-time definition. Upstream memoises `{theme}` on `[theme]`, which is the
 * same intent expressed the React way.
 *
 * Module-private upstream — neither the context object nor its value type is
 * published — so only the setter and the reader are exported here.
 */
export interface SyntaxThemeContextValue {
	theme: SyntaxThemeDefinition;
}

const syntaxThemeContext = new Context<() => SyntaxThemeContextValue>('astryx.syntaxTheme');

export function setSyntaxThemeContext(get: () => SyntaxThemeContextValue): void {
	syntaxThemeContext.set(get);
}

/** Returns a getter, or null when there is no enclosing `<SyntaxTheme>`. */
export function getSyntaxThemeContext(): (() => SyntaxThemeContextValue) | null {
	return syntaxThemeContext.getOr(null);
}
