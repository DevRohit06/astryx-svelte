<!--
	Ported from upstream's `templates/blocks/components/Stepper/StepperCustomContent.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Banner, Button, Card, Step, Stepper, Text, TextInput } from '@astryx-svelte/core';

	let active = $state(0);
</script>

<!--
	The content slot takes any node, not just form fields — a panel, a summary,
	a notice. Gating it on `active` is what makes the flow expand a step at a
	time.

	Upstream writes that gate as `{active === N && …}` inside the tag, which hands
	the Step `false` for its children and renders no slot at all. An `{#if}` in the
	same place would still hand it a snippet, so the content wrapper — and its
	padding — would render on every step; passing the snippet itself conditionally
	is the faithful translation.
-->
{#snippet projectDetailsContent()}
	<div style="display: flex; flex-direction: column; gap: 12px">
		<div style="display: flex; gap: 12px">
			<TextInput label="Project name" placeholder="My awesome project" value="" width="100%" />
			<TextInput
				label="Repository URL"
				placeholder="https://github.com/..."
				value=""
				width="100%"
			/>
		</div>
		<div>
			<Button label="Continue" variant="primary" onclick={() => (active = 1)} />
		</div>
	</div>
{/snippet}

{#snippet reviewBuildContent()}
	<div style="display: flex; flex-direction: column; gap: 12px">
		<Card variant="muted" padding={3}>
			<div style="display: flex; flex-direction: column; gap: 8px">
				<div style="display: flex; align-items: center; gap: 8px">
					<Text type="label">Next.js 15</Text>
					<Badge variant="success" label="Detected" />
				</div>
				<Text type="supporting">
					Build command <code>next build</code> · Output <code>.next</code> · Node 20
				</Text>
			</div>
		</Card>
		<div style="display: flex; gap: 8px">
			<Button label="Back" variant="secondary" onclick={() => (active = 0)} />
			<Button label="Looks right" variant="primary" onclick={() => (active = 2)} />
		</div>
	</div>
{/snippet}

{#snippet deployContent()}
	<div style="display: flex; flex-direction: column; gap: 12px">
		<Banner
			status="info"
			title="First deploy takes a few minutes"
			description="Later deploys reuse the build cache and finish in under a minute."
		/>
		<div style="display: flex; gap: 8px">
			<Button label="Back" variant="secondary" onclick={() => (active = 1)} />
			<Button label="Deploy now" variant="primary" onclick={() => (active = 3)} />
		</div>
	</div>
{/snippet}

<div style="width: 680px">
	<Stepper activeStep={active} orientation="vertical" onStepClick={(index) => (active = index)}>
		<Step
			step={0}
			label="Project details"
			description="Name it and point us at the source"
			indicator="number"
			children={active === 0 ? projectDetailsContent : undefined}
		/>
		<Step
			step={1}
			label="Review the build"
			description="What we detected from your default branch"
			indicator="number"
			children={active === 1 ? reviewBuildContent : undefined}
		/>
		<Step
			step={2}
			label="Deploy"
			description="Ships to production"
			indicator="number"
			children={active === 2 ? deployContent : undefined}
		/>
		<Step step={3} label="Live" indicator="number" />
	</Stepper>
</div>
