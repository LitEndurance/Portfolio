"use client";

import FadeIn from "./FadeIn";

// Google Search Console crawl stats, Jun 20 - Sep 17, 2026.
// Daily average response time (ms) seen by Googlebot. Index 53 = Aug 12,
// the day the rebuilt site went live.
const RESPONSE_MS = [
  455, 412, 331, 325, 394, 353, 252, 307, 343, 307, 244, 304, 302, 310, 294,
  406, 339, 317, 427, 396, 482, 359, 366, 313, 362, 335, 377, 507, 306, 229,
  382, 505, 487, 365, 557, 368, 447, 465, 497, 506, 474, 480, 391, 315, 444,
  397, 439, 613, 363, 466, 518, 406, 363, 158, 140, 106, 300, 421, 290, 260,
  190, 249, 188, 197, 247, 234, 204, 242, 279, 330, 343, 309, 253, 349, 251,
  231, 245, 247, 241, 318, 152, 281, 152, 193, 126, 120, 206, 235, 235,
];
const LAUNCH_INDEX = 53;
const PRE_AVG = 391;
const POST_AVG = 237;

const CHART = { w: 820, h: 280, padL: 38, padR: 12, padT: 18, padB: 30, max: 650 };
const cx = (i: number) =>
  CHART.padL + (i * (CHART.w - CHART.padL - CHART.padR)) / (RESPONSE_MS.length - 1);
const cy = (v: number) =>
  CHART.padT + (1 - v / CHART.max) * (CHART.h - CHART.padT - CHART.padB);

const linePoints = (from: number, to: number) =>
  RESPONSE_MS.slice(from, to + 1)
    .map((v, k) => `${cx(from + k).toFixed(1)},${cy(v).toFixed(1)}`)
    .join(" ");

const LIGHTHOUSE = [
  { label: "Performance", score: 93 },
  { label: "Accessibility", score: 96 },
  { label: "Best practices", score: 96 },
  { label: "SEO", score: 100 },
];

const VITALS = [
  { value: "0.5 s", label: "First contentful paint" },
  { value: "1.4 s", label: "Largest contentful paint" },
  { value: "140 ms", label: "Total blocking time" },
  { value: "0", label: "Cumulative layout shift" },
  { value: "1.2 s", label: "Speed index" },
];

const OUTCOMES = [
  {
    value: "−39%",
    label: "server response time",
    detail: "391 ms → 237 ms, Googlebot crawl average",
  },
  {
    value: "+244%",
    label: "lead submissions",
    detail: "9 → 31, five weeks before vs after launch",
  },
  {
    value: "+49%",
    label: "core-market traffic, YoY",
    detail: "697 → 1,042 active users in WA + ID",
  },
  {
    value: "0",
    label: "cumulative layout shift",
    detail: "Lighthouse 13.4.1 desktop, Sep 19 2026",
  },
];

const mono = { fontFamily: "var(--font-mono)" } as const;

function ResponseTimeChart() {
  return (
    <div>
      <p
        style={{
          ...mono,
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(232, 236, 241, 0.55)",
          marginBottom: "10px",
        }}
      >
        Average server response time seen by Googlebot (ms)
      </p>
      <svg
        viewBox={`0 0 ${CHART.w} ${CHART.h}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Line chart of daily average server response time. Before the rebuild the 53-day average was ${PRE_AVG} milliseconds; after launch the 36-day average was ${POST_AVG} milliseconds, a 39 percent reduction.`}
      >
        {[0, 200, 400, 600].map((g) => (
          <g key={g}>
            <line
              x1={CHART.padL}
              x2={CHART.w - CHART.padR}
              y1={cy(g)}
              y2={cy(g)}
              stroke="rgba(232, 236, 241, 0.08)"
              strokeWidth="1"
            />
            <text
              x={CHART.padL - 6}
              y={cy(g) + 3}
              textAnchor="end"
              fill="rgba(232, 236, 241, 0.35)"
              fontSize="10"
              fontFamily="var(--font-mono)"
            >
              {g}
            </text>
          </g>
        ))}

        <line
          x1={cx(0)}
          x2={cx(LAUNCH_INDEX - 1)}
          y1={cy(PRE_AVG)}
          y2={cy(PRE_AVG)}
          stroke="rgba(139, 152, 165, 0.55)"
          strokeWidth="1"
          strokeDasharray="5 4"
        />
        <line
          x1={cx(LAUNCH_INDEX)}
          x2={cx(RESPONSE_MS.length - 1)}
          y1={cy(POST_AVG)}
          y2={cy(POST_AVG)}
          stroke="rgba(78, 205, 196, 0.55)"
          strokeWidth="1"
          strokeDasharray="5 4"
        />
        <text
          x={cx(1)}
          y={cy(PRE_AVG) - 7}
          fill="rgba(139, 152, 165, 0.9)"
          fontSize="11"
          fontFamily="var(--font-mono)"
        >
          {PRE_AVG} ms · Showit site
        </text>
        <text
          x={cx(RESPONSE_MS.length - 1)}
          y={cy(POST_AVG) + 16}
          textAnchor="end"
          fill="#4ecdc4"
          fontSize="11"
          fontFamily="var(--font-mono)"
        >
          {POST_AVG} ms · rebuilt site
        </text>

        <line
          x1={cx(LAUNCH_INDEX)}
          x2={cx(LAUNCH_INDEX)}
          y1={CHART.padT}
          y2={CHART.h - CHART.padB}
          stroke="rgba(212, 168, 67, 0.7)"
          strokeWidth="1.5"
        />
        <text
          x={cx(LAUNCH_INDEX)}
          y={CHART.padT - 5}
          textAnchor="middle"
          fill="#d4a843"
          fontSize="10"
          fontFamily="var(--font-mono)"
          letterSpacing="0.08em"
        >
          NEW SITE LIVE
        </text>

        <polyline
          points={linePoints(0, LAUNCH_INDEX - 1)}
          fill="none"
          stroke="rgba(139, 152, 165, 0.85)"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <polyline
          points={linePoints(LAUNCH_INDEX, RESPONSE_MS.length - 1)}
          fill="none"
          stroke="#4ecdc4"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />

        {[
          { i: 0, label: "JUN 20" },
          { i: LAUNCH_INDEX, label: "AUG 12" },
          { i: RESPONSE_MS.length - 1, label: "SEP 17" },
        ].map(({ i, label }) => (
          <text
            key={label}
            x={cx(i)}
            y={CHART.h - CHART.padB + 16}
            textAnchor="middle"
            fill="rgba(232, 236, 241, 0.35)"
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function LighthouseBars() {
  return (
    <div>
      <p
        style={{
          ...mono,
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(232, 236, 241, 0.55)",
          marginBottom: "10px",
        }}
      >
        Lighthouse, desktop, after launch
      </p>
      <div className="space-y-3">
        {LIGHTHOUSE.map(({ label, score }) => (
          <div key={label} className="flex items-center gap-3">
            <span
              className="shrink-0"
              style={{ ...mono, fontSize: "11px", color: "rgba(232, 236, 241, 0.65)", width: "104px" }}
            >
              {label}
            </span>
            <div
              className="flex-1 h-1.5"
              style={{ background: "rgba(78, 205, 196, 0.1)", borderRadius: "2px" }}
            >
              <div
                className="h-full"
                style={{
                  width: `${score}%`,
                  borderRadius: "2px",
                  background:
                    score === 100
                      ? "#4ecdc4"
                      : "linear-gradient(90deg, #d4a843, #4ecdc4)",
                }}
              />
            </div>
            <span
              className="shrink-0 text-right"
              style={{
                ...mono,
                fontSize: "14px",
                fontWeight: 600,
                color: score === 100 ? "#4ecdc4" : "#e8ecf1",
                width: "32px",
              }}
            >
              {score}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5">
        {VITALS.map(({ value, label }) => (
          <div key={label}>
            <span style={{ ...mono, fontSize: "15px", fontWeight: 600, color: "#e8ecf1" }}>
              {value}
            </span>{" "}
            <span style={{ ...mono, fontSize: "10px", color: "rgba(78, 205, 196, 0.55)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QualityStovesCaseStudy() {
  return (
    <FadeIn delay={0.1}>
      <div
        style={{
          border: "1px solid rgba(78, 205, 196, 0.16)",
          background: "rgba(78, 205, 196, 0.03)",
          borderRadius: "4px",
          padding: "clamp(20px, 3vw, 36px)",
          marginBottom: "40px",
        }}
      >
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span
            className="inline-flex items-center px-2 py-0.5"
            style={{
              ...mono,
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "rgba(212, 168, 67, 0.85)",
              border: "1px solid rgba(212, 168, 67, 0.3)",
              borderRadius: "2px",
            }}
          >
            Featured case study
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5"
            style={{
              ...mono,
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#4ecdc4",
              border: "1px solid rgba(78, 205, 196, 0.3)",
              borderRadius: "2px",
            }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#4ecdc4" }} />
            Live
          </span>
          <a
            href="https://qualitystovesandspas.com"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring"
            style={{ ...mono, fontSize: "11px", color: "rgba(78, 205, 196, 0.7)" }}
          >
            qualitystovesandspas.com ↗
          </a>
        </div>

        <h3
          style={{
            ...mono,
            fontSize: "clamp(18px, 2vw, 26px)",
            fontWeight: 300,
            letterSpacing: "0.02em",
            color: "#e8ecf1",
            marginBottom: "10px",
          }}
        >
          QUALITY STOVES &amp; SPAS — FULL WEBSITE REBUILD
        </h3>
        <p
          style={{
            ...mono,
            fontSize: "clamp(12px, 0.95vw, 14px)",
            lineHeight: 1.65,
            color: "rgba(78, 205, 196, 0.7)",
            marginBottom: "24px",
          }}
        >
          Replaced a stove and spa retailer&apos;s aging Showit site with a custom
          Next.js build — statically prerendered, edge-cached on Cloudflare, with
          product manuals moved to R2 object storage and lead forms piped through
          n8n into NetSuite. n8n sits in front of the NetSuite API as an
          aggregator: it validates, normalizes, and reshapes every submission
          before it hits the ERP, so data manipulation lives in workflows instead
          of site code. Failed writes retry instead of dropping leads, API
          credentials stay server-side, and new integrations bolt on without a
          redeploy. Launched August 12, 2026; every number below is measured
          after launch.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {OUTCOMES.map(({ value, label, detail }) => (
            <div
              key={label}
              style={{
                border: "1px solid rgba(78, 205, 196, 0.1)",
                borderRadius: "3px",
                padding: "14px",
              }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "clamp(20px, 2.2vw, 28px)",
                  fontWeight: 600,
                  color: "#d4a843",
                  lineHeight: 1.1,
                }}
              >
                {value}
              </p>
              <p
                style={{
                  ...mono,
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(232, 236, 241, 0.7)",
                  marginTop: "4px",
                }}
              >
                {label}
              </p>
              <p style={{ ...mono, fontSize: "10px", color: "rgba(78, 205, 196, 0.5)", marginTop: "4px" }}>
                {detail}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          <ResponseTimeChart />
          <LighthouseBars />
        </div>

        <p style={{ ...mono, fontSize: "9px", color: "rgba(232, 236, 241, 0.3)" }}>
          Sources: Google Search Console crawl stats (Jun 20 – Sep 17, 2026) ·
          Lighthouse 13.4.1 via PageSpeed Insights, desktop (Sep 19, 2026) · GA4
          (Aug 13 – Sep 19, 2025 vs 2026; lead events Jun 13 – Jul 19 vs Aug 13 –
          Sep 19, 2026)
        </p>
      </div>
    </FadeIn>
  );
}
