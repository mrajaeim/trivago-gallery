import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryGrid } from "@/components/gallery-grid";
import {
  fetchAccommodationImageCount,
  fetchAccommodationImages,
  readRouteNsid,
  type GalleryFailure,
} from "@/lib/trivago/gallery";

function GalleryAlert({ failure }: { failure: GalleryFailure }) {
  const status =
    failure.status === null ? "No HTTP response" : `HTTP ${failure.status}`;

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
    >
      <h2 className="text-lg font-semibold">Gallery request failed</h2>
      <p>
        This was a live request to trivago with no session cookies. {status}.
      </p>
      <ul className="list-disc pl-5">
        {failure.messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

export function GallerySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <h1
        id="gallery-dialog-title"
        className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50"
      >
        Photos
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading photos</p>
      <div className="h-10 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-900" aria-hidden="true" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-hidden="true">
        {["a", "b", "c", "d", "e", "f", "g", "h"].map((key) => (
          <div
            key={key}
            className="aspect-[4/3] animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-900"
          />
        ))}
      </div>
    </div>
  );
}

export async function GallerySection({
  params,
}: {
  params: Promise<{ ns: string; id: string }>;
}) {
  const { ns, id } = await params;
  const nsid = readRouteNsid(ns, id);
  if (!nsid) {
    notFound();
  }

  const [imagesResult, countResult] = await Promise.all([
    fetchAccommodationImages(nsid),
    fetchAccommodationImageCount(nsid),
  ]);

  const totalImageCount = countResult.ok ? countResult.totalImageCount : null;
  const partial =
    imagesResult.ok &&
    totalImageCount !== null &&
    imagesResult.images.length < totalImageCount;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 underline underline-offset-4 dark:text-zinc-400"
          >
            Highlights
          </Link>
        </p>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Accommodation {nsid.ns}/{nsid.id}
        </p>
        <h1
          id="gallery-dialog-title"
          className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50"
        >
          Photos
        </h1>
        {imagesResult.ok && totalImageCount !== null ? (
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {partial
              ? `${totalImageCount} photos, ${imagesResult.images.length} loaded.`
              : `${totalImageCount} photos.`}
          </p>
        ) : null}
        {imagesResult.ok && !countResult.ok ? (
          <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p>The photo total could not be loaded.</p>
            <ul className="list-disc pl-5">
              {countResult.messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>
      {!imagesResult.ok && imagesResult.reason === "missing" ? (
        <p className="rounded-2xl border border-black/8 bg-white p-5 text-zinc-600 dark:border-white/12 dark:bg-zinc-950 dark:text-zinc-400">
          No gallery was returned for this accommodation.
        </p>
      ) : null}
      {!imagesResult.ok && imagesResult.reason === "error" ? (
        <GalleryAlert failure={imagesResult} />
      ) : null}
      {imagesResult.ok && imagesResult.images.length === 0 ? (
        <div className="flex flex-col gap-2">
          <p className="rounded-2xl border border-black/8 bg-white p-5 text-zinc-600 dark:border-white/12 dark:bg-zinc-950 dark:text-zinc-400">
            No photos were returned for this accommodation.
          </p>
          {totalImageCount !== null && totalImageCount > 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              The gallery total is {totalImageCount}.
            </p>
          ) : null}
        </div>
      ) : null}
      {imagesResult.ok && imagesResult.images.length > 0 ? (
        <GalleryGrid
          images={imagesResult.images.map((image) => ({
            imageId: image.imageId,
            width: image.width,
            height: image.height,
            advertisers: image.advertisers,
            groups: image.groups,
            src: image.srcTile,
          }))}
          groups={countResult.ok ? countResult.groups : []}
          totalImageCount={totalImageCount ?? imagesResult.images.length}
          partial={partial}
          ns={nsid.ns}
          id={nsid.id}
        />
      ) : null}
    </section>
  );
}
