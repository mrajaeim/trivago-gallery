import { Suspense, type ReactNode } from "react";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { notFound } from "next/navigation";
import { PhotoTrail } from "@/components/page-breadcrumbs";
import {
  PhotoGalleryProvider,
  PhotoRouteFallback,
  type BrowserPhoto,
} from "@/components/photo-browser";
import { PhotoGalleryNotice } from "@/components/photo-view";
import { accommodationLabel } from "@/lib/trivago/accommodation-name";
import { fetchAccommodationImages, readRouteNsid } from "@/lib/trivago/gallery";
import { accommodationPath } from "@/lib/trivago/gallery-shared";

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

  const [result, label] = await Promise.all([
    fetchAccommodationImages(nsid),
    accommodationLabel(nsid),
  ]);
  const trail = (
    <PhotoTrail
      label={label}
      href={accommodationPath(nsid.ns, nsid.id)}
    />
  );

  if (!result.ok) {
    return (
      <PhotoGalleryNotice failure={result} nsid={nsid}>
        {trail}
      </PhotoGalleryNotice>
    );
  }

  const images: BrowserPhoto[] = result.images.map((image) => ({
    imageId: image.imageId,
    size: image.size,
    advertisers: image.advertisers,
    groups: image.groups,
    srcPhoto: image.srcPhoto,
  }));

  return (
    <Stack spacing={2}>
      {trail}
      <PhotoGalleryProvider images={images} ns={nsid.ns} id={nsid.id}>
        {children}
      </PhotoGalleryProvider>
    </Stack>
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
