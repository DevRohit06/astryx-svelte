/**
 * @file classify-chunk-failure.mjs
 *
 * Decides whether a failed client chunk lost its browser or failed a case.
 *
 * Its own module, and tested, because it is the one piece of
 * `run-client-tests.mjs` that can weaken the gate rather than break it. A retry
 * that fires on a real assertion failure turns the suite into a re-roll, and
 * nothing downstream would ever say so — the run would simply be green.
 *
 * @input  one chunk's output, ANSI stripped
 * @output true only for an infrastructure drop with zero failed tests
 * @position packages/core/scripts/run-client-tests.mjs
 */

/**
 * The distinction is this repo's own, written down in `TODO.md` long before
 * this script: "the drop makes an innocent file the victim and says nothing
 * about that file, while a timing failure names a case that is genuinely racing
 * something", and "do not read a run's exit code alone — the number that
 * matters is the failed-test count and which file it names".
 *
 * A drop reports **zero failed tests** and an error about infrastructure: a
 * dynamic import that would not fetch, an iframe that would not connect, a
 * module runner that vanished mid-run. A chunk with even one failed *test* is
 * never retried, including when it also lost its browser — the failed case is
 * the more important fact, and re-running it would be re-rolling a real result.
 *
 * @param {string} output  the chunk's combined stdout+stderr, ANSI stripped
 * @returns {boolean}
 */
export function isInfrastructureFailure(output) {
	if (/Tests\s+\d+ failed/.test(output)) return false;
	return (
		/Failed to fetch dynamically imported module/.test(output) ||
		/Cannot connect to the iframe/.test(output) ||
		/wrapDynamicImport/.test(output) ||
		/Browser connection was closed/.test(output) ||
		/browserType\.launch/.test(output)
	);
}
