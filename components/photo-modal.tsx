"use client";

import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
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
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

const dealGreen = "#008a05";

const toolbarIconSx = {
  borderRadius: 1.5,
  "&:hover": { bgcolor: "action.selected" },
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
  highlight,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  highlight?: boolean;
  children: ReactNode;
}) {
  const button = href ? (
    <IconButton
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      disabled={disabled}
      sx={{
        ...toolbarIconSx,
        ...(highlight ? { color: dealGreen } : null),
      }}
    >
      {children}
    </IconButton>
  ) : (
    <IconButton
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      sx={{
        ...toolbarIconSx,
        ...(highlight ? { color: dealGreen } : null),
      }}
    >
      {children}
    </IconButton>
  );

  return (
    <Tooltip title={label} enterDelay={500}>
      <span>{button}</span>
    </Tooltip>
  );
}

function AccommodationDialogHeading() {
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const node = document.getElementById("accommodation-title");
      const next = node?.textContent?.trim() ?? null;
      setTitle(next && next.length > 0 ? next : null);
    };

    sync();
    const node = document.getElementById("accommodation-title");
    const observer = new MutationObserver(sync);
    if (node) {
      observer.observe(node, { childList: true, subtree: true, characterData: true });
    }

    return () => observer.disconnect();
  }, []);

  const displayTitle = title ?? "Accommodation";

  return (
    <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1, pr: 1 }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ lineHeight: 1.1, letterSpacing: "0.08em" }}
      >
        Hotel gallery
      </Typography>
      <Typography
        id="accommodation-dialog-title"
        variant="subtitle1"
        component="p"
        title={displayTitle}
        sx={{
          fontWeight: 700,
          lineHeight: 1.25,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {displayTitle}
      </Typography>
    </Stack>
  );
}

export function PhotoModalToolbar({
  href,
  fullScreen,
  shareStatus,
  onShare,
  onToggleFullScreen,
  onClose,
}: {
  href: string | null;
  fullScreen: boolean;
  shareStatus: "idle" | "copied" | "failed";
  onShare: () => void;
  onToggleFullScreen: () => void;
  onClose: () => void;
}) {
  const destinationReady = href !== null;
  const shareLabel =
    shareStatus === "copied"
      ? "Link copied"
      : shareStatus === "failed"
        ? "Share failed"
        : "Share";
  const fullScreenLabel = fullScreen ? "Exit full screen" : "Full screen";

  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexShrink: 0 }}>
      <Stack
        direction="row"
        spacing={0.25}
        sx={{
          alignItems: "center",
          p: 0.25,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "action.hover",
        }}
      >
        <ToolbarIconButton
          label={shareLabel}
          onClick={onShare}
          disabled={!destinationReady}
          highlight={shareStatus === "copied"}
        >
          <ShareIcon fontSize="small" />
        </ToolbarIconButton>
        <ToolbarIconButton label={fullScreenLabel} onClick={onToggleFullScreen}>
          {fullScreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
        </ToolbarIconButton>
        <ToolbarIconButton
          label="Open in new tab"
          href={destinationReady ? href : undefined}
          disabled={!destinationReady}
        >
          <OpenInNewIcon fontSize="small" />
        </ToolbarIconButton>
      </Stack>
      <Divider orientation="vertical" flexItem sx={{ height: 32, alignSelf: "center" }} />
      <Tooltip title="Close" enterDelay={500}>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{
            borderRadius: 1.5,
            bgcolor: "action.hover",
            "&:hover": { bgcolor: "error.dark", color: "error.contrastText" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

function RoutedPhotoModalToolbar({
  fullScreen,
  shareStatus,
  onShareResult,
  onToggleFullScreen,
  onClose,
}: {
  fullScreen: boolean;
  shareStatus: "idle" | "copied" | "failed";
  onShareResult: (result: "copied" | "failed") => void;
  onToggleFullScreen: () => void;
  onClose: () => void;
}) {
  const params = useParams<{ ns: string; id: string }>();
  const href = `/accommodation/${params.ns}/${params.id}`;

  return (
    <PhotoModalToolbar
      href={href}
      fullScreen={fullScreen}
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
      onToggleFullScreen={onToggleFullScreen}
      onClose={onClose}
    />
  );
}

export function PhotoModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const slotRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
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
        fullScreen={fullScreen}
        fullWidth
        maxWidth={false}
        scroll="paper"
        aria-labelledby="accommodation-dialog-title"
        onClose={close}
        slotProps={{
          paper: {
            sx: fullScreen
              ? {
                  m: 0,
                  width: "100%",
                  maxWidth: "100%",
                  height: "100%",
                  maxHeight: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  borderRadius: 0,
                }
              : {
                  width: "min(100% - 1.5rem, 56rem)",
                  maxWidth: "56rem",
                  height: "calc(100dvh - 1.5rem)",
                  maxHeight: "calc(100dvh - 1.5rem)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                },
          },
        }}
      >
        <DialogTitle
          component="div"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: { xs: 1, sm: 2 },
            flexShrink: 0,
            py: { xs: 1.25, sm: 1.5 },
            px: { xs: 1.5, sm: 2 },
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <AccommodationDialogHeading />
          <Suspense
            fallback={
              <PhotoModalToolbar
                href={null}
                fullScreen={fullScreen}
                shareStatus={shareStatus}
                onShare={() => undefined}
                onToggleFullScreen={() => setFullScreen((current) => !current)}
                onClose={close}
              />
            }
          >
            <RoutedPhotoModalToolbar
              fullScreen={fullScreen}
              shareStatus={shareStatus}
              onShareResult={(result) => setShareStatus(result)}
              onToggleFullScreen={() => setFullScreen((current) => !current)}
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
            pt: 0,
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            scrollBehavior: "smooth",
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
