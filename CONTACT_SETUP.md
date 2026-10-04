# Contact form setup (Cloudflare Pages + Resend)

Both contact forms, the `/websites` form and the summit form at the top of
the `/infrastructure` climb, post to `/api/contact`, a Cloudflare Pages
Function in `functions/api/contact.ts`. They share the client logic in
`src/hooks/useContactForm.ts` and send a `source` field (`"websites"` or
`"infrastructure"`; missing means `"websites"`). Business name is required
only for websites inquiries, and the subject reads "New website inquiry from
{name}" or "New infrastructure inquiry from {name}"; the body names the form
it came from. The site itself is a static export
(`output: "export"` in `next.config.ts`, published from `build/`), so the
endpoint lives in Pages' `functions/` directory, not in the Next.js app.
The function validates the fields, drops submissions that fill the hidden
honeypot field, and sends the message through the [Resend](https://resend.com)
HTTP API with `reply_to` set to the visitor's email, so you can just hit
Reply. If sending fails, the form shows an error with a pre-filled
`mailto:` link as a fallback.

No secrets are stored in the repo.

## 1. Verify the sending domain in Resend

1. Sign in at resend.com → **Domains** → **Add domain** → `litendurance.dev`
   (or a subdomain such as `mail.litendurance.dev`).
2. Add the DNS records Resend shows (SPF/MX on a `send` subdomain and the DKIM
   `TXT` record) in Cloudflare → your domain → **DNS**. Set them to
   **DNS only** (grey cloud).
3. Wait for Resend to show the domain as **Verified** (usually minutes).
4. Resend → **API Keys** → **Create API key** with **Sending access**
   (optionally restricted to this domain). Copy it; it starts with `re_`.

Until the domain is verified, Resend only delivers mail from its test address
`onboarding@resend.dev` to your own Resend account email. To try it before
DNS is ready, set `CONTACT_FROM=Website Contact <onboarding@resend.dev>`.

## 2. Set the environment variables in Cloudflare Pages

Cloudflare dashboard → **Workers & Pages** → your Pages project →
**Settings** → **Variables and Secrets** → **Add** (do this for
**Production**, and for **Preview** too if you want previews to send):

| Name             | Type   | Value                                                   |
|------------------|--------|---------------------------------------------------------|
| `RESEND_API_KEY` | Secret | your `re_...` key (required)                            |
| `CONTACT_TO`     | Text   | `willbarnh@gmail.com` (default; comma-separate for more) |
| `CONTACT_FROM`   | Text   | `Website Contact <contact@litendurance.dev>` (default)  |

`CONTACT_TO` and `CONTACT_FROM` are optional; the defaults above apply when
they are unset. The `CONTACT_FROM` address must be on the verified domain.

Then **redeploy** (Deployments → latest → **Retry deployment**, or push a
commit). Variables only apply to deployments made after they are saved.

Build settings stay as they are: build command `npm run build`, output
directory `build`, with the repository root (the folder containing
`functions/`) as the project root, so Pages picks up `functions/`
automatically.

## 3. Test it

**Offline (no network, no key):** `npm run test:contact` runs the function
against stubbed `fetch` and checks validation, the honeypot, the Resend
request (`to`, `from`, `reply_to`, subject), and error handling.

**Locally, end to end** (needs Node 22+ for current Wrangler):

```bash
npm run build
cp .dev.vars.example .dev.vars       # then put your real RESEND_API_KEY in it
npx wrangler pages dev build         # serves build/ + functions/ on :8788
```

Open http://localhost:8788/websites or http://localhost:8788/infrastructure
(scroll to the summit), fill in the form and send. Or:

```bash
curl -i -X POST http://localhost:8788/api/contact \
  -H "Content-Type: application/json" -H "Origin: http://localhost:8788" \
  -d '{"name":"Test","email":"you@example.com","business":"Test Co","message":"Hello"}'

curl -i -X POST http://localhost:8788/api/contact \
  -H "Content-Type: application/json" -H "Origin: http://localhost:8788" \
  -d '{"source":"infrastructure","name":"Test","email":"you@example.com","message":"Hello"}'
```

`{"ok":true}` means Resend accepted it. With a placeholder key you get a
502 and Wrangler logs `Resend responded 401`, which still confirms the
function runs. `.dev.vars` is git-ignored; never commit it.

`npm run dev` (Next dev server) does not run Pages Functions, so the form
shows its error state with the mailto fallback there.

**In production:** submit the form on the live site, check the inbox, and
check Cloudflare → Pages project → **Functions** → real-time logs if it
fails (`contact:` log lines show missing keys or Resend errors).

## Notes

- Spam protection is a honeypot plus a same-origin check. If spam gets
  through, add Cloudflare Turnstile or a rate-limiting rule on `/api/contact`.
- The page's Content-Security-Policy already allows same-origin `fetch`
  (`connect-src 'self'`), so no CSP change is needed.
