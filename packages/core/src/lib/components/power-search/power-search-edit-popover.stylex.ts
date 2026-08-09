import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { spacingVars, typeScaleVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `PowerSearchEditPopover.tsx` styles — one group, eleven
 * keys, every call site passing exactly one key unconditionally, so the compiler
 * folded all of them into literal class strings: `inline` mode throughout.
 *
 * **`nestedRow` is declared upstream and referenced nowhere**, and it is kept
 * here because the source is the contract — a silently-dropped declaration is
 * the kind of divergence this port exists to avoid. It needs **no oracle skip**,
 * which is worth stating because the opposite is the obvious guess: StyleX
 * dead-code-eliminates it from *our* compiled module too, since this file
 * exports no attrs function that reads it, exactly as upstream's build
 * eliminates it. Both sides emit the `width: 100%` rule into the stylesheet and
 * neither attaches it to an element, so the two agree completely and there is no
 * absence to excuse. A skip would in fact *fail* the run as stale, the check
 * doing its job. The guarantee a skip would have bought is already unconditional:
 * if upstream ever applies `nestedRow`, its `dist/` grows a call site this case
 * does not claim and the leftover check exits 1.
 *
 * `operatorSelector` is used at two nesting depths — the top-level operator slot
 * and, inside `NestedEditor`, wrapped by `nestedRootLabel`.
 */
const styles = stylex.create({
	container: {
		overflow: 'hidden'
	},
	content: {
		padding: spacingVars['--spacing-4']
	},
	footer: {
		padding: spacingVars['--spacing-3'],
		paddingTop: 0
	},
	fieldSelector: {
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 0
	},
	operatorSelector: {
		flexGrow: 1,
		flexShrink: 0
	},
	valueEditor: {
		flexGrow: 2,
		minWidth: 0
	},
	// Nested editor styles
	nestedRootLabel: {
		fontSize: typeScaleVars['--text-label-size']
	},
	nestedFieldSelector: {
		flexShrink: 0,
		width: 200
	},
	nestedOperatorSelector: {
		flexShrink: 0,
		width: 180
	},
	nestedRow: {
		width: '100%'
	},
	nestedRowValueEditor: {
		flexGrow: 2,
		flexShrink: 1,
		minWidth: 0
	}
});

/** The popover's outermost `<div>`, which also carries the key handler. */
export function editPopoverContainerAttrs(): SvelteStyleAttrs {
	return sx(styles.container);
}

/** The padded body above the footer. */
export function editPopoverContentAttrs(): SvelteStyleAttrs {
	return sx(styles.content);
}

/** The Cancel/Apply row. */
export function editPopoverFooterAttrs(): SvelteStyleAttrs {
	return sx(styles.footer);
}

/** Wrapper around the field `Selector`. */
export function editPopoverFieldSelectorAttrs(): SvelteStyleAttrs {
	return sx(styles.fieldSelector);
}

/** Wrapper around the operator `Selector`, at both nesting depths. */
export function editPopoverOperatorSelectorAttrs(): SvelteStyleAttrs {
	return sx(styles.operatorSelector);
}

/** Wrapper around the value editor, and the autofocus query's root. */
export function editPopoverValueEditorAttrs(): SvelteStyleAttrs {
	return sx(styles.valueEditor);
}

/** The nested editor's tree-root label. */
export function editPopoverNestedRootLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.nestedRootLabel);
}

/** Wrapper around a nested row's field `Selector`. */
export function editPopoverNestedFieldSelectorAttrs(): SvelteStyleAttrs {
	return sx(styles.nestedFieldSelector);
}

/** Wrapper around a nested row's operator `Selector`. */
export function editPopoverNestedOperatorSelectorAttrs(): SvelteStyleAttrs {
	return sx(styles.nestedOperatorSelector);
}

/** Wrapper around a nested row's value editor. */
export function editPopoverNestedRowValueEditorAttrs(): SvelteStyleAttrs {
	return sx(styles.nestedRowValueEditor);
}
