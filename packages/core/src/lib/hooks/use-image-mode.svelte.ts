/**
 * Dark/light detection for an image, ported from Astryx's
 * `hooks/useImageMode.ts`.
 *
 * Samples the image through `OffscreenCanvas` — no visible canvas, no layout
 * thrash, nothing on the paint path — and scores it with APCA perceptual
 * lightness (sRGB linearisation plus a power curve), which handles saturated
 * colours far better than BT.709 gamma-luma or WCAG 2 relative luminance. Pass
 * a `region` to ask about one area, e.g. where a text overlay will sit.
 *
 * The sampling is pure DOM work and transcribes unchanged. Two translations:
 * `src` and the options arrive as getters, and the result is an object whose
 * `mode` is a `$state` read — `mode` being the name upstream's own `.doc.mjs`
 * gives the return value.
 *
 * Upstream's effect lists `[src, region, threshold, fallback]`, so a caller who
 * rebuilds the `region` object every render re-fetches every render. Here the
 * effect tracks the reactive *sources* read through the getter, so an options
 * object built fresh each time costs nothing.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const { src }: { src: string } = $props();
 *   const image = useImageMode(() => src);
 * </script>
 *
 * <div style="background-image: url({src})">
 *   <MediaTheme mode={image.mode ?? 'dark'}>
 *     <Text>Auto-detected text color</Text>
 *   </MediaTheme>
 * </div>
 * ```
 */

/**
 * Region to sample within the image (normalized 0-1 coordinates).
 * Useful for detecting luminance where text will be overlaid,
 * rather than the full image average.
 */
export interface ImageSampleRegion {
	/** Left edge (0 = left, 1 = right) */
	x: number;
	/** Top edge (0 = top, 1 = bottom) */
	y: number;
	/** Width as fraction of image width */
	width: number;
	/** Height as fraction of image height */
	height: number;
}

export interface UseImageModeOptions {
	/**
	 * Region to sample. Defaults to the full image.
	 * Use normalized coordinates (0-1).
	 */
	region?: ImageSampleRegion;
	/**
	 * Luminance threshold for the dark/light split.
	 * Below this = 'dark', above = 'light'.
	 * @default 0.5
	 */
	threshold?: number;
	/**
	 * Fallback value while loading or on error.
	 * @default null
	 */
	fallback?: 'dark' | 'light' | null;
}

export interface ImageModeState {
	/** Detected luminance mode. The fallback while loading, or on error. */
	readonly mode: 'dark' | 'light' | null;
}

/**
 * APCA perceptual lightness from sRGB values (0-255).
 *
 * Linearizes sRGB with a 2.4 exponent, computes luminance Y using
 * APCA coefficients (slightly refined from BT.709), then applies a
 * perceptual power curve (Y^0.56) that maps linear light to a scale
 * where 0.5 ≈ perceptual mid-gray.
 *
 * This outperforms both raw BT.709 gamma-luma and WCAG 2 relative
 * luminance for dark/light surface detection — especially on saturated
 * colors (reds, blues) where gamma-encoded luma overestimates brightness.
 *
 * Returns 0–1 where 0 is black, 1 is white.
 */
function perceptualLightness(r: number, g: number, b: number): number {
	const lin = (c: number) => Math.pow(c / 255, 2.4);
	const y = 0.2126729 * lin(r) + 0.7151522 * lin(g) + 0.072175 * lin(b);
	return Math.pow(y, 0.56);
}

/**
 * Detect whether an image is predominantly dark or light.
 *
 * Reports the fallback while loading and on any sampling failure — a
 * cross-origin image without `Access-Control-Allow-Origin` cannot be fetched
 * with `mode: 'cors'`, so it never leaves the fallback.
 */
export function useImageMode(
	src: () => string | null | undefined,
	options: () => UseImageModeOptions = () => ({})
): ImageModeState {
	let detectedResult = $state<{
		src: string;
		mode: 'dark' | 'light' | null;
	} | null>(null);

	$effect(() => {
		const current = src();
		if (!current) {
			return;
		}
		// Re-bound after the guard, as upstream's `const srcUrl = src` is: a
		// hoisted function declaration can outrun control-flow narrowing, so
		// `detect` would otherwise still see `string | null | undefined`.
		const srcUrl = current;

		const { region, threshold = 0.5, fallback = null } = options();
		let cancelled = false;

		async function detect() {
			try {
				// Load image as bitmap (async, doesn't block rendering)
				const response = await fetch(srcUrl, { mode: 'cors' });
				const blob = await response.blob();
				const bitmap = await createImageBitmap(blob);

				if (cancelled) {
					return;
				}

				// Determine source region
				const sx = region ? Math.round(region.x * bitmap.width) : 0;
				const sy = region ? Math.round(region.y * bitmap.height) : 0;
				const sw = region ? Math.round(region.width * bitmap.width) : bitmap.width;
				const sh = region ? Math.round(region.height * bitmap.height) : bitmap.height;

				// Sample at a small size and average all pixels manually.
				// OffscreenCanvas 1×1 drawImage can produce inaccurate results
				// depending on the browser's resampling algorithm.
				const sampleSize = 10;
				const canvas = new OffscreenCanvas(sampleSize, sampleSize);
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					return;
				}

				ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sampleSize, sampleSize);
				const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

				// Average all sampled pixels
				let totalR = 0,
					totalG = 0,
					totalB = 0;
				const pixelCount = sampleSize * sampleSize;
				for (let i = 0; i < imageData.length; i += 4) {
					totalR += imageData[i];
					totalG += imageData[i + 1];
					totalB += imageData[i + 2];
				}
				const r = totalR / pixelCount;
				const g = totalG / pixelCount;
				const b = totalB / pixelCount;

				if (cancelled) {
					return;
				}

				const lightness = perceptualLightness(r, g, b);
				detectedResult = {
					src: srcUrl,
					mode: lightness > threshold ? 'light' : 'dark'
				};
			} catch {
				// CORS error, network error, etc. — keep fallback
				if (!cancelled) {
					detectedResult = { src: srcUrl, mode: fallback };
				}
			}
		}

		void detect();

		return () => {
			cancelled = true;
		};
	});

	return {
		get mode() {
			const current = src();
			const { fallback = null } = options();

			if (!current || detectedResult?.src !== current) {
				return fallback;
			}

			return detectedResult.mode;
		}
	};
}
