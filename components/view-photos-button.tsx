"use client";

import Button from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import type { MouseEvent } from "react";

function photosScroller(photos: HTMLElement): HTMLElement | null {
  const marked = photos.closest("[data-photos-scroller]");
  if (marked instanceof HTMLElement) {
    return marked;
  }

  let current = photos.parentElement;
  while (current && current !== document.documentElement) {
    const { overflowY } = getComputedStyle(current);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      current.scrollHeight > current.clientHeight + 1
    ) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

export function scrollPhotosIntoView(photos: HTMLElement) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
  const scroller = photosScroller(photos);

  if (scroller) {
    const top =
      photos.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop;
    scroller.scrollTo({ top, behavior });
    return;
  }

  photos.scrollIntoView({ behavior, block: "start" });
}

function photosTarget(from: HTMLElement): HTMLElement | null {
  const dialog = from.closest("[role='dialog']");
  if (dialog instanceof HTMLElement) {
    return dialog.querySelector("#photos");
  }
  return document.getElementById("photos");
}

export function ViewPhotosButton({ sx }: { sx: SxProps<Theme> }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const photos = photosTarget(event.currentTarget);
    if (!photos) {
      return;
    }

    event.preventDefault();
    scrollPhotosIntoView(photos);
  };

  return (
    <Button
      component="a"
      href="#photos"
      variant="contained"
      disableElevation
      sx={sx}
      onClick={onClick}
    >
      View photos
    </Button>
  );
}
