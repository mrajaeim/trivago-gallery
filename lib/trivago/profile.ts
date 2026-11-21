import type { Nsid } from "@/lib/trivago/highlights";

export type AccommodationProfile = {
  name: string;
  imageSrc: string | null;
  streetAddress: string | null;
  locality: string | null;
  postalCode: string | null;
  country: string | null;
  stars: number | null;
  ratingValue: number | null;
  ratingCount: number | null;
  ratingLabel: string | null;
  priceAmount: number | null;
  pricePeriod: "night" | "stay" | null;
  checkIn: string | null;
  checkOut: string | null;
  summary: string | null;
  amenities: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function ratingLabelFor(value: number): string | null {
  if (value >= 8.5) {
    return "Excellent";
  }
  if (value >= 8) {
    return "Very good";
  }
  if (value >= 7) {
    return "Good";
  }
  return null;
}

export function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function ratingsCountLabel(count: number): string {
  if (count >= 1000) {
    return `${Math.round(count / 1000)}k ratings`;
  }
  return `${count.toLocaleString("en-US")} ratings`;
}

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

function findHotel(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findHotel(item);
      if (found) {
        return found;
      }
    }
    return null;
  }
  if (!isRecord(value)) {
    return null;
  }
  if (value["@type"] === "Hotel") {
    return value;
  }
  for (const child of Object.values(value)) {
    const found = findHotel(child);
    if (found) {
      return found;
    }
  }
  return null;
}

function readHotelRecord(html: string): Record<string, unknown> | null {
  const scripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g);
  for (const match of scripts) {
    const body = match[2]?.trim() ?? "";
    if (!body.includes("Hotel")) {
      continue;
    }
    if (!body.startsWith("{") && !body.startsWith("[")) {
      continue;
    }
    try {
      const found = findHotel(JSON.parse(body));
      if (found) {
        return found;
      }
    } catch {
      continue;
    }
  }
  return null;
}

function readImageSrc(value: unknown): string | null {
  if (typeof value === "string" && value.startsWith("https://")) {
    return value;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const src = readImageSrc(item);
      if (src) {
        return src;
      }
    }
  }
  return null;
}

function readAmenities(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const names = value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    const name = readString(item.name);
    return name ? [name] : [];
  });
  return [...new Set(names)].slice(0, 12);
}

function readPrice(value: unknown): {
  priceAmount: number | null;
  pricePeriod: "night" | "stay" | null;
} {
  const text = readString(value);
  const match = text?.match(/from\s+(\d+(?:\.\d+)?)\s+per\s+(night|stay)/i);
  if (!match) {
    return { priceAmount: null, pricePeriod: null };
  }
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) {
    return { priceAmount: null, pricePeriod: null };
  }
  return {
    priceAmount: amount,
    pricePeriod: match[2].toLowerCase() === "stay" ? "stay" : "night",
  };
}

function readClock(value: unknown): string | null {
  const text = readString(value);
  const match = text?.match(/^(\d{2}:\d{2})/);
  return match?.[1] ?? null;
}

function readProfile(html: string): AccommodationProfile | null {
  const hotel = readHotelRecord(html);
  const ogName = readOpenGraphTitle(html);
  if (!hotel && !ogName) {
    return null;
  }

  const address = hotel && isRecord(hotel.address) ? hotel.address : null;
  const aggregate =
    hotel && isRecord(hotel.aggregateRating) ? hotel.aggregateRating : null;
  const stars = hotel && isRecord(hotel.starRating) ? hotel.starRating : null;
  const ratingValue = readNumber(aggregate?.ratingValue);
  const starValue = readNumber(stars?.ratingValue);
  const price = readPrice(hotel?.priceRange);
  const name = readString(hotel?.name) ?? ogName;
  if (!name) {
    return null;
  }

  return {
    name,
    imageSrc: readImageSrc(hotel?.image),
    streetAddress: readString(address?.streetAddress),
    locality: readString(address?.addressLocality),
    postalCode: readString(address?.postalCode),
    country: readString(address?.addressCountry),
    stars: starValue !== null && starValue >= 1 && starValue <= 5 ? starValue : null,
    ratingValue,
    ratingCount: readNumber(aggregate?.ratingCount),
    ratingLabel: ratingValue === null ? null : ratingLabelFor(ratingValue),
    priceAmount: price.priceAmount,
    pricePeriod: price.pricePeriod,
    checkIn: readClock(hotel?.checkinTime),
    checkOut: readClock(hotel?.checkoutTime),
    summary: readString(hotel?.description),
    amenities: readAmenities(hotel?.amenityFeature),
  };
}

async function loadAccommodationProfile(
  ns: number,
  id: number,
): Promise<AccommodationProfile | null> {
  "use cache";

  const response = await fetch(
    `https://www.trivago.com/en-US/odr/?search=${ns}-${id}`,
    {
      headers: { "accept-language": "en-US,en;q=0.9" },
    },
  );

  if (!response.ok) {
    return null;
  }

  return readProfile(await response.text());
}

export async function fetchAccommodationProfile(
  nsid: Nsid,
): Promise<AccommodationProfile | null> {
  let profile: AccommodationProfile | null = null;
  try {
    profile = await loadAccommodationProfile(nsid.ns, nsid.id);
  } catch {
    profile = null;
  }

  return profile;
}
