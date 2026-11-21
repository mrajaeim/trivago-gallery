import type { Metadata } from "next";
import Container from "@mui/material/Container";
import { AccommodationView } from "@/components/accommodation-view";
import { accommodationLabel } from "@/lib/trivago/accommodation-name";
import { readRouteNsid } from "@/lib/trivago/gallery";

const pageSx = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
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
    description: `Details and photos for ${label}.`,
  };
}

export default function Page({
  params,
}: PageProps<"/accommodation/[ns]/[id]">) {
  return (
    <Container component="main" maxWidth={false} sx={pageSx}>
      <AccommodationView params={params} presentation="page" />
    </Container>
  );
}
