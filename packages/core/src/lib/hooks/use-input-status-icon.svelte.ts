import { untrack } from 'svelte';
import type { IconName } from '../components/icon/icon-registry.js';
import type { IconSize } from '../components/icon/icon.stylex.js';
import type { FieldStatusVariant } from '../components/field-status/field-status.stylex.js';
import type { InputStatus, InputStatusType } from '../components/field/types.js';
import { useTooltip, type TooltipReturn } from '../components/tooltip/use-tooltip.svelte.js';
import { useTranslator } from '../i18n/use-translator.svelte.js';

/**
 * The on-field status affordance shared by the bordered inputs (TextInput,
 * TextArea, NumberInput, DateInput, DateTimeInput, DateRangeInput, TimeInput,
 * FileInput), ported from Astryx's `hooks/useInputStatusIcon.tsx`, so the three
 * `statusVariant`s behave consistently:
 *
 * - `attached` → icon sits inside the control; the message box below carries
 *   the text.
 * - `detached` → the detached message box renders its OWN leading icon, so the
 *   on-field icon is suppressed here to avoid a duplicate glyph.
 * - `tooltip` → no message box renders; the status is surfaced through an
 *   info-tip on the on-field icon. The icon is a real focusable `<button>` so
 *   the status is reachable by every user, not just those with hover or a
 *   screen reader:
 *     - Keyboard (no AT): the button is in the tab order (WCAG 2.1.1) with a
 *       visible focus ring (WCAG 2.4.7); focusing it opens the tooltip.
 *     - Pointer: hover opens it (guarded to fine pointers).
 *     - Touch: hover is unavailable, so a tap toggles the tooltip open/closed.
 *     - Assistive tech: the button has an accessible name (its status type,
 *       WCAG 4.1.2) and is described by the message via `aria-describedby`.
 *     - Dismissible with Escape and hoverable (WCAG 1.4.13) via `useTooltip`.
 *
 * Two things translated:
 *
 * **`statusIcon` is not a node.** Upstream returns the affordance as a
 * `ReactNode`; a Svelte hook cannot return markup, so the hook returns what the
 * markup needs and `<InputStatusIcon>` renders it — the same split
 * `renderTooltip` → `<TooltipLayer>` and `hintElement` → `<KeyboardHintLayer>`
 * already took.
 *
 * **`id` is an option**, because `useTooltip` requires an SSR-stable id from the
 * calling component rather than minting one itself; see `useLayer` for why.
 */

/**
 * Maps each status type to its glyph. Shared so every input shows the same icon
 * for a given status, matching the detached message box's leading icon.
 */
const STATUS_ICON: Record<InputStatusType, IconName> = {
	warning: 'warning',
	error: 'error',
	success: 'success'
};

/**
 * Accessible-name i18n keys for the focusable status button, keyed by type.
 */
const STATUS_BUTTON_LABEL_KEY: Record<InputStatusType, string> = {
	warning: '@astryx.input.statusButton.warning',
	error: '@astryx.input.statusButton.error',
	success: '@astryx.input.statusButton.success'
};

export interface UseInputStatusIconOptions {
	/**
	 * SSR-stable unique id for the info-tip layer. Pass a value derived from the
	 * calling component's `$props.id()`; upstream's hook mints one internally,
	 * which `useLayer` cannot do here.
	 */
	id: string;
	/** The input's status, or undefined when there is none. */
	status?: InputStatus;
	/** How the status is presented relative to the input. */
	statusVariant?: FieldStatusVariant;
	/** Whether the input is inside an InputGroup (which owns status rendering). */
	isInGroup?: boolean;
	/** Size of the on-field icon. @default 'md' */
	size?: IconSize;
}

export interface UseInputStatusIconReturn {
	/**
	 * Whether an on-field affordance renders at all — upstream's `statusIcon`
	 * being non-null. `false` when there is no status, the variant is `detached`,
	 * or the input is inside a group.
	 */
	readonly hasIcon: boolean;
	/**
	 * Whether that affordance is the focusable info-tip button rather than a
	 * plain glyph. `<InputStatusIcon>` renders the tooltip layer only for this.
	 */
	readonly hasTooltip: boolean;
	/** The glyph for the current status; `null` when nothing renders. */
	readonly icon: IconName | null;
	/** The status type, which also colours the glyph; `null` when none renders. */
	readonly type: InputStatusType | null;
	/** Size of the on-field icon. */
	readonly size: IconSize;
	/** The message the info-tip shows. Empty unless `hasTooltip`. */
	readonly message: string;
	/** Accessible name for the focusable button. Empty unless `hasTooltip`. */
	readonly label: string;
	/** The info-tip. Live only while `hasTooltip` — `isEnabled` follows it. */
	readonly tooltip: TooltipReturn;
	/**
	 * ID to add to the input's `aria-describedby` when — and only when — the
	 * status is surfaced through a rendered tooltip layer (the `tooltip` variant
	 * with a message). It is `undefined` in every other case (no status, no
	 * message, `attached`/`detached`, or inside a group), so call-sites can drop
	 * it straight into their described-by list without a dangling reference: the
	 * id is present exactly when its tooltip element is in the DOM.
	 */
	readonly describedBy: string | undefined;
	/** `onclick` for the button — touch tap-to-toggle. */
	handleButtonClick(): void;
	/** `onblur` for the button — hands control back to hover/focus. */
	handleButtonBlur(): void;
}

/**
 * Builds the on-field status affordance and its accessibility wiring for a
 * bordered input. See the module header for the per-variant behavior.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const uid = $props.id();
 *   const statusIcon = useInputStatusIcon(() => ({
 *     id: `${uid}-status-tip`, status, statusVariant, isInGroup: inputGroup != null
 *   }));
 * </script>
 *
 * <div class="input-wrapper"><InputStatusIcon {statusIcon} /></div>
 * ```
 */
export function useInputStatusIcon(
	options: () => UseInputStatusIconOptions
): UseInputStatusIconReturn {
	const t = useTranslator();

	const status = $derived(options().status);
	const isTooltipVariant = $derived((options().statusVariant ?? 'attached') === 'tooltip');
	const hasTooltip = $derived(isTooltipVariant && !!status?.message);

	// Inside a group the group owns status rendering; the detached message box
	// renders its own leading icon, so the on-field icon would duplicate it.
	const hasIcon = $derived(
		!!status && !(options().isInGroup ?? false) && options().statusVariant !== 'detached'
	);

	// Touch tap-to-toggle. Hover is unavailable on touch, and `useTooltip`
	// suppresses simulated hover there, so on touch a tap controls visibility.
	// `undefined` leaves the tooltip uncontrolled (pointer + keyboard drive it);
	// a boolean takes control for the current open/close cycle.
	let tapOpen = $state<boolean | undefined>(undefined);

	const tooltip = useTooltip(() => ({
		id: options().id,
		placement: 'above',
		isEnabled: hasTooltip,
		isOpen: tapOpen
	}));

	// Dismiss a tap-opened tooltip on Escape and return to the uncontrolled
	// state (`useTooltip` owns Escape for the uncontrolled case, but while we
	// hold control via `isOpen` it does not, so mirror it here).
	$effect(() => {
		if (tapOpen !== true) {
			return;
		}
		const onKeyDown = (e: KeyboardEvent): void => {
			if (e.key === 'Escape') {
				tapOpen = undefined;
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	});

	return {
		get hasIcon() {
			return hasIcon;
		},
		get hasTooltip() {
			return hasIcon && hasTooltip;
		},
		get icon() {
			return hasIcon && status ? STATUS_ICON[status.type] : null;
		},
		get type() {
			return hasIcon && status ? status.type : null;
		},
		get size() {
			return options().size ?? 'md';
		},
		get message() {
			return hasIcon && hasTooltip ? (status?.message ?? '') : '';
		},
		get label() {
			return hasIcon && hasTooltip && status ? t(STATUS_BUTTON_LABEL_KEY[status.type]) : '';
		},
		tooltip,
		get describedBy() {
			return hasIcon && hasTooltip ? tooltip.describedBy : undefined;
		},
		handleButtonClick() {
			// Only take control on touch/hover-less devices. On hover-capable
			// devices pointer hover and keyboard focus already drive the tooltip
			// (uncontrolled), so a click-toggle would fight them; leave it
			// uncontrolled there.
			if (
				typeof window === 'undefined' ||
				typeof window.matchMedia !== 'function' ||
				!window.matchMedia('(hover: none)').matches
			) {
				return;
			}
			untrack(() => {
				tapOpen = tapOpen === true ? false : true;
			});
		},
		handleButtonBlur() {
			tapOpen = undefined;
		}
	};
}
