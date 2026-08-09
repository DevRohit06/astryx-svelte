import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Breadcrumbs/Breadcrumbs.tsx` styles — the `<nav>`
 * landmark and the `<ol>` inside it.
 *
 * `navStyles.root` reaches `stylex.props` beside an `xstyle` spread, so
 * upstream's `dist/` keeps it as an object; the list is a single call site the
 * compiler folded into a literal class string.
 */
const navStyles = stylex.create({
	root: {
		display: 'block'
	}
});

const listStyles = stylex.create({
	root: {
		display: 'flex',
		alignItems: 'center',
		flexWrap: 'wrap',
		listStyle: 'none',
		margin: 0,
		padding: 0,
		gap: spacingVars['--spacing-1']
	}
});

/** The `<nav>` landmark. */
export function breadcrumbsNavAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(navStyles.root, xstyle);
}

/** The `<ol>` holding the trail. */
export function breadcrumbsListAttrs(): SvelteStyleAttrs {
	return sx(listStyles.root);
}
