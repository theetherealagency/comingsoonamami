/* Amami Italia — enquiry form.

   The panel is open in the markup and closed here, so a visitor without JS
   still gets a working form (it posts natively to the same endpoint, which
   redirects back with ?enquiry=sent).

   Submissions go to /api/enquire, which mails info@amamiitalia.com via Resend.
   If the endpoint is unreachable we fall back to a pre-filled email rather
   than swallowing the enquiry. */

(function () {
  "use strict";

  var MAILTO = "info@amamiitalia.com";

  var panel  = document.getElementById("enquire");
  var toggle = document.getElementById("enquire-toggle");
  var form   = document.getElementById("enquire-form");
  var btn    = document.getElementById("enquire-submit");
  var errBox = document.getElementById("enquire-error");
  var done   = document.getElementById("enquire-done");
  if (!panel || !toggle || !form) return;

  var ENDPOINT = form.getAttribute("action");

  /* ---------- open / close ---------- */
  panel.hidden = true;

  function open() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setTimeout(function () {
      document.getElementById("e-name").focus({ preventScroll: true });
    }, 320);
  }

  function close() {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener("click", function (ev) {
    ev.preventDefault();
    if (panel.hidden) { open(); } else { close(); }
  });

  // Escape closes it, unless the enquiry has already been sent.
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && !panel.hidden && done.hidden) close();
  });

  // A link straight to #enquire (shared, bookmarked) should land open.
  if (window.location.hash === "#enquire") open();

  // Coming back from a no-JS post, the endpoint redirects with ?enquiry=sent.
  if (/[?&]enquiry=sent(&|$)/.test(window.location.search)) {
    open();
    form.hidden = true;
    done.hidden = false;
  }

  /* ---------- submit ---------- */
  function fail(msg, el) {
    errBox.textContent = msg;
    errBox.hidden = false;
    (el || errBox).scrollIntoView({ behavior: "smooth", block: "center" });
    if (el && el.focus) el.focus({ preventScroll: true });
  }

  function mailFallback(fd) {
    var lines = [];
    fd.forEach(function (v, k) {
      if (!v || k === "company_website") return;
      lines.push(k + ": " + v);
    });
    window.location.href = "mailto:" + MAILTO +
      "?subject=" + encodeURIComponent("Enquiry — Amami Italia") +
      "&body=" + encodeURIComponent(lines.join("\n"));
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    errBox.hidden = true;

    var fd = new FormData(form);
    var val = function (k) { return String(fd.get(k) || "").trim(); };

    if (!val("name"))                 return fail("Your name, please.", document.getElementById("e-name"));
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val("email")))
                                      return fail("That email does not look right — we need it to reply.", document.getElementById("e-email"));
    if (val("phone").replace(/\D/g, "").length < 7)
                                      return fail("A phone number we can reach you on.", document.getElementById("e-phone"));
    if (!val("type"))                 return fail("Let us know what this is about.", document.getElementById("e-type"));
    if (val("message").length < 10)   return fail("A line or two more, so we can help properly.", document.getElementById("e-message"));

    btn.disabled = true;
    btn.textContent = "Sending…";

    var body = new URLSearchParams();
    fd.forEach(function (v, k) { body.append(k, v); });

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "X-Requested-With": "fetch" },   // ask for JSON, not the redirect
      body: body
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) {
          form.hidden = true;
          done.hidden = false;
          done.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          fail((d && d.error) || "That did not send. Try again, or email " + MAILTO + ".");
        }
      })
      .catch(function () {
        fail("That did not send — opening an email instead.");
        setTimeout(function () { mailFallback(fd); }, 900);
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = "Send enquiry";
      });
  });
})();
