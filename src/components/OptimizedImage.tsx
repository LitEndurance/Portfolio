"use client";

import { useMemo } from "react";
import imageManifest from "../../public/image-manifest.json";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  sizes?: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "sync" | "auto";
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  style,
  sizes = "100vw",
  loading = "lazy",
  decoding = "async",
  onClick,
}: OptimizedImageProps) {
  const meta = useMemo(() => {
    const base = src.split("/").pop()?.replace(/\.[^.]+$/, "");
    if (!base) return null;
    const entry = (imageManifest as Record<string, { width: number; height: number; png: string; webp: string; avif: string }>)[base];
    return entry ?? null;
  }, [src]);

  if (!meta) {
    // Fallback for images not in the manifest.
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        loading={loading}
        decoding={decoding}
        onClick={onClick}
      />
    );
  }

  const imgWidth = width ?? meta.width;
  const imgHeight = height ?? meta.height;

  return (
    <picture>
      <source srcSet={meta.avif} type="image/avif" sizes={sizes} />
      <source srcSet={meta.webp} type="image/webp" sizes={sizes} />
      <img
        src={meta.png}
        alt={alt}
        width={imgWidth}
        height={imgHeight}
        className={className}
        style={style}
        loading={loading}
        decoding={decoding}
        sizes={sizes}
        onClick={onClick}
      />
    </picture>
  );
}
