/**
 * Ported from Astryx's `Outline/types.ts`.
 */

export interface OutlineItem {
	/** Unique ID, typically matching the target heading's DOM id. */
	id: string;

	/** Display text for the outline item. */
	label: string;

	/** Heading depth from 1 to 6. Controls indentation. */
	level: number;
}
