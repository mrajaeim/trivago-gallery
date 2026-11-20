import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  GallerySection,
  GallerySkeleton,
} from "@/components/gallery-section";
import {
  HighlightsSection,
  HighlightsSkeleton,
} from "@/components/highlights-section";
import { readRouteNsid } from "@/lib/trivago/gallery";

export async function generateMetadata({
  params,
}: PageProps<"/accommodation/[ns]/[id]">): Promise<Metadata> {
  const { ns, id } = await params;
  return {
    title: `Accommodation ${ns}/${id}`,
    description: `Photos and highlights for accommodation ${ns}/${id}.`,
  };
}

async function HighlightsForAccommodation({
  params,
}: {
  params: Promise<{ ns: string; id: string }>;
}) {
  const { ns, id } = await params;
  const nsid = readRouteNsid(ns, id);
  if (!nsid) {
    notFound();
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Highlights
      </h2>
      <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
        Descriptions are AI-generated and are not independently verified facts
        about the property.
      </p>
      <HighlightsSection nsid={nsid} />
    </section>
  );
}

export default function Page({
  params,
}: PageProps<"/accommodation/[ns]/[id]">) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-16">
        <Suspense fallback={<GallerySkeleton />}>
          <GallerySection params={params} />
        </Suspense>
        <Suspense fallback={<HighlightsSkeleton />}>
          <HighlightsForAccommodation params={params} />
        </Suspense>
      </main>
    </div>
  );
}
