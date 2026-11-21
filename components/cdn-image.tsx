"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { useState } from "react";

function withSx(base: SxProps<Theme>, sx?: SxProps<Theme>): SxProps<Theme> {
  const extra = sx === undefined ? [] : Array.isArray(sx) ? sx : [sx];
  return [base, ...extra];
}

export function CdnImage({
  src,
  width,
  height,
  alt,
  loading = "lazy",
  sx,
}: {
  src: string | null;
  width: number;
  height: number;
  alt: string;
  loading?: "lazy" | "eager";
  sx?: SxProps<Theme>;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = src !== null && failedSrc === src;
  const aspectRatio = `${width} / ${height}`;

  if (!src || failed) {
    return (
      <Box
        role="img"
        aria-label={alt || "Photo unavailable"}
        sx={withSx(
          {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "action.hover",
            color: "text.secondary",
            aspectRatio,
          },
          sx,
        )}
      >
        <Typography variant="body2">Photo unavailable</Typography>
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      onError={() => setFailedSrc(src)}
      sx={withSx(
        {
          aspectRatio,
          display: "block",
          height: "auto",
          width: "100%",
        },
        sx,
      )}
    />
  );
}
