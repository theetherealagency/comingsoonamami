/* Amami Italia — careers.
   The Role dropdown is built from the position cards, so the list of openings
   has exactly one source of truth: the markup in #positions.

   ENDPOINT is empty until the Apps Script is deployed (CAREERS-SETUP.md).
   While it is empty the form does not pretend to send — it says so and opens a
   pre-filled email, because a resume cannot ride along in a mailto. */

(function () {
  "use strict";

  var ENDPOINT = "https://script.google.com/macros/s/AKfycbzx8c22GI36anssZl5imV-w6rfRga85NT2eCyl0RQuG3f6u7kL8jLaX8r7qEBHPiwr75A/exec";
  var MAILTO   = "info@amamiitalia.com";
  var MAX_MB   = 5;

  var form   = document.getElementById("apply-form");
  var done   = document.getElementById("done");
  var btn    = document.getElementById("submit-btn");
  var errBox = document.getElementById("form-error");
  var roleSel= document.getElementById("f-role");
  var fileIn = document.getElementById("f-cv");
  var drop   = document.getElementById("drop");
  var dropLab= document.getElementById("drop-label");
  if (!form) return;

  /* ---------- roles come from the cards ---------- */
  var cards = [].slice.call(document.querySelectorAll(".pos[data-role]"));
  cards.forEach(function (card) {
    var name = card.getAttribute("data-role");
    var o = document.createElement("option");
    o.value = o.textContent = name;
    roleSel.appendChild(o);
  });
  // One opening: pick it, since there is nothing to choose between.
  if (cards.length === 1) roleSel.value = cards[0].getAttribute("data-role");

  document.querySelectorAll("[data-apply]").forEach(function (b) {
    b.addEventListener("click", function () {
      roleSel.value = b.getAttribute("data-apply");
      document.getElementById("apply").scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(function () { document.getElementById("f-name").focus({ preventScroll: true }); }, 500);
    });
  });

  /* ---------- resume drop zone ---------- */
  var DEFAULT_LABEL = dropLab.innerHTML;

  function showFile() {
    var f = fileIn.files[0];
    if (!f) { drop.classList.remove("is-set"); dropLab.innerHTML = DEFAULT_LABEL; return; }
    drop.classList.add("is-set");
    dropLab.textContent = f.name + " · " + (f.size / 1048576).toFixed(1) + " MB";
  }
  fileIn.addEventListener("change", showFile);

  ["dragenter", "dragover"].forEach(function (t) {
    drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("is-over"); });
  });
  ["dragleave", "drop"].forEach(function (t) {
    drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove("is-over"); });
  });
  drop.addEventListener("drop", function (e) {
    var f = e.dataTransfer && e.dataTransfer.files[0];
    if (!f) return;
    var dt = new DataTransfer();
    dt.items.add(f);
    fileIn.files = dt.files;
    showFile();
  });

  /* ---------- submit ---------- */
  function fail(msg, el) {
    errBox.textContent = msg;
    errBox.hidden = false;
    (el || errBox).scrollIntoView({ behavior: "smooth", block: "center" });
    if (el && el.focus) el.focus({ preventScroll: true });
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () {
        var s = String(r.result);
        resolve(s.slice(s.indexOf(",") + 1));   // strip the data: prefix
      };
      r.onerror = function () { reject(new Error("read failed")); };
      r.readAsDataURL(file);
    });
  }

  function mailFallback(fd) {
    var lines = [];
    fd.forEach(function (v, k) {
      if (!v || k === "company_website" || k === "resume") return;
      lines.push(k + ": " + v);
    });
    var f = fileIn.files[0];
    if (f) lines.push("\n(Resume: please attach " + f.name + " to this email.)");
    window.location.href = "mailto:" + MAILTO +
      "?subject=" + encodeURIComponent("Front of house application") +
      "&body=" + encodeURIComponent(lines.join("\n"));
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    errBox.hidden = true;

    var fd = new FormData(form);
    var file = fileIn.files[0];

    if (!String(fd.get("name")  || "").trim()) return fail("Your name, please.", document.getElementById("f-name"));
    if (!String(fd.get("phone") || "").trim()) return fail("A phone number — we text.", document.getElementById("f-phone"));
    if (!String(fd.get("email") || "").trim()) return fail("We need an email too.", document.getElementById("f-email"));
    if (!fd.get("role"))                       return fail("Pick a role.", roleSel);
    if (!file)                                 return fail("Please attach your résumé.", drop);
    if (file.size > MAX_MB * 1024 * 1024)      return fail("That file is over " + MAX_MB + " MB. Send a smaller one, or email it to us.", drop);
    if (!fd.get("consent"))                    return fail("Please tick the box so we can contact you.");

    if (!ENDPOINT) { mailFallback(fd); return; }

    btn.disabled = true;
    btn.textContent = "Sending…";

    readFile(file)
      .then(function (b64) {
        var body = new URLSearchParams();
        fd.forEach(function (v, k) { if (k !== "resume") body.append(k, v); });
        body.append("form", "careers");
        body.append("resumeName", file.name);
        body.append("resumeType", file.type || "application/octet-stream");
        body.append("resumeData", b64);
        return fetch(ENDPOINT, { method: "POST", body: body });
      })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) {
          form.hidden = true;
          done.hidden = false;
          done.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          fail((d && d.error) || "That did not send. Try again, or email us.");
        }
      })
      .catch(function () { fail("That did not send. Try again, or email " + MAILTO + "."); })
      .then(function () { btn.disabled = false; btn.textContent = "Send it in"; });
  });
})();
