"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";

/**
 * Shared state + submit logic for the contact forms on /websites
 * (SitesContact) and /infrastructure (ContactSection). Both POST JSON to the
 * Cloudflare Pages Function at /api/contact (functions/api/contact.ts), which
 * emails the message through Resend. Each page keeps its own markup and look;
 * this hook only owns values, the honeypot, status, errors and the mailto
 * fallback.
 */

/** Which form sent the message; must match SOURCES in functions/api/contact.ts. */
export type ContactSource = "websites" | "infrastructure";
export type ContactStatus = "idle" | "sending" | "success" | "error";
export type ContactFieldName = "name" | "email" | "business" | "website" | "message";

/** Honeypot field name; must match HONEYPOT_FIELD in functions/api/contact.ts. */
export const CONTACT_HONEYPOT = "nickname";
export const CONTACT_ENDPOINT = "/api/contact";
const SEND_TIMEOUT_MS = 15000;

interface Options<F extends ContactFieldName> {
  source: ContactSource;
  /** Fields this form shows, in mailto-body order. "message" goes last. */
  fields: readonly F[];
  /** Prefix for element ids (`${idPrefix}-${field}`), unique per page. */
  idPrefix: string;
  /** Address used for the mailto fallback. */
  email: string;
  /** Labels for the mailto body lines, e.g. { name: "Name" }. */
  mailtoLabels: Record<Exclude<F, "message">, string>;
  mailtoSubject: (values: Record<F, string>) => string;
  /** Shown when the server gives no message (network error, timeout). */
  genericError: string;
  endpoint?: string;
}

export function useContactForm<F extends ContactFieldName>({
  source,
  fields,
  idPrefix,
  email,
  mailtoLabels,
  mailtoSubject,
  genericError,
  endpoint = CONTACT_ENDPOINT,
}: Options<F>) {
  const empty = () => Object.fromEntries(fields.map((f) => [f, ""])) as Record<F, string>;
  const [values, setValues] = useState<Record<F, string>>(empty);
  // Honeypot: hidden from people, tempting to bots. Must stay empty.
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<F, string>>>({});
  const statusRef = useRef<HTMLDivElement>(null);

  const onChange = (key: F) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    setFieldErrors((f) => (f[key] ? { ...f, [key]: undefined } : f));
  };

  // Fallback if sending fails: the visitor's mail app with everything filled in.
  const mailtoHref = () => {
    const lines = fields
      .filter((f): f is Exclude<F, "message"> => f !== "message")
      .filter((f) => values[f] || f === "name" || f === "email")
      .map((f) => `${mailtoLabels[f]}: ${values[f]}`);
    const message = (values as Record<string, string>).message ?? "";
    const body = [...lines, "", message].join("\n");
    return `mailto:${email}?subject=${encodeURIComponent(mailtoSubject(values))}&body=${encodeURIComponent(body)}`;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    setFieldErrors({});
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...values, source, [CONTACT_HONEYPOT]: honeypot }),
        signal: controller.signal,
      });
      const data: { ok?: boolean; error?: string; fields?: Partial<Record<F, string>> } = await res
        .json()
        .catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus("success");
        requestAnimationFrame(() => statusRef.current?.focus());
        return;
      }
      setFieldErrors(data.fields ?? {});
      setError(data.error || genericError);
      setStatus("error");
    } catch {
      setError(genericError);
      setStatus("error");
    } finally {
      clearTimeout(timer);
    }
  };

  const reset = () => {
    setValues(empty());
    setFieldErrors({});
    setError("");
    setStatus("idle");
  };

  const errorId = (key: F) => `${idPrefix}-${key}-error`;

  /** id/name/value/onChange + aria wiring for one input. Add your own className. */
  const fieldProps = (key: F) => ({
    id: `${idPrefix}-${key}`,
    name: key,
    value: values[key],
    onChange: onChange(key),
    "aria-invalid": fieldErrors[key] ? true : undefined,
    "aria-describedby": fieldErrors[key] ? errorId(key) : undefined,
  });

  /** Props for the off-screen honeypot input (hide its wrapper with CSS + aria-hidden). */
  const honeypotProps = {
    id: `${idPrefix}-${CONTACT_HONEYPOT}`,
    name: CONTACT_HONEYPOT,
    type: "text",
    tabIndex: -1,
    autoComplete: "off",
    value: honeypot,
    onChange: (e: ChangeEvent<HTMLInputElement>) => setHoneypot(e.target.value),
  } as const;

  return {
    values,
    status,
    sending: status === "sending",
    error,
    fieldErrors,
    errorId,
    statusRef,
    fieldProps,
    honeypotProps,
    submit,
    reset,
    mailtoHref,
  };
}
