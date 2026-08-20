import * as stylex from '@stylexjs/stylex';
// Relative, not `$lib/…`: StyleX's Babel plugin resolves this specifier itself
// (`unstable_moduleResolution`) to derive the token variable names, and it knows
// nothing of SvelteKit's alias. Every `.stylex.ts` under `src/lib` reaches the
// tokens the same way.
import { colorVars } from '../../lib/styles/tokens.stylex.js';

/**
 * The local StyleX probe upstream's `StatusDot.test.tsx` declares inline, in its
 * `variant ink (a passed icon paints from currentColor)` block.
 *
 * StyleX may only be imported from a `.ts`/`.stylex.ts` module — the bundler
 * plugin Babel-parses anything importing `@stylexjs/stylex` — so the probe lives
 * beside the suite rather than inside it (the `avatar-status-dot-probe.stylex.ts`
 * precedent). The compiler emits one deterministic atomic class per
 * property/value pair, so carrying the probe's classes *is* having the
 * declarations.
 */
export const probe = stylex.create({
	warning: {
		backgroundColor: colorVars['--color-warning'],
		color: colorVars['--color-on-warning']
	}
});

/**
 * The atomic classes a probe style resolves to.
 *
 * Dev mode prepends a per-file `File__style.key` debug class that legitimately
 * differs between the probe and the component, so it is filtered out — exactly
 * as upstream's `.filter(cls => !cls.includes('__'))` does.
 */
export function atomicClasses(style: unknown): string[] {
	return (stylex.props(style as never).className ?? '')
		.split(' ')
		.filter((cls) => cls !== '' && !cls.includes('__'));
}
