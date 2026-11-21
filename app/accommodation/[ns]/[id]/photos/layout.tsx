import { Suspense, type ReactNode } from "react";
import Container from "@mui/material/Container";
import { notFound } from "next/navigation";
import {
  PhotoGalleryProvider,
  PhotoRouteFallback,
  type BrowserPhoto,
} from "@/components/photo-browser";
import { PhotoGalleryNotice } from "@/components/photo-view";
import { fetchAccommodationImages, readRouteNsid } from "@/lib/trivago/gallery";

const pageSx = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  width: "100%",
  maxWidth: "56rem",
  mx: "auto",
  px: 3,
  py: 8,
} as const;

async function PhotoGallery({
  params,
  children,
}: {
  params: Promise<{ ns: string; id: string }>;
  children: ReactNode;
}) {
  const { ns, id } = await params;
  const nsid = readRouteNsid(ns, id);
  if (!nsid) {
    notFound();
  }

  const result = await fetchAccommodationImages(nsid);
  if (!result.ok) {
    return <PhotoGalleryNotice failure={result} nsid={nsid} />;
  }

  const images: BrowserPhoto[] = result.images.map((image) => ({
    imageId: image.imageId,
    size: image.size,
    advertisers: image.advertisers,
    groups: image.groups,
    srcPhoto: image.srcPhoto,
  }));

  return (
    <PhotoGalleryProvider images={images} ns={nsid.ns} id={nsid.id}>
      {children}
    </PhotoGalleryProvider>
  );
}

export default function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ ns: string; id: string }>;
}) {
  return (
    <Container component="main" maxWidth={false} sx={pageSx}>
      <Suspense fallback={<PhotoRouteFallback />}>
        <PhotoGallery params={params}>{children}</PhotoGallery>
      </Suspense>
    </Container>
  );
}
