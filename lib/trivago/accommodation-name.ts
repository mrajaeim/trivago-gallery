import type { Nsid } from "@/lib/trivago/highlights";
import { fetchAccommodationProfile } from "@/lib/trivago/profile";

export async function fetchAccommodationDisplayName(
  nsid: Nsid,
): Promise<string | null> {
  const profile = await fetchAccommodationProfile(nsid);
  return profile?.name ?? null;
}

export function accommodationFallbackLabel(nsid: Nsid): string {
  return `${nsid.ns}/${nsid.id}`;
}

export async function accommodationLabel(nsid: Nsid): Promise<string> {
  const name = await fetchAccommodationDisplayName(nsid);
  return name ?? accommodationFallbackLabel(nsid);
}