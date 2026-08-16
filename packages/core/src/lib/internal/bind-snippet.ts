import type { Snippet } from 'svelte';

/**
 * Partially applies a one-parameter snippet, yielding the zero-parameter
 * `Snippet` a table plugin's render-prop slots are typed as.
 *
 * ## Why this exists
 *
 * An Astryx table plugin fills `HeaderCellRenderProps.content` / `after` /
 * `overlay` / `below` and `TableColumn.renderCell` with markup that closes over
 * **per-cell** data — the column, its index, the content a prior plugin already
 * put there. In React those are `ReactNode`s and JSX closes over whatever is in
 * scope. In Svelte the slot is a `Snippet`, a snippet can only be authored in a
 * `.svelte` file, and a plugin hook is a `.ts` module: there is nothing for it
 * to close over with.
 *
 * The port's answer is to author the markup as a **parameterised** snippet
 * exported from `<script module>` — which Svelte supports, as long as the
 * snippet references only module-scope bindings — and bind its argument here.
 * `plugins/selection` shows the case that needs no binding at all, because its
 * state arrives by context; this covers the rest.
 *
 * Keeping the published types byte-identical to upstream's is the point. The
 * alternative was widening every slot to accept a `{component, props}`
 * descriptor, which types more honestly but is drift a consumer can see.
 *
 * ## The one subtlety, and how it is contained
 *
 * Svelte compiles snippet **parameters** differently per target: on the client
 * a snippet is `(anchor, ...getters) => void`, on the server
 * `(renderer, ...values) => void`. This binder always passes the *getter*, so
 * the snippet body has to cope with either — which it does by reading the
 * parameter through {@link unwrapSlotArg}:
 *
 * ```svelte
 * {#snippet sortContent(arg)}
 *   {@const a = unwrapSlotArg(arg)}
 *   <SortHeaderButton column={a.column} inner={a.inner} />
 * {/snippet}
 * ```
 *
 * On the client the compiler rewrites the bare `arg` to `arg()`, so `unwrap`
 * receives the resolved value and passes it through. On the server `arg` stays
 * the getter, and `unwrap` calls it. One spelling, both targets, no build-time
 * flag and no sniffing of what the first argument is.
 *
 * **Invariant: the bound argument must be an object, never a function.** That
 * is what makes `unwrapSlotArg`'s test unambiguous, and it is why every call
 * site here binds a single record rather than a bare value.
 */
export function bindSnippet<A extends object>(snippet: Snippet<[A]>, get: () => A): Snippet {
	return ((internals: never) =>
		(snippet as unknown as (internals: never, arg: () => A) => void)(internals, get)) as Snippet;
}

/**
 * Reads a {@link bindSnippet} argument inside the snippet body, normalising the
 * client (value) and server (getter) forms. See the note above for why both
 * reach here and why the argument is always an object.
 */
export function unwrapSlotArg<A extends object>(arg: A | (() => A)): A {
	return typeof arg === 'function' ? (arg as () => A)() : arg;
}

/**
 * {@link bindSnippet} for a slot that keeps **one** parameter open — the row.
 *
 * `TableColumn.renderCell` is `Snippet<[T]>`, and a plugin that wraps or
 * replaces a column's renderer needs the row *and* data that only exists when
 * `transformColumns` runs (the column's key, the renderer it already had).
 * `bindSnippet` collapses to a zero-parameter `Snippet`, which a `renderCell`
 * cannot be, so the row is **folded into the single object argument** instead
 * and the slot snippet stays one-parameter. That keeps one rule for every slot
 * in the batch: a bound snippet takes exactly one argument, and that argument
 * is always an object.
 *
 * `item` arrives in whichever form the compile target uses — a getter on the
 * client, the value on the server — so it is read through {@link unwrapSlotArg},
 * the same normalisation the slot bodies use. The argument handed on is a
 * getter, so the read stays lazy and therefore tracked: a cell re-renders when
 * the state its `get` reads changes, and not otherwise.
 *
 * Two plugins arrived at this independently (`rowExpansion` folded the row in,
 * `tree` forwarded it as a second native parameter). Both work; this is the one
 * kept, because a second parameter would mean a slot body where one argument
 * needs unwrapping and the next does not.
 */
export function bindCellSnippet<T, A extends object>(
	snippet: Snippet<[A]>,
	get: (item: T) => A
): Snippet<[T]> {
	return ((internals: never, item: T | (() => T)) =>
		(snippet as unknown as (internals: never, arg: () => A) => void)(internals, () =>
			get(unwrapSlotArg(item as unknown as object) as unknown as T)
		)) as unknown as Snippet<[T]>;
}

/**
 * Keyed, **identity-stable** binding. Use this, not `bindSnippet`, from a
 * `transformHeaderCell` / `transformBodyRow` / `transformColumns`.
 *
 * ## The defect this exists to prevent
 *
 * `bindSnippet` returns a fresh function on every call, and a plugin transform
 * re-runs whenever the state it reads changes. Svelte's `{@render}` block keys
 * its branch on the **snippet's function identity**, so a new identity tears the
 * branch down and rebuilds it — the rendered element is *replaced*, not updated.
 *
 * That is invisible in most assertions (the markup is identical) and severe in
 * use: the element loses focus, and any DOM state on it goes with it. Concretely
 * — a sortable header button focused by keyboard is destroyed by its own click,
 * so a second <kbd>Enter</kbd> lands on `<body>`; upstream's column-resize suite
 * asserts three successive arrow presses and would fail on the second.
 * Upstream never meets this: React reconciles `<ResizeHandle key={…}/>` by
 * type-and-key, so the node survives.
 *
 * ## How it is fixed
 *
 * One bound snippet per `key` for the binder's lifetime — so the identity
 * `{@render}` sees never changes — while the *argument* stays live, because the
 * bound getter reaches through to whichever `get` the latest transform
 * installed. The snippet body's `{@const a = unwrapSlotArg(arg)}` is a derived,
 * so a changed argument updates the child's props **in place**, with no DOM
 * churn at all. Bind the binder once per hook call (not per transform), and key
 * it by whatever identifies the slot — `column.key` for a header or cell, the
 * row key for a body row.
 *
 * ## THE RULE: `get`'s body must itself perform a reactive read
 *
 * This is a requirement on every call site, not an observation about them. An
 * earlier version of this note asserted that "every call site closes over the
 * config getter, which covers it" — **that was false for three of five**, and the
 * batch-close idiom audit found all three by testing rather than reading.
 *
 * The mechanism: the lookup map is a plain `Map`, not a `SvelteMap`, because a
 * transform runs inside a `{@const}` — a derived — and writing reactive state
 * there throws `state_unsafe_mutation`. So `getters.set(key, get)` wakes
 * nothing. Meanwhile the keying deliberately keeps the snippet's identity
 * stable, so `{@render}` never rebuilds the branch. Between them, the slot's
 * `{@const a = unwrapSlotArg(arg)}` derived is the **only** path by which a new
 * argument can reach the child — and a derived whose dependency set is empty
 * never re-runs. A getter handed only pre-resolved values therefore freezes its
 * child's props for the life of the table.
 *
 * So: **call `config()` inside the getter, and compute every member there.**
 * Hoisting `const cfg = config()` above the getter is the exact mistake, and it
 * is invisible in review because the markup is correct on first render. It has
 * now cost four bugs — `grouped-rows`' chevron froze mid-toggle; `column-resize`
 * froze the splitter's width so Home/End committed the wrong value and a stale
 * neighbour key resized the wrong column; `filtering` never rendered a control
 * whose `searchConfig` arrived after mount; `sortable` froze the header label.
 *
 * ## What this still does not cover
 *
 * Reading `config()` makes the argument track the **config**. It does not make
 * it track the `column`, which arrives as a transform *argument* rather than
 * from a reactive source the getter can read — so a column that keeps its `key`
 * and changes its `header` re-runs the transform without waking the derived.
 * Keying and liveness pull in opposite directions here: the key is what
 * preserves focus across a re-run, and it is also what prevents a rebuild from
 * delivering the new argument. Closing it needs either a key that encodes the
 * argument (losing focus exactly when the content changes, which may be the
 * right trade) or a reactive handle on the resolved column list. Recorded in
 * port/todo.md rather than half-solved.
 */
export function createSlotBinder<A extends object>(
	snippet: Snippet<[A]>
): (key: string, get: () => A) => Snippet {
	const getters = new Map<string, () => A>();
	const bound = new Map<string, Snippet>();

	return (key: string, get: () => A): Snippet => {
		getters.set(key, get);
		let slot = bound.get(key);
		if (slot === undefined) {
			slot = bindSnippet<A>(snippet, () => (getters.get(key) as () => A)());
			bound.set(key, slot);
		}
		return slot;
	};
}

/**
 * {@link createSlotBinder} for a slot that keeps the row parameter open — the
 * `bindCellSnippet` shape. Same identity guarantee, same reasoning; key it by
 * `column.key`, since a `renderCell` is per column and receives its row as the
 * parameter.
 */
export function createCellSlotBinder<T, A extends object>(
	snippet: Snippet<[A]>
): (key: string, get: (item: T) => A) => Snippet<[T]> {
	const getters = new Map<string, (item: T) => A>();
	const bound = new Map<string, Snippet<[T]>>();

	return (key: string, get: (item: T) => A): Snippet<[T]> => {
		getters.set(key, get);
		let slot = bound.get(key);
		if (slot === undefined) {
			slot = bindCellSnippet<T, A>(snippet, (item) => (getters.get(key) as (item: T) => A)(item));
			bound.set(key, slot);
		}
		return slot;
	};
}
