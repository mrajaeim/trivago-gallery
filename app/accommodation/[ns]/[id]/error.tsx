"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Something went wrong
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          The accommodation page could not be shown.
        </p>
        <button
          type="button"
          className="w-fit rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          onClick={() => retry()}
        >
          Try again
        </button>
      </main>
    </div>
  );
}
