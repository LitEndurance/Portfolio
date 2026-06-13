import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import WebVitals from "@/components/WebVitals";

const inter = Inter({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "William Barnhart — Systems Administrator",
  description: "Systems Administrator & Infrastructure Engineer. Linux, Docker, Next.js, NestJS, AI Dev, Networking.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'self'; upgrade-insecure-requests;" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()" />

        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Preload the mountain geometry so the 3D scene initializes sooner. */}
        <link rel="preload" href="/mountain.bin.gz" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className={`antialiased ${inter.variable} ${instrumentSerif.variable}`}>
        {children}
        <WebVitals />
      </body>
    </html>
  );
}
