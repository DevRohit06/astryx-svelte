/**
 * Standardized dev-time console messages, ported from Astryx's
 * `utils/devWarning.ts`.
 *
 * Every message reads `Component: message` (e.g. `Field: isOptional and
 * isRequired are mutually exclusive.`), so the source is always obvious in the
 * console.
 *
 * Prefer the `useDevWarning` hook inside components — it guards against
 * repeating a warning on every update. These imperative helpers exist for the
 * non-component contexts a hook can't cover: plain functions, module
 * initialization, and inside effects.
 *
 * Transcription, not translation: nothing here is React. The one thing worth
 * stating is the `isDev` gate. Upstream writes `process.env.NODE_ENV !==
 * 'production'` and ships that expression *uncompiled* in its published
 * `dist/`, leaving the substitution to the consumer's bundler — Vite, webpack
 * and Rollup all replace it, and an unreplaced `NODE_ENV` reads as "not
 * production", so the guardrails stay on. `svelte-package` likewise emits the
 * expression untouched, so our `dist/` is byte-for-byte upstream's on this line.
 *
 * NOTE: the sweep that routed the pre-existing call sites through this module is
 * done — 17 of the port's 18 bare `console.warn` calls now go through `devWarn`,
 * `warnOnce` or the `useDevWarning` hook, and are production-gated again. The one
 * survivor is `avatar.svelte`, which is *upstream's* own shape: `Avatar.tsx` at
 * v0.3.0 warns with a bare, ungated `console.warn` and carries a comment saying
 * so. It is left as-is on the parity rule and annotated at the call site, so a
 * future grep for `console.warn` finds a reason rather than an oversight.
 */

const isDev = process.env.NODE_ENV !== 'production';

/** Format a message as `Component: message`. */
export function formatDevMessage(component: string, message: string): string {
	return `${component}: ${message}`;
}

/**
 * Dev-only `console.warn` in the standardized `Component: message` format.
 * A no-op in production — warnings are builder guardrails, not shipped noise.
 * Extra args (e.g. an offending value) are forwarded to `console.warn`.
 *
 * @example
 * ```ts
 * devWarn('Popover', 'children must contain a <button>.');
 * ```
 */
export function devWarn(component: string, message: string, ...args: unknown[]): void {
	if (!isDev) {
		return;
	}
	console.warn(formatDevMessage(component, message), ...args);
}

/**
 * `console.error` in the standardized `Component: message` format. Unlike
 * {@link devWarn}, this runs in production too: it reports real runtime
 * failures (e.g. a thrown callback) that should reach error telemetry.
 *
 * @example
 * ```ts
 * devError('Table', 'Plugin at index 0 threw in transform:', error);
 * ```
 */
export function devError(component: string, message: string, ...args: unknown[]): void {
	console.error(formatDevMessage(component, message), ...args);
}

const warnedKeys = new Set<string>();

/**
 * Dev-only warning that fires at most once per `key` for the lifetime of the
 * app. Use for singleton warnings that aren't tied to a component instance —
 * a missing translation key, a per-theme perf hint, a one-time fallback.
 * For per-component-instance warnings, use the `useDevWarning` hook instead.
 *
 * @example
 * ```ts
 * warnOnce(`theme:${name}`, 'Theme', `"${name}" uses runtime injection.`);
 * ```
 */
export function warnOnce(
	key: string,
	component: string,
	message: string,
	...args: unknown[]
): void {
	if (!isDev || warnedKeys.has(key)) {
		return;
	}
	warnedKeys.add(key);
	console.warn(formatDevMessage(component, message), ...args);
}

/**
 * Clear `warnOnce` dedup state. Test-only.
 *
 * Module-public and **barrel-absent**, exactly as upstream keeps it: its
 * `utils/index.ts` publishes `devWarn`, `devError`, `warnOnce` and
 * `formatDevMessage` and stops there, so the reset is reachable only from this
 * module — which is where the test imports it from. The same arrangement as
 * `__resetLiveRegionsForTest`.
 *
 * @internal
 */
export function __resetDevWarnings(): void {
	warnedKeys.clear();
}
