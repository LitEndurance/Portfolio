"use client";

import { AlertTriangle, ArrowRight, Check, Loader2 } from "lucide-react";
import FadeIn from "./FadeIn";
import SectionShell from "./SectionShell";
import { useContactForm } from "@/hooks/useContactForm";

const EMAIL = "willbarnh@gmail.com";
const FIELDS = ["name", "email", "message"] as const;
type FieldName = (typeof FIELDS)[number];

// Summit contact form for /infrastructure. Same backend and logic as the
// /websites form (useContactForm -> /api/contact), styled with this trail's
// terminal look (.summit-* in globals.css).
export default function ContactSection() {
  const form = useContactForm({
    source: "infrastructure",
    fields: FIELDS,
    idPrefix: "summit",
    email: EMAIL,
    genericError: "The transmission couldn't be sent right now.",
    mailtoLabels: { name: "Name", email: "Email" },
    mailtoSubject: (v) => `Infrastructure inquiry from ${v.name || "the portfolio"}`,
  });
  const { status, sending, error, fieldErrors, statusRef, reset, mailtoHref } = form;

  const label = (key: FieldName, text: string) => (
    <label htmlFor={`summit-${key}`} className="summit-label">
      <span aria-hidden="true">&gt; </span>
      {text}
    </label>
  );
  const fieldError = (key: FieldName) =>
    fieldErrors[key] ? (
      <p id={form.errorId(key)} className="summit-field-error">
        {fieldErrors[key]}
      </p>
    ) : null;

  return (
    <SectionShell
      id="contact"
      badgeIcon="🏁"
      badge="Summit"
      title="Let's build something together"
    >
      <FadeIn delay={0.12}>
        <p
          className="mb-6"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(13px, 1vw, 15px)",
            lineHeight: 1.7,
            color: "#d0d5dd",
          }}
        >
          Open to infrastructure, systems administration, and full-stack opportunities. If you
          need reliable hosting, automation, or a technical partner for your next climb, send a
          transmission.
        </p>
      </FadeIn>

      <FadeIn delay={0.22}>
        {status === "success" ? (
          <div ref={statusRef} tabIndex={-1} role="status" className="summit-status summit-status-ok">
            <Check size={20} aria-hidden="true" className="summit-status-icon" />
            <div>
              <p className="summit-status-title">Transmission received.</p>
              <p className="summit-status-body">
                Thanks, it&apos;s in my inbox. I&apos;ll reply to the email address you gave.
              </p>
              <button type="button" onClick={reset} className="summit-btn summit-btn-ghost focus-ring">
                Send another transmission
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={form.submit} aria-busy={sending} className="summit-form">
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "16px" }}>
              <div>
                {label("name", "Name")}
                <input
                  type="text"
                  required
                  maxLength={100}
                  autoComplete="name"
                  className="summit-input"
                  {...form.fieldProps("name")}
                />
                {fieldError("name")}
              </div>
              <div>
                {label("email", "Email")}
                <input
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  className="summit-input"
                  {...form.fieldProps("email")}
                />
                {fieldError("email")}
              </div>
              <div className="sm:col-span-2">
                {label("message", "Message")}
                <textarea
                  required
                  rows={4}
                  maxLength={5000}
                  placeholder="The role, the project, or the system that needs help."
                  className="summit-input"
                  data-lenis-prevent
                  style={{ resize: "vertical", minHeight: "112px" }}
                  {...form.fieldProps("message")}
                />
                {fieldError("message")}
              </div>
            </div>

            {/* Honeypot (spam trap): off-screen, skipped by keyboard and
                screen readers. Real visitors never fill it in. */}
            <div className="summit-hp" aria-hidden="true">
              <label htmlFor="summit-nickname">Leave this field empty</label>
              <input {...form.honeypotProps} />
            </div>

            {status === "error" && (
              <div role="alert" className="summit-status summit-status-error" style={{ marginTop: "16px" }}>
                <AlertTriangle size={18} aria-hidden="true" className="summit-status-icon" />
                <div>
                  <p className="summit-status-title">Transmission failed.</p>
                  <p className="summit-status-body">
                    {error}{" "}
                    <a href={mailtoHref()} className="summit-link focus-ring">
                      Email me directly
                    </a>{" "}
                    (opens your mail app with your message filled in), or try again.
                  </p>
                </div>
              </div>
            )}

            <div className="summit-actions">
              <button type="submit" disabled={sending} className="summit-btn focus-ring">
                {sending ? (
                  <>
                    <Loader2 size={15} aria-hidden="true" className="summit-spin" />
                    Transmitting…
                  </>
                ) : (
                  <>
                    Send transmission
                    <ArrowRight size={15} aria-hidden="true" />
                  </>
                )}
              </button>
              <p className="summit-note">Goes straight to my inbox.</p>
            </div>
          </form>
        )}
      </FadeIn>

      <FadeIn delay={0.32}>
        <p className="summit-direct">
          <span>Direct line:</span>{" "}
          <a href={`mailto:${EMAIL}`} className="summit-link focus-ring">
            {EMAIL}
          </a>
          <span aria-hidden="true"> · </span>
          <span>Discord: lit_endurance</span>
        </p>
      </FadeIn>
    </SectionShell>
  );
}
