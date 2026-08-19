import type { TableColumn, ProportionalWidth, PixelWidth } from './table-types.js';
import { firstCharacter } from '../../utils/characters.js';

/**
 * Ported from Astryx's `Table/columnUtils.ts`.
 *
 * Pure, and transcribes verbatim — the only translation is `defaultCellRenderer`
 * returning a `string` rather than a `ReactNode`. Every branch upstream already
 * returns a string or `''`, so the narrower type is the same function with an
 * honest signature; `BaseTable` renders it as text either way.
 */

/** Default minimum width (in px) for proportional columns. */
export const DEFAULT_MIN_COLUMN_WIDTH = 120;

// =============================================================================
// Resolved Column Widths
// =============================================================================

/**
 * Pre-computed width information for a single column.
 * Produced by `resolveColumnWidths()`, consumed by header cell rendering.
 */
export interface ResolvedColumnWidth {
	/** Inline style declarations to apply on the `<th>` for this column. */
	style: { width?: string; minWidth?: string };
}

/**
 * Result of `resolveColumnWidths()` — contains per-column width styles
 * and the aggregate table min-width. Computed once and shared between
 * the table min-width calculation and header cell rendering.
 */
export interface ResolvedColumnWidths {
	/** Per-column width styles, indexed by column key. */
	columns: Map<string, ResolvedColumnWidth>;
	/** Minimum table width (px) to prevent proportional columns from shrinking below their minWidth. */
	tableMinWidth: number;
}

/**
 * Resolve column widths for the entire table in a single pass.
 *
 * Computes:
 * - Per-column inline styles (`width`, `minWidth`) for `<th>` elements
 * - Aggregate `tableMinWidth` for the `<table>` element
 *
 * @param columns - Resolved column definitions (after auto-generation)
 * @returns Pre-computed widths for each column and the table minimum width
 */
export function resolveColumnWidths<T extends Record<string, unknown>>(
	columns: TableColumn<T>[]
): ResolvedColumnWidths {
	// --- Pass 1: Categorize columns and compute totals ---
	let totalProportion = 0;
	let pixelTotal = 0;
	const proportionalCols: {
		key: string;
		proportion: number;
		minWidth: number;
	}[] = [];

	for (const col of columns) {
		const w = col.width;
		if (w?.type === 'pixel') {
			pixelTotal += w.value;
		} else {
			const proportion = w?.value ?? 1;
			// Only count minWidth for columns that explicitly used proportional().
			// Columns with no width set (w === undefined) have no minimum —
			// they flex freely and the scroll wrapper handles overflow.
			const minW = w != null ? (w.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH) : 0;
			totalProportion += proportion;
			proportionalCols.push({ key: col.key, proportion, minWidth: minW });
		}
	}

	// --- Pass 2: Compute table min-width ---
	let maxProportionalSpace = 0;
	if (totalProportion > 0) {
		for (const col of proportionalCols) {
			const required = (col.minWidth * totalProportion) / col.proportion;
			if (required > maxProportionalSpace) {
				maxProportionalSpace = required;
			}
		}
	}
	const tableMinWidth = pixelTotal + maxProportionalSpace;

	// --- Pass 3: Build per-column styles ---
	const result = new Map<string, ResolvedColumnWidth>();

	for (const col of columns) {
		const w = col.width;
		const style: { width?: string; minWidth?: string } = {};

		if (w?.type === 'pixel') {
			// Fixed pixel width — set both width and minWidth to prevent shrinking
			style.width = `${w.value}px`;
			style.minWidth = `${w.value}px`;
		} else {
			// Proportional width — compute percentage from total proportional units.
			const proportion = w?.value ?? 1;
			if (totalProportion > 0) {
				style.width = `${(proportion / totalProportion) * 100}%`;
			}
			// Only apply minWidth if the column explicitly used proportional().
			// Columns with no width set (w === undefined) have no minimum —
			// they flex freely and the scroll wrapper handles overflow.
			if (w != null) {
				const minW = w.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
				style.minWidth = `${minW}px`;
			}
		}

		result.set(col.key, { style });
	}

	return { columns: result, tableMinWidth };
}

/**
 * Create a proportional column width (fr-like).
 * Columns share available space proportionally.
 * Applies `DEFAULT_MIN_COLUMN_WIDTH` when no explicit minWidth is provided.
 *
 * @example
 * ```ts
 * proportional(2) // twice as wide as proportional(1)
 * proportional(1, { minWidth: 200 }) // explicit min
 * ```
 */
export function proportional(
	value: number = 1,
	options?: { minWidth?: number }
): ProportionalWidth {
	return {
		type: 'proportional',
		value,
		minWidth: options?.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH
	};
}

/**
 * Create a fixed pixel column width.
 *
 * @example
 * ```ts
 * pixel(200) // exactly 200px wide
 * ```
 */
export function pixel(value: number): PixelWidth {
	return { type: 'pixel', value };
}

/**
 * Capitalize the first letter of a string.
 * Used for auto-generating header text from data keys.
 */
export function capitalize(str: string): string {
	if (str.length === 0) {
		return str;
	}
	const first = firstCharacter(str);
	return first.toUpperCase() + str.slice(first.length);
}

/**
 * Default cell renderer — converts the value at `item[key]` to a string.
 */
export function defaultCellRenderer<T extends Record<string, unknown>>(
	item: T,
	key: string
): string {
	const value = item[key];
	if (value == null) {
		return '';
	}
	if (value instanceof Date) {
		return value.toISOString();
	}
	if (
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean' ||
		typeof value === 'bigint'
	) {
		return String(value);
	}
	return '';
}

/**
 * Estimate the display width of a value in characters.
 * Only measures string and number values — objects, arrays, and other
 * complex types return 0 (fall back to equal proportioning for that cell).
 */
function estimateContentLength(value: unknown): number {
	if (value == null) {
		return 0;
	}
	if (typeof value === 'string') {
		return value.length;
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value).length;
	}
	return 0;
}

/**
 * Find the longest single word in a value (for min-width estimation).
 * A "word" is a contiguous non-whitespace sequence.
 * Only measures string and number values — complex types return 0.
 */
function longestWord(value: unknown): number {
	if (value == null) {
		return 0;
	}
	if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
		return 0;
	}
	const str = String(value);
	let max = 0;
	let current = 0;
	for (let i = 0; i <= str.length; i++) {
		if (i === str.length || str[i] === ' ' || str[i] === '\t' || str[i] === '\n') {
			if (current > max) {
				max = current;
			}
			current = 0;
		} else {
			current++;
		}
	}
	return max;
}

/** Minimum floor for any column (px). Prevents collapse on narrow viewports. */
const MIN_COLUMN_FLOOR = 60;

/** Scale factor: approximate px per character for min-width calculation. */
const PX_PER_CHAR = 8;

/**
 * Auto-generate column definitions from the keys of the first data item.
 * Derives content-proportional widths by analyzing the header and first
 * few rows of data. Min-width is based on the longer of: header text
 * or the longest single word in values.
 */
export function generateColumns<T extends Record<string, unknown>>(data: T[]): TableColumn<T>[] {
	if (data.length === 0) {
		return [];
	}
	const firstItem = data[0];
	const keys = Object.keys(firstItem);

	// Sample first few rows for content analysis
	const sampleRows = data.slice(0, Math.min(5, data.length));

	// Measure each column
	const measurements = keys.map((key) => {
		const headerLen = capitalize(key).length;

		let maxContentLen = headerLen;
		let maxWordLen = headerLen; // header is a single "word" for min-width purposes

		for (const row of sampleRows) {
			const contentLen = estimateContentLength(row[key]);
			if (contentLen > maxContentLen) {
				maxContentLen = contentLen;
			}

			const wordLen = longestWord(row[key]);
			if (wordLen > maxWordLen) {
				maxWordLen = wordLen;
			}
		}

		return { key, headerLen, maxContentLen, maxWordLen };
	});

	return measurements.map((m) => {
		// Bucket content length into proportional tiers:
		// 1 = short (≤6 chars: IDs, ages, booleans, status)
		// 2 = medium (7–15 chars: names, dates, short strings)
		// 3 = long (>15 chars: emails, URLs, descriptions)
		const proportion = m.maxContentLen <= 6 ? 1 : m.maxContentLen <= 15 ? 2 : 3;

		// Min-width: enough to fit header or longest word without wrapping
		const minWidth = Math.max(Math.max(m.headerLen, m.maxWordLen) * PX_PER_CHAR, MIN_COLUMN_FLOOR);

		return {
			key: m.key,
			header: capitalize(m.key),
			width: proportional(proportion, { minWidth })
		};
	});
}
