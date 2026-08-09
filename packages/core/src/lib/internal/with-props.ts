import type { Component } from 'svelte';

/**
 * Binds props onto a component, returning a component that no longer declares
 * them.
 *
 * This exists for exactly one shape, and it is worth stating why rather than
 * leaving it to look like a convenience. Astryx's table plugins wrap the table
 * in a context provider by *closing over* their own state:
 *
 * ```tsx
 * transformTableContext(children) {
 *   return <SelectionStoreContext value={store}>{children}</SelectionStoreContext>;
 * }
 * ```
 *
 * Svelte reads context at component **init**, so the port's `TablePlugin`
 * returns a provider *component* instead — `TableContextProvider`, which
 * `BaseTable` renders around the table. That type is `Component<{children}>`:
 * there is no prop slot through which a plugin could hand its state to the
 * provider, and a plugin hook cannot declare a component inline the way JSX
 * closes over `store`. The batch-10 scope components (`SideNavRenderScope`)
 * take their value as a prop precisely because *their* consumer is a `.svelte`
 * file that can pass one; a plugin hook is a `.ts` module and cannot.
 *
 * So the closure has to be re-created, and this is the whole of it. A Svelte 5
 * component is invoked as `Component(internals, props)` in **both** compile
 * modes — `(anchor, props)` on the client and `(renderer, props)` on the
 * server — which is what makes one mode-agnostic wrapper possible. Verified
 * against the compiler output for both targets rather than assumed.
 *
 * Props are merged by **descriptor**, not by spread: Svelte passes reactive
 * props as getters on the props object, and `{...props}` would read them once
 * and freeze them. `Object.defineProperties` keeps a getter a getter, and keeps
 * every key an *own* property, which `Object.create(props, …)` would not — the
 * runtime enumerates props, so inherited keys would go missing.
 *
 * Bound props win over passed ones, matching JSX: in
 * `<Ctx value={store}>{children}</Ctx>` the plugin's own value is not
 * overridable by the caller.
 */
export function withProps<
	// `Record<string, any>` is the constraint `Component` itself declares, and it
	// has to be matched: a props *interface* has no implicit index signature, so
	// `Record<string, unknown>` would reject every real component and silently
	// fall back to inferring `Props` as the constraint.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Props extends Record<string, any>,
	Bound extends Partial<Props>
>(component: Component<Props>, bound: Bound): Component<Omit<Props, keyof Bound>> {
	const boundDescriptors = Object.getOwnPropertyDescriptors(bound);

	return ((internals: never, props: Omit<Props, keyof Bound>) =>
		component(
			internals,
			Object.defineProperties(
				{},
				{ ...Object.getOwnPropertyDescriptors(props ?? {}), ...boundDescriptors }
			) as Props
		)) as unknown as Component<Omit<Props, keyof Bound>>;
}
