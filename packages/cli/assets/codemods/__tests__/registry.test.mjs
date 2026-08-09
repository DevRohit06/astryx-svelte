/**
 * @file Colocated tests for the codemod version registry.
 *
 * ## Ported case count
 *
 * Upstream has 7; 7 here, **3 live and 4 `it.todo`**. The split is forced by the
 * registry being empty (see `assets/codemods/registry.mjs`): four of upstream's
 * cases assert *which* version manifests come back for a range, and there are no
 * manifests to come back. They are carried as `it.todo` rather than refixtured
 * because there is no weaker form of "returns the v0.0.10 transforms" that is
 * still about the registry — a rewritten version would pass for the wrong
 * reason, which this port treats as worse than not running.
 *
 * The three live ones are not vacuous. The first is the guard on the honest
 * empty itself: it fails the day a version is registered without this suite
 * being revisited, which is exactly when the four todos become writable. The
 * other two hold for an empty registry *and* a populated one, so they survive
 * that change unedited.
 *
 * The blocker for all four todos is the same and is not a slice: **this port
 * must cut a second release**, so that there is a version transition for a
 * codemod to migrate across.
 */

import { describe, expect, test } from 'vitest';
import { versions, latestVersion, getTransformsBetween } from '../registry.mjs';

describe('registry', () => {
	describe('versions', () => {
		test('are sorted in ascending semver order across digit boundaries', () => {
			// Upstream asserts its 18-entry list. This port has released no versions,
			// so the list is empty and `latestVersion` is undefined — both by design,
			// and both asserted so the emptiness cannot drift unnoticed.
			expect(versions).toEqual([]);
			expect(latestVersion).toBeUndefined();
		});
	});

	describe('getTransformsBetween', () => {
		// Needs a registered version. Blocked on this port's second release.
		test.todo('returns v0.0.10 transforms for range 0.0.9 to 0.0.10');

		// Needs three registered versions. Blocked on this port's second release.
		test.todo('returns v0.0.6, v0.0.7, v0.0.8 for range 0.0.2 to 0.0.8');

		test('returns empty array when from equals to', async () => {
			const results = await getTransformsBetween('0.0.6', '0.0.6');
			expect(results).toEqual([]);
		});

		test('returns empty array when from is greater than to', async () => {
			const results = await getTransformsBetween('0.0.8', '0.0.2');
			expect(results).toEqual([]);
		});

		// Both prerelease cases assert that a canary `--to` / `--from` still selects
		// the release version's manifest. With nothing registered there is no
		// manifest to select, and asserting `[]` would prove the prerelease handling
		// nothing at all. Blocked on this port's second release.
		test.todo('handles prerelease suffixes in --to (canary versions)');

		test.todo('handles prerelease suffixes in --from');
	});
});
