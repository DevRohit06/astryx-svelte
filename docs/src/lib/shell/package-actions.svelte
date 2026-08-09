<script lang="ts" module>
	export interface InstallStep {
		label: string;
		code: string;
		language?: string;
	}
</script>

<script lang="ts">
	import { Button, Card, CodeBlock, HStack, Popover, Text, VStack } from '@astryx-svelte/core';

	/**
	 * Upstream's `docs/PackageActions` — the package-only affordances rendered in
	 * the page body: the version-labelled Install popover and an optional CTA.
	 * The title and dek come from `DocPageLayout`, so they are deliberately
	 * absent here.
	 *
	 * **The one divergence is the version, and it is a fact rather than a
	 * preference.** Upstream renders `Install v{version}` whenever a version is
	 * given and plain `Install` when it is not. Every package in this repo is
	 * still at `0.0.0` and `@astryx-svelte/cli` is additionally `private`, so
	 * neither is on npm: printing `Install v0.0.0` over an `npm install` command
	 * that cannot resolve would be a button that lies twice. An unreleased
	 * package therefore takes upstream's *own* version-less branch, and its steps
	 * say how to run it from a clone. Nothing new is invented — the release, when
	 * it happens, moves both packages onto the labelled branch with no edit here.
	 */
	interface Props {
		packageName: string;
		version?: string;
		/** True when the manifest is `private` or the version is still `0.0.0`. */
		isReleased?: boolean;
		installSteps?: InstallStep[];
		cta?: { label: string; href: string };
	}

	const {
		packageName,
		version = undefined,
		isReleased = false,
		installSteps = undefined,
		cta = undefined
	}: Props = $props();

	// Upstream's fallback pair, for a package whose route does not supply steps.
	const steps = $derived<InstallStep[]>(
		installSteps ?? [
			{ label: 'Install the package', code: `npm install ${packageName}` },
			{
				label: 'Import',
				code: `import { … } from '${packageName}';`,
				language: 'typescript'
			}
		]
	);

	const installLabel = $derived(isReleased && version ? `Install v${version}` : 'Install');
</script>

{#snippet installContent()}
	<VStack gap={3}>
		{#each steps as step, i (i)}
			<VStack gap={1}>
				<Text type="body" weight="bold">{i + 1}. {step.label}</Text>
				<Card padding={0}>
					<CodeBlock
						code={step.code}
						language={step.language ?? 'bash'}
						width="100%"
						hasCopyButton
						isWrapped
					/>
				</Card>
			</VStack>
		{/each}
	</VStack>
{/snippet}

<HStack gap={2}>
	<Popover width={360} content={installContent}>
		<Button label={installLabel} variant="primary" />
	</Popover>
	{#if cta}
		<Button label={cta.label} href={cta.href} variant="secondary" />
	{/if}
</HStack>
