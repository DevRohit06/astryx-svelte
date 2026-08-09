# React → Svelte 5 Translation Patterns

The systematic translation guide for the 1:1 port of Meta's Astryx design system to
Svelte 5 (runes). Every component port follows this document.

**Evidence base**

| Source | Path | Role |
| --- | --- | --- |
| Upstream monorepo | `…/scratchpad/astryx-upstream` | Byte-identical to the installed package (verified: `diff -q packages/core/src/Button/Button.tsx` vs `node_modules/.../Button.tsx` → no difference) |
| Installed source | `D:\astryx-svelte\node_modules\@astryxdesign\core\src` | 499 non-test `.ts`/`.tsx` files, 100 component directories |
| Ported reference | `D:\astryx-svelte\src\lib\astryx\` | `Button`, `Spinner`, `VisuallyHidden`, `sx.ts`, `context.ts` — the house style |
| Style extraction | `D:\astryx-svelte\scripts\extract-astryx-styles.mjs` | Lifts compiled StyleX objects out of `dist` into `src/lib/astryx/generated/` |

**Toolchain facts that shape every rule below**

- Svelte `5.56.7` — `$props.id()`, attachments (`{@attach}` / `createAttachmentKey`),
  `svelte/reactivity` (`MediaQuery`, `createSubscriber`, `SvelteMap`) and
  `svelte/reactivity/window` are all available.
- SvelteKit `^2.63`, Vite `^8`, TypeScript `^6`.
- Astryx targets **React 19**: `forwardRef` count across the whole source tree is
  **0** — `ref` is a plain prop. `useContext` count is **0** — context is read with
  React 19's `use()`. This makes the port meaningfully easier than a React 18 port.

---

## 1. Hook inventory and canonical runes equivalents

Counts are call sites (`grep -rhoE "\bHOOK[(<]"`) across `node_modules/@astryxdesign/core/src`,
split into production and `*.test.ts(x)`.

| React hook | prod call sites | test | Svelte 5 equivalent | Difficulty |
| --- | ---: | ---: | --- | --- |
| `useCallback` | **479** | 2 | *nothing* — delete it, use a plain `function` | trivial |
| `useRef` | **252** | 6 | `bind:this` (DOM) **or** a plain `let` (mutable box) | easy, but two distinct cases |
| `useMemo` | **175** | 4 | `$derived` / `$derived.by` | trivial |
| `useState` | **129** | 49 | `let x = $state(…)` | trivial |
| `useId` | **102** | 0 | `$props.id()` | trivial |
| `useEffect` | **80** | 1 | `$effect` (+ `onMount` for mount-only) | **medium — semantics differ** |
| `use(SomeContext)` | **56** | — | `getContext` + getter-function wrapper | **medium — reactivity trap** |
| `createContext` | **46** (40 files) | 0 | `setContext` with a `Symbol.for` key | easy |
| `useTransition` | 16 | 0 | `let isPending = $state(false)` around `await` | easy |
| `useOptimistic` | 16 | 0 | a `$state` mirror reset from a `$effect` | **medium** |
| `useSyncExternalStore` | 6 | 0 | `createSubscriber` / `MediaQuery` from `svelte/reactivity` | easy |
| `useImperativeHandle` | 5 | 0 | instance `export function` + `bind:this` on the component | easy |
| `useIsomorphicLayoutEffect` | 5 hooks | 0 | `$effect.pre` | easy |
| `useInsertionEffect` | 2 | 0 | `$effect.pre` in the root layout, or module-scope injection | easy |
| `useLayoutEffect` (direct) | 1 | 0 | `$effect.pre` | easy |
| `useReducer`, `useDeferredValue`, `useActionState`, `useDebugValue`, `useContext`, `forwardRef` | **0** | 0 | n/a | — |

Astryx also defines **24 shared hooks** in `src/hooks/` and **48 component-local
hooks** (`use*.ts(x)` outside `src/hooks/`, e.g. `Layer/useLayer.tsx`,
`Table/plugins/**/useTable*.tsx`).

### 1.1 `useCallback` (479) — delete it

`useCallback` exists purely to stabilise function identity across React re-renders.
Svelte has no re-render, so a function declared in the instance `<script>` is already
created once per component instance. **Every `useCallback` becomes a plain function.**

```tsx
// React — src/hooks/useFocusTrap.ts:218
const focusFirst = useCallback(() => {
  if (containerRef.current) {
    focusFirstDescendant(containerRef.current);
  }
}, []);
```

```svelte
<!-- Svelte -->
<script lang="ts">
	let container: HTMLElement | null = $state(null);

	function focusFirst() {
		if (container) focusFirstDescendant(container);
	}
</script>
```

Dependency arrays carry no information worth preserving — they are React bookkeeping.
The one thing to read them for is a *staleness bug the array was papering over*; note
it and move on.

### 1.2 `useRef` (252) — two different things wearing one name

**(a) DOM element ref → `bind:this`.** This is the majority case.

```tsx
// React — src/Text/Text.tsx:250
const textRef = useRef<HTMLElement>(null);
…
<Component ref={mergeRefs(ref, truncation.ref, textRef)} … />
```

```svelte
<!-- Svelte -->
<script lang="ts">
	let textEl = $state<HTMLElement | null>(null);
</script>

<svelte:element this={as} bind:this={textEl} …></svelte:element>
```

Use `$state` for the binding **only when the template or a `$derived` reads it**
(as in the ported `Spinner`, where `$effect` reads `canvas`). A ref that is only
read inside event handlers can be a plain `let` and skip the reactive overhead.

**(b) Mutable non-reactive box → a plain `let`.** React uses `useRef` for
"I want to mutate this without re-rendering". In Svelte a plain `let` *is* that.

```tsx
// React — src/Button/Button.tsx:602 + src/Layer/useLayer.tsx
const actionInFlightRef = useRef(false);
const isOpenRef = useRef(false); // "Ref mirrors isOpen for synchronous reads"
```

```svelte
<!-- Svelte — src/lib/astryx/Button/Button.svelte (ported) -->
<script lang="ts">
	let isPending = $state(false);
	// clickAction is normally fire-once (submit/save/pay), so a same-tick double
	// click must dedupe — a plain pending flag set in a microtask would not.
	let actionInFlight = false; // NOT $state — deliberately non-reactive
</script>
```

The `isOpenRef`/`isOpen` **ref-mirrors-state pair** in `useLayer.tsx` exists solely to
dodge React stale closures. In Svelte the state variable is always current, so the
pair collapses into one `$state` variable. This is one of the largest single sources
of deleted code in the port.

**(c) Callback refs.** React 19 callback refs (with cleanup return) map to Svelte
**attachments**:

```tsx
// React — src/Layer/useLayer.tsx:432
const ref: RefCallback<HTMLElement> = (el) => {
  if (triggerRef.current && triggerRef.current !== el) removeAnchorName(triggerRef.current, anchorId);
  if (el) addAnchorName(el, anchorId);
  triggerRef.current = el;
};
```

```svelte
<!-- Svelte -->
<script lang="ts">
	const anchor = (node: HTMLElement) => {
		addAnchorName(node, anchorId);
		return () => removeAnchorName(node, anchorId);
	};
</script>

<button {@attach anchor}>Trigger</button>
```

Attachments are strictly better than callback refs here: they re-run when their
reactive dependencies change and their return value is the teardown.

### 1.3 `useMemo` (175) → `$derived` / `$derived.by`

```tsx
// React — src/i18n/InternationalizationProvider.tsx
const value = useMemo(
  () => ({locale, messages: messages ?? {}, overrides}),
  [locale, messages, overrides],
);
```

```svelte
<script lang="ts">
	const value = $derived({ locale, messages: messages ?? {}, overrides });
</script>
```

Multi-statement bodies use `$derived.by(() => { … })`. `$derived` in Svelte is
**lazy and memoised with automatic dependency tracking** — no array, and no risk of a
missing dependency. The ported `Button` uses it for every computed value:

```svelte
const isLoadingState = $derived(isLoading || isPending);
const buttonDisabled = $derived(isDisabled || groupDisabled || (isLoadingState && !isInterruptible));
const rootProps = $derived(sx(styles.base, sizeStyles[size], variants[variant], …));
```

`useMemo` used purely as a perf hedge (cheap object literals) can also be inlined —
but keeping `$derived` costs nothing and preserves the 1:1 reading.

### 1.4 `useState` (129) → `$state`

```tsx
// React — src/Layer/useLayer.tsx:410
const [isOpen, setIsOpen] = useState(false);
…
setIsOpen(true);
```

```svelte
<script lang="ts">
	let isOpen = $state(false);
	// …
	isOpen = true;
</script>
```

**Lazy initialiser** `useState(() => expr)` — used in `useEntryAnimation` to snapshot a
module flag exactly once — becomes a plain read, because a Svelte instance script runs
once anyway:

```tsx
// React — src/hooks/useEntryAnimation.ts:122
const [animate] = useState(() => initialPaintComplete);
return animate ? styles[preset] : null;
```

```svelte
<script lang="ts">
	// Runs once at component init — no lazy-initialiser ceremony needed.
	const animate = initialPaintComplete;
	const entryStyle = animate ? styles[preset] : null;
</script>
```

**Functional updates** `setX(prev => prev + 1)` become `x += 1`. **Never** write
`x = x + 1` inside a `$effect` that also reads `x` — that self-referential loop is a
Svelte error, whereas React tolerated it.

### 1.5 `useId` (102) → `$props.id()`

Astryx calls `useId` heavily for ARIA wiring — `Switch.tsx` alone allocates three
(`id`, `descriptionID`, `statusMessageID`), and every Field-based input does the same.

```tsx
// React — src/Switch/Switch.tsx:368
const id = useId();
const descriptionID = useId();
const statusMessageID = useId();
```

```svelte
<script lang="ts">
	const uid = $props.id();
	const inputId = `${uid}-input`;
	const descriptionId = `${uid}-desc`;
	const statusId = `${uid}-status`;
</script>
```

`$props.id()` is the direct analogue: **SSR-stable and hydration-safe**, one call per
component instance. Prefer *one* `$props.id()` plus suffixes over three separate calls —
fewer ids in the DOM and the relationship between them is legible. Never derive an id
from `Math.random()`, a module counter, or `crypto.randomUUID()`: all three produce a
server/client mismatch under SvelteKit SSR.

Note `useLayer.tsx` strips colons from the React id (`id.replace(/:/g, '')`) to build a
CSS `anchor-name`. `$props.id()` produces CSS-safe ids, so that sanitising step is
dropped — but keep an explicit `--astryx-layer-` prefix since a bare id is not a valid
dashed-ident.

### 1.6 `useEffect` (80) → `$effect`, `onMount`, or *nothing*

This is the highest-risk translation. The mapping is **not** 1:1; classify each effect
first.

| React shape | Svelte |
| --- | --- |
| `useEffect(fn, [])` — mount only, touches DOM/subscribes | `onMount(fn)` (its return is the teardown) |
| `useEffect(fn, [a, b])` — re-runs on change | `$effect(() => { … })`, reading `a`/`b` inside |
| `useLayoutEffect` / `useIsomorphicLayoutEffect` | `$effect.pre` |
| `useInsertionEffect` (style injection) | `$effect.pre`, or module-scope injection guarded by `if (typeof document !== 'undefined')` |
| effect that only derives state from props | delete it — use `$derived` |

```tsx
// React — src/hooks/useScrollLock.ts:34
useEffect(() => {
  if (!isLocked) return;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const {body} = document;
  const prevOverflow = body.style.overflow;
  body.style.overflow = 'hidden';
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  return () => {
    body.style.overflow = prevOverflow;
    body.style.position = prevPosition;
    window.scrollTo(scrollX, scrollY);
  };
}, [isLocked]);
```

```ts
// Svelte — src/lib/astryx/hooks/scrollLock.svelte.ts
export function scrollLock(isLocked: () => boolean): void {
	$effect(() => {
		if (!isLocked()) return;

		const scrollX = window.scrollX;
		const scrollY = window.scrollY;
		const { body } = document;
		const prev = {
			overflow: body.style.overflow,
			position: body.style.position,
			top: body.style.top
		};

		body.style.overflow = 'hidden';
		body.style.position = 'fixed';
		body.style.top = `-${scrollY}px`;

		return () => {
			body.style.overflow = prev.overflow;
			body.style.position = prev.position;
			body.style.top = prev.top;
			window.scrollTo(scrollX, scrollY);
		};
	});
}
```

Three behavioural differences that bite:

1. **Dependencies are tracked, not declared.** Anything *synchronously read* inside the
   effect becomes a dependency. Values read after an `await`, or inside a nested
   callback, are **not** tracked. The ported `Spinner` handles this explicitly:

   ```svelte
   $effect(() => {
   	if (canvas == null) return;
   	// Track reactivity explicitly — the draw reads these.
   	const { border, diameter } = SIZES[size];
   	const currentShade = shade;
   	…
   });
   ```

   Use `untrack()` when a React dep array deliberately omitted something.

2. **`$effect` never runs on the server.** Neither does `useEffect`, so this is a
   match — but it means SSR output must be correct without it.

3. **Effects are not for deriving state.** A React `useEffect` that calls `setState`
   from props is almost always a `$derived` in Svelte. Convert it; do not port it.

### 1.7 `useTransition` (16) + `useOptimistic` (16) — the async-action pattern

Astryx pairs these in every action-driven control (`Button`, `Switch`, `TextInput`,
`Selector`, `Pagination`, …): `useOptimistic` shows the intended value immediately,
`useTransition` reports pending while the caller's async action settles.

```tsx
// React — src/Switch/Switch.tsx:373 + :430
const [optimisticValue, setOptimisticValue] = useOptimistic(value);
const isBusy = isLoading || optimisticValue !== value;
const isOn = optimisticValue === true;
…
onChange={e => {
  if (isDisabled || isBusy) return;
  const checked = e.target.checked;
  onChange?.(checked, e);
  if (changeAction && !e.defaultPrevented) {
    startTransition(async () => {
      setOptimisticValue(checked);
      await changeAction(checked, e);
    });
  }
}}
```

```svelte
<!-- Svelte -->
<script lang="ts">
	let { value, isLoading = false, isDisabled = false, onchange, changeAction }: Props = $props();

	// Optimistic overlay: non-null while an action is in flight, then discarded.
	// React's useOptimistic auto-reverts when the transition settles; here we
	// clear it explicitly in the `finally`, and reset it whenever the committed
	// `value` prop changes underneath us.
	let optimistic = $state<boolean | null>(null);
	$effect(() => {
		value; // track the committed value
		optimistic = null;
	});

	const optimisticValue = $derived(optimistic ?? value);
	const isBusy = $derived(isLoading || optimistic !== null);
	const isOn = $derived(optimisticValue === true);

	async function handleChange(event: Event & { currentTarget: HTMLInputElement }) {
		if (isDisabled || isBusy) return;
		const checked = event.currentTarget.checked;
		onchange?.(checked, event);
		if (changeAction && !event.defaultPrevented) {
			optimistic = checked;
			try {
				await changeAction(checked, event);
			} finally {
				optimistic = null;
			}
		}
	}
</script>
```

`useTransition`'s `isPending` collapses to a plain `$state` flag, exactly as the ported
`Button` does:

```svelte
let isPending = $state(false);
…
actionInFlight = true;
isPending = true;
try { await clickAction(event); } finally { actionInFlight = false; isPending = false; }
```

The React version keeps a separate `actionInFlightRef` because "a same-tick double
click must dedupe — which neither `isPending` nor `useOptimistic` do"
(`Button.tsx:599`). The Svelte port keeps that distinction intact: `isPending` is
`$state` (drives the UI), `actionInFlight` is a plain `let` (drives the guard,
synchronously).

### 1.8 `useSyncExternalStore` (6) → `createSubscriber` / `MediaQuery`

Call sites: `hooks/useMediaQuery.ts`, `Kbd/Kbd.tsx` (platform detection),
`Overlay/useOverlay.tsx` (touch detection), `Table/plugins/selection/useTableSelection.tsx`
(×2), `theme/useTheme.ts`.

```tsx
// React — src/hooks/useMediaQuery.ts:35
export function useMediaQuery(query: string, serverDefault = false): boolean {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', onStoreChange);
    return () => mql.removeEventListener('change', onStoreChange);
  }, [query]);
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => serverDefault, [serverDefault]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

```ts
// Svelte — src/lib/astryx/hooks/mediaQuery.svelte.ts
import { MediaQuery } from 'svelte/reactivity';

/**
 * `serverDefault` is the SSR/pre-hydration value, matching upstream's
 * getServerSnapshot. Svelte wraps the query in parentheses itself, so strip the
 * outer pair that upstream call sites include (`'(max-width: 768px)'`).
 */
export function mediaQuery(query: string, serverDefault = false) {
	return new MediaQuery(query.replace(/^\(([\s\S]*)\)$/, '$1'), serverDefault);
}
```

```svelte
<script lang="ts">
	// The value lives on `.current` — read it inside a $derived, never destructure it.
	const isMobile = mediaQuery('(max-width: 768px)', defaultIsMobile);
	const columns = $derived(isMobile.current ? 1 : 3);
</script>
```

`MediaQuery` from `svelte/reactivity` (`constructor(query, fallback?)`, since 5.7) is a
direct, SSR-safe replacement including the `serverDefault` fallback. For the non-media stores (`useTableSelection`'s external
store), use `createSubscriber`:

```ts
import { createSubscriber } from 'svelte/reactivity';

export class SelectionView<T> {
	#subscribe: () => void;
	constructor(private store: SelectionStore<T>) {
		this.#subscribe = createSubscriber((update) => store.subscribe(update));
	}
	get snapshot() {
		this.#subscribe();
		return this.store.getSnapshot();
	}
}
```

### 1.9 `useImperativeHandle` (5) → instance exports + `bind:this`

Call sites: `Calendar`, `Chat/ChatComposerInput`, `PowerSearch`, `SideNav`, `Tokenizer`.

```tsx
// React — src/Tokenizer/Tokenizer.tsx:426
useImperativeHandle(handleRef, () => ({
  focus: () => inputRef.current?.focus(),
  clear: () => setQuery(''),
}));
```

```svelte
<!-- Tokenizer.svelte -->
<script lang="ts">
	let input = $state<HTMLInputElement | null>(null);
	let query = $state('');

	// Instance exports form this component's imperative handle.
	export function focus() { input?.focus(); }
	export function clear() { query = ''; }
</script>
```

```svelte
<!-- Consumer -->
<script lang="ts">
	let tokenizer = $state<Tokenizer>();
</script>

<Tokenizer bind:this={tokenizer} />
<button onclick={() => tokenizer?.focus()}>Focus</button>
```

`ChatComposerInput.tsx:352` notes that it "can't rely on `useImperativeHandle`'s"
timing and keeps a parallel `selfRef` for internal consumers. Svelte instance exports
are available as soon as the component is mounted and are the *same* object internally
and externally, so that workaround disappears.

### 1.10 `useInsertionEffect` (2) and `useLayoutEffect` → `$effect.pre`

`useInsertionEffect` is used only for CSS injection (`theme/Theme.tsx:111`,
`CodeBlock/CodeBlock.tsx:592`). `useIsomorphicLayoutEffect` (client `useLayoutEffect`,
server `useEffect`) backs `useGridFocus`, `useListFocus`, `useOverflow`, `useTreeFocus`
— i.e. every measure-then-mutate hook.

```tsx
// React — src/hooks/useOverflow.ts:209
useIsomorphicLayoutEffect(() => { calculate(); }, [calculate]);
```

```ts
// Svelte
$effect.pre(() => {
	itemCount; // track
	calculate();
});
```

`$effect.pre` runs **before** the DOM update flush, which is the measure-first ordering
those hooks need. The whole `useIsomorphicLayoutEffect` indirection is deleted: Svelte
effects never run on the server, so there is no SSR warning to suppress.

> **`$effect.pre` is not the blanket answer for `useLayoutEffect`.** React's layout
> effects run *after* mutation, before paint; `$effect.pre` runs *before* the DOM patch,
> and plain `$effect` runs after it but still pre-paint. So the mapping splits by what
> the effect does:
>
> - **Measure-then-mutate** (`useOverflow`, `useListFocus`, roving-tabindex repair) →
>   `$effect.pre`. These need the pre-mutation geometry, which is what the rule above is
>   calibrated for.
> - **Mutate-only** (focus handoff, `showModal()`/`close()`) → plain **`$effect`**. These
>   must observe the patched DOM. Two concrete cases: `ToastViewport`'s focus handoff
>   queries `[data-toast-id]` *after* the dismissed toast has left the list — under
>   `$effect.pre` the exiting node is still there and the handoff targets it. `Lightbox`'s
>   open/close effect would call `showModal()` before a simultaneous index change had
>   patched the `<img src>`.
>
> Both were caught by `astryx-idiom` audits against this section, so the split is
> recorded here rather than re-derived each time.

---

## 2. Astryx's shared hooks (`src/hooks/`) and their Svelte designs

24 exported hooks. The Svelte convention: a `.svelte.ts` module exporting a factory
that takes **getter functions** for reactive inputs and returns an object with getters
(and/or an attachment) — this is the only shape that keeps reactivity across the
module boundary.

| Hook | What it does | Svelte design |
| --- | --- | --- |
| `useFocusTrap` | WAI-ARIA dialog focus trap: document focus listener redirects escapes back in, handles Tab/Shift+Tab, restores prior focus on deactivate | `focusTrap(node, opts)` **attachment** — `isActive` via getter; teardown restores focus. Ports directly, no DOM-model changes. |
| `useAnnounce` | Singleton polite/assertive live regions appended to `document.body`, mutated (not born) with content, cleared then re-set in a rAF | Module-level singleton, unchanged. Export a plain `announce(message, politeness?)` function — it has no reactive state at all, so it needs no rune. |
| `useGridFocus` | 2-D roving-tabindex grid nav (Calendar) | attachment + returned handlers; `$effect.pre` for the tab-stop repair |
| `useListFocus` | Linear list nav: arrows/Home/End, `wrap`, `orientation`, `isRtl`, `hasRovingTabIndex`, `hasCaretGuard` | attachment on the container; expose `focusItem/focusFirst/focusLast`. The `handleKeyDown`/`handleFocus` return values become `onkeydown`/`onfocusin` handlers the caller spreads. |
| `useTreeFocus` | WAI-ARIA tree keyboard model (TreeList) | as `useListFocus` |
| `useHotkeys` | Global document-level shortcuts | `$effect` registering/removing listeners; hotkey list via getter |
| `useTypeahead` | APG first-character type-to-focus | plain object + timer in a `.svelte.ts` factory |
| `useKeyboardHint` | Ephemeral arrow-key hint layer (uses `useLayer`, `Kbd`) | needs the Layer port first (§5); returns a snippet-renderable hint |
| `useMediaQuery` | SSR-safe `matchMedia` via `useSyncExternalStore` | **`new MediaQuery(query, serverDefault)`** from `svelte/reactivity` |
| `useOverflow` | Measures horizontal overflow, returns `visibleCount`/`hasOverflow` + `containerRef`/`measureRef` | two attachments + `$state` counts; `$effect.pre` for `calculate()` |
| `useScrollOverflow` | Tracks scroll-position edges (Carousel fade edges, button state) | attachment + `$state` edge flags |
| `useScrollLock` | Pins `body` with `position:fixed` (iOS Safari) and restores scroll | `$effect` with cleanup — see §1.6 worked example |
| `useEntryAnimation` | Returns a StyleX animation style **only** if the element mounted after first paint; module flag set in a rAF | Module flag + a plain read at init (§1.4). Keep the `typeof window !== 'undefined'` guard — upstream relies on `'use client'` for this, which SvelteKit does not have. |
| `useStreamingText` | Smooths bursty streamed text into steady character reveal; consumes `useMediaQuery` + `useTheme` | `.svelte.ts` class with `$state` buffer + rAF loop in `$effect`; must respect `prefersReducedMotion` from `svelte/reactivity` |
| `useImageMode` | Samples image luminance → `'dark' \| 'light' \| null` | async `$effect` with canvas sampling; guard `document` |
| `useClickableContainer` | Card-is-clickable while nested buttons/links keep their own clicks (`INTERACTIVE_SELECTORS`, ancestor walk) | pure DOM logic → attachment returning `onclick`/`onmouseup`; `INTERACTIVE_SELECTORS` exported unchanged |
| `useInputContainer` | Clicks on the wrapper delegate focus to the inner input | attachment; identical DOM logic |
| `useInteractiveRole` | Resolves `'link' \| 'button' \| 'inert'` from `href` / `onClick` / context | plain function reading `InteractiveRoleContext` via `getContext`; drives `<svelte:element>` / `{#if}` branching (§4.3) |
| `useLongPress` | Touch long-press with `delayMs` + `moveCancelPx` (ContextMenu) | attachment returning touch handlers |
| `useMenuHover` | Hover-intent for nav menus; wraps `useListFocus` | `.svelte.ts` factory composing the list-focus factory |
| `useIsomorphicLayoutEffect` | client `useLayoutEffect` / server `useEffect` | **deleted** — `$effect.pre` |
| `useInteractiveRoleContext` | context read | `getContext` (§3) |
| `focusableSelector` | `FOCUSABLE_SELECTOR` constant | copy verbatim — no React in it |

Plus 48 component-local hooks. The high-leverage ones are `Layer/useLayer.tsx` (§5),
`i18n/useTranslator.ts` (§7), `Link/useLinkComponent.ts`, `Popover/usePopover.tsx`,
`Overlay/useOverlay.tsx`, and the 12 `Table/plugins/**` hooks (the largest single
subsystem in the port).

### 2.1 The canonical `.svelte.ts` hook shape

```ts
// src/lib/astryx/hooks/listFocus.svelte.ts
export interface ListFocusOptions {
	itemSelector?: () => string;
	wrap?: () => boolean;
	orientation?: () => 'horizontal' | 'vertical' | 'both';
	hasRovingTabIndex?: () => boolean;
	onEscape?: () => void;
}

export function listFocus(options: ListFocusOptions = {}) {
	let container: HTMLElement | null = $state(null);

	const orientation = $derived(options.orientation?.() ?? 'vertical');
	const wrap = $derived(options.wrap?.() ?? true);

	// Roving tab-stop repair: measure-then-mutate, so `.pre`.
	$effect.pre(() => {
		if (!container || !(options.hasRovingTabIndex?.() ?? false)) return;
		stampTabStop(container, options.itemSelector?.() ?? '[role="menuitem"]');
	});

	return {
		/** Attach to the list container. */
		attach: (node: HTMLElement) => {
			container = node;
			return () => { container = null; };
		},
		onkeydown(event: KeyboardEvent) { /* … */ },
		onfocusin(event: FocusEvent) { /* … */ },
		focusItem(index: number) { /* … */ },
		focusFirst(): boolean { /* … */ },
		focusLast(): boolean { /* … */ }
	};
}
```

**Rule:** reactive *inputs* are getter functions; reactive *outputs* are `get`
accessors on the returned object. Passing a raw value in, or destructuring the object
out, severs reactivity — this is the single most common Svelte-5 porting mistake.

---

## 3. Context

### 3.1 How Astryx uses React context

46 `createContext` declarations across 40 files; 56 `use(SomeContext)` reads. The
pattern is uniform — a context module, a nullable default, and a `useX()` reader:

```ts
// React — src/ButtonGroup/ButtonGroupContext.ts
export const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);
ButtonGroupContext.displayName = 'ButtonGroupContext';

export function useButtonGroup(): ButtonGroupContextValue | null {
  return use(ButtonGroupContext);
}
```

```ts
// React — src/SizeContext/SizeContext.ts
export const SizeContext = createContext<ElementSize | null>(null);

export function useSize<T extends string = ElementSize>(sizeProp?: T, defaultSize: T = 'md' as T): T {
  const inherited = use(SizeContext);
  return sizeProp ?? (inherited as T | null) ?? defaultSize;
}
```

Note the recurring resolution order: **explicit prop → inherited context → component
default**. Preserve it exactly.

The context inventory to port includes `SizeContext`, `ButtonGroupContext`,
`InteractiveRoleContext`, `LayerContext`, `ToastContext`, `DialogContext`,
`FormLayoutContext`, `ListContext`, `CheckboxListContext`, `CollapsibleGroupContext`,
`ChatMessage/List/Composer/LayoutContext`, `AvatarSizeContext`, `AvatarGroupContext`,
`BreadcrumbContext`, `CommandPaletteContext`, `DropdownMenuContext`, `LinkContext`,
`ThemeContext`, `InternationalizationContext`, and the Table plugin contexts.

### 3.2 The Svelte reactivity trap

`getContext` **reads the value once, at component initialisation**. If a provider does
`setContext(KEY, someValue)` and later mutates its own state, descendants that already
called `getContext` still hold the original snapshot. React's context propagates
updates; Svelte's does not — this is the single sharpest edge in the whole port.

`src/lib/astryx/context.ts` already solves it: **store a getter function in the
context, never a value.**

```ts
// src/lib/astryx/context.ts (ported, verbatim)
const SIZE_KEY = Symbol.for('astryx.size');
const BUTTON_GROUP_KEY = Symbol.for('astryx.buttonGroup');

/**
 * Contexts hold getter functions rather than values so a container can pass a
 * reactive `$derived`/`$state` through and descendants still re-read it.
 */
export function provideSize(get: () => ControlSize | undefined): void {
	setContext(SIZE_KEY, get);
}

/** Resolves an explicit prop over an inherited container size over the default. */
export function useSize(explicit: ControlSize | undefined, fallback: ControlSize): ControlSize {
	if (explicit != null) return explicit;
	if (!hasContext(SIZE_KEY)) return fallback;
	return getContext<() => ControlSize | undefined>(SIZE_KEY)() ?? fallback;
}

export function provideButtonGroup(get: () => ButtonGroupContext): void {
	setContext(BUTTON_GROUP_KEY, get);
}

export function useButtonGroup(): ButtonGroupContext | null {
	if (!hasContext(BUTTON_GROUP_KEY)) return null;
	return getContext<() => ButtonGroupContext>(BUTTON_GROUP_KEY)() ?? null;
}
```

Provider side:

```svelte
<!-- ButtonGroup.svelte -->
<script lang="ts">
	let { orientation = 'horizontal', isDisabled = false, children }: Props = $props();

	// The getter closes over live state, so descendants re-read the current value.
	provideButtonGroup(() => ({ orientation, isDisabled }));
</script>
```

Rules:

1. `setContext` values are **always functions**. Only ever store a getter (or an object
   whose properties are `get` accessors, or a `.svelte.ts` class instance whose fields
   are `$state`).
2. `hasContext` guards the "no provider" case. React returns the `createContext`
   default; Svelte throws or returns `undefined`, so the guard is mandatory wherever
   upstream has a nullable default. **`useSize` and `useButtonGroup` both do this.**
3. Keys are `Symbol.for('astryx.<name>')` — collision-proof, and stable across module
   duplication in a monorepo/HMR.
4. **`getContext` must be called during component init.** The ported `Button` calls
   `useButtonGroup()` at the top level (correct) but wraps `useSize` inside
   `$derived(useSize(sizeProp, 'md'))`. That works today because the derived is first
   evaluated during the initial render, while the component context is still current —
   but it is fragile. **House rule for new ports: capture the getter at init, then call
   it inside `$derived`:**

   ```svelte
   const getSize = getSizeContext();               // init — safe
   const size = $derived(sizeProp ?? getSize() ?? 'md'); // reactive read
   ```

---

## 4. Props patterns

### 4.1 `children` → `Snippet`

```tsx
// React
interface Props { children: ReactNode; }
…
<div>{children}</div>
```

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	interface Props { children?: Snippet; }
	const { children }: Props = $props();
</script>

<div>{@render children?.()}</div>
```

Named slot props (`icon`, `endContent`, `startContent`, `labelIcon`, `title`, `footer`
— Astryx uses `ReactNode` props pervasively) all become `Snippet` props:

```svelte
<!-- src/lib/astryx/Button/Button.svelte (ported) -->
interface Props … {
	icon?: Snippet;
	endContent?: Snippet;
	children?: Snippet;
}
…
{#if icon}
	<span class={iconWrapperProps.class} style={iconWrapperProps.style}>
		{@render icon()}
	</span>
{/if}
```

**`isRenderable` (`src/utils/isRenderable.ts`) does not port.** React needs it because
`null | undefined | true | false | ''` all render nothing. A Svelte `Snippet` is either
present or `undefined`, so the check collapses to `icon != null`. The ported `Button`
uses exactly that: `children != null`.

Reusing a block in two branches — as `Button` does for the `<a>` and `<button>` cases —
is a **local snippet**, which has no React analogue and is strictly better than the
React `const content = (<>…</>)` variable:

```svelte
{#snippet content()}
	…shared markup…
{/snippet}

{#if renderAsLink}
	<a …>{@render content()}</a>
{:else}
	<button …>{@render content()}</button>
{/if}
```

### 4.2 Render props → `Snippet` with parameters

13 render-prop props exist upstream (`renderItem`, `renderOption`, `renderToken`,
`renderCell`, `overflowRenderer`, `transformTableContext`).

```tsx
// React — src/CommandPalette/CommandPalette.tsx:83
renderItem?: (item: T, isSelected: boolean) => ReactNode;
…
{renderItem ? renderItem(item, isSelected) : <DefaultItem item={item} />}
```

```svelte
<script lang="ts" generics="T">
	interface Props {
		renderItem?: Snippet<[item: T, isSelected: boolean]>;
	}
	const { renderItem }: Props = $props();
</script>

{#each items as item, i (getKey(item.id, i))}
	{#if renderItem}
		{@render renderItem(item, item === selected)}
	{:else}
		<DefaultItem {item} />
	{/if}
{/each}
```

`Snippet<[A, B]>` is the direct type-level equivalent of `(a: A, b: B) => ReactNode`.
Use `generics="T"` on the `<script>` tag to keep the generic component signature.

`renderToken?: (item: T, onRemove: () => void) => ReactNode` becomes
`Snippet<[item: T, onRemove: () => void]>` — snippet parameters can be functions.

### 4.3 `as` polymorphism → `<svelte:element>` (or an `{#if}` branch)

Upstream `as` props: `Text` (`'span' | 'p' | 'div' | 'label' | 'h1'…'h3'`),
`VisuallyHidden`, `Stack`, `StackItem`, `Item`, `Layer`'s render container
(`'div' | 'span'`).

```tsx
// React — src/Text/Text.tsx:220
export function Text({ as: Component = 'span', … }: TextProps) {
  return <Component ref={…} {...mergeProps(…)}>{children}</Component>;
}
```

```svelte
<!-- src/lib/astryx/VisuallyHidden/VisuallyHidden.svelte (ported) -->
<script lang="ts">
	interface Props extends HTMLAttributes<HTMLElement> {
		as?: 'span' | 'div';
		children?: Snippet;
	}
	const { as = 'span', children, ...rest }: Props = $props();
</script>

<svelte:element this={as} {...rest} class={CLIP}>
	{@render children?.()}
</svelte:element>
```

Use `<svelte:element>` when the branches differ **only** in tag name. Use an explicit
`{#if}` when the branches carry different attributes — the ported `Button` splits `<a>`
vs `<button>` because only one takes `href`/`target`/`rel` and only the other takes
`type`/`disabled`/`aria-busy`. This mirrors `useInteractiveRole`'s three-way
`'link' | 'button' | 'inert'` resolution, which should become a three-branch `{#if}`.

Caveat: `<svelte:element>` cannot render a *component*, only a tag string. Astryx's
`LinkComponent` injection (`Link/useLinkComponent.ts` — a consumer-supplied
`next/link`-style component) therefore needs a `linkComponent` prop typed as
`Component<…>` and rendered as `<svelte:component>`/`{@const Link = …}` rather than
`<svelte:element>`.

### 4.4 Ref forwarding → `bind:this` (+ attachments)

React 19 means `ref` is already a plain prop everywhere (`ref?: React.Ref<HTMLDivElement>`
appears on essentially every component). Two Svelte translations:

- **Consumer wants the DOM node:** the consumer writes
  `<Button bind:this={buttonComponent} />` for the *component instance*, and the
  component exposes the node via an instance export if needed. There is no
  `bind:this` pass-through for an inner DOM node — expose it explicitly:

  ```svelte
  <script lang="ts">
  	let el = $state<HTMLButtonElement | null>(null);
  	export function getElement() { return el; }
  </script>
  <button bind:this={el} …></button>
  ```

- **Consumer wants to run code against the node** (the majority of real `ref` uses —
  focus management, anchor registration, measurement): accept an **attachment** prop
  and spread it. This is closer to React 19's callback-ref-with-cleanup than `bind:this`
  is, and it composes without a `mergeRefs`.

**`mergeRefs` (`src/utils/mergeRefs.ts`) does not port.** Multiple attachments can be
applied to the same element (`{@attach a} {@attach b}`), so there is nothing to merge.

### 4.5 Prop spreading

```tsx
// React
export function Badge({ label, variant, className, style, ...props }: BadgeProps) {
  return <span {...mergeProps(themeProps('badge', {variant}), stylex.props(…), className, style)} {...props} />;
}
```

```svelte
<script lang="ts">
	const { label, variant = 'neutral', class: className, style: styleProp, ...rest }: Props = $props();
	const rootProps = $derived(sx(styles.base, variants[variant]));
</script>

<span
	data-astryx-component="badge"
	data-astryx-variant={variant}
	{...rest}
	class={cx(rootProps.class, className)}
	style={mergeStyle(rootProps.style, styleProp as string | undefined)}
>{label}</span>
```

**Ordering is load-bearing.** Put `data-*` reflection attributes *before* `{...rest}`
(so a consumer can override them), and `class`/`style` *after* `{...rest}` (so the
merged StyleX output is never clobbered by a raw `class` in rest props). The ported
`Button` follows exactly this order. `class:` is the reserved word — destructure it as
`class: className`.

### 4.6 `xstyle` / `className` / `style` merging

React does this in one `stylex.props()` call plus `mergeProps`:

```tsx
{...mergeProps(
  themeProps('text', {type, size, color: resolvedColor}),
  stylex.props(colorStyles[resolvedColor], sizeByTypeStyles[styleType], …, xstyle),
  className,
  {...style, ...inlineStyle},
)}
```

Svelte splits it across three helpers in `src/lib/astryx/sx.ts`:

| React | Svelte | Notes |
| --- | --- | --- |
| `stylex.props(...)` → `{className, style: object}` | `sx(...)` → `{class, style: string}` | `sx` serialises the CSS-custom-property object into a `style` string, because Svelte's `style` attribute is a string |
| appending consumer `className` | `cx(generated, className)` | also accepts arrays/objects (`ClassValue`) |
| `{...styleObj, ...consumerStyle}` | `mergeStyle(generated, consumer)` | later wins, as in React |
| `themeProps('button', {variant, size})` | literal `data-astryx-*` attributes | see house rule H7 |
| `xstyle?: StyleXStyles` | last argument to `sx(...)` | keep it last so consumer overrides win |

Critically, **all style objects go through a single `sx()` call**, exactly as upstream
funnels everything into a single `stylex.props()` call — this is what produces
byte-identical atomic class output and correct last-wins deduplication. Never call
`sx()` twice and concatenate.

Because the StyleX compiler *inlines* single-call-site styles, some class strings have
no entry in the extracted objects. Copy those verbatim from `dist` as named constants,
as the ported `Button`/`Spinner`/`VisuallyHidden` do:

```svelte
<script lang="ts" module>
	// Classes the StyleX compiler inlined at their single call sites upstream, so
	// they have no entry in the extracted style objects.
	const SPINNER_OVERLAY = 'x10l6tqk x13vifvy xu96u03 x3m8u43 x1ey2m1c xrvj5dj x1ku5rj1';
	const LABEL_TEXT = 'xb3r6kr xlyipyv xeuugli';
</script>
```

**`mergeProps` (`src/utils/mergeProps.ts`) does not port.** Its four-argument
overloading exists to reconcile React's props-object model; `cx` + `mergeStyle` +
attribute ordering cover the same ground with less machinery.

---

## 5. Portals and layers

### 5.1 The good news: Astryx barely uses portals

Grepping the whole source tree for `createPortal` / `react-dom` yields **three** hits:

- `Chat/ChatComposerInput.tsx:670` — token chips rendered into contenteditable spans
- `Chat/useChatComposerTokens.ts` — the token-portal list feeding the above
- `Toast/useToast.tsx` — `createRoot` for the fallback toast viewport

Everything else — `Popover`, `Tooltip`, `HoverCard`, `Dialog`, `DropdownMenu`,
`ContextMenu`, `CommandPalette`, `Lightbox`, `Toast` — goes through `Layer/useLayer.tsx`,
which uses **the native Popover API plus CSS anchor positioning**, not a portal:

```tsx
// React — src/Layer/useLayer.tsx:527 (renderContext)
<Container
  ref={popoverRefCallback}
  id={id}
  role={role}
  popover={lightDismiss ? 'auto' : 'manual'}
  className={combinedClassName}
  style={{...stylexResult.style, ...anchorStyle, ...extraStyle}}>
  {children}
</Container>
```

`anchorStyle` is `{positionAnchor, positionArea, positionTryFallbacks}` derived from
logical `placement`/`alignment` via `getPositionArea()` and `getPositionTryFallbacks()`.
The trigger gets its `anchor-name` from a callback ref (`addAnchorName`/`removeAnchorName`).

**Consequence: the absence of `createPortal` in Svelte is a non-issue for the Layer
system.** The browser promotes `[popover]` elements into the top layer; DOM position is
irrelevant to stacking. The `as: 'div' | 'span'` option exists precisely so a layer
inside a `<p>` stays phrasing content and does not get reparented by the HTML parser —
that concern is identical in Svelte and the same option must be kept.

### 5.2 Porting `useLayer`

```ts
// src/lib/astryx/Layer/layer.svelte.ts
export function layer(options: { mode: 'context' | 'fixed'; lightDismiss?: () => boolean; onShow?: () => void; onHide?: () => void }) {
	const uid = $props.id();                       // SSR-stable (§1.5)
	const anchorId = `--astryx-layer-${uid}`;      // already CSS-safe, no `:` stripping

	let isOpen = $state(false);
	let popover = $state<HTMLElement | null>(null);

	function show() {
		if (!popover || isOpen) return;
		// The Popover API is unsupported on Safari <17 / Firefox <125 — feature-check
		// (upstream finding infra-4) and fall back to plain visibility.
		if (typeof popover.showPopover === 'function') popover.showPopover();
		else popover.style.display = 'block';
		isOpen = true;
		options.onShow?.();
	}

	function hide() { /* mirror of show(), with hidePopover / display:none */ }

	/** Trigger attachment: registers this layer's anchor-name, cleans up on detach. */
	const anchor = (node: HTMLElement) => {
		addAnchorName(node, anchorId);
		return () => removeAnchorName(node, anchorId);
	};

	/** Popover attachment: binds the `toggle` listener that reconciles browser-initiated closes. */
	const surface = (node: HTMLElement) => {
		popover = node;
		const onToggle = (e: Event) => {
			if ((e as ToggleEvent).newState === 'closed' && isOpen) { isOpen = false; options.onHide?.(); }
		};
		node.addEventListener('toggle', onToggle);
		return () => { node.removeEventListener('toggle', onToggle); popover = null; };
	};

	return { anchor, surface, anchorId, id: uid, show, hide, get isOpen() { return isOpen; } };
}
```

Everything the React version needs three refs and a `useEffect` for
(`listenedElRef` / `listenedHandlerRef` / the re-bind effect, all to defeat stale
closures and handler-identity churn — see the `infra-10` comment) is handled by the
attachment's own cleanup. This is the largest complexity reduction in the port.

The `render(children, props)` function becomes a **snippet the consumer renders inside
the popover element**, because a Svelte function cannot return markup:

```svelte
<!-- Tooltip.svelte -->
<script lang="ts">
	const l = layer({ mode: 'context' });
	const surfaceProps = $derived(sx(layerStyles.base, xstyle));
	const positionStyle = $derived(
		positioning === 'custom'
			? `position-anchor:${l.anchorId}`
			: `position-anchor:${l.anchorId};position-area:${getPositionArea(placement, alignment)};` +
			  `position-try-fallbacks:${getPositionTryFallbacks(placement, alignment)}`
	);
</script>

<button {@attach l.anchor} aria-describedby={l.id} onmouseenter={l.show} onmouseleave={l.hide}>
	{@render trigger()}
</button>

<svelte:element
	this={as}
	{@attach l.surface}
	id={l.id}
	{role}
	popover={lightDismiss ? 'auto' : 'manual'}
	class={cx(surfaceProps.class, className)}
	style={mergeStyle(surfaceProps.style, positionStyle, styleProp)}
>
	{@render content()}
</svelte:element>
```

### 5.3 When you genuinely need a portal

For the three real portal sites, and for any layer that must escape `overflow:hidden`
*without* the Popover API, the Svelte equivalent is an **attachment that moves the node**:

```ts
export function portal(target: () => HTMLElement = () => document.body) {
	return (node: HTMLElement) => {
		const parent = target();
		parent.appendChild(node);
		return () => node.remove();
	};
}
```

Two hard constraints:

1. **SSR renders the node in place.** The move happens on the client after mount, so
   the server HTML and the hydrated DOM differ by node position. Only portal content
   that is client-only (wrap in `{#if mounted}`) or that hydrates identically first.
2. `Toast`'s `createRoot` fallback (mounting a detached React tree with mirrored
   `data-theme` attributes via `MutationObserver`) maps to Svelte's `mount()` from
   `svelte` — but prefer porting `LayerProvider` first so the fallback path is rarely
   taken. Keep the `syncRootThemeAttrs` MutationObserver logic verbatim; it is pure DOM.

---

## 6. Focus, events, and the a11y utilities

### 6.1 Ports directly (pure DOM, no React)

| Utility | Verdict |
| --- | --- |
| `hooks/focusableSelector.ts` (`FOCUSABLE_SELECTOR`) | copy verbatim |
| `hooks/useClickableContainer.ts` (`INTERACTIVE_SELECTORS`, ancestor walk) | copy the logic; wrap as an attachment |
| `hooks/useAnnounce.ts` (singleton live regions, clear-then-rAF-set) | copy verbatim as a module function — it has **no** React state, only `useCallback` |
| `hooks/useFocusTrap.ts` internals (`focusFirstDescendant`, `isImeKeyEvent`, `hasActiveFocusTrapEscape`) | copy verbatim |
| `utils/inputAria.ts` (`joinAriaIDs`, describedby composition) | copy verbatim |
| `utils/sharedResizeObserver.ts` (one `ResizeObserver` for the whole app) | copy verbatim — a singleton observer is framework-agnostic and still the right call |
| `utils/color.ts`, `dateParser.ts`, `timeParser.ts`, `plainDate.ts`, `dateTypes.ts`, `parseStyleKey.ts`, `naming.ts`, `groupItems.ts` | copy verbatim |

### 6.2 Needs rework

**`utils/composeEventHandlers.ts`.** React needs it because a component that owns an
interaction *and* accepts a consumer handler for the same event via `{...rest}` would
otherwise have one clobber the other.

```tsx
// React
<button onClick={composeEventHandlers(onClickProp, handleSelect)} />
```

In Svelte, `{...rest}` spreading `onclick` and an explicit `onclick={handleSelect}` on
the same element: **the later one wins**, silently dropping the consumer's. The ported
`Button` solves it by destructuring `onclick` out of the props and calling it manually,
preserving the "consumer first, can `preventDefault()` to opt out" ordering:

```svelte
<script lang="ts">
	const { onclick, ...rest }: Props = $props();

	async function handleClick(event: MouseEvent) {
		if (buttonDisabled || (actionInFlight && !isInterruptible)) {
			event.preventDefault();
			return;
		}
		onclick?.(event as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
		if (clickAction && !event.defaultPrevented) { … }
	}
</script>
<button {...rest} onclick={handleClick}>
```

**House rule: any event a component handles itself must be destructured out of `$props()`
and invoked explicitly, in upstream's documented order.** Never rely on spread ordering.

**`utils/mergeRefs.ts`** — deleted (§4.4). **`utils/isRenderable.ts`** — deleted (§4.1).
**`utils/getKey.ts`** — still useful, but its output feeds `{#each … (key)}` rather than a
React `key` prop; keep it so list identity semantics match upstream exactly.

**Event name casing.** React `onClick`/`onKeyDown`/`onMouseEnter`/`onChange` →
Svelte `onclick`/`onkeydown`/`onmouseenter`/`onchange`. React `onChange` on inputs fires
on every keystroke; the DOM `change` event does not — **React `onChange` maps to Svelte
`oninput`** for text inputs, and to `onchange` for checkbox/radio/select. Getting this
wrong silently breaks every controlled input in the port.

**Synthetic events.** React's `SyntheticEvent` is a pooled wrapper; Svelte hands over the
native event. `event.currentTarget` typing needs
`Event & { currentTarget: EventTarget & HTMLInputElement }`. `event.defaultPrevented`,
`preventDefault()`, `stopPropagation()` all behave identically.

**Focus/blur bubbling.** React's `onFocus`/`onBlur` bubble (they are really
`focusin`/`focusout`); the native `focus`/`blur` do **not**. A React `onFocus` on a
container that relies on bubbling from a nested input — e.g. `Switch.tsx`'s disabled-message
tooltip, which comments "focusin bubbles up from the native input" — must become
`onfocusin`/`onfocusout` in Svelte, not `onfocus`/`onblur`. `useListFocus`'s `handleFocus`
(the roving-tabindex repair hook) is in this category.

---

## 7. i18n

### 7.1 How it works upstream

- **Catalogs.** `@astryxdesign/core/locales/en.json` (186 keys) and `pseudo.json`.
  Keys are namespaced `@astryx.<component>.<name>`; each entry is
  `{defaultMessage, description}` (Crowdin `react_intl` file-type shape).
- **Resolution** (`src/i18n/resolve.ts`) — a pure, React-free module:
  1. per-locale override for the exact tag → 2. override for a parent tag
  (`pt-BR` → `pt`) → 3. shipped catalog for the exact tag → 4. shipped catalog for a
  parent tag → 5. the **bundled `en` catalog** (statically imported, always present)
  → 6. the key itself, with a warn-once.
  `resolveLocaleChain()` canonicalises via `Intl.Locale().baseName`.
- **Formatting.** `intl-messageformat`; parsed `IntlMessageFormat` instances are cached
  in a module `Map` keyed `${locale}::${message}`. Static messages (no `values`) skip
  the parser entirely.
- **Context.** `InternationalizationContext` defaults to `{locale: 'en', messages: {}}`,
  so a consumer that renders **no provider still gets English** — a hard requirement to
  preserve.
- **Consumption.** `useTranslator()` returns a `useCallback`-stable
  `(key, values?) => string`. ~40 components use it.
- **Pluggability.** A `Translator` interface (`format(message, values?, locale?)`) lets
  consumers inject react-intl / Lingui / i18next.

### 7.2 Svelte port

`resolve.ts`, `types.ts`, `translator.ts` and the catalog JSON **port verbatim** — zero
React in them. Only the context layer changes:

```ts
// src/lib/astryx/i18n/context.ts
import { getContext, hasContext, setContext } from 'svelte';
import { resolve } from './resolve.js';
import type { Locale, MessagesByLocale, Overrides } from './types.js';

const I18N_KEY = Symbol.for('astryx.i18n');

interface I18nValue { locale: Locale; messages: MessagesByLocale; overrides?: Overrides }

/** Getter-based, per §3.2, so a runtime locale swap reaches every descendant. */
export function provideI18n(get: () => I18nValue): void {
	setContext(I18N_KEY, get);
}

/** Matches upstream's context default: no provider ⇒ English from the bundled catalog. */
const DEFAULT: I18nValue = { locale: 'en', messages: {} };

export function useTranslator(): (key: string, values?: Record<string, unknown>) => string {
	const get = hasContext(I18N_KEY)
		? getContext<() => I18nValue>(I18N_KEY)
		: () => DEFAULT;
	// Read lazily at call time so the translator follows a locale change.
	return (key, values) => {
		const { locale, messages, overrides } = get();
		return resolve(key, values, locale, messages, overrides);
	};
}
```

```svelte
<!-- InternationalizationProvider.svelte -->
<script lang="ts">
	let { locale, messages, overrides, children }: Props = $props();
	provideI18n(() => ({ locale, messages: messages ?? {}, overrides }));
</script>

{@render children?.()}
```

Component usage — capture at init, call inside `$derived` so the string tracks the locale:

```svelte
<script lang="ts">
	const t = useTranslator();
	const nextLabel = $derived(t('@astryx.pagination.next'));
	const pageLabel = $derived(t('@astryx.pagination.pageOfTotal', { current, total }));
</script>
```

Notes:

- `intl-messageformat` must be added to `dependencies` — it is currently only a
  transitive dep of `@astryxdesign/core`.
- The `en.json` import uses an import attribute (`with {type: 'json'}`); Vite handles
  JSON imports natively, so drop the attribute if it trips the TS/Vite combination.
- The formatter cache is a module-level `Map`. Under SSR that is **shared across
  requests** — acceptable here (it is keyed by locale+message and holds no user data),
  but the `warnedMissing` set likewise persists, so a missing key warns once per server
  process rather than once per request. Match upstream and document it.

---

## 8. SSR concerns under SvelteKit

SvelteKit SSRs by default and there is no `'use client'` escape hatch. Astryx relies on
`'use client'` in ~every file, so several assumptions need re-checking.

| Hazard | Symptom | Rule |
| --- | --- | --- |
| **Module-scope `window`/`document`** | build/SSR crash | Guard every module-level browser access. `useEntryAnimation` already does (`if (typeof window !== 'undefined')`); `useAnnounce`'s `getRegions()` does (`if (typeof document === 'undefined') return null`). `useIsomorphicLayoutEffect`'s `typeof window !== 'undefined'` check disappears with the hook. |
| **`$effect` never runs on the server** | anything painted only by an effect is missing from SSR HTML | The server-rendered markup must be *correct*, not merely non-crashing. The `Spinner` canvas is drawn in `$effect`, so SSR emits an empty `<canvas>` at the right size — acceptable. A layout that depends on measurement must SSR to a sane default. |
| **Hydration-unstable IDs** | `Hydration failed` / mismatched `aria-*` wiring | **Only `$props.id()`.** Never `Math.random`, module counters, or `crypto.randomUUID()`. |
| **Device/viewport-dependent branches** | flash + hydration mismatch | `MediaQuery(query, serverDefault)` — pass the `serverDefault` upstream already threads through `useMediaQuery(query, serverDefault)`. Same for `Kbd`'s `isMac` and `useOverlay`'s `isTouchDevice`: SSR to the documented default, correct after hydration. |
| **`Intl` differences** | server/client formatting mismatch | `intl-messageformat` is deterministic given the same locale data; Node and browsers can still differ on ICU builds. Format dates/numbers in `$derived` (client-corrected after hydration) rather than baking them into SSR HTML where exactness matters. |
| **Portals** | node position differs between SSR and hydrated DOM | See §5.3 — only client-only content may be portalled. The `[popover]` path has no such problem. |
| **Module singletons** | state leaks between requests | `useAnnounce`'s live regions, `sharedResizeObserver`, `Toast`'s fallback root are all DOM-bound and thus client-only — safe. The i18n `formatterCache`/`warnedMissing` are shared but content-keyed — safe, documented. **Never** put user- or request-scoped state in a module-level variable. |
| **`document.body.appendChild` at init** | SSR crash | Defer to `onMount`/`$effect`, or guard with `typeof document !== 'undefined'`. |
| **`getComputedStyle` in `$derived`** | derived runs during SSR → crash | Measurement belongs in `$effect`/`$effect.pre`, never in `$derived`. |

Escape hatches: `import { browser } from '$app/environment'` for a hard client-only
branch, and `export const ssr = false` per-route as a last resort (avoid — it defeats
the point of a 1:1 port).

---

## 9. Porting checklist

Run top to bottom for each component.

**Prepare**
1. Read the upstream `<Name>.tsx` **and** its `<Name>.doc.mjs` — the doc file is the
   props/behaviour contract and lists the SYNC'd files.
2. Read `<Name>.test.tsx` for the behaviours that must survive.
3. Run `node scripts/extract-astryx-styles.mjs <Name>` to generate
   `src/lib/astryx/generated/<Name>/<Name>.styles.js`.
4. Diff the generated style-object keys against every `stylex.props(...)` argument in
   the `.tsx`. Any style used at a single call site was **inlined by the compiler** and
   has no entry — copy its class string verbatim from `dist/<Name>/<Name>.js` into a
   named constant in `<script module>`.

**Translate**
5. Port the props interface: extend the right `svelte/elements` attribute type,
   `Omit<>` what upstream omits, `children`/slots → `Snippet`, render props →
   `Snippet<[…]>`, `xstyle` → last `sx()` argument. Keep upstream prop names and
   JSDoc verbatim.
6. Hooks, in order: delete every `useCallback`; `useMemo` → `$derived`; `useState` →
   `$state`; classify each `useRef` as DOM (`bind:this`/attachment) or mutable box
   (plain `let`); `useId` → one `$props.id()` + suffixes; classify each `useEffect`
   (§1.6) and delete the derive-state-from-props ones.
7. Contexts: `use(XContext)` → the getter-based reader with a `hasContext` guard;
   providers call `provideX(() => …)`.
8. Events: rename to lowercase; `onChange` on text inputs → `oninput`;
   `onFocus`/`onBlur` that relied on bubbling → `onfocusin`/`onfocusout`; destructure
   any handler the component itself owns out of `$props()` and call it explicitly in
   upstream's order (`composeEventHandlers` replacement).
9. Element output: one `sx(...)` call for all styles; `cx(rootProps.class, className)`;
   `mergeStyle(rootProps.style, styleProp)`; `data-astryx-*` before `{...rest}`,
   `class`/`style` after.
10. Polymorphism: `<svelte:element>` when only the tag changes, `{#if}` when the
    attributes differ.

**Verify**
11. `node scripts/verify-classes.mjs` (or a manual diff) — the emitted atomic class
    list must be **byte-identical** to upstream's for every prop combination.
12. `npm run check` — zero `svelte-check` errors, no `any` leaking into the public props.
13. SSR: render the component in a SvelteKit route, load with JS disabled, confirm the
    markup is correct and there is no hydration warning in the console.
14. A11y parity: every `aria-*`, `role`, `tabindex` and live region from upstream is
    present, with the same conditional logic (e.g. `Button`'s `needsAriaLabel` triple
    condition).
15. Add the export to `src/lib/astryx/index.ts` — the component **and** its public types.
16. Port any *new* shared hook into `src/lib/astryx/hooks/<name>.svelte.ts` using the
    §2.1 shape, not inline in the component.

---

## 10. House-style rules (derived from the ported Button)

**H1 — File layout.** `<script lang="ts" module>` for exported types, compile-time
constants and inlined StyleX class strings; `<script lang="ts">` for props and instance
logic; local `{#snippet}`s; then markup. One component per `.svelte` file, in a
directory named after it.

**H2 — Props are destructured once, `const`, with defaults inline.**
```svelte
const { label, variant = 'secondary', size: sizeProp, class: className, style: styleProp, onclick, ...rest }: Props = $props();
```
Rename `class` → `className`, `style` → `styleProp`, and any prop shadowing a derived
name (`size` → `sizeProp`) — matching upstream's `as: Component = 'div'` renaming habit.

**H3 — Everything computed is `$derived`.** No imperative recomputation, no `$effect`
that assigns state derivable from props.

**H4 — `$state` only when the template or a `$derived` reads it.** Guards, in-flight
flags and dedupe latches stay plain `let`, with a comment explaining why
(`// clickAction is normally fire-once …, so a same-tick double click must dedupe`).

**H5 — One `sx()` call per element.** Then `cx()` for class merging and `mergeStyle()`
for style merging. Never concatenate two `sx()` results.

**H6 — Attribute order:** `data-astryx-*` → `{...rest}` → `class` → `style` → `aria-*`
→ event handlers. Consumers can override data attributes; they cannot clobber styles.

**H7 — Reflect props as `data-astryx-*`.** The ported components emit
`data-astryx-component`, `data-astryx-variant`, `data-astryx-size`,
`data-astryx-spinner-shade`. This replaces upstream's `themeProps()` + `astryx-*` class
tokens. Keep it consistent; theme CSS and tests target these.

**H8 — Comments explain *why*, in upstream's voice.** Port the reasoning, not just the
code — e.g. "Disabled links are an accessibility anti-pattern — fall back to `<button>`",
"Delay the spinner reveal … so a fast action that settles within the delay never flashes
one". Where the Svelte implementation *differs*, say so explicitly (as `sx.ts` does:
"React consumes that as `{className, style}` where `style` is an object; Svelte needs
`class` and a serialized `style` string, so we translate").

**H9 — Shared markup is a local `{#snippet}`,** not a duplicated block or a
`{@html}` string.

**H10 — Context keys are `Symbol.for('astryx.<name>')`; context values are always
getter functions; readers always `hasContext`-guard.**

**H11 — `$props.id()` is the only id source.**

**H12 — Handlers the component owns are destructured out and called explicitly,**
preserving upstream's documented ordering and `defaultPrevented` short-circuit.

**H13 — Types are exported from `<script module>`** (`export type ButtonVariant = …`)
and re-exported from `src/lib/astryx/index.ts` alongside the component.

**H14 — Never edit `src/lib/astryx/generated/**`.** Regenerate it.

---

## Appendix: the hardest translation problems, ranked

1. **`use(Context)` → `getContext`** (56 sites, 40 context modules). Svelte context is
   read once at init; every one must be wrapped in the getter-function idiom or
   descendants silently freeze at their initial value. Highest bug-density risk in the
   whole port.
2. **`useEffect` classification** (80 sites). Auto-tracked dependencies, no
   post-`await` tracking, and the "effects are not for deriving state" rule mean this is
   the one hook that cannot be translated mechanically.
3. **`useOptimistic` + `useTransition`** (16 + 16 sites, every form control). React
   auto-reverts the optimistic value when the transition settles; Svelte has no such
   machinery, so the revert must be written explicitly *and* re-armed when the committed
   prop changes underneath.
4. **`useRef`'s dual meaning** (252 sites). Getting the DOM-ref vs mutable-box call
   wrong yields either a missing reactive update or an infinite effect loop.
5. **Event-name and semantics drift.** `onChange` → `oninput`, `onFocus` → `onfocusin`,
   and the loss of `composeEventHandlers` — all silent failures, none caught by types.
6. **StyleX inlined classes.** Single-call-site styles vanish from the extracted objects
   and must be hand-copied from `dist`; missing one produces a visually-broken component
   with no error.
7. **`useLayer`'s render function** — a function returning JSX has no Svelte analogue;
   it must be re-shaped into snippets + attachments the consumer renders. (Offset by the
   fact that the Popover API means **no portal is needed**.)
