"use client";

import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import type { SxProps, Theme } from "@mui/material/styles";
import Link from "next/link";
import type { ReactNode } from "react";

export function AppLink({
  href,
  scroll,
  children,
  color,
  variant,
  underline = "always",
  sx,
}: {
  href: string;
  scroll?: boolean;
  children: ReactNode;
  color?: "primary" | "inherit" | "textSecondary";
  variant?: "body1" | "body2";
  underline?: "always" | "hover" | "none";
  sx?: SxProps<Theme>;
}) {
  return (
    <MuiLink
      component={Link}
      href={href}
      scroll={scroll}
      color={color}
      variant={variant}
      underline={underline}
      sx={sx}
    >
      {children}
    </MuiLink>
  );
}

export function ButtonLink({
  href,
  scroll,
  children,
  onClick,
}: {
  href: string | null;
  scroll?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  if (!href) {
    return (
      <Button disabled variant="text">
        {children}
      </Button>
    );
  }

  return (
    <Button component={Link} href={href} scroll={scroll} variant="text" onClick={onClick}>
      {children}
    </Button>
  );
}

export function CardLink({
  href,
  scroll,
  children,
}: {
  href: string;
  scroll?: boolean;
  children: ReactNode;
}) {
  return (
    <MuiLink
      component={Link}
      href={href}
      scroll={scroll}
      underline="none"
      color="inherit"
      sx={{ display: "block", width: "100%" }}
    >
      {children}
    </MuiLink>
  );
}
