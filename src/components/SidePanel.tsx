"use client";

import { ReactNode } from "react";

interface SidePanelProps {
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
  compact?: boolean;
}

export default function SidePanel({
  children,
  side = "left",
  className = "",
  compact = false,
}: SidePanelProps) {
  return (
    <div
      className={`relative z-[2] ${side === "left" ? "mr-auto" : "ml-auto"} ${className}`}
      style={{
        width: "min(92vw, 380px)",
        maxWidth: "100%",
      }}
    >
      <div
        className={`${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}
        style={{
          background: "rgba(6, 10, 20, 0.34)",
          backdropFilter: "blur(12px) saturate(1.2)",
          WebkitBackdropFilter: "blur(12px) saturate(1.2)",
          border: "1px solid rgba(78, 205, 196, 0.12)",
          borderRadius: "4px",
          maxHeight: "78vh",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
}
