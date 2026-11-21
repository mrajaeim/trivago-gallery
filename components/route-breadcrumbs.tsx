import { notFound } from "next/navigation";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { accommodationLabel } from "@/lib/trivago/accommodation-name";
import { readRouteNsid } from "@/lib/trivago/gallery";

export async function AccommodationCrumbs({
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
    <PageBreadcrumbs
      items={[
        { label: "Home", href: "/" },
        { label },
      ]}
    />
  );
}
