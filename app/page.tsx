import { Suspense } from "react";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { HomeAccommodationIntro } from "@/components/home-accommodation-intro";
import { HighlightsSection, HighlightsSkeleton } from "@/components/highlights-section";
import { SAMPLE_ACCOMMODATION } from "@/lib/trivago/highlights";

const pageSx = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  width: "100%",
  maxWidth: "48rem",
  mx: "auto",
  px: 3,
  py: 8,
} as const;

export default function Home() {
  return (
    <Container component="main" maxWidth={false} sx={pageSx}>
      <Stack component="header" spacing={1.5}>
        <Typography variant="h4" component="h1">
          trivago gallery
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: "36rem" }}>
          A Next.js example for trivago. Choosing an accommodation opens the photo
          gallery with an intercepting route, so this page stays behind it.
          Opening the accommodation URL directly shows the same gallery through
          a parallel route. The gallery loads lazily in Suspense and does not
          block the rest of the page.
        </Typography>
      </Stack>
      <Stack component="section" spacing={2.5} aria-labelledby="accommodation-intro">
        <HomeAccommodationIntro />
        <Suspense fallback={<HighlightsSkeleton />}>
          <HighlightsSection nsid={SAMPLE_ACCOMMODATION} />
        </Suspense>
      </Stack>
    </Container>
  );
}
