---
name: release
description: Cut a release — bump every publishable manifest, write the CHANGELOG heading that states the parity target, dry-run the publish workflow, then tag. Use when a version is ready to publish to npm.
---

Release `$ARGUMENTS` (a version, e.g. `0.4.1`).

`.github/workflows/release.yml` owns the mechanics: it fires on `v*`, re-runs the full CI gate
(a tag can be pushed at any commit, including one CI never saw), then publishes with
`pnpm publish -r --access public --no-git-checks`. It must be pnpm, not npm — only pnpm rewrites the
`workspace:` protocol in the theme peer dependencies to a real range at pack time. **No
`--provenance`**: this repository is private, and npm's Sigstore transparency log rejects provenance
from a private source repo, failing at the last step of the job after everything else has passed.
The `id-token: write` permission is left in place, and the workflow's own comments say to restore
`--provenance` if the repo is ever made public.

This skill covers what the workflow cannot.

## 1. Bump every publishable manifest

All ten publish together — core, the CLI and eight themes — because every package carries the
version of the upstream Astryx release it ports, so one tag names the whole release. There is no
bump script: edit the `version` field of all ten `package.json` files by hand (the 0.3.1 -> 0.4.1
cut touched exactly those ten plus `CHANGELOG.md`, nothing else — cross-package deps are
`workspace:^` / `workspace:*` and pnpm rewrites those at pack time). Then verify they agree:

```sh
pnpm check:publish --version <version>
```

This does not set the version — it is the gate that confirms every manifest already matches
`<version>`, the same check the release workflow runs against the tag.

## 2. The version scheme, when it collides

Versions stay in lockstep with the upstream release they port, so a port-local fix takes the next
patch number regardless of whether upstream has used it. **When upstream ships a patch we have
already spent: skip to the next free number and state the parity target in the `CHANGELOG`
heading.** If upstream ships 0.3.1 and we have too, we release 0.3.2 and say it ports 0.3.1. The
machine-readable parity target is the exact `@astryxdesign/*` pin, already in the tree.

## 3. Gate

```sh
pnpm verify
pnpm check:publish --version <version>
```

`check:publish` catches two things publint does not: a package with no README (npm renders a blank
page and nothing else here would notice — all eight themes were once in that state), and a manifest
whose version disagrees with the tag.

## 4. Dry run before the tag

Trigger the release workflow with `workflow_dispatch`, passing the version as its `tag` input. It
runs the identical job with `--dry-run` on the publish step, so a manifest or credential problem
surfaces without burning a version number — which npm does not let you re-use.

Watch for `EOTP`: a classic _Publish_ token fails on an account with 2FA enforced for writes, and it
fails only after authenticating and uploading the tarball — the last possible step, after the full
gate has already run. `NPM_TOKEN` must be an **Automation** token or a Granular Access Token with
write access to the `@astryx-svelte` scope.

## 5. Tag from a merged `main`

```sh
git tag v<version> && git push origin v<version>
```

That is the step that publishes.
