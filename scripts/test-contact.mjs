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

// 4. Honeypot
r = await call(req({ ...good, nickname: "bot-filled" }));
check("honeypot: pretends success, sends nothing", r.status === 200 && r.data.ok && calls.length === afterInjection);

// 5. Form-encoded body
r = await call(req(new URLSearchParams(good).toString(), { type: "application/x-www-form-urlencoded" }));
check("form-encoded body accepted", r.status === 200 && calls.length === afterInjection + 1);

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

console.error = quiet;
rmSync(dir, { recursive: true, force: true });
console.log(failures ? `\n${failures} check(s) failed` : "\nAll contact endpoint checks passed");
process.exit(failures ? 1 : 0);
