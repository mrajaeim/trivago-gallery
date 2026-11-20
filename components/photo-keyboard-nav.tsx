"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PhotoKeyboardNav({
  previousHref,
  nextHref,
}: {
  previousHref: string | null;
  nextHref: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      const href =
        event.key === "ArrowLeft"
          ? previousHref
          : event.key === "ArrowRight"
            ? nextHref
            : null;
      if (!href) {
        return;
      }

      event.preventDefault();
      router.push(href, { scroll: false });
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextHref, previousHref, router]);

  return null;
}
