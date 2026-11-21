"use client";

import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShareIcon from "@mui/icons-material/Share";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import type { Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";
import { visuallyHidden } from "@mui/utils";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

const dealGreen = "#008a05";

const toolbarControlSize = { xs: 36, sm: 40 } as const;

const toolbarIconSx = {
  borderRadius: 1.5,
  width: toolbarControlSize,
  height: toolbarControlSize,
  p: 0,
  flexShrink: 0,
  "&:hover": { bgcolor: "action.selected" },
} as const;

const toolbarGroupSx = {
  alignItems: "center",
  p: 0,
  borderRadius: 1.75,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "action.hover",
  overflow: "hidden",
} as const;

function slotIsHidden(node: HTMLElement) {
  let current: HTMLElement | null = node;
  while (current && current !== document.body) {
    if (current.style.getPropertyValue("display") === "none") {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function shareUrl(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  return new URL(href, window.location.origin).toString();
}

export async function sharePage(href: string) {
  const url = shareUrl(href);
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        url,
        title: typeof document === "undefined" ? undefined : document.title,
      });
      return "shared";
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError"
      ) {
        return "cancelled";
      }
    }
  }
  try {
    if (typeof navigator.clipboard?.writeText === "function") {
      await navigator.clipboard.writeText(url);
      return "copied";
    }
  } catch {
    return "failed";
  }
  return "failed";
}

function ToolbarIconButton({
  label,
  onClick,
  disabled,
  href,
  newTab = false,
  highlight,
  wrapperSx,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  newTab?: boolean;
  highlight?: boolean;
  wrapperSx?: SystemStyleObject<Theme>;
  children: ReactNode;
}) {
  const buttonSx = {
    ...toolbarIconSx,
    ...(highlight ? { color: dealGreen } : null),
  };
  const button = href ? (
    <IconButton
      component="a"
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      aria-label={label}
      disabled={disabled}
      sx={buttonSx}
    >
      {children}
    </IconButton>
  ) : (
    <IconButton aria-label={label} onClick={onClick} disabled={disabled} sx={buttonSx}>
      {children}
    </IconButton>
  );

  return (
    <Tooltip title={label} enterDelay={500} disableTouchListener>
      <Box component="span" sx={{ display: "inline-flex", ...wrapperSx }}>
        {button}
      </Box>
    </Tooltip>
  );
}

export function PhotoModalToolbar({
  href,
  shareStatus,
  onShare,
  onClose,
}: {
  href: string | null;
  shareStatus: "idle" | "copied" | "failed";
  onShare: () => void;
  onClose: () => void;
}) {
  const destinationReady = href !== null;
  const shareLabel =
    shareStatus === "copied"
      ? "Link copied"
      : shareStatus === "failed"
        ? "Share failed"
        : "Share";

  return (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{ alignItems: "center", flexShrink: 0 }}
    >
      <Stack direction="row" spacing={0} sx={toolbarGroupSx}>
        <ToolbarIconButton
          label={shareLabel}
          onClick={onShare}
          disabled={!destinationReady}
          highlight={shareStatus === "copied"}
        >
          <ShareIcon fontSize="small" />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Full screen"
          href={destinationReady && href ? href : undefined}
          disabled={!destinationReady}
          wrapperSx={{ display: { xs: "none", sm: "inline-flex" } }}
        >
          <FullscreenIcon fontSize="small" />
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Open in new tab"
          href={destinationReady && href ? href : undefined}
          newTab
          disabled={!destinationReady}
        >
          <OpenInNewIcon fontSize="small" />
        </ToolbarIconButton>
      </Stack>
      <Divider
        orientation="vertical"
        flexItem
        sx={{ height: toolbarControlSize, alignSelf: "center" }}
      />
      <Tooltip title="Close" enterDelay={500} disableTouchListener>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{
            ...toolbarIconSx,
            bgcolor: "action.hover",
            boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.divider}`,
            "&:hover": {
              bgcolor: "error.dark",
              color: "error.contrastText",
              boxShadow: "none",
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

function RoutedPhotoModalToolbar({
  shareStatus,
  onShareResult,
  onClose,
}: {
  shareStatus: "idle" | "copied" | "failed";
  onShareResult: (result: "copied" | "failed") => void;
  onClose: () => void;
}) {
  const params = useParams<{ ns: string; id: string }>();
  const href = `/accommodation/${params.ns}/${params.id}`;

  return (
    <PhotoModalToolbar
      href={href}
      shareStatus={shareStatus}
      onShare={() => {
        void sharePage(href).then(
          (result) => {
            if (result === "copied" || result === "failed") {
              onShareResult(result);
            }
          },
          () => onShareResult("failed"),
        );
      }}
      onClose={onClose}
    />
  );
}

export function PhotoModal({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const slotRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  useEffect(() => {
    const node = slotRef.current;
    if (!node) {
      return;
    }

    const sync = () => {
      setOpen(!slotIsHidden(node));
    };

    sync();
    const observer = new MutationObserver(sync);
    let current: HTMLElement | null = node;
    while (current && current !== document.body) {
      observer.observe(current, {
        attributes: true,
        attributeFilter: ["style"],
      });
      current = current.parentElement;
    }

    return () => observer.disconnect();
  }, []);

  const close = () => {
    router.back();
  };

  return (
    <Box ref={slotRef}>
      <Dialog
        open={open}
        fullWidth
        maxWidth={false}
        scroll="paper"
        aria-labelledby="accommodation-dialog-title"
        onClose={close}
        slotProps={{
          paper: {
            sx: {
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              m: { xs: 0, sm: "0.75rem" },
              width: {
                xs: "100%",
                sm: "min(100% - 1.5rem, 56rem)",
              },
              maxWidth: { xs: "100%", sm: "56rem" },
              height: {
                xs: "100dvh",
                sm: "calc(100dvh - 1.5rem)",
              },
              maxHeight: {
                xs: "100dvh",
                sm: "calc(100dvh - 1.5rem)",
              },
              borderRadius: { xs: 0, sm: 2 },
            },
          },
        }}
      >
        <DialogTitle
          id="accommodation-dialog-title"
          component="div"
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: { xs: 0.75, sm: 2 },
            flexShrink: 0,
            py: { xs: 1, sm: 1.5 },
            px: { xs: 1.25, sm: 2 },
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {title}
          <Suspense
            fallback={
              <PhotoModalToolbar
                href={null}
                shareStatus={shareStatus}
                onShare={() => undefined}
                onClose={close}
              />
            }
          >
            <RoutedPhotoModalToolbar
              shareStatus={shareStatus}
              onShareResult={(result) => setShareStatus(result)}
              onClose={close}
            />
          </Suspense>
        </DialogTitle>
        <Box component="p" sx={visuallyHidden} aria-live="polite">
          {shareStatus === "copied"
            ? "Link copied"
            : shareStatus === "failed"
              ? "Could not share this page"
              : ""}
        </Box>
        <DialogContent
          data-photos-scroller=""
          sx={{
            pt: { xs: 2, sm: 2.5 },
            px: { xs: 1.25, sm: 3 },
            pb: { xs: 2.5, sm: 3 },
            flex: "1 1 auto",
            minHeight: 0,
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            overflowY: "auto",
            overflowX: "hidden",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            "@media (prefers-reduced-motion: reduce)": {
              scrollBehavior: "auto",
            },
          }}
        >
          {children}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
