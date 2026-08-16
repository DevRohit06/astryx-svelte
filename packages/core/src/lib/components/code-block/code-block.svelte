<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SyntaxThemeDefinition } from '../../theme/syntax/define-syntax-theme.js';
	import type { SyntaxToken } from './tokenizer.js';

	export interface CodeBlockProps extends BaseProps<HTMLPreElement> {
		/** The source to display. Also the clipboard payload. */
		code: string;
		/**
		 * Language for the built-in tokenizer. An unrecognised language renders as
		 * unhighlighted text rather than failing.
		 * @default 'plaintext'
		 */
		language?: string;
		/** Header text. Setting it forces the header to render. */
		title?: string;
		/**
		 * Whether to show the language in the header. Never shown for `'plaintext'`.
		 * @default true
		 */
		hasLanguageLabel?: boolean;
		/**
		 * @default false
		 */
		hasLineNumbers?: boolean;
		/** Lines to highlight, **1-indexed**. */
		highlightLines?: number[];
		/**
		 * @default true
		 */
		hasCopyButton?: boolean;
		/** Called after the clipboard write resolves and the announcement is made. */
		onCopy?: () => void;
		/**
		 * Whether long lines wrap instead of scrolling horizontally.
		 * @default false
		 */
		isWrapped?: boolean;
		/** Max height of the scroll container. A number is treated as pixels. */
		maxHeight?: number | string;
		/**
		 * Whether the block collapses from its header. Only takes effect once the
		 * block reaches `collapsibleThreshold` lines.
		 * @default false
		 */
		isCollapsible?: boolean;
		/**
		 * Line count at which `isCollapsible` starts applying — a `>=` comparison.
		 * @default 10
		 */
		collapsibleThreshold?: number;
		/**
		 * @default 'md'
		 */
		size?: 'sm' | 'md';
		/**
		 * Width of the code block. Accepts any CSS width value.
		 * - `'fit-content'` (default): shrinks to the width of the longest line (with a min-width floor).
		 * - `'100%'`: stretches to fill the parent container width.
		 * - Any valid CSS width string (e.g. `'600px'`, `'50vw'`).
		 * @default 'fit-content'
		 */
		width?: string;
		/**
		 * Container presentation style.
		 * - `'card'` (default): border-radius and border with the muted syntax
		 *   background — standalone card look.
		 * - `'section'`: no border-radius, no border, and a transparent background
		 *   so the block blends into the card or panel it's embedded in. Set an
		 *   explicit background via `xstyle` if you need one.
		 * @default 'card'
		 */
		container?: 'card' | 'section';
		/**
		 * Custom tokenizer returning flat, absolute offsets. Supplying one disables
		 * the async path entirely — it is assumed to be cheap.
		 */
		tokenizer?: (code: string, language: string) => SyntaxToken[];
		/**
		 * How syntax colour is painted. `'auto'` uses the CSS Custom Highlight API
		 * where available and falls back to `<span>`s otherwise (and always on
		 * Safari, which supports the API's objects but mis-renders `::highlight()`
		 * in code blocks).
		 *
		 * `'ranges'` is accepted for symmetry but is not a distinct branch upstream —
		 * it, and any unrecognised value, fall through to range mode.
		 * @default 'auto'
		 */
		highlightMode?: 'auto' | 'ranges' | 'spans';
		/**
		 * Per-instance syntax theme override. Shorthand for wrapping this block in
		 * `<SyntaxTheme theme={...}>` — accepts a preset from
		 * `@astryx-svelte/core/theme/syntax` or a theme created with
		 * `defineSyntaxTheme()`. Without it, the block uses the theme-level syntax
		 * colours from the nearest `SyntaxTheme` ancestor or `defineTheme({ syntax })`.
		 */
		syntaxTheme?: SyntaxThemeDefinition;
	}

	const LINE_CHUNK_SIZE = 20;
	const LINE_CHUNK_THRESHOLD = 100;

	function hasHighlightAPI(): boolean {
		return typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined';
	}

	/**
	 * Safari supports the Highlight API JS objects but has rendering issues with
	 * `::highlight()` in code blocks. Detect Safari (WebKit without Chrome) so we
	 * can fall back to spans.
	 */
	function isSafari(): boolean {
		if (typeof navigator === 'undefined') {
			return false;
		}
		const ua = navigator.userAgent;
		return ua.includes('AppleWebKit') && !ua.includes('Chrome');
	}

	/** One `content-visibility: auto` chunk: its line slice and where it starts. */
	interface LineChunk {
		start: number;
		lines: string[];
	}

	/**
	 * Slice the lines into chunks, or into a single chunk below the threshold.
	 *
	 * Upstream's `renderLines` returns `ReactNode` and leans on `React.memo` to
	 * keep re-renders cheap; Svelte's fine-grained reactivity makes the memo
	 * unnecessary, so the counterpart returns *data* and the template renders it.
	 * The DOM is identical either way — below `LINE_CHUNK_THRESHOLD` there is no
	 * wrapper element at all.
	 */
	function buildChunks(lines: string[], chunkSize: number = LINE_CHUNK_SIZE): LineChunk[] {
		chunkSize = Math.max(1, Math.floor(chunkSize));

		if (lines.length < LINE_CHUNK_THRESHOLD) {
			return [{ start: 0, lines }];
		}

		const chunks: LineChunk[] = [];
		for (let start = 0; start < lines.length; start += chunkSize) {
			const end = Math.min(start + chunkSize, lines.length);
			chunks.push({ start, lines: lines.slice(start, end) });
		}
		return chunks;
	}

	/** One run of a line in span mode: either plain text or a typed token. */
	interface SpanPart {
		text: string;
		type: string | null;
	}

	/**
	 * Split a line into token and non-token runs.
	 *
	 * Upstream's `buildSpanLine` returns `ReactNode` directly; the Svelte
	 * counterpart returns the parts and the template renders them, for the reason
	 * `buildChunks` records.
	 */
	function buildSpanLine(lineText: string, tokens: SyntaxToken[]): SpanPart[] {
		if (tokens.length === 0) {
			return [{ text: lineText || '\u200b', type: null }];
		}

		const parts: SpanPart[] = [];
		let cursor = 0;

		for (const token of tokens) {
			if (token.start > cursor) {
				parts.push({ text: lineText.slice(cursor, token.start), type: null });
			}
			const end = Math.min(token.end, lineText.length);
			parts.push({ text: lineText.slice(token.start, end), type: token.type });
			cursor = end;
		}

		if (cursor < lineText.length) {
			parts.push({ text: lineText.slice(cursor), type: null });
		}
		return parts.length > 0 ? parts : [{ text: '\u200b', type: null }];
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useClipboard } from '../../hooks/use-clipboard.svelte.js';
	import Icon from '../icon/icon.svelte';
	import IconButton from '../icon-button/icon-button.svelte';
	import SyntaxTheme from '../../theme/syntax/syntax-theme.svelte';
	import {
		SYNC_TOKENIZE_THRESHOLD,
		flatTokensToLines,
		tokenize,
		tokenizeAsync,
		type TokenLine
	} from './tokenizer.js';
	import { ensureHighlightStyles } from './highlight-styles.js';
	import { applyHighlightRangesChunked } from './highlight-ranges.js';
	import {
		codeBlockCodeAttrs,
		codeBlockCodeWrapperAttrs,
		codeBlockCollapseChevronAttrs,
		codeBlockCollapseChevronExpandedStyle,
		codeBlockCollapseChevronIconStyle,
		codeBlockCollapseGridAttrs,
		codeBlockCollapseInnerAttrs,
		codeBlockCopyButtonAbsoluteStyle,
		codeBlockCopyButtonStyle,
		codeBlockHeaderAttrs,
		codeBlockHeaderRowAttrs,
		codeBlockHeaderTitleAttrs,
		codeBlockLineAttrs,
		codeBlockLineChunkAttrs,
		codeBlockLineContentAttrs,
		codeBlockRootAttrs,
		codeBlockScrollContainerAttrs
	} from './code-block.stylex.js';

	/**
	 * Read-only code display with syntax highlighting, line numbers and an
	 * optional copy button.
	 *
	 * @example
	 * ```svelte
	 * <CodeBlock code="const x = 42;" language="javascript" />
	 * ```
	 */
	let {
		code,
		language = 'plaintext',
		title,
		hasLanguageLabel = true,
		hasLineNumbers = false,
		highlightLines,
		hasCopyButton = true,
		onCopy,
		isWrapped = false,
		maxHeight,
		isCollapsible = false,
		collapsibleThreshold = 10,
		size = 'md',
		width: widthProp = 'fit-content',
		container = 'card',
		tokenizer: customTokenizer,
		highlightMode = 'auto',
		syntaxTheme,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: CodeBlockProps = $props();

	const t = useTranslator();

	// The copied flag, its 2s reset timer and the polite announcement all live in
	// the shared hook now (#4867) — CodeBlock and TimestampHoverCard were running
	// two copies of the same state machine.
	const clipboard = useClipboard(() => ({ announce: t('@astryx.codeBlock.copied') }));

	let isCollapsed = $state(false);

	// Derived, not read once at init, because upstream recomputes it every render
	// and a changing `highlightMode` genuinely switches strategy. The two
	// environment probes are constant per environment but not per render: under
	// SSR `hasHighlightAPI()` is false, so the server emits span mode and the
	// client re-evaluates on hydration — which is exactly what React does here.
	const useSpans = $derived(
		highlightMode === 'spans' ||
			(highlightMode === 'auto' && !hasHighlightAPI()) ||
			(highlightMode === 'auto' && isSafari())
	);

	const lines = $derived.by(() => {
		const l = code.split('\n');
		if (l.length > 1 && l[l.length - 1] === '') {
			l.pop();
		}
		return l;
	});

	// --- token lines: upstream's `useTokenLines`, split into sync + async halves.
	let asyncTokenResult = $state.raw<{
		code: string;
		language: string;
		tokens: TokenLine[];
	} | null>(null);

	const syncTokens = $derived.by(() => {
		if (customTokenizer) {
			return flatTokensToLines(customTokenizer(code, language), code);
		}
		if (code.length >= SYNC_TOKENIZE_THRESHOLD) {
			return null;
		}
		return tokenize(code, language);
	});

	$effect(() => {
		if (code.length < SYNC_TOKENIZE_THRESHOLD || customTokenizer) {
			return;
		}

		const abortController = new AbortController();

		// Captured *before* the await, which is load-bearing. Upstream's effect
		// closes over the render's `code`/`language`, so the result is always
		// stamped with the input that was actually tokenized — that is what makes
		// the staleness guard below meaningful. Reading the props after the await
		// would read them live: a `code` write from an unrelated microtask queues
		// Svelte's flush *behind* this continuation, so the abort would land too
		// late and the new code would be stamped onto the old tokens.
		const tokenizedCode = code;
		const tokenizedLanguage = language;

		void (async () => {
			try {
				const tokens = await tokenizeAsync(
					tokenizedCode,
					tokenizedLanguage,
					abortController.signal
				);
				if (!abortController.signal.aborted) {
					asyncTokenResult = { code: tokenizedCode, language: tokenizedLanguage, tokens };
				}
			} catch {
				if (!abortController.signal.aborted) {
					asyncTokenResult = { code: tokenizedCode, language: tokenizedLanguage, tokens: [] };
				}
			}
		})();

		return () => {
			abortController.abort();
		};
	});

	const tokenLines = $derived.by((): TokenLine[] => {
		if (syncTokens != null) {
			return syncTokens;
		}
		// The async result is only usable while it still describes the current
		// code *and* language — otherwise it is a stale answer to an old question.
		if (asyncTokenResult?.code === code && asyncTokenResult.language === language) {
			return asyncTokenResult.tokens;
		}
		return [];
	});

	const highlightSet = $derived(highlightLines ? new Set(highlightLines) : null);

	// Digits in the largest line number — sizes the gutter column width.
	const maxLineDigits = $derived(String(lines.length).length);
	const languageLabel = $derived(hasLanguageLabel && language !== 'plaintext' ? language : null);
	const showHeader = $derived(title != null || languageLabel != null);
	const canCollapse = $derived(isCollapsible && lines.length >= collapsibleThreshold);
	const chunks = $derived(buildChunks(lines));
	const isChunked = $derived(lines.length >= LINE_CHUNK_THRESHOLD);

	// Links the collapsible header to the code region it shows/hides so assistive
	// tech can move from the button to its controlled content (disclosure
	// pattern). The region stays mounted when collapsed (CSS grid animation), so
	// this is always a resolvable reference — aria-controls can be unconditional.
	const regionId = $props.id();

	let codeEl = $state<HTMLElement | null>(null);

	// Span mode's counterpart to upstream's `useInsertionEffect(ensureHighlightStyles, [])`
	// on `SpanCodeContent`: a pre-effect runs before the DOM is written, so the
	// `::highlight()` and `.astryx-token-*` rules are in the document before the
	// first paint. Range mode inserts the same sheet inside the effect below,
	// after its API probe, exactly as upstream does.
	$effect.pre(() => {
		if (useSpans) {
			ensureHighlightStyles();
		}
	});

	$effect(() => {
		if (useSpans || !hasHighlightAPI()) {
			return;
		}
		ensureHighlightStyles();

		const el = codeEl;
		if (!el || tokenLines.length === 0) {
			return;
		}

		return applyHighlightRangesChunked(el, tokenLines);
	});

	async function handleCopy(): Promise<void> {
		// `onCopy` now fires only once the write has actually resolved, and after
		// the hook has flipped the icon and announced — upstream called it mid-`try`
		// before the timer started, which meant a consumer could observe the callback
		// for a copy the clipboard went on to reject.
		if (await clipboard.copy(code)) {
			onCopy?.();
		}
	}

	function handleCopyClick(e: MouseEvent): void {
		// Stop propagation so copying does not toggle the collapsible header.
		e.stopPropagation();
		void handleCopy();
	}

	function handleHeaderKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			isCollapsed = !isCollapsed;
		}
	}

	const scrollStyle = $derived(
		maxHeight ? `max-height: ${typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight};` : ''
	);

	const theme = $derived(themeProps('codeblock', { size, language, container }));
	const rootAttrs = $derived(codeBlockRootAttrs(widthProp, container, xstyle));
	const headerRowAttrs = $derived(codeBlockHeaderRowAttrs(hasLineNumbers));
	const headerAttrs = $derived(codeBlockHeaderAttrs(canCollapse));
	const headerTitleAttrs = codeBlockHeaderTitleAttrs();
	const chevronAttrs = codeBlockCollapseChevronAttrs();
	const collapseGridAttrs = $derived(codeBlockCollapseGridAttrs(isCollapsed));
	const collapseInnerAttrs = codeBlockCollapseInnerAttrs();
	const scrollContainerAttrs = codeBlockScrollContainerAttrs();
	const codeWrapperAttrs = $derived(codeBlockCodeWrapperAttrs(showHeader && !hasLineNumbers));
	const codeAttrs = $derived(codeBlockCodeAttrs(size, isWrapped, hasLineNumbers, maxLineDigits));
	const lineChunkAttrs = codeBlockLineChunkAttrs();
	const lineContentAttrs = codeBlockLineContentAttrs();
	const headerTheme = $derived(themeProps('codeblock-header', { size, language, container }));
	const titleTheme = $derived(themeProps('codeblock-title', { size, language }));
	const copyButtonTheme = themeProps('codeblock-copy-button');
</script>

{#snippet copyButton()}
	<!--
		A visible "Copy" hover/focus hint via Button's built-in tooltip. It stays
		"Copy" after copying — the copy → check icon flip is the confirmation, not a
		tooltip change. The aria-label still swaps to the localized "Copied" for
		assistive tech, backed by the announcement.
	-->
	<IconButton
		variant="ghost"
		size="sm"
		tooltip={t('@astryx.codeBlock.copyCode')}
		label={clipboard.isCopied ? t('@astryx.codeBlock.copied') : t('@astryx.codeBlock.copyCode')}
		onclick={handleCopyClick}
		xstyle={[codeBlockCopyButtonStyle, !showHeader && codeBlockCopyButtonAbsoluteStyle]}
		{...copyButtonTheme}
	>
		{#snippet icon()}
			<Icon icon={clipboard.isCopied ? 'check' : 'copy'} size="sm" color="inherit" />
		{/snippet}
	</IconButton>
{/snippet}

<!--
	Span mode. The tokens are wrapped in a single element so they occupy one grid
	cell when line numbers are on (see `lineNumbered`); an inline span is a no-op
	when off.
-->
{#snippet spanLine(line: string, i: number)}
	<div
		data-line={i + 1}
		class={codeBlockLineAttrs(hasLineNumbers, highlightSet?.has(i + 1) ?? false).class}
		style={codeBlockLineAttrs(hasLineNumbers, highlightSet?.has(i + 1) ?? false).style}
	>
		<span class={lineContentAttrs.class} style={lineContentAttrs.style}
			>{#each buildSpanLine(line, tokenLines[i] ?? []) as part, p (p)}{#if part.type === null}{part.text}{:else}<span
						class="astryx-token-{part.type} xds-token-{part.type}">{part.text}</span
					>{/if}{/each}</span
		>
	</div>
{/snippet}

<!--
	Range mode keeps the line's text as a bare text node so
	`applyHighlightRangesChunked` can map token offsets onto it — no wrapper. The
	number `::before` is a pseudo-element, so it never becomes a child node here.

	`applyLineRanges` bails unless `lineDiv.firstChild` is a Text node, so **the
	expression below must stay the div's only child, never gaining a wrapper or
	an element sibling**, and **this snippet must stay declared at the top level**.
	Being top-level is what keeps it out of the `<pre>`'s preserve-whitespace mode,
	so Svelte's ordinary trimming collapses the indentation to a single text
	placeholder (verified: the div compiles to `<div> </div>`). Moving it inside
	the `<pre>` literal would render the indentation and break range-mode colour
	silently.
-->
{#snippet rangeLine(line: string, i: number)}
	<div
		data-line={i + 1}
		class={codeBlockLineAttrs(hasLineNumbers, highlightSet?.has(i + 1) ?? false).class}
		style={codeBlockLineAttrs(hasLineNumbers, highlightSet?.has(i + 1) ?? false).style}
	>
		{line || '\u200b'}
	</div>
{/snippet}

<!--
	The chunk loop, parameterised by the row snippet, so the `useSpans` branch
	happens **once** rather than once per line. Upstream branches once too, between
	its two `*CodeContent` components; branching per line would multiply the
	hydration mismatch (`hasHighlightAPI()` is false under SSR and true in the
	browser) by the line count.
-->
{#snippet chunkList(row: Snippet<[string, number]>)}
	{#each chunks as chunk (chunk.start)}{#if isChunked}<div
				class={lineChunkAttrs.class}
				style={mergeStyle(
					lineChunkAttrs.style,
					`contain-intrinsic-block-size: auto ${chunk.lines.length}lh;`
				)}
			>
				{#each chunk.lines as line, j (j)}{@render row(line, chunk.start + j)}{/each}
			</div>{:else}{#each chunk.lines as line, j (j)}{@render row(
					line,
					chunk.start + j
				)}{/each}{/if}{/each}
{/snippet}

{#snippet codeBody()}
	<!--
		The scroll container is keyboard-focusable so keyboard users can scroll long
		or wide code that overflows the viewport. Uses role="group" (not "region")
		so multiple code blocks on a page don't create duplicate same-named
		landmarks (axe: landmark-unique).
	-->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		tabindex={0}
		role="group"
		aria-label={languageLabel ?? t('@astryx.codeBlock.code')}
		class={scrollContainerAttrs.class}
		style={mergeStyle(scrollContainerAttrs.style, scrollStyle)}
	>
		<div class={codeWrapperAttrs.class} style={codeWrapperAttrs.style}>
			<code bind:this={codeEl} class={codeAttrs.class} style={codeAttrs.style}
				>{#if useSpans}{@render chunkList(spanLine)}{:else}{@render chunkList(rangeLine)}{/if}</code
			>
		</div>
	</div>
{/snippet}

{#snippet headerRow()}
	<div
		{...headerTheme}
		class={cx(headerTheme.class, headerRowAttrs.class)}
		style={headerRowAttrs.style}
	>
		<!--
			`role`/`tabindex`/the handlers are all conditional on `canCollapse`, so the
			compiler cannot prove the element is interactive when it is focusable.
			Upstream gates the same five attributes on the same flag.
		-->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			role={canCollapse ? 'button' : undefined}
			tabindex={canCollapse ? 0 : undefined}
			aria-expanded={canCollapse ? !isCollapsed : undefined}
			aria-controls={canCollapse ? regionId : undefined}
			onclick={canCollapse ? () => (isCollapsed = !isCollapsed) : undefined}
			onkeydown={canCollapse ? handleHeaderKeyDown : undefined}
			class={headerAttrs.class}
			style={headerAttrs.style}
		>
			<span
				{...titleTheme}
				class={cx(titleTheme.class, headerTitleAttrs.class)}
				style={headerTitleAttrs.style}
				>{#if canCollapse}<span class={chevronAttrs.class} style={chevronAttrs.style}>
						<Icon
							icon="chevronRight"
							size="xsm"
							color="inherit"
							xstyle={[
								codeBlockCollapseChevronIconStyle,
								!isCollapsed && codeBlockCollapseChevronExpandedStyle
							]}
						/>
					</span>{/if}{title ?? ''}{title && languageLabel ? ' — ' : ''}{languageLabel ?? ''}</span
			>
		</div>
		{#if hasCopyButton}{@render copyButton()}{/if}
	</div>
{/snippet}

{#snippet collapsibleBody()}
	<!--
		While collapsed, the region is only hidden visually (a 0fr grid row); `inert`
		also removes it from the tab order and the accessibility tree, so keyboard
		users cannot Tab into the invisible scroll container (which is `tabindex=0`).
		An `aria-controls` pointing at an inert element remains a valid, resolvable
		reference.
	-->
	<div
		id={regionId}
		inert={isCollapsed ? true : undefined}
		class={collapseGridAttrs.class}
		style={collapseGridAttrs.style}
	>
		<div class={collapseInnerAttrs.class} style={collapseInnerAttrs.style}>
			{@render codeBody()}
		</div>
	</div>
{/snippet}

<!--
	The `<pre>`'s children are top-level snippets rendered with no literal
	whitespace between them, and that is load-bearing rather than a style choice.
	Svelte switches to preserve-whitespace mode on entering a `<pre>` and keeps it
	for the whole lexical subtree, where JSX drops any whitespace run containing a
	newline — so indenting these children the ordinary way renders the newlines and
	tabs. Two boxes show it: `headerTitle`, whose whitespace is contiguous with the
	title text (so the anonymous flex item is not whitespace-only), and
	`collapseInner`, a plain block box that gains blank lines. The flex/grid
	ancestors discard whitespace-only children per spec, which is why the rest of
	the tree looks fine.
-->
{#snippet block()}
	<!-- `{...rest}` last, matching upstream's trailing `{...props}`. -->
	<pre
		{...theme}
		class={cx(theme.class, rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
		{...rest}>{#if showHeader}{@render headerRow()}{/if}{#if canCollapse}{@render collapsibleBody()}{:else}{@render codeBody()}{/if}{#if !showHeader && hasCopyButton}{@render copyButton()}{/if}</pre>
{/snippet}

{#if syntaxTheme}
	<SyntaxTheme theme={syntaxTheme}>{@render block()}</SyntaxTheme>
{:else}
	{@render block()}
{/if}
