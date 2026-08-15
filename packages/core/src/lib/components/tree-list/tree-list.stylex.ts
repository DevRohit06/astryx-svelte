import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `TreeList/TreeList.tsx` styles.
 *
 * Only `root` survives as an object in upstream's `dist/` — it is merged with an
 * `xstyle` spread. `list` and `header` are each applied alone at one call site,
 * so the compiler folded them into literal class strings.
 */
const styles = stylex.create({
	root: {
		position: 'relative',
		// Per-level indentation step. Public, themeable lever: a theme can retune
		// the tree's indent metric (e.g. to `var(--spacing-5)`) via `defineTheme`
		// on the `tree-list` target, and both the row margins (TreeListItem) and
		// the guide-line offsets (TreeListBranches) read it so they stay aligned.
		'--tree-list-indent': spacingVars['--spacing-4'],
		// Vertical gap between adjacent rows. Public, themeable lever (default
		// `--spacing-0-5` = 2px for a subtle separation between rows). A theme sets
		// it on the `tree-list` target to widen or close the gap; the guide
		// connector spans the gap natively (see `tree-list-branches`) so the line
		// stays continuous and does not overhang the last row — no consumer-side
		// guide tuning needed.
		'--tree-list-row-gap': spacingVars['--spacing-0-5']
	},
	list: {
		margin: 0,
		padding: 0,
		listStyleType: 'none'
	},
	header: {
		marginBottom: spacingVars['--spacing-2']
	}
});

/** The positioned wrapper around the header and the tree. */
export function treeListRootAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

/** The `role="tree"` `<ul>`. */
export function treeListListAttrs(): SvelteStyleAttrs {
	return sx(styles.list);
}

/** The header block above the tree. */
export function treeListHeaderAttrs(): SvelteStyleAttrs {
	return sx(styles.header);
}
