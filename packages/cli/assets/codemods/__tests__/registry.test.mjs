/**
 * @file Colocated tests for the codemod version registry.
 *
 * ## Ported case count
 *
 * Upstream has 7; 7 here, **4 live and 3 `it.todo`**. The split used to be 3/4,
 * and it moved because the registry stopped being empty: 0.4.0 registers
 * `migrate-table-rowexpansion-to-tree`, the transform for the breaking
 * `useTableRowExpansion` rewrite. That is the release the previous version of
 * this header named as the blocker for all four todos.
 *
 * One of them is now writable and is written — upstream's "returns the manifest
 * for a one-version range", refixtured onto the range this port actually has
 * (`0.3.1 → 0.4.0`). The remaining three still have no honest form:
 *
 *   - the three-version range needs three registered versions, and there is one.
 *   - both prerelease cases assert that a **canary** `--to` / `--from` still
 *     selects the release version's manifest. `semverCompare` strips the
 *     prerelease tag outright (`0.4.0-canary.1` compares equal to `0.4.0`), so
 *     against a single registered version the canary and the release select the
 *     same manifest for the same reason a *typo* would — the case would pass
 *     without the prerelease handling being exercised at all. They need a second
 *     registered version to sit either side of.
 *
 * The two range-edge cases hold for an empty registry *and* a populated one, so
 * they survived the change unedited — which is why they were written that way.
 */

import { describe, expect, test } from 'vitest';
import { versions, latestVersion, getTransformsBetween } from '../registry.mjs';

describe('registry', () => {
	describe('versions', () => {
		test('are sorted in ascending semver order across digit boundaries', () => {
			// Upstream asserts its 18-entry list. This port has one registered
			// version; asserted exactly so a second cannot land without this suite
			// being revisited, which is when the three todos below become writable.
			expect(versions).toEqual(['0.4.0']);
			expect(latestVersion).toBe('0.4.0');
		});
	});

	describe('getTransformsBetween', () => {
		test('returns v0.4.0 transforms for range 0.3.1 to 0.4.0', async () => {
			const results = await getTransformsBetween('0.3.1', '0.4.0');
			expect(results.map((r) => r.version)).toEqual(['0.4.0']);
			expect(results[0].transforms.map((t) => t.name)).toEqual([
				'migrate-table-rowexpansion-to-tree'
			]);
		});

		// Needs three registered versions. Blocked on this port's fourth release.
		test.todo('returns v0.0.6, v0.0.7, v0.0.8 for range 0.0.2 to 0.0.8');

		test('returns empty array when from equals to', async () => {
			const results = await getTransformsBetween('0.0.6', '0.0.6');
			expect(results).toEqual([]);
		});

		test('returns empty array when from is greater than to', async () => {
			const results = await getTransformsBetween('0.0.8', '0.0.2');
			expect(results).toEqual([]);
		});

		// Both prerelease cases need a second registered version to select
		// *between*; with one, a canary and its release resolve identically whether
		// or not the prerelease tag is handled. See the header.
		test.todo('handles prerelease suffixes in --to (canary versions)');

		test.todo('handles prerelease suffixes in --from');
	});
});
