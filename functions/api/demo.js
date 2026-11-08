const FALLBACK_TO = "hello@medullahr.com";
const FALLBACK_FROM = "MedullaHR Website <demo@medullahr.com>";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ALLOWED_ORIGINS = [
  "https://medullahr.com",
  "https://www.medullahr.com"
];

// The real form sends well under 3 KB once the notes field is capped,
// and a Turnstile token tops out around 2 KB on top of that.
const MAX_BODY_BYTES = 8192;

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function passesHumanCheck(secret, token, ip) {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) {
    form.append("remoteip", ip);
  }

  let verdict;
  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: form
    });
    if (!response.ok) {
      return false;
    }
    verdict = await response.json();
  } catch (err) {
    return false;
  }

  return !!verdict && verdict.success === true;
}

const FONT = "'Helvetica Neue', Arial, sans-serif";
const PAGE = "#F6FAF7";
const CARD = "#E4F1EA";
const BORDER = "#CFE3D8";
const ACCENT = "#2F6652";
const DARK = "#245143";
const TEXT = "#1B2B24";
const MUTED = "#5C7468";

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

// The tick boxes send the official module name, which is what the product
// is organised by, while the form shows visitors plainer wording. The
// notification carries both, so the team reads the visitor's words and
// still knows which module is meant.
const TASK_WORDING = {
  "Org Chart": "Company Structure & Org Chart",
  "Hiring and Recruitment": "Recruitment & Hiring",
  "Employee Onboarding": "Onboarding New Employees",
  "Attendance and Leave": "Attendance & Leave Management",
  "Payroll and Benefits": "Payroll & Benefits",
  "Learning and Development": "Learning & Development",
  "Performance and Feedback": "Performance Management & Feedback",
  "Employee Engagement": "Employee Engagement",
  "HR Budgets and Expenses": "HR Budgets & Expenses",
  "HR Admin and Documents": "HR Files & Documents",
  "HR Compliance Reminders": "Visa, Emirates ID & Contract Renewal Tracking",
  "Employee Relations": "Employee Relations: complaints, warnings & disputes",
  Offboarding: "Resignations, Exits & End-of-Service"
};

// "Plain wording (Official module)", or the value on its own if it is not
// one we know, which is what a cached copy of an older form may send.
function describeTask(value) {
  const wording = Object.prototype.hasOwnProperty.call(TASK_WORDING, value)
    ? TASK_WORDING[value]
    : "";
  if (!wording || wording === value) {
    return value;
  }
  return wording + " (" + value + ")";
}

const MAX_TASKS = 20;
const MAX_TASK_LENGTH = 80;
const MAX_OTHER_LENGTH = 500;

// Digits expected after the dialling code, with no trunk zero. This has
// to agree with the table in the page script.
const MOBILE_RULES = {
  "+971": { digits: 9, startsWith: "5" },
  "+966": { digits: 9 },
  "+968": { digits: 8 },
  "+973": { digits: 8 },
  "+974": { digits: 8 },
  "+965": { digits: 8 },
  "+20": { digits: 10 },
  "+91": { digits: 10 },
  "+92": { digits: 10 },
  "+63": { digits: 10 },
  "+234": { digits: 10 },
  "+44": { digits: 10 },
  "+1": { digits: 10 }
};

// The page strips these already; doing it again means a request built by
// hand is held to the same shape.
function cleanDigits(value, max) {
  let digits = clean(value, max).replace(/\D+/g, "");
  while (digits.charAt(0) === "0") {
    digits = digits.slice(1);
  }
  return digits;
}

function mobileIsValid(code, digits) {
  const rule = MOBILE_RULES[code];
  if (!rule) {
    return false;
  }
  if (digits.length !== rule.digits) {
    return false;
  }
  if (rule.startsWith && digits.charAt(0) !== rule.startsWith) {
    return false;
  }
  return true;
}

// Readable grouping for the email: 52 198 6968 rather than 521986968.
function formatMobile(code, digits) {
  let groups;
  if (digits.length === 9) {
    groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5)];
  } else if (digits.length === 10) {
    groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)];
  } else if (digits.length === 8) {
    groups = [digits.slice(0, 4), digits.slice(4)];
  } else {
    groups = [digits];
  }
  return code + " " + groups.join(" ");
}

// Anything that is not a list of short, non-empty strings is discarded
// rather than argued with: the form only ever sends tick box labels.
function cleanTasks(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = [];
  for (let i = 0; i < value.length && seen.length < MAX_TASKS; i++) {
    const task = clean(value[i], MAX_TASK_LENGTH);
    if (task && seen.indexOf(task) === -1) {
      seen.push(task);
    }
  }
  return seen;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(lead) {
  const fullName = escapeHtml(lead.name);
  const firstName = escapeHtml(lead.name.split(/\s+/)[0] || lead.name);
  const email = escapeHtml(lead.email);

  const detailPairs = [
    ["Name", lead.name],
    ["Work email", lead.email],
    ["Mobile number", lead.mobile],
    ["Company", lead.company],
    ["Team size", lead.size]
  ].filter(function (pair) {
    return pair[1];
  });

  const detailRows = detailPairs
    .map(function (pair, index) {
      const divider = index === 0 ? "" : "border-top:1px solid " + BORDER + ";";
      return (
        "<tr>" +
        '<td style="' +
        divider +
        "padding:11px 0;font-family:" +
        FONT +
        ";font-size:13px;line-height:20px;color:" +
        MUTED +
        ';width:38%;vertical-align:top">' +
        escapeHtml(pair[0]) +
        "</td>" +
        '<td style="' +
        divider +
        "padding:11px 0;font-family:" +
        FONT +
        ";font-size:14px;line-height:20px;color:" +
        TEXT +
        ';font-weight:bold;vertical-align:top">' +
        escapeHtml(pair[1]) +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  const sizeBox = lead.size
    ? '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 22px 0">' +
      "<tr>" +
      '<td style="background-color:' +
      PAGE +
      ";border:1px solid " +
      BORDER +
      ';border-radius:8px;padding:18px 20px">' +
      '<p style="margin:0 0 4px 0;font-family:' +
      FONT +
      ";font-size:12px;line-height:16px;letter-spacing:0.6px;text-transform:uppercase;color:" +
      MUTED +
      '">Team size</p>' +
      '<p style="margin:0;font-family:' +
      FONT +
      ";font-size:24px;line-height:30px;font-weight:bold;color:" +
      DARK +
      '">' +
      escapeHtml(lead.size) +
      "</p>" +
      "</td>" +
      "</tr>" +
      "</table>"
    : "";

  const bulletRows = lead.tasks
    .map(function (task) {
      return (
        "<tr>" +
        '<td valign="top" style="padding:3px 8px 3px 0;font-family:' +
        FONT +
        ";font-size:14px;line-height:22px;color:" +
        ACCENT +
        ';width:14px">&bull;</td>' +
        '<td valign="top" style="padding:3px 0;font-family:' +
        FONT +
        ";font-size:14px;line-height:22px;color:" +
        TEXT +
        '">' +
        escapeHtml(describeTask(task)) +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  const otherRow = lead.other
    ? "<tr>" +
      '<td valign="top" style="padding:3px 8px 3px 0;font-family:' +
      FONT +
      ";font-size:14px;line-height:22px;color:" +
      ACCENT +
      ';width:14px">&bull;</td>' +
      '<td valign="top" style="padding:3px 0;font-family:' +
      FONT +
      ";font-size:14px;line-height:22px;color:" +
      TEXT +
      '"><strong style="color:' +
      DARK +
      '">Something else:</strong> ' +
      escapeHtml(lead.other) +
      "</td>" +
      "</tr>"
    : "";

  const tasksBox =
    bulletRows || otherRow
      ? '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:22px 0 0 0">' +
        "<tr>" +
        '<td style="background-color:' +
        PAGE +
        ";border:1px solid " +
        BORDER +
        ';border-radius:8px;padding:18px 20px">' +
        '<p style="margin:0 0 10px 0;font-family:' +
        FONT +
        ";font-size:12px;line-height:16px;letter-spacing:0.6px;text-transform:uppercase;color:" +
        MUTED +
        '">Looking to simplify</p>' +
        '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">' +
        bulletRows +
        otherRow +
        "</table>" +
        "</td>" +
        "</tr>" +
        "</table>"
      : "";

  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    "<title>New demo request</title></head>" +
    '<body style="margin:0;padding:0;background-color:' +
    PAGE +
    '">' +
    '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:' +
    PAGE +
    '">' +
    "<tr>" +
    '<td align="center" style="padding:28px 12px">' +
    '<table cellpadding="0" cellspacing="0" border="0" width="560" style="border-collapse:collapse;width:560px;max-width:100%">' +

    "<tr>" +
    '<td style="padding:0 0 14px 0;font-family:' +
    FONT +
    ";font-size:15px;line-height:22px;color:" +
    TEXT +
    '">Hi team,</td>' +
    "</tr>" +

    "<tr>" +
    '<td style="background-color:' +
    CARD +
    ";border:1px solid " +
    BORDER +
    ';border-radius:12px;padding:28px 28px 30px 28px">' +

    '<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 16px 0">' +
    "<tr>" +
    '<td style="background-color:' +
    ACCENT +
    ";border-radius:999px;padding:6px 14px;font-family:" +
    FONT +
    ';font-size:12px;line-height:16px;font-weight:bold;letter-spacing:0.4px;color:#FFFFFF">New demo request</td>' +
    "</tr>" +
    "</table>" +

    '<h1 style="margin:0 0 10px 0;font-family:' +
    FONT +
    ";font-size:26px;line-height:32px;font-weight:bold;color:" +
    DARK +
    '">' +
    firstName +
    " wants to see MedullaHR</h1>" +

    '<p style="margin:0 0 6px 0;font-family:' +
    FONT +
    ";font-size:15px;line-height:23px;color:" +
    TEXT +
    '">' +
    fullName +
    " filled in the demo form on your website.</p>" +

    '<p style="margin:0 0 24px 0;font-family:' +
    FONT +
    ";font-size:15px;line-height:23px;font-weight:bold;color:" +
    DARK +
    '">Reply while the interest is fresh.</p>' +

    sizeBox +

    '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">' +
    detailRows +
    "</table>" +

    tasksBox +

    '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:26px 0 0 0">' +
    "<tr>" +
    '<td align="center" style="background-color:' +
    ACCENT +
    ';border-radius:8px">' +
    '<a href="mailto:' +
    email +
    '" style="display:block;padding:14px 20px;font-family:' +
    FONT +
    ';font-size:15px;line-height:20px;font-weight:bold;color:#FFFFFF;text-decoration:none">Reply to ' +
    firstName +
    "</a>" +
    "</td>" +
    "</tr>" +
    "</table>" +

    '<p style="margin:16px 0 0 0;font-family:' +
    FONT +
    ";font-size:12px;line-height:18px;color:" +
    MUTED +
    '">Sent from the demo form on medullahr.com. Replying to this email goes straight to ' +
    firstName +
    ".</p>" +

    "</td>" +
    "</tr>" +

    "<tr>" +
    '<td align="center" style="padding:24px 8px 6px 8px;font-family:' +
    FONT +
    ";font-size:13px;line-height:20px;color:" +
    MUTED +
    '"><strong style="color:' +
    DARK +
    '">MedullaHR</strong> / The brain that keeps HR running smoothly.</td>' +
    "</tr>" +

    "<tr>" +
    '<td align="left" style="padding:6px 8px 0 8px;font-family:' +
    FONT +
    ";font-size:12px;line-height:18px;color:" +
    MUTED +
    '">You received this because someone submitted the demo form on medullahr.com. It is an internal notification and was not sent to the visitor.</td>' +
    "</tr>" +

    "</table>" +
    "</td>" +
    "</tr>" +
    "</table>" +
    "</body></html>"
  );
}

export async function onRequestPost(context) {
  const env = context.env;
  const request = context.request;

  const origin = request.headers.get("origin");
  if (!origin || ALLOWED_ORIGINS.indexOf(origin) === -1) {
    return json({ ok: false, reason: "forbidden_origin" }, 403);
  }

  const mediaType = (request.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (mediaType !== "application/json") {
    return json({ ok: false, reason: "unsupported_media_type" }, 415);
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ ok: false, reason: "payload_too_large" }, 413);
  }

  if (!env.RESEND_API_KEY) {
    return json({ ok: false, reason: "not_configured" }, 503);
  }

  let raw;
  try {
    raw = await request.text();
  } catch (err) {
    return json({ ok: false, reason: "bad_request" }, 400);
  }

  // A chunked request can arrive without a usable Content-Length, so the
  // body is measured again once it is actually here.
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return json({ ok: false, reason: "payload_too_large" }, 413);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    return json({ ok: false, reason: "bad_request" }, 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return json({ ok: false, reason: "bad_request" }, 400);
  }

  // Nobody can see or tab to this field, so a value in it means a script
  // filled the form in. Answer as though it worked and send nothing. The
  // old field name is still watched for visitors running a cached script.
  if (
    clean(payload.contact_preference_note, 200) ||
    clean(payload.company_website, 200)
  ) {
    return json({ ok: true }, 200);
  }

  const name = clean(payload.name, 120);
  const email = clean(payload.email, 160);
  const dial = clean(payload.dial, 8);
  const mobileDigits = cleanDigits(payload.mobile, 32);
  const company = clean(payload.company, 160);
  const size = clean(payload.size, 60);
  const tasks = cleanTasks(payload.tasks);
  const other = clean(payload.other, MAX_OTHER_LENGTH);
  // A cached copy of the old form still sends one free text field.
  const legacyNotes = clean(payload.notes, MAX_OTHER_LENGTH);

  if (!name || !EMAIL_PATTERN.test(email)) {
    return json({ ok: false, reason: "invalid" }, 422);
  }

  if (!mobileIsValid(dial, mobileDigits)) {
    return json({ ok: false, reason: "invalid" }, 422);
  }

  const mobile = formatMobile(dial, mobileDigits);

  // Nothing is sent until Cloudflare agrees there is a person behind this.
  if (!env.TURNSTILE_SECRET_KEY) {
    return json({ ok: false, reason: "not_configured" }, 503);
  }

  const turnstileToken = clean(payload.turnstileToken, 2048);
  if (!turnstileToken) {
    return json({ ok: false, reason: "human_check_failed" }, 403);
  }

  const verified = await passesHumanCheck(
    env.TURNSTILE_SECRET_KEY,
    turnstileToken,
    request.headers.get("cf-connecting-ip") || ""
  );
  if (!verified) {
    return json({ ok: false, reason: "human_check_failed" }, 403);
  }

  const lead = {
    name: name,
    email: email,
    mobile: mobile,
    company: company,
    size: size,
    tasks: tasks,
    other: other || legacyNotes
  };

  const fields = [
    ["Name", name],
    ["Work email", email],
    ["Mobile number", mobile],
    ["Company", company],
    ["Team size", size]
  ].filter(function (pair) {
    return pair[1];
  });

  const bulletLines = lead.tasks.map(function (task) {
    return "- " + describeTask(task);
  });
  if (lead.other) {
    bulletLines.push("- Something else: " + lead.other);
  }

  const text =
    fields
      .map(function (pair) {
        return pair[0] + ": " + pair[1];
      })
      .join("\n") +
    (bulletLines.length
      ? "\n\nLooking to simplify:\n" + bulletLines.join("\n")
      : "");

  const subject =
    "📩 New demo request from " +
    name +
    (company ? " (" + company + ")" : "") +
    " | MedullaHR";

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
        subject: subject,
        text: text,
        html: buildHtml(lead)
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
