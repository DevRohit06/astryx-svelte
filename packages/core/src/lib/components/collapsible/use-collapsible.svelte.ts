import { useCollapsibleGroupContext } from './collapsible-group-context.svelte.js';

/**
 * The collapsible state machine, ported from Astryx's `useCollapsible`. Handles
 * three modes: group-controlled (inside a `CollapsibleGroup` with a `value`),
 * controlled (`isOpen` provided), and uncontrolled (internal state).
 *
 * Options come in as a **getter** so the reactive props a `Collapsible` feeds it
 * (`isOpen`, `onOpenChange`, `value`) stay live — upstream's `useState`/`use`
 * read fresh each render; a getter read at derivation time is the same with
 * nothing to memoise. Returns getters, so consumers read `.isOpen`/`.isEnabled`
 * reactively rather than destructuring.
 */
export type CollapsibleConfig = {
	/** Default open state for uncontrolled usage. @default true */
	defaultIsOpen?: boolean;
	/** Controlled open state. */
	isOpen?: boolean;
	/** Callback when the open state changes. */
	onOpenChange?: (isOpen: boolean) => void;
};

export interface UseCollapsibleOptions {
	/**
	 * Whether the component is collapsible.
	 * - `true` — self-managed, starts open
	 * - `{ defaultIsOpen: false }` — self-managed, starts collapsed
	 * - `{ isOpen, onOpenChange }` — controlled externally
	 */
	isCollapsible?: boolean | CollapsibleConfig;
	/** Unique identifier within a `CollapsibleGroup`; defers state to the group. */
	value?: string;
}

export interface UseCollapsibleReturn {
	/** Whether collapsible behaviour is enabled. */
	readonly isEnabled: boolean;
	/** Whether the content is currently open. */
	readonly isOpen: boolean;
	/** Toggle the open/closed state. */
	toggle: () => void;
}

/** Parse `isCollapsible`: `true` → empty config, object → as-is, else null. */
function parseConfig(
	isCollapsible: boolean | CollapsibleConfig | undefined
): CollapsibleConfig | null {
	return isCollapsible === true ? {} : isCollapsible ? isCollapsible : null;
}

export function useCollapsible(options: () => UseCollapsibleOptions): UseCollapsibleReturn {
	const group = useCollapsibleGroupContext();

	// Internal state for uncontrolled mode, lazily initialised once (React's
	// `useState(() => …)`).
	const initOptions = options();
	const initGroup = group();
	const initConfig = parseConfig(initOptions.isCollapsible);
	const initControlledByGroup = initGroup != null && initOptions.value != null;
	let internalIsOpen = $state(
		initControlledByGroup
			? true
			: initConfig?.isOpen !== undefined
				? initConfig.isOpen
				: (initConfig?.defaultIsOpen ?? true)
	);

	const config = $derived(parseConfig(options().isCollapsible));
	const isEnabled = $derived(config != null);

	const isOpen = $derived.by(() => {
		const g = group();
		const value = options().value;
		if (g != null && value != null) {
			return g.isOpen(value);
		}
		if (config?.isOpen !== undefined) {
			return config.isOpen;
		}
		return internalIsOpen;
	});

	function toggle(): void {
		const g = group();
		const o = options();
		const c = parseConfig(o.isCollapsible);
		if (g != null && o.value != null) {
			g.toggle(o.value);
			return;
		}
		const next = !isOpen;
		// Uncontrolled: internal state is the source of truth.
		if (c?.isOpen === undefined) {
			internalIsOpen = next;
		}
		// Always notify — for both controlled and uncontrolled usage.
		c?.onOpenChange?.(next);
	}

	return {
		get isEnabled() {
			return isEnabled;
		},
		get isOpen() {
			return isOpen;
		},
		toggle
	};
}
