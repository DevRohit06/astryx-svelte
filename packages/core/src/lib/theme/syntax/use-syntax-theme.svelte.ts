import { useMediaQuery } from '../../hooks/use-media-query.svelte.js';
import {
	ALL_SYNTAX_KEYS,
	resolveSyntaxTokenForMode,
	type SyntaxThemeTokenKey
} from './define-syntax-theme.js';
import { getSyntaxThemeContext } from './syntax-theme-context.svelte.js';

/**
 * Ported from the `useSyntaxTheme` half of Astryx's `theme/syntax/SyntaxTheme.tsx`.
 */
export interface UseSyntaxThemeReturn {
	/** Syntax theme name. */
	readonly name: string;
	/** The resolved effective colour mode. */
	readonly mode: 'light' | 'dark';
	/**
	 * Resolve a syntax token to its raw CSS value for the current colour mode.
	 *
	 * @example
	 * ```ts
	 * const keywordColor = syntax.token('keyword'); // "#0064E0" in light mode
	 * ```
	 */
	token: (name: SyntaxThemeTokenKey) => string;
	/** Every syntax token, resolved for the current colour mode. */
	readonly tokens: Record<SyntaxThemeTokenKey, string>;
}

/**
 * Access the current syntax theme's token values, resolved for the active colour
 * mode. Returns `null` when there is no enclosing `<SyntaxTheme>`.
 *
 * Must be called during component init, since it reads context. Upstream returns
 * a plain object recomputed on every render; here `mode` and `tokens` are getters
 * so a colour-scheme change stays live — the same split every hook in this port
 * makes. The **null-ness** is decided at init, which is sound because context
 * presence cannot change over a component's lifetime.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const syntax = useSyntaxTheme();
 * </script>
 *
 * {#if syntax}<span style:color={syntax.token('keyword')}>const</span>{/if}
 * ```
 */
export function useSyntaxTheme(): UseSyntaxThemeReturn | null {
	const ctx = getSyntaxThemeContext();
	if (!ctx) {
		return null;
	}

	const prefersDark = useMediaQuery(() => '(prefers-color-scheme: dark)');
	const mode = $derived<'light' | 'dark'>(prefersDark.matches ? 'dark' : 'light');

	const tokens = $derived.by(() => {
		const resolved: Partial<Record<SyntaxThemeTokenKey, string>> = {};
		for (const key of ALL_SYNTAX_KEYS) {
			resolved[key] = resolveSyntaxTokenForMode(ctx().theme.__inputTokens[key], mode);
		}
		return resolved as Record<SyntaxThemeTokenKey, string>;
	});

	return {
		get name() {
			return ctx().theme.name;
		},
		get mode() {
			return mode;
		},
		token: (name: SyntaxThemeTokenKey) => tokens[name] ?? '',
		get tokens() {
			return tokens;
		}
	};
}
