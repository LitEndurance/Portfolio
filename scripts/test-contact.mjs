#!/usr/bin/env node
/**
 * Offline test for the contact form endpoint (functions/api/contact.ts).
 *
 * Transpiles the Pages Function with the project's TypeScript, then calls its
 * handlers with real Request objects while `fetch` is stubbed, so nothing is
 * sent to Resend. Run: npm run test:contact
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "functions/api/contact.ts"), "utf8");
const { outputText } = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const dir = mkdtempSync(join(tmpdir(), "contact-test-"));
const file = join(dir, "contact.mjs");
writeFileSync(file, outputText);
const fn = await import(pathToFileURL(file).href);

let failures = 0;
const check = (label, cond, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? `  (${extra})` : ""}`);
  if (!cond) failures++;
};

const calls = [];
let resendStatus = 200;
globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), init, body: JSON.parse(init.body) });
  return new Response(JSON.stringify(resendStatus === 200 ? { id: "test" } : { message: "nope" }), { status: resendStatus });
};
const quiet = console.error;
console.error = () => {};

const ORIGIN = "https://litendurance.dev";
const req = (body, { type = "application/json", origin = ORIGIN, method = "POST" } = {}) =>
  new Request(`${ORIGIN}/api/contact`, {
    method,
    headers: { "Content-Type": type, ...(origin ? { Origin: origin } : {}) },
    body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
const env = { RESEND_API_KEY: "re_test_key" };
const good = {
  name: "Jane Doe",
  email: "jane@example.com",
  business: "Jane's Stoves",
  website: "janesstoves.com",
  message: "Our site is slow.\nCan you help? <b>thanks</b>",
  nickname: "",
};
const call = async (request, e = env) => {
  const res = await fn.onRequestPost({ request, env: e });
  return { status: res.status, data: await res.json().catch(() => null) };
};

// 1. Happy path
let r = await call(req(good));
const sent = calls.at(-1);
check("valid submission returns 200 ok", r.status === 200 && r.data.ok === true, `status ${r.status}`);
check("posts to the Resend API", sent?.url === "https://api.resend.com/emails");
check("uses the API key as a bearer token", sent?.init.headers.Authorization === "Bearer re_test_key");
check("default to/from", JSON.stringify(sent?.body.to) === '["willbarnh@gmail.com"]' && sent?.body.from === "Website Contact <contact@litendurance.dev>");
check("reply_to is the visitor", sent?.body.reply_to === "jane@example.com");
check("subject names the visitor", sent?.body.subject === "New website inquiry from Jane Doe");
check("website gets a scheme", sent?.body.text.includes("Website: https://janesstoves.com"));
check("html escapes the message", sent?.body.html.includes("&lt;b&gt;thanks&lt;/b&gt;") && !sent?.body.html.includes("<b>thanks"));

// 2. Env overrides
r = await call(req(good), { ...env, CONTACT_TO: "a@x.com, b@y.com", CONTACT_FROM: "Me <me@x.com>" });
check("CONTACT_TO list and CONTACT_FROM override", JSON.stringify(calls.at(-1).body.to) === '["a@x.com","b@y.com"]' && calls.at(-1).body.from === "Me <me@x.com>");

// 3. Validation
const n = calls.length;
r = await call(req({ ...good, name: " ", email: "nope", business: "", message: "" }));
check("invalid fields return 400 with per-field errors", r.status === 400 && ["name", "email", "business", "message"].every((k) => r.data.fields?.[k]), JSON.stringify(r.data?.fields));
r = await call(req({ ...good, website: "not a url" }));
check("bad website is rejected", r.status === 400 && !!r.data.fields?.website);
r = await call(req({ ...good, message: "x".repeat(5001) }));
check("over-long message is rejected", r.status === 400 && !!r.data.fields?.message);
r = await call(req({ ...good, name: "Eve\r\nBcc: x@y.com" }));
check("newlines are stripped from the name (no header injection)", calls.at(-1).body.subject === "New website inquiry from Eve Bcc: x@y.com");
const afterInjection = calls.length;
check("nothing sent for invalid submissions", afterInjection === n + 1);

// 3b. Source: websites (explicit) vs infrastructure
r = await call(req({ ...good, source: "websites" }));
check("source=websites keeps the website subject", r.status === 200 && calls.at(-1).body.subject === "New website inquiry from Jane Doe");
check("websites body names its form", calls.at(-1).body.text.includes("Form: /websites") && calls.at(-1).body.text.includes("Sent from the /websites contact form"));
r = await call(req({ ...good, source: "websites", business: "" }));
check("source=websites still requires a business name", r.status === 400 && !!r.data.fields?.business);
const infra = { source: "infrastructure", name: "Sam Ops", email: "sam@corp.example", message: "Need help with a Proxmox cluster.", nickname: "" };
const beforeInfra = calls.length;
r = await call(req(infra));
const infraSent = calls.at(-1);
check("source=infrastructure without business returns 200", r.status === 200 && r.data.ok === true && calls.length === beforeInfra + 1, `status ${r.status} ${JSON.stringify(r.data)}`);
check("infrastructure subject", infraSent?.body.subject === "New infrastructure inquiry from Sam Ops");
check("infrastructure reply_to is the visitor", infraSent?.body.reply_to === "sam@corp.example");
check("infrastructure body names its form", infraSent?.body.text.includes("Form: /infrastructure") && infraSent?.body.html.includes("New infrastructure inquiry") && infraSent?.body.html.includes("/infrastructure contact form"));
check("infrastructure body omits empty business/website rows", !infraSent?.body.text.includes("Business:") && !infraSent?.body.text.includes("Website:"));
r = await call(req({ ...infra, business: "Corp Inc" }));
check("infrastructure includes business when given", calls.at(-1).body.text.includes("Business: Corp Inc"));
r = await call(req({ ...infra, name: "", email: "bad", message: "" }));
check("infrastructure still validates name/email/message", r.status === 400 && ["name", "email", "message"].every((k) => r.data.fields?.[k]) && !r.data.fields?.business);
r = await call(req(new URLSearchParams(infra).toString(), { type: "application/x-www-form-urlencoded" }));
check("infrastructure form-encoded body accepted", r.status === 200 && calls.at(-1).body.subject === "New infrastructure inquiry from Sam Ops");
const beforeUnknown = calls.length;
r = await call(req({ ...good, source: "toString" }));
check("unknown source is rejected, nothing sent", r.status === 400 && !!r.data.fields?.source && calls.length === beforeUnknown);
r = await call(req({ ...infra, nickname: "bot" }));
check("infrastructure honeypot sends nothing", r.status === 200 && r.data.ok && calls.length === beforeUnknown);

// 4. Honeypot
const beforeHoneypot = calls.length;
r = await call(req({ ...good, nickname: "bot-filled" }));
check("honeypot: pretends success, sends nothing", r.status === 200 && r.data.ok && calls.length === beforeHoneypot);

// 5. Form-encoded body
r = await call(req(new URLSearchParams(good).toString(), { type: "application/x-www-form-urlencoded" }));
check("form-encoded body accepted", r.status === 200 && calls.length === beforeHoneypot + 1);

// 6. Bad requests
r = await call(req("{not json"));
check("malformed JSON returns 400", r.status === 400);
r = await call(req(good, { origin: "https://evil.example" }));
check("cross-site Origin returns 403", r.status === 403);
r = await call(req(good, { origin: null }));
check("missing Origin (non-browser client) still accepted", r.status === 200);
r = await call(req(good), {});
check("missing RESEND_API_KEY returns 500", r.status === 500 && r.data.ok === false);
resendStatus = 401;
r = await call(req(good));
check("Resend failure returns 502", r.status === 502 && r.data.ok === false);
resendStatus = 200;
const other = await fn.onRequest({ request: req(null, { method: "GET" }), env });
check("non-POST returns 405", other.status === 405 && other.headers.get("Allow") === "POST");

// 7. Client hook (src/hooks/useContactForm.ts) agrees with the function
const hook = readFileSync(join(root, "src/hooks/useContactForm.ts"), "utf8");
check("client honeypot name matches the function", hook.includes(`CONTACT_HONEYPOT = "${fn.HONEYPOT_FIELD}"`));
const clientSources = (hook.match(/export type ContactSource = ([^;]+);/)?.[1] ?? "").match(/"[^"]+"/g)?.map((x) => x.slice(1, -1)) ?? [];
check("client sources match the function's SOURCES", clientSources.length > 0 && clientSources.sort().join() === Object.keys(fn.SOURCES).sort().join(), clientSources.join(","));

console.error = quiet;
rmSync(dir, { recursive: true, force: true });
console.log(failures ? `\n${failures} check(s) failed` : "\nAll contact endpoint checks passed");
process.exit(failures ? 1 : 0);
