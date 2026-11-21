import {
  HighlightsSectionHeader,
  HighlightsSectionHeaderSkeleton,
} from "@/components/highlights-section";
import { accommodationLabel } from "@/lib/trivago/accommodation-name";
import { SAMPLE_ACCOMMODATION } from "@/lib/trivago/highlights";
import { Suspense } from "react";

async function HomeAccommodationIntroBody() {
  const displayName = await accommodationLabel(SAMPLE_ACCOMMODATION);
  return <HighlightsSectionHeader context="home" displayName={displayName} />;
}

export function HomeAccommodationIntro() {
  return (
    <Suspense fallback={<HighlightsSectionHeaderSkeleton context="home" />}>
      <HomeAccommodationIntroBody />
    </Suspense>
  );
}