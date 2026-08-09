<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface FieldLabelProps extends BaseProps<HTMLLabelElement> {
		/** Label text (always rendered for accessibility). */
		label: string;
		/**
		 * ID of the input element this label points AT (rendered as `for` on the
		 * label). This is *not* the id of the label element itself — see
		 * `labelID` for that.
		 */
		inputID: string;
		/**
		 * The `id` applied TO the label element itself (not the element it points
		 * at — that's `inputID`). A grouping control (e.g. `role="radiogroup"`) can
		 * reference this via `aria-labelledby` to take the label as its accessible
		 * name.
		 */
		labelID?: string;
		/**
		 * When true, the field wraps a *group* of controls (e.g. a radiogroup)
		 * rather than a single input. In that case the label is rendered as a
		 * `<span>` instead of a `<label>` — a `<label>` semantically names one form
		 * control and can't be associated with a group, so it must not be a literal
		 * label element. The group takes the label as its name via
		 * `labelID` + `aria-labelledby`.
		 * @default false
		 */
		isGroupLabel?: boolean;
		/**
		 * Whether to visually hide the label and description (still accessible
		 * to screen readers). When hidden, the entire label group is rendered
		 * with sr-only styles and takes up no layout space.
		 * @default false
		 */
		isLabelHidden?: boolean;
		/**
		 * Whether the associated input is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Whether the field is optional. Mutually exclusive with isRequired.
		 * @default false
		 */
		isOptional?: boolean;
		/**
		 * Whether the field is required. Mutually exclusive with isOptional.
		 * @default false
		 */
		isRequired?: boolean;
		/**
		 * Icon to display before the label text.
		 *
		 * Upstream applies `size="sm" color="inherit"` for you; a snippet is
		 * authored by the caller, so set them yourself to match:
		 * `{#snippet labelIcon()}<Icon icon="star" size="sm" color="inherit" />{/snippet}`
		 */
		labelIcon?: Snippet;
		/** Tooltip text to display in an info icon at the end of the label. */
		labelTooltip?: string;
		/**
		 * Description displayed below the label. Hidden along with the label
		 * when isLabelHidden is true.
		 */
		description?: string | Snippet;
		/** ID for the description element (for aria-describedby on the input). */
		descriptionID?: string;
	}
</script>

<script lang="ts">
	import { themeProps } from '../../internal/theme-props.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useInputContainer } from '../../hooks/use-input-container.svelte.js';
	import Icon from '../icon/icon.svelte';
	import Tooltip from '../tooltip/tooltip.svelte';
	import {
		fieldLabelAttrs,
		fieldLabelDescriptionAttrs,
		fieldLabelStatusTextAttrs
	} from './field-label.stylex.js';

	/**
	 * Label + description group for form fields. Handles sr-only hiding,
	 * disabled styling, optional/required indicators, icons, and tooltips.
	 *
	 * When `isLabelHidden` is true the entire group uses sr-only positioning
	 * so it takes up zero layout space — no wrapper div left in flow.
	 *
	 * @example
	 * ```svelte
	 * <FieldLabel label="Email" inputID={inputId} description="We won't share it" />
	 * <FieldLabel label="Search" inputID={inputId} isLabelHidden />
	 * ```
	 */
	// 0.1.9 closed this: upstream used to destructure a **closed** prop list, so
	// the `class`, `style`, `xstyle` and `aria-*` its `BaseProps<HTMLLabelElement>`
	// promises were accepted and dropped. It now forwards them all, and the
	// divergence this port recorded under known debts simply ends.
	const {
		label,
		inputID,
		labelID,
		isGroupLabel = false,
		isLabelHidden = false,
		isDisabled = false,
		isOptional = false,
		isRequired = false,
		labelIcon,
		labelTooltip,
		description,
		descriptionID,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: FieldLabelProps = $props();

	const t = useTranslator();

	// Localised as of upstream 0.3.0 (#4508). Both strings were hardcoded English
	// on both sides until `@astryx.field.optional` / `@astryx.field.required`
	// entered the catalog with this release — which retires the "hard-coded
	// English" entry this port carried under Known debts, upstream-first rather
	// than by local invention.
	const statusText = $derived(
		isOptional ? t('@astryx.field.optional') : isRequired ? t('@astryx.field.required') : null
	);

	// Clicking the description forwards to the associated control, so the whole
	// label area (label text + description) is one hit target — mirroring native
	// `<label>` click behaviour, which the description cannot get from `for`
	// because it stays a sibling `<span>` (nesting it in the `<label>` would fold
	// it into the control's accessible name and double-announce it alongside
	// `aria-describedby`). A group label names a group, not one control, so it
	// has nothing to forward to.
	const forwardsDescriptionClick = $derived(!isGroupLabel && inputID != null);

	// Reuse `useInputContainer` — the same hook input wrappers use to forward
	// clicks on non-interactive chrome to their control. It skips nested
	// interactive content (a link/button inside a snippet description) and guards
	// against forwarding during text selection, so the description needs no
	// bespoke click logic.
	//
	// Upstream resolves the control through a ref-shaped object with a lazy
	// getter, because `FieldLabel` points at its control by *id* rather than
	// holding a ref. Here the options bag is already a getter, so the lazy read
	// is the natural spelling and needs no such shim.
	//
	// `container` is withheld unless forwarding is active, and that guard is
	// load-bearing rather than tidiness: `useClickableContainer`'s `$effect`
	// stamps `data-pressable-container` on whatever container it is handed,
	// regardless of `disabled` — and that attribute is itself in the
	// interactive-content selector. Stamping a group label's description would
	// make an enclosing container treat it as interactive and stop forwarding
	// clicks through it.
	let descriptionEl = $state<HTMLElement | null>(null);
	const descriptionClick = useInputContainer(() => ({
		container: forwardsDescriptionClick ? descriptionEl : null,
		input: inputID == null ? null : (descriptionEl?.ownerDocument.getElementById(inputID) ?? null),
		disabled: !forwardsDescriptionClick
	}));

	// The spaces around the separator are upstream's and are load-bearing: the
	// trailing one is what puts a gap between `∙` and `Optional`. A binding
	// rather than literal template text because Svelte trims whitespace at an
	// element's edges, where JSX preserves it.
	const separator = ' ∙ ';

	// A plain const: `themeProps('field-label')` takes no reactive input.
	const theme = themeProps('field-label');
	const attrs = $derived(fieldLabelAttrs(isDisabled, isLabelHidden, xstyle));
	const statusTextAttrs = fieldLabelStatusTextAttrs();
	const descriptionAttrs = $derived(
		fieldLabelDescriptionAttrs(isLabelHidden, forwardsDescriptionClick)
	);
</script>

<!--
	A group label (e.g. for a radiogroup) must not be a literal `<label>`
	element: a `<label>` semantically names a single form control and can't be
	associated with a group. Render it as a `<span>` instead, keeping all the
	label styling and slots. The group references it via `aria-labelledby`.
-->
<svelte:element
	this={isGroupLabel ? 'span' : 'label'}
	id={labelID}
	for={isGroupLabel ? undefined : inputID}
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
>
	{#if labelIcon}{@render labelIcon()}{/if}{label}{#if statusText}<span
			class={statusTextAttrs.class}
			style={statusTextAttrs.style}><span aria-hidden="true">{separator}</span>{statusText}</span
		>{/if}{#if labelTooltip}<Tooltip content={labelTooltip} placement="above">
			<Icon icon="info" size="sm" color="inherit" />
		</Tooltip>{/if}
</svelte:element>
{#if description}
	<span
		bind:this={descriptionEl}
		id={descriptionID}
		{...descriptionClick}
		class={descriptionAttrs.class}
		style={descriptionAttrs.style}
	>
		{#if typeof description === 'function'}{@render description()}{:else}{description}{/if}
	</span>
{/if}
