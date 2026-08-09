<script lang="ts">
	import { KeyboardHintLayer, useKeyboardHint } from '$lib/index.js';

	/**
	 * A minimal roving-tabindex toolbar built by hand, to show the raw hook
	 * wiring — upstream's `useKeyboardHint.stories.tsx` fixture, transcribed.
	 *
	 * It is hand-rolled rather than built on our own `useListFocus` because that
	 * is the point upstream's fixture makes: the hint is wired to a composite by
	 * three handlers and one layer, whatever moves the focus.
	 *
	 * The handler names are the hook's published ones; the *attributes* are
	 * `onfocusin`/`onfocusout`, since React's `onFocus`/`onBlur` are the bubbling
	 * synthetic events and native `focus`/`blur` do not bubble — the hint reads a
	 * focused descendant as `e.target` while `e.currentTarget` is this container.
	 */
	const {
		label,
		orientation,
		items
	}: {
		label: string;
		orientation: 'horizontal' | 'vertical';
		items: string[];
	} = $props();

	const id = $props.id();
	const hint = useKeyboardHint(() => ({ id, orientation }));

	let container = $state<HTMLDivElement | null>(null);

	const nextKey = $derived(orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight');
	const prevKey = $derived(orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft');

	function handleKeyDown(e: KeyboardEvent): void {
		if (!container) {
			return;
		}
		const buttons = Array.from(container.querySelectorAll('button'));
		const current = buttons.findIndex((b) => b === document.activeElement);
		if (current === -1) {
			return;
		}
		let next: number;
		if (e.key === nextKey) {
			next = (current + 1) % buttons.length;
		} else if (e.key === prevKey) {
			next = (current - 1 + buttons.length) % buttons.length;
		} else {
			return;
		}
		e.preventDefault();
		buttons[current].tabIndex = -1;
		buttons[next].tabIndex = 0;
		buttons[next].focus();
	}
</script>

<!--
	Svelte asks for a `tabindex` on an interactive role, but the roving-tabindex
	pattern this fixture exists to demonstrate puts the tab stop on exactly one
	*item* and never on the container — giving the container one would add a
	second stop and break the single-Tab-entry contract the hint teaches.
-->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
	bind:this={container}
	role="toolbar"
	aria-label={label}
	aria-orientation={orientation}
	onkeydown={(e) => {
		hint.onKeyDown(e);
		handleKeyDown(e);
	}}
	onfocusin={hint.onFocus}
	onfocusout={hint.onBlur}
	class="hint-toolbar"
	class:vertical={orientation === 'vertical'}
>
	{#each items as item, i (item)}
		<button type="button" tabindex={i === 0 ? 0 : -1}>{item}</button>
	{/each}
	<KeyboardHintLayer {hint} />
</div>

<style>
	.hint-toolbar {
		display: inline-flex;
		flex-direction: row;
		align-items: center;
		gap: 4px;
		padding: 8px;
		border-radius: 8px;
		background: var(--color-background-muted);
	}

	.hint-toolbar.vertical {
		flex-direction: column;
		align-items: stretch;
	}

	.hint-toolbar button {
		appearance: none;
		border: none;
		border-radius: 6px;
		padding: 6px 12px;
		background: var(--color-background-popover);
		color: var(--color-text-primary);
		font: inherit;
		text-align: center;
		cursor: pointer;
	}

	.hint-toolbar.vertical button {
		text-align: start;
	}
</style>
