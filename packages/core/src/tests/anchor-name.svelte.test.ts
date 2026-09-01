/** PORTS: Layer/anchorName.test.ts */

import { describe, expect, it } from 'vitest';
import {
	addAnchorName,
	readAnchorNames,
	removeAnchorName,
	writeAnchorNames
} from '$lib/components/layer/anchor-name.js';

/**
 * Ported from Astryx's `Layer/anchorName.test.ts`, all fifteen cases at the 0.5.0 pin,
 * verbatim.
 *
 * The `.svelte.` in the filename is this repo's selector for the browser
 * project, not a claim about Svelte — the module under test is plain TypeScript
 * (as `typeahead.svelte.test.ts` is). It needs a real `document`, and the node
 * project has none.
 */

function createMockElement(): HTMLElement {
	return document.createElement('div');
}

/** Upstream's cast: `anchorName` is not in every lib.dom's CSSStyleDeclaration. */
function anchorNameOf(el: HTMLElement): string {
	return (el.style as unknown as Record<string, string>).anchorName;
}

function setAnchorName(el: HTMLElement, value: string): void {
	(el.style as unknown as Record<string, string>).anchorName = value;
}

describe('readAnchorNames', () => {
	it('returns empty array for element with no anchor-name', () => {
		const el = createMockElement();
		expect(readAnchorNames(el)).toEqual([]);
	});

	it('reads a single anchor name', () => {
		const el = createMockElement();
		setAnchorName(el, '--layer-1');
		expect(readAnchorNames(el)).toEqual(['--layer-1']);
	});

	it('reads multiple comma-separated anchor names', () => {
		const el = createMockElement();
		setAnchorName(el, '--layer-1, --layer-2, --layer-3');
		expect(readAnchorNames(el)).toEqual(['--layer-1', '--layer-2', '--layer-3']);
	});

	it('trims whitespace around names', () => {
		const el = createMockElement();
		setAnchorName(el, '  --layer-1 ,  --layer-2  ');
		expect(readAnchorNames(el)).toEqual(['--layer-1', '--layer-2']);
	});

	it('returns empty array for empty string value', () => {
		const el = createMockElement();
		setAnchorName(el, '');
		expect(readAnchorNames(el)).toEqual([]);
	});
});

describe('writeAnchorNames', () => {
	it('writes names as comma-separated list', () => {
		const el = createMockElement();
		writeAnchorNames(el, ['--layer-1', '--layer-2']);
		expect(anchorNameOf(el)).toBe('--layer-1, --layer-2');
	});

	it('writes empty string for empty array', () => {
		const el = createMockElement();
		writeAnchorNames(el, []);
		expect(anchorNameOf(el)).toBe('');
	});
});

describe('addAnchorName', () => {
	it('adds name to element with no existing anchors', () => {
		const el = createMockElement();
		addAnchorName(el, '--layer-1');
		expect(anchorNameOf(el)).toBe('--layer-1');
	});

	it('appends name to existing anchor list', () => {
		const el = createMockElement();
		setAnchorName(el, '--layer-1');
		addAnchorName(el, '--layer-2');
		expect(anchorNameOf(el)).toBe('--layer-1, --layer-2');
	});

	it('does not duplicate an already-present name', () => {
		const el = createMockElement();
		setAnchorName(el, '--layer-1');
		addAnchorName(el, '--layer-1');
		expect(anchorNameOf(el)).toBe('--layer-1');
	});

	it('supports multiple layers sharing one element', () => {
		const el = createMockElement();
		addAnchorName(el, '--menu-1');
		addAnchorName(el, '--menu-2');
		addAnchorName(el, '--menu-3');
		expect(readAnchorNames(el)).toEqual(['--menu-1', '--menu-2', '--menu-3']);
	});
});

describe('removeAnchorName', () => {
	it('removes name from a multi-anchor list', () => {
		const el = createMockElement();
		setAnchorName(el, '--layer-1, --layer-2, --layer-3');
		removeAnchorName(el, '--layer-2');
		expect(readAnchorNames(el)).toEqual(['--layer-1', '--layer-3']);
	});

	it('removes the last remaining name, leaving empty string', () => {
		const el = createMockElement();
		setAnchorName(el, '--layer-1');
		removeAnchorName(el, '--layer-1');
		expect(anchorNameOf(el)).toBe('');
	});

	it('is a no-op if name is not present', () => {
		const el = createMockElement();
		setAnchorName(el, '--layer-1, --layer-2');
		removeAnchorName(el, '--layer-3');
		expect(readAnchorNames(el)).toEqual(['--layer-1', '--layer-2']);
	});

	it('handles multiple add/remove cycles correctly', () => {
		const el = createMockElement();
		addAnchorName(el, '--menu-a');
		addAnchorName(el, '--menu-b');
		removeAnchorName(el, '--menu-a');
		addAnchorName(el, '--menu-c');
		expect(readAnchorNames(el)).toEqual(['--menu-b', '--menu-c']);
	});
});
