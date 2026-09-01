/** PORTS: utils/devWarning.test.ts */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	devError,
	devWarn,
	formatDevMessage,
	warnOnce,
	__resetDevWarnings
} from '$lib/utils/dev-warning.js';

/**
 * Upstream's `utils/devWarning.test.ts`, ported case for case — all 5.
 *
 * A pure module with no component and no DOM, so it belongs to the node
 * project. `__resetDevWarnings` is imported from the module rather than the
 * barrel because upstream keeps it off `utils/index.ts`, and so do we.
 */

afterEach(() => {
	__resetDevWarnings();
	vi.restoreAllMocks();
});

describe('formatDevMessage', () => {
	it('formats as "Component: message"', () => {
		expect(formatDevMessage('Field', 'oops')).toBe('Field: oops');
	});
});

describe('devWarn', () => {
	it('warns in the standardized format and forwards extra args', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const detail = { a: 1 };
		devWarn('Popover', 'no button', detail);
		expect(warn).toHaveBeenCalledWith('Popover: no button', detail);
	});
});

describe('devError', () => {
	it('errors in the standardized format', () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		const err = new Error('boom');
		devError('Table', 'plugin threw:', err);
		expect(error).toHaveBeenCalledWith('Table: plugin threw:', err);
	});
});

describe('warnOnce', () => {
	it('fires at most once per key', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		warnOnce('k', 'Theme', 'runtime injection');
		warnOnce('k', 'Theme', 'runtime injection');
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn).toHaveBeenCalledWith('Theme: runtime injection');
	});

	it('fires again for a different key', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		warnOnce('a', 'Theme', 'one');
		warnOnce('b', 'Theme', 'two');
		expect(warn).toHaveBeenCalledTimes(2);
	});
});
