"use client";

import { useState } from "react";

export function CdnImage({
  src,
  width,
  height,
  alt,
  className,
  loading = "lazy",
}: {
  src: string | null;
  width: number;
  height: number;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  const aspectRatio = `${width} / ${height}`;

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt || "Photo unavailable"}
        className={`flex items-center justify-center bg-zinc-200 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 ${className ?? ""}`}
        style={{ aspectRatio }}
      >
        Photo unavailable
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={className}
      style={{ aspectRatio }}
      onError={() => setFailed(true)}
    />
  );
}
