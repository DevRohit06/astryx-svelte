import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars } from '../../styles/tokens.stylex.js';
import type { ListMarkerStyle } from './list-context.svelte.js';

/**
 * Ported from Astryx's `List/List.tsx` styles.
 *
 * `root` and `header` only exist on the header branch's two wrapper divs, which
 * is why upstream's compiler folded them into literal class strings and left no
 * object behind in `dist/`.
 */
const styles = stylex.create({
	root: {
		display: 'flex',
		flexDirection: 'column'
	},
	list: {
		margin: 0,
		paddingInlineStart: 0,
		listStyleType: 'none',
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5']
	},
	withDividers: {
		gap: 0
	},
	withCounter: {
		counterReset: 'astryx-list'
	},
	header: {
		marginBottom: spacingVars['--spacing-2']
	}
});

const dynamicStyles = stylex.create({
	counterStart: (value: number) => ({
		counterReset: `astryx-list ${value}`
	})
});

/** The column wrapper around a header + its list. Header branch only. */
export function listRootAttrs(): SvelteStyleAttrs {
	return sx(styles.root);
}

/** The header block above the list. */
export function listHeaderAttrs(): SvelteStyleAttrs {
	return sx(styles.header);
}

/**
 * The `<ul>`/`<ol>` itself. A marker style seeds the CSS counter — at
 * `start - 1`, since the first item's `counter-increment` runs before its
 * `::before` reads it.
 */
export function listAttrs(
	hasDividers: boolean,
	listStyle: ListMarkerStyle,
	start: number | undefined,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.list,
		hasDividers && styles.withDividers,
		listStyle !== 'none' &&
			(start != null && start !== 1 ? dynamicStyles.counterStart(start - 1) : styles.withCounter),
		xstyle
	);
}
