import {
  galleryImageUrl,
  type GalleryGroupCount,
  type ImageSize,
} from "@/lib/trivago/gallery-shared";
import type { Nsid } from "@/lib/trivago/highlights";

export type GalleryImage = {
  imageId: string;
  size: ImageSize | null;
  advertisers: string[];
  groups: Nsid[];
  srcTile: string | null;
  srcPhoto: string | null;
};

export type GalleryFailureReason = "not-found" | "invalid-response" | "upstream-error";

export type GalleryFailure = {
  ok: false;
  status: number | null;
  messages: string[];
  reason: GalleryFailureReason;
};

export type GalleryImagesResult =
  | { ok: true; images: GalleryImage[] }
  | GalleryFailure;

export type GalleryCountResult =
  | { ok: true; totalImageCount: number; groups: GalleryGroupCount[] }
  | GalleryFailure;

type DecodedImage = {
  imageId: string;
  urlTail: string;
  size: ImageSize | null;
  advertisers: string[];
  groups: Nsid[];
};

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

function readImageSize(value: Record<string, unknown>): ImageSize | null {
  const width = readPositiveNumber(value.width);
  const height = readPositiveNumber(value.height);
  if (width === null || height === null) {
    return null;
  }

  return { width, height };
}

function readImage(value: unknown): DecodedImage | null {
  if (!isRecord(value)) {
    return null;
  }

  const imageId = readString(value.imageId);
  const urlTail = readString(value.urlTail);
  if (!imageId || !urlTail) {
    return null;
  }

  return {
    imageId,
    urlTail,
    size: readImageSize(value),
    advertisers: readAdvertisers(value.source),
    groups: readGroups(value.tagGroupings),
  };
}

function toGalleryImage(image: DecodedImage): GalleryImage {
  return {
    imageId: image.imageId,
    size: image.size,
    advertisers: image.advertisers,
    groups: image.groups,
    srcTile: galleryImageUrl(image.urlTail, 480),
    srcPhoto: galleryImageUrl(image.urlTail, 1600),
  };
}

type AccommodationMatch =
  | { kind: "invalid" }
  | { kind: "not-found" }
  | { kind: "record"; record: Record<string, unknown> };

function matchAccommodation(payload: unknown, nsid: Nsid): AccommodationMatch {
  if (
    !isRecord(payload) ||
    !isRecord(payload.getAccommodationDetails) ||
    !Array.isArray(payload.getAccommodationDetails.accommodationDetails)
  ) {
    return { kind: "invalid" };
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

  return isRecord(record) ? { kind: "record", record } : { kind: "not-found" };
}

function notFound(nsid: Nsid, status: number | null): GalleryFailure {
  return {
    ok: false,
    status,
    messages: [`No accommodation record matched ns ${nsid.ns} id ${nsid.id}.`],
    reason: "not-found",
  };
}

function invalid(message: string, status: number | null): GalleryFailure {
  return {
    ok: false,
    status,
    messages: [message],
    reason: "invalid-response",
  };
}

export function interpretAccommodationImages(
  payload: unknown,
  nsid: Nsid,
  status: number | null,
): GalleryImagesResult {
  const match = matchAccommodation(payload, nsid);
  if (match.kind === "invalid") {
    return invalid(
      "The gallery response did not include an accommodation list.",
      status,
    );
  }
  if (match.kind === "not-found") {
    return notFound(nsid, status);
  }

  const gallery = isRecord(match.record.imageGallery) ? match.record.imageGallery : null;
  if (!gallery || !Array.isArray(gallery.images)) {
    return invalid("The image list was missing or malformed.", status);
  }

  const decoded = gallery.images.flatMap((item) => {
    const image = readImage(item);
    return image ? [image] : [];
  });
  if (gallery.images.length > 0 && decoded.length === 0) {
    return invalid("The image list did not include a usable photo.", status);
  }

  return { ok: true, images: decoded.map(toGalleryImage) };
}

export function interpretAccommodationImageCount(
  payload: unknown,
  nsid: Nsid,
  status: number | null,
): GalleryCountResult {
  const match = matchAccommodation(payload, nsid);
  if (match.kind === "invalid") {
    return invalid(
      "The gallery response did not include an accommodation list.",
      status,
    );
  }
  if (match.kind === "not-found") {
    return notFound(nsid, status);
  }

  const gallery = isRecord(match.record.imageGallery) ? match.record.imageGallery : null;
  if (!gallery || typeof gallery.totalImageCount !== "number" || !Number.isFinite(gallery.totalImageCount)) {
    return invalid("The image count was missing or malformed.", status);
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

  return { ok: true, totalImageCount: gallery.totalImageCount, groups };
}
