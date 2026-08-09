import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import CodeBlock from '$lib/components/code-block/code-block.svelte';
import NumberInput from '$lib/components/number-input/number-input.svelte';

/**
 * Server-markup coverage for the two batch-5 fixes whose *client* halves are
 * pinned in `number-input-spread-value.svelte.test.ts` and
 * `code-block-pre-whitespace.svelte.test.ts`. Both fixes have a server side that
 * a client-project test structurally cannot reach, and Svelte compiles a
 * separate server output, so the two halves genuinely need separate assertions.
 *
 * Placed in the node project against `svelte/server`, the placement
 * `hover-card.test.ts` and `metadata-list.test.ts` already use.
 *
 * Neither case has an upstream counterpart — upstream has no equivalent hazard
 * to test, for the reasons the two client files set out at length.
 */

describe('NumberInput — SSR', () => {
	/**
	 * `NumberInput` writes its controlled value through an attachment rather than
	 * a `value={…}` attribute, because the `<input>` carries `{...rest}` and any
	 * spread loses Svelte's compare-against-the-DOM guard. Attachments do not run
	 * on the server, so the component adds a server-only `value` spread — without
	 * it a server-rendered field would come back **empty**, where React's emits
	 * the value.
	 *
	 * Mutation-checked: removing `{...isServer ? { value: displayValue } : undefined}`
	 * fails the first case (attribute absent).
	 */
	it('emits the value attribute in server markup', () => {
		const { body } = render(NumberInput, {
			props: { label: 'Quantity', value: 42, onChange: () => {} }
		});

		expect(body).toMatch(/<input[^>]*\svalue="42"/);
	});

	it('emits an empty value attribute for a null value', () => {
		const { body } = render(NumberInput, {
			props: { label: 'Quantity', value: null, onChange: () => {} }
		});

		expect(body).toMatch(/<input[^>]*\svalue=""/);
	});
});

describe('CodeBlock — SSR', () => {
	/**
	 * The `<pre>` whitespace fix has to hold on the server too. Svelte compiles a
	 * separate server template, and the pre-hydration paint uses *that* markup —
	 * so whitespace leaking here would show the padded three-line header before
	 * hydration even if the client template were clean, and would additionally
	 * make hydration mismatch.
	 */
	it('opens the <pre> with no leading whitespace text node', () => {
		const { body } = render(CodeBlock, {
			props: { code: 'const x = 1;', language: 'typescript', title: 'example.ts' }
		});

		const pre = /<pre[^>]*>([\s\S]*?)<\/pre>/.exec(body);
		expect(pre).not.toBeNull();
		expect(/^\s/.test((pre as RegExpExecArray)[1])).toBe(false);
	});

	it('renders the header title with no surrounding whitespace', () => {
		const { body } = render(CodeBlock, {
			props: { code: 'const x = 1;', language: 'typescript', title: 'example.ts' }
		});

		// The title text must sit flush against its tags, exactly as upstream's
		// JSX emits it. Svelte's comment anchors may sit between them.
		expect(body).toContain('example.ts');
		expect(body).not.toMatch(/>\s*\n\s+example\.ts/);
	});
});
