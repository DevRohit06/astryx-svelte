import * as stylex from '@stylexjs/stylex';
import { radiusVars, borderVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `InputGroup/groupStyles.ts`.
 *
 * The style a member control (`TextInput`, `NumberInput`, `DateInput`,
 * `Selector`, …) applies to its own wrapper when it sits inside an `InputGroup`.
 * It is a shared module rather than part of `input-group.stylex.ts` precisely
 * because those consumers import it directly: the group joins its children by
 * collapsing their touching borders and rounding only the outer corners, and it
 * is each child that carries the rule.
 *
 * Upstream keeps this out of the public `InputGroup/index.ts` barrel — consumers
 * import `./groupStyles` directly — so this module is likewise internal.
 *
 * The four-class radius corners are load-bearing: the `:has(+ [popover]…)`
 * selectors round the trailing member even when the *last* DOM sibling is a
 * popover it owns (a `Selector`/`DateInput`'s dropdown). `InputGroupText` drops
 * those variants because a text addon never has a popover sibling — do not copy
 * one shape onto the other.
 */
export const groupStyles = stylex.create({
	inGroup: {
		flex: 1,
		minWidth: 0,
		height: '100%',
		marginInlineStart: {
			default: `calc(-1 * ${borderVars['--border-width']})`,
			':first-child': 0
		},
		borderStartStartRadius: {
			default: 0,
			':first-child': radiusVars['--radius-element']
		},
		borderEndStartRadius: {
			default: 0,
			':first-child': radiusVars['--radius-element']
		},
		borderStartEndRadius: {
			default: 0,
			':last-child': radiusVars['--radius-element'],
			':has(+ [popover]:last-child)': radiusVars['--radius-element'],
			':has(+ [popover] + [popover]:last-child)': radiusVars['--radius-element']
		},
		borderEndEndRadius: {
			default: 0,
			':last-child': radiusVars['--radius-element'],
			':has(+ [popover]:last-child)': radiusVars['--radius-element'],
			':has(+ [popover] + [popover]:last-child)': radiusVars['--radius-element']
		},
		':focus-within': {
			zIndex: 1
		}
	}
});
