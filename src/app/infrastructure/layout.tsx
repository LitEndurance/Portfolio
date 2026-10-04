import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "William Barnhart — Systems Administrator",
  description:
    "Systems Administrator & Infrastructure Engineer. Linux, Docker, Next.js, NestJS, AI Dev, Networking.",
};

export default function InfrastructureLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
