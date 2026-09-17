# Amami Italia — holding site

Two static pages, no build step.

| Path       | File                 | What it is                                   |
|------------|----------------------|----------------------------------------------|
| `/`        | `index.html`         | Coming-soon holding page                     |
| `/careers` | `careers/index.html` | Front-of-house careers page + application    |

## Assets

- `assets/` — holding page: shared stylesheet, logo mark, dining-room
  illustration, favicons, OG card. Sourced from the brand deck.
- `_assets/` — careers page: its own stylesheet, script and photography,
  mirrored from the original careers site with paths unchanged.

The two pages keep separate stylesheets on purpose: the holding page uses the
Mist Blue palette, the careers page its own darker treatment.

## The careers form

`_assets/careers.js` POSTs to a Google Apps Script endpoint, so it works from
any origin and needs no server here.

## Domain cutover

Canonical and `og:` URLs currently point at the addresses that are live today.
When the real domain is pointed at this deployment:

1. `index.html` — canonical, `og:url`, `og:image`, `twitter:image`
2. `careers/index.html` — canonical and `og:url` (see the `DOMAIN CUTOVER` comment)
3. `sitemap.xml` and `robots.txt`
4. 301 `careers.amamiitalia.com` → `<domain>/careers`

## Editing the careers page

Open positions are plain HTML. Copy an `<article class="pos" data-role="…">`
block to add a role, delete one to close it — the form's Role dropdown is built
from those blocks, so the two cannot drift apart.
