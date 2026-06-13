"use client";

export default function Mountain3DFallback() {
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        background:
          "linear-gradient(180deg, #101440 0%, #201860 45%, #402860 100%)",
      }}
      aria-hidden="true"
    >
      {/* Subtle aurora-like bands rendered with CSS only. */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 30%, rgba(78,205,196,0.25) 0%, transparent 55%)," +
            "radial-gradient(ellipse 70% 45% at 80% 25%, rgba(96,200,232,0.18) 0%, transparent 50%)",
        }}
      />
      {/* Soft mist at the base so text remains readable. */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            "linear-gradient(to top, rgba(8,5,24,0.7) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
