import { resolve } from '$app/paths';

/**
 * Every internal link the site builds, in one place.
 *
 * SvelteKit's `resolve()` applies the configured base path and typechecks the
 * route id against the params, which is what `svelte/no-navigation-without-resolve`
 * is asking for. Centralising the four shapes keeps that out of every template
 * and means a route rename is one edit rather than thirty.
 */

export function homeHref(): string {
	return resolve('/');
}

export function componentsHref(): string {
	return resolve('/components');
}

export function componentHref(name: string): string {
	return resolve('/components/[name]', { name });
}

export function templatesHref(): string {
	return resolve('/templates');
}

export function themesHref(): string {
	return resolve('/themes');
}

export function communityHref(): string {
	return resolve('/community');
}

export function topicHref(topic: string): string {
	return resolve('/docs/[topic]', { topic });
}

/** A link to one section of a topic page. */
export function topicSectionHref(topic: string, sectionId: string): string {
	return `${topicHref(topic)}#${sectionId}`;
}
