import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Accommodation not found
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          That accommodation or photo is not available.
        </p>
        <Link
          href="/"
          className="w-fit text-sm font-medium text-black underline underline-offset-4 dark:text-zinc-50"
        >
          Back to highlights
        </Link>
      </main>
    </div>
  );
}
