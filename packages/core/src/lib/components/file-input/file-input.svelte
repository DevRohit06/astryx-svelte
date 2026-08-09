<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue } from '../../internal/types.js';
	import type { InputStatus, InputStatusType } from '../field/types.js';
	import type { FieldStatusVariant } from '../field-status/field-status.stylex.js';

	// `FileInputStatus`/`FileInputStatusType` alias Field's `InputStatus`/
	// `InputStatusType`, as upstream publishes them from `FileInput/index.ts`.
	export type FileInputStatus = InputStatus;
	export type FileInputStatusType = InputStatusType;

	/**
	 * Upstream omits `'onChange' | 'defaultValue' | 'value'` from `BaseProps`
	 * because React's `HTMLAttributes` carries all three. Svelte's carries
	 * `onchange` but neither `value` nor `defaultValue`, so only the one omission
	 * is needed. Parameterised to `HTMLInputElement` because `rest` spreads onto
	 * the native file input.
	 */
	export interface FileInputProps extends Omit<BaseProps<HTMLInputElement>, 'onchange'> {
		/** Label text for the field (always rendered for accessibility). */
		label: string;
		/**
		 * Whether to visually hide the label (still accessible to screen readers).
		 * @default false
		 */
		isLabelHidden?: boolean;
		/**
		 * The selected file(s). `null` is empty.
		 *
		 * Controlled, and deliberately **not** `$bindable()` — upstream never writes
		 * it back; every commit path is `onChange` only.
		 */
		value: File | File[] | null;
		/**
		 * Fired with the new selection: `null`, a single `File`, or a `File[]` when
		 * `isMultiple`. Not a discriminated union upstream — `isMultiple` changes
		 * only the runtime payload, not the type.
		 */
		onChange: (files: File | File[] | null) => void;
		/**
		 * Async action fired after `onChange`, only when at least one file passed
		 * validation.
		 */
		changeAction?: (files: File | File[] | null) => Promise<void>;
		/**
		 * Accepted file types, as the HTML `accept` attribute spells them. Also
		 * enforced client-side — a non-matching file is rejected, not just filtered
		 * by the picker.
		 */
		accept?: string;
		/**
		 * Whether to accept more than one file. Switches `onChange`'s payload to an
		 * array and enables `maxFiles`.
		 * @default false
		 */
		isMultiple?: boolean;
		/** Maximum size per file, in bytes. */
		maxSize?: number;
		/** Maximum number of files. Applied only when `isMultiple`. */
		maxFiles?: number;
		/**
		 * Whether the control is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Why the control is disabled, shown in a tooltip. Setting it keeps the
		 * trigger focusable — it takes `aria-disabled` instead of losing its tab
		 * stop, so the reason stays discoverable by keyboard.
		 */
		disabledMessage?: string;
		/**
		 * Whether the field is required. Mutually exclusive with isOptional.
		 * @default false
		 */
		isRequired?: boolean;
		/**
		 * Shows a spinner in place of the trigger's content.
		 * @default false
		 */
		isLoading?: boolean;
		/**
		 * Validation status. Setting it *suppresses* the component's own validation
		 * errors from the border, icon and `aria-invalid` — though the live region
		 * still carries them.
		 */
		status?: InputStatus;
		/**
		 * How the status message is placed relative to the input.
		 * - `attached`: message overlaps directly below the input (bordered treatment)
		 * - `detached`: message floats below as a separate element with spacing
		 * - `tooltip`: no message box; the status icon becomes a focusable info-tip
		 *   button that reveals the message on hover, keyboard focus, or tap
		 * @default 'attached'
		 */
		statusVariant?: FieldStatusVariant;
		/** Description text displayed between the label and the control. */
		description?: string;
		/**
		 * Placeholder text.
		 * @default 'Choose file' — or `'Choose files'` when `isMultiple`
		 */
		placeholder?: string;
		/**
		 * @default 'input'
		 */
		mode?: 'dropzone' | 'input';
		/**
		 * Whether the field is optional. Mutually exclusive with isRequired.
		 * @default false
		 */
		isOptional?: boolean;
		/** Width of the whole field — label, control and status. */
		width?: SizeValue;
		/** Tooltip text shown from an info icon at the end of the label. */
		labelTooltip?: string;
	}

	/** Module-private, as upstream's is. */
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) {
			return `${bytes} B`;
		}
		if (bytes < 1024 * 1024) {
			return `${(bytes / 1024).toFixed(1)} KB`;
		}
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	/**
	 * Apply the three constraints, in upstream's order — only `errors[0]` is ever
	 * surfaced, so the order is observable.
	 *
	 * Note `maxFiles` **truncates** rather than rejecting: the extras are dropped,
	 * an error is recorded, and `onChange` still fires with the first `maxFiles`.
	 */
	function validateFiles(
		files: File[],
		accept: string | undefined,
		maxSize: number | undefined,
		maxFiles: number | undefined,
		isMultiple: boolean
	): { valid: File[]; errors: string[] } {
		const errors: string[] = [];
		let valid = files;

		if (accept) {
			const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
			valid = valid.filter((file) => {
				const matches = acceptedTypes.some((type) => {
					if (type.startsWith('.')) {
						return file.name.toLowerCase().endsWith(type);
					}
					if (type.endsWith('/*')) {
						// `slice(0, -1)` keeps the trailing `/` — `image/*` matches `image/`.
						return file.type.startsWith(type.slice(0, -1));
					}
					return file.type.toLowerCase() === type;
				});
				if (!matches) {
					errors.push(`"${file.name}" is not an accepted file type`);
				}
				return matches;
			});
		}

		if (maxSize != null) {
			valid = valid.filter((file) => {
				if (file.size > maxSize) {
					errors.push(`"${file.name}" exceeds ${formatFileSize(maxSize)} limit`);
					return false;
				}
				return true;
			});
		}

		if (isMultiple && maxFiles != null && valid.length > maxFiles) {
			errors.push(`Maximum ${maxFiles} files allowed`);
			valid = valid.slice(0, maxFiles);
		}

		return { valid, errors };
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { useClickableContainer } from '../../hooks/use-clickable-container.svelte.js';
	import { useInputStatusIcon } from '../../hooks/use-input-status-icon.svelte.js';
	import InputStatusIcon from '../../hooks/input-status-icon.svelte';
	import Field from '../field/field.svelte';
	import InputClearButton from '../field/input-clear-button.svelte';
	import Icon from '../icon/icon.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import TooltipLayer from '../tooltip/tooltip-layer.svelte';
	import { useTooltip } from '../tooltip/use-tooltip.svelte.js';
	import VisuallyHidden from '../visually-hidden/visually-hidden.svelte';
	import {
		fileInputCompactLabelAttrs,
		fileInputFileNameDropzoneAttrs,
		fileInputHiddenInputAttrs,
		fileInputLoadingLabelAttrs,
		fileInputPlaceholderDropzoneAttrs,
		fileInputTriggerAttrs
	} from './file-input.stylex.js';

	/**
	 * A file picker with optional drag-and-drop.
	 *
	 * The operable control is a **visually hidden real `<button>`**, not the
	 * `<input type="file">` — the input is visually hidden, `aria-hidden` and
	 * `tabindex="-1"`, and every describing attribute lives on the button the user
	 * actually focuses. The button is a *sibling* of the clear and status controls
	 * inside a non-interactive container, which is what keeps interactive elements
	 * from nesting (WCAG 4.1.2); the container carries only the surface click and
	 * the drag-and-drop handlers.
	 *
	 * @example
	 * ```svelte
	 * <FileInput label="Resume" value={file} onChange={(f) => (file = f)} accept=".pdf" />
	 * ```
	 */
	let {
		label,
		isLabelHidden = false,
		value,
		onChange,
		changeAction,
		accept,
		isMultiple = false,
		maxSize,
		maxFiles,
		isDisabled = false,
		disabledMessage,
		isRequired = false,
		isLoading = false,
		status: statusProp,
		statusVariant = 'attached',
		description,
		placeholder,
		mode = 'input',
		isOptional = false,
		labelTooltip,
		width,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: FileInputProps = $props();

	const t = useTranslator();

	// Announce a successful attach through the shared live region (forms-17). The
	// component's own role="status" region carries validation errors only, so a
	// successful attach would otherwise be silent.
	const announce = useAnnounce();

	// One base id with derived suffixes — the counterpart to upstream's four
	// `useId` calls.
	const uid = $props.id();
	const id = `${uid}-input`;
	const descriptionID = `${uid}-desc`;
	const statusMessageID = `${uid}-status`;
	const statusTooltipID = `${uid}-status-tip`;
	const tooltipID = `${uid}-tooltip`;
	const requiredID = `${uid}-required`;

	let input = $state<HTMLInputElement | null>(null);
	let container = $state<HTMLDivElement | null>(null);
	let isDragOver = $state(false);
	let validationError = $state<string | null>(null);

	// Disabled-reason tooltip. Anchored on the *visible container*, not the
	// trigger: the focusable trigger is visually hidden, so anchoring there would
	// place the tooltip at a 1px box. `focusin` bubbles from the trigger button,
	// so the tooltip still opens on keyboard focus. Disabled controls swallow
	// pointer events, and the trigger stays perceivable via aria-disabled instead
	// of losing its tab stop; opening the picker is still blocked by the
	// isDisabled guards in the handlers.
	const showsDisabledMessage = $derived(isDisabled && !!disabledMessage);
	const disabledMessageTooltip = useTooltip(() => ({
		id: tooltipID,
		placement: 'above' as const,
		focusTrigger: 'always' as const,
		isEnabled: showsDisabledMessage
	}));

	// An explicit `status` prop suppresses the internal validation error from the
	// border, icon and aria-invalid — the live region still renders it.
	const status = $derived(
		statusProp ??
			(validationError ? { type: 'error' as const, message: validationError } : undefined)
	);

	const statusIcon = useInputStatusIcon(() => ({
		id: statusTooltipID,
		status,
		statusVariant
	}));

	// Required state. `aria-required` is unsupported on `role="button"`, which is
	// what the trigger used to be — so the requirement is conveyed by a visually
	// hidden description instead, mirroring `Slider`. `isOptional` takes
	// precedence, as it does on the Field label's visible indicator.
	const conveysRequired = $derived(isRequired && !isOptional);

	const ariaDescribedBy = $derived(
		[
			description ? descriptionID : null,
			statusVariant !== 'tooltip' && status?.message ? statusMessageID : null,
			// The tooltip variant renders no message box; describe the input by the
			// tooltip's content instead so the status is still announced.
			statusIcon.describedBy ?? null,
			conveysRequired ? requiredID : null,
			showsDisabledMessage ? disabledMessageTooltip.describedBy : null
		]
			.filter(Boolean)
			.join(' ') || undefined
	);

	// Hardcoded English, as upstream's are — only the clear button's label goes
	// through the translator. Reproduced rather than "fixed" by inventing keys.
	const defaultPlaceholder = $derived(isMultiple ? 'Choose files' : 'Choose file');
	const displayPlaceholder = $derived(placeholder ?? defaultPlaceholder);

	const hasFiles = $derived(value != null && (Array.isArray(value) ? value.length > 0 : true));
	const fileNames = $derived(
		hasFiles
			? Array.isArray(value)
				? value.map((f) => f.name).join(', ')
				: (value?.name ?? '')
			: null
	);

	const isDropzone = $derived(mode === 'dropzone');

	function handleFiles(fileList: File[]): void {
		if (isDisabled) {
			return;
		}

		const { valid, errors } = validateFiles(fileList, accept, maxSize, maxFiles, isMultiple);

		validationError = errors.length > 0 ? errors[0] : null;

		if (valid.length === 0) {
			onChange(null);
			return;
		}

		const result = isMultiple ? valid : valid[0];
		onChange(result);

		// Announce the successful selection politely. Validation errors are
		// announced assertively by the `FieldStatus` that the derived error status
		// mounts, so only the attach is announced here (do not double-announce
		// errors) — which is why a *truncated* multi-select stays silent. This
		// component used to render a `role="status"` region of its own beside that
		// one, which is the duplicate 0.2.0 removed.
		if (errors.length === 0) {
			announce(
				valid.length === 1 ? `1 file selected: ${valid[0].name}` : `${valid.length} files selected`
			);
		}

		if (changeAction) {
			// Upstream wraps this in `startTransition` but discards the pending flag
			// (`const [, startTransition]`), so nothing observes the transition — a
			// bare call is the faithful translation.
			void changeAction(result);
		}
	}

	function handleInputChange(e: Event): void {
		const target = e.target as HTMLInputElement;
		const fileList = Array.from(target.files ?? []);
		handleFiles(fileList);
		// Reset so re-picking the same file fires `change` again.
		if (input) {
			input.value = '';
		}
	}

	function handleClear(e: MouseEvent): void {
		// Without this the wrapper's own onclick would reopen the picker.
		e.stopPropagation();
		validationError = null;
		onChange(null);
		if (input) {
			input.value = '';
			input.focus();
		}
	}

	function handleClick(): void {
		if (!isDisabled) {
			input?.click();
		}
	}

	function handleKeyDown(e: KeyboardEvent): void {
		if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
			e.preventDefault();
			input?.click();
		}
	}

	// Make the surface clickable without giving it an interactive role. Clicks on
	// the nested clear/status controls are ignored by the hook, so those buttons
	// are plain siblings — no nested-interactive violation.
	const clickable = useClickableContainer(() => ({
		container,
		onclick: handleClick,
		disabled: isDisabled
	}));

	function handleDragEnter(e: DragEvent): void {
		e.preventDefault();
		e.stopPropagation();
		if (!isDisabled && mode === 'dropzone') {
			isDragOver = true;
		}
	}

	function handleDragOver(e: DragEvent): void {
		e.preventDefault();
		e.stopPropagation();
		if (!isDisabled && mode === 'dropzone') {
			isDragOver = true;
		}
	}

	function handleDragLeave(e: DragEvent): void {
		e.preventDefault();
		e.stopPropagation();
		// Moving over the dropzone's own children (icon, text) fires dragleave on
		// the container too — only a leave that actually exits the dropzone ends the
		// drag-over state, otherwise the highlight flickers mid-drag.
		const currentTarget = e.currentTarget as Node;
		if (e.relatedTarget instanceof Node && currentTarget.contains(e.relatedTarget)) {
			return;
		}
		isDragOver = false;
	}

	function handleDrop(e: DragEvent): void {
		e.preventDefault();
		e.stopPropagation();
		isDragOver = false;
		if (isDisabled || mode !== 'dropzone') {
			return;
		}
		const fileList = Array.from(e.dataTransfer?.files ?? []);
		if (fileList.length > 0) {
			handleFiles(fileList);
		}
	}

	const theme = $derived(themeProps('file-input', { mode, status: status?.type ?? null }));
	const triggerAttrs = $derived(
		fileInputTriggerAttrs(isDropzone, isDisabled, isDragOver, status?.type, xstyle)
	);
	const hiddenInputAttrs = fileInputHiddenInputAttrs();
	const fileNameDropzoneAttrs = fileInputFileNameDropzoneAttrs();
	const placeholderDropzoneAttrs = fileInputPlaceholderDropzoneAttrs();
	const loadingLabelAttrs = fileInputLoadingLabelAttrs();
	const compactLabelAttrs = $derived(fileInputCompactLabelAttrs(hasFiles));
</script>

<Field
	{label}
	{isLabelHidden}
	{description}
	inputID={id}
	descriptionID={description ? descriptionID : undefined}
	{isOptional}
	{isRequired}
	{isDisabled}
	status={status
		? {
				type: status.type,
				message: status.message,
				messageID: status.message ? statusMessageID : undefined
			}
		: undefined}
	{statusVariant}
	{labelTooltip}
	{width}
>
	<!--
		A **non-interactive** container. It used to be the operable control itself
		(`role="button"`), which nested the clear and status buttons inside another
		interactive element — the WCAG 4.1.2 violation 0.2.0 resolved. The role, the
		accessible name and every describing attribute moved to a visually hidden
		real `<button>` sibling below; this element only carries the surface click
		(via `useClickableContainer`, which ignores clicks landing on those nested
		controls) and the drag-and-drop handlers.

		The click handler sits on an element with no role, which is exactly the
		arrangement being asked for: the role belongs to the button, and duplicating
		it here would put the nesting violation straight back. There is no keyboard
		handler either, and there should not be — keyboard activation belongs to the
		real `<button>`, which is where it lives.
	-->
	<div
		bind:this={container}
		onclick={!isDisabled ? clickable.onclick : undefined}
		onmouseup={!isDisabled ? clickable.onmouseup : undefined}
		ondragenter={isDropzone ? handleDragEnter : undefined}
		ondragover={isDropzone ? handleDragOver : undefined}
		ondragleave={isDropzone ? handleDragLeave : undefined}
		ondrop={isDropzone ? handleDrop : undefined}
		{...theme}
		class={cx(theme.class, triggerAttrs.class, className)}
		style={mergeStyle(triggerAttrs.style, styleProp as string | undefined)}
		{@attach disabledMessageTooltip.attachTrigger}
	>
		<!--
			Visually hidden real button carrying the accessible role, name and ARIA.
			Kept as a sibling of the clear/status controls inside the non-interactive
			container above, so no interactive element nests inside another (WCAG
			4.1.2). The visible focus feedback is the container's `:focus-within`
			border; the surface click is handled by the container (`VisuallyHidden`
			disables the button's own pointer events), and keyboard activation still
			fires here.
		-->
		<VisuallyHidden>
			<!--
				`aria-invalid` is not in ARIA 1.2's supported set for `role="button"`,
				but it is upstream's: it puts it here deliberately so the error state
				describes the control the user actually focuses, and its test cases pin
				it. Replicated, per the parity rule. `aria-required` was on this element
				too and is gone — 0.2.0 replaced it with the visually hidden
				description below, precisely because the role does not support it.
			-->
			<!-- svelte-ignore a11y_role_supports_aria_props_implicit -->
			<button
				type="button"
				disabled={isDisabled && !showsDisabledMessage}
				tabindex={isDisabled && !showsDisabledMessage ? -1 : 0}
				aria-disabled={showsDisabledMessage ? 'true' : undefined}
				onclick={handleClick}
				onkeydown={handleKeyDown}
				aria-label={hasFiles && fileNames
					? t('@astryx.fileInput.triggerWithFiles', { label, fileNames })
					: label}
				aria-busy={isLoading || undefined}
				aria-describedby={ariaDescribedBy}
				aria-invalid={status?.type === 'error' ? 'true' : undefined}
			></button>
		</VisuallyHidden>
		<input
			{...rest}
			bind:this={input}
			{id}
			type="file"
			{accept}
			multiple={isMultiple}
			disabled={isDisabled}
			onchange={handleInputChange}
			aria-hidden="true"
			tabindex={-1}
			class={hiddenInputAttrs.class}
			style={hiddenInputAttrs.style}
		/>
		{#if isDropzone}
			{#if isLoading}
				<Spinner size="md" />
			{:else if hasFiles}
				<div class={fileNameDropzoneAttrs.class} style={fileNameDropzoneAttrs.style}>
					{fileNames}
				</div>
			{:else}
				<Icon icon="arrowUp" size="md" color="secondary" />
				<span class={placeholderDropzoneAttrs.class} style={placeholderDropzoneAttrs.style}>
					{isDragOver ? 'Drop files here' : displayPlaceholder}
				</span>
			{/if}
		{:else if isLoading}
			<span class={loadingLabelAttrs.class} style={loadingLabelAttrs.style}>
				{fileNames ?? displayPlaceholder}
			</span>
			<Spinner size="sm" />
		{:else}
			<Icon icon="arrowUp" size="sm" color="secondary" />
			<span class={compactLabelAttrs.class} style={compactLabelAttrs.style}>
				{fileNames ?? displayPlaceholder}
			</span>
			<InputStatusIcon {statusIcon} />
		{/if}
		{#if hasFiles && !isDisabled && !isLoading}
			<InputClearButton
				label={t('@astryx.fileInput.clearLabel', { label })}
				onclick={handleClear}
			/>
		{/if}
	</div>
	{#if conveysRequired}
		<VisuallyHidden id={requiredID}>{t('@astryx.fileInput.required')}</VisuallyHidden>
	{/if}
	{#if showsDisabledMessage && disabledMessage}
		<TooltipLayer tooltip={disabledMessageTooltip}>{disabledMessage}</TooltipLayer>
	{/if}
</Field>
