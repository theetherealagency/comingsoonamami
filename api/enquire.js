/* POST /api/enquire — mails a holding-page enquiry to the restaurant.
   Resend's HTTP API over native fetch, so the site keeps its no-build,
   no-dependency shape. RESEND_API_KEY must be set in Vercel; ENQUIRY_TO and
   ENQUIRY_FROM are optional overrides. */

const DEFAULT_TO   = "info@amamiitalia.com";
const DEFAULT_FROM = "Amami Italia <onboarding@resend.dev>";

const FIELDS = [
  ["name",    "Name"],
  ["email",   "Email"],
  ["phone",   "Phone"],
  ["type",    "About"],
  ["date",    "Date"],
  ["guests",  "Guests"],
  ["message", "Message"]
];

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function parseBody(req) {
  var b = req.body;
  if (b && typeof b === "object") return b;
  if (typeof b !== "string") return {};
  try { return JSON.parse(b); } catch (e) { /* not JSON — try form encoding */ }
  var out = {};
  new URLSearchParams(b).forEach(function (v, k) { out[k] = v; });
  return out;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = parseBody(req);

  // A native form post (no JS) wants a page back, not JSON.
  const wantsHtml = !req.headers["x-requested-with"] &&
    String(req.headers.accept || "").indexOf("text/html") !== -1;
  const finish = function (status, payload, hash) {
    if (wantsHtml) return res.redirect(303, "/" + hash);
    return res.status(status).json(payload);
  };

  // Honeypot: bots fill every field, people never see this one.
  if (String(body.company_website || "").trim()) {
    return finish(200, { ok: true }, "?enquiry=sent#enquire");
  }

  const value = {};
  FIELDS.forEach(function (f) { value[f[0]] = String(body[f[0]] || "").trim(); });

  if (!value.name || !value.phone || !value.message) {
    return finish(400, { ok: false, error: "Please fill in your name, phone and message." }, "?enquiry=error#enquire");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.email)) {
    return finish(400, { ok: false, error: "That email does not look right — we need it to reply." }, "?enquiry=error#enquire");
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — enquiry not sent");
    return finish(500, { ok: false, error: "Enquiries are not set up yet. Please email us directly." }, "?enquiry=error#enquire");
  }

  const filled = FIELDS.filter(function (f) { return value[f[0]]; });
  const text = filled.map(function (f) { return f[1] + ": " + value[f[0]]; }).join("\n");
  const rows = filled.map(function (f) {
    return '<tr><td style="padding:7px 16px 7px 0;color:#6b6b6b;font-size:12px;' +
      'letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;vertical-align:top;">' +
      esc(f[1]) + '</td><td style="padding:7px 0;color:#161616;font-size:14px;line-height:1.6;">' +
      esc(value[f[0]]).replace(/\n/g, "<br>") + "</td></tr>";
  }).join("");

  const html =
    '<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;">' +
    '<p style="margin:0 0 4px;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#462e24;">Amami Italia</p>' +
    '<h2 style="margin:0 0 18px;font-size:19px;font-weight:500;color:#161616;">New enquiry</h2>' +
    '<table style="border-collapse:collapse;width:100%;">' + rows + "</table>" +
    '<p style="margin:20px 0 0;padding-top:14px;border-top:1px solid #e3e3e3;font-size:12px;color:#6b6b6b;">' +
    "Reply straight to this email and it reaches " + esc(value.name) + ".</p></div>";

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.ENQUIRY_FROM || DEFAULT_FROM,
        to: process.env.ENQUIRY_TO || DEFAULT_TO,
        reply_to: value.email,
        subject: "Enquiry — " + (value.type || "Amami Italia") + " — " + value.name,
        text: text,
        html: html
      })
    });

    if (!r.ok) {
      console.error("Resend rejected the enquiry", r.status, await r.text());
      return finish(502, { ok: false, error: "That did not send. Please try again." }, "?enquiry=error#enquire");
    }

    return finish(200, { ok: true }, "?enquiry=sent#enquire");
  } catch (err) {
    console.error("Enquiry send failed", err);
    return finish(502, { ok: false, error: "That did not send. Please try again." }, "?enquiry=error#enquire");
  }
};
