<!--
	Ported from upstream's `templates/blocks/components/TextInput/TextInputIcon.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, Stack, TextInput } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `UserIcon`/`EnvelopeIcon`/`LockClosedIcon`; the
	 * registry ships no person, envelope or padlock glyph, so all three substitute
	 * the same built-in — the substitution `Switch` and `CheckboxInput` already
	 * make for `Bell`/`Envelope`/`ShieldCheck`. Retires with the icon registry
	 * (port/todo.md).
	 */

	let name = $state('');
	let email = $state('');
	let password = $state('');
</script>

{#snippet userIcon()}<Icon icon="info" size="sm" color="secondary" />{/snippet}
{#snippet envelopeIcon()}<Icon icon="info" size="sm" color="secondary" />{/snippet}
{#snippet lockIcon()}<Icon icon="info" size="sm" color="secondary" />{/snippet}

<div style="width: 300px">
	<Stack direction="vertical" gap={3}>
		<TextInput
			label="Full name"
			value={name}
			onChange={(next) => (name = next)}
			placeholder="Sarah Chen"
			startIcon={userIcon}
		/>
		<TextInput
			type="email"
			label="Email"
			value={email}
			onChange={(next) => (email = next)}
			placeholder="sarah@company.com"
			startIcon={envelopeIcon}
		/>
		<TextInput
			type="password"
			label="Password"
			value={password}
			onChange={(next) => (password = next)}
			placeholder="Enter your password"
			startIcon={lockIcon}
		/>
	</Stack>
</div>
