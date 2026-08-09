<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { ChatToolCallStatus as ChatToolCallStatusType } from './chat-tool-calls.stylex.js';

	// Aliased rather than re-exported: `export type { X }` over an imported
	// binding trips `no-import-assign`, the false positive `Calendar` records and
	// `NumberInput`/`TimeInput` already work around this way.
	export type ChatToolCallStatus = ChatToolCallStatusType;

	export interface ChatToolCallItem {
		/** Tool/function name. */
		name: string;
		/** Current execution status. @default 'complete' */
		status?: ChatToolCallStatus;
		/** The target of the action (e.g. "Button.svelte", "pnpm test", "CSS anchor positioning"). */
		target?: string;
		/** Duration string (e.g. "1.2s", "340ms"). Shown when complete. */
		duration?: string;
		/** Sandbox/node name (e.g. "navi", "xds"). Shown as a pill badge. */
		node?: string;
		/** Lines/characters added. Rendered in green (e.g. "+12"). */
		additions?: number;
		/** Lines/characters removed. Rendered in red (e.g. "-3"). */
		deletions?: number;
		/** Additional info rendered after the label. Free-form text or a snippet. */
		stats?: string | Snippet;
		/**
		 * Error message when status is 'error'. Rendered as visually hidden text in
		 * the row (so screen readers and keyboard users perceive it) and echoed in a
		 * hover tooltip on the status icon.
		 */
		errorMessage?: string;
		/** Unique key for list rendering. Derived from stable metadata if omitted. */
		key?: string;
		/** Arbitrary data passed through with the call. Store tool args, result, etc. */
		data?: unknown;
		/** Inline detail content shown when the row is expanded (e.g. code diff, command output). */
		resultDetail?: string | Snippet;
	}

	export interface ChatToolCallsProps extends BaseProps<HTMLDivElement> {
		/** Array of tool call data. */
		calls: ChatToolCallItem[];
		/** Custom summary label for groups. Auto-generated from count if omitted. */
		label?: string;
		/** Whether the group is expanded. Uncontrolled by default. */
		isExpanded?: boolean;
		/** Default expanded state. @default true for ≤3 calls, false for >3. */
		defaultIsExpanded?: boolean;
		/** Callback when expanded state changes. */
		onExpandedChange?: (isExpanded: boolean) => void;
	}
</script>

<script lang="ts">
	import Icon from '../icon/icon.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import ChatToolCallRow, { STATUS_ICON_NAMES } from './chat-tool-call-row.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { getKey } from '../../utils/get-key.js';
	import {
		chatToolCallNameAttrs,
		chatToolCallLabelAttrs,
		chatToolCallStatusCircleAttrs,
		chatToolCallStatusIconAttrs,
		chatToolCallStatusInnerAttrs,
		chatToolCallToggleRowAttrs,
		chatToolCallsChevronAttrs,
		chatToolCallsCountAttrs,
		chatToolCallsGroupContentAttrs,
		chatToolCallsGroupContentInnerAttrs,
		chatToolCallsGroupIconAttrs,
		chatToolCallsGroupLabelAttrs,
		chatToolCallsListAttrs,
		chatToolCallsRootAttrs
	} from './chat-tool-calls.stylex.js';

	/**
	 * Displays tool/function call invocations from an LLM response.
	 *
	 * Accepts a `calls` array matching the shape LLM APIs return. A single call
	 * renders inline without group chrome; multiple calls get a collapsible
	 * header showing the latest call and a count.
	 *
	 * @example
	 * ```svelte
	 * <ChatToolCalls
	 *   calls={message.toolCalls.map((tc) => ({
	 *     name: tc.toolName,
	 *     status: tc.state,
	 *     duration: tc.duration
	 *   }))}
	 * />
	 * ```
	 */
	const {
		calls,
		label: _customLabel,
		isExpanded: controlledExpanded,
		defaultIsExpanded,
		onExpandedChange,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatToolCallsProps = $props();

	const t = useTranslator();

	// `label` is destructured and dropped, exactly as upstream does (it names the
	// binding `_customLabel` for the same reason). The prop is documented and
	// published but nothing reads it — the collapsed header shows the latest
	// call and the expanded one the translated count.

	// `useState(autoDefault)` reads its argument once, so the initialiser runs at
	// component init and a later `defaultIsExpanded` change is ignored on both
	// sides. Note the JSDoc's "true for ≤3 calls" is upstream's own and upstream
	// does not implement it — the default is `defaultIsExpanded ?? false`
	// whatever the count.
	let internalExpanded = $state(defaultIsExpanded ?? false);

	const contentId = $props.id();
	const isControlled = $derived(controlledExpanded !== undefined);
	const isExpanded = $derived(isControlled ? controlledExpanded! : internalExpanded);

	function toggle(): void {
		const next = !isExpanded;
		if (!isControlled) {
			internalExpanded = next;
		}
		onExpandedChange?.(next);
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggle();
		}
	}

	function toolCallKey(call: ChatToolCallItem): string {
		return getKey(call.key, () =>
			[
				call.name,
				call.status ?? 'complete',
				call.target ?? '',
				call.node ?? '',
				call.duration ?? '',
				call.additions?.toString() ?? '',
				call.deletions?.toString() ?? '',
				call.errorMessage ?? ''
			].join('\u001F')
		);
	}

	const latestCall = $derived(calls[calls.length - 1]);
	const latestStatus = $derived(latestCall?.status ?? 'complete');

	const theme = $derived(themeProps('chat-tool-calls'));
	const root = $derived(chatToolCallsRootAttrs(xstyle));
	const toggleRow = $derived(chatToolCallToggleRowAttrs());
	const groupIcon = $derived(chatToolCallsGroupIconAttrs());
	const groupLabel = $derived(chatToolCallsGroupLabelAttrs());
	const statusIcon = $derived(chatToolCallStatusIconAttrs(latestStatus));
	const statusCircle = $derived(chatToolCallStatusCircleAttrs());
	const statusInner = $derived(chatToolCallStatusInnerAttrs());
	const nameAttrs = $derived(chatToolCallNameAttrs());
	const labelAttrs = $derived(chatToolCallLabelAttrs());
	const countAttrs = $derived(chatToolCallsCountAttrs());
	const chevron = $derived(chatToolCallsChevronAttrs(isExpanded));
	const groupContent = $derived(chatToolCallsGroupContentAttrs(isExpanded));
	const groupContentInner = $derived(chatToolCallsGroupContentInnerAttrs());
	const list = $derived(chatToolCallsListAttrs());
</script>

{#if calls.length === 1}
	<!-- Single call: render inline, no group chrome -->
	<div
		{...rest}
		{...theme}
		class={cx(theme.class, root.class, className)}
		style={mergeStyle(root.style, styleProp as string | undefined)}
	>
		<ChatToolCallRow call={calls[0]} />
	</div>
{:else if calls.length > 1}
	<!-- Multiple calls: latest call at surface with chevron to expand all -->
	<div
		{...rest}
		{...theme}
		class={cx(theme.class, root.class, className)}
		style={mergeStyle(root.style, styleProp as string | undefined)}
	>
		<!-- Header: collapsed shows latest call + count, expanded shows summary label -->
		<div
			role="button"
			tabindex="0"
			aria-expanded={isExpanded}
			aria-controls={contentId}
			onclick={toggle}
			onkeydown={handleKeyDown}
			class={toggleRow.class}
			style={toggleRow.style}
		>
			{#if isExpanded}
				<span class={groupIcon.class} style={groupIcon.style}>
					<Icon icon="wrench" size="sm" color="inherit" />
				</span>
				<span class={groupLabel.class} style={groupLabel.style}
					>{t('@astryx.chatToolCalls.groupLabel', { count: calls.length })}</span
				>
			{:else}
				<span class={statusIcon.class} style={statusIcon.style}>
					{#if latestStatus === 'running' || latestStatus === 'pending'}
						<Spinner size="sm" shade="subtle" />
					{:else}
						<span class={statusCircle.class} style={statusCircle.style}></span>
						<span class={statusInner.class} style={statusInner.style}>
							<Icon icon={STATUS_ICON_NAMES[latestStatus] ?? 'check'} size="xsm" color="inherit" />
						</span>
					{/if}
				</span>
				<span class={nameAttrs.class} style={nameAttrs.style}>{latestCall.name}</span>
				{#if latestCall.target != null}
					<span class={labelAttrs.class} style={labelAttrs.style}>{latestCall.target}</span>
				{/if}
			{/if}
			<span class={countAttrs.class} style={countAttrs.style}>
				{#if !isExpanded}
					<Icon icon="wrench" size="xsm" color="inherit" />
					{calls.length}
				{/if}
			</span>
			<span class={chevron.class} style={chevron.style}>
				<Icon icon="chevronDown" size="xsm" color="inherit" />
			</span>
		</div>

		<!-- Expanded: all calls with full metadata -->
		<div id={contentId} class={groupContent.class} style={groupContent.style}>
			<div class={groupContentInner.class} style={groupContentInner.style}>
				<div class={list.class} style={list.style}>
					{#each calls as call (toolCallKey(call))}
						<ChatToolCallRow {call} />
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
