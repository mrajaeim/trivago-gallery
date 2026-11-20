import { Suspense } from "react";
import type { Metadata } from "next";
import { PhotoSkeleton, PhotoView } from "@/components/photo-view";
import { photoPageTitle } from "@/lib/trivago/gallery";

export async function generateMetadata({
  params,
}: PageProps<"/accommodation/[ns]/[id]/photos/[imageId]">): Promise<Metadata> {
  const { ns, id, imageId } = await params;
  return {
    title: await photoPageTitle(ns, id, imageId),
  };
}

export default function Page({
  params,
}: PageProps<"/accommodation/[ns]/[id]/photos/[imageId]">) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-16">
        <Suspense fallback={<PhotoSkeleton />}>
          <PhotoView params={params} mode="page" />
        </Suspense>
      </main>
    </div>
  );
}
