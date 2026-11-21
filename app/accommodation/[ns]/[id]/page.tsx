import { Suspense } from "react";
import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { notFound } from "next/navigation";
import {
  GallerySection,
  GallerySkeleton,
} from "@/components/gallery-section";
import {
  AccommodationHighlightsFallback,
  HighlightsSection,
  HighlightsSectionHeader,
} from "@/components/highlights-section";
import { accommodationLabel } from "@/lib/trivago/accommodation-name";
import { readRouteNsid } from "@/lib/trivago/gallery";

const pageSx = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  width: "100%",
  maxWidth: "72rem",
  mx: "auto",
  px: 3,
  py: 8,
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/accommodation/[ns]/[id]">): Promise<Metadata> {
  const { ns, id } = await params;
  const nsid = readRouteNsid(ns, id);
  const label = nsid ? await accommodationLabel(nsid) : `${ns}/${id}`;
  return {
    title: label,
    description: `Photos and accommodation details for ${label}.`,
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

  const displayName = await accommodationLabel(nsid);

  return (
    <Stack component="section" spacing={2.5} id="accommodation" aria-labelledby="accommodation-intro">
      <HighlightsSectionHeader context="accommodation" displayName={displayName} />
      <HighlightsSection nsid={nsid} />
    </Stack>
  );
}

export default function Page({
  params,
}: PageProps<"/accommodation/[ns]/[id]">) {
  return (
    <Container component="main" maxWidth={false} sx={pageSx}>
      <Suspense fallback={<GallerySkeleton />}>
        <GallerySection params={params} presentation="page" />
      </Suspense>
      <Divider sx={{ borderStyle: "dashed" }} />
      <Suspense fallback={<AccommodationHighlightsFallback />}>
        <HighlightsForAccommodation params={params} />
      </Suspense>
    </Container>
  );
}
