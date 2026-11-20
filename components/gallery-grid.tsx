"use client";

import Link from "next/link";
import { useState } from "react";
import { CdnImage } from "@/components/cdn-image";
import {
  groupLabel,
  groupTitles,
  photoPath,
  type GalleryGroupCount,
  type GalleryTile,
} from "@/lib/trivago/gallery-shared";

function groupKey(group: { ns: number; id: number }) {
  return `${group.ns}:${group.id}`;
}

function sourceLine(advertisers: string[]) {
  return advertisers.length > 0 ? advertisers.join(", ") : null;
}

export function GalleryGrid({
  images,
  groups,
  totalImageCount,
  partial,
  ns,
  id,
}: {
  images: GalleryTile[];
  groups: GalleryGroupCount[];
  totalImageCount: number;
  partial: boolean;
  ns: number;
  id: number;
}) {
  const [filter, setFilter] = useState("all");
  const visible =
    filter === "all"
      ? images
      : images.filter((image) =>
          image.groups.some((group) => groupKey(group) === filter),
        );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Photo groups">
        <button
          type="button"
          aria-pressed={filter === "all"}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-black/10 dark:ring-white/15 ${
            filter === "all"
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          }`}
          onClick={() => setFilter("all")}
        >
          All · {totalImageCount}
        </button>
        {groups.map((group) => {
          const key = groupKey(group);
          const selected = filter === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-black/10 dark:ring-white/15 ${
                selected
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              }`}
              onClick={() => setFilter(key)}
            >
              {groupLabel(group.ns, group.id)} · {group.imageCount}
            </button>
          );
        })}
      </div>
      {partial ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Showing the first {images.length} of {totalImageCount} photos.
        </p>
      ) : null}
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-black/8 bg-white p-5 text-zinc-600 dark:border-white/12 dark:bg-zinc-950 dark:text-zinc-400">
          No photos in this group were in the loaded page.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((image) => {
            const source = sourceLine(image.advertisers);
            const position =
              images.findIndex((item) => item.imageId === image.imageId) + 1;
            const titles = groupTitles(image.groups);
            const subject = titles.length > 0 ? `${titles.join(", ")} ` : "";
            const label = `Open ${subject}photo ${position}${source ? `, ${source}` : ""}`;
            return (
              <li key={image.imageId}>
                <Link
                  href={photoPath(ns, id, image.imageId)}
                  scroll={false}
                  aria-label={label}
                  className="block overflow-hidden rounded-2xl ring-1 ring-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:ring-white/15 dark:focus-visible:outline-white"
                >
                  <CdnImage
                    src={image.src}
                    width={image.width}
                    height={image.height}
                    alt=""
                    className="h-auto w-full object-cover"
                  />
                  {!image.src && source ? (
                    <span className="block px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {source}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
