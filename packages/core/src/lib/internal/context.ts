import { getContext, hasContext, setContext } from 'svelte';

/**
 * A typed, keyed wrapper over Svelte's context API.
 *
 * ## Why this is owned rather than imported
 *
 * This class was `runed`'s `Context`, and it was the only thing this package
 * imported from that library — one class, in 39 modules. The cost was out of
 * proportion to it: **555 KB installed, three transitive dependencies**
 * (`dequal`, `esm-env`, `lz-string`), and — the part that actually mattered —
 * `runed` declares peer dependencies on **`@sveltejs/kit`** and **`zod`**.
 * `@astryx-svelte/core` is meant to work in any Svelte 5 application, so a
 * plain-Svelte consumer with no SvelteKit was being asked to satisfy a peer for
 * a framework they had not chosen.
 *
 * Upstream's `@astryxdesign/core` declares exactly one runtime dependency,
 * `intl-messageformat`, and its own reference docs describe the components as
 * "small, accessible, and dependency-free". Carrying three extra packages for
 * ~40 lines of `getContext` wrapper is a drift away from that, not a port of it.
 *
 * ## The API is `runed`'s, deliberately and in full
 *
 * Only `set()` and `getOr()` are called inside this package. The other members
 * are implemented anyway, and that is not speculative generality: the barrel
 * **publishes ten of these instances as public values** (`TableContext`,
 * `SizeContext`, `AppShellMobileContext` and the rest, which is upstream's own
 * split — the context object is exported, its reader is not). A consumer
 * holding one of those can call anything this class exposes, so narrowing the
 * surface would be a breaking change dressed up as a cleanup. Behaviour matches
 * `runed@0.37.1` member for member, including `get()` throwing by name.
 *
 * Every method must be called during component initialisation, which is
 * Svelte's constraint on `getContext`/`setContext` rather than this class's.
 */
export class Context<T> {
	readonly #name: string;
	readonly #key: symbol;

	/** @param name Used for the context key and for `get()`'s error message. */
	constructor(name: string) {
		this.#name = name;
		this.#key = Symbol(name);
	}

	/**
	 * The key this context reads and writes.
	 *
	 * Prefer the methods below; this is exposed because `runed`'s is, and a
	 * consumer holding a published context object may already read it.
	 */
	get key(): symbol {
		return this.#key;
	}

	/** Whether a parent component has set this context. */
	exists(): boolean {
		return hasContext(this.#key);
	}

	/**
	 * The nearest parent's value.
	 *
	 * @throws If no parent has set it — the name is in the message, which is why
	 * the constructor keeps it.
	 */
	get(): T {
		const context = getContext<T | undefined>(this.#key);
		if (context === undefined) {
			throw new Error(`Context "${this.#name}" not found`);
		}
		return context;
	}

	/** The nearest parent's value, or `fallback` when nothing has set it. */
	getOr<Fallback>(fallback: Fallback): T | Fallback {
		const context = getContext<T | undefined>(this.#key);
		if (context === undefined) {
			return fallback;
		}
		return context;
	}

	/** Associate `context` with the current component, and return it. */
	set(context: T): T {
		return setContext(this.#key, context);
	}
}
