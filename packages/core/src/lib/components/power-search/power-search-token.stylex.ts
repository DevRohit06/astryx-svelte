import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import { fontWeightVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `PowerSearchToken.tsx` styles.
 *
 * One key, one call site, folded by the compiler into a literal class string —
 * `inline` mode for the oracle.
 *
 * **This is a second, identical declaration of the same style.**
 * `PowerSearch.tsx` declares its own `tokenValueStyles.value` with the same
 * single property, and the two compile to the same atomic class. Upstream keeps
 * them separate because the two files render tokens independently
 * (`PowerSearch` never imports `PowerSearchToken` — see that component's note),
 * so this port keeps them separate too rather than sharing one module: merging
 * them would couple two files upstream deliberately does not couple, and the
 * oracle checks each file's call sites against its own `dist/` counterpart.
 */
const tokenValueStyles = stylex.create({
	value: {
		fontWeight: fontWeightVars['--font-weight-bold']
	}
});

/** The `<span>` carrying the formatted filter value inside the token. */
export function powerSearchTokenValueAttrs(): SvelteStyleAttrs {
	return sx(tokenValueStyles.value);
}
