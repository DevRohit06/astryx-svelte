import * as stylex from '@stylexjs/stylex';
import type { StyleArg } from '../../internal/sx.js';

/**
 * Ported from Astryx's `Selector/SelectorOption.tsx`, where the one style group
 * is declared inline in the component file under the name `embeddedStyles`.
 *
 * It is never resolved to a class here — it is handed to `Item`'s `xstyle` as
 * `[embeddedStyles.root, xstyle]`, so `Item`'s own `stylex.props` call merges it
 * — hence a raw `StyleArg` export rather than an `sx()` wrapper.
 */

const embeddedStyles = stylex.create({
	root: {
		paddingBlock: 0,
		paddingInline: 0,
		borderRadius: 0
	}
});

/** Strips `Item`'s own padding and radius so the option row owns them. */
export const selectorOptionRootStyle: StyleArg = embeddedStyles.root;
