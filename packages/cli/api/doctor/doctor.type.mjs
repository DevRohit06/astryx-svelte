/**
 * @file Colocated types for the `doctor` command — source of truth for the
 * `astryx-svelte doctor` JSON response shapes, re-exported through `api/index.mjs`.
 */

/**
 * Outcome of a single diagnostic check.
 * @typedef {'pass' | 'warn' | 'fail' | 'info'} DoctorStatus
 */

/**
 * A single diagnostic check result.
 * @typedef {object} DoctorCheck
 * @property {string} id Stable machine-readable id (e.g. 'node-version').
 * @property {string} label Human-readable check name.
 * @property {DoctorStatus} status
 * @property {string} message One-line result summary.
 * @property {string} [fix] Actionable remediation, present when status is not 'pass'.
 */

/**
 * Aggregate counts per status.
 * @typedef {object} DoctorSummary
 * @property {number} pass
 * @property {number} warn
 * @property {number} fail
 * @property {number} info
 */

/**
 * astryx-svelte --json doctor
 * @typedef {object} DoctorResponse
 * @property {'doctor'} type
 * @property {object} data
 * @property {DoctorCheck[]} data.checks
 * @property {DoctorSummary} data.summary
 */

/**
 * Options for `doctor()`.
 * @typedef {object} DoctorOptions
 * @property {string} [cwd]
 */

export {};
