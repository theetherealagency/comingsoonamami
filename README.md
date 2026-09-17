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

## Domain

Production is <https://www.amamiitalia.com>. Canonical, `og:` and sitemap URLs
all point there.

Two things still sit outside this repo, in DNS / Vercel:

1. The apex `amamiitalia.com` is not pointed at this deployment — it still
   resolves to a parking lander. Add it in Vercel and redirect it to `www`.
2. `careers.amamiitalia.com` still serves the old standalone copy. 301 it to
   `https://www.amamiitalia.com/careers` so the two do not compete in search.

## Editing the careers page

Open positions are plain HTML. Copy an `<article class="pos" data-role="…">`
block to add a role, delete one to close it — the form's Role dropdown is built
from those blocks, so the two cannot drift apart.
