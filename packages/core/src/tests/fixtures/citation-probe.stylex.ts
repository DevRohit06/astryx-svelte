import * as stylex from '@stylexjs/stylex';
// Relative, not `$lib/…`, and that is load-bearing. A StyleX var reference is
// hashed from the *defining* module's resolved path, and the plugin's Babel pass
// resolves import specifiers on its own with no knowledge of Vite's aliases. A
// `$lib` specifier would either fail to resolve or hash differently, and the
// probe would mint classes that could never match the component's.
import { colorVars } from '../../lib/styles/tokens.stylex.js';

/**
 * Upstream's `Citation.test.tsx` declares these four probe styles inline at the
 * top of the file. StyleX may only be imported from a `.ts`/`.stylex.ts` module
 * — the bundler plugin Babel-parses anything importing it — so they live here,
 * following the `xstyle-probe.stylex.ts` precedent.
 *
 * StyleX emits one deterministic atomic class per property/value pair, so an
 * element carries a probe's class exactly when it has the same declaration.
 */
const probe = stylex.create({
	secondaryText: { color: colorVars['--color-text-secondary'] },
	accentText: { color: colorVars['--color-text-accent'] },
	badgeBackground: { backgroundColor: colorVars['--color-accent-muted'] },
	pointerCursor: { cursor: 'pointer' }
});

type StyleXPropsResult = { className?: string };

/**
 * The atomic classes a probe style resolves to.
 *
 * Upstream filters the comparison with `!c.includes('__')`, excluding the
 * dev-mode debug class that varies by source location. This repo's plugin
 * version spells that debug class `module.styleName` rather than with a double
 * underscore, so the filter is written as a positive match on StyleX's atomic
 * form (`x` + hash) instead — the same exclusion, expressed so it holds under
 * either spelling. `xstyle.svelte.test.ts` already filters this way.
 */
export function atomicClasses(key: keyof typeof probe): string[] {
	const { className = '' } = (stylex.props as unknown as (s: unknown) => StyleXPropsResult)(
		probe[key]
	);
	return className.split(' ').filter((c) => /^x[a-z0-9]+$/.test(c));
}
