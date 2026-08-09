import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';

/**
 * Styles for Timestamp, ported from Astryx's `src/Timestamp/Timestamp.tsx`.
 *
 * One style, and it is entirely a reset: the visible typography comes from the
 * wrapping `Text`, so all this does is stop the `<time>` element's own UA
 * defaults from leaking through.
 *
 * The hover surface's styles live next door in `timestamp-hover-card.stylex.ts`
 * — 0.3.0 split the card out of the component so a card-less Timestamp (the
 * default) never loads it. The focus ring that used to sit here went with the
 * old read-only tooltip: the card supplies its own dashed-underline hover
 * indication as the affordance, so the anchor needs no separate outline.
 */
const styles = stylex.create({
	time: {
		display: 'inline',
		fontFamily: 'inherit',
		fontStyle: 'normal',
		// Reset <time> element defaults
		fontSize: 'inherit',
		lineHeight: 'inherit',
		color: 'inherit',
		fontWeight: 'inherit'
	}
});

/** The `<time>` element's reset. */
export function timestampAttrs(): SvelteStyleAttrs {
	return sx(styles.time);
}
