<script lang="ts">
	import { Button, Card, Center, CodeBlock, Text, VStack } from '@astryx-svelte/core';
	import type { PlaygroundConfig } from '$lib/generated/types.js';
	import type { Knob } from './prop-control.js';
	import ComponentPreviewTheme from './component-preview-theme.svelte';
	import { previewComponentFor, textSnippet } from './preview-components.js';
	import PreviewFailure from './preview-failure.svelte';

	/**
	 * The live preview above the props table — upstream's
	 * `InteractivePreviewStage`.
	 *
	 * Same three states as upstream's, in the same order: required props that
	 * could not be generated, a name that resolves to no component, and otherwise
	 * the component itself inside an error boundary, with a code toggle pinned to
	 * the top-right corner.
	 *
	 * **The stage never renders on the server.** Not by a guard here, but because
	 * the Properties tab does not exist during prerender: the page's `tab` is
	 * `$state('overview')` and only an effect adopts `?tab=` after hydration, so
	 * SSR always takes the Overview branch. That is the same arrangement upstream
	 * uses (`<Suspense>` around `useSearchParams()`), and it is what makes it safe
	 * to render an arbitrary component from a prop bag here at all — a component
	 * that can only run in the browser cannot break the prerender, and there is no
	 * server-rendered markup for the client's first render to disagree with.
	 */
	interface Props {
		name: string;
		knobs: Knob[];
		values: Record<string, unknown>;
		playground: PlaygroundConfig | null;
		missing: string[];
		/** The Svelte source the current values imply, shown by the `<>` toggle. */
		code: string;
		/** Increments on every edit; resets a failed boundary. */
		token: number;
		onValueChange: (name: string, value: unknown) => void;
	}

	const { name, knobs, values, playground, missing, code, token, onValueChange }: Props = $props();

	let showCode = $state(false);

	const Component = $derived(previewComponentFor(name));

	/**
	 * A sub-component's required parent, from `playground.wrapper` — `Tab` inside a
	 * `TabList`, `RadioListItem` inside a `RadioList`. Upstream injects the
	 * previewed component as the wrapper's children and so does this; the wrapper's
	 * children slot is the one snippet the markup can supply directly, so it needs
	 * none of `textSnippet`'s machinery.
	 */
	const Wrapper = $derived(
		playground?.wrapper ? previewComponentFor(playground.wrapper.component) : null
	);
	const wrapperProps = $derived(playground?.wrapper?.props ?? {});

	/**
	 * The prop bag the component is spread with.
	 *
	 * Two things happen here that the values object cannot carry on its own. A
	 * `Snippet`-typed prop holds an edited **string** in the values, and is wrapped
	 * into a snippet on the way in — the port's divergence, described on
	 * `textSnippet`. And an `isOpen`/`onOpenChange` pair is bridged back into the
	 * knobs, which is upstream's `canControlOpenState`: without it a modal opened
	 * from the table could not be closed from its own close button, because the
	 * component is controlled and the seeded handler is a no-op.
	 */
	const runtimeProps = $derived.by(() => {
		const props: Record<string, unknown> = {};

		for (const knob of knobs) {
			const value = values[knob.row.name];
			if (value === undefined) continue;
			if (knob.control.kind === 'snippet') {
				const text = String(value);
				if (text !== '') props[knob.row.name] = textSnippet(text);
				continue;
			}
			props[knob.row.name] = value;
		}

		if (
			typeof values.isOpen === 'boolean' &&
			knobs.some((knob) => knob.row.name === 'onOpenChange')
		) {
			props.onOpenChange = (next: boolean) => onValueChange('isOpen', next);
		}

		return props;
	});

	/**
	 * An overlay component with nothing to show. `Lightbox` and `MobileNav` are
	 * upstream's two: they mount into the top layer and render nothing inline, so
	 * the stage offers the trigger instead of an empty box.
	 */
	const isClosedOverlay = $derived(playground?.overlay === true && values.isOpen !== true);

	/**
	 * Snippet rows with nothing typed in them. Handed to the failure note, which
	 * uses them to turn Svelte's `invalid_snippet` into an instruction — see the
	 * note there for why an empty slot is fatal here and harmless upstream.
	 */
	const emptySlots = $derived(
		knobs
			.filter((knob) => knob.control.kind === 'snippet' && !values[knob.row.name])
			.map((knob) => knob.row.name)
	);
</script>

{#snippet note(lines: string[])}
	<Center width="100%" minHeight={200}>
		<VStack gap={1} style="padding: var(--spacing-6); text-align: center; align-items: center;">
			{#each lines as line, i (i)}
				<Text type="supporting" color="secondary">{line}</Text>
			{/each}
		</VStack>
	</Center>
{/snippet}

{#snippet previewed()}
	{#if Component}
		<Component {...runtimeProps} />
	{/if}
{/snippet}

<ComponentPreviewTheme>
	<Card variant="muted" padding={0}>
		<div class="stage">
			<div class="stage-toggle">
				<Button
					label={showCode ? 'Show preview' : 'Show code'}
					tooltip={showCode ? 'Show preview' : 'Show code'}
					isIconOnly
					size="sm"
					variant={showCode ? 'secondary' : 'ghost'}
					onclick={() => (showCode = !showCode)}
				>
					{#snippet icon()}
						<span class="stage-glyph" aria-hidden="true">&lt;&gt;</span>
					{/snippet}
				</Button>
			</div>

			{#if showCode}
				<div class="stage-code">
					<CodeBlock {code} language="svelte" container="section" width="100%" hasCopyButton />
				</div>
			{:else if missing.length > 0}
				<!--
				Upstream's wording, and its reason: a required prop whose type has no
				one-cell editor (a generic `T[]`, a `SearchSource`, a data model) cannot
				be invented, and a component rendered without it throws or renders a
				lie.
			-->
				{@render note([
					'Interactive preview needs required props that cannot be generated automatically.',
					`Missing: ${missing.join(', ')}`
				])}
			{:else if !Component}
				{@render note([
					`Interactive preview not available for ${name}.`,
					'This entry documents a hook rather than a component, so there is nothing to render.'
				])}
			{:else}
				<Center width="100%" minHeight={200}>
					<div class="stage-preview">
						<svelte:boundary>
							{#if Wrapper}
								<Wrapper {...wrapperProps}>{@render previewed()}</Wrapper>
							{:else}
								{@render previewed()}
							{/if}

							{#if isClosedOverlay}
								<VStack gap={2} style="align-items: center; text-align: center;">
									<Text type="supporting" color="secondary">
										Opens as a full-screen overlay — nothing renders while it is closed.
									</Text>
									<Button
										label="Open preview"
										variant="secondary"
										size="sm"
										onclick={() => onValueChange('isOpen', true)}
									/>
								</VStack>
							{/if}

							{#snippet failed(error, reset)}
								<PreviewFailure {name} {error} {reset} {token} {emptySlots} />
							{/snippet}
						</svelte:boundary>
					</div>
				</Center>
			{/if}
		</div>
	</Card>
</ComponentPreviewTheme>

<!--
	Not StyleX: CLAUDE.md forbids importing it from a `.svelte` file, and the docs
	shell styles itself with scoped CSS throughout. Every colour and length below
	is a theme variable, so the stage tracks light and dark with the page.
-->
<style>
	.stage {
		position: relative;
		width: 100%;
	}

	.stage-toggle {
		position: absolute;
		z-index: 2;
		inset-block-start: var(--spacing-2);
		inset-inline-end: var(--spacing-2);
	}

	.stage-glyph {
		font-family: var(--font-family-mono, monospace);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		line-height: 1;
	}

	/* Keeps a wide code line from running under the toggle. */
	.stage-code {
		min-height: 200px;
		overflow: auto;
		padding-inline-end: var(--spacing-8);
	}

	/*
		The preview scrolls inside the card rather than stretching it — the same
		`fit-content` floor `example-preview.svelte` uses, for the same reason.
	*/
	.stage-preview {
		min-width: fit-content;
		max-width: 100%;
		padding: var(--spacing-4);
	}
</style>
