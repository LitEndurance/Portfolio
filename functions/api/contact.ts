/**
 * Cloudflare Pages Function: POST /api/contact
 *
 * Receives the contact forms on /websites and /infrastructure and emails
 * them through the Resend HTTP API. The site itself is a static Next.js export (next.config.ts:
 * output "export"), so this lives in Cloudflare Pages' /functions directory
 * rather than in the Next app. See CONTACT_SETUP.md for configuration.
 *
 * Environment variables (Cloudflare Pages > Settings > Variables and Secrets):
 *   RESEND_API_KEY  required, secret
 *   CONTACT_TO      optional, comma-separated, default willbarnh@gmail.com
 *   CONTACT_FROM    optional, default "Website Contact <contact@litendurance.dev>"
 *
 * Accepts JSON or form-encoded bodies with: source ("websites" or
 * "infrastructure"; defaults to "websites"), name, email, business (required
 * for websites, optional otherwise), website (optional), message, and the
 * honeypot field `nickname` (must stay empty).
 * Responds with JSON: { ok: true } or { ok: false, error, fields? }.
 */

interface Env {
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

// Minimal shape of the Pages Function context used here (avoids a
// dependency on @cloudflare/workers-types).
interface Context {
  request: Request;
  env: Env;
}

const DEFAULT_TO = "willbarnh@gmail.com";
const DEFAULT_FROM = "Website Contact <contact@litendurance.dev>";
const RESEND_URL = "https://api.resend.com/emails";
const MAX_BODY_BYTES = 20_000;
export const HONEYPOT_FIELD = "nickname";

const LIMITS = {
  name: 100,
  email: 254,
  business: 150,
  website: 200,
  message: 5000,
} as const;

type Field = keyof typeof LIMITS | "source";

/** Which page's form sent the message. Decides the required fields and the
 *  email subject. */
export const SOURCES = {
  websites: { label: "website", page: "/websites", requireBusiness: true },
  infrastructure: { label: "infrastructure", page: "/infrastructure", requireBusiness: false },
} as const;

export type ContactSource = keyof typeof SOURCES;

const isSource = (v: string): v is ContactSource => Object.prototype.hasOwnProperty.call(SOURCES, v);

export interface ContactInput {
  source: ContactSource;
  name: string;
  email: string;
  business: string;
  website: string;
  message: string;
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Collapse whitespace and strip control characters (keeps newlines only where allowed). */
function clean(value: unknown, multiline = false): string {
  if (typeof value !== "string") return "";
  const noControl = multiline
    ? value.replace(/\r\n?/g, "\n").replace(/[^\S\n]+/g, " ").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    : value.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ");
  return noControl.trim();
}

export function validate(raw: Record<string, unknown>): {
  data?: ContactInput;
  fields?: Partial<Record<Field, string>>;
} {
  const rawSource = clean(raw.source) || "websites";
  const source: ContactSource = isSource(rawSource) ? rawSource : "websites";
  const data: ContactInput = {
    source,
    name: clean(raw.name),
    email: clean(raw.email),
    business: clean(raw.business),
    website: clean(raw.website),
    message: clean(raw.message, true),
  };
  const fields: Partial<Record<Field, string>> = {};

  if (!isSource(rawSource)) fields.source = "Unknown form.";

  if (!data.name) fields.name = "Please add your name.";
  if (!data.email) fields.email = "Please add your email address.";
  else if (!EMAIL_RE.test(data.email)) fields.email = "That email address doesn't look right.";
  if (!data.business && SOURCES[source].requireBusiness) fields.business = "Please add your business name.";
  if (data.website) {
    const candidate = /^https?:\/\//i.test(data.website) ? data.website : `https://${data.website}`;
    try {
      const url = new URL(candidate);
      if (!url.hostname.includes(".")) throw new Error("no dot");
      data.website = candidate;
    } catch {
      fields.website = "That website address doesn't look right.";
    }
  }
  if (!data.message) fields.message = "Please tell me a little about what you need.";

  for (const key of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
    if (!fields[key] && data[key].length > LIMITS[key]) {
      fields[key] = `Please keep this under ${LIMITS[key]} characters.`;
    }
  }

  return Object.keys(fields).length ? { fields } : { data };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildEmail(d: ContactInput) {
  const { label, page, requireBusiness } = SOURCES[d.source];
  const subject = `New ${label} inquiry from ${d.name}`.slice(0, 200);
  // The websites form always asks for business and website, so show both
  // (website as "(none)" when blank); other forms only list what was given.
  const rows: [string, string][] = [
    ["Name", d.name],
    ["Email", d.email],
    ...(requireBusiness || d.business ? [["Business", d.business] as [string, string]] : []),
    ...(requireBusiness || d.website ? [["Website", d.website || "(none)"] as [string, string]] : []),
    ["Form", page],
  ];
  const text = [...rows.map(([k, v]) => `${k}: ${v}`), "", d.message, "", `— Sent from the ${page} contact form`].join("\n");
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.5;color:#111">
<h2 style="margin:0 0 12px;font-size:18px">New ${label} inquiry</h2>
<table style="border-collapse:collapse;margin-bottom:16px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:2px 12px 2px 0;color:#555;vertical-align:top">${k}</td><td style="padding:2px 0">${escapeHtml(v)}</td></tr>`
    )
    .join("")}</table>
<div style="white-space:pre-wrap;border-left:3px solid #4ecdc4;padding-left:12px">${escapeHtml(d.message)}</div>
<p style="margin-top:20px;color:#888;font-size:12px">Sent from the ${page} contact form. Reply to this email to answer ${escapeHtml(d.name)} directly.</p>
</div>`;
  return { subject, text, html };
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const type = request.headers.get("Content-Type") || "";
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return null;
  if (type.includes("application/json")) {
    try {
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  if (type.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  return null;
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  // Only accept submissions from this site's own pages (browsers always send
  // Origin on cross-site POSTs; same-origin requests match the host).
  const origin = request.headers.get("Origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return json({ ok: false, error: "Not allowed." }, 403);
      }
    } catch {
      return json({ ok: false, error: "Not allowed." }, 403);
    }
  }

  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > MAX_BODY_BYTES) {
    return json({ ok: false, error: "That message is too long." }, 413);
  }

  const body = await readBody(request);
  if (!body) {
    return json({ ok: false, error: "Couldn't read the form. Please try again." }, 400);
  }

  // Honeypot: real visitors never see or fill this field. Pretend success so
  // bots don't learn anything, but send nothing.
  if (clean(body[HONEYPOT_FIELD])) {
    return json({ ok: true });
  }

  const { data, fields } = validate(body);
  if (!data) {
    return json({ ok: false, error: "Please check the highlighted fields.", fields }, 400);
  }

  if (!env.RESEND_API_KEY) {
    console.error("contact: RESEND_API_KEY is not set");
    return json({ ok: false, error: "The contact form isn't set up yet." }, 500);
  }

  const to = (env.CONTACT_TO || DEFAULT_TO)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const { subject, text, html } = buildEmail(data);

  let res: Response;
  try {
    res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM || DEFAULT_FROM,
        to,
        reply_to: data.email,
        subject,
        text,
        html,
      }),
    });
  } catch (err) {
    console.error("contact: Resend request failed", err);
    return json({ ok: false, error: "The message couldn't be sent right now." }, 502);
  }

  if (!res.ok) {
    console.error("contact: Resend responded", res.status, await res.text().catch(() => ""));
    return json({ ok: false, error: "The message couldn't be sent right now." }, 502);
  }

  return json({ ok: true });
}

// Anything other than POST (and the CORS-free same-origin form) is refused.
export async function onRequest(): Promise<Response> {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
