import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhotoCursor } from "@/components/photo-browser";
import { decodeImageId, photoPageTitle } from "@/lib/trivago/gallery";

export async function generateMetadata({
  params,
}: PageProps<"/accommodation/[ns]/[id]/photos/[imageId]">): Promise<Metadata> {
  const { ns, id, imageId } = await params;
  return {
    title: await photoPageTitle(ns, id, imageId),
  };
}

async function SelectedPhoto({
  params,
}: {
  params: Promise<{ imageId: string }>;
}) {
  const { imageId } = await params;
  const decodedId = decodeImageId(imageId);
  if (!decodedId) {
    notFound();
  }

  return <PhotoCursor imageId={decodedId} />;
}

export default function Page({
  params,
}: PageProps<"/accommodation/[ns]/[id]/photos/[imageId]">) {
  return (
    <Suspense fallback={null}>
      <SelectedPhoto params={params} />
    </Suspense>
  );
}
