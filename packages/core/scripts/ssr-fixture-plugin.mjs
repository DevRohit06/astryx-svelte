/**
 * A dev-server endpoint that server-renders a test fixture.
 *
 * This exists to make **hydration** testable, which it otherwise is not here.
 * A `.svelte` file compiles for exactly one target per module graph: the client
 * vitest project gets the DOM build (so it can `hydrate()`), and the node
 * project gets the SSR build (so it can `render()`). Neither project can hold
 * both, so a browser test has no way to obtain real server markup — and
 * `mount()`ing a component to snapshot its HTML is not a substitute, because
 * client rendering omits the `<!--[-->` / `<!--$sN-->` markers that hydration
 * navigates by. Hydrating client HTML tests nothing.
 *
 * So the browser test asks the Vite server, which *does* have an SSR module
 * graph, to render the fixture for it. The markup is produced fresh from the
 * same source the browser is about to hydrate, so it cannot drift the way a
 * checked-in HTML snapshot would.
 *
 * Only ever mounted in this package's test config, and only reachable from the
 * dev server.
 */

const ENDPOINT = '/__ssr-fixture';

/** @returns {import('vite').Plugin} */
export function ssrFixturePlugin() {
	return {
		name: 'astryx-ssr-fixture',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use(ENDPOINT, async (req, res) => {
				try {
					const url = new URL(req.url ?? '', 'http://localhost');
					const module = url.searchParams.get('module');
					if (!module) {
						res.statusCode = 400;
						res.end(JSON.stringify({ error: 'missing ?module' }));
						return;
					}

					const props = JSON.parse(url.searchParams.get('props') ?? '{}');
					const loaded = await server.ssrLoadModule(module);

					// `render` has to come from the *same* module graph the component
					// was loaded through. Importing `svelte/server` at the Node level
					// gets a second Svelte instance, whose renderer state is separate —
					// the component then renders against a null current-component and
					// dies inside `push_element`.
					const { render } = await server.ssrLoadModule('svelte/server');
					const result = render(loaded.default, { props });

					res.setHeader('content-type', 'application/json');
					res.end(JSON.stringify({ head: result.head, body: result.body }));
				} catch (error) {
					res.statusCode = 500;
					const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
					res.end(JSON.stringify({ error: detail }));
				}
			});
		}
	};
}
