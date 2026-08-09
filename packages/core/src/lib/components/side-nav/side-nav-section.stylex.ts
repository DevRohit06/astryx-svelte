import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `SideNav/SideNavSection.tsx` styles.
 *
 * A labelled `role="group"` of nav items. The header is *visually* hidden rather
 * than removed when `isHeaderHidden` or the sidebar is collapsed, because the
 * group's `aria-labelledby` points at the title — removing it would leave the
 * group unnamed.
 *
 * That hiding is **not** StyleX on either side: upstream writes a plain inline
 * style object and merges it after `stylex.props`, so it wins over the atomic
 * classes without needing a specificity escape. {@link sideNavSectionHiddenStyle}
 * is the same declaration as a Svelte inline-style string, and it never enters
 * the class oracle.
 */
const styles = stylex.create({
	root: {
		display: 'flex',
		flexDirection: 'column',
		paddingBlock: spacingVars['--spacing-1']
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-1'],
		cursor: 'default',
		userSelect: 'none'
	},

	titleContainer: {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
		minWidth: 0
	},
	title: {
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	subtitle: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	endContent: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center'
	},

	items: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5']
	}
});

/**
 * Upstream's `visuallyHiddenStyle` — a plain `CSSProperties` literal merged
 * after `stylex.props`, transcribed as an inline-style string. Applied to the
 * header when the section header is hidden or the sidebar is collapsed.
 */
export const sideNavSectionHiddenStyle =
	'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;' +
	'clip:rect(0, 0, 0, 0);white-space:nowrap;border-width:0';

/** The section root. */
export function sideNavSectionRootAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

/** The header row — title column plus optional end content. */
export function sideNavSectionHeaderAttrs(): SvelteStyleAttrs {
	return sx(styles.header);
}

/** The title/subtitle column. */
export function sideNavSectionTitleContainerAttrs(): SvelteStyleAttrs {
	return sx(styles.titleContainer);
}

/** The section title — the `aria-labelledby` target. */
export function sideNavSectionTitleAttrs(): SvelteStyleAttrs {
	return sx(styles.title);
}

/** The section subtitle. */
export function sideNavSectionSubtitleAttrs(): SvelteStyleAttrs {
	return sx(styles.subtitle);
}

/** The header's trailing slot. */
export function sideNavSectionEndContentAttrs(): SvelteStyleAttrs {
	return sx(styles.endContent);
}

/** The stack of nav items below the header. */
export function sideNavSectionItemsAttrs(): SvelteStyleAttrs {
	return sx(styles.items);
}
