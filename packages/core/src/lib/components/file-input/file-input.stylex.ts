import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import type { InputStatusType } from '../field/types.js';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	sizeVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `FileInput/FileInput.tsx`, where the styles are inline in
 * the component file rather than in a module of their own.
 *
 * Note this component does *not* build on `Field`'s shared `inputWrapperStyles`
 * — upstream restates the whole surface twice, once dashed (`dropzone`) and once
 * solid (`compact`), because the dropzone's border style, padding and axis all
 * differ from the shared chrome. Restated here for the same reason.
 *
 * There is no `liveRegion` style: 0.2.0 moved FileInput's validation-error
 * announcement to `useAnnounce`'s shared region, and upstream deleted both the
 * style and the `role="status"` element it dressed. Ours outlived the element by
 * a batch, invisibly — it was byte-identical to `hiddenInput`, so it compiled to
 * the same atomic classes and the class oracle read the collision as a match for
 * a key upstream no longer has.
 */

const styles = stylex.create({
	dropzone: {
		boxSizing: 'border-box',
		position: 'relative',
		zIndex: 1,
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-6'],
		paddingInline: spacingVars['--spacing-4'],
		borderWidth: borderVars['--border-width'],
		borderStyle: 'dashed',
		borderColor: {
			default: colorVars['--color-border-emphasized'],
			':focus-within': colorVars['--color-accent']
		},
		borderRadius: radiusVars['--radius-element'],
		backgroundColor: colorVars['--color-background-surface'],
		transitionProperty: 'border-color, box-shadow, background-color',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		outline: 'none'
	},
	dropzoneHover: {
		boxShadow: {
			default: null,
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': `inset 0 0 0 2px color-mix(in srgb, ${colorVars['--color-accent']} 20%, transparent)`
			}
		}
	},
	dropzoneActive: {
		borderColor: colorVars['--color-accent'],
		backgroundColor: colorVars['--color-accent-muted']
	},
	dropzoneDisabled: {
		cursor: 'default',
		opacity: 0.5,
		borderColor: colorVars['--color-border-emphasized']
	},
	compact: {
		boxSizing: 'border-box',
		position: 'relative',
		zIndex: 1,
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-2'],
		borderWidth: borderVars['--border-width'],
		borderStyle: 'solid',
		borderColor: {
			default: colorVars['--color-border-emphasized'],
			':focus-within': colorVars['--color-accent']
		},
		borderRadius: radiusVars['--radius-element'],
		backgroundColor: colorVars['--color-background-surface'],
		transitionProperty: 'border-color, box-shadow',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		boxShadow: {
			default: 'none',
			':hover:not(:focus-within):where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': `inset 0 0 0 2px color-mix(in srgb, ${colorVars['--color-accent']} 20%, transparent)`
			}
		},
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		height: sizeVars['--size-element-md'],
		outline: 'none'
	},
	compactDisabled: {
		cursor: 'default',
		opacity: 0.5,
		borderColor: colorVars['--color-border-emphasized']
	},
	hiddenInput: {
		position: 'absolute',
		width: 1,
		height: 1,
		padding: 0,
		margin: -1,
		overflow: 'hidden',
		clip: 'rect(0, 0, 0, 0)',
		whiteSpace: 'nowrap',
		borderWidth: 0
	},
	placeholderText: {
		fontFamily: typographyVars['--font-family-body'],
		fontSize: {
			default: typeScaleVars['--text-body-size'],
			'@media (pointer: coarse)': `max(1rem, ${typeScaleVars['--text-body-size']})`
		},
		lineHeight: typeScaleVars['--text-body-leading'],
		color: colorVars['--color-text-secondary'],
		textAlign: 'center',
		userSelect: 'none'
	},
	fileNameText: {
		fontFamily: typographyVars['--font-family-body'],
		fontSize: {
			default: typeScaleVars['--text-body-size'],
			'@media (pointer: coarse)': `max(1rem, ${typeScaleVars['--text-body-size']})`
		},
		lineHeight: typeScaleVars['--text-body-leading'],
		color: colorVars['--color-text-primary'],
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		flex: 1,
		minWidth: 0
	},
	fileNameDropzone: {
		textAlign: 'center',
		whiteSpace: 'normal'
	},
	fileNameCompact: {
		textAlign: 'start'
	},
	placeholderCompact: {
		textAlign: 'start',
		flex: 1,
		minWidth: 0
	}
});

const statusBorderStyles = stylex.create({
	warning: {
		borderColor: colorVars['--color-warning']
	},
	error: {
		borderColor: colorVars['--color-error']
	},
	success: {
		borderColor: colorVars['--color-success']
	}
});

/** The `role="button"` trigger — dropzone or compact row, plus the tooltip anchor. */
export function fileInputTriggerAttrs(
	isDropzone: boolean,
	isDisabled: boolean,
	isDragOver: boolean,
	statusType: InputStatusType | undefined,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		isDropzone ? styles.dropzone : styles.compact,
		isDropzone && !isDisabled && styles.dropzoneHover,
		isDropzone && isDragOver && styles.dropzoneActive,
		isDropzone && isDisabled && styles.dropzoneDisabled,
		!isDropzone && isDisabled && styles.compactDisabled,
		statusType && statusBorderStyles[statusType],
		xstyle
	);
}

/** The visually-hidden native `<input type="file">`. */
export function fileInputHiddenInputAttrs(): SvelteStyleAttrs {
	return sx(styles.hiddenInput);
}

/** The centred file name in dropzone mode. */
export function fileInputFileNameDropzoneAttrs(): SvelteStyleAttrs {
	return sx(styles.fileNameText, styles.fileNameDropzone);
}

/** The centred placeholder in dropzone mode. */
export function fileInputPlaceholderDropzoneAttrs(): SvelteStyleAttrs {
	return sx(styles.placeholderText);
}

/**
 * The compact row's loading label. `fileNameText` alone — upstream deliberately
 * omits `fileNameCompact` on this branch, so the text stays centre-aligned while
 * the spinner runs.
 */
export function fileInputLoadingLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.fileNameText);
}

/** The compact row's label: file name or placeholder, each with its own alignment. */
export function fileInputCompactLabelAttrs(hasFiles: boolean): SvelteStyleAttrs {
	return sx(
		hasFiles ? styles.fileNameText : styles.placeholderText,
		hasFiles ? styles.fileNameCompact : styles.placeholderCompact
	);
}
