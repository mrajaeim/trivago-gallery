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
import {
  interpretAccommodationImageCount,
  interpretAccommodationImages,
  type GalleryCountResult,
  type GalleryFailure,
  type GalleryImagesResult,
} from "@/lib/trivago/gallery-read";
import type { Nsid } from "@/lib/trivago/highlights";

export { decodeImageId, galleryImageUrl };
export type { Nsid };
export type { GalleryGroupCount } from "@/lib/trivago/gallery-shared";
export type {
  GalleryCountResult,
  GalleryFailure,
  GalleryImage,
  GalleryImagesResult,
} from "@/lib/trivago/gallery-read";

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
      reason: "upstream-error",
    };
  }

  if (ServerParseError.is(error)) {
    return {
      ok: false,
      status: error.statusCode,
      messages: ["The GraphQL response was not JSON."],
      reason: "upstream-error",
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
      reason: "upstream-error",
    };
  }

  const message =
    error instanceof Error ? error.message : "The GraphQL request failed.";
  return { ok: false, status: null, messages: [message], reason: "upstream-error" };
}

function responseStatus(data: unknown): number | null {
  return data && typeof data === "object" ? persistedDataStatus(data) : null;
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

      return interpretAccommodationImages(result.data, nsid, responseStatus(result.data));
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

      return interpretAccommodationImageCount(
        result.data,
        nsid,
        responseStatus(result.data),
      );
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
