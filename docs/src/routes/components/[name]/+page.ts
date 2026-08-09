import { error } from '@sveltejs/kit';
import componentRegistry from '$lib/generated/component-registry.js';
import exampleRegistry from '$lib/generated/example-registry.js';
import type { EntryGenerator, PageLoad } from './$types.js';

/** Every documented component and hook, prerendered. */
export const prerender = true;

export const entries: EntryGenerator = () =>
	componentRegistry.map((entry) => ({ name: entry.name }));

export const load: PageLoad = ({ params }) => {
	const component = componentRegistry.find((entry) => entry.name === params.name);
	if (!component) error(404, `No component named "${params.name}"`);

	return {
		component,
		examples: exampleRegistry.byComponent[component.name] ?? []
	};
};
