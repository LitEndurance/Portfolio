"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

function reportMetric(metric: Metric) {
  // Log to the console in development. In production this could be sent to
  // an analytics endpoint (e.g. `/api/vitals`) for monitoring.
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  }

  // Example production hook: send to a real analytics endpoint.
  // const analyticsUrl = process.env.NEXT_PUBLIC_VITALS_ENDPOINT;
  // if (analyticsUrl && navigator.sendBeacon) {
  //   navigator.sendBeacon(analyticsUrl, JSON.stringify(metric));
  // }

  // Expose on window for external tooling / Lighthouse CI.
  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__webVitals = (
      (window as unknown as Record<string, unknown>).__webVitals ?? []
    ) as Metric[];
    (((window as unknown as Record<string, unknown>).__webVitals) as Metric[]).push(metric);
  }
}

export default function WebVitals() {
  useEffect(() => {
    onCLS(reportMetric);
    onFCP(reportMetric);
    onINP(reportMetric);
    onLCP(reportMetric);
    onTTFB(reportMetric);
  }, []);

  return null;
}
