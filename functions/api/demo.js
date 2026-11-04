const FALLBACK_TO = "hello@medullahr.com";
const FALLBACK_FROM = "MedullaHR Website <demo@medullahr.com>";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function clean(value, max) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function onRequestPost(context) {
  const env = context.env;

  if (!env.RESEND_API_KEY) {
    return json({ ok: false, reason: "not_configured" }, 503);
  }

  let payload;
  try {
    payload = await context.request.json();
  } catch (err) {
    return json({ ok: false, reason: "bad_request" }, 400);
  }

  const name = clean(payload.name, 120);
  const email = clean(payload.email, 160);
  const company = clean(payload.company, 160);
  const size = clean(payload.size, 60);
  const notes = clean(payload.notes, 2000);

  if (!name || !EMAIL_PATTERN.test(email)) {
    return json({ ok: false, reason: "invalid" }, 422);
  }

  const fields = [
    ["Name", name],
    ["Work email", email],
    ["Company", company],
    ["Team size", size]
  ].filter(function (pair) {
    return pair[1];
  });

  const text =
    fields
      .map(function (pair) {
        return pair[0] + ": " + pair[1];
      })
      .join("\n") + (notes ? "\n\nLooking to simplify:\n" + notes : "");

  const html =
    '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#111">' +
    "<h2 style=\"margin:0 0 16px\">New demo request</h2>" +
    '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">' +
    fields
      .map(function (pair) {
        return (
          '<tr><td style="padding:4px 16px 4px 0;color:#555">' +
          escapeHtml(pair[0]) +
          '</td><td style="padding:4px 0"><strong>' +
          escapeHtml(pair[1]) +
          "</strong></td></tr>"
        );
      })
      .join("") +
    "</table>" +
    (notes
      ? '<p style="margin:16px 0 0"><strong>Looking to simplify</strong><br>' +
        escapeHtml(notes).replace(/\n/g, "<br>") +
        "</p>"
      : "") +
    "</div>";

  let response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: "Bearer " + env.RESEND_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: env.DEMO_FROM || FALLBACK_FROM,
        to: [env.DEMO_TO || FALLBACK_TO],
        reply_to: email,
        subject: "Demo request — " + name + (company ? " (" + company + ")" : ""),
        text: text,
        html: html
      })
    });
  } catch (err) {
    return json({ ok: false, reason: "send_failed" }, 502);
  }

  if (!response.ok) {
    return json({ ok: false, reason: "send_failed" }, 502);
  }

  return json({ ok: true }, 200);
}

export function onRequest() {
  return json({ ok: false, reason: "method_not_allowed" }, 405);
}
