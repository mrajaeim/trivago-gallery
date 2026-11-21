import { Suspense } from "react";
import Stack from "@mui/material/Stack";
import { notFound } from "next/navigation";
import { GallerySection, GallerySkeleton } from "@/components/gallery-section";
import { ListingCard, ListingCardSkeleton } from "@/components/listing-card";
import { BreadcrumbFallback } from "@/components/page-breadcrumbs";
import { AccommodationCrumbs } from "@/components/route-breadcrumbs";
import { readRouteNsid } from "@/lib/trivago/gallery";

async function AccommodationDetail({
  params,
  hideTitleInChrome,
}: {
  params: Promise<{ ns: string; id: string }>;
  hideTitleInChrome: boolean;
}) {
  const { ns, id } = await params;
  const nsid = readRouteNsid(ns, id);
  if (!nsid) {
    notFound();
  }

  return (
    <ListingCard
      nsid={nsid}
      linkToGallery={false}
      expanded
      titleComponent="h1"
      hideTitleInChrome={hideTitleInChrome}
    />
  );
}

export function AccommodationView({
  params,
  presentation,
}: {
  params: Promise<{ ns: string; id: string }>;
  presentation: "page" | "modal";
}) {
  return (
    <Stack spacing={presentation === "modal" ? { xs: 2.5, sm: 5 } : 5} sx={{ minWidth: 0, width: "100%" }}>
      {presentation === "page" ? (
        <Suspense fallback={<BreadcrumbFallback />}>
          <AccommodationCrumbs params={params} />
        </Suspense>
      ) : null}
      <Suspense fallback={<ListingCardSkeleton expanded />}>
        <AccommodationDetail
          params={params}
          hideTitleInChrome={presentation === "modal"}
        />
      </Suspense>
      <Suspense fallback={<GallerySkeleton />}>
        <GallerySection params={params} />
      </Suspense>
    </Stack>
  );
}
