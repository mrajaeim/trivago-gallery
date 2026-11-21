import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { GRAPHQL_ENDPOINT, GRAPHQL_HEADERS } from "@/lib/trivago/contract";
import { galleryImageUrl } from "@/lib/trivago/gallery-shared";
import type { Nsid } from "@/lib/trivago/highlights";

export type StayPeriod = "night" | "stay";

export type StructuredPrice = {
  amount: number;
  currency: string;
  period: StayPeriod;
};

export type ProfileFailureReason =
  | "not-found"
  | "timeout"
  | "upstream-error"
  | "invalid-response";

export type ProfileFailure = {
  ok: false;
  reason: ProfileFailureReason;
  retryable: boolean;
};

export type ProfileResult = { ok: true; data: AccommodationProfile } | ProfileFailure;

const PROFILE_FAILURE_MESSAGE =
  /^accommodation-profile:(not-found|timeout|upstream-error|invalid-response)$/;

export function profileFailure(reason: ProfileFailureReason): ProfileFailure {
  return {
    ok: false,
    reason,
    retryable: reason === "timeout" || reason === "upstream-error",
  };
}

export function classifyProfileHttpStatus(status: number): ProfileFailure {
  return profileFailure(status === 404 ? "not-found" : "upstream-error");
}

function isTimeoutError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

export function classifyProfileFailure(error: unknown): ProfileFailure {
  const message = error instanceof Error ? error.message : "";
  const match = PROFILE_FAILURE_MESSAGE.exec(message);
  if (match) {
    return profileFailure(match[1] as ProfileFailureReason);
  }
  if (isTimeoutError(error)) {
    return profileFailure("timeout");
  }
  return profileFailure("upstream-error");
}

function unavailable(reason: ProfileFailureReason): never {
  throw new Error(`accommodation-profile:${reason}`);
}

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

function searchParamValue(text: string): string | null {
  try {
    return new URL(text, "https://www.trivago.com").searchParams.get("search");
  } catch {
    return null;
  }
}

function identifiersFromHotel(hotel: Record<string, unknown>): string[] {
  const texts: string[] = [];
  collectIdentifierTexts(hotel["@id"], texts);
  collectIdentifierTexts(hotel.url, texts);
  collectIdentifierTexts(hotel.identifier, texts);
  collectIdentifierTexts(hotel.sameAs, texts);

  const identifiers: string[] = [];
  for (const text of texts) {
    const fromQuery = searchParamValue(text);
    const identifier = fromQuery ?? (/^\d+-\d+$/.test(text) ? text : null);
    if (identifier && !identifiers.includes(identifier)) {
      identifiers.push(identifier);
    }
  }
  return identifiers;
}

function hotelIdentifierKind(
  hotel: Record<string, unknown>,
  nsid: Nsid,
): "match" | "conflict" | "missing" {
  const identifiers = identifiersFromHotel(hotel);
  if (identifiers.length === 0) {
    return "missing";
  }
  return identifiers.includes(nsidToken(nsid)) ? "match" : "conflict";
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
  const kinds = distinct.map((hotel) => ({
    hotel,
    kind: hotelIdentifierKind(hotel, nsid),
  }));
  const matched = kinds.filter((item) => item.kind === "match").map((item) => item.hotel);
  const conflicts = kinds.filter((item) => item.kind === "conflict");
  const unlabeled = kinds.filter((item) => item.kind === "missing");
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
  if (conflicts.length > 0) {
    return null;
  }
  if (unlabeled.length === 1 && distinct.length === 1) {
    return unlabeled[0].hotel;
  }
  if (primary && unlabeled.some((item) => sameHotel(item.hotel, primary))) {
    return primary;
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
  if (!currency || !Number.isFinite(amount)) {
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

const COVER_IMAGE_WIDTH = 960;

const ACCOMMODATION_PROFILE_QUERY = `query accommodationProfile($input: AccommodationDetailsInput!) {
  getAccommodationDetails(input: $input) {
    accommodationDetails {
      nsid { ns id }
      translatedName { value }
      translatedDescription { value }
      mainImageObject { path }
      hotelClassification { rating }
      reviewRating { trivagoRating reviewsCount }
      checkInCheckOutHours { checkInHour checkOutHour }
      contactDetails { streetAddress postalCode }
      locality { translatedName { value } }
      country { translatedName { value } }
      topAmenities { translatedName { value } }
    }
  }
}`;

function translatedValue(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }
  return readString(value.value);
}

function clockFromHour(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 23) {
    return null;
  }
  return `${String(value).padStart(2, "0")}:00`;
}

function ratingFromThousandths(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  const rating = Math.round(value / 100) / 10;
  return rating >= 0 && rating <= 10 ? rating : null;
}

function readGraphqlAmenities(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const names = value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    const name = translatedValue(item.translatedName);
    return name ? [name] : [];
  });
  return [...new Set(names)].slice(0, 12);
}

function sameNsid(value: unknown, nsid: Nsid): boolean {
  return isRecord(value) && value.ns === nsid.ns && value.id === nsid.id;
}

export function readGraphqlProfile(
  payload: unknown,
  nsid: Nsid,
): AccommodationProfile | null {
  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    !isRecord(payload.data.getAccommodationDetails) ||
    !Array.isArray(payload.data.getAccommodationDetails.accommodationDetails)
  ) {
    return null;
  }

  const record = payload.data.getAccommodationDetails.accommodationDetails.find(
    (item) => isRecord(item) && sameNsid(item.nsid, nsid),
  );
  if (!isRecord(record)) {
    return null;
  }

  const name = translatedValue(record.translatedName);
  if (!name) {
    return null;
  }

  const contact = isRecord(record.contactDetails) ? record.contactDetails : null;
  const hours = isRecord(record.checkInCheckOutHours) ? record.checkInCheckOutHours : null;
  const classification = isRecord(record.hotelClassification) ? record.hotelClassification : null;
  const reviews = isRecord(record.reviewRating) ? record.reviewRating : null;
  const image = isRecord(record.mainImageObject) ? record.mainImageObject : null;
  const locality = isRecord(record.locality) ? record.locality : null;
  const country = isRecord(record.country) ? record.country : null;
  const stars = readNumber(classification?.rating);
  const ratingValue = ratingFromThousandths(reviews?.trivagoRating);
  const imagePath = readString(image?.path);

  return {
    name,
    imageSrc: imagePath ? galleryImageUrl(imagePath, COVER_IMAGE_WIDTH) : null,
    streetAddress: readString(contact?.streetAddress),
    locality: translatedValue(locality?.translatedName),
    postalCode: readString(contact?.postalCode),
    country: translatedValue(country?.translatedName),
    stars: stars !== null && stars >= 1 && stars <= 5 ? stars : null,
    ratingValue,
    ratingCount: readNumber(reviews?.reviewsCount),
    ratingLabel: ratingValue === null ? null : ratingLabelFor(ratingValue),
    price: null,
    priceText: null,
    checkIn: clockFromHour(hours?.checkInHour),
    checkOut: clockFromHour(hours?.checkOutHour),
    summary: translatedValue(record.translatedDescription),
    amenities: readGraphqlAmenities(record.topAmenities),
  };
}

function graphqlHasErrors(payload: unknown): boolean {
  return isRecord(payload) && Array.isArray(payload.errors) && payload.errors.length > 0;
}

async function loadAccommodationProfile(
  ns: number,
  id: number,
): Promise<AccommodationProfile> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 21600 });
  cacheTag(`accommodation-profile:${ns}:${id}`);

  let response: Response;
  try {
    response = await fetch(`${GRAPHQL_ENDPOINT}?accommodationProfile`, {
      method: "POST",
      cache: "no-store",
      headers: GRAPHQL_HEADERS,
      body: JSON.stringify({
        operationName: "accommodationProfile",
        query: ACCOMMODATION_PROFILE_QUERY,
        variables: { input: { nsids: [{ ns, id }] } },
      }),
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    unavailable(isTimeoutError(error) ? "timeout" : "upstream-error");
  }

  if (!response.ok) {
    unavailable(classifyProfileHttpStatus(response.status).reason);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    unavailable("invalid-response");
  }

  const profile = readGraphqlProfile(payload, { ns, id });
  if (!profile) {
    unavailable(graphqlHasErrors(payload) ? "upstream-error" : "invalid-response");
  }
  return profile;
}

export async function fetchAccommodationProfile(nsid: Nsid): Promise<ProfileResult> {
  // Postpone the cached read until a real request so next build does not call trivago.
  await connection();
  try {
    const data = await loadAccommodationProfile(nsid.ns, nsid.id);
    return { ok: true, data };
  } catch (error) {
    const result = classifyProfileFailure(error);
    console.error(
      `Accommodation profile ${nsid.ns}/${nsid.id} unavailable: ${result.reason}.`,
      error,
    );
    return result;
  }
}
