import { Suspense } from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { GallerySection, GallerySkeleton } from "@/components/gallery-section";
import { ListingCard, ListingCardSkeleton } from "@/components/listing-card";
import { AppLink } from "@/components/next-link";
import { accommodationLabel } from "@/lib/trivago/accommodation-name";
import { readRouteNsid } from "@/lib/trivago/gallery";

async function AccommodationBreadcrumb({
  params,
}: {
  params: Promise<{ ns: string; id: string }>;
}) {
  const { ns, id } = await params;
  const nsid = readRouteNsid(ns, id);
  if (!nsid) {
    notFound();
  }

  const label = await accommodationLabel(nsid);

  return (
    <Breadcrumbs aria-label="Breadcrumb">
      <AppLink href="/" underline="hover" color="inherit">
        Home
      </AppLink>
      <Typography color="text.primary">{label}</Typography>
    </Breadcrumbs>
  );
}

async function AccommodationDetail({
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
    <ListingCard nsid={nsid} linkToGallery={false} expanded titleComponent="h1" />
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
    <Stack spacing={5}>
      {presentation === "page" ? (
        <Suspense fallback={<Skeleton variant="text" width={180} />}>
          <AccommodationBreadcrumb params={params} />
        </Suspense>
      ) : null}
      <Suspense fallback={<ListingCardSkeleton />}>
        <AccommodationDetail params={params} />
      </Suspense>
      <Suspense fallback={<GallerySkeleton />}>
        <GallerySection params={params} />
      </Suspense>
    </Stack>
  );
}
