// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		/**
		 * Google Analytics' command queue. On this site it is never the real one:
		 * `gtag.js` runs in a Partytown worker and owns the array it reads, so the
		 * array on `window` is the forwarding stub Partytown patches. Typed as
		 * `unknown[]` because every entry is a gtag command tuple, not a value any
		 * of our code reads back. See `$lib/analytics/gtag.ts`.
		 */
		dataLayer?: unknown[];
	}
}

export {};
