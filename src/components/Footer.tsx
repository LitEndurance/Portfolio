"use client";

import FadeIn from "./FadeIn";

export default function Footer() {
  return (
    <footer
      className="relative"
      style={{
        padding: "0 5vw calc(2vh + 56px)",
      }}
    >
      <div
        className="mx-auto p-6 sm:p-8"
        style={{
          maxWidth: "1400px",
          background: "rgba(6, 10, 20, 0.85)",
          backdropFilter: "blur(6px) saturate(1.2)",
          WebkitBackdropFilter: "blur(6px) saturate(1.2)",
          border: "1px solid rgba(78, 205, 196, 0.12)",
          borderRadius: "4px",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <FadeIn delay={0}>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(78, 205, 196, 0.6)",
                  marginBottom: "20px",
                }}
              >
                GET IN TOUCH
              </p>
              <a
                href="mailto:willbarnh@gmail.com"
                className="block transition-opacity duration-300 hover:opacity-70"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  color: "#e8ecf1",
                  textDecoration: "none",
                }}
              >
                willbarnh@gmail.com
              </a>
              <a
                href="tel:+15092795635"
                className="block mt-3 transition-opacity duration-300 hover:opacity-70"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  color: "#e8ecf1",
                  textDecoration: "none",
                }}
              >
                (509) 279-5635
              </a>
              <p
                className="block mt-3 transition-opacity duration-300 hover:opacity-70"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  color: "#e8ecf1",
                  textDecoration: "none",
                }}
              >
                Discord: lit_endurance
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(78, 205, 196, 0.6)",
                  marginBottom: "20px",
                }}
              >
                LOCATION
              </p>
              <p
                className="mt-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  color: "rgba(78, 205, 196, 0.5)",
                }}
              >
                Available remotely
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(78, 205, 196, 0.6)",
                  marginBottom: "20px",
                }}
              >
                PROFILE
              </p>
              <a
                href="/IT-Focused-Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="block transition-opacity duration-300 hover:opacity-70"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  color: "#d4a843",
                  textDecoration: "none",
                }}
              >
                Resume
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.45}>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(78, 205, 196, 0.6)",
                  marginBottom: "20px",
                }}
              >
                STATUS
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  color: "#d4a843",
                }}
              >
                Open to Opportunities
              </p>
              <p
                className="mt-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  color: "rgba(78, 205, 196, 0.5)",
                }}
              >
                Full-time & Contract
              </p>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.5}>
          <p
            className="mt-10"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "rgba(78, 205, 196, 0.5)",
            }}
          >
            &copy; 2025 William Barnhart. All rights reserved.
          </p>
        </FadeIn>
      </div>
    </footer>
  );
}
