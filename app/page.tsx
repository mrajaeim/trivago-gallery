import { Suspense } from "react";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ListingCard, ListingCardSkeleton } from "@/components/listing-card";
import { HomeCrumbs } from "@/components/page-breadcrumbs";
import { SAMPLE_ACCOMMODATION } from "@/lib/trivago/highlights";

const pageSx = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  width: "100%",
  maxWidth: "72rem",
  mx: "auto",
  px: 3,
  py: 8,
} as const;

export default function Home() {
  return (
    <Container component="main" maxWidth={false} sx={pageSx}>
      <HomeCrumbs />
      <Stack component="header" spacing={1.5}>
        <Typography variant="h4" component="h1">
          trivago gallery
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: "40rem" }}>
          Hotel details and photos for the sample stay, using the same fields
          trivago publishes for this property.
        </Typography>
      </Stack>
      <Suspense fallback={<ListingCardSkeleton />}>
        <ListingCard nsid={SAMPLE_ACCOMMODATION} linkToGallery />
      </Suspense>
    </Container>
  );
}
