import type { Nsid } from "@/lib/trivago/highlights";

export type StayPeriod = "night" | "stay";

export type StructuredPrice = {
  amount: number;
  currency: string;
  period: StayPeriod;
};

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
  price: StructuredPrice | null;
  priceText: string | null;
  checkIn: string | null;
  checkOut: string | null;
  summary: string | null;
  amenities: string[];
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  $: "USD",
  "€": "EUR",
  "£": "GBP",
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

function typeIncludesHotel(value: unknown): boolean {
  if (value === "Hotel") {
    return true;
  }
  return Array.isArray(value) && value.includes("Hotel");
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

export function emptyAccommodationProfile(name: string): AccommodationProfile {
  return {
    name,
    imageSrc: null,
    streetAddress: null,
    locality: null,
    postalCode: null,
    country: null,
    stars: null,
    ratingValue: null,
    ratingCount: null,
    ratingLabel: null,
    price: null,
    priceText: null,
    checkIn: null,
    checkOut: null,
    summary: null,
    amenities: [],
  };
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

function collectHotels(value: unknown, found: Record<string, unknown>[]): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectHotels(item, found);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  if (typeIncludesHotel(value["@type"])) {
    found.push(value);
  }
  for (const child of Object.values(value)) {
    collectHotels(child, found);
  }
}

function collectJsonDocuments(html: string): unknown[] {
  const documents: unknown[] = [];
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
      documents.push(JSON.parse(body));
    } catch {
      continue;
    }
  }
  return documents;
}

function collectIdentifierTexts(value: unknown, texts: string[]): void {
  if (typeof value === "string" && value.trim()) {
    texts.push(value.trim());
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectIdentifierTexts(item, texts);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  collectIdentifierTexts(value["@id"], texts);
  collectIdentifierTexts(value.url, texts);
  collectIdentifierTexts(value.sameAs, texts);
  collectIdentifierTexts(value.identifier, texts);
  collectIdentifierTexts(value.value, texts);
}

function nsidToken(nsid: Nsid): string {
  return `${nsid.ns}-${nsid.id}`;
}

function hotelMatchesNsid(hotel: Record<string, unknown>, nsid: Nsid): boolean {
  const token = nsidToken(nsid);
  const texts: string[] = [];
  collectIdentifierTexts(hotel["@id"], texts);
  collectIdentifierTexts(hotel.url, texts);
  collectIdentifierTexts(hotel.identifier, texts);
  collectIdentifierTexts(hotel.sameAs, texts);
  return texts.some(
    (text) =>
      text.includes(`search=${token}`) ||
      new RegExp(`(?:^|[^0-9])${token}(?:[^0-9]|$)`).test(text),
  );
}

function sameHotel(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): boolean {
  const leftUrl = readString(left.url);
  const rightUrl = readString(right.url);
  if (leftUrl && rightUrl) {
    return leftUrl === rightUrl;
  }
  const leftName = readString(left.name);
  const rightName = readString(right.name);
  return leftName !== null && leftName === rightName;
}

function readPrimaryHotel(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = readPrimaryHotel(item);
      if (found) {
        return found;
      }
    }
    return null;
  }
  if (!isRecord(value)) {
    return null;
  }
  const type = value["@type"];
  const isWebPage =
    type === "WebPage" || (Array.isArray(type) && type.includes("WebPage"));
  if (isWebPage && isRecord(value.mainEntity) && typeIncludesHotel(value.mainEntity["@type"])) {
    return value.mainEntity;
  }
  if (value["@graph"]) {
    return readPrimaryHotel(value["@graph"]);
  }
  return null;
}

function uniqueHotels(hotels: Record<string, unknown>[]): Record<string, unknown>[] {
  const unique: Record<string, unknown>[] = [];
  for (const hotel of hotels) {
    if (!unique.some((existing) => sameHotel(existing, hotel))) {
      unique.push(hotel);
    }
  }
  return unique;
}

function selectHotel(
  documents: unknown[],
  nsid: Nsid,
): Record<string, unknown> | null {
  const hotels: Record<string, unknown>[] = [];
  for (const document of documents) {
    collectHotels(document, hotels);
  }
  const distinct = uniqueHotels(hotels);

  const matched = distinct.filter((hotel) => hotelMatchesNsid(hotel, nsid));
  const primary = documents
    .map((document) => readPrimaryHotel(document))
    .find((hotel): hotel is Record<string, unknown> => hotel !== null);

  if (matched.length === 1) {
    return matched[0];
  }
  if (matched.length > 1) {
    if (primary) {
      const primaryMatch = matched.find((hotel) => sameHotel(hotel, primary));
      if (primaryMatch) {
        return primaryMatch;
      }
    }
    return null;
  }
  if (distinct.length === 1) {
    return distinct[0];
  }
  if (primary && distinct.some((hotel) => sameHotel(hotel, primary))) {
    return hotelMatchesNsid(primary, nsid) ? primary : null;
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

function amenityIsOffered(item: Record<string, unknown>): boolean {
  if (!("value" in item)) {
    return true;
  }
  if (item.value === false) {
    return false;
  }
  if (item.value === true) {
    return true;
  }
  if (typeof item.value === "string" && item.value.trim().toLowerCase() === "false") {
    return false;
  }
  return true;
}

function readAmenities(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const names = value.flatMap((item) => {
    if (!isRecord(item) || !amenityIsOffered(item)) {
      return [];
    }
    const name = readString(item.name);
    return name ? [name] : [];
  });
  return [...new Set(names)].slice(0, 12);
}

function readCurrencyCode(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const symbol = CURRENCY_SYMBOLS[value];
  if (symbol) {
    return symbol;
  }
  return /^[A-Z]{3}$/i.test(value) ? value.toUpperCase() : null;
}

function readPrice(value: unknown): {
  price: StructuredPrice | null;
  priceText: string | null;
} {
  const text = readString(value);
  if (!text) {
    return { price: null, priceText: null };
  }

  const match = text.match(
    /^from\s+(?:([€$£]|[A-Z]{3})\s*)?(\d+(?:\.\d+)?)\s*(?:([A-Z]{3})\s+)?per\s+(night|stay)$/i,
  );
  if (!match) {
    return { price: null, priceText: text };
  }

  const amount = Number(match[2]);
  const period: StayPeriod = match[4].toLowerCase() === "stay" ? "stay" : "night";
  const currency = readCurrencyCode(match[1]) ?? readCurrencyCode(match[3]);
  if (!Number.isFinite(amount) || !currency) {
    return { price: null, priceText: text };
  }

  return {
    price: { amount, currency, period },
    priceText: text,
  };
}

function readClock(value: unknown): string | null {
  const text = readString(value);
  const match = text?.match(/^(\d{2}:\d{2})/);
  return match?.[1] ?? null;
}

function profileFromHotel(hotel: Record<string, unknown>, name: string): AccommodationProfile {
  const address = isRecord(hotel.address) ? hotel.address : null;
  const aggregate = isRecord(hotel.aggregateRating) ? hotel.aggregateRating : null;
  const stars = isRecord(hotel.starRating) ? hotel.starRating : null;
  const ratingValue = readNumber(aggregate?.ratingValue);
  const starValue = readNumber(stars?.ratingValue);
  const parsedPrice = readPrice(hotel.priceRange);

  return {
    name,
    imageSrc: readImageSrc(hotel.image),
    streetAddress: readString(address?.streetAddress),
    locality: readString(address?.addressLocality),
    postalCode: readString(address?.postalCode),
    country: readString(address?.addressCountry),
    stars: starValue !== null && starValue >= 1 && starValue <= 5 ? starValue : null,
    ratingValue,
    ratingCount: readNumber(aggregate?.ratingCount),
    ratingLabel: ratingValue === null ? null : ratingLabelFor(ratingValue),
    price: parsedPrice.price,
    priceText: parsedPrice.priceText,
    checkIn: readClock(hotel.checkinTime),
    checkOut: readClock(hotel.checkoutTime),
    summary: readString(hotel.description),
    amenities: readAmenities(hotel.amenityFeature),
  };
}

export function readProfile(html: string, nsid: Nsid): AccommodationProfile | null {
  const hotel = selectHotel(collectJsonDocuments(html), nsid);
  const ogName = readOpenGraphTitle(html);
  const name = readString(hotel?.name) ?? ogName;
  if (!name) {
    return null;
  }
  if (!hotel) {
    return emptyAccommodationProfile(name);
  }
  return profileFromHotel(hotel, name);
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
    throw new Error(`Accommodation profile request failed (${response.status}).`);
  }

  return readProfile(await response.text(), { ns, id });
}

export async function fetchAccommodationProfile(
  nsid: Nsid,
): Promise<AccommodationProfile | null> {
  try {
    return await loadAccommodationProfile(nsid.ns, nsid.id);
  } catch {
    return null;
  }
}
