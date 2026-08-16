/**
 * @file Strips the upstream repo's copyright header from files we scaffold into
 * someone else's project.
 *
 * Every file in Astryx carries the Meta copyright header, and several commands
 * copy repo files out verbatim — `theme add` (bundled theme sources),
 * `theme template` / `init --features theme` (the annotated theme template). A
 * consumer's own source tree should not inherit that boilerplate, and their lint
 * may well reject it.
 *
 * **It is a guard rather than a transform in this port.** This repo's own
 * sources carry no Meta copyright line, so the pattern matches nothing today. It
 * is kept because the scaffolded assets are copies of files adapted from
 * upstream, and one arriving with the header attached is exactly the case this
 * exists for.
 *
 * Extracted from `api/theme/add/add.mjs` at upstream 0.4.2, when `theme
 * template` became a second caller (#5048).
 */

/**
 * Matches the header at the very start of a file, with the leading BOM and/or
 * shebang captured so they survive the strip.
 */
const META_COPYRIGHT_HEADER_RE =
	/^(\uFEFF?(?:#![^\r\n]*(?:\r?\n))?)\/\/ Copyright \(c\) Meta Platforms, Inc\. and affiliates\.\r?\n(?:\r?\n)*/;

/**
 * Remove the leading Meta copyright header, preserving any BOM/shebang before
 * it. Returns the source unchanged when the header is absent.
 *
 * @param {string} source
 * @returns {string}
 */
export function stripCopyrightHeader(source) {
	return source.replace(META_COPYRIGHT_HEADER_RE, '$1');
}
