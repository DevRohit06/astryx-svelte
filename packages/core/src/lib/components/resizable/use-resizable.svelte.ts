/**
 * Ported from Astryx's `Resizable/useResizable.ts`.
 *
 * The size model is pure state arithmetic — nothing here measures the DOM, and
 * `ResizeHandle` only ever hands it a *delta*. That is what makes the keyboard
 * path identical to the pointer one, and what lets the whole hook transcribe.
 *
 * Two React devices go. The two refs (`preCollapseSize`, `dragStartSize`) are
 * plain `let`s: they exist upstream only because a value has to survive a
 * re-render without causing one, which is what a non-reactive binding already
 * is here. And every `useCallback` is a plain function — the options arrive as a
 * getter read at *call* time, so there is no dependency list to keep and no
 * stale closure to dodge.
 *
 * What could not transcribe is the return. React recomputes `size`,
 * `isCollapsed` and `props` on every render; a plain object here would freeze a
 * consumer at the values it had on mount, so those three are **getters** — the
 * shape `useMediaQuery` established.
 */

export interface ResizableRegionConfig {
	/** Default size in pixels, or percentage string (e.g. '20%'). */
	defaultSize?: number | string;
	/** Minimum size in pixels. @default 50 */
	minSizePx?: number;
	/** Maximum size in pixels. @default Infinity */
	maxSizePx?: number;
	/** Whether this region can collapse to 0. @default false */
	collapsible?: boolean;
	/** Size in px at which dragging triggers collapse. @default 40 */
	collapsedSize?: number;
	/** Pixel values to snap to during resize. */
	snaps?: number[];
	/** Cascade priority — lower number shrinks first. */
	shrinkOrder?: number;
}

/**
 * Shared config shape for any component that integrates built-in resize
 * (e.g. SideNav's `resizable` prop). A simplified surface over the full
 * `ResizableRegionConfig`.
 */
export interface ResizableConfig {
	/** Initial width in pixels. @default 260 */
	defaultWidth?: number;
	/** Minimum width in pixels. @default 180 */
	minWidth?: number;
	/** Maximum width in pixels. @default 480 */
	maxWidth?: number;
	/** localStorage key for persisting width. */
	autoSaveId?: string;
	/** Called when the width changes (on drag end). */
	onWidthChange?: (width: number) => void;
}

export interface UseResizableSingleConfig extends ResizableRegionConfig {
	/** Unique key for localStorage persistence. */
	autoSaveId?: string;
	/** Called when size changes during drag. */
	onSizeChange?: (size: number) => void;
	/** Called when collapse state changes (via drag or programmatic). */
	onCollapseChange?: (isCollapsed: boolean) => void;
}

export interface UseResizableMultiConfig {
	/** Layout direction. @default 'horizontal' */
	direction?: 'horizontal' | 'vertical';
	/** Named region configurations. */
	regions: Record<string, ResizableRegionConfig>;
	/** Unique key for localStorage persistence. */
	autoSaveId?: string;
}

export interface ResizableRegion {
	/** Current size in pixels. */
	readonly size: number;
	/** Whether the region is currently collapsed. */
	readonly isCollapsed: boolean;
	/** Collapse the region (if collapsible). */
	collapse: () => void;
	/** Expand from collapsed state. */
	expand: () => void;
	/** Resize to a specific pixel value. */
	resize: (size: number) => void;
	/** Props to pass to a component's `resizable` prop or to `ResizeHandle`. */
	readonly props: ResizableProps;
}

export interface ResizableProps {
	_size: number;
	_isCollapsed: boolean;
	_onResizeStart: () => void;
	_onResizeMove: (delta: number) => void;
	_onResizeEnd: () => void;
	_minSizePx: number;
	_maxSizePx: number;
	_snaps: number[];
	_collapsedSize: number;
	/** Whether the region supports collapsing. */
	_collapsible: boolean;
	_isResizableProps: true;
}

const DEFAULT_MIN = 50;
const DEFAULT_COLLAPSED_SIZE = 40;
const STORAGE_PREFIX = 'astryx-resizable:';

function clampSize(size: number, min: number, max: number, snaps: number[]): number {
	const clamped = Math.min(max, Math.max(min, size));

	// When snap points are defined, always snap to the nearest one.
	// No intermediate positions — the panel can only rest at snap values.
	if (snaps.length > 0) {
		let nearest = snaps[0];
		let nearestDist = Math.abs(clamped - nearest);
		for (let i = 1; i < snaps.length; i++) {
			const dist = Math.abs(clamped - snaps[i]);
			if (dist < nearestDist) {
				nearest = snaps[i];
				nearestDist = dist;
			}
		}
		return Math.min(max, Math.max(min, nearest));
	}

	return clamped;
}

function loadPersistedSize(key: string): number | null {
	if (typeof window === 'undefined') {
		return null;
	}
	try {
		const raw = localStorage.getItem(STORAGE_PREFIX + key);
		if (raw != null) {
			const parsed = JSON.parse(raw);
			if (typeof parsed === 'number') {
				return parsed;
			}
		}
	} catch {
		/* ignore */
	}
	return null;
}

function persistSize(key: string, size: number): void {
	if (typeof window === 'undefined') {
		return;
	}
	try {
		localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(size));
	} catch {
		/* ignore */
	}
}

function resolveDefaultSize(defaultSize: number | string | undefined): number {
	if (defaultSize == null) {
		return 250;
	}
	if (typeof defaultSize === 'number') {
		return defaultSize;
	}
	if (defaultSize.endsWith('%')) {
		const pct = parseFloat(defaultSize);
		if (!isNaN(pct)) {
			const approx = typeof window !== 'undefined' ? window.innerWidth : 1200;
			return Math.round((pct / 100) * approx);
		}
	}
	return 250;
}

function useSingleResizable(config: () => UseResizableSingleConfig): ResizableRegion {
	// Read once, for the initial state only — upstream's lazy `useState`
	// initialisers, which likewise see the config as it was on mount.
	const first = config();
	const resolvedFirstDefault = resolveDefaultSize(first.defaultSize);
	const persisted = first.autoSaveId ? loadPersistedSize(first.autoSaveId) : null;
	const initial = persisted ?? resolvedFirstDefault;

	const initialSize = clampSize(
		initial,
		first.minSizePx ?? DEFAULT_MIN,
		first.maxSizePx ?? Infinity,
		first.snaps ?? []
	);

	let size = $state(initialSize);
	let isCollapsed = $state(persisted === 0 && (first.collapsible ?? false));

	// Upstream's two refs, seeded from the same initial size its `useRef(size)`
	// captures. Neither drives rendering — they only carry a value across an
	// interaction — so a plain binding is the whole of what a ref was.
	let preCollapseSize = initialSize;
	let dragStartSize = initialSize;

	const resolvedDefault = $derived(resolveDefaultSize(config().defaultSize));
	const minSizePx = $derived(config().minSizePx ?? DEFAULT_MIN);
	const maxSizePx = $derived(config().maxSizePx ?? Infinity);
	const collapsible = $derived(config().collapsible ?? false);
	const collapsedSize = $derived(config().collapsedSize ?? DEFAULT_COLLAPSED_SIZE);
	const snaps = $derived(config().snaps ?? []);
	const autoSaveId = $derived(config().autoSaveId);

	$effect(() => {
		if (autoSaveId) {
			persistSize(autoSaveId, isCollapsed ? 0 : size);
		}
	});

	function collapse(): void {
		if (!collapsible) {
			return;
		}
		preCollapseSize = size;
		isCollapsed = true;
		size = 0;
		config().onCollapseChange?.(true);
		config().onSizeChange?.(0);
	}

	function expand(): void {
		isCollapsed = false;
		const restored = preCollapseSize || resolvedDefault;
		const newSize = clampSize(restored, minSizePx, maxSizePx, snaps);
		size = newSize;
		config().onCollapseChange?.(false);
		config().onSizeChange?.(newSize);
	}

	function resize(newSize: number): void {
		const clamped = clampSize(newSize, minSizePx, maxSizePx, snaps);
		size = clamped;
		isCollapsed = false;
		config().onSizeChange?.(clamped);
	}

	function onResizeStart(): void {
		dragStartSize = isCollapsed ? 0 : size;
	}

	function onResizeMove(delta: number): void {
		const raw = dragStartSize + delta;
		if (collapsible && raw < collapsedSize) {
			if (!isCollapsed) {
				preCollapseSize = size;
				config().onCollapseChange?.(true);
			}
			isCollapsed = true;
			size = 0;
			config().onSizeChange?.(0);
			return;
		}
		if (isCollapsed && raw >= collapsedSize) {
			isCollapsed = false;
			config().onCollapseChange?.(false);
		}
		const clamped = clampSize(raw, minSizePx, maxSizePx, snaps);
		size = clamped;
		config().onSizeChange?.(clamped);
	}

	function onResizeEnd(): void {
		// Sizes already committed during move
	}

	return {
		get size() {
			return isCollapsed ? 0 : size;
		},
		get isCollapsed() {
			return isCollapsed;
		},
		collapse,
		expand,
		resize,
		get props(): ResizableProps {
			return {
				_size: isCollapsed ? 0 : size,
				_isCollapsed: isCollapsed,
				_onResizeStart: onResizeStart,
				_onResizeMove: onResizeMove,
				_onResizeEnd: onResizeEnd,
				_minSizePx: minSizePx,
				_maxSizePx: maxSizePx,
				_snaps: snaps,
				_collapsedSize: collapsedSize,
				_collapsible: collapsible,
				_isResizableProps: true
			};
		}
	};
}

/**
 * Multi-region form — one `useSingleResizable` per named region.
 *
 * Region keys must be stable, as upstream's contract requires: each region owns
 * a `$state` and an effect created during init, so a key that appears later gets
 * neither. Upstream's reason is React's rules of hooks; ours is that effects are
 * created once. Same contract, different cause.
 */
function useMultiResizable(config: () => UseResizableMultiConfig): Record<string, ResizableRegion> {
	const result: Record<string, ResizableRegion> = {};

	for (const key of Object.keys(config().regions)) {
		result[key] = useSingleResizable(() => {
			const { regions, autoSaveId } = config();
			return {
				...regions[key],
				autoSaveId: autoSaveId ? `${autoSaveId}:${key}` : undefined
			};
		});
	}

	return result;
}

export function useResizable(config: () => UseResizableSingleConfig): ResizableRegion;
export function useResizable(
	config: () => UseResizableMultiConfig
): Record<string, ResizableRegion>;
export function useResizable(
	config: () => UseResizableSingleConfig | UseResizableMultiConfig
): ResizableRegion | Record<string, ResizableRegion> {
	if ('regions' in config()) {
		return useMultiResizable(config as () => UseResizableMultiConfig);
	}
	return useSingleResizable(config as () => UseResizableSingleConfig);
}
