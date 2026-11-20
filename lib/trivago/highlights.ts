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
import { galleryImageUrl } from "@/lib/trivago/gallery-shared";

// Placeholder selection set. The registered hash is the query trivago runs.
export const accommodationHighlights = gql`
  query accommodationHighlights {
    __typename
  }
`;

registerPersistedQuery(
  accommodationHighlights,
  "4d93d4800f355fb4db2de6239b428ba5ff9896daacfc60a63212b9ab96753ac3",
);

export type Nsid = {
  ns: number;
  id: number;
};

export const SAMPLE_ACCOMMODATION: Nsid = { ns: 100, id: 102762 };

export type NameConceptReference = {
  nameConcept: {
    nsid: Nsid;
  };
};

export type HighlightSentiment = "POSITIVE" | "NEGATIVE" | (string & {});

export interface HighlightImage {
  imageId: string;
  urlTail: string;
  tagGroupings: Array<{
    groupTag: { nsid: Nsid } | null;
  }>;
}

export interface AccommodationHighlight {
  id: string;
  title: string;
  description: string;
  sentiment: HighlightSentiment;
  primaryThemeConcept: NameConceptReference;
  primarySubThemeConcept: NameConceptReference;
  themeConcepts: NameConceptReference[];
  subThemeConcepts: NameConceptReference[];
  visualInfo: { image: HighlightImage } | null;
  scoredAspectThemes: null | unknown;
}

export interface AccommodationHighlightsRecord {
  nsid: Nsid;
  highlights: {
    aiGenerated: AccommodationHighlight[];
  };
  badges: null | unknown;
}

export interface AccommodationHighlightsData {
  getAccommodationDetails?: {
    accommodationDetails: AccommodationHighlightsRecord[];
  } | null;
}

export interface AccommodationHighlightsVariables {
  getAccommodationDetailsInput: { nsids: Nsid[] };
  aiGeneratedInput: { sorting: { searchConcepts: unknown[] } };
  includeExtendedFields: boolean;
  includeRelativeScore: boolean;
  includeRatingInfo: boolean;
}

export type HighlightView = {
  id: string;
  title: string;
  description: string;
  sentiment: HighlightSentiment;
  imageSrc: string | null;
};

export type HighlightsResult =
  | { ok: true; highlights: HighlightView[] }
  | { ok: false; status: number | null; messages: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readImageSrc(highlight: Record<string, unknown>): string | null {
  if (!isRecord(highlight.visualInfo) || !isRecord(highlight.visualInfo.image)) {
    return null;
  }
  const urlTail = readString(highlight.visualInfo.image.urlTail);
  return urlTail ? galleryImageUrl(urlTail, 800) : null;
}

function readHighlight(value: unknown): HighlightView | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const title = readString(value.title);
  const description = readString(value.description);
  const sentiment = readString(value.sentiment);
  if (!id || !title || !description || !sentiment) {
    return null;
  }

  return {
    id,
    title,
    description,
    sentiment,
    imageSrc: readImageSrc(value),
  };
}

function readMatchingHighlights(
  payload: unknown,
  nsid: Nsid,
): { matched: boolean; highlights: HighlightView[] } {
  if (
    !isRecord(payload) ||
    !isRecord(payload.getAccommodationDetails) ||
    !Array.isArray(payload.getAccommodationDetails.accommodationDetails)
  ) {
    return { matched: false, highlights: [] };
  }

  const record = payload.getAccommodationDetails.accommodationDetails.find(
    (item) =>
      isRecord(item) &&
      isRecord(item.nsid) &&
      item.nsid.ns === nsid.ns &&
      item.nsid.id === nsid.id,
  );

  if (!isRecord(record)) {
    return { matched: false, highlights: [] };
  }

  const highlights = isRecord(record.highlights) ? record.highlights : null;
  const generated = highlights ? highlights.aiGenerated : null;
  if (!Array.isArray(generated)) {
    return { matched: true, highlights: [] };
  }

  return {
    matched: true,
    highlights: generated.flatMap((item) => {
      const highlight = readHighlight(item);
      return highlight ? [highlight] : [];
    }),
  };
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

function failure(error: unknown): HighlightsResult {
  if (CombinedGraphQLErrors.is(error)) {
    const messages = error.errors.flatMap((graphQLError) =>
      graphQLError.message ? [graphQLError.message] : [],
    );
    return {
      ok: false,
      status: persistedQueryStatus(error.errors),
      messages: messages.length > 0 ? messages : [error.message],
    };
  }

  if (ServerParseError.is(error)) {
    return {
      ok: false,
      status: error.statusCode,
      messages: ["The GraphQL response was not JSON."],
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
    };
  }

  const message =
    error instanceof Error ? error.message : "The GraphQL request failed.";
  return { ok: false, status: null, messages: [message] };
}

export async function fetchAccommodationHighlights(
  nsid: Nsid,
): Promise<HighlightsResult> {
  const variables: AccommodationHighlightsVariables = {
    getAccommodationDetailsInput: { nsids: [nsid] },
    aiGeneratedInput: { sorting: { searchConcepts: [] } },
    includeExtendedFields: true,
    includeRelativeScore: true,
    includeRatingInfo: false,
  };

  try {
    const result = await query<
      AccommodationHighlightsData,
      AccommodationHighlightsVariables
    >({
      query: accommodationHighlights,
      variables,
      fetchPolicy: "no-cache",
      errorPolicy: "none",
    });

    const { matched, highlights } = readMatchingHighlights(result.data, nsid);
    if (!matched) {
      return {
        ok: false,
        status: result.data ? persistedDataStatus(result.data) : null,
        messages: [
          `No accommodation record matched ns ${nsid.ns} id ${nsid.id}.`,
        ],
      };
    }

    return { ok: true, highlights };
  } catch (error) {
    return failure(error);
  }
}
