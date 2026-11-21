import { Suspense } from "react";
import {
  AccommodationDialogHeading,
  AccommodationDialogTitle,
} from "@/components/accommodation-dialog-title";
import { AccommodationView } from "@/components/accommodation-view";
import { PhotoModal } from "@/components/photo-modal";

export default function Page({
  params,
}: PageProps<"/accommodation/[ns]/[id]">) {
  return (
    <PhotoModal
      title={
        <Suspense fallback={<AccommodationDialogHeading title="Accommodation" />}>
          <AccommodationDialogTitle params={params} />
        </Suspense>
      }
    >
      <AccommodationView params={params} presentation="modal" />
    </PhotoModal>
  );
}
