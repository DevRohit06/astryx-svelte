/**
 * The `vi.waitFor` budget for an assertion that depends on a **component timer**
 * firing — a hover-intent delay, a hover-bridge grace period, an auto-hide.
 *
 * `vi.waitFor`'s default budget is 1000 ms, which is not part of any contract;
 * it is just the library's default. That is a fine budget for "a state change
 * propagates", but a poor one for "a 100–200 ms timer fires *and* its work
 * lands", because the two are not the same kind of wait: the second is a real
 * wall-clock delay with the browser's scheduler in the middle of it, and a GC
 * pause or a slow frame late in an 82-file run can eat most of a second on its
 * own. The residual failures after `fileParallelism: false` were all of this
 * shape — the timer's own delay was fine, the budget around it was not.
 *
 * Five seconds is deliberately far more than the ~100–200 ms these timers
 * actually need. The budget is not the thing under test; the *behaviour* is, and
 * a wait that resolves as soon as the condition holds costs nothing extra when
 * the machine is idle. A case that genuinely regresses still fails, just five
 * seconds later.
 *
 * This is only for waits gated on a timer. A wait for something that should
 * already have happened keeps the default budget, because there a long timeout
 * would hide a real defect behind a slow pass.
 */
export const TIMER_BUDGET = { timeout: 5000 } as const;
