"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Mail, MapPin, Phone } from "lucide-react";
import SectionShell from "@/components/SectionShell";
import FadeIn from "@/components/FadeIn";
import { sites } from "@/content/sites";
import { useContactForm } from "@/hooks/useContactForm";

const FIELDS = ["name", "email", "business", "website", "message"] as const;
type FieldName = (typeof FIELDS)[number];

export default function SitesContact() {
  const { contact } = sites;
  const form = useContactForm({
    source: "websites",
    fields: FIELDS,
    idPrefix: "sites",
    email: contact.email,
    endpoint: contact.endpoint,
    genericError: contact.status.errorGeneric,
    mailtoLabels: { name: "Name", email: "Email", business: "Business", website: "Website" },
    mailtoSubject: (v) => `Website inquiry from ${v.name || v.business || "the website"}`,
  });
  const { status, sending, error, fieldErrors, statusRef, reset, mailtoHref } = form;

  const fieldProps = (key: FieldName) => ({ ...form.fieldProps(key), className: "form-field" });

  const fieldError = (key: FieldName) =>
    fieldErrors[key] ? (
      <p id={form.errorId(key)} className="sites-field-error">
        {fieldErrors[key]}
      </p>
    ) : null;

  return (
    <SectionShell
      id={contact.id}
      badgeIcon={contact.badgeIcon}
      badge={contact.badge}
      title={contact.title}
    >
      <FadeIn delay={0.1}>
        <p className="sites-lede" style={{ marginBottom: "32px" }}>
          {contact.body}
        </p>
      </FadeIn>

      <div className="sites-contact-grid">
        <FadeIn delay={0.16}>
          {status === "success" ? (
            <div
              ref={statusRef}
              tabIndex={-1}
              role="status"
              className="sites-form-status sites-form-status-ok"
            >
              <CheckCircle2 size={28} aria-hidden="true" />
              <div>
                <p className="sites-form-status-title">{contact.status.successTitle}</p>
                <p className="card-body" style={{ fontSize: "14.5px", marginTop: "4px" }}>
                  {contact.status.successBody}
                </p>
                <button type="button" onClick={reset} className="btn btn-ghost" style={{ marginTop: "18px" }}>
                  {contact.status.sendAnother}
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={form.submit}
              aria-busy={sending}
              className="grid grid-cols-1 sm:grid-cols-2"
              style={{ gap: "18px 16px" }}
            >
              <div>
                <label htmlFor="sites-name" className="sites-label">
                  {contact.fields.name}
                </label>
                <input type="text" required maxLength={100} autoComplete="name" {...fieldProps("name")} />
                {fieldError("name")}
              </div>
              <div>
                <label htmlFor="sites-email" className="sites-label">
                  {contact.fields.email}
                </label>
                <input type="email" required maxLength={254} autoComplete="email" {...fieldProps("email")} />
                {fieldError("email")}
              </div>
              <div>
                <label htmlFor="sites-business" className="sites-label">
                  {contact.fields.business}
                </label>
                <input type="text" required maxLength={150} autoComplete="organization" {...fieldProps("business")} />
                {fieldError("business")}
              </div>
              <div>
                <label htmlFor="sites-website" className="sites-label">
                  {contact.fields.website}
                  <small>{contact.fields.optional}</small>
                </label>
                {/* type="text" so "joesplumbing.com" is accepted without a
                    scheme; the server adds https:// when it's missing. */}
                <input
                  type="text"
                  inputMode="url"
                  maxLength={200}
                  autoComplete="url"
                  placeholder="https://"
                  {...fieldProps("website")}
                />
                {fieldError("website")}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="sites-message" className="sites-label">
                  {contact.fields.message}
                </label>
                <textarea
                  required
                  rows={5}
                  maxLength={5000}
                  {...fieldProps("message")}
                  style={{ resize: "vertical", minHeight: "140px" }}
                />
                {fieldError("message")}
              </div>
              {/* Honeypot (spam trap): off-screen, skipped by keyboard and
                  screen readers. Real visitors never fill it in. */}
              <div className="sites-hp" aria-hidden="true">
                <label htmlFor="sites-nickname">Leave this field empty</label>
                <input {...form.honeypotProps} />
              </div>

              {status === "error" && (
                <div role="alert" className="sm:col-span-2 sites-form-status sites-form-status-error">
                  <AlertTriangle size={22} aria-hidden="true" />
                  <div>
                    <p className="sites-form-status-title">{contact.status.errorTitle}</p>
                    <p className="card-body" style={{ fontSize: "14px", marginTop: "2px" }}>
                      {error}{" "}
                      <a href={mailtoHref()} className="sites-inline-link">
                        {contact.status.errorFallback}
                      </a>{" "}
                      {contact.status.errorFallbackNote}
                    </p>
                  </div>
                </div>
              )}

              <div
                className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center"
                style={{ gap: "10px 16px", marginTop: "4px" }}
              >
                <button
                  type="submit"
                  disabled={sending}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  {sending ? (
                    <>
                      <Loader2 size={17} aria-hidden="true" className="sites-spin" />
                      {contact.fields.sending}
                    </>
                  ) : (
                    <>
                      {contact.fields.submit}
                      <ArrowRight size={17} aria-hidden="true" className="sites-btn-arrow" />
                    </>
                  )}
                </button>
                <p
                  aria-live="polite"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "13px",
                    color: "rgba(208, 213, 221, 0.65)",
                  }}
                >
                  {contact.fields.submitNote}
                </p>
              </div>
              <p className="sm:col-span-2 sites-privacy-note" style={{ marginTop: "-6px" }}>
                {contact.fields.privacyPrefix}{" "}
                <Link href={contact.fields.privacyHref} className="sites-inline-link">
                  {contact.fields.privacyLabel}
                </Link>
                .
              </p>
            </form>
          )}
        </FadeIn>

        <FadeIn delay={0.24}>
          <aside className="sites-contact-aside" aria-label={contact.directLabel}>
            <div>
              <p className="eyebrow" style={{ marginBottom: "8px" }}>
                {contact.directLabel}
              </p>
              <a href={`mailto:${contact.email}`} className="sites-contact-line focus-ring">
                <span className="sites-icon" aria-hidden="true">
                  <Mail size={17} strokeWidth={1.75} />
                </span>
                <span style={{ fontWeight: 600 }}>{contact.email}</span>
              </a>
              <a href={contact.phoneHref} className="sites-contact-line focus-ring" style={{ marginTop: "8px" }}>
                <span className="sites-icon" aria-hidden="true">
                  <Phone size={17} strokeWidth={1.75} />
                </span>
                <span>{contact.phone}</span>
              </a>
              <p className="sites-contact-line" style={{ marginTop: "8px", color: "rgba(208, 213, 221, 0.85)" }}>
                <span className="sites-icon" aria-hidden="true">
                  <MapPin size={17} strokeWidth={1.75} />
                </span>
                <span>{contact.location}</span>
              </p>
            </div>
            <div style={{ paddingTop: "18px", borderTop: "1px solid rgba(78, 205, 196, 0.12)" }}>
              <p className="eyebrow" style={{ marginBottom: "12px" }}>
                {contact.nextLabel}
              </p>
              <ol className="sites-next">
                {contact.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </aside>
        </FadeIn>
      </div>
    </SectionShell>
  );
}
