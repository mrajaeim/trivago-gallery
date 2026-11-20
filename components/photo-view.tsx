import Link from "next/link";
import { notFound } from "next/navigation";
import { CdnImage } from "@/components/cdn-image";
import { PhotoDialogTitle } from "@/components/photo-dialog-title";
import { PhotoKeyboardNav } from "@/components/photo-keyboard-nav";
import { groupTitles } from "@/lib/trivago/gallery-shared";
import {
  accommodationPath,
  decodeImageId,
  fetchAccommodationImages,
  photoDocumentTitle,
  photoPath,
  readRouteNsid,
  type GalleryFailure,
  type GalleryImage,
  type Nsid,
} from "@/lib/trivago/gallery";

function sourceLine(advertisers: string[]) {
  return advertisers.length > 0 ? advertisers.join(", ") : null;
}

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

function NeighborLink({
  href,
  children,
}: {
  href: string | null;
  children: string;
}) {
  if (!href) {
    return (
      <span aria-disabled="true" className="text-sm text-zinc-400 dark:text-zinc-600">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      scroll={false}
      className="text-sm font-medium text-black underline underline-offset-4 dark:text-zinc-50"
    >
      {children}
    </Link>
  );
}

function PhotoBody({
  image,
  position,
  total,
  previousHref,
  nextHref,
  mode,
  nsid,
}: {
  image: GalleryImage;
  position: number;
  total: number;
  previousHref: string | null;
  nextHref: string | null;
  mode: "page" | "modal";
  nsid: Nsid;
}) {
  const Heading = mode === "page" ? "h1" : "h2";
  const source = sourceLine(image.advertisers);
  const titles = groupTitles(image.groups);
  const positionLabel = `Photo ${position} of ${total}`;
  const title = titles.length > 0 ? titles.join(", ") : positionLabel;
  const titleId = `photo-title-${image.imageId.replace(/[^A-Za-z0-9_-]/g, "")}`;

  return (
    <article className="flex flex-col gap-4">
      {mode === "modal" ? (
        <>
          <PhotoKeyboardNav previousHref={previousHref} nextHref={nextHref} />
          <PhotoDialogTitle
            title={
              titles.length > 0
                ? `${titles.join(", ")} · Accommodation ${nsid.ns}/${nsid.id}`
                : photoDocumentTitle(
                    String(nsid.ns),
                    String(nsid.id),
                    image.imageId,
                  )
            }
            titleId={titleId}
          />
        </>
      ) : null}
      <Heading
        id={mode === "modal" ? titleId : undefined}
        className="text-2xl font-semibold tracking-tight"
      >
        {title}
      </Heading>
      {titles.length > 0 ? (
        <p className="-mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {positionLabel}
        </p>
      ) : null}
      <CdnImage
        src={image.srcPhoto}
        width={image.width}
        height={image.height}
        alt=""
        loading="eager"
        className="h-auto w-full rounded-xl object-contain"
      />
      {source ? (
        <p className="text-base text-zinc-600 dark:text-zinc-400">{source}</p>
      ) : null}
      {image.hasSize ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {image.width} × {image.height}
        </p>
      ) : null}
      <nav className="flex items-center justify-between gap-4" aria-label="More photos">
        <NeighborLink href={previousHref}>Previous</NeighborLink>
        <NeighborLink href={nextHref}>Next</NeighborLink>
      </nav>
      {mode === "page" ? (
        <p>
          <Link
            href={accommodationPath(nsid)}
            className="text-sm font-medium text-black underline underline-offset-4 dark:text-zinc-50"
          >
            Back to gallery
          </Link>
        </p>
      ) : null}
    </article>
  );
}

export function PhotoSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <p id="photo-dialog-title" className="text-2xl font-semibold">
        Loading photo
      </p>
      <div
        aria-hidden="true"
        className="aspect-[4/3] animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-900"
      />
    </div>
  );
}

export async function PhotoView({
  params,
  mode,
}: {
  params: Promise<{ ns: string; id: string; imageId: string }>;
  mode: "page" | "modal";
}) {
  const { ns, id, imageId } = await params;
  const nsid = readRouteNsid(ns, id);
  const decodedId = decodeImageId(imageId);
  if (!nsid || !decodedId) {
    notFound();
  }

  const result = await fetchAccommodationImages(nsid);
  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        {result.reason === "missing" ? (
          <p className="rounded-2xl border border-black/8 bg-white p-5 text-zinc-600 dark:border-white/12 dark:bg-zinc-950 dark:text-zinc-400">
            No gallery was returned for this accommodation.
          </p>
        ) : (
          <GalleryAlert failure={result} />
        )}
        {mode === "page" ? (
          <Link
            href={accommodationPath(nsid)}
            className="text-sm font-medium text-black underline underline-offset-4 dark:text-zinc-50"
          >
            Back to gallery
          </Link>
        ) : null}
      </div>
    );
  }

  const index = result.images.findIndex((image) => image.imageId === decodedId);
  const image = result.images[index];
  if (!image) {
    notFound();
  }

  const previous = result.images[index - 1];
  const next = result.images[index + 1];

  return (
    <PhotoBody
      image={image}
      position={index + 1}
      total={result.images.length}
      previousHref={previous ? photoPath(nsid, previous.imageId) : null}
      nextHref={next ? photoPath(nsid, next.imageId) : null}
      mode={mode}
      nsid={nsid}
    />
  );
}
