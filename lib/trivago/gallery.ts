import { cache } from "react";
import { gql } from "@apollo/client";
import {
  CombinedGraphQLErrors,
  ServerError,
  ServerParseError,
} from "@apollo/client/errors";
import {
  persistedDataStatus,
  persistedQueryStatus,
  query,
  registerPersistedQuery,
} from "@/lib/trivago/apollo";
import {
  accommodationPath as accommodationPathFor,
  decodeImageId,
  galleryImageUrl,
  groupTitles,
  photoPath as photoPathFor,
} from "@/lib/trivago/gallery-shared";

export { decodeImageId };

export { galleryImageUrl };
import type { Nsid } from "@/lib/trivago/highlights";

export type { Nsid };

const IMAGE_COUNT_HASH =
  "536f8958d182a7c687e71559bbb6cae355055eecc2ea674462ef3ab6153d7e5d";
const IMAGES_HASH =
  "3da52f51046422bee84392c53549dc213967f2017ebd16cd52e7346204db6793";

const accommodationImageCount = gql`
  query accommodationImageCount {
    __typename
  }
`;

const accommodationImages = gql`
  query accommodationImages {
    __typename
  }
`;

registerPersistedQuery(accommodationImageCount, IMAGE_COUNT_HASH);
registerPersistedQuery(accommodationImages, IMAGES_HASH);

const IMAGES_PAGINATION = { offset: 0, limit: 150 } as const;

const CONTEXT_AWARE_CONTENT = {
  rooms: [{ adults: 2, children: [] as number[] }],
  stayPeriod: {
    arrival: "2026-12-06",
    departure: "2026-12-08",
  },
  uiv: [
    { nsid: { ns: 100, id: 102762 } },
    { nsid: { ns: 200, id: 42362 } },
  ],
};

export type GalleryGroupCount = {
  ns: number;
  id: number;
  imageCount: number;
};

export type GalleryImage = {
  imageId: string;
  width: number;
  height: number;
  advertisers: string[];
  groups: Nsid[];
  srcTile: string | null;
  srcPhoto: string | null;
};

export type GalleryFailure = {
  ok: false;
  status: number | null;
  messages: string[];
  reason: "missing" | "error";
};

export type GalleryImagesResult =
  | { ok: true; images: GalleryImage[] }
  | GalleryFailure;

export type GalleryCountResult =
  | { ok: true; totalImageCount: number; groups: GalleryGroupCount[] }
  | GalleryFailure;

type ImagesVariables = {
  getAccommodationDetailsInput: { nsids: Nsid[] };
  imagesPagination: { offset: number; limit: number };
  includeTags: boolean;
  includeSize: boolean;
  contextAwareContent: typeof CONTEXT_AWARE_CONTENT;
};

type CountVariables = {
  getAccommodationDetailsInput: { nsids: Nsid[] };
  imagesPagination: { offset: number; limit: number };
};

export function readRouteNsid(ns: string, id: string): Nsid | null {
  if (!/^[0-9]+$/.test(ns) || !/^[0-9]+$/.test(id)) {
    return null;
  }

  const nsNumber = Number(ns);
  const idNumber = Number(id);
  if (!Number.isSafeInteger(nsNumber) || !Number.isSafeInteger(idNumber)) {
    return null;
  }

  return { ns: nsNumber, id: idNumber };
}

export function photoDocumentTitle(
  ns: string,
  id: string,
  imageId: string,
): string {
  const decoded = decodeImageId(imageId) ?? imageId;
  return `Photo ${decoded} · Accommodation ${ns}/${id}`;
}

export async function photoPageTitle(
  ns: string,
  id: string,
  imageId: string,
): Promise<string> {
  const fallback = photoDocumentTitle(ns, id, imageId);
  const nsid = readRouteNsid(ns, id);
  const decoded = decodeImageId(imageId);
  if (!nsid || !decoded) {
    return fallback;
  }

  const result = await fetchAccommodationImages(nsid);
  if (!result.ok) {
    return fallback;
  }

  const image = result.images.find((item) => item.imageId === decoded);
  const titles = image ? groupTitles(image.groups) : [];
  if (titles.length === 0) {
    return fallback;
  }

  return `${titles.join(", ")} · Accommodation ${nsid.ns}/${nsid.id}`;
}

export function accommodationPath(nsid: Nsid): string {
  return accommodationPathFor(nsid.ns, nsid.id);
}

export function photoPath(nsid: Nsid, imageId: string): string {
  return photoPathFor(nsid.ns, nsid.id, imageId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNsidValue(value: unknown): Nsid | null {
  if (
    !isRecord(value) ||
    typeof value.ns !== "number" ||
    typeof value.id !== "number" ||
    !Number.isSafeInteger(value.ns) ||
    !Number.isSafeInteger(value.id)
  ) {
    return null;
  }

  return { ns: value.ns, id: value.id };
}

function readPositiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function sameNsid(left: Nsid, right: Nsid): boolean {
  return left.ns === right.ns && left.id === right.id;
}

function readAdvertisers(source: unknown): string[] {
  if (!isRecord(source) || !Array.isArray(source.advertisers)) {
    return [];
  }

  return source.advertisers.flatMap((advertiser) => {
    if (!isRecord(advertiser) || !isRecord(advertiser.translatedName)) {
      return [];
    }
    const name = readString(advertiser.translatedName.value);
    return name ? [name] : [];
  });
}

function readGroups(value: unknown): Nsid[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((grouping) => {
    if (!isRecord(grouping)) {
      return [];
    }
    const groupTag = isRecord(grouping.groupTag) ? grouping.groupTag : null;
    const nsid = groupTag ? readNsidValue(groupTag.nsid) : null;
    return nsid ? [nsid] : [];
  });
}

function readImage(value: unknown): {
  imageId: string;
  urlTail: string;
  width: number;
  height: number;
  advertisers: string[];
  groups: Nsid[];
} | null {
  if (!isRecord(value)) {
    return null;
  }

  const imageId = readString(value.imageId);
  const urlTail = readString(value.urlTail);
  if (!imageId || !urlTail) {
    return null;
  }

  const width = readPositiveNumber(value.width);
  const height = readPositiveNumber(value.height);

  return {
    imageId,
    urlTail,
    width: width ?? 4,
    height: height ?? 3,
    advertisers: readAdvertisers(value.source),
    groups: readGroups(value.tagGroupings),
  };
}

function findDetails(
  payload: unknown,
  nsid: Nsid,
): Record<string, unknown> | null {
  if (
    !isRecord(payload) ||
    !isRecord(payload.getAccommodationDetails) ||
    !Array.isArray(payload.getAccommodationDetails.accommodationDetails)
  ) {
    return null;
  }

  const record = payload.getAccommodationDetails.accommodationDetails.find(
    (item) => {
      if (!isRecord(item)) {
        return false;
      }
      const itemNsid = readNsidValue(item.nsid);
      return itemNsid !== null && sameNsid(itemNsid, nsid);
    },
  );

  return isRecord(record) ? record : null;
}

function readImages(payload: unknown, nsid: Nsid): {
  matched: boolean;
  images: ReturnType<typeof readImage>[];
} {
  const record = findDetails(payload, nsid);
  if (!isRecord(record)) {
    return { matched: false, images: [] };
  }

  const gallery = isRecord(record.imageGallery) ? record.imageGallery : null;
  const images = gallery && Array.isArray(gallery.images) ? gallery.images : null;
  if (!images) {
    return { matched: true, images: [] };
  }

  return {
    matched: true,
    images: images.map((item) => readImage(item)),
  };
}

function readCount(payload: unknown, nsid: Nsid): {
  matched: boolean;
  totalImageCount: number | null;
  groups: GalleryGroupCount[];
} {
  const record = findDetails(payload, nsid);
  if (!isRecord(record)) {
    return { matched: false, totalImageCount: null, groups: [] };
  }

  const gallery = isRecord(record.imageGallery) ? record.imageGallery : null;
  if (!gallery || typeof gallery.totalImageCount !== "number") {
    return { matched: true, totalImageCount: null, groups: [] };
  }

  const groups = Array.isArray(gallery.imageCountsByGroupTag)
    ? gallery.imageCountsByGroupTag.flatMap((item) => {
        if (!isRecord(item) || typeof item.imageCount !== "number" || !isRecord(item.tag)) {
          return [];
        }
        const tag = readNsidValue(item.tag.nsid);
        if (!tag) {
          return [];
        }
        return [{ ns: tag.ns, id: tag.id, imageCount: item.imageCount }];
      })
    : [];

  return { matched: true, totalImageCount: gallery.totalImageCount, groups };
}

function graphqlMessages(payload: unknown): string[] {
  if (!isRecord(payload) || !Array.isArray(payload.errors)) {
    return [];
  }

  return payload.errors.flatMap((error) => {
    if (!isRecord(error) || typeof error.message !== "string" || !error.message) {
      return [];
    }
    return [error.message];
  });
}

function messagesFromBody(bodyText: string): string[] {
  try {
    return graphqlMessages(JSON.parse(bodyText));
  } catch {
    return [];
  }
}

function failure(error: unknown): GalleryFailure {
  if (CombinedGraphQLErrors.is(error)) {
    const messages = error.errors.flatMap((graphQLError) =>
      graphQLError.message ? [graphQLError.message] : [],
    );
    return {
      ok: false,
      status: persistedQueryStatus(error.errors),
      messages: messages.length > 0 ? messages : [error.message],
      reason: "error",
    };
  }

  if (ServerParseError.is(error)) {
    return {
      ok: false,
      status: error.statusCode,
      messages: ["The GraphQL response was not JSON."],
      reason: "error",
    };
  }

  if (ServerError.is(error)) {
    const messages = messagesFromBody(error.bodyText);
    return {
      ok: false,
      status: error.statusCode,
      messages:
        messages.length > 0
          ? messages
          : [`GraphQL HTTP error: ${error.statusCode}`],
      reason: "error",
    };
  }

  const message =
    error instanceof Error ? error.message : "The GraphQL request failed.";
  return { ok: false, status: null, messages: [message], reason: "error" };
}

function missing(nsid: Nsid, status: number | null): GalleryFailure {
  return {
    ok: false,
    status,
    messages: [`No accommodation record matched ns ${nsid.ns} id ${nsid.id}.`],
    reason: "missing",
  };
}

const probeImageUrl = cache(async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const type = response.headers.get("content-type") ?? "";
    return response.ok && type.startsWith("image/");
  } catch {
    return false;
  }
});

async function withSources(
  images: Array<NonNullable<ReturnType<typeof readImage>>>,
): Promise<GalleryImage[]> {
  const candidate = images
    .map((image) => galleryImageUrl(image.urlTail, 480))
    .find((url): url is string => url !== null);
  const usable = candidate ? await probeImageUrl(candidate) : false;

  return images.map((image) => ({
    imageId: image.imageId,
    width: image.width,
    height: image.height,
    advertisers: image.advertisers,
    groups: image.groups,
    srcTile: usable ? galleryImageUrl(image.urlTail, 480) : null,
    srcPhoto: usable ? galleryImageUrl(image.urlTail, 1600) : null,
  }));
}

const loadAccommodationImages = cache(
  async (ns: number, id: number): Promise<GalleryImagesResult> => {
    const nsid = { ns, id };
    const variables: ImagesVariables = {
      getAccommodationDetailsInput: { nsids: [nsid] },
      imagesPagination: IMAGES_PAGINATION,
      includeTags: true,
      includeSize: true,
      contextAwareContent: CONTEXT_AWARE_CONTENT,
    };

    try {
      const result = await query<Record<string, unknown>, ImagesVariables>({
        query: accommodationImages,
        variables,
        fetchPolicy: "no-cache",
        errorPolicy: "none",
      });

      const { matched, images } = readImages(result.data, nsid);
      if (!matched) {
        return missing(
          nsid,
          result.data ? persistedDataStatus(result.data) : null,
        );
      }

      return {
        ok: true,
        images: await withSources(
          images.flatMap((image) => (image ? [image] : [])),
        ),
      };
    } catch (error) {
      return failure(error);
    }
  },
);

const loadAccommodationImageCount = cache(
  async (ns: number, id: number): Promise<GalleryCountResult> => {
    const nsid = { ns, id };
    const variables: CountVariables = {
      getAccommodationDetailsInput: { nsids: [nsid] },
      imagesPagination: IMAGES_PAGINATION,
    };

    try {
      const result = await query<Record<string, unknown>, CountVariables>({
        query: accommodationImageCount,
        variables,
        fetchPolicy: "no-cache",
        errorPolicy: "none",
      });

      const { matched, totalImageCount, groups } = readCount(result.data, nsid);
      if (!matched || totalImageCount === null) {
        return missing(
          nsid,
          result.data ? persistedDataStatus(result.data) : null,
        );
      }

      return { ok: true, totalImageCount, groups };
    } catch (error) {
      return failure(error);
    }
  },
);

export function fetchAccommodationImages(nsid: Nsid): Promise<GalleryImagesResult> {
  return loadAccommodationImages(nsid.ns, nsid.id);
}

export function fetchAccommodationImageCount(
  nsid: Nsid,
): Promise<GalleryCountResult> {
  return loadAccommodationImageCount(nsid.ns, nsid.id);
}
