/**
 * Coverage with **no upstream analogue**: upstream has no chunked test runner,
 * so no ported suite can reach this. It is here because the thing it guards can
 * weaken the gate rather than break it.
 *
 * `scripts/run-client-tests.mjs` retries a chunk that lost its browser. If that
 * retry ever fires on a real assertion failure, the client suite becomes a
 * re-roll and nothing downstream says so — the run goes green and the failing
 * case is gone. So the classifier is a module of its own and these are its
 * cases, including the one that matters most: a chunk that failed a test *and*
 * lost its browser must not be retried.
 *
 * The two failing samples are copied from real runs, not invented — the drop is
 * verbatim from the release dry run (31370445529, chunk 5), which reported
 * `529 passed` with zero failures and one unhandled iframe error.
 *
 * Imported by a relative path rather than through `$lib/…`, which the usual
 * rule requires, because the subject is a build script and has no `$lib`
 * counterpart.
 */

import { describe, expect, it } from 'vitest';

import { isInfrastructureFailure } from '../../scripts/lib/classify-chunk-failure.mjs';

/** Verbatim from release run 31370445529, chunk 5 — the browser dropped. */
const DROPPED_BROWSER = `
 ❯  client (chromium)  src/tests/overlay.svelte.test.ts (0 test)
 FAIL   client (chromium)  src/tests/overlay.svelte.test.ts [ src/tests/overlay.svelte.test.ts ]
Error: Failed to import test file /home/runner/work/.../src/tests/setup-stylex.ts
Caused by: TypeError: Failed to fetch dynamically imported module: http://localhost:63315/...
Caused by: Error: Cannot connect to the iframe. Did you change the location or submitted a form?
 Test Files  1 failed | 13 passed (20)
      Tests  529 passed (529)
     Errors  1 error
`;

/** What a genuine assertion failure prints. */
const REAL_FAILURE = `
 FAIL   client (chromium)  src/tests/badge.svelte.test.ts > renders the label
AssertionError: expected 'Draft' to be 'Published'
 Test Files  1 failed | 11 passed (12)
      Tests  1 failed | 268 passed (269)
`;

describe('isInfrastructureFailure', () => {
	it('retries a chunk whose browser dropped', () => {
		expect(isInfrastructureFailure(DROPPED_BROWSER)).toBe(true);
	});

	it('retries the module-runner crash that made chunking necessary', () => {
		expect(
			isInfrastructureFailure(
				"TypeError: Cannot read properties of undefined (reading 'wrapDynamicImport')\n" +
					' Test Files  20 passed (20)\n      Tests  535 passed (535)\n'
			)
		).toBe(true);
	});

	it('retries a closed browser connection', () => {
		expect(
			isInfrastructureFailure(
				'Error: Browser connection was closed\n      Tests  312 passed (312)\n'
			)
		).toBe(true);
	});

	it('never retries a real assertion failure', () => {
		expect(isInfrastructureFailure(REAL_FAILURE)).toBe(false);
	});

	it('never retries a real failure that also lost its browser', () => {
		// The failed case is the more important fact. Re-running it would be
		// re-rolling a real result, which is the whole hazard this file exists for.
		expect(isInfrastructureFailure(REAL_FAILURE + DROPPED_BROWSER)).toBe(false);
	});

	it('does not treat a clean pass as retryable', () => {
		expect(
			isInfrastructureFailure(' Test Files  12 passed (12)\n      Tests  269 passed (269)\n')
		).toBe(false);
	});
});
