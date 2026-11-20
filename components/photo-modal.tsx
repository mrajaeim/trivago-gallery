"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export function PhotoModal({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }

    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  function close() {
    router.back();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="gallery-dialog-title"
      aria-modal="true"
      className="m-auto w-[min(100%-1.5rem,56rem)] max-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-2xl border border-black/10 bg-white p-0 text-black shadow-xl backdrop:bg-black/70 dark:border-white/12 dark:bg-zinc-950 dark:text-zinc-50"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <div className="flex max-h-[calc(100dvh-1.5rem)] flex-col">
        <div className="flex justify-end px-4 pt-4">
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-black/10 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-zinc-900 dark:focus-visible:outline-white"
            onClick={close}
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pb-4">
          {children}
        </div>
      </div>
    </dialog>
  );
}
