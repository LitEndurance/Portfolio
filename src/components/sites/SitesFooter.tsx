"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUp, ArrowRight } from "lucide-react";
import { scrollToId } from "@/components/sites/SitesHero";
import { sites } from "@/content/sites";

export default function SitesFooter() {
  const { footer, contact, crossLink } = sites;
  return (
    <footer className="sites-footer">
      <div className="sites-footer-inner">
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#4ecdc4",
            }}
          >
            William Barnhart
          </p>
          <p className="card-body" style={{ fontSize: "13.5px", marginTop: "6px" }}>
            {footer.tagline}
          </p>
          <p
            className="flex flex-wrap"
            style={{
              gap: "0 16px",
              marginTop: "6px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
          >
            <a
              href={`mailto:${contact.email}`}
              className="focus-ring inline-flex items-center min-h-[32px] hover:text-[#4ecdc4] transition-colors duration-200"
              style={{ color: "#e8ecf1", textDecoration: "none" }}
            >
              {contact.email}
            </a>
            <a
              href={contact.phoneHref}
              className="focus-ring inline-flex items-center min-h-[32px] hover:text-[#4ecdc4] transition-colors duration-200"
              style={{ color: "#e8ecf1", textDecoration: "none" }}
            >
              {contact.phone}
            </a>
          </p>
        </div>
        <nav aria-label="Footer" className="sites-footer-links">
          <Link href="/" className="focus-ring">
            <ArrowLeft size={13} aria-hidden="true" />
            All trails
          </Link>
          <Link href={crossLink.href} className="focus-ring">
            {crossLink.shortLabel}
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
          <a href="#hero" onClick={scrollToId("hero")} className="focus-ring">
            {footer.backToTop}
            <ArrowUp size={13} aria-hidden="true" />
          </a>
        </nav>
        <div className="sites-footer-legal">
          <p>&copy; {new Date().getFullYear()} William Barnhart · Spokane Valley, WA</p>
          <nav aria-label="Legal" className="sites-footer-legal-links">
            <Link href="/privacy" className="focus-ring">
              Privacy
            </Link>
            <Link href="/terms" className="focus-ring">
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
