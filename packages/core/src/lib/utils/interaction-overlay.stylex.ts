import * as stylex from '@stylexjs/stylex';
import { colorVars } from '../styles/tokens.stylex.js';

/**
 * The shared hover and pressed overlay states, ported from Astryx's
 * `utils/interactionOverlay.stylex.ts`. New at upstream 0.5.1, which added it
 * to make a pressed overlay reliably override a hover one across every
 * interactive surface.
 *
 * **Keep the enabled guard outside the individual states.** StyleX assigns an
 * extra priority bucket (and generated selector specificity) to media-nested
 * rules. Repeating `:active` inside the hover-capable branch gives hover and
 * press the same generated specificity; StyleX's native pseudo-state ordering
 * then emits `:active` last. The bare `:active` branch remains the touch
 * fallback, where `(hover: hover)` does not match.
 *
 * Barrel-absent, as upstream leaves it — it is an internal styling utility, and
 * an extra published symbol is a defect under the parity rule. Its sibling
 * `focus-outline.stylex.ts` *is* exported here because upstream exports that one.
 */

const ENABLED = ':where(:not(:disabled,[aria-disabled="true"]))';
const HOVER_HOVER = '@media (hover: hover)';

const hoverImage = `linear-gradient(${colorVars['--color-overlay-hover']}, ${colorVars['--color-overlay-hover']})`;
const pressedImage = `linear-gradient(${colorVars['--color-overlay-pressed']}, ${colorVars['--color-overlay-pressed']})`;
const neutralImage = `linear-gradient(${colorVars['--color-neutral']}, ${colorVars['--color-neutral']})`;

export const interactionOverlayStyles = stylex.create({
	backgroundColor: {
		backgroundColor: {
			default: 'transparent',
			[ENABLED]: {
				default: null,
				':active': colorVars['--color-overlay-pressed'],
				[HOVER_HOVER]: {
					default: null,
					':hover': colorVars['--color-overlay-hover'],
					':active': colorVars['--color-overlay-pressed']
				}
			}
		}
	},
	backgroundImage: {
		backgroundImage: {
			default: null,
			[ENABLED]: {
				default: null,
				':active': pressedImage,
				[HOVER_HOVER]: {
					default: null,
					':hover': hoverImage,
					':active': pressedImage
				}
			}
		}
	},
	backgroundImageOnNeutral: {
		backgroundImage: {
			default: neutralImage,
			[ENABLED]: {
				default: null,
				':active': `${pressedImage}, ${neutralImage}`,
				[HOVER_HOVER]: {
					default: null,
					':hover': `${hoverImage}, ${neutralImage}`,
					':active': `${pressedImage}, ${neutralImage}`
				}
			}
		}
	}
});
