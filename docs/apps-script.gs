/**
 * Amami Italia — form endpoint (Google Apps Script web app).
 *
 * One endpoint, two forms:
 *   form=careers   → application from /careers, résumé attached   → CAREERS_TO
 *   form=enquiry   → enquiry from the holding page                → ENQUIRY_TO
 *
 * ── How to deploy ────────────────────────────────────────────────────────────
 * 1. Open script.google.com and the project behind the current endpoint
 *    (the one in _assets/careers.js). Replace Code.gs with this file.
 * 2. Deploy → Manage deployments → edit the existing deployment (pencil icon)
 *    → New version → Deploy.  EDIT the existing one; a brand-new deployment
 *    gets a new URL and both forms would need updating.
 * 3. Execute as: Me.  Who has access: Anyone.
 * 4. Test from the site. Nothing else needs to change.
 *
 * Mail is sent by MailApp as the Google account running the script, so no SMTP
 * credentials, API keys or DNS records are involved.
 */

var CAREERS_TO = 'info@amamiitalia.com';
var ENQUIRY_TO = 'admin@amamiitalia.com';
var CC_ON_ENQUIRY = '';          // e.g. 'info@amamiitalia.com' — blank for none
var LOG_SHEET_ID  = '';          // optional: a Sheet id to also log rows into

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};

    // Honeypot. Bots fill it; people never see it. Answer ok so they move on.
    if (p.company_website) return json({ ok: true });

    if (p.form === 'enquiry') return handleEnquiry(p);
    return handleCareers(p);                 // default keeps older posts working
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json({ ok: true, service: 'amami-forms' });
}

/* ── enquiry ───────────────────────────────────────────────────────────────── */

function handleEnquiry(p) {
  var name = trim(p.name), email = trim(p.email), phone = trim(p.phone);
  if (!name || !email || !phone) return json({ ok: false, error: 'Missing name, email or phone.' });

  var rows = [
    ['Name',    name],
    ['Email',   email],
    ['Phone',   phone],
    ['About',   trim(p.type)],
    ['Date',    trim(p.date)],
    ['Guests',  trim(p.guests)],
    ['Message', trim(p.message)]
  ];

  MailApp.sendEmail({
    to: ENQUIRY_TO,
    cc: CC_ON_ENQUIRY || undefined,
    replyTo: email,
    subject: 'Enquiry — ' + (trim(p.type) || 'Amami Italia') + ' — ' + name,
    body: plain(rows),
    htmlBody: html('New enquiry', rows, 'Reply straight to this email and it reaches ' + name + '.')
  });

  log('enquiry', rows);
  return json({ ok: true });
}

/* ── careers ───────────────────────────────────────────────────────────────── */

function handleCareers(p) {
  var name = trim(p.name), email = trim(p.email), phone = trim(p.phone);
  if (!name || !email || !phone) return json({ ok: false, error: 'Missing name, email or phone.' });

  var rows = [
    ['Name',      name],
    ['Email',     email],
    ['Phone',     phone],
    ['Role',      trim(p.role)],
    ['Available', trim(p.availability)],
    ['Notes',     trim(p.notes) || trim(p.message)]
  ];

  var opts = {
    to: CAREERS_TO,
    replyTo: email,
    subject: 'Application — ' + (trim(p.role) || 'Front of house') + ' — ' + name,
    body: plain(rows),
    htmlBody: html('New application', rows, 'Reply straight to this email and it reaches ' + name + '.')
  };

  if (p.resumeData) {
    opts.attachments = [Utilities.newBlob(
      Utilities.base64Decode(p.resumeData),
      p.resumeType || 'application/octet-stream',
      p.resumeName || (name + ' — resume')
    )];
  }

  MailApp.sendEmail(opts);
  log('careers', rows);
  return json({ ok: true });
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

function trim(v) { return String(v == null ? '' : v).trim(); }

function plain(rows) {
  return rows.filter(function (r) { return r[1]; })
             .map(function (r) { return r[0] + ': ' + r[1]; })
             .join('\n');
}

function html(title, rows, footer) {
  var cells = rows.filter(function (r) { return r[1]; }).map(function (r) {
    return '<tr>' +
      '<td style="padding:7px 16px 7px 0;color:#6b6b6b;font-size:12px;' +
      'letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;' +
      'vertical-align:top;">' + esc(r[0]) + '</td>' +
      '<td style="padding:7px 0;color:#161616;font-size:14px;line-height:1.6;">' +
      esc(r[1]).replace(/\n/g, '<br>') + '</td></tr>';
  }).join('');

  return '<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;">' +
    '<p style="margin:0 0 4px;font-size:12px;letter-spacing:.24em;' +
    'text-transform:uppercase;color:#462e24;">Amami Italia</p>' +
    '<h2 style="margin:0 0 18px;font-size:19px;font-weight:500;color:#161616;">' +
    esc(title) + '</h2>' +
    '<table style="border-collapse:collapse;width:100%;">' + cells + '</table>' +
    '<p style="margin:20px 0 0;padding-top:14px;border-top:1px solid #e3e3e3;' +
    'font-size:12px;color:#6b6b6b;">' + esc(footer) + '</p></div>';
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function log(kind, rows) {
  if (!LOG_SHEET_ID) return;
  try {
    var sheet = SpreadsheetApp.openById(LOG_SHEET_ID).getSheets()[0];
    sheet.appendRow([new Date(), kind].concat(rows.map(function (r) { return r[1]; })));
  } catch (err) { /* logging is a nicety; never fail the send over it */ }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}
