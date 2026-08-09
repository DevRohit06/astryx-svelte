/**
 * @file GitHub utilities for the Astryx CLI.
 *
 * Shared helpers for interacting with the GitHub CLI (`gh`).
 */

import { execFileSync } from 'node:child_process';

/**
 * Check if the `gh` CLI is installed and authenticated.
 * Returns true if ready, false otherwise.
 *
 * `execFileSync` with a static argument array and no shell is the whole point:
 * nothing user-supplied reaches the command line, so there is no injection
 * surface. On Windows `gh` is a real `.exe` on PATH, not a `.cmd` shim, so the
 * no-shell spawn Node has required since CVE-2024-27980 works unchanged.
 * @returns {boolean}
 */
export function checkGhCli() {
	try {
		execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}
