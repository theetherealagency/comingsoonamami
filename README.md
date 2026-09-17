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

### Caching, and the trap in it

`vercel.json` caches `assets/` and `_assets/` for a year as `immutable`, which
is right for the images and fonts: their names carry their size, so a different
file is always a different URL.

CSS and JS are not like that — the names never change, so an `immutable` year
meant a returning visitor kept the old stylesheet and never asked for a new one.
A redesign shipped, and anyone who had seen the site before still saw the old
one. `.css` and `.js` therefore get `max-age=0, must-revalidate` instead, which
costs one 304 per visit and can never go stale.

The `?v=` on the stylesheet and script in `index.html` was the one-time break
out of caches already poisoned by the old header. Leave it; it is harmless.

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

| Variable         | Required | Default                                  |
|------------------|----------|------------------------------------------|
| `RESEND_API_KEY` | yes      | —                                        |
| `ENQUIRY_TO`     | no       | `skundnani@etherealpr.com`               |
| `ENQUIRY_FROM`   | no       | `Amami Italia <enquiries@amamiitalia.com>` |

Both defaults are deliberate, and both are worth revisiting:

- **The sender** must be on a domain verified in Resend. Resend's shared
  `onboarding@resend.dev` sender only delivers to the Resend account owner —
  every other recipient comes back `403 validation_error`.
- **The recipient** is not `info@amamiitalia.com`, the address this site
  publishes, because `amamiitalia.com` serves no MX record — mail sent there
  has nowhere to land. Enquiries go to the agency inbox until that is fixed.
  The same gap applies to the careers form, which still mails `info@`.

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
