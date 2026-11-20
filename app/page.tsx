import { Suspense } from "react";
import {
  HighlightsSection,
  HighlightsSkeleton,
} from "@/components/highlights-section";
import { SAMPLE_ACCOMMODATION } from "@/lib/trivago/highlights";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Accommodation {SAMPLE_ACCOMMODATION.ns}/{SAMPLE_ACCOMMODATION.id}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Highlights
          </h1>
          <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Descriptions are AI-generated and are not independently verified
            facts about the property.
          </p>
        </header>
        <Suspense fallback={<HighlightsSkeleton />}>
          <HighlightsSection nsid={SAMPLE_ACCOMMODATION} />
        </Suspense>
      </main>
    </div>
  );
}
