/**
 * @file Colocated tests for the `component` command dispatcher
 * (api/component/component.mjs), run against the real `@astryx-svelte/core`
 * registry. `component` fans out to list/detail(+props/source/showcase/blocks)
 * leaves; this pins the DISPATCH + precedence rules that no other suite covers.
 * Locks behavior so a future refactor of the router cannot silently change
 * which leaf a given arg/flag combination hits.
 *
 * ## Ported case count
 *
 * 18, matching upstream one for one. One case is adapted: the scoped
 * `--showcase` parity check compares the two paths' thrown **error codes**
 * rather than their response types, because core ships no block templates for
 * either path to find, so both reach `ERR_NO_SHOWCASE`. The property is the one
 * upstream wrote it for — a `--package`-scoped projection must route exactly
 * where the unscoped one does, and before that fix the scoped path silently
 * fell through to `component.detail` — and it still fails if the scoped path
 * stops routing to the showcase leaf.
 */

import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { component } from './component.mjs';
import { AstryxError } from '../error.mjs';
import { CORE_PACKAGE } from '../../foundation/discovery/component-discovery.mjs';

// api/component/ -> up 2 = packages/cli, up 4 = repo root (has packages/core,
// which findCoreDir walks to).
const REPO = path.resolve(import.meta.dirname, '..', '..', '..', '..');
const cwd = REPO;
const SLOW = 30_000;

describe('component dispatcher — routing', () => {
	it(
		'routes a bare name to component.detail',
		async () => {
			const r = await component('Button', { cwd });
			expect(r.type).toBe('component.detail');
			expect(r.data.name).toBe('Button');
		},
		SLOW
	);

	it(
		'routes no-name to the list leaf (component.list, detail=names)',
		async () => {
			const r = await component(undefined, { cwd });
			expect(r.type).toBe('component.list');
			expect(r.data.detail).toBe('names');
			expect(Object.keys(r.data.components).length).toBeGreaterThan(0);
		},
		SLOW
	);

	it(
		'routes --category to the list leaf, filtered to that group',
		async () => {
			const r = await component(undefined, { cwd, category: 'Layout' });
			expect(r.type).toBe('component.list');
			expect(Object.keys(r.data.components)).toContain('Layout');
		},
		SLOW
	);

	it(
		'treats an empty-string name as a list (not a not-found error)',
		async () => {
			const r = await component('', { cwd });
			expect(r.type).toBe('component.list');
		},
		SLOW
	);
});

describe('component dispatcher — detail levels on list', () => {
	it(
		'--detail compact lists with detail=compact',
		async () => {
			const r = await component(undefined, { cwd, list: true, detail: 'compact' });
			expect(r.type).toBe('component.list');
			expect(r.data.detail).toBe('compact');
		},
		SLOW
	);

	it(
		'--detail full lists with detail=full',
		async () => {
			const r = await component(undefined, { cwd, list: true, detail: 'full' });
			expect(r.type).toBe('component.list');
			expect(r.data.detail).toBe('full');
		},
		SLOW
	);
});

describe('component dispatcher — projection precedence (locked)', () => {
	it(
		'--props routes to component.detail.props',
		async () => {
			const r = await component('Button', { cwd, props: true });
			expect(r.type).toBe('component.detail.props');
		},
		SLOW
	);

	it(
		'--source routes to component.detail.source',
		async () => {
			const r = await component('Button', { cwd, source: true });
			expect(r.type).toBe('component.detail.source');
		},
		SLOW
	);

	it(
		'--source WINS over --props when both are set (precedence lock)',
		async () => {
			const r = await component('Button', { cwd, props: true, source: true });
			expect(r.type).toBe('component.detail.source');
		},
		SLOW
	);

	it(
		'--list WINS over a given name (list dispatch precedence lock)',
		async () => {
			const r = await component('Button', { cwd, list: true });
			expect(r.type).toBe('component.list');
		},
		SLOW
	);
});

describe('component dispatcher — name resolution', () => {
	it(
		'strips a legacy XDS prefix (XDSButton -> Button)',
		async () => {
			const r = await component('XDSButton', { cwd });
			expect(r.type).toBe('component.detail');
			expect(r.data.name).toBe('Button');
		},
		SLOW
	);

	it(
		'is case-SENSITIVE: a lowercased name is unknown',
		async () => {
			let err;
			try {
				await component('button', { cwd });
			} catch (e) {
				err = e;
			}
			expect(err).toBeDefined();
			expect(err.code).toBe('ERR_UNKNOWN_COMPONENT');
		},
		SLOW
	);

	it(
		'throws ERR_UNKNOWN_COMPONENT for a genuinely unknown name',
		async () => {
			let err;
			try {
				await component('ZzzNope99', { cwd });
			} catch (e) {
				err = e;
			}
			expect(err.code).toBe('ERR_UNKNOWN_COMPONENT');
		},
		SLOW
	);

	it(
		'throws ERR_UNKNOWN_PACKAGE when --package names a missing package',
		async () => {
			let err;
			try {
				await component('Button', { cwd, package: '@nonexistent/pkg-xyz' });
			} catch (e) {
				err = e;
			}
			expect(err).toBeDefined();
			expect(err.code).toBe('ERR_UNKNOWN_PACKAGE');
		},
		SLOW
	);
});

describe('component dispatcher — scoped --package routes all projections', () => {
	const CORE = CORE_PACKAGE;

	/** Run and return either the response type or the thrown error code. */
	const outcome = async (/** @type {Promise<any>} */ p) =>
		p.then((r) => r.type).catch((e) => e.code);

	it(
		'--package (core) routes --showcase like the no-scope path',
		async () => {
			// Both reach the showcase leaf, which answers ERR_NO_SHOWCASE because
			// core ships no block templates for `findShowcase` to rank. Before the
			// routing fix the scoped path answered `component.detail` here, so the
			// comparison still bites.
			const ns = await outcome(component('Button', { cwd, showcase: true }));
			const sc = await outcome(component('Button', { cwd, package: CORE, showcase: true }));
			expect(sc).toBe(ns);
			expect(sc).toBe('ERR_NO_SHOWCASE');
		},
		SLOW
	);

	it(
		'--package (core) routes --blocks like the no-scope path',
		async () => {
			const ns = await component('Button', { cwd, blocks: true });
			const sc = await component('Button', { cwd, package: CORE, blocks: true });
			expect(sc.type).toBe(ns.type);
			expect(sc.type).toBe('component.detail.blocks');
		},
		SLOW
	);

	it(
		'--package (core) still routes --source and --props',
		async () => {
			expect((await component('Button', { cwd, package: CORE, source: true })).type).toBe(
				'component.detail.source'
			);
			expect((await component('Button', { cwd, package: CORE, props: true })).type).toBe(
				'component.detail.props'
			);
		},
		SLOW
	);
});

describe('component dispatcher — category guard', () => {
	it(
		'a non-string category throws a coded error (not a raw TypeError)',
		async () => {
			for (const bad of [123, {}, [1]]) {
				const err = await component(undefined, {
					cwd,
					category: /** @type {any} */ (bad)
				}).catch((e) => e);
				expect(err).toBeInstanceOf(AstryxError);
				expect(err.code).toBe('ERR_UNKNOWN_CATEGORY');
			}
		},
		SLOW
	);
});
