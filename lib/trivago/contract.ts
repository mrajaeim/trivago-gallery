import type { Nsid } from "@/lib/trivago/highlights";

/**
 * Persisted-query protocol for the undocumented trivago GraphQL endpoint.
 * The documents in this repo are placeholders. trivago runs the selection set
 * identified by these hashes.
 */
export const GRAPHQL_ENDPOINT = "https://www.trivago.com/graphql";

export const PERSISTED_QUERY = {
  accommodationImageCount:
    "536f8958d182a7c687e71559bbb6cae355055eecc2ea674462ef3ab6153d7e5d",
  accommodationImages:
    "3da52f51046422bee84392c53549dc213967f2017ebd16cd52e7346204db6793",
  accommodationHighlights:
    "4d93d4800f355fb4db2de6239b428ba5ff9896daacfc60a63212b9ab96753ac3",
} as const;

export const GRAPHQL_HEADERS = {
  accept: "application/graphql-response+json, application/json",
  "content-type": "application/json",
  "accept-language": "en-US,en;q=0.9",
  "apollographql-client-name": "hs-web-app",
  "apollographql-client-version": "02521e02",
  "x-trv-app-id": "HS_WEB_APP_WARP",
  "x-trv-currency": "USD",
  "x-trv-language": "en-US",
  "x-trv-platform": "us",
} as const;

/**
 * Fixed ids the images persisted query requires inside `contextAwareContent`.
 * They are not the accommodation being viewed. 100/102762 is also the sample
 * stay used on the home page; 200/42362 is only a compatibility value.
 */
const COMPATIBILITY_UIV = [
  { nsid: { ns: 100, id: 102762 } },
  { nsid: { ns: 200, id: 42362 } },
] as const;

const STAY_LEAD_DAYS = 30;
const STAY_NIGHTS = 2;
const IMAGES_PAGE = { offset: 0, limit: 150 } as const;

export type CompatibilityContext = {
  rooms: { adults: number; children: number[] }[];
  stayPeriod: { arrival: string; departure: string };
  uiv: { nsid: Nsid }[];
};

export type ImagesQueryVariables = {
  getAccommodationDetailsInput: { nsids: Nsid[] };
  imagesPagination: { offset: number; limit: number };
  includeTags: boolean;
  includeSize: boolean;
  contextAwareContent: CompatibilityContext;
};

function utcDay(now: Date, extraDays: number): string {
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + extraDays),
  );
  return date.toISOString().slice(0, 10);
}

/**
 * Compatibility payload for the images persisted query. The stay is a rolling
 * UTC window so the dates do not become historical. It is not a user search.
 */
export function compatibilityContext(now: Date): CompatibilityContext {
  return {
    rooms: [{ adults: 2, children: [] }],
    stayPeriod: {
      arrival: utcDay(now, STAY_LEAD_DAYS),
      departure: utcDay(now, STAY_LEAD_DAYS + STAY_NIGHTS),
    },
    uiv: COMPATIBILITY_UIV.map((entry) => ({
      nsid: { ns: entry.nsid.ns, id: entry.nsid.id },
    })),
  };
}

export function imagesQueryVariables(nsid: Nsid, now: Date): ImagesQueryVariables {
  return {
    getAccommodationDetailsInput: { nsids: [{ ns: nsid.ns, id: nsid.id }] },
    imagesPagination: { offset: IMAGES_PAGE.offset, limit: IMAGES_PAGE.limit },
    includeTags: true,
    includeSize: true,
    contextAwareContent: compatibilityContext(now),
  };
}
