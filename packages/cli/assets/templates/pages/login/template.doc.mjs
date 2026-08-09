/**
 * @file Basic Login page template. Transcribed from upstream's
 * `assets/templates/pages/login/page.tsx`.
 *
 * `isHiddenFromOverview` is upstream's editorial call — the basic form is a
 * duplicate of the richer Login Card variant for gallery purposes — and is
 * carried verbatim rather than re-decided here.
 */

/** @type {import('@astryx-svelte/cli/authoring').TemplateDoc} */
export const doc = {
	type: 'page',
	name: 'Basic Login',
	displayName: 'Basic Login',
	description: 'Auth form with email and password inputs',
	isReady: true,
	isHiddenFromOverview: true,
	category: 'Login - Basic'
};
