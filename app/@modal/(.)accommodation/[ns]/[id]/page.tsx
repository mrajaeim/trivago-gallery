import { AccommodationView } from "@/components/accommodation-view";
import { PhotoModal } from "@/components/photo-modal";

export default function Page({
  params,
}: PageProps<"/accommodation/[ns]/[id]">) {
  return (
    <PhotoModal>
      <AccommodationView params={params} presentation="modal" />
    </PhotoModal>
  );
}
