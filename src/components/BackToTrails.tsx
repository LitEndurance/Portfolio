import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * "← All trails" link back to the main menu (the trail-choice landing page at
 * /). Shared by the /websites and /infrastructure headers so both trails look
 * and behave the same. It is a real link (next/link, client-side navigation),
 * so it works with the keyboard, middle-click / open-in-new-tab, and screen
 * readers, and it adds a normal history entry instead of rewriting history.
 */
export default function BackToTrails({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`back-to-trails focus-ring ${className}`.trim()}
      // Accessible name keeps the visible words ("All trails") first.
      aria-label="All trails: back to the main menu"
      title="Back to the main menu"
    >
      <ArrowLeft size={14} strokeWidth={2.25} aria-hidden="true" />
      <span>All trails</span>
    </Link>
  );
}
