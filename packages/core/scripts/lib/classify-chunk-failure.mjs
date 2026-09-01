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
 * The distinction is this repo's own, written down in `port/todo.md` long before
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
 * A **timeout** is the same class arriving with no message at all: the chunk
 * printed nothing further and never exited, so there is no error text to match
 * on. The caller passes it as a flag rather than deciding for itself, so that
 * the zero-failed-tests rule above governs a hang exactly as it governs a drop —
 * a chunk that reported a failed case and *then* wedged is still a real result.
 *
 * A **crash** is the third arrival of the same class, and the one that stayed
 * unhandled longest. A chunk killed by the OS — `0xC0000409` on Windows, a
 * SIGSEGV or an OOM kill elsewhere — prints no summary and no error text of its
 * own, so every pattern above misses it and the chunk was reported as a plain
 * failure. It is a drop by the only definition that matters: zero tests failed,
 * because the process died before it could run or report them. The caller passes
 * it, because "no summary was parsed" is the caller's fact.
 *
 * @param {string} output  the chunk's combined stdout+stderr, ANSI stripped
 * @param {{timedOut?: boolean, crashed?: boolean}} [options]  `timedOut` when the
 *   runner killed it; `crashed` when it exited non-zero with no parsable summary
 * @returns {boolean}
 */
export function isInfrastructureFailure(output, { timedOut = false, crashed = false } = {}) {
	if (/Tests\s+\d+ failed/.test(output)) return false;
	if (timedOut || crashed) return true;
	return (
		/Failed to fetch dynamically imported module/.test(output) ||
		/Cannot connect to the iframe/.test(output) ||
		/wrapDynamicImport/.test(output) ||
		/Browser connection was closed/.test(output) ||
		/browserType\.launch/.test(output) ||
		// The browser never answered the handshake, so the chunk ran **no tests at
		// all** — `Tests  no tests`, twelve files collected and zero executed. Near
		// neighbours of `Browser connection was closed` above, but a distinct
		// string, and missing it failed a gate on 12 innocent files (batch 043).
		// The list is patterns observed in real runs; each addition needs one.
		/Failed to connect to the browser session/.test(output)
	);
}
