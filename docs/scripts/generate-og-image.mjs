/**
 * Renders `static/og.png`, the 1200×630 card every link to this site unfurls as.
 *
 * Run by hand (`node scripts/generate-og-image.mjs`) and committed, rather than
 * wired into the build: it needs a browser, the output changes only when the
 * copy does, and a build step that downloads Chromium to produce a file nobody
 * edited would be a poor trade. Playwright is already a dependency of
 * `packages/core` for the browser test project.
 *
 * The card is drawn in the site's own tokens — the same `--color-accent` and
 * `Figtree` the pages use — so the unfurl looks like the destination rather than
 * like a generic template.
 */

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'static', 'og.png');

const html = `<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
		<link
			href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap"
			rel="stylesheet"
		/>
		<style>
			* { margin: 0; padding: 0; box-sizing: border-box; }
			body {
				width: 1200px;
				height: 630px;
				background: #0b0b0d;
				color: #f5f5f7;
				font-family: Figtree, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				padding: 72px 80px;
				position: relative;
				overflow: hidden;
			}
			/* A single accent wash, echoing the landing hero rather than inventing art. */
			.glow {
				position: absolute;
				width: 900px;
				height: 900px;
				right: -280px;
				top: -380px;
				background: radial-gradient(circle, rgba(0, 100, 224, 0.5) 0%, rgba(0, 100, 224, 0) 68%);
			}
			.top { display: flex; align-items: center; gap: 16px; position: relative; }
			.mark {
				width: 44px; height: 44px; border-radius: 12px;
				background: #0064e0; display: flex; align-items: center;
				justify-content: center; font-weight: 700; font-size: 26px; color: #fff;
			}
			.name { font-size: 26px; font-weight: 600; letter-spacing: -0.01em; }
			h1 {
				position: relative;
				font-size: 76px; line-height: 1.04; font-weight: 700;
				letter-spacing: -0.035em; max-width: 15ch;
			}
			h1 em { font-style: normal; color: #4d9bff; }
			.bottom { display: flex; align-items: flex-end; justify-content: space-between; position: relative; }
			p { font-size: 27px; line-height: 1.4; color: #a9a9b3; max-width: 30ch; }
			.stats { display: flex; gap: 44px; text-align: right; }
			.stat b { display: block; font-size: 40px; font-weight: 700; letter-spacing: -0.02em; }
			.stat span { font-size: 17px; color: #8a8a94; text-transform: uppercase; letter-spacing: 0.09em; }
		</style>
	</head>
	<body>
		<div class="glow"></div>
		<div class="top">
			<div class="mark">A</div>
			<div class="name">astryx-svelte</div>
		</div>
		<h1>Meta's design system, <em>ported to Svelte 5</em></h1>
		<div class="bottom">
			<p>Not just ported &mdash; diffed against upstream's compiled CSS, class by class.</p>
			<div class="stats">
				<div class="stat"><b>101</b><span>Components</span></div>
				<div class="stat"><b>8</b><span>Themes</span></div>
				<div class="stat"><b>0</b><span>Mismatches</span></div>
			</div>
		</div>
	</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
// The webfont is fetched over the network; without settling first the card
// renders in the fallback face and the type metrics shift.
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out });
await browser.close();

console.log(`wrote ${out}`);
