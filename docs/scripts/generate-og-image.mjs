/**
 * Renders `static/og.png`, the 1200×630 card every link to this site unfurls as.
 *
 * Run by hand (`node scripts/generate-og-image.mjs`) and committed, rather than
 * wired into the build: it needs a browser, the output changes only when the
 * source does, and a build step that downloads Chromium to produce a file nobody
 * edited would be a poor trade. Playwright is already a dependency of
 * `packages/core` for the browser test project.
 *
 * ## The card is the landing page itself
 *
 * It used to be a hand-drawn card — a headline, a subhead and three stat
 * columns, laid out in the site's tokens. That was the right call when the
 * landing page was a plain hero; it stopped being right once the page grew the
 * wordmark, the floating product cards and the theme reel, because the unfurl
 * then advertised a design system with a picture of no design.
 *
 * So the source is now `og-source.webp`, a 1920×1080 desktop capture of `/`.
 * The capture is committed rather than taken live for two reasons: a live shot
 * would need the site running *and* would race the hero reel's rotation, which
 * changes the two product cards every few seconds — the card would be
 * non-deterministic, and a re-run for an unrelated copy change could land on a
 * different slide. A committed source makes this script a pure function.
 *
 * Re-capture it at 1920×1080 with the reel on its first slide when the landing
 * page changes enough to be worth it, drop it in as `og-source.webp`, and
 * re-run this.
 *
 * ## The crop
 *
 * 1920×1080 is 16:9 (1.778); an Open Graph card is 1.905. Fitting the capture
 * to the card's *width* gives 1200×675, so 45px come off — from the bottom,
 * which is the top edge of the page's second section. Cropping the other way
 * (to the hero alone, letterboxed) was tried and read worse: the hero's own
 * background is a gradient wash, so flat bands above and below it seam
 * visibly. Keeping the fold in looks like a page, which is the point.
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(here, 'og-source.webp');
const out = path.resolve(here, '..', 'static', 'og.png');

const WIDTH = 1200;
const HEIGHT = 630;

// Inlined as a data URI rather than loaded by `file://`, so the page has no
// origin to get wrong and `setContent` needs no `baseURL`.
const dataUri = `data:image/webp;base64,${fs.readFileSync(source).toString('base64')}`;

const html = `<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
		<style>
			* { margin: 0; padding: 0; }
			body {
				width: ${WIDTH}px;
				height: ${HEIGHT}px;
				overflow: hidden;
				/* Matches the capture's own page background, so a source whose
				   aspect ratio ever differs letterboxes invisibly rather than
				   against white. */
				background: #f8f4ed;
			}
			img { display: block; width: ${WIDTH}px; }
		</style>
	</head>
	<body><img src="${dataUri}" /></body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
await page.setContent(html);
// The <img> decodes asynchronously; without waiting the shot can catch the
// page before the bitmap is painted and write a blank card.
await page.evaluate(() => Promise.all(Array.from(document.images, (img) => img.decode())));
await page.screenshot({ path: out });
await browser.close();

console.log(`wrote ${out}`);
