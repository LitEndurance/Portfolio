import type { NextConfig } from "next";
import os from "node:os";

function getLanIps(): string[] {
  const ips = new Set<string>();
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const iface of interfaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.add(iface.address);
      }
    }
  }
  return Array.from(ips);
}

const lanIps = getLanIps();

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  distDir: "build",
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    ...lanIps,
  ],
};

export default nextConfig;
