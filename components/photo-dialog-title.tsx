"use client";

import { useEffect } from "react";

export function PhotoDialogTitle({
  title,
  titleId,
}: {
  title: string;
  titleId: string;
}) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const dialog = document.querySelector("dialog");
    if (dialog) {
      dialog.setAttribute("aria-labelledby", titleId);
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, titleId]);

  return null;
}
