import type { Nsid } from "@/lib/trivago/highlights";

function readOpenGraphTitle(html: string): string | null {
  const match =
    html.match(/property="og:title" content="([^"]+)"/) ??
    html.match(/content="([^"]+)" property="og:title"/);
  const raw = match?.[1]?.trim();
  if (!raw) {
    return null;
  }

  return raw.replace(/\s*[|·].*$/u, "").trim() || null;
}

export async function fetchAccommodationDisplayName(
  nsid: Nsid,
): Promise<string | null> {
  "use cache";

  try {
    const response = await fetch(
      `https://www.trivago.com/en-US/odr/?search=${nsid.ns}-${nsid.id}`,
      {
        headers: { "accept-language": "en-US,en;q=0.9" },
      },
    );

    if (!response.ok) {
      return null;
    }

    return readOpenGraphTitle(await response.text());
  } catch {
    return null;
  }
}

export function accommodationFallbackLabel(nsid: Nsid): string {
  return `${nsid.ns}/${nsid.id}`;
}

export async function accommodationLabel(nsid: Nsid): Promise<string> {
  const name = await fetchAccommodationDisplayName(nsid);
  return name ?? accommodationFallbackLabel(nsid);
}