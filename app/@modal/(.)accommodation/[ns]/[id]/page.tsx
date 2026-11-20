import { Suspense } from "react";
import { GallerySection, GallerySkeleton } from "@/components/gallery-section";
import { PhotoModal } from "@/components/photo-modal";

export default function Page({
  params,
}: PageProps<"/accommodation/[ns]/[id]">) {
  return (
    <PhotoModal>
      <Suspense fallback={<GallerySkeleton />}>
        <GallerySection params={params} />
      </Suspense>
    </PhotoModal>
  );
}
