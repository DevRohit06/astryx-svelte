import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	shadowVars,
	spacingVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `ContextMenu/ContextMenu.tsx` styles.
 *
 * `trigger`, `menu` and `popover` survive as objects in upstream's `dist/` (each
 * merges with an `xstyle` spread, a width branch or a spread array);
 * `cursorAnchor` is the single inline call site.
 */
const styles = stylex.create({
	// Trigger wrapper: suppress the iOS long-press callout/selection so the
	// long-press opens our context menu instead of the native text/callout UI.
	// `position: relative` establishes the containing block for the absolutely
	// positioned cursor anchor below, so the anchor point tracks the trigger
	// (and scrolls with it) instead of the page.
	trigger: {
		position: 'relative',
		WebkitTouchCallout: 'none'
	},
	// Zero-size anchor placed at the cursor point within the trigger. The menu is
	// anchored to this element, so it sits under the cursor yet is positioned
	// relative to the trigger's context — it follows the content on scroll and
	// the browser can auto-flip it against the viewport edges.
	cursorAnchor: {
		position: 'absolute',
		width: 0,
		height: 0,
		pointerEvents: 'none'
	},
	menu: {
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-0-5'],
		maxHeight: '300px',
		overflowY: 'auto',
		'--_dropdown-menu-radius': radiusVars['--radius-container'],
		'--_dropdown-menu-padding': spacingVars['--spacing-1'],
		padding: spacingVars['--spacing-1'],
		borderRadius: 'var(--_dropdown-menu-radius)',
		backgroundColor: colorVars['--color-background-popover'],
		boxShadow: shadowVars['--shadow-low'],
		opacity: 1,
		transitionProperty: 'opacity',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		userSelect: 'none'
	},
	popover: {
		minWidth: '160px'
	},
	popoverCustomWidth: (width: string | number) => ({
		minWidth: typeof width === 'number' ? `${width}px` : width
	})
});

/** The right-click target wrapper. */
export function contextMenuTriggerAttrs(triggerXstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.trigger, ...(Array.isArray(triggerXstyle) ? triggerXstyle : [triggerXstyle]));
}

/** The zero-size anchor placed at the cursor point. */
export function contextMenuCursorAnchorAttrs(): SvelteStyleAttrs {
	return sx(styles.cursorAnchor);
}

/** The `role="menu"` surface. */
export function contextMenuAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.menu, xstyle);
}

/** The popover container's width — the default floor, or a caller's override. */
export function contextMenuPopoverXstyle(menuWidth: number | string | undefined): StyleArg {
	return menuWidth ? styles.popoverCustomWidth(menuWidth) : styles.popover;
}
