/**
 * @file Regression guard: a registered core codemod must be REACHABLE through
 * `astryx-svelte upgrade`, not just correct in isolation.
 *
 * `upgrade` targets the installed core version — it runs every codemod in
 * `(from, installedCore]`. Upstream's v0.3.0 authoring codemods sit at the
 * registry's top version, so they only run once the installed core has reached
 * it; because core ships in the same fixed-version release group as the CLI a
 * released core does reach it, but nothing pinned that invariant. A future
 * registry entry above the shipped core version would silently strand the
 * migration.
 *
 * ## Ported case count
 *
 * Upstream has 2; **2 here, both `it.todo`**, and the blocker is the same for
 * each: this port's codemod registry is empty (see
 * `assets/codemods/registry.mjs`), because it has released exactly one version
 * and a codemod migrates *between* two. Neither case has a form that says
 * anything today:
 *
 *   - the first seeds a consumer using the pre-migration authoring surface and
 *     asserts `upgrade` rewrites it. There is no core codemod to do the
 *     rewriting, and substituting an *integration* codemod would test
 *     integration discovery — already covered in
 *     `assets/codemods/integration-discovery.test.mjs` — while quietly
 *     dropping the reachability property, which is entirely about the core
 *     registry's top version versus the installed core version.
 *   - the second asserts `latestVersion === versions.at(-1)`. With both
 *     `undefined` that is `undefined === undefined`: it would pass without the
 *     invariant holding, which is the "passes for the wrong reason" failure this
 *     port refuses.
 *
 * **Unblocked by this port's second release**, at which point the first registry
 * entry lands and both cases become writable against real transforms. The
 * emptiness itself is asserted, so it cannot drift unnoticed:
 * `assets/codemods/__tests__/registry.test.mjs` fails if a version appears.
 */

import { describe, it } from 'vitest';

describe('upgrade — core codemods are reachable', () => {
	it.todo('rewrites an old-surface file when installed core is at the registry latest');

	it.todo('does NOT strand the migration: latestVersion is the top registry tier');
});
