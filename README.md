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

## The forms

The two forms use different backends, for the reason each needs.

| Form     | Script               | Posts to                  | Lands at               |
|----------|----------------------|---------------------------|------------------------|
| Careers  | `_assets/careers.js` | Google Apps Script        | `info@amamiitalia.com` |
| Enquiry  | `assets/enquiry.js`  | `api/enquire.js` (Resend) | `info@amamiitalia.com` |

**Careers** posts to a Google Apps Script web app, unchanged and deployed
outside this repo. It carries a résumé file, which Apps Script handles without
a size-limited request body here.

**Enquiry** posts to `api/enquire.js`, a single Vercel function — no framework,
no dependencies, just `fetch` to Resend's HTTP API. Set this in the Vercel
project (Settings → Environment Variables):

| Variable         | Required | Default                                |
|------------------|----------|----------------------------------------|
| `RESEND_API_KEY` | yes      | —                                      |
| `ENQUIRY_TO`     | no       | `info@amamiitalia.com`                 |
| `ENQUIRY_FROM`   | no       | `Amami Italia <onboarding@resend.dev>` |

Once `amamiitalia.com` is verified in Resend, set `ENQUIRY_FROM` to an address
on that domain — until then Resend's shared sender is used, which delivers but
is not branded.

The enquiry panel is open in the markup and closed by JS on load, so a visitor
without JavaScript still sees a form that posts; the function redirects that
post back to `/?enquiry=sent`, which the script reads to show the confirmation.
If the endpoint is unreachable, the script falls back to a pre-filled `mailto:`
rather than losing the enquiry.

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
