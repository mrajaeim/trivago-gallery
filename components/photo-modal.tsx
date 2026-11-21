"use client";

import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

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

export function PhotoModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const slotRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);

  // The intercepted slot stays mounted and is hidden with display:none.
  // The dialog is portaled to document.body, so it follows that visibility.
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
        aria-labelledby="gallery-dialog-title"
        onClose={close}
        slotProps={{
          paper: {
            sx: {
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
          <Typography variant="body2" color="text.secondary">
            Close gallery
          </Typography>
          <IconButton aria-label="Close gallery" onClick={close} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0, flex: "1 1 auto", overflowY: "auto" }}>
          {children}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
