import Link from "next/link";
import { CdnImage } from "@/components/cdn-image";
import { accommodationPath } from "@/lib/trivago/gallery-shared";
import {
  fetchAccommodationHighlights,
  type HighlightView,
  type Nsid,
} from "@/lib/trivago/highlights";

function sentimentLabel(sentiment: HighlightView["sentiment"]) {
  if (sentiment === "POSITIVE") {
    return "Positive";
  }
  if (sentiment === "NEGATIVE") {
    return "Caution";
  }
  return "Neutral";
}

function sentimentClass(sentiment: HighlightView["sentiment"]) {
  if (sentiment === "POSITIVE") {
    return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
  }
  if (sentiment === "NEGATIVE") {
    return "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
  }
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";
}

function HighlightCard({
  highlight,
  nsid,
}: {
  highlight: HighlightView;
  nsid: Nsid;
}) {
  return (
    <Link
      href={accommodationPath(nsid.ns, nsid.id)}
      scroll={false}
      className="flex flex-col gap-3 rounded-2xl border border-black/8 bg-white p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:border-white/12 dark:bg-zinc-950 dark:focus-visible:outline-white"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          {highlight.title}
        </h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${sentimentClass(highlight.sentiment)}`}
        >
          {sentimentLabel(highlight.sentiment)}
        </span>
      </div>
      {highlight.imageSrc ? (
        <CdnImage
          src={highlight.imageSrc}
          width={16}
          height={10}
          alt=""
          className="h-auto w-full rounded-xl object-cover"
        />
      ) : null}
      <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
        {highlight.description}
      </p>
      <p className="text-sm font-medium text-black dark:text-zinc-50">Photos</p>
    </Link>
  );
}

export function HighlightsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {["one", "two", "three"].map((key) => (
        <div
          key={key}
          className="h-32 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-900"
        />
      ))}
    </div>
  );
}

export async function HighlightsSection({ nsid }: { nsid: Nsid }) {
  const result = await fetchAccommodationHighlights(nsid);

  if (!result.ok) {
    const status =
      result.status === null ? "No HTTP response" : `HTTP ${result.status}`;

    return (
      <div
        role="alert"
        className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
      >
        <h2 className="text-lg font-semibold">Highlights request failed</h2>
        <p>
          This was a live request to trivago with no session cookies. {status}.
        </p>
        <ul className="list-disc pl-5">
          {result.messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (result.highlights.length === 0) {
    return (
      <p className="rounded-2xl border border-black/8 bg-white p-5 text-zinc-600 dark:border-white/12 dark:bg-zinc-950 dark:text-zinc-400">
        No highlights were returned for this accommodation.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Live request succeeded. {result.highlights.length} highlights.
      </p>
      {result.highlights.map((highlight) => (
        <HighlightCard key={highlight.id} highlight={highlight} nsid={nsid} />
      ))}
    </div>
  );
}
