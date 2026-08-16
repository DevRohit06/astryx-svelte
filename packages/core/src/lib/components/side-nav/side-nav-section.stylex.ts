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
 * That hiding is **not** StyleX on either side, and as of upstream 0.4.2 it is
 * not local either: both sides render the hidden branch through the shared
 * `VisuallyHidden` component rather than a hand-rolled clip rectangle, so the
 * treatment is maintained in one place. Nothing about it reaches this module.
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
