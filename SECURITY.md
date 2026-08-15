# Security Policy

**This project is unofficial and not affiliated with Meta.** It is a Svelte port of
[Astryx](https://astryx.atmeta.com/), Meta's design system. A vulnerability in Meta's own React
implementation belongs [upstream](https://github.com/facebook/astryx/security), not here — see
their `SECURITY.md` for Meta's bug bounty program, which this project has no part in.

## Reporting a vulnerability

If you find a security issue in this port itself — the components, the CLI, the theme packages,
or the build/publish pipeline — please **do not open a public issue**. Use
[GitHub's private vulnerability reporting](https://github.com/devrohit06/astryx-svelte/security/advisories/new)
for this repository instead, so it isn't disclosed before there's a fix.

Please include:

- A description of the issue and its impact
- Steps to reproduce, or a proof of concept
- The affected package(s) and version(s) — `@astryx-svelte/core`, `@astryx-svelte/cli`, or a
  specific `@astryx-svelte/theme-*`
- Any mitigation you've already identified

There's no dedicated security team behind this project — it's maintained on a best-effort basis —
but a private report will be looked at as soon as possible.

## Supported versions

All ten publishable packages ship together under one version (see `README.md`), so there is one
supported line: the latest release on npm. Older versions do not receive security backports;
please upgrade rather than pin to a fixed release.

## Scope

In scope: this repository's own code — the Svelte components, the CLI, the theme packages, and
the scripts that build and publish them.

Out of scope: vulnerabilities that only reproduce in upstream Astryx's React implementation
(report those [upstream](https://github.com/facebook/astryx/security)), and vulnerabilities in
dependencies that already have an upstream advisory — please report those to the dependency
itself and open an issue here only if this project needs to bump a pin in response.
