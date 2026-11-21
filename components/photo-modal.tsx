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
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

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

  return (
    <Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
      <IconButton
        aria-label={shareStatus === "copied" ? "Link copied" : "Share"}
        onClick={onShare}
        disabled={!destinationReady}
      >
        <ShareIcon />
      </IconButton>
      <IconButton
        aria-label={fullScreen ? "Exit full screen" : "Full screen"}
        onClick={onToggleFullScreen}
      >
        {fullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
      </IconButton>
      {destinationReady ? (
        <IconButton
          component="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in new tab"
        >
          <OpenInNewIcon />
        </IconButton>
      ) : (
        <IconButton aria-label="Open in new tab" disabled>
          <OpenInNewIcon />
        </IconButton>
      )}
      <IconButton aria-label="Close" onClick={onClose} edge="end">
        <CloseIcon />
      </IconButton>
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
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            py: 1,
            px: 2,
          }}
        >
          <Typography id="accommodation-dialog-title" variant="subtitle1" component="p">
            Accommodation
          </Typography>
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
        <DialogContent sx={{ pt: 0, flex: "1 1 auto", overflowY: "auto" }}>
          {children}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
